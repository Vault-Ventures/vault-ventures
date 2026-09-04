import React, { useEffect } from 'react';
import { Button } from './Button';

// --- Types --------------------------------------------------------------------

export type MatchRole = 'founder' | 'investor' | 'professional';

export interface MatchFactor {
  name: string;
  score: number; // 0-100
  weight: number; // relative display weight 1-5
  explanation: string;
}

export interface MatchExplainData {
  score: number;
  subjectName: string; // investor / professional / business name
  subjectInitials: string;
  subjectRole: string; // e.g. "Seed-stage Investor", "HealthTech Specialist"
  summaryLine: string; // "Strong alignment across industry, stage, and thesis."
  factors: MatchFactor[];
  whyBullets: string[]; // "Both are focused on HealthTech." etc.
  ctaLabel: string;
  onCta?: () => void;
  viewerRole: MatchRole;
}

interface Props {
  data: MatchExplainData | null;
  state?: 'loading' | 'error' | 'insufficient' | 'ready';
  onClose: () => void;
}

// --- Helpers ------------------------------------------------------------------

function bandLabel(score: number) {
  if (score >= 85) return 'Strong Match';
  if (score >= 70) return 'Good Match';
  if (score >= 55) return 'Moderate Match';
  return 'Weak Match';
}

function strengthLabel(score: number) {
  if (score >= 80) return 'Strong';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Moderate';
  return 'Weak';
}

function factorColor(score: number) {
  if (score >= 65) return '#C67A4E';
  if (score >= 45) return '#F59E0B';
  return '#F04438';
}

function strengthDot(score: number) {
  const color = factorColor(score);
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px]"
      style={{ background: color }}
    />
  );
}

// --- Radial gauge -------------------------------------------------------------

function Gauge({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const band = bandLabel(score);

  // Dichroic stroke: interpolate cyan ? rose-gold with gradient id
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <defs>
          <linearGradient id="mg-arc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7A4527" />
            <stop offset="55%" stopColor="#C67A4E" />
            <stop offset="100%" stopColor="#E8A878" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="52" cy="52" r={r} fill="none" stroke="rgba(198,122,78,0.08)" strokeWidth="6" />
        {/* Fill */}
        <circle
          cx="52" cy="52" r={r} fill="none"
          stroke="url(#mg-arc)" strokeWidth="6"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 52 52)"
          style={{ filter: 'drop-shadow(0 0 6px rgba(198,122,78,0.35))' }}
        />
        {/* Score text */}
        <text x="52" y="47" textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '22px', fontWeight: 700, fill: '#EAF0FA' }}>
          {score}
        </text>
        <text x="52" y="64" textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '9.5px', fill: '#5E6D8F' }}>
          / 100
        </text>
      </svg>
      <div className="text-center">
        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] font-display leading-none">{band}</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">AI Match Score</p>
      </div>
    </div>
  );
}

// --- Factor row ---------------------------------------------------------------

function FactorRow({ f }: { f: MatchFactor }) {
  const color = factorColor(f.score);
  const label = strengthLabel(f.score);
  return (
    <div className="py-2.5 border-b border-[#1c2a3e] last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {strengthDot(f.score)}
          <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{f.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] px-1.5 py-0.5 rounded border"
            style={{ color, borderColor: `${color}30`, background: `${color}0e` }}>
            {label}
          </span>
          <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color }}>
            {f.score}
          </span>
        </div>
      </div>
      <div className="h-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden mb-1.5 ml-3.5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${f.score}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug ml-3.5">{f.explanation}</p>
    </div>
  );
}

