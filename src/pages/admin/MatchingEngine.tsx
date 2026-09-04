import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconShield, IconCheck } from '../../components/layout/Icons';

// --- Types ---------------------------------------------------------------------

interface MatchFactor {
  key: string;
  label: string;
  description: string;
  weight: number;
  category: 'core' | 'preference' | 'context';
}

// --- Data ----------------------------------------------------------------------

const INITIAL_FACTORS: MatchFactor[] = [
  { key: 'industry',    label: 'Industry Alignment',       description: 'Business industry vs. investor/professional sector preferences',         weight: 28, category: 'core' },
  { key: 'stage',       label: 'Business Stage Alignment', description: 'Current funding stage vs. preferred investment / engagement stage',       weight: 22, category: 'core' },
  { key: 'skills',      label: 'Skills / Expertise Match', description: 'Professional skills and expertise vs. business requirements',              weight: 18, category: 'core' },
  { key: 'investment',  label: 'Investment Preferences',   description: 'Investment range, involvement level, and risk appetite alignment',         weight: 15, category: 'preference' },
  { key: 'goals',       label: 'Goals & Interests',        description: 'Stated goals, mission, and strategic interests across parties',             weight: 10, category: 'preference' },
  { key: 'geography',   label: 'Geographic Alignment',     description: 'Location and operating geography vs. investment/engagement geography',     weight: 4,  category: 'context' },
  { key: 'readiness',   label: 'Readiness Score',          description: 'Business readiness score as a signal of deal viability',                  weight: 3,  category: 'context' },
];

