'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnalysisReport } from '@/lib/engine/types';
import { getScanHistory, removeScanFromHistory, clearScanHistory } from '@/lib/storage/history';
import { RiskGauge } from '@/components/RiskGauge';
import { CheckCard } from '@/components/CheckCard';
import { ExportButton } from '@/components/ExportButton';
import {
  History,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Mail,
  ArrowRight,
  Clock,
  Download,
  X,
} from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  const handleClearAll = () => {
    if (confirm('Clear all local scan history?')) {
      clearScanHistory();
      setHistory([]);
      setSelectedReport(null);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeScanFromHistory(id);
    setHistory(updated);
    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    if (verdict === 'dangerous') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-500/40">
          DANGEROUS
        </span>
      );
    }
    if (verdict === 'suspicious') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
          SUSPICIOUS
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
        SAFE
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-cyan-950/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <History className="w-4 h-4" />
            <span>LOCAL FORENSIC ARCHIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono text-slate-100">
            Scan History &amp; Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
            Past threat analysis results cached in your browser&apos;s local storage.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900/50 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* History List or Empty State */}
      {history.length === 0 ? (
        <div className="text-center py-20 bg-[#090d16] border border-cyan-950/60 rounded-2xl p-8 space-y-4">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-mono font-bold text-slate-200">
            No Scan History Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-md mx-auto">
            You haven&apos;t analyzed any URLs or emails yet in this browser session. Past analyses will be automatically recorded here.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              <span>Launch Analyzer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History Cards Column */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between px-1">
              <span>Saved Records: {history.length}</span>
              <span>Sorted by Most Recent</span>
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {history.map((item) => {
                const isSelected = selectedReport?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReport(item)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-[#090d16] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        {item.inputType === 'url' ? (
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span className="uppercase text-[10px] font-bold">
                          {item.inputType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getVerdictBadge(item.verdict)}
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xs sm:text-sm font-mono font-semibold text-slate-200 line-clamp-2 break-all mb-2">
                      {item.target}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                      <span>Score: <strong className="text-slate-300">{item.score}/100</strong></span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Detail View Column */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-[#090d16] border border-cyan-950/80 rounded-2xl p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>REPORT DETAIL</span>
                      <span>•</span>
                      <span>{new Date(selectedReport.timestamp).toLocaleString()}</span>
                    </div>
                    <h2 className="text-base font-mono font-semibold text-slate-100 break-all select-all mt-1">
                      {selectedReport.target}
                    </h2>
                  </div>

                  <ExportButton report={selectedReport} />
                </div>

                <RiskGauge
                  score={selectedReport.score}
                  verdict={selectedReport.verdict}
                  summary={selectedReport.summary}
                />

                <div className="space-y-3">
                  <h3 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Triggered Findings ({selectedReport.triggeredChecks.length}):
                  </h3>
                  {selectedReport.triggeredChecks.length === 0 ? (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300">
                      Zero red flags triggered. The examined payload passed all structural heuristics.
                    </div>
                  ) : (
                    selectedReport.triggeredChecks.map((check) => (
                      <CheckCard key={check.id} check={check} />
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-[#090d16]/50 border border-slate-800/80 rounded-2xl text-center space-y-2">
                <ShieldAlert className="w-10 h-10 text-slate-600" />
                <h3 className="text-sm font-mono text-slate-300">
                  Select a past scan from the list
                </h3>
                <p className="text-xs text-slate-500 font-sans max-w-sm">
                  Click any entry on the left to inspect its complete risk gauge score, triggered red flags, and forensic metadata.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
