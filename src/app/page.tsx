'use client';

import React, { useState } from 'react';
import { AnalysisReport, CheckResult } from '@/lib/engine/types';
import { SampleItem } from '@/lib/engine/samples';
import { saveScanToHistory } from '@/lib/storage/history';
import { RiskGauge } from '@/components/RiskGauge';
import { CheckCard } from '@/components/CheckCard';
import { RedirectTimeline } from '@/components/RedirectTimeline';
import { SamplePicker } from '@/components/SamplePicker';
import { ExportButton } from '@/components/ExportButton';
import {
  Terminal,
  ShieldAlert,
  Search,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  FileText,
  Globe,
  Mail,
  Sliders,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'auto' | 'url' | 'email'>('auto');
  const [traceRedirects, setTraceRedirects] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [activeTab, setActiveTab] = useState<'triggered' | 'all' | 'timeline' | 'metadata'>('triggered');

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) {
      setError('Please provide a URL or raw email content to inspect.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: {
        input: string;
        type?: 'url' | 'email';
        traceRedirects?: boolean;
      } = {
        input: input.trim(),
        traceRedirects,
      };

      if (inputType !== 'auto') {
        payload.type = inputType;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to complete security scan.');
      }

      const result: AnalysisReport = json.data;
      setReport(result);
      saveScanToHistory(result);

      if (result.triggeredChecks.length > 0) {
        setActiveTab('triggered');
      } else {
        setActiveTab('all');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown scan error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: SampleItem) => {
    setInput(sample.content);
    setInputType(sample.type);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setReport(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative border border-cyan-950/90 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#090f1a] to-[#06090e] shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="scanline-overlay" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
            <Terminal className="w-3.5 h-3.5" />
            <span>HEURISTIC THREAT DETECTOR</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-slate-100">
            Analyze suspicious <span className="text-cyan-400 underline decoration-cyan-500/40">URLs</span> &amp; <span className="text-cyan-400 underline decoration-cyan-500/40">Emails</span> in real-time.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
            Deconstruct deceptive hyperlinks, Typosquatting, lookalike domains, SPF/DKIM/DMARC auth failures, and URL redirect chains with SSRF protection.
          </p>
        </div>
      </div>

      {/* Built-in Sample Payload Selector */}
      <SamplePicker onSelectSample={handleSelectSample} />

      {/* Main Analysis Input Box */}
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="bg-[#090e18] border border-cyan-950/90 rounded-2xl p-5 sm:p-6 shadow-xl relative focus-within:border-cyan-500/60 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="text-cyan-400 font-bold">$</span>
              <span>Target Payload [URL or Raw Email with Headers]:</span>
            </div>

            {/* Input Type Selector and Redirect Toggle */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
                {(['auto', 'url', 'email'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInputType(t)}
                    className={`px-2.5 py-1 rounded capitalize transition-all ${
                      inputType === t
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'auto' ? 'Auto-Detect' : t}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={traceRedirects}
                  onChange={(e) => setTraceRedirects(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-[11px]">Trace Redirects (Up to 5 Hops)</span>
              </label>
            </div>
          </div>

          {/* Big Input Area */}
          <div className="relative">
            <textarea
              rows={7}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`Paste any suspicious URL (e.g., https://paypa1-security.xyz/login) or raw email text with headers (From:, Subject:, Authentication-Results:)...`}
              className="w-full bg-[#06090e] border border-slate-800 rounded-xl p-4 text-xs sm:text-sm font-mono text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 resize-y min-h-[140px]"
            />
            {input && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 p-1 rounded bg-slate-900/60 hover:bg-slate-800 transition-colors"
                title="Clear input"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-900">
            <div className="text-[11px] font-mono text-slate-500">
              Payload Length: <span className="text-slate-300">{input.length}</span> chars
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer"
              >
                <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Forensic Scan In Progress...' : 'Analyze Threat Payload'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Results Section */}
      {report && (
        <section className="space-y-6 pt-4 border-t border-cyan-950/80">
          {/* Header Bar with Target & Export */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#090d16] border border-cyan-950/80 rounded-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {report.inputType} SCAN
                </span>
                <span className="text-slate-400">ID: {report.id}</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">
                  {new Date(report.timestamp).toLocaleString()}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-mono font-semibold text-slate-100 break-all select-all">
                {report.target}
              </h2>
            </div>

            <ExportButton report={report} />
          </div>

          {/* Animated Circular Risk Gauge */}
          <RiskGauge
            score={report.score}
            verdict={report.verdict}
            summary={report.summary}
          />

          {/* Tab Filter Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('triggered')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === 'triggered'
                  ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Triggered Red Flags ({report.triggeredChecks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === 'all'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>All Checks ({report.checks.length})</span>
            </button>

            {report.inputType === 'url' && (
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Redirect Chain Timeline</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('metadata')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === 'metadata'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Forensic Data</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'triggered' && (
            <div className="space-y-3">
              {report.triggeredChecks.length === 0 ? (
                <div className="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-mono text-emerald-300">
                    No active red flags triggered!
                  </p>
                  <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
                    The examined payload satisfied all heuristic integrity checks without any critical anomalies.
                  </p>
                </div>
              ) : (
                report.triggeredChecks.map((check) => (
                  <CheckCard key={check.id} check={check} />
                ))
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="space-y-3">
              {report.checks.map((check) => (
                <CheckCard key={check.id} check={check} />
              ))}
            </div>
          )}

          {activeTab === 'timeline' && report.inputType === 'url' && (
            <RedirectTimeline
              initialUrl={report.target}
              existingHops={report.redirectHops}
            />
          )}

          {activeTab === 'metadata' && (
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold font-mono text-cyan-400">
                Extraction &amp; Heuristic Metadata Breakdown
              </h3>
              <pre className="text-xs font-mono bg-[#06090e] p-4 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                {JSON.stringify(report.metadata, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
