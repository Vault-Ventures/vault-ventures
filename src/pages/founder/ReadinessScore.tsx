import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreDetail } from '../../components/ui/ScoreComponents';
import { IconArrowRight, IconAlertTriangle, IconTrendingUp } from '../../components/layout/Icons';

const FACTORS = [
  { name: 'Business Model Clarity', weight: 20, score: 82, explanation: 'Business model is well-defined with clear revenue streams and unit economics documented.', belowThreshold: false },
  { name: 'Market Potential', weight: 18, score: 75, explanation: 'TAM/SAM/SOM analysis present; SAM calculation methodology could be strengthened.', belowThreshold: false },
  { name: 'Traction & Validation', weight: 18, score: 42, explanation: 'Only 3 paying customers documented. Investor threshold is =20 paying customers or LOIs.', belowThreshold: true },
  { name: 'Team Completeness', weight: 15, score: 51, explanation: 'CTO role unfilled. Investors in AI/ML verticals expect a technical co-founder at Seed.', belowThreshold: true },
  { name: 'Financial Projections', weight: 12, score: 38, explanation: '3-year projections missing. Monthly burn rate and runway not documented.', belowThreshold: true, incomplete: true },
  { name: 'Competitive Analysis', weight: 10, score: 80, explanation: 'Competitive landscape well-mapped with defensible differentiation clearly stated.' },
  { name: 'Legal & IP Status', weight: 4, score: 90, explanation: 'Company incorporated, IP assigned, no outstanding cap table issues identified.' },
  { name: 'Funding Requirements', weight: 3, score: 88, explanation: 'Use of funds clearly broken down by milestone with allocation rationale.' },
];

const HISTORY = [
  { date: 'Apr 18', score: 78 },
  { date: 'Apr 4', score: 74 },
  { date: 'Mar 21', score: 68 },
  { date: 'Mar 7', score: 65 },
  { date: 'Feb 22', score: 61 },
];

const WEAK_SUGGESTIONS = FACTORS.filter(f => f.belowThreshold);

