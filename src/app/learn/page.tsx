'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ShieldAlert,
  AlertTriangle,
  Globe,
  Mail,
  Code2,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ThreatGuide {
  id: string;
  category: 'url' | 'email' | 'system';
  title: string;
  subtitle: string;
  severity: 'Critical' | 'High' | 'Medium';
  mechanism: string;
  realWorldScenario: string;
  examplePayload: string;
  detectionLogic: string;
  preventionTip: string;
}

const THREAT_GUIDES: ThreatGuide[] = [
  {
    id: 'lookalike-levenshtein',
    category: 'url',
    title: 'Brand Impersonation & Typosquatting (Levenshtein Distance)',
    subtitle: 'Registering visually deceptive domain variations of known brands',
    severity: 'Critical',
    mechanism:
      'Attackers register domains with minor typos (Levenshtein distance = 1 or 2) or leetspeak substitutions (e.g. replacing "l" with "1" or "o" with "0") to fool users who glance quickly at the address bar.',
    realWorldScenario:
      'Victims receiving a notification about a suspended PayPal account are sent to a site named "paypa1.com" or "paypal-update.xyz". The user perceives the familiar brand name and inputs credentials.',
    examplePayload: 'http://paypa1-account-security.xyz/login/verify.php',
    detectionLogic:
      'Fish Lens strips non-alphanumeric chars, computes dynamic matrix Levenshtein edit distances against high-value target brand databases (PayPal, Google, Apple, Microsoft, Chase, Binance), and flags suspicious distances and leet mutations.',
    preventionTip:
      'Always rely on bookmarks or official mobile apps rather than clicking links in unsolicited communications.',
  },
  {
    id: 'at-symbol-trick',
    category: 'url',
    title: 'The "@" Symbol Userinfo Authentication Trick',
    subtitle: 'Using RFC 3986 basic authentication format to disguise destination hosts',
    severity: 'Critical',
    mechanism:
      'According to standard URL syntax (RFC 3986), string content between "https://" and the "@" character represents username/credential credentials, while the actual browser connection is directed to whatever host follows the "@".',
    realWorldScenario:
      'A phishing email features a link formatted as "https://google.com@evil-harvesting-server.com/login". Victims only read "https://google.com" and mistakenly believe they are visiting Google, but their browser navigates directly to evil-harvesting-server.com.',
    examplePayload: 'https://google.com@auth-harvest-login.buzz/session?token=4819a82',
    detectionLogic:
      'URL syntax parser checks for presence of the "@" character in the URL structure or populating the URL "username" property.',
    preventionTip:
      'Modern web browsers warn on userinfo, but users must remember: anything before an "@" in a URL is ignored by the domain resolver.',
  },
  {
    id: 'punycode-homoglyph',
    category: 'url',
    title: 'Punycode & Unicode Homoglyph Spoofing',
    subtitle: 'Replacing Latin letters with visually identical Cyrillic or Greek glyphs',
    severity: 'Critical',
    mechanism:
      'Internationalized Domain Names (IDNs) allow foreign character sets. The Cyrillic letter "а" (U+0430) or "о" (U+043E) looks identical to standard Latin "a" or "o" in modern fonts, but resolves to a completely distinct Punycode domain (xn--...).',
    realWorldScenario:
      'An attacker registers "xn--appl-43d.com" which renders in browsers as "applе.com" (using Cyrillic "е"). The link is visually indistinguishable from Apple’s legitimate domain.',
    examplePayload: 'https://xn--gogle-qoa.com/account/login (disguised as gооgle.com)',
    detectionLogic:
      'Fish Lens inspects the raw hostname for the "xn--" IDN Punycode prefix and cross-references characters against a unicode homoglyph lookup table.',
    preventionTip:
      'Configure browsers to display IDN domains in Punycode format or verify TLS certificate Subject Alternative Names.',
  },
  {
    id: 'ip-as-hostname',
    category: 'url',
    title: 'IP Addresses Used as Hostnames',
    subtitle: 'Routing traffic to raw numerical addresses to avoid domain reputation blocklists',
    severity: 'High',
    mechanism:
      'Legitimate consumer services virtually never present raw numeric IP addresses (e.g. http://185.220.101.5/...) in user links. Phishers use direct IPs to avoid domain registration records (WHOIS) or evade freshly blacklisted DNS names.',
    realWorldScenario:
      'A banking credential harvesting phishing kit is hosted directly on a compromised VPS or bulletproof server without mapping any DNS domain name.',
    examplePayload: 'http://185.220.101.5/bank-update/secure-login',
    detectionLogic:
      'Regex evaluation tests if the hostname strictly matches IPv4 decimal dot notation (4 octets) or IPv6 hexadecimal bracketed notation.',
    preventionTip:
      'Reputable financial, email, and social networks do not ask users to authenticate via raw IP addresses.',
  },
  {
    id: 'excessive-subdomains',
    category: 'url',
    title: 'Excessive Subdomain Stacking',
    subtitle: 'Chaining brand keywords across multiple subdomains to truncate mobile address bars',
    severity: 'High',
    mechanism:
      'On smartphones with narrow address bars, users only see the beginning of a URL. Attackers prepend legitimate names as subdomains (e.g. "paypal.com.verify.accounts.attackerdomain.com") knowing the real top-level domain is hidden off-screen.',
    realWorldScenario:
      'A mobile user sees "https://security.apple.id..." in Safari’s condensed address bar and assumes it is official, while the actual host is an attacker-controlled root domain.',
    examplePayload: 'https://security.apple.id.verify.account.cloud-check.top/auth',
    detectionLogic:
      'Hostname parser isolates the effective Top-Level Domain (eTLD+1) and flags entities with 3 or more stacked subdomains.',
    preventionTip:
      'Read URLs from right to left starting just before the first single slash "/" to identify the actual root domain.',
  },
  {
    id: 'suspicious-tlds',
    category: 'url',
    title: 'Suspicious & High-Abuse TLDs',
    subtitle: 'Exploiting ultra-cheap or unmonitored top-level domains',
    severity: 'High',
    mechanism:
      'Certain TLDs (.xyz, .top, .buzz, .country, .icu, .monster) offer cheap bulk registration with lax identity verification, leading to high ratios of abusive spam and disposable phishing infrastructure.',
    realWorldScenario:
      'Automated phishing campaigns register 500 disposable ".top" or ".xyz" domains per day to bypass static threat feeds faster than blocklists can update.',
    examplePayload: 'https://chase-bank-verify.buzz/login',
    detectionLogic:
      'TLD is matched against threat intelligence lists of high-abuse top-level domains compiled from global spam analytics.',
    preventionTip:
      'Exercise elevated caution with unsolicited communications utilizing disposable, unconventional TLD extensions.',
  },
  {
    id: 'url-shorteners',
    category: 'url',
    title: 'URL Shortener Redirection Masking',
    subtitle: 'Hiding target destination endpoints behind link-shortening services',
    severity: 'Medium',
    mechanism:
      'Services like bit.ly, tinyurl.com, and t.co create short redirects that conceal the true destination domain, preventing security gateways and users from inspecting the destination before clicking.',
    realWorldScenario:
      'An SMS phishing (smishing) message says: "Your package is held: bit.ly/3x8Qz9a". The link redirects through multiple hops to a credit card harvesting form.',
    examplePayload: 'https://bit.ly/3x8Qz9a-urgent-invoice',
    detectionLogic:
      'Checks domain against known public link shortener services and provides automated redirect tracing.',
    preventionTip:
      'Use URL expansion utilities or inspect redirect chains before entering credentials on shortened links.',
  },
  {
    id: 'email-from-reply-to-mismatch',
    category: 'email',
    title: 'From vs. Reply-To Header Mismatch',
    subtitle: 'Displaying an authoritative brand in From while capturing replies elsewhere',
    severity: 'High',
    mechanism:
      'The "From" header is easily spoofed in SMTP to display "security@microsoft.com". Attackers specify a distinct "Reply-To" address (e.g. "hacker@disposable.xyz") so any replies with sensitive info return to them.',
    realWorldScenario:
      'Business Email Compromise (BEC): An invoice appears to come from the CEO’s real corporate address, but the Reply-To routes wire confirmation questions directly to an attacker-controlled inbox.',
    examplePayload: `From: "Microsoft Security" <security-alert@microsoft.com>\nReply-To: "Attacker Inbox" <attacker-inbox@mail-relay-direct.xyz>`,
    detectionLogic:
      'Extracts and parses root domain of both "From" and "Reply-To" headers and flags instances where domains conflict.',
    preventionTip:
      'Examine full email headers and verify the Reply-To address before responding to urgent requests.',
  },
  {
    id: 'email-auth-spf-dkim-dmarc',
    category: 'email',
    title: 'SPF, DKIM, and DMARC Authentication Failures',
    subtitle: 'Cryptographic mail verification failures indicating sender forgery',
    severity: 'Critical',
    mechanism:
      'SPF checks whether the sending IP is authorized by the domain’s DNS. DKIM cryptographically signs email headers. DMARC aligns both policies. When an attacker forges an external domain, these checks fail.',
    realWorldScenario:
      'An attacker sends an email claiming to be from "service@paypal.com" from an unauthorized server. The receiver’s mail server records "spf=fail" and "dkim=fail".',
    examplePayload: 'Authentication-Results: mx.google.com; spf=fail; dkim=fail; dmarc=fail',
    detectionLogic:
      'Analyzes Authentication-Results and Received-SPF headers to detect hard fail, softfail, or completely missing cryptographic authentication.',
    preventionTip:
      'Enforce strict DMARC "p=reject" policies on corporate domains to protect against brand spoofing.',
  },
  {
    id: 'anchor-text-mismatch',
    category: 'email',
    title: 'Deceptive Hyperlink Anchor Text Spoofing',
    subtitle: 'Displaying a legitimate URL in visible HTML text while href points to malware',
    severity: 'Critical',
    mechanism:
      'In HTML emails, the text displayed to the human reader can be anything: `<a href="http://malicious.com">https://bankofamerica.com</a>`. The victim reads Bank of America, but clicking navigates to the malicious server.',
    realWorldScenario:
      'An email warning of an unauthorized login says "Click here to review: https://chase.com/verify". The underlying href actually directs to "http://chase-harvest.top/steal".',
    examplePayload: '<a href="http://bankofamer1ca-auth.xyz/confirm">https://bankofamerica.com/verify-identity</a>',
    detectionLogic:
      'Parses all HTML anchor elements, evaluates whether visible anchor text resembles a URL or domain, and flags discrepancies between visible text and underlying href destination.',
    preventionTip:
      'Hover over hyperlinks to preview the real destination in your mail client’s status bar before clicking.',
  },
  {
    id: 'urgent-language',
    category: 'email',
    title: 'Urgent & Threatening Psychological Coercion',
    subtitle: 'Manufacturing artificial deadlines to bypass critical thinking',
    severity: 'High',
    mechanism:
      'Social engineering relies on psychological triggers: fear, urgency, and authority. Phishers use phrases like "Account suspended within 24 hours" or "Warrant for arrest" to induce panic and force hasty clicks.',
    realWorldScenario:
      'A message claims the victim’s payroll deposit or cloud storage will be terminated immediately unless credentials are confirmed within 12 hours.',
    examplePayload: 'Subject: ACTION REQUIRED: Account will be suspended within 24 hours unless verified',
    detectionLogic:
      'Textual heuristic scanner scans subjects and message bodies against curated patterns of high-pressure social engineering keywords.',
    preventionTip:
      'High urgency is almost always a hallmark of social engineering. Contact service providers via verified out-of-band channels.',
  },
  {
    id: 'ssrf-redirection-defense',
    category: 'system',
    title: 'SSRF Defense & Redirect Chain Probing',
    subtitle: 'Preventing Server-Side Request Forgery while following multi-hop redirects',
    severity: 'Critical',
    mechanism:
      'When a server fetches user-supplied URLs to follow redirects, attackers may input internal IP addresses (127.0.0.1, 169.254.169.254 cloud metadata, 192.168.x.x) to breach internal private networks (SSRF).',
    realWorldScenario:
      'An attacker submits "http://169.254.169.254/latest/meta-data/iam/security-credentials/" to steal AWS cloud IAM tokens from the scanning server.',
    examplePayload: 'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/',
    detectionLogic:
      'Fish Lens resolves hostnames via DNS, checks resolved IPv4 and IPv6 addresses against private/reserved CIDRs (RFC 1918, link-local, loopback, carrier-grade NAT), and aborts connections immediately before making HTTP requests.',
    preventionTip:
      'Always validate DNS resolution and enforce strict IP blocklists at the application and network firewall layers.',
  },
];

