import { CheckResult } from './types';
import {
  POPULAR_BRANDS,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
  PHISHING_KEYWORDS,
  HOMOGLYPH_MAP,
} from './constants';
import { findLookalikeBrand } from './levenshtein';

export interface ParsedUrlData {
  rawUrl: string;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  username: string;
  password: string;
  subdomains: string[];
  mainDomain: string;
  domainName: string;
  tld: string;
  isValidUrl: boolean;
}

export function parseUrlSafely(inputUrl: string): ParsedUrlData {
  let cleaned = inputUrl.trim();
  if (!cleaned.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    cleaned = 'http://' + cleaned;
  }

  try {
    const urlObj = new URL(cleaned);
    const hostname = urlObj.hostname.toLowerCase();
    const parts = hostname.split('.');

    let tld = '';
    let domainName = '';
    let mainDomain = '';
    const subdomains: string[] = [];

    if (parts.length >= 2) {
      tld = parts[parts.length - 1];
      // handle two-part TLDs like .co.uk, .com.au
      const secondLevelTlds = ['co.uk', 'com.au', 'co.jp', 'gov.uk', 'edu.au', 'com.br'];
      const lastTwo = parts.slice(-2).join('.');
      if (secondLevelTlds.includes(lastTwo) && parts.length >= 3) {
        tld = lastTwo;
        domainName = parts[parts.length - 3];
        mainDomain = `${domainName}.${tld}`;
        for (let i = 0; i < parts.length - 3; i++) {
          subdomains.push(parts[i]);
        }
      } else {
        domainName = parts[parts.length - 2];
        mainDomain = `${domainName}.${tld}`;
        for (let i = 0; i < parts.length - 2; i++) {
          subdomains.push(parts[i]);
        }
      }
    } else {
      domainName = hostname;
      mainDomain = hostname;
    }

    return {
      rawUrl: inputUrl,
      normalizedUrl: cleaned,
      protocol: urlObj.protocol.replace(':', ''),
      hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      username: urlObj.username,
      password: urlObj.password,
      subdomains,
      mainDomain,
      domainName,
      tld,
      isValidUrl: true,
    };
  } catch {
    return {
      rawUrl: inputUrl,
      normalizedUrl: cleaned,
      protocol: '',
      hostname: '',
      port: '',
      pathname: '',
      search: '',
      hash: '',
      username: '',
      password: '',
      subdomains: [],
      mainDomain: '',
      domainName: '',
      tld: '',
      isValidUrl: false,
    };
  }
}