// --- Loading / Error / Insufficient -------------------------------------------

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      {/* Pulsing radial placeholder */}
      <div className="relative w-[88px] h-[88px]">
        <div className="absolute inset-0 rounded-full border-4 border-[#182338]" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#C67A4E] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <div className="text-center">
        <div className="flex items-center gap-1.5 text-[12.5px] text-[color:var(--vv-text-secondary)] mb-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          <span style={{ color: '#A78BFA' }}>AI</span>
          <span>Analyzing match-</span>
        </div>
        <div className="space-y-1.5 mt-3">
          {[80, 60, 72].map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] animate-pulse" style={{ width: `${w}%`, margin: '0 auto' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
      <div className="w-11 h-11 rounded-full bg-[#F04438]/10 border border-[#F04438]/20 flex items-center justify-center">
        <svg width="18" height="18" fill="none" stroke="#F04438" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <p className="text-[13px] font-medium text-[color:var(--vv-text)]">Match analysis unavailable</p>
      <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] max-w-[240px]">Unable to generate a match analysis at this time.</p>
      {onRetry && (
        <button onClick={onRetry}
          className="mt-1 text-[12px] text-[#C67A4E] hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

function InsufficientState() {
  const items = ['Complete your profile', 'Add investment preferences', 'Add relevant skills'];
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
      <div className="w-11 h-11 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
        <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <path d="M12 9v4M12 17h.01"/>
        </svg>
      </div>
      <p className="text-[13px] font-medium text-[color:var(--vv-text)]">Not enough data for a reliable analysis</p>
      <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] max-w-[240px] leading-snug">Complete the following to improve your match quality:</p>
      <ul className="w-full max-w-[220px] text-left space-y-1.5 mt-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-[11.5px] text-[color:var(--vv-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35446A] flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Main Drawer --------------------------------------------------------------

export function MatchExplainDrawer({ data, state = 'ready', onClose }: Props) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const topFactors = data ? [...data.factors].sort((a, b) => b.score - a.score).slice(0, 3) : [];
  const gapFactors = data ? [...data.factors].filter(f => f.score < 65).sort((a, b) => a.score - b.score) : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[440px] flex flex-col overflow-hidden"
        role="dialog" aria-modal="true" aria-labelledby="match-analysis-title"
        style={{
          background: 'rgba(6,10,16,0.97)',
          backdropFilter: 'blur(32px) saturate(160%)',
          boxShadow: '-1px 0 0 rgba(198,122,78,0.07), -8px 0 48px rgba(0,0,0,0.64), inset 1px 0 0 rgba(255,255,255,0.04)',
          borderLeft: '1px solid rgba(180,200,220,0.09)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2a3e] flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* AI indicator */}
            <div
              className="flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border"
              style={{ color: '#A78BFA', borderColor: 'rgba(167,139,250,0.22)', background: 'rgba(167,139,250,0.07)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
              AI
            </div>
            <span id="match-analysis-title" className="text-[13px] font-semibold text-[color:var(--vv-text)] font-display">Match Analysis</span>
          </div>
          <button onClick={onClose} aria-label="Close match analysis" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1 -mr-1">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Loading */}
          {state === 'loading' && <LoadingState />}
          {state === 'error' && <ErrorState />}
          {state === 'insufficient' && <InsufficientState />}

          {state === 'ready' && data && (
            <div className="px-5 py-4 space-y-5">

              {/* Subject identity + gauge */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-[14px] font-semibold text-[color:var(--vv-text)]"
                    style={{ background: 'linear-gradient(135deg, rgba(198,122,78,0.18), rgba(198,122,78,0.14))', border: '1px solid rgba(198,122,78,0.18)' }}>
                    {data.subjectInitials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] truncate">{data.subjectName}</p>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] truncate">{data.subjectRole}</p>
                </div>
                <Gauge score={data.score} />
              </div>

              {/* Summary sentence */}
              <div
                className="rounded-lg px-3.5 py-3 text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed"
                style={{ background: 'rgba(198,122,78,0.04)', border: '1px solid rgba(198,122,78,0.09)' }}>
                {data.summaryLine}
              </div>

              {/* Why this match */}
              <div>
                <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-2">Why this match?</p>
                <ul className="space-y-1.5">
                  {data.whyBullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">
                      <svg className="flex-shrink-0 mt-0.5" width="12" height="12" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strongest alignments */}
              {topFactors.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-2">Strongest Alignments</p>
                  <div className="flex flex-wrap gap-2">
                    {topFactors.map((f, i) => (
                      <div key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px]"
                        style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.14)' }}>
                        <span className="font-medium text-[color:var(--vv-text)]">{f.name}</span>
                        <span className="font-mono text-[#C67A4E] font-semibold">{f.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-[#1c2a3e]" />

              {/* Factor breakdown */}
              <div>
                <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-1">Factor Breakdown</p>
                <div>
                  {data.factors.map((f, i) => <FactorRow key={i} f={f} />)}
                </div>
              </div>

              {/* Potential gaps */}
              {gapFactors.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-2">Potential Gaps</p>
                  <div className="rounded-lg overflow-hidden border border-[color:var(--vv-border)]">
                    {gapFactors.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 px-3.5 py-2.5 border-b border-[#1c2a3e] last:border-0 bg-[rgba(245,158,11,0.02)]">
                        <svg className="flex-shrink-0 mt-0.5" width="13" height="13" fill="none" stroke="#F59E0B" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          <path d="M12 9v4M12 17h.01"/>
                        </svg>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[12px] font-medium text-[color:var(--vv-text)]">{f.name}</span>
                            <span className="text-[10.5px] text-[#F59E0B]">{strengthLabel(f.score)}</span>
                          </div>
                          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{f.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI transparency notice */}
              <div
                className="rounded-lg px-3.5 py-3 flex items-start gap-2.5"
                style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)' }}>
                <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                <div>
                  <p className="text-[11px] font-semibold text-[#A78BFA] mb-0.5">AI Match Analysis</p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
                    Generated from available profile, business, and preference data. Match scores are recommendations, not guarantees - review the underlying information before making decisions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {state === 'ready' && data && (
          <div className="px-5 py-4 border-t border-[#1c2a3e] flex-shrink-0">
            <Button className="w-full" onClick={data.onCta ?? onClose}>{data.ctaLabel}</Button>
          </div>
        )}
      </div>
    </>
  );
}

// --- Demo data factory --------------------------------------------------------
// Generates plausible demo match data keyed to the item.

export function buildDemoMatchData(
  item: { name: string; match: number; role?: string; type?: string },
  viewerRole: MatchRole,
  onCta?: () => void,
): MatchExplainData {
  const score = item.match;
  const initials = item.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const founderFactors: MatchFactor[] = [
    { name: 'Industry Alignment', score: Math.min(100, score + 7), weight: 5, explanation: 'Both operate in HealthTech - strong thematic overlap with platform focus.' },
    { name: 'Stage Alignment', score: Math.min(100, score + 2), weight: 4, explanation: 'Investment thesis targets Seed to Series A, matching current business stage.' },
    { name: 'Investment Thesis', score: Math.max(30, score - 5), weight: 4, explanation: "Investor's stated preferences align with the business model and revenue approach." },
    { name: 'Location Compatibility', score: Math.max(30, score - 12), weight: 2, explanation: 'Investor is open to remote deals; location is not a limiting factor.' },
    { name: 'Check Size Fit', score: Math.min(100, score + 4), weight: 3, explanation: 'Stated investment range covers the funding ask.' },
  ];

  const investorFactors: MatchFactor[] = [
    { name: 'Industry Alignment', score: Math.min(100, score + 5), weight: 5, explanation: 'Business operates in a sector consistent with investment focus areas.' },
    { name: 'Stage Fit', score: Math.min(100, score + 3), weight: 4, explanation: 'Current business stage falls within stated investment stage preference.' },
    { name: 'Revenue Signals', score: Math.max(30, score - 8), weight: 3, explanation: 'Early revenue indicators suggest product-market traction is developing.' },
    { name: 'Team Strength', score: Math.min(100, score + 1), weight: 4, explanation: 'Founding team background aligns with the problem domain.' },
    { name: 'Market Size', score: Math.max(40, score - 4), weight: 3, explanation: 'Addressable market is substantial with documented growth trajectory.' },
  ];

  const professionalFactors: MatchFactor[] = [
    { name: 'Skills Alignment', score: Math.min(100, score + 6), weight: 5, explanation: 'Core expertise matches the open opportunity requirements closely.' },
    { name: 'Domain Experience', score: Math.min(100, score + 3), weight: 4, explanation: 'Prior work in adjacent verticals translates directly to the collaboration scope.' },
    { name: 'Availability', score: Math.max(35, score - 10), weight: 3, explanation: 'Availability window needs clarification to confirm timeline compatibility.' },
    { name: 'Location / Remote', score: Math.min(100, score + 2), weight: 2, explanation: 'Position supports remote engagement; no location conflict.' },
    { name: 'Goals Alignment', score: Math.max(40, score - 6), weight: 3, explanation: 'Professional growth interests are broadly consistent with the collaboration type.' },
  ];

  const factorsByRole: Record<MatchRole, MatchFactor[]> = {
    founder: founderFactors,
    investor: investorFactors,
    professional: professionalFactors,
  };

  const whyByRole: Record<MatchRole, string[]> = {
    founder: [
      `${item.name} focuses on the same industry vertical as your business.`,
      'Investment stage preference aligns with your current fundraising round.',
      'Stated check size covers your funding ask.',
      'Investor has a track record in adjacent markets.',
    ],
    investor: [
      'Business operates in your stated investment focus area.',
      'Current stage matches your preferred entry point.',
      'Founding team shows relevant domain expertise.',
      'Revenue trajectory indicates early product-market fit.',
    ],
    professional: [
      'Your core skills directly match the listed requirements.',
      'Domain experience in adjacent verticals is highly relevant.',
      'Collaboration type aligns with your stated engagement preferences.',
      'Business stage offers meaningful scope for your expertise.',
    ],
  };

  const ctaByRole: Record<MatchRole, string> = {
    founder: 'View Profile',
    investor: 'Express Interest',
    professional: 'View Opportunity',
  };

  const subjectRoleByViewer: Record<MatchRole, string> = {
    founder: item.role ?? 'Seed-stage Investor',
    investor: 'HealthTech Business',
    professional: item.role ?? 'Collaboration Opportunity',
  };

  const summaryByScore = score >= 85
    ? 'Strong alignment across industry, stage, and stated preferences.'
    : score >= 70
    ? 'Good alignment with a few areas worth reviewing before connecting.'
    : 'Moderate match - some alignment exists but notable gaps may require clarification.';

  return {
    score,
    subjectName: item.name,
    subjectInitials: initials,
    subjectRole: subjectRoleByViewer[viewerRole],
    summaryLine: summaryByScore,
    factors: factorsByRole[viewerRole],
    whyBullets: whyByRole[viewerRole],
    ctaLabel: ctaByRole[viewerRole],
    onCta,
    viewerRole,
  };
}