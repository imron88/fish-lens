'use client';

import React, { useState } from 'react';
import { AnalysisReport } from '@/lib/engine/types';
import { Download, Check, Copy } from 'lucide-react';

interface ExportButtonProps {
  report: AnalysisReport;
}

export function ExportButton({ report }: ExportButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fishlens-report-${report.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyJson}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
        title="Copy JSON report to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy JSON</span>
          </>
        )}
      </button>

      <button
        onClick={handleDownloadJson}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
        title="Download forensic report JSON"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span>Export Report JSON</span>
      </button>
    </div>
  );
}
