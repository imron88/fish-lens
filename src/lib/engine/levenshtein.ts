export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

export function findLookalikeBrand(
  candidateDomain: string,
  brands: string[]
): { brand: string; distance: number; matchType: 'distance' | 'typosquat' | 'subdomain_spoof' } | null {
  const normalized = candidateDomain.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Check for standard Levenshtein distance (1 or 2 edits away)
  for (const brand of brands) {
    if (normalized === brand) {
      // Exact match of legitimate brand name itself
      continue;
    }

    const dist = levenshteinDistance(normalized, brand);
    // Allow distance 1 for brands with length >= 4, distance 2 for brands with length >= 7
    if ((dist === 1 && brand.length >= 4) || (dist === 2 && brand.length >= 7)) {
      return { brand, distance: dist, matchType: 'distance' };
    }

    // 2. Common leetspeak substitutions (e.g., paypa1, micros0ft, app1e)
    const deLeeted = normalized
      .replace(/0/g, 'o')
      .replace(/1/g, 'l')
      .replace(/3/g, 'e')
      .replace(/5/g, 's')
      .replace(/8/g, 'b');

    if (deLeeted === brand) {
      return { brand, distance: 1, matchType: 'typosquat' };
    }

    // 3. Brand prefixed/suffixed with deceptive words, e.g. "paypal-security", "verify-apple"
    if (normalized.includes(brand) && normalized !== brand) {
      const remaining = normalized.replace(brand, '');
      const deceptiveAffixes = ['login', 'verify', 'security', 'account', 'support', 'update', 'alert', 'auth', 'billing'];
      if (deceptiveAffixes.some((affix) => remaining.includes(affix))) {
        return { brand, distance: 0, matchType: 'subdomain_spoof' };
      }
    }
  }

  return null;
}
