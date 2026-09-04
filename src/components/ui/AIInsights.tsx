import React, { useState } from 'react';

// -- AIBadge -------------------------------------------------------------------

export function AIBadge({ label = 'AI' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-widest uppercase select-none leading-none"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#93A1BF' }}>
      ? {label}
    </span>
  );
}

// -- MatchScoreRing ------------------------------------------------------------

export function MatchScoreRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 52 : 76;
  const r = size === 'sm' ? 21 : 31;
  const sw = size === 'sm' ? 4 : 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? 'var(--color-trust-gold)' : score >= 50 ? 'var(--color-info)' : 'var(--color-text-tertiary)';
  const fontSize = size === 'sm' ? 12 : 17;
  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
      <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
      <circle
        cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${circ}`} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${dim / 2} ${dim / 2})`} />
      <text x={dim / 2} y={dim / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'IBM Plex Mono', fontSize: `${fontSize}px`, fontWeight: 600, fill: color }}>
        {score}
      </text>
    </svg>
  );
}

// -- MatchScoreChip ------------------------------------------------------------

export function MatchScoreChip({ score, contextLabel, onClick }: { score: number; contextLabel?: string; onClick?: () => void }) {
  const color = score >= 75 ? 'var(--color-trust-gold)' : score >= 50 ? 'var(--color-info)' : 'var(--color-text-tertiary)';
  const bg = score >= 75 ? 'rgba(198,122,78,0.10)' : score >= 50 ? 'rgba(201,162,75,0.10)' : 'rgba(94,109,143,0.12)';
  const border = score >= 75 ? 'rgba(198,122,78,0.28)' : score >= 50 ? 'rgba(201,162,75,0.28)' : 'rgba(94,109,143,0.28)';
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      {...(onClick ? { onClick, type: 'button' as const } : {})}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold transition-opacity ${onClick ? 'hover:opacity-80 cursor-pointer' : ''}`}
      style={{ background: bg, border: `1px solid ${border}`, color }}>
      <span>{score}% match</span>
      {contextLabel && <span className="font-normal opacity-75">- {contextLabel}</span>}
    </Tag>
  );
}

// -- MatchFactors (inline expandable, used in sidebar) -------------------------

export interface MatchFactor {
  label: string;
  description: string;
  positive: boolean;
}

export function MatchFactors({
  factors,
  defaultExpanded = false,
}: {
  factors: MatchFactor[];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline transition-colors">
        {expanded ? 'Hide match details' : 'Why this match?'}
        <svg
          width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-2.5 space-y-2">
          {factors.map((f, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[11px] mt-0.5 shrink-0 font-bold" style={{ color: f.positive ? '#22C55E' : '#F59E0B' }}>
                {f.positive ? '+' : '-'}
              </span>
              <div>
                <p className="text-[11.5px] font-medium text-[color:var(--vv-text-secondary)]">{f.label}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- ImprovementItem -----------------------------------------------------------

export interface ImprovementItemData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function ImprovementItem({ title, description, priority }: ImprovementItemData) {
  const pColor = priority === 'high' ? '#F04438' : priority === 'medium' ? '#F59E0B' : '#5E6D8F';
  const pLabel = priority === 'high' ? 'HIGH' : priority === 'medium' ? 'MED' : 'LOW';
  return (
    <div className="flex gap-3 py-3 border-b border-[#1c2a3e] last:border-0">
      <div className="shrink-0 w-8 text-right pt-0.5">
        <span className="text-[9px] font-bold tracking-widest" style={{ color: pColor }}>{pLabel}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mb-0.5">{title}</p>
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{description}</p>
      </div>
    </div>
  );
}

// -- AIDisclaimer --------------------------------------------------------------

export function AIDisclaimer({ match = false }: { match?: boolean }) {
  return (
    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed mt-3 pt-3 border-t border-[#1c2a3e]">
      {match
        ? 'Match scores are based on profile alignment and are informational only. They do not guarantee suitability or investment outcomes.'
        : 'This analysis is informational and generated for review purposes. It does not constitute financial, legal, or investment advice.'}
    </p>
  );
}

// -- AnalysisLoading -----------------------------------------------------------

export function AnalysisLoading() {
  return (
    <div className="animate-pulse space-y-3 py-2">
      <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-3/4" />
      <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-full" />
      <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-5/6" />
      <div className="flex gap-2 mt-4">
        <div className="h-5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-16" />
        <div className="h-5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-20" />
        <div className="h-5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-14" />
      </div>
    </div>
  );
}

// -- AnalysisUnavailable -------------------------------------------------------

export function AnalysisUnavailable({ reason }: { reason?: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
        style={{ background: 'rgba(94,109,143,0.10)', border: '1px solid rgba(94,109,143,0.20)' }}>
        <svg width="15" height="15" fill="none" stroke="#5E6D8F" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
      </div>
      <p className="text-[12.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">Analysis Unavailable</p>
      <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] max-w-[220px] mx-auto leading-snug">
        {reason ?? 'Not enough data available to generate an analysis for this business.'}
      </p>
    </div>
  );
}

// -- Match Detail Interfaces ---------------------------------------------------

export interface AlignmentFactor {
  factor: string;
  score: number;
  description: string;
}

export interface GapFactor {
  factor: string;
  description: string;
  severity: 'moderate' | 'weak' | 'clarification';
}

export interface MatchDetail {
  score: number;
  entityName: string;
  summary: string;
  alignments: AlignmentFactor[];
  gaps: GapFactor[];
  whyThisMatch: string[];
  contextLabel?: string;
}

// -- Match Explanation Drawer sub-components -----------------------------------

function AlignmentFactorRow({ factor, score, description }: AlignmentFactor) {
  const config = score >= 80
    ? { label: 'Strong', color: '#22C55E' }
    : score >= 65
    ? { label: 'Good', color: '#C67A4E' }
    : score >= 50
    ? { label: 'Moderate', color: '#F59E0B' }
    : { label: 'Weak', color: '#F04438' };
  return (
    <div className="py-3 border-b border-[#1c2a3e] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{factor}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: config.color }}>
            {config.label}
          </span>
          <span className="font-mono text-[11.5px] tabular-nums" style={{ color: config.color }}>{score}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden mb-1.5">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: config.color }} />
      </div>
      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{description}</p>
    </div>
  );
}

function GapFactorRow({ factor, description, severity }: GapFactor) {
  const config = severity === 'moderate'
    ? { text: 'Moderate', color: '#F59E0B' }
    : severity === 'weak'
    ? { text: 'Weak', color: '#F04438' }
    : { text: 'Needs Clarification', color: '#5E6D8F' };
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0">
      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: config.color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-[12px] font-medium text-[color:var(--vv-text)]">{factor}</span>
          <span className="text-[9.5px] font-bold uppercase tracking-wide shrink-0" style={{ color: config.color }}>
            {config.text}
          </span>
        </div>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{description}</p>
      </div>
    </div>
  );
}

// -- MatchExplanationDrawer ----------------------------------------------------

export function MatchExplanationDrawer({
  data,
  cta,
  onClose,
}: {
  data: MatchDetail;
  cta?: { label: string; href?: string; action?: () => void };
  onClose: () => void;
}) {
  const { score } = data;
  const scoreLabel = score >= 80 ? 'Strong Match' : score >= 65 ? 'Good Match' : score >= 50 ? 'Moderate Match' : 'Developing Match';
  const scoreColor = score >= 80 ? 'var(--color-trust-gold)' : score >= 65 ? 'var(--color-info)' : 'var(--color-text-tertiary)';

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="ai-insights-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full sm:max-w-[460px] bg-[#0D1626] border-l border-[#1c2a3e] flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2a3e] shrink-0"
          style={{ background: 'rgba(198,122,78,0.03)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <AIBadge label="AI Match Analysis" />
            <span id="ai-insights-title" className="text-[11.5px] text-[color:var(--vv-text-tertiary)] truncate">{data.entityName}</span>
            {data.contextLabel && <span className="text-[10.5px] text-[#C67A4E] truncate">{data.contextLabel}</span>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI match analysis"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors shrink-0 ml-2">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Score hero */}
          <div className="mx-5 mt-5 p-4 rounded-[12px]"
            style={{ background: 'rgba(198,122,78,0.04)', border: '1px solid rgba(198,122,78,0.16)' }}>
            <div className="flex items-center gap-4">
              <MatchScoreRing score={score} size="md" />
              <div className="min-w-0">
                <p className="font-mono text-[28px] font-bold leading-none mb-0.5" style={{ color: scoreColor }}>
                  {score}%
                </p>
                <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-1">{scoreLabel}</p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{data.summary}</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 space-y-5">

            {/* Strongest Alignments */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">
                Strongest Alignments
              </p>
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-1">
                {data.alignments.map(a => <AlignmentFactorRow key={a.factor} {...a} />)}
              </div>
            </div>

            {/* Potential Gaps */}
            {data.gaps.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">
                  Potential Gaps
                </p>
                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  {data.gaps.map((g, i) => <GapFactorRow key={i} {...g} />)}
                </div>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-2 leading-snug">
                  Gaps are shown constructively - areas to review, not disqualifying factors.
                </p>
              </div>
            )}

            {/* Why this match */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-2.5">
                Why This Match?
              </p>
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-4 space-y-2.5">
                {data.whyThisMatch.map((line, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="text-[#C67A4E] shrink-0 mt-0.5 text-[12px]">-</span>
                    <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI transparency */}
            <div className="pt-1 border-t border-[#1c2a3e]">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
                <span style={{ color: '#C67A4E' }}>?</span>{' '}
                Generated from available profile, business, and preference information.
                Match scores are recommendations, not guarantees.
                Review the underlying information before making decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1c2a3e] shrink-0 flex flex-col gap-2">
          {cta && (
            cta.href ? (
              <a href={cta.href}>
                <button className="w-full h-9 px-4 rounded-md text-[13px] font-semibold text-[color:var(--vv-on-copper)] bg-[#C67A4E] hover:bg-[#d4895f] transition-colors">
                  {cta.label}
                </button>
              </a>
            ) : (
              <button
                onClick={() => { cta.action?.(); onClose(); }}
                className="w-full h-9 px-4 rounded-md text-[13px] font-semibold text-[color:var(--vv-on-copper)] bg-[#C67A4E] hover:bg-[#d4895f] transition-colors">
                {cta.label}
              </button>
            )
          )}
          <button
            onClick={onClose}
            className="w-full h-9 px-4 rounded-md text-[12.5px] font-medium text-[color:var(--vv-text-secondary)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] hover:border-[#5E6D8F] hover:text-[color:var(--vv-text)] transition-colors">
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}