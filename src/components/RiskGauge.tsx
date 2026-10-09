'use client';

import React, { useEffect, useState } from 'react';
import { Verdict } from '@/lib/engine/types';
import { ShieldCheck, AlertTriangle, Skull } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
  verdict: Verdict;
  summary: string;
}

export function RiskGauge({ score, verdict, summary }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Radius and circumference for SVG circle
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  let colorScheme = {
    stroke: '#10b981',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/20',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    label: 'SAFE',
    icon: ShieldCheck,
  };

  if (verdict === 'dangerous') {
    colorScheme = {
      stroke: '#ef4444',
      text: 'text-red-400',
      border: 'border-red-500/40',
      bg: 'bg-red-950/25',
      glow: 'shadow-[0_0_25px_rgba(239,68,68,0.35)]',
      label: 'DANGEROUS',
      icon: Skull,
    };
  } else if (verdict === 'suspicious') {
    colorScheme = {
      stroke: '#f59e0b',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/25',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      label: 'SUSPICIOUS',
      icon: AlertTriangle,
    };
  }

  const Icon = colorScheme.icon;

  return (
    <div className={`p-6 rounded-xl border ${colorScheme.border} ${colorScheme.bg} ${colorScheme.glow} backdrop-blur-sm transition-all duration-500`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Animated Circular Gauge */}
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background Track Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Value Progress Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={colorScheme.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease',
              }}
            />
          </svg>

          {/* Central Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${colorScheme.text}`}>
              {animatedScore}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              / 100 RISK
            </span>
          </div>
        </div>

        {/* Verdict Details and Summary */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${colorScheme.border} ${colorScheme.text} bg-[#06090e]/80`}>
              <Icon className="w-3.5 h-3.5" />
              <span>Verdict: {colorScheme.label}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Confidence Score Analysis
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-100 font-mono">
            {verdict === 'dangerous'
              ? 'Phishing or Malicious Threat Indicators Identified'
              : verdict === 'suspicious'
              ? 'Abnormal Heuristics & Potential Impersonation'
              : 'Minimal Phishing Probability Verified'}
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
