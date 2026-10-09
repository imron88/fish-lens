export interface SampleItem {
  id: string;
  type: 'url' | 'email';
  title: string;
  category: string;
  description: string;
  content: string;
  expectedVerdict: 'safe' | 'suspicious' | 'dangerous';
}

export const SAMPLES: SampleItem[] = [
  {
    id: 'sample-lookalike-paypal',
    type: 'url',
    title: 'PayPal Typosquat Brand Spoof',
    category: 'Brand Lookalike & Keywords',
    description: 'Typosquatted domain using "paypa1" with phishing keywords and HTTP.',
    content: 'http://paypa1-account-security.xyz/login/verify.php',
    expectedVerdict: 'dangerous',
  },
  {
    id: 'sample-at-trick',
    type: 'url',
    title: 'The @ Symbol Spoofing Trick',
    category: 'Credential Userinfo Trick',
    description: 'Deceptively appears to be google.com, but navigates to an external credential harvesting server.',
    content: 'https://google.com@auth-harvest-login.buzz/session?token=4819a82',
    expectedVerdict: 'dangerous',
  },
  {
    id: 'sample-ip-host',
    type: 'url',
    title: 'Direct IP Hostname Attack',
    category: 'IP Hostname & Missing HTTPS',
    description: 'Raw IP address used to host an unencrypted banking verification form.',
    content: 'http://185.220.101.5/bank-update/secure-login',
    expectedVerdict: 'dangerous',
  },
  {
    id: 'sample-subdomain-chain',
    type: 'url',
    title: 'Excessive Subdomain Camouflage',
    category: 'Subdomain Stacking',
    description: 'Chaining multiple trusted brand keywords in subdomains to trick mobile screen displays.',
    content: 'https://security.apple.id.verify.account.cloud-check.top/auth',
    expectedVerdict: 'dangerous',
  },
  {
    id: 'sample-shortener',
    type: 'url',
    title: 'Obfuscated Shortened Link',
    category: 'URL Shortener Masking',
    description: 'Masks true redirect destination using bit.ly.',
    content: 'https://bit.ly/3x8Qz9a-urgent-invoice',
    expectedVerdict: 'suspicious',
  },
  {
    id: 'sample-legit-url',
    type: 'url',
    title: 'Legitimate Domain (Safe)',
    category: 'Legitimate Safe Target',
    description: 'Clean official GitHub repository URL with HTTPS.',
    content: 'https://github.com/security/advisories',
    expectedVerdict: 'safe',
  },
  {
    id: 'sample-ceo-fraud-email',
    type: 'email',
    title: 'Executive Phishing & From Mismatch',
    category: 'Urgent Threat & Header Spoof',
    description: 'Sender impersonates Microsoft security with From/Reply-To mismatch and urgent suspension threats.',
    content: `From: Security Team <security-alert@microsoft.com>
Reply-To: attacker-inbox@mail-relay-direct.xyz
Subject: ACTION REQUIRED: Account will be suspended within 24 hours
Date: Fri, 09 Oct 2026 12:00:00 +0000
Authentication-Results: mx.google.com; spf=fail (google.com: domain of alert@microsoft.com does not designate permitted sender) smtp.mailfrom=alert@microsoft.com; dkim=fail; dmarc=fail

Dear Customer,

We detected unusual sign-in activity on your corporate account.
Your account will be suspended within 24 hours unless you act immediately.

Please verify your credentials immediately to avoid permanent suspension:
<a href="http://microsoft-verify-account.buzz/auth/login">https://microsoft.com/security/verify</a>

Failure to respond will result in immediate termination of corporate access.

Microsoft Security Operations`,
    expectedVerdict: 'dangerous',
  },
  {
    id: 'sample-anchor-spoof-email',
    type: 'email',
    title: 'Deceptive Anchor Text Spoofing',
    category: 'Anchor Text Mismatch',
    description: 'Email where the visible link text displays legitimate Bank of America but leads to a malicious phishing site.',
    content: `From: Bank Notification <alerts@bankofamerica.com>
Reply-To: alerts@bankofamerica.com
Subject: Security alert: Unauthorized login detected
Date: Fri, 09 Oct 2026 14:30:00 +0000
Authentication-Results: mx.google.com; spf=softfail; dkim=none; dmarc=none

Attention Customer,

An unauthorized login detected from an unrecognized IP address.
Immediate action required: please confirm your banking details right now.

Review activity and secure your account here:
<a href="http://bankofamer1ca-auth.xyz/confirm">https://bankofamerica.com/verify-identity</a>

Thank you,
Bank Customer Care`,
    expectedVerdict: 'dangerous',
  },
  {
    id: 'sample-legit-email',
    type: 'email',
    title: 'Legitimate Transaction Email (Safe)',
    category: 'Legitimate Authenticated Mail',
    description: 'Clean email with passing SPF, DKIM, DMARC, matching Reply-To, and HTTPS links.',
    content: `From: GitHub Notifications <notifications@github.com>
Reply-To: support@github.com
Subject: New security advisory published
Date: Fri, 09 Oct 2026 10:15:00 +0000
Authentication-Results: mx.google.com; spf=pass (google.com: domain of notifications@github.com designates 192.30.252.0 as permitted sender); dkim=pass header.i=@github.com; dmarc=pass

Hi Developer,

A new security advisory has been published for a repository you follow.
You can view the full advisory details here:
<a href="https://github.com/advisories/GHSA-1234">https://github.com/advisories/GHSA-1234</a>

Best regards,
The GitHub Security Team`,
    expectedVerdict: 'safe',
  },
];
