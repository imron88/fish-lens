'use client';

import React, { useState } from 'react';
import { CheckResult } from '@/lib/engine/types';
import { CheckCircle2, AlertOctagon, ChevronDown, ChevronUp, Shield, Info } from 'lucide-react';

interface CheckCardProps {
  check: CheckResult;
}

export function CheckCard({ check }: CheckCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityBadge = () => {
    switch (check.severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/40">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            Medium Warning
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700">
            Low Impact
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-200 ${
        check.passed
          ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
          : 'bg-[#0f141e]/90 border-red-950/70 shadow-[0_0_15px_rgba(239,68,68,0.08)] hover:border-red-800/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {check.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold font-mono text-slate-100">
                {check.name}
              </h4>
              {!check.passed && getSeverityBadge()}
              <span className="text-[11px] font-mono text-slate-500">
                Weight: +{check.weight}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              {check.explanation}
            </p>
          </div>
        </div>

        {check.details && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-cyan-400 p-1 rounded transition-colors"
            title="Inspect check metadata"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded technical details */}
      {expanded && check.details && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 mb-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Forensic Metadata:</span>
          </div>
          <pre className="text-[11px] font-mono bg-[#06090e] p-2.5 rounded border border-slate-800 text-slate-300 overflow-x-auto">
            {typeof check.details === 'string'
              ? check.details
              : JSON.stringify(check.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