const CATEGORY_CFG = {
  core:       { label: 'Core Factors',       color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)' },
  preference: { label: 'Preference Factors', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
  context:    { label: 'Context Factors',    color: '#C67A4E', bg: 'rgba(198,122,78,0.08)', border: 'rgba(198,122,78,0.22)' },
};

const CONFIG_META = {
  lastUpdated: 'Aug 24, 2026 - 14:35',
  updatedBy: 'alvi@vaultventures.io',
  status: 'Active',
  version: 'v2.4.1',
  totalRuns: '14,832',
  avgScore: '74.2',
};

// --- Helpers ------------------------------------------------------------------

function WeightBar({ weight, color }: { weight: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,48,74,0.8)' }}>
        <div className="h-full rounded-full" style={{ width: `${weight}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono text-[color:var(--vv-text-secondary)] w-8 text-right">{weight}%</span>
    </div>
  );
}

function ConfirmModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="matching-save-title" style={{ background: 'rgba(4,8,15,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-[14px] border border-[color:var(--vv-border-strong)] p-5 w-full max-w-sm" style={{ background: 'rgba(13,22,38,0.98)' }}>
        <div className="flex items-start gap-2.5 mb-3">
          <IconShield s={15} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <p id="matching-save-title" className="text-[13px] font-semibold text-[color:var(--vv-text)]">Save Matching Configuration?</p>
        </div>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-1">The updated weights will affect all future match score calculations. This action will be recorded in the Audit Log.</p>
        <p className="text-[11px] text-[#C67A4E] mb-4">? High-impact change. Ensure total weights sum to 100%.</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm} className="flex-1">Confirm & Save</Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// --- Main ----------------------------------------------------------------------

export default function AdminMatchingEngine() {
  const [factors, setFactors] = useState<MatchFactor[]>(INITIAL_FACTORS);
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftWeights, setDraftWeights] = useState<Record<string, number>>({});

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const draftTotal = editing
    ? Object.values(draftWeights).reduce((s, v) => s + (Number(v) || 0), 0)
    : totalWeight;

  function startEdit() {
    setDraftWeights(Object.fromEntries(factors.map(f => [f.key, f.weight])));
    setEditing(true);
    setSaved(false);
  }

  function handleSave() {
    setFactors(prev => prev.map(f => ({ ...f, weight: Number(draftWeights[f.key]) || f.weight })));
    setEditing(false);
    setShowConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const grouped: Record<string, MatchFactor[]> = { core: [], preference: [], context: [] };
  factors.forEach(f => grouped[f.category].push(f));

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
      {showConfirm && <ConfirmModal onConfirm={handleSave} onClose={() => setShowConfirm(false)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Matching Engine</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">AI matching factor weights and configuration overview.</p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={() => setShowConfirm(true)} disabled={draftTotal !== 100}>
                Save Configuration
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={startEdit}>Edit Weights</Button>
          )}
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[9px] mb-4"
          style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <IconCheck s={13} className="text-[#22C55E]" />
          <p className="text-[12px] text-[#22C55E]">Configuration saved and logged to Audit Log.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* Factors */}
        <div className="space-y-5">
          {editing && draftTotal !== 100 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-[9px]"
              style={{ background: 'rgba(198,122,78,0.07)', border: '1px solid rgba(198,122,78,0.2)' }}>
              <IconShield s={13} className="text-[#C67A4E]" />
              <p className="text-[12px] text-[#C67A4E]">Weights must total exactly 100%. Current total: <strong>{draftTotal}%</strong></p>
            </div>
          )}

          {(['core', 'preference', 'context'] as const).map(cat => {
            const cfg = CATEGORY_CFG[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    {cfg.label.toUpperCase()}
                  </span>
                </div>
                <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
                  {grouped[cat].map((f, i) => (
                    <div key={f.key} className={`px-4 py-4 ${i < grouped[cat].length - 1 ? 'border-b border-[#1c2a3e]' : ''}`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{f.label}</p>
                          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5 leading-snug">{f.description}</p>
                        </div>
                        {editing ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number" min={0} max={100}
                              value={draftWeights[f.key] ?? f.weight}
                              onChange={e => setDraftWeights(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                              className="w-14 text-center px-2 py-1 rounded-[6px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12px] text-[color:var(--vv-text)] outline-none focus:border-[#C67A4E]"
                            />
                            <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">%</span>
                          </div>
                        ) : (
                          <span className="text-[14px] font-bold font-mono shrink-0" style={{ color: cfg.color }}>{f.weight}%</span>
                        )}
                      </div>
                      <WeightBar weight={editing ? (Number(draftWeights[f.key]) || 0) : f.weight} color={cfg.color} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: config status */}
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Configuration</p>
            </div>
            {[
              { label: 'Status',       value: CONFIG_META.status,      badge: true },
              { label: 'Version',      value: CONFIG_META.version,      badge: false },
              { label: 'Last Updated', value: CONFIG_META.lastUpdated,  badge: false },
              { label: 'Updated By',   value: CONFIG_META.updatedBy,    badge: false },
              { label: 'Total Weight', value: `${totalWeight}%`,        badge: false },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
                {row.badge
                  ? <Badge variant="success" dot>{row.value}</Badge>
                  : <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right font-mono">{row.value}</span>}
              </div>
            ))}
          </div>

          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Engine Stats (Demo)</p>
            </div>
            {[
              { label: 'Total Match Runs', value: CONFIG_META.totalRuns },
              { label: 'Avg Match Score',  value: CONFIG_META.avgScore },
              { label: 'Strong Matches',   value: '32.4%' },
              { label: 'Weak Matches',     value: '18.1%' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
                <span className="text-[12px] font-bold text-[color:var(--vv-text)] font-mono">{row.value}</span>
              </div>
            ))}
            <div className="px-4 py-2.5">
              <p className="text-[10px] text-[#35446A]">? Demo data - not real metrics</p>
            </div>
          </div>

          <div className="px-4 py-3 rounded-[10px]"
            style={{ background: 'rgba(198,122,78,0.04)', border: '1px solid rgba(198,122,78,0.14)' }}>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">
              Weight changes are logged to the Admin Audit Log and take effect on the next matching run.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}