export default function LearnPage() {
  const [filter, setFilter] = useState<'all' | 'url' | 'email' | 'system'>('all');
  const [search, setSearch] = useState('');

  const filteredGuides = THREAT_GUIDES.filter((guide) => {
    const matchesFilter = filter === 'all' || guide.category === filter;
    const matchesSearch =
      guide.title.toLowerCase().includes(search.toLowerCase()) ||
      guide.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      guide.mechanism.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border border-cyan-950/80 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#090f1a] to-[#06090e] shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CYBERSECURITY INTEL &amp; VULNERABILITY CATALOG</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-mono text-slate-100">
            Understanding Phishing Red Flags
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
            Detailed breakdown of how modern phishing techniques weaponize deceptive URLs, header spoofs, and social engineering—with real-world examples and detection mechanics.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
          {(['all', 'url', 'email', 'system'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded capitalize transition-all ${
                filter === cat
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Vectors' : cat === 'system' ? 'SSRF & Architecture' : `${cat} Vectors`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vectors (e.g., Levenshtein, Punycode)..."
            className="w-full bg-[#090d16] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Guides List */}
      <div className="space-y-6">
        {filteredGuides.map((guide, idx) => (
          <div
            key={guide.id}
            id={guide.id}
            className="bg-[#090d16] border border-slate-800/90 rounded-2xl p-6 shadow-lg hover:border-cyan-500/30 transition-all space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono text-slate-500">
                    Vector #{idx + 1} • {guide.category.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      guide.severity === 'Critical'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : guide.severity === 'High'
                        ? 'bg-orange-950 text-orange-400 border border-orange-500/40'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {guide.severity} Severity
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-mono font-bold text-slate-100">
                  {guide.title}
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  {guide.subtitle}
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              <strong className="text-cyan-400 font-mono block text-xs uppercase tracking-wider">
                How The Attack Operates:
              </strong>
              <p>{guide.mechanism}</p>
            </div>

            {/* Real World Scenario */}
            <div className="p-4 bg-[#06090e] border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Real-World Threat Scenario:</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                {guide.realWorldScenario}
              </p>

              <div className="pt-2">
                <span className="text-[11px] font-mono text-slate-500 block mb-1">
                  Example Malicious Payload Pattern:
                </span>
                <pre className="text-xs font-mono bg-[#030508] p-3 rounded border border-slate-800 text-red-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {guide.examplePayload}
                </pre>
              </div>
            </div>

            {/* Detection Logic & Prevention Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs font-mono">
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fish Lens Heuristic Detection:</span>
                </span>
                <p className="text-slate-300 font-sans text-xs">
                  {guide.detectionLogic}
                </p>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Defense &amp; Mitigation:</span>
                </span>
                <p className="text-slate-300 font-sans text-xs">
                  {guide.preventionTip}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
