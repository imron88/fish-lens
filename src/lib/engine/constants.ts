export const POPULAR_BRANDS: string[] = [
  'google',
  'paypal',
  'microsoft',
  'apple',
  'amazon',
  'netflix',
  'facebook',
  'instagram',
  'twitter',
  'x',
  'bankofamerica',
  'chase',
  'wellsfargo',
  'citibank',
  'binance',
  'coinbase',
  'dropbox',
  'github',
  'adobe',
  'linkedin',
  'ebay',
  'yahoo',
  'steam',
  'spotify',
  'roblox',
  'whatsapp',
  'telegram',
  'icloud',
  'outlook',
  'office365',
  'dhl',
  'fedex',
  'ups',
  'usps',
];

export const SUSPICIOUS_TLDS: string[] = [
  'xyz',
  'top',
  'buzz',
  'club',
  'work',
  'stream',
  'gq',
  'ml',
  'cf',
  'tk',
  'ga',
  'icu',
  'cam',
  'monster',
  'rest',
  'fit',
  'live',
  'click',
  'country',
  'kim',
  'loan',
  'racing',
  'download',
  'win',
  'bid',
  'vip',
  'bar',
  'pw',
  'surf',
  'beauty',
  'quest',
];

export const URL_SHORTENERS: string[] = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'buff.ly',
  'ow.ly',
  'rebrand.ly',
  'rb.gy',
  'cutt.ly',
  'shorturl.at',
  'tiny.cc',
  'goo.gl',
  'qr.ae',
  'tr.im',
  'bl.ink',
];

export const PHISHING_KEYWORDS: string[] = [
  'login',
  'log-in',
  'signin',
  'sign-in',
  'verify',
  'verification',
  'verification-center',
  'secure',
  'security-alert',
  'account',
  'update',
  'update-billing',
  'banking',
  'password',
  'credential',
  'authenticate',
  'confirm',
  'billing',
  'wallet',
  'recovery',
  'validate',
  'suspended',
  'unauthorized',
  'webscr',
  'ebayisapi',
];

export const URGENT_PHRASES: string[] = [
  'account will be suspended',
  'account suspended',
  'immediate action required',
  'within 24 hours',
  'within 12 hours',
  'within 48 hours',
  'act immediately',
  'urgent notice',
  'unauthorized login detected',
  'unauthorized activity',
  'security alert',
  'verify now or lose access',
  'permanent suspension',
  'warrant for arrest',
  'legal action will be taken',
  'unusual sign-in activity',
  'action required',
  'compromised account',
  'final warning',
  'restricted account',
  'failure to respond will result',
];

export const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillic homoglyphs
  '\u0430': 'a', // Cyrillic Small Letter A
  '\u0441': 'c', // Cyrillic Small Letter Es
  '\u0435': 'e', // Cyrillic Small Letter Ie
  '\u0456': 'i', // Cyrillic Small Letter Byelorussian-Ukrainian I
  '\u0458': 'j', // Cyrillic Small Letter Je
  '\u043E': 'o', // Cyrillic Small Letter O
  '\u0440': 'p', // Cyrillic Small Letter Er
  '\u0455': 's', // Cyrillic Small Letter Dze
  '\u0445': 'x', // Cyrillic Small Letter Ha
  '\u0443': 'y', // Cyrillic Small Letter U
  // Greek homoglyphs
  '\u03B1': 'a', // Greek Small Letter Alpha
  '\u03BF': 'o', // Greek Small Letter Omicron
  '\u03BD': 'v', // Greek Small Letter Nu
  '\u03C1': 'p', // Greek Small Letter Rho
};
