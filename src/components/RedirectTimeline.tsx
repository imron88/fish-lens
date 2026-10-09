'use client';

import React, { useState } from 'react';
import { HopInfo, RedirectHopAnalysis } from '@/lib/engine/types';
import { ArrowDown, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';

interface RedirectTimelineProps {
  initialUrl?: string;
  existingHops?: HopInfo[];
}

export function RedirectTimeline({ initialUrl, existingHops }: RedirectTimelineProps) {
  const [hops, setHops] = useState<HopInfo[] | null>(existingHops || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ssrfBlocked, setSsrfBlocked] = useState(false);

  const fetchTrace = async () => {
    if (!initialUrl) return;
    setLoading(true);
    setError(null);
    setSsrfBlocked(false);

    try {
      const res = await fetch('/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: initialUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to trace redirect hops');
      } else {
        const traceData: RedirectHopAnalysis = data.data;
        setHops(traceData.hops);
        setSsrfBlocked(traceData.blockedForSsrf);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during redirect trace';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusCode: number, isPrivateIp?: boolean) => {
    if (isPrivateIp || statusCode === 403) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-500/50">
          SSRF BLOCKED ({statusCode})
        </span>
      );
    }
    if ([301, 302, 303, 307, 308].includes(statusCode)) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-500/50">
          REDIRECT ({statusCode})
        </span>
      );
    }
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50">
          FINAL DESTINATION ({statusCode})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
        HTTP {statusCode || 'ERROR'}
      </span>
    );
  };

  return (
    <div className="bg-[#0b0f19] border border-cyan-950/80 rounded-xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold font-mono text-cyan-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Redirect Chain Hop Timeline</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Trace multi-hop redirects up to 5 hops with active SSRF private IP defense.
          </p>
        </div>

        {initialUrl && (
          <button
            onClick={fetchTrace}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Tracing Hops...' : 'Trace Redirects'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {ssrfBlocked && (
        <div className="mt-4 p-3 bg-red-950/50 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2 font-mono">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 animate-pulse" />
          <div>
            <span className="font-bold">SSRF DEFENSE TRIGGERED:</span> Connection aborted because the host resolved to a protected internal/loopback IP address.
          </div>
        </div>
      )}

      {!hops && !loading && (
        <div className="py-8 text-center text-slate-500 text-xs font-mono">
          Click &quot;Trace Redirects&quot; to probe the HTTP redirect chain and analyze landing endpoints safely.
        </div>
      )}

      {hops && hops.length > 0 && (
        <div className="mt-6 relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-950">
          {hops.map((hop, idx) => {
            const isLast = idx === hops.length - 1;
            return (
              <div key={hop.hopNumber} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#06090e] border border-cyan-500/50 flex items-center justify-center text-[10px] font-mono text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  {hop.hopNumber}
                </div>

                <div className="bg-[#090d16] border border-slate-800 rounded-lg p-3 hover:border-cyan-500/30 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Hop #{hop.hopNumber}
                    </span>
                    {getStatusBadge(hop.statusCode, hop.isPrivateIp)}
                  </div>

                  <p className="text-xs font-mono text-cyan-400 break-all select-all mb-2">
                    {hop.url}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500">Resolved IP: </span>
                      <span className={hop.isPrivateIp ? 'text-red-400 font-bold' : 'text-slate-300'}>
                        {hop.ip || 'N/A'}
                      </span>
                    </div>
                    {hop.location && (
                      <div className="sm:col-span-2 text-amber-300/90 break-all">
                        <span className="text-slate-500">Redirects To: </span>
                        {hop.location}
                      </div>
                    )}
                    {hop.error && (
                      <div className="sm:col-span-2 text-red-400 break-all">
                        <span className="text-slate-500">Notice: </span>
                        {hop.error}
                      </div>
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div className="flex justify-center -my-2 py-1 text-cyan-700">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
