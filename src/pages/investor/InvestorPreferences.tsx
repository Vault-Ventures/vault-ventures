import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api, InvestorPreferencesData, ApiError } from '../../services/api';
import { useToast } from '../../components/ui/Feedback';

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

const INVESTMENT_TYPES = [
  { value: 'micro', label: 'Micro Investment (Profit Sharing)', desc: 'Small checks with structured revenue/profit distribution' },
  { value: 'large_standard', label: 'Standard Equity / Large', desc: 'Direct equity stake with formal governance and board involvement' },
];

// --- Form State Interface -----------------------------------------------------

interface Prefs {
  industries: string[];
  stages: string[];
  rangeMin: string;
  rangeMax: string;
  availableInvestment: string;
  involvement: string;
  locations: string[];
  risk: string;
  investmentTypes: string[];
}

const EMPTY_PREFS: Prefs = {
  industries: [],
  stages: [],
  rangeMin: '',
  rangeMax: '',
  availableInvestment: '',
  involvement: '',
  locations: [],
  risk: '',
  investmentTypes: ['micro', 'large_standard'],
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
            type="button"
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
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>(EMPTY_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanNum = (val: string): number | null => {
    const cleaned = val.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const minVal = cleanNum(prefs.rangeMin);
  const maxVal = cleanNum(prefs.rangeMax);
  const availVal = cleanNum(prefs.availableInvestment);
  const isRangeInvalid = minVal !== null && maxVal !== null && minVal > maxVal;

  useEffect(() => {
    let mounted = true;
    async function loadPreferences() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.investorPreferences.get();
        if (mounted && data) {
          const parseList = (val: string | null | undefined): string[] => {
            if (!val) return [];
            return val.split(',').map(s => s.trim()).filter(Boolean);
          };

          setPrefs({
            industries: parseList(data.industry),
            stages: parseList(data.business_stage),
            rangeMin: data.minimum_investment ? String(data.minimum_investment) : '',
            rangeMax: data.maximum_investment ? String(data.maximum_investment) : '',
            availableInvestment: data.available_investment ? String(data.available_investment) : '',
            involvement: data.involvement || '',
            locations: parseList(data.location),
            risk: data.risk_level || '',
            investmentTypes: Array.isArray(data.investment_types) && data.investment_types.length > 0
              ? data.investment_types
              : ['micro', 'large_standard'],
          });
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load investor preferences from backend.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, []);

  function toggleSet(key: 'industries' | 'stages' | 'locations' | 'investmentTypes', value: string) {
    setPrefs(p => {
      const arr = p[key];
      return { ...p, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      if (isRangeInvalid) {
        setError('Minimum investment cannot exceed maximum investment.');
        toast('danger', 'Validation Error', 'Minimum investment cannot exceed maximum investment.');
        setSaving(false);
        return;
      }

      const payload: Partial<InvestorPreferencesData> = {
        industry: prefs.industries.length > 0 ? prefs.industries.join(', ') : null,
        business_stage: prefs.stages.length > 0 ? prefs.stages.join(', ') : null,
        location: prefs.locations.length > 0 ? prefs.locations.join(', ') : null,
        risk_level: prefs.risk || null,
        involvement: prefs.involvement || null,
        minimum_investment: minVal !== null ? minVal : null,
        maximum_investment: maxVal !== null ? maxVal : null,
        available_investment: availVal !== null ? availVal : (maxVal !== null ? maxVal : null),
        investment_types: prefs.investmentTypes.length > 0 ? prefs.investmentTypes : ['micro', 'large_standard'],
      };

      const updated = await api.investorPreferences.update(payload);
      if (updated) {
        const parseList = (val: string | null | undefined): string[] => {
          if (!val) return [];
          return val.split(',').map(s => s.trim()).filter(Boolean);
        };

        setPrefs({
          industries: parseList(updated.industry),
          stages: parseList(updated.business_stage),
          rangeMin: updated.minimum_investment ? String(updated.minimum_investment) : '',
          rangeMax: updated.maximum_investment ? String(updated.maximum_investment) : '',
          availableInvestment: updated.available_investment ? String(updated.available_investment) : '',
          involvement: updated.involvement || '',
          locations: parseList(updated.location),
          risk: updated.risk_level || '',
          investmentTypes: Array.isArray(updated.investment_types) && updated.investment_types.length > 0
            ? updated.investment_types
            : ['micro', 'large_standard'],
        });
      }

      setSaved(true);
      toast('success', 'Preferences Saved', 'Your investment preferences have been updated.');
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      if (err instanceof ApiError && err.details) {
        const firstErr = Object.values(err.details).flat()[0];
        setError(firstErr || err.message);
        toast('danger', 'Save Error', firstErr || err.message);
      } else {
        const msg = err.message || 'Failed to save preferences.';
        setError(msg);
        toast('danger', 'Save Error', msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const completeness = [
    prefs.industries.length > 0,
    prefs.stages.length > 0,
    Boolean(prefs.rangeMin || prefs.rangeMax || prefs.availableInvestment),
    Boolean(prefs.involvement),
    prefs.locations.length > 0,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#C67A4E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading investment preferences from server...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6">

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/app/investor/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
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
            These shape your deal matching and surface the most relevant business opportunities.
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
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{completeness} of 5 criteria</p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[12.5px]">{error}</p>
        </div>
      )}

      {/* Saved banner */}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[12.5px] text-[#22C55E]">Preferences saved to backend — your opportunity match rankings are updated.</p>
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
              {prefs.industries.length} selected: {prefs.industries.join(' • ')}
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
          {prefs.stages.length > 0 && (
            <p className="mt-3 text-[11px] text-[color:var(--vv-text-tertiary)]">
              {prefs.stages.length} selected: {prefs.stages.join(' • ')}
            </p>
          )}
        </Section>

        {/* Investment range */}
        <Section title="Investment Range (BDT ৳)"
          subtitle="The typical check size and available capital you allocate per deal.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                Minimum Investment (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[color:var(--vv-text-tertiary)] font-semibold pointer-events-none">৳</span>
                <input
                  type="text"
                  value={prefs.rangeMin}
                  onChange={e => setPrefs(p => ({ ...p, rangeMin: e.target.value }))}
                  placeholder="500000"
                  className={`w-full pl-8 pr-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-colors font-mono ${
                    isRangeInvalid ? 'border-rose-500/70 focus:border-rose-500' : 'border-[color:var(--vv-border-strong)]'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                Maximum Investment (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[color:var(--vv-text-tertiary)] font-semibold pointer-events-none">৳</span>
                <input
                  type="text"
                  value={prefs.rangeMax}
                  onChange={e => setPrefs(p => ({ ...p, rangeMax: e.target.value }))}
                  placeholder="5000000"
                  className={`w-full pl-8 pr-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-colors font-mono ${
                    isRangeInvalid ? 'border-rose-500/70 focus:border-rose-500' : 'border-[color:var(--vv-border-strong)]'
                  }`}
                />
              </div>
            </div>
          </div>
          {isRangeInvalid && (
            <div className="mt-3 flex items-center gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[12px] leading-snug">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>Invalid Investment Range:</strong> Minimum investment (৳{minVal?.toLocaleString()}) cannot exceed maximum investment (৳{maxVal?.toLocaleString()}).
              </span>
            </div>
          )}
          <div className="mt-4">
            <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
              Total Available Investment Capital (৳)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[color:var(--vv-text-tertiary)] font-semibold pointer-events-none">৳</span>
              <input
                type="text"
                value={prefs.availableInvestment}
                onChange={e => setPrefs(p => ({ ...p, availableInvestment: e.target.value }))}
                placeholder="10000000"
                className="w-full pl-8 pr-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-colors font-mono"
              />
            </div>
          </div>
          {(prefs.rangeMin || prefs.rangeMax) && (
            <p className="mt-2.5 text-[11.5px] text-[color:var(--vv-text-tertiary)]">
              Target check range: ৳{prefs.rangeMin || '0'} — ৳{prefs.rangeMax || 'Unlimited'}
            </p>
          )}
        </Section>

        {/* Investment Structure Preference */}
        <Section title="Investment Structures"
          subtitle="Select supported investment models for your portfolio.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INVESTMENT_TYPES.map(opt => {
              const active = prefs.investmentTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSet('investmentTypes', opt.value)}
                  className="flex items-start gap-3 p-3.5 rounded-[10px] border text-left transition-all"
                  style={active ? {
                    background: 'rgba(198,122,78,0.07)',
                    borderColor: 'rgba(198,122,78,0.28)',
                  } : {
                    background: 'rgba(24,35,56,0.5)',
                    borderColor: 'rgba(36,48,74,0.9)',
                  }}>
                  <div className={`w-4 h-4 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    active ? 'border-[#C67A4E] bg-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
                  }`}>
                    {active && <span className="text-[10px] text-white font-bold">✓</span>}
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

        {/* Involvement */}
        <Section title="Involvement Preference"
          subtitle="How actively do you typically engage with portfolio companies?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INVOLVEMENT.map(opt => {
              const active = prefs.involvement === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
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
        <Section title="Risk Appetite" subtitle="Indicate your preferred risk profile.">
          <div className="flex flex-wrap gap-2">
            {RISK.map(r => {
              const active = prefs.risk.toLowerCase() === r.toLowerCase();
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPrefs(p => ({ ...p, risk: r }))}
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
          {prefs.locations.length > 0 && (
            <p className="mt-3 text-[11px] text-[color:var(--vv-text-tertiary)]">
              {prefs.locations.length} selected: {prefs.locations.join(' • ')}
            </p>
          )}
        </Section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button className="flex-1 sm:flex-none sm:min-w-[160px]" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
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