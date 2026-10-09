import dns from 'node:dns';

/**
 * Checks whether an IPv4 or IPv6 address is private, loopback, link-local, or reserved.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const cleanIp = ip.replace(/^::ffff:/, ''); // Handle IPv4-mapped IPv6

  // Check IPv4
  const ipv4Parts = cleanIp.split('.').map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b] = ipv4Parts;

    // 0.0.0.0/8 - Current network
    if (a === 0) return true;
    // 10.0.0.0/8 - Private network
    if (a === 10) return true;
    // 127.0.0.0/8 - Loopback
    if (a === 127) return true;
    // 169.254.0.0/16 - Link-local
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 - Private network (172.16.x.x - 172.31.x.x)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 - Private network
    if (a === 192 && b === 168) return true;
    // 100.64.0.0/10 - Shared address space (carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 192.0.0.0/24 - IETF protocol assignments
    if (a === 192 && b === 0) return true;
    // 224.0.0.0/4 - Multicast
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 - Reserved for future use
    if (a >= 240) return true;

    return false;
  }

  // Check IPv6
  const lowerIp = cleanIp.toLowerCase();
  if (
    lowerIp === '::1' || // Loopback
    lowerIp === '::' || // Unspecified
    lowerIp.startsWith('fe80:') || // Link-local
    lowerIp.startsWith('fc00:') || // Unique local address
    lowerIp.startsWith('fd00:') ||
    lowerIp.startsWith('ff00:') // Multicast
  ) {
    return true;
  }

  return false;
}

export async function validateUrlForSsrf(urlString: string): Promise<{
  safe: boolean;
  resolvedIp?: string;
  reason?: string;
}> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { safe: false, reason: 'Invalid URL structure' };
  }

  // Restrict to HTTP and HTTPS only
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { safe: false, reason: `Disallowed protocol: ${url.protocol}. Only http: and https: are allowed.` };
  }

  const hostname = url.hostname.toLowerCase();

  // Block localhost and internal names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.onion')
  ) {
    return { safe: false, reason: `Blocked private or local hostname: ${hostname}` };
  }

  // If hostname is directly an IP address
  if (isPrivateOrReservedIp(hostname)) {
    return {
      safe: false,
      resolvedIp: hostname,
      reason: `Direct connection to private/reserved IP is blocked: ${hostname}`,
    };
  }

  // Resolve hostname via DNS lookup
  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { safe: false, reason: `DNS resolution failed for hostname: ${hostname}` };
    }

    for (const record of lookupResult) {
      if (isPrivateOrReservedIp(record.address)) {
        return {
          safe: false,
          resolvedIp: record.address,
          reason: `DNS resolved hostname "${hostname}" to private/internal IP: ${record.address}`,
        };
      }
    }

    return {
      safe: true,
      resolvedIp: lookupResult[0].address,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { safe: false, reason: `DNS lookup error: ${message}` };
  }
}