export default function ReadinessScore() {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  const overallScore = Math.round(FACTORS.reduce((acc, f) => acc + (f.score * f.weight / 100), 0));
  const band = overallScore >= 80 ? 'Investor-Ready' : overallScore >= 60 ? 'Developing' : 'Early Stage';
  const bandColor = overallScore >= 80 ? '#22C55E' : overallScore >= 60 ? '#F59E0B' : '#F04438';

  const r = 60, circ = 2 * Math.PI * r;

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Readiness Score</h1>
          <p className="text-[14px] text-[color:var(--vv-text-tertiary)] mt-0.5">NovaTech AI - Last updated Apr 18, 2024</p>
        </div>
        <Badge variant="neutral">Rule-based assessment</Badge>
      </div>

      {/* Weak area alert */}
      {WEAK_SUGGESTIONS.length > 0 && (
        <div className="mb-6 p-4 bg-amber-500/6 border border-amber-400/20 rounded-xl flex items-start gap-3">
          <IconAlertTriangle s={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">{WEAK_SUGGESTIONS.length} factors below investor threshold</p>
            <p className="text-[12px] text-[color:var(--vv-text-secondary)]">
              {WEAK_SUGGESTIONS.map(f => f.name).join(', ')} are dragging your score. Addressing these is the fastest path to the "Investor-Ready" band.
            </p>
          </div>
        </div>
      )}

      {FACTORS.some(f => f.incomplete) && (
        <div className="mb-6 p-3.5 bg-[#F59E0B]/6 border border-[#F59E0B]/20 rounded-xl">
          <p className="text-[12px] font-medium text-[color:var(--vv-text)] mb-0.5">Some inputs are incomplete</p>
          <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">
            The score is based on the information currently available. Add the missing financial projections to make this assessment more complete.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Gauge */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-6 flex flex-col items-center">
          <svg width="144" height="144" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r={r} fill="none" stroke="#1e2e45" strokeWidth="8" />
            <circle cx="72" cy="72" r={r} fill="none" stroke="#C67A4E" strokeWidth="8"
              strokeDasharray={`${(overallScore / 100) * circ} ${circ - (overallScore / 100) * circ}`}
              strokeLinecap="round" transform="rotate(-90 72 72)" />
            <text x="72" y="67" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'IBM Plex Mono', fontSize: '30px', fontWeight: 600, fill: '#C67A4E' }}>
              {overallScore}
            </text>
            <text x="72" y="88" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'Inter', fontSize: '11px', fill: '#5E6D8F' }}>/ 100</text>
          </svg>
          <p className="font-display text-lg font-semibold mt-2" style={{ color: bandColor }}>{band}</p>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">Readiness Score</p>
          <div className="mt-3 p-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-lg text-center w-full">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Calculated from <span className="text-[color:var(--vv-text)]">8 weighted factors</span></p>
            <button className="text-[12px] text-[#C67A4E] hover:underline mt-0.5">How is this calculated?</button>
          </div>
        </div>

        {/* Score history */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-5">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <IconTrendingUp s={14} className="text-[#22C55E]" /> Score History
          </p>
          <div className="space-y-2.5">
            {HISTORY.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] text-[color:var(--vv-text-tertiary)] w-14 flex-shrink-0">{h.date}</span>
                <div className="flex-1 h-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C67A4E] rounded-full transition-all" style={{ width: `${h.score}%` }} />
                </div>
                <span className="font-mono text-[12px] text-[#C67A4E] tabular-nums w-8 text-right">{h.score}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-4">Score is versioned on every business profile save.</p>
        </div>

        {/* Quick stats */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-5 space-y-3">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Score Summary</p>
          {[
            { label: 'Factors above threshold', value: `${FACTORS.filter(f => !f.belowThreshold).length}/${FACTORS.length}`, color: '#22C55E' },
            { label: 'Factors below threshold', value: `${WEAK_SUGGESTIONS.length}/${FACTORS.length}`, color: '#F04438' },
            { label: 'Incomplete data factors', value: `${FACTORS.filter(f => f.incomplete).length}/${FACTORS.length}`, color: '#F59E0B' },
            { label: 'Highest factor', value: 'Legal & IP - 90', color: '#C67A4E' },
            { label: 'Lowest factor', value: 'Financial Proj. - 38', color: '#F04438' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[color:var(--vv-border)] last:border-0">
              <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">{stat.label}</span>
              <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[color:var(--vv-border)]">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Factor Breakdown - sorted by weight</p>
        </div>
        <div className="divide-y divide-[#24304A]">
          {[...FACTORS].sort((a, b) => b.weight - a.weight).map((f, i) => (
            <div key={i}
              onClick={() => setExpandedFactor(expandedFactor === f.name ? null : f.name)}
              className={`px-5 py-4 cursor-pointer hover:bg-white/2 transition-colors ${f.belowThreshold ? 'border-l-2 border-amber-400' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-medium text-[color:var(--vv-text)]">{f.name}</span>
                    {f.belowThreshold && <Badge variant="warning">Below threshold</Badge>}
                    {f.incomplete && <Badge variant="warning">Incomplete</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden max-w-[240px]">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${f.score}%`, backgroundColor: f.score >= 70 ? '#C67A4E' : f.score >= 50 ? '#F59E0B' : '#F04438' }}
                      />
                    </div>
                    <span className="font-mono text-[12px] tabular-nums" style={{ color: f.score >= 70 ? '#C67A4E' : f.score >= 50 ? '#F59E0B' : '#F04438' }}>
                      {f.score}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{f.weight}% weight</p>
                </div>
              </div>
              {expandedFactor === f.name && (
                <div className="mt-3 p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-lg">
                  <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug mb-2">{f.explanation}</p>
                  {f.belowThreshold && (
                    <Button variant="tertiary" size="sm" iconRight={<IconArrowRight s={12} />}>View improvement suggestion</Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Improvement actions */}
      {WEAK_SUGGESTIONS.length > 0 && (
        <div>
          <p className="text-[14px] font-semibold text-[color:var(--vv-text)] mb-3">Improvement Actions</p>
          <div className="space-y-3">
            {WEAK_SUGGESTIONS.map((f, i) => (
              <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-[11px] font-bold text-amber-400">{f.score}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">{f.name} - <span className="text-amber-400">Below threshold</span></p>
                  <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{f.explanation}</p>
                </div>
                <Button size="sm" iconRight={<IconArrowRight s={12} />}>Edit profile</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}