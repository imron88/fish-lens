import { AnalysisReport, CheckResult } from './types';
import { analyzeUrl, ParsedUrlData } from './url-analyzer';
import { analyzeEmail, ParsedEmailData } from './email-analyzer';
import { calculateRiskScore } from './scorer';

export function isLikelyEmail(input: string): boolean {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Check for standard RFC email headers
  const emailHeaderPatterns = [
    /^from:\s+/m,
    /^subject:\s+/m,
    /^received:\s+/m,
    /^authentication-results:\s+/m,
    /^return-path:\s+/m,
    /^reply-to:\s+/m,
    /^message-id:\s+/m,
    /^mime-version:\s+/m,
  ];

  let matches = 0;
  for (const pattern of emailHeaderPatterns) {
    if (pattern.test(lower)) {
      matches++;
    }
  }

  if (matches >= 2) return true;
  if (/^from:\s+.+@/im.test(trimmed)) return true;
  if (lower.startsWith('from:') && lower.includes('subject:')) return true;

  return false;
}

export function runAnalysis(
  rawInput: string,
  forceType?: 'url' | 'email'
): AnalysisReport {
  const trimmed = rawInput.trim();
  const isEmail = forceType ? forceType === 'email' : isLikelyEmail(trimmed);

  const reportId = 'fl-' + Math.random().toString(36).substring(2, 10);
  const timestamp = new Date().toISOString();

  if (isEmail) {
    const { parsed, checks } = analyzeEmail(trimmed);
    const { score, verdict, summary, triggeredChecks } = calculateRiskScore(checks);

    return {
      id: reportId,
      inputType: 'email',
      target: parsed.subject ? `Email: "${parsed.subject}"` : `Email from: ${parsed.from || 'Unknown'}`,
      timestamp,
      score,
      verdict,
      summary,
      checks,
      triggeredChecks,
      metadata: {
        from: parsed.from,
        sender: parsed.from,
        replyTo: parsed.replyTo,
        subject: parsed.subject,
        fromDomain: parsed.fromDomain,
        replyToDomain: parsed.replyToDomain,
        authResults: {
          spf: parsed.spfResult,
          dkim: parsed.dkimResult,
          dmarc: parsed.dmarcResult,
        },
        extractedUrlsCount: parsed.extractedLinks.length,
        extractedUrls: parsed.extractedLinks.map((l) => l.href),
        rawSnippet: trimmed.slice(0, 180),
      },
    };
  } else {
    const { parsed, checks } = analyzeUrl(trimmed);
    const { score, verdict, summary, triggeredChecks } = calculateRiskScore(checks);

    return {
      id: reportId,
      inputType: 'url',
      target: parsed.normalizedUrl || trimmed,
      timestamp,
      score,
      verdict,
      summary,
      checks,
      triggeredChecks,
      metadata: {
        hostname: parsed.hostname,
        domain: parsed.mainDomain,
        tld: parsed.tld,
        protocol: parsed.protocol,
        subdomains: parsed.subdomains,
        isIpAddress: /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname),
        length: trimmed.length,
      },
    };
  }
}

export * from './types';
export * from './constants';
export * from './levenshtein';
export * from './url-analyzer';
export * from './email-analyzer';
export * from './scorer';
export * from './samples';
