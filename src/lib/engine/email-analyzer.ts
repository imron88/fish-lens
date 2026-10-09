import { CheckResult } from './types';
import { URGENT_PHRASES } from './constants';
import { analyzeUrl, parseUrlSafely } from './url-analyzer';

export interface ParsedEmailData {
  headers: Record<string, string>;
  rawHeaders: string;
  body: string;
  from: string;
  fromDomain: string;
  replyTo: string;
  replyToDomain: string;
  subject: string;
  spfResult: string; // 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | 'missing'
  dkimResult: string; // 'pass' | 'fail' | 'none' | 'missing'
  dmarcResult: string; // 'pass' | 'fail' | 'none' | 'missing'
  extractedLinks: Array<{
    href: string;
    text: string;
    isDeceptive: boolean;
  }>;
}

export function extractEmailAddress(headerValue: string): { email: string; domain: string } {
  if (!headerValue) return { email: '', domain: '' };
  const match = headerValue.match(/<([^>]+)>/) || headerValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = (match ? match[1] : headerValue).trim().toLowerCase();
  const domain = email.includes('@') ? email.split('@')[1] : '';
  return { email, domain };
}

export function parseRawEmail(raw: string): ParsedEmailData {
  const lines = raw.split(/\r?\n/);
  const headers: Record<string, string> = {};
  let headerEndIndex = -1;
  let currentKey = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      headerEndIndex = i;
      break;
    }

    if (/^[A-Za-z0-9_-]+:/.test(line)) {
      const colonIdx = line.indexOf(':');
      currentKey = line.substring(0, colonIdx).trim().toLowerCase();
      headers[currentKey] = line.substring(colonIdx + 1).trim();
    } else if (/^\s+/.test(line) && currentKey) {
      // Continuation line (RFC 822 folding)
      headers[currentKey] += ' ' + line.trim();
    }
  }

  const rawHeaders = headerEndIndex !== -1 ? lines.slice(0, headerEndIndex).join('\n') : '';
  const body = headerEndIndex !== -1 ? lines.slice(headerEndIndex + 1).join('\n') : raw;

  const fromInfo = extractEmailAddress(headers['from'] || '');
  const replyToInfo = extractEmailAddress(headers['reply-to'] || '');
  const subject = headers['subject'] || '';

  // Parse SPF, DKIM, DMARC from Authentication-Results, Received-SPF, etc.
  const authResults = (headers['authentication-results'] || '') + ' ' + (headers['received-spf'] || '');
  const authLower = authResults.toLowerCase();

  let spfResult = 'missing';
  if (authLower.includes('spf=pass') || authLower.includes('pass (spf') || authLower.includes('received-spf: pass')) {
    spfResult = 'pass';
  } else if (authLower.includes('spf=fail') || authLower.includes('spf=hardfail')) {
    spfResult = 'fail';
  } else if (authLower.includes('spf=softfail')) {
    spfResult = 'softfail';
  } else if (authLower.includes('spf=neutral') || authLower.includes('spf=none')) {
    spfResult = 'neutral';
  }

  let dkimResult = 'missing';
  if (authLower.includes('dkim=pass') || authLower.includes('pass (dkim')) {
    dkimResult = 'pass';
  } else if (authLower.includes('dkim=fail')) {
    dkimResult = 'fail';
  } else if (headers['dkim-signature']) {
    dkimResult = 'present_unverified';
  }

  let dmarcResult = 'missing';
  if (authLower.includes('dmarc=pass') || authLower.includes('pass (dmarc')) {
    dmarcResult = 'pass';
  } else if (authLower.includes('dmarc=fail')) {
    dmarcResult = 'fail';
  }

  // Extract hyperlinks with their displayed anchor text
  const extractedLinks: Array<{ href: string; text: string; isDeceptive: boolean }> = [];

  // Match HTML anchor tags: <a href="...">text</a>
  const htmlAnchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = htmlAnchorRegex.exec(body)) !== null) {
    const href = match[1].trim();
    const visibleText = match[2].replace(/<[^>]+>/g, '').trim();
    const isDeceptive = checkLinkTextMismatch(href, visibleText);
    extractedLinks.push({ href, text: visibleText, isDeceptive });
  }

  // Also match standalone URLs in plain text body
  const urlRegex = /https?:\/\/[^\s<>"]+/gi;
  const plainUrls = body.match(urlRegex) || [];
  for (const pUrl of plainUrls) {
    if (!extractedLinks.some((l) => l.href === pUrl)) {
      extractedLinks.push({ href: pUrl, text: pUrl, isDeceptive: false });
    }
  }

  return {
    headers,
    rawHeaders,
    body,
    from: fromInfo.email,
    fromDomain: fromInfo.domain,
    replyTo: replyToInfo.email,
    replyToDomain: replyToInfo.domain,
    subject,
    spfResult,
    dkimResult,
    dmarcResult,
    extractedLinks,
  };
}