export function analyzeUrl(rawUrl: string): {
  parsed: ParsedUrlData;
  checks: CheckResult[];
} {
  const parsed = parseUrlSafely(rawUrl);
  const checks: CheckResult[] = [];

  if (!parsed.isValidUrl) {
    checks.push({
      id: 'url-invalid-format',
      name: 'Malformed URL Syntax',
      category: 'url',
      passed: false,
      weight: 35,
      severity: 'high',
      explanation: 'The provided string cannot be parsed as a valid URL standard structure.',
      details: { input: rawUrl },
    });
    return { parsed, checks };
  }

  // 1. Missing HTTPS
  const isHttps = parsed.protocol === 'https';
  checks.push({
    id: 'url-missing-https',
    name: 'HTTPS Transport Security',
    category: 'url',
    passed: isHttps,
    weight: 15,
    severity: isHttps ? 'low' : 'medium',
    explanation: isHttps
      ? 'The URL uses HTTPS, providing encrypted transport.'
      : 'The URL uses unencrypted HTTP instead of HTTPS, leaving network traffic exposed.',
    details: { protocol: parsed.protocol },
  });

  // 2. IP Address Hostname
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname);
  const isIpv6 = /^\[?[a-fA-F0-9:]+\]?$/.test(parsed.hostname) && parsed.hostname.includes(':');
  const isIpAddress = isIpv4 || isIpv6;
  checks.push({
    id: 'url-ip-hostname',
    name: 'IP Address as Hostname',
    category: 'url',
    passed: !isIpAddress,
    weight: 25,
    severity: isIpAddress ? 'high' : 'low',
    explanation: isIpAddress
      ? `The destination hostname is a direct raw IP address (${parsed.hostname}) rather than a registered domain, a common tactic used to bypass domain reputation checks.`
      : 'The hostname resolves to a registered domain name rather than a raw numeric IP address.',
    details: { hostname: parsed.hostname, isIpv4, isIpv6 },
  });

  // 3. Lookalike / Typosquatting Brand Domain
  let lookalikeFound = false;
  let lookalikeDetails: { brand: string; distance: number; matchType: string } | null = null;
  if (!isIpAddress && parsed.domainName) {
    const candidate = parsed.domainName.toLowerCase();
    const match = findLookalikeBrand(candidate, POPULAR_BRANDS);
    if (match) {
      lookalikeFound = true;
      lookalikeDetails = match;
    }
  }
  checks.push({
    id: 'url-lookalike-domain',
    name: 'Brand Impersonation & Typosquatting',
    category: 'url',
    passed: !lookalikeFound,
    weight: 30,
    severity: lookalikeFound ? 'critical' : 'low',
    explanation: lookalikeFound
      ? `The domain "${parsed.mainDomain}" closely mimics the well-known brand "${lookalikeDetails?.brand}" (match type: ${lookalikeDetails?.matchType}). Attackers register lookalike domains to mislead victims into entering credentials.`
      : 'The domain does not exhibit known brand spoofing or Levenshtein distance typosquatting.',
    details: lookalikeDetails ? { ...lookalikeDetails, domain: parsed.mainDomain } : undefined,
  });

  // 4. Suspicious TLD
  const isSuspiciousTld = SUSPICIOUS_TLDS.includes(parsed.tld.toLowerCase());
  checks.push({
    id: 'url-suspicious-tld',
    name: 'High-Risk Top Level Domain',
    category: 'url',
    passed: !isSuspiciousTld,
    weight: 20,
    severity: isSuspiciousTld ? 'high' : 'low',
    explanation: isSuspiciousTld
      ? `The top-level domain (.${parsed.tld}) has high abuse rates across threat intelligence feeds and is frequently abused by automated spam/phishing networks.`
      : `The top-level domain (.${parsed.tld}) is not on the high-risk surveillance watchlist.`,
    details: { tld: parsed.tld },
  });

  // 5. Excessive Subdomains
  const subdomainCount = parsed.subdomains.length;
  const isExcessiveSubdomains = subdomainCount >= 3;
  checks.push({
    id: 'url-excessive-subdomains',
    name: 'Excessive Subdomain Stacking',
    category: 'url',
    passed: !isExcessiveSubdomains,
    weight: 15,
    severity: isExcessiveSubdomains ? 'medium' : 'low',
    explanation: isExcessiveSubdomains
      ? `The URL contains ${subdomainCount} subdomains (${parsed.subdomains.join('.')}). Phishers often chain subdomains (e.g. paypal.com.account-verify.phish.com) to camouflage malicious destinations on mobile displays.`
      : `The URL has ${subdomainCount} subdomains, which is within the standard threshold.`,
    details: { subdomains: parsed.subdomains, count: subdomainCount },
  });

  // 6. The @ Symbol Trick
  const hasAtSymbol = parsed.rawUrl.includes('@') || Boolean(parsed.username);
  checks.push({
    id: 'url-at-symbol-trick',
    name: 'URL Userinfo "@" Redirection Trick',
    category: 'url',
    passed: !hasAtSymbol,
    weight: 30,
    severity: hasAtSymbol ? 'critical' : 'low',
    explanation: hasAtSymbol
      ? 'The URL contains the "@" character. In URI standards, everything before the "@" is treated as HTTP Basic Auth credentials, while the actual browser request lands on the server after the "@".'
      : 'No deceptive "@" authentication spoofing was detected in the URL structure.',
    details: { hasAtSymbol, username: parsed.username },
  });

  // 7. Punycode and Homoglyph Characters
  const isPunycode = parsed.hostname.startsWith('xn--') || parsed.hostname.includes('.xn--');
  let hasHomoglyph = false;
  const homoglyphMatches: string[] = [];
  for (const ch of parsed.rawUrl) {
    if (HOMOGLYPH_MAP[ch]) {
      hasHomoglyph = true;
      homoglyphMatches.push(`${ch} (looks like '${HOMOGLYPH_MAP[ch]}')`);
    }
  }
  const isHomoglyphDetected = isPunycode || hasHomoglyph;
  checks.push({
    id: 'url-homoglyph-punycode',
    name: 'Punycode & Homoglyph Spoofing',
    category: 'url',
    passed: !isHomoglyphDetected,
    weight: 30,
    severity: isHomoglyphDetected ? 'critical' : 'low',
    explanation: isHomoglyphDetected
      ? `Internationalized domain name (IDN) or Unicode homoglyph characters were detected (${isPunycode ? 'Punycode xn-- prefix' : homoglyphMatches.slice(0, 3).join(', ')}). Attackers use visually identical Cyrillic/Greek characters to forge legitimate brands.`
      : 'Standard ASCII character set verified; no Internationalized Domain Name homoglyphs identified.',
    details: { isPunycode, homoglyphMatches },
  });

  // 8. URL Shortener Service
  const isShortener = URL_SHORTENERS.some(
    (shortener) => parsed.hostname === shortener || parsed.hostname.endsWith('.' + shortener)
  );
  checks.push({
    id: 'url-shortener',
    name: 'URL Shortener Redirection Masking',
    category: 'url',
    passed: !isShortener,
    weight: 15,
    severity: isShortener ? 'medium' : 'low',
    explanation: isShortener
      ? `The link uses a URL shortener service (${parsed.hostname}), hiding the true destination endpoint and evading initial heuristic inspection.`
      : 'The link does not utilize known URL shortening services.',
    details: { hostname: parsed.hostname },
  });

  // 9. Very Long URL
  const urlLength = parsed.rawUrl.length;
  const isVeryLong = urlLength > 85;
  checks.push({
    id: 'url-excessive-length',
    name: 'Suspicious URL Length',
    category: 'url',
    passed: !isVeryLong,
    weight: 10,
    severity: isVeryLong ? 'medium' : 'low',
    explanation: isVeryLong
      ? `The URL is unusually long (${urlLength} characters). Phishers frequently append extensive query parameters or token-like padding to push malicious domains out of view in mobile address bars.`
      : `URL length is ${urlLength} characters, within safe standard parameters.`,
    details: { length: urlLength },
  });

  // 10. Phishing Keywords
  const fullUrlLower = parsed.rawUrl.toLowerCase();
  const matchedKeywords: string[] = [];
  for (const keyword of PHISHING_KEYWORDS) {
    // Check if keyword is in subdomain, path, or query
    const inSubdomain = parsed.subdomains.some((s) => s.includes(keyword));
    const inPath = parsed.pathname.toLowerCase().includes(keyword);
    const inSearch = parsed.search.toLowerCase().includes(keyword);
    if (inSubdomain || inPath || inSearch) {
      if (!matchedKeywords.includes(keyword)) {
        matchedKeywords.push(keyword);
      }
    }
  }
  const hasPhishingKeywords = matchedKeywords.length > 0;
  checks.push({
    id: 'url-phishing-keywords',
    name: 'Sensitive Credential & Action Keywords',
    category: 'url',
    passed: !hasPhishingKeywords,
    weight: 20,
    severity: hasPhishingKeywords ? 'medium' : 'low',
    explanation: hasPhishingKeywords
      ? `High-risk credential harvesting keywords found in URL path or parameters: "${matchedKeywords.join(', ')}". Common in credential capture traps.`
      : 'No high-risk credential harvesting keywords found in path or query parameters.',
    details: { matchedKeywords },
  });

  return { parsed, checks };
}
