import React, { useState } from 'react';

interface ScoreChipProps {
  score: number;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
  topFactors?: string[];
}

export function ScoreChip({ score, label = 'Match', onClick, topFactors }: ScoreChipProps) {
  const [showTip, setShowTip] = useState(false);
  const color = score >= 80 ? 'var(--color-trust-gold)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  const r = 9, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative inline-flex">
      <button
        onClick={e => onClick?.(e)}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded vv-control border hover:border-[#5E6D8F] transition-colors cursor-pointer vv-focus"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
          <circle cx="12" cy="12" r={r} fill="none" stroke="#24304A" strokeWidth="2.5"/>
          <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
          />
        </svg>
        <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color }}>{score}%</span>
        <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{label}</span>
      </button>
      {showTip && topFactors && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50 w-52 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-lg p-3 shadow-xl">
          <p className="text-[10px] font-semibold text-[#C67A4E] mb-1.5 uppercase tracking-widest">Top Factors</p>
          {topFactors.map((f, i) => (
            <p key={i} className="text-[11.5px] text-[color:var(--vv-text-secondary)] py-0.5">{f}</p>
          ))}
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1.5">Click to view full breakdown</p>
        </div>
      )}
    </div>
  );
}

interface FactorBar {
  name: string;
  weight: number;
  score: number;
  explanation: string;
  incomplete?: boolean;
  belowThreshold?: boolean;
}

interface ScoreDetailProps {
  score: number;
  label: string;
  qualitativeBand: string;
  factors: FactorBar[];
  title: string;
  subtitle?: string;
  type?: 'match' | 'readiness';
  partyA?: { name: string };
  partyB?: { name: string };
  onClose?: () => void;
}

export function ScoreDetail({
  score, label, qualitativeBand, factors, title, subtitle,
  type = 'match', partyA, partyB, onClose
}: ScoreDetailProps) {
  const color = score >= 80 ? 'var(--color-trust-gold)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const sorted = [...factors].sort((a, b) => b.weight - a.weight);

  return (
    <div className="vv-surface border rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[color:var(--vv-border)]">
        <div>
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-0.5">{title}</p>
          {subtitle && <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">{subtitle}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>
      <div className="p-5">
        {/* Gauge + parties */}
        <div className="flex items-center gap-6 mb-5">
          {type === 'match' && partyA && (
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[12px] font-semibold text-[color:var(--vv-text)]">{partyA.name[0]}</div>
              <span className="text-[10px] text-[color:var(--vv-text-tertiary)] truncate max-w-[64px] text-center">{partyA.name}</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={r} fill="none" stroke="#182338" strokeWidth="7"/>
              <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="7"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="56" textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'IBM Plex Mono', fontSize: '24px', fontWeight: 600, fill: color }}>
                {score}
              </text>
              <text x="60" y="74" textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'Inter', fontSize: '10px', fill: '#5E6D8F' }}>/ 100</text>
            </svg>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display leading-none">{qualitativeBand}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{label}</p>
            </div>
          </div>
          {type === 'match' && partyB && (
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className="w-8 h-8 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[12px] font-semibold text-[color:var(--vv-text)]">{partyB.name[0]}</div>
              <span className="text-[10px] text-[color:var(--vv-text-tertiary)] truncate max-w-[64px] text-center">{partyB.name}</span>
            </div>
          )}
        </div>

        {/* Formula line */}
        <div className="mb-4 px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
            Calculated from <span className="text-[color:var(--vv-text)] font-medium">{factors.length} weighted factors</span> -{' '}
            <button className="text-[#C67A4E] hover:underline">How is this calculated?</button>
          </p>
        </div>

        {/* Factor breakdown */}
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Factor Breakdown</p>
        <div className="space-y-2">
          {sorted.map((f, i) => {
            const fc = f.score >= 70 ? 'var(--color-trust-gold)' : f.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
            return (
              <div key={i} className={`rounded-md p-3 ${f.belowThreshold ? 'border-l-2 border-amber-400 bg-amber-500/4 pl-2.5' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[color:var(--vv-text)]">{f.name}</span>
                    {f.incomplete && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wide">Incomplete</span>}
                    {f.belowThreshold && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wide">Below threshold</span>}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">{f.weight}%</span>
                    <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: fc }}>{f.score}</span>
                  </div>
                </div>
                <div className="h-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${f.score}%`, backgroundColor: fc }} />
                </div>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{f.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}