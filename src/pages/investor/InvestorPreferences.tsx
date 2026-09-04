import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// --- Options ------------------------------------------------------------------

const INDUSTRIES = [
  'FinTech', 'HealthTech', 'CleanTech', 'EdTech', 'AgriTech', 'LegalTech',
  'PropTech', 'AI / ML', 'SaaS / B2B', 'E-Commerce', 'Logistics', 'Cybersecurity',
  'Data & Analytics', 'BioTech', 'HRTech', 'RetailTech',
];

const STAGES = ['Pre-Seed', 'Seed', 'Early Stage', 'Series A', 'Series B', 'Growth'];

const INVOLVEMENT = [
  { value: 'passive', label: 'Passive', desc: 'Capital only, no active involvement' },
  { value: 'advisory', label: 'Advisory', desc: 'Occasional strategic guidance' },
  { value: 'strategic', label: 'Strategic', desc: 'Regular input on key decisions' },
  { value: 'hands-on', label: 'Hands-On', desc: 'Active board/operational involvement' },
];

const LOCATIONS = [
  'Bangladesh', 'South Asia', 'Southeast Asia', 'India', 'Singapore', 'Middle East',
  'Europe', 'North America', 'Remote / Global',
];

const RISK = ['Conservative', 'Moderate', 'Balanced', 'Aggressive'];

// --- Default prefs (pre-filled for existing investor) -------------------------

interface Prefs {
  industries: string[];
  stages: string[];
  rangeMin: string;
  rangeMax: string;
  involvement: string;
  locations: string[];
  expertise: string;
  risk: string;
}

const DEFAULT_PREFS: Prefs = {
  industries: ['FinTech', 'AI / ML', 'SaaS / B2B'],
  stages: ['Seed', 'Early Stage'],
  rangeMin: '5,00,000',
  rangeMax: '50,00,000',
  involvement: 'advisory',
  locations: ['Bangladesh', 'South Asia', 'Remote / Global'],
  expertise: 'Enterprise SaaS, financial infrastructure, B2B marketplaces',
  risk: 'Moderate',
};

// --- Multi-select pill group ---------------------------------------------------