export function checkLinkTextMismatch(href: string, visibleText: string): boolean {
  if (!href || !visibleText) return false;

  // If visible text looks like a URL or domain name (e.g. "paypal.com" or "https://bankofamerica.com")
  const textLooksLikeUrl = /^https?:\/\//i.test(visibleText) || /^[a-z0-9-]+(\.[a-z0-9-]+)+\/?/i.test(visibleText);
  if (!textLooksLikeUrl) return false;

  const hrefParsed = parseUrlSafely(href);
  const textParsed = parseUrlSafely(visibleText);

  if (hrefParsed.isValidUrl && textParsed.isValidUrl) {
    const hrefHost = hrefParsed.hostname.toLowerCase();
    const textHost = textParsed.hostname.toLowerCase();
    if (hrefHost !== textHost && !hrefHost.endsWith('.' + textHost) && !textHost.endsWith('.' + hrefHost)) {
      return true;
    }
  }

  return false;
}

export function analyzeEmail(rawEmail: string): {
  parsed: ParsedEmailData;
  checks: CheckResult[];
} {
  const parsed = parseRawEmail(rawEmail);
  const checks: CheckResult[] = [];

  // 1. From vs Reply-To address mismatch
  const hasReplyTo = Boolean(parsed.replyTo);
  const hasFrom = Boolean(parsed.from);
  let senderMismatch = false;

  if (hasFrom && hasReplyTo) {
    if (parsed.fromDomain !== parsed.replyToDomain) {
      senderMismatch = true;
    }
  }

  checks.push({
    id: 'email-sender-mismatch',
    name: 'From and Reply-To Header Mismatch',
    category: 'email',
    passed: !senderMismatch,
    weight: 25,
    severity: senderMismatch ? 'high' : 'low',
    explanation: senderMismatch
      ? `The sender "From" domain (${parsed.fromDomain || 'unknown'}) does not match the "Reply-To" domain (${parsed.replyToDomain}). Attackers frequently impersonate brands in the display "From" while harvesting replies on a personal domain.`
      : hasReplyTo
      ? 'The "Reply-To" address matches the sender domain.'
      : 'Sender "From" header is defined without contradictory Reply-To redirection.',
    details: {
      from: parsed.from,
      replyTo: parsed.replyTo,
      fromDomain: parsed.fromDomain,
      replyToDomain: parsed.replyToDomain,
    },
  });

  // 2. Email Authentication: SPF, DKIM, DMARC
  const authFailed =
    parsed.spfResult === 'fail' ||
    parsed.spfResult === 'softfail' ||
    parsed.dkimResult === 'fail' ||
    parsed.dmarcResult === 'fail';

  const authMissing =
    parsed.spfResult === 'missing' &&
    (parsed.dkimResult === 'missing' || parsed.dkimResult === 'none') &&
    parsed.dmarcResult === 'missing';

  const authPassed = !authFailed && !authMissing;

  let authExplanation = 'Email authentication records passed verification (SPF/DKIM/DMARC).';
  if (authFailed) {
    authExplanation = `Authentication failure detected: SPF=${parsed.spfResult}, DKIM=${parsed.dkimResult}, DMARC=${parsed.dmarcResult}. This indicates sender spoofing or unauthorized mail relays.`;
  } else if (authMissing) {
    authExplanation = 'No SPF, DKIM, or DMARC authentication records found in email headers. Authenticity cannot be cryptographic ally verified.';
  }

  checks.push({
    id: 'email-auth-records',
    name: 'Email Authentication (SPF, DKIM, DMARC)',
    category: 'authentication',
    passed: authPassed,
    weight: 30,
    severity: authFailed ? 'critical' : authMissing ? 'medium' : 'low',
    explanation: authExplanation,
    details: {
      spf: parsed.spfResult,
      dkim: parsed.dkimResult,
      dmarc: parsed.dmarcResult,
    },
  });

  // 3. Urgent or threatening psychological language
  const combinedText = (parsed.subject + ' ' + parsed.body).toLowerCase();
  const matchedPhrases: string[] = [];
  for (const phrase of URGENT_PHRASES) {
    if (combinedText.includes(phrase)) {
      matchedPhrases.push(phrase);
    }
  }

  const hasUrgentLanguage = matchedPhrases.length > 0;
  checks.push({
    id: 'email-urgent-language',
    name: 'Urgent or Coercive Social Engineering',
    category: 'content',
    passed: !hasUrgentLanguage,
    weight: 20,
    severity: hasUrgentLanguage ? 'high' : 'low',
    explanation: hasUrgentLanguage
      ? `High-pressure phrases detected: "${matchedPhrases.slice(0, 3).join('", "')}". Phishing campaigns weaponize artificial urgency (account termination, 24h deadlines) to bypass logical scrutiny.`
      : 'No coercive urgency or threatening psychological pressure triggers detected in email text.',
    details: { matchedPhrases },
  });

  // 4. Links whose visible text does not match real destination (Anchor spoofing)
  const deceptiveLinks = parsed.extractedLinks.filter((l) => l.isDeceptive);
  const hasDeceptiveLinks = deceptiveLinks.length > 0;
  checks.push({
    id: 'email-link-text-mismatch',
    name: 'Deceptive Hyperlink Anchor Spoofing',
    category: 'content',
    passed: !hasDeceptiveLinks,
    weight: 35,
    severity: hasDeceptiveLinks ? 'critical' : 'low',
    explanation: hasDeceptiveLinks
      ? `Detected ${deceptiveLinks.length} deceptive link(s) where anchor text shows one domain but navigates to another: displayed "${deceptiveLinks[0].text}" directs to "${deceptiveLinks[0].href}".`
      : 'All hyperlinks match their displayed anchor text destinations without visual spoofing.',
    details: { deceptiveLinks },
  });

  // 5. Insecure HTTP links inside email
  const insecureLinks = parsed.extractedLinks.filter((l) => l.href.startsWith('http://'));
  const hasInsecureLinks = insecureLinks.length > 0;
  checks.push({
    id: 'email-insecure-links',
    name: 'Insecure (Non-HTTPS) Email Hyperlinks',
    category: 'url',
    passed: !hasInsecureLinks,
    weight: 15,
    severity: hasInsecureLinks ? 'medium' : 'low',
    explanation: hasInsecureLinks
      ? `Email contains ${insecureLinks.length} unencrypted (HTTP) link(s) instead of secure HTTPS.`
      : 'All extracted email links utilize HTTPS secure transport encryption.',
    details: { insecureCount: insecureLinks.length },
  });

  // 6. Deep inspection of extracted URLs using URL analyzer
  for (const link of parsed.extractedLinks.slice(0, 3)) {
    const { checks: urlChecks } = analyzeUrl(link.href);
    for (const uCheck of urlChecks) {
      if (!uCheck.passed) {
        checks.push({
          ...uCheck,
          id: `email-link-${uCheck.id}-${link.href.slice(0, 15)}`,
          name: `Embedded Link: ${uCheck.name}`,
          explanation: `In link (${link.href}): ${uCheck.explanation}`,
        });
      }
    }
  }

  return { parsed, checks };
}
