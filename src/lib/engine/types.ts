export type CheckSeverity = 'low' | 'medium' | 'high' | 'critical';

export type CheckCategory = 'url' | 'email' | 'authentication' | 'content';

export interface CheckResult {
  id: string;
  name: string;
  category: CheckCategory;
  passed: boolean;
  weight: number;
  severity: CheckSeverity;
  explanation: string;
  details?: Record<string, unknown> | string;
}

export type Verdict = 'safe' | 'suspicious' | 'dangerous';

export interface HopInfo {
  hopNumber: number;
  url: string;
  statusCode: number;
  statusText?: string;
  location?: string | null;
  ip?: string;
  isPrivateIp?: boolean;
  error?: string;
}

export interface AnalysisReport {
  id: string;
  inputType: 'url' | 'email';
  target: string;
  timestamp: string;
  score: number;
  verdict: Verdict;
  summary: string;
  checks: CheckResult[];
  triggeredChecks: CheckResult[];
  metadata: {
    hostname?: string;
    domain?: string;
    tld?: string;
    protocol?: string;
    sender?: string;
    from?: string;
    replyTo?: string;
    subject?: string;
    authResults?: {
      spf?: string;
      dkim?: string;
      dmarc?: string;
    };
    extractedUrlsCount?: number;
    extractedUrls?: string[];
    [key: string]: unknown;
  };
  redirectHops?: HopInfo[];
}

export interface RedirectHopAnalysis {
  hops: HopInfo[];
  finalUrl: string;
  hasRedirectLoop: boolean;
  blockedForSsrf: boolean;
  error?: string;
}
