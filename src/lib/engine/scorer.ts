import { CheckResult, Verdict } from './types';

export function calculateRiskScore(checks: CheckResult[]): {
  score: number;
  verdict: Verdict;
  summary: string;
  triggeredChecks: CheckResult[];
} {
  const triggeredChecks = checks.filter((c) => !c.passed);

  if (triggeredChecks.length === 0) {
    return {
      score: 5,
      verdict: 'safe',
      summary: 'No recognized phishing indicators or structural anomalies were detected. The entity appears legitimate.',
      triggeredChecks: [],
    };
  }

  // Weight tally
  let totalScore = 0;
  let hasCritical = false;
  let hasHigh = false;

  for (const check of triggeredChecks) {
    let multiplier = 1.0;
    if (check.severity === 'critical') {
      multiplier = 1.35;
      hasCritical = true;
    } else if (check.severity === 'high') {
      multiplier = 1.15;
      hasHigh = true;
    } else if (check.severity === 'medium') {
      multiplier = 0.95;
    } else {
      multiplier = 0.7;
    }

    totalScore += check.weight * multiplier;
  }

  // Cap score at 100 and guarantee minimum floors for critical findings
  if (hasCritical && totalScore < 72) {
    totalScore = 75;
  } else if (hasHigh && totalScore < 38) {
    totalScore = 40;
  }

  const score = Math.min(100, Math.round(totalScore));

  let verdict: Verdict;
  let summary: string;

  if (score >= 70) {
    verdict = 'dangerous';
    summary = `High risk detected (${triggeredChecks.length} red flags triggered). Critical indicators point to active phishing, credential harvesting, or deceptive spoofing.`;
  } else if (score >= 30) {
    verdict = 'suspicious';
    summary = `Moderate risk identified (${triggeredChecks.length} warning flags triggered). Anomalies found that warrant caution before interacting or submitting credentials.`;
  } else {
    verdict = 'safe';
    summary = `Low risk. Minor observations noted (${triggeredChecks.length} low-impact triggers), but no malicious patterns were identified.`;
  }

  return {
    score,
    verdict,
    summary,
    triggeredChecks,
  };
}
