'use client';

import React from 'react';
import { SAMPLES, SampleItem } from '@/lib/engine/samples';
import { Sparkles, Globe, Mail, ShieldAlert } from 'lucide-react';

interface SamplePickerProps {
  onSelectSample: (sample: SampleItem) => void;
}

export function SamplePicker({ onSelectSample }: SamplePickerProps) {
  const urlSamples = SAMPLES.filter((s) => s.type === 'url');
  const emailSamples = SAMPLES.filter((s) => s.type === 'email');

  return (
    <div className="bg-[#090d16] border border-cyan-950/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-mono text-cyan-400">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span className="font-bold uppercase tracking-wider">Quick 1-Click Threat Demos:</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* URL Samples */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            <span>Phishing URL Vectors:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {urlSamples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-left bg-slate-900/80 hover:bg-cyan-950/50 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all text-slate-300"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sample.expectedVerdict === 'dangerous'
                        ? 'bg-red-500'
                        : sample.expectedVerdict === 'suspicious'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{sample.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Email Samples */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
            <Mail className="w-3.5 h-3.5 text-cyan-500" />
            <span>Raw Email Vectors:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {emailSamples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-left bg-slate-900/80 hover:bg-cyan-950/50 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all text-slate-300"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sample.expectedVerdict === 'dangerous'
                        ? 'bg-red-500'
                        : sample.expectedVerdict === 'suspicious'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{sample.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