function PillGroup({
  options, selected, onToggle,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
            style={active ? {
              background: 'rgba(198,122,78,0.10)',
              borderColor: 'rgba(198,122,78,0.32)',
              color: '#C67A4E',
            } : {
              background: 'rgba(24,35,56,0.7)',
              borderColor: 'rgba(36,48,74,0.9)',
              color: '#5E6D8F',
            }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// --- Section wrapper ----------------------------------------------------------

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display">{title}</p>
        {subtitle && <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function InvestorPreferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleSet(key: keyof Prefs, value: string) {
    setPrefs(p => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 900);
  }

  const completeness = [
    prefs.industries.length > 0,
    prefs.stages.length > 0,
    prefs.rangeMin && prefs.rangeMax,
    prefs.involvement,
    prefs.locations.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6">

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/app/investor/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Dashboard
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Investment Preferences</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Investment Preferences
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            These shape your AI match scores and surface the most relevant opportunities.
          </p>
        </div>

        {/* Completeness */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
          <div className="relative w-8 h-8 flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="#24304A" strokeWidth="3"/>
              <circle cx="16" cy="16" r="12" fill="none" stroke="#C67A4E" strokeWidth="3"
                strokeDasharray={`${(completeness / 5) * 75.4} 75.4`}
                strokeLinecap="round" transform="rotate(-90 16 16)"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#C67A4E]">
              {completeness}/5
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[color:var(--vv-text)]">
              {completeness === 5 ? 'Complete' : 'Incomplete'}
            </p>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{completeness} of 5 sections</p>
          </div>
        </div>
      </div>

      {/* Saved banner */}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[12.5px] text-[#22C55E]">Preferences updated - your match scores will refresh shortly.</p>
        </div>
      )}

      <div className="space-y-4">

        {/* Industries */}
        <Section title="Preferred Industries"
          subtitle="Select all sectors you actively invest in.">
          <PillGroup
            options={INDUSTRIES}
            selected={prefs.industries}
            onToggle={v => toggleSet('industries', v)}
          />
          {prefs.industries.length > 0 && (
            <p className="mt-3 text-[11px] text-[color:var(--vv-text-tertiary)]">
              {prefs.industries.length} selected: {prefs.industries.join(' - ')}
            </p>
          )}
        </Section>

        {/* Stage */}
        <Section title="Preferred Business Stage"
          subtitle="Which stages do you typically invest in?">
          <PillGroup
            options={STAGES}
            selected={prefs.stages}
            onToggle={v => toggleSet('stages', v)}
          />
        </Section>

        {/* Investment range */}
        <Section title="Investment Range (BDT)"
          subtitle="The typical check size you write per deal.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['rangeMin', 'rangeMax'] as const).map(key => (
              <div key={key}>
                <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                  {key === 'rangeMin' ? 'Minimum' : 'Maximum'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[color:var(--vv-text-tertiary)] font-semibold pointer-events-none">?</span>
                  <input
                    type="text"
                    value={prefs[key]}
                    onChange={e => setPrefs(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={key === 'rangeMin' ? '5,00,000' : '1,00,00,000'}
                    className="w-full pl-8 pr-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
          {prefs.rangeMin && prefs.rangeMax && (
            <p className="mt-2.5 text-[11.5px] text-[color:var(--vv-text-tertiary)]">
              Range: ?{prefs.rangeMin} - ?{prefs.rangeMax}
            </p>
          )}
        </Section>

        {/* Involvement */}
        <Section title="Involvement Preference"
          subtitle="How actively do you typically engage with portfolio companies?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INVOLVEMENT.map(opt => {
              const active = prefs.involvement === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPrefs(p => ({ ...p, involvement: opt.value }))}
                  className="flex items-start gap-3 p-3.5 rounded-[10px] border text-left transition-all"
                  style={active ? {
                    background: 'rgba(198,122,78,0.07)',
                    borderColor: 'rgba(198,122,78,0.28)',
                  } : {
                    background: 'rgba(24,35,56,0.5)',
                    borderColor: 'rgba(36,48,74,0.9)',
                  }}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                    active ? 'border-[#C67A4E] bg-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
                  }`}>
                    {active && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                  </div>
                  <div>
                    <p className={`text-[12.5px] font-semibold ${active ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text)]'}`}>{opt.label}</p>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Risk appetite */}
        <Section title="Risk Appetite">
          <div className="flex flex-wrap gap-2">
            {RISK.map(r => {
              const active = prefs.risk === r;
              return (
                <button key={r} onClick={() => setPrefs(p => ({ ...p, risk: r }))}
                  className="px-4 py-2 rounded-[8px] text-[12.5px] font-medium border transition-all"
                  style={active ? {
                    background: 'rgba(198,122,78,0.10)',
                    borderColor: 'rgba(198,122,78,0.32)',
                    color: '#C67A4E',
                  } : {
                    background: 'rgba(24,35,56,0.7)',
                    borderColor: 'rgba(36,48,74,0.9)',
                    color: '#5E6D8F',
                  }}>
                  {r}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Geography */}
        <Section title="Geographic Preferences"
          subtitle="Where do you primarily invest?">
          <PillGroup
            options={LOCATIONS}
            selected={prefs.locations}
            onToggle={v => toggleSet('locations', v)}
          />
        </Section>

        {/* Expertise */}
        <Section title="Relevant Expertise & Interests"
          subtitle="Help the AI understand your background for better matches.">
          <textarea
            rows={3}
            value={prefs.expertise}
            onChange={e => setPrefs(p => ({ ...p, expertise: e.target.value }))}
            placeholder="e.g. Enterprise SaaS, financial infrastructure, healthcare technology..."
            className="w-full px-3.5 py-3 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none resize-none leading-relaxed"
          />
        </Section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button className="flex-1 sm:flex-none sm:min-w-[160px]" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving-' : 'Save Preferences'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/investor/discover')}>
            View Matched Opportunities
          </Button>
          <Button variant="ghost" onClick={() => navigate('/app/investor/dashboard')}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}