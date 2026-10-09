import { HopInfo, RedirectHopAnalysis } from '../engine/types';
import { validateUrlForSsrf } from './ssrf';

export async function traceRedirectChain(
  initialUrl: string,
  maxHops = 5
): Promise<RedirectHopAnalysis> {
  const hops: HopInfo[] = [];
  let currentUrl = initialUrl;
  const visitedUrls = new Set<string>();

  for (let hop = 1; hop <= maxHops; hop++) {
    // 1. SSRF check
    const ssrfCheck = await validateUrlForSsrf(currentUrl);
    if (!ssrfCheck.safe) {
      hops.push({
        hopNumber: hop,
        url: currentUrl,
        statusCode: 403,
        statusText: 'Forbidden - SSRF Protection',
        ip: ssrfCheck.resolvedIp,
        isPrivateIp: true,
        error: ssrfCheck.reason,
      });
      return {
        hops,
        finalUrl: currentUrl,
        hasRedirectLoop: false,
        blockedForSsrf: true,
        error: ssrfCheck.reason,
      };
    }

    if (visitedUrls.has(currentUrl)) {
      hops.push({
        hopNumber: hop,
        url: currentUrl,
        statusCode: 310,
        statusText: 'Redirect Loop Detected',
        ip: ssrfCheck.resolvedIp,
        error: `Redirect loop detected at ${currentUrl}`,
      });
      return {
        hops,
        finalUrl: currentUrl,
        hasRedirectLoop: true,
        blockedForSsrf: false,
        error: 'Redirect loop detected',
      };
    }
    visitedUrls.add(currentUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // Do not follow redirects automatically
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FishLens-Security-Scanner/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const status = response.status;
      const statusText = response.statusText;
      const location = response.headers.get('location');

      hops.push({
        hopNumber: hop,
        url: currentUrl,
        statusCode: status,
        statusText,
        location,
        ip: ssrfCheck.resolvedIp,
        isPrivateIp: false,
      });

      // Check if redirect status
      const isRedirect = [301, 302, 303, 307, 308].includes(status);
      if (!isRedirect || !location) {
        // Reached destination
        return {
          hops,
          finalUrl: currentUrl,
          hasRedirectLoop: false,
          blockedForSsrf: false,
        };
      }

      // Resolve relative redirect URLs
      try {
        const nextUrlObj = new URL(location, currentUrl);
        currentUrl = nextUrlObj.toString();
      } catch {
        return {
          hops,
          finalUrl: currentUrl,
          hasRedirectLoop: false,
          blockedForSsrf: false,
          error: `Invalid redirect location header: ${location}`,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      hops.push({
        hopNumber: hop,
        url: currentUrl,
        statusCode: 0,
        statusText: 'Request Error',
        ip: ssrfCheck.resolvedIp,
        error: message,
      });

      return {
        hops,
        finalUrl: currentUrl,
        hasRedirectLoop: false,
        blockedForSsrf: false,
        error: message,
      };
    }
  }

  return {
    hops,
    finalUrl: currentUrl,
    hasRedirectLoop: false,
    blockedForSsrf: false,
    error: `Exceeded maximum redirect hop limit (${maxHops} hops)`,
  };
}
