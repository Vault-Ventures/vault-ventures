import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// --- Types ---------------------------------------------------------------------

type Step = 'overview' | 'confirm' | 'success';
type ViewRole = 'founder' | 'investor' | 'professional';

interface FeatureRow {
  label: string;
  free: boolean | string;
  premium: boolean | string;
  highlight?: boolean;
}

// --- Feature definitions per role ---------------------------------------------

const SHARED_FEATURES: FeatureRow[] = [
  { label: 'Verified platform access',          free: true,       premium: true },
  { label: 'AI Match Score',                    free: 'Basic',    premium: 'Full explainability', highlight: true },
  { label: 'Staged information disclosure',     free: true,       premium: true },
  { label: 'NDA workflow',                      free: true,       premium: true },
  { label: 'Deal Room access',                  free: true,       premium: true },
  { label: 'Milestone tracking',                free: true,       premium: true },
  { label: 'Negotiation panel',                 free: true,       premium: true },
  { label: 'Priority platform support',         free: false,      premium: true, highlight: true },
  { label: 'Early access to new features',      free: false,      premium: true },
];

const ROLE_FEATURES: Record<ViewRole, FeatureRow[]> = {
  founder: [
    { label: 'Active businesses',                free: '1',        premium: 'Unlimited', highlight: true },
    { label: 'Investor discovery',               free: 'Limited',  premium: 'Full access' },
    { label: 'Readiness Score breakdown',        free: 'Summary',  premium: 'Full detail', highlight: true },
    { label: 'Match explainability per investor',free: false,      premium: true },
    { label: 'Advanced milestone analytics',     free: false,      premium: true },
    { label: 'Featured placement in discovery',  free: false,      premium: true, highlight: true },
    { label: 'Bulk document sharing',            free: false,      premium: true },
  ],
  investor: [
    { label: 'Saved opportunities',              free: '5',        premium: 'Unlimited', highlight: true },
    { label: 'Reverse Discovery filters',        free: 'Basic',    premium: 'Advanced', highlight: true },
    { label: 'Match explainability',             free: 'Summary',  premium: 'Full factor breakdown' },
    { label: 'Portfolio tracking',               free: true,       premium: true },
    { label: 'Priority deal flow alerts',        free: false,      premium: true, highlight: true },
    { label: 'Multi-portfolio analytics',        free: false,      premium: true },
    { label: 'Preference-based auto-matching',   free: false,      premium: true },
  ],
  professional: [
    { label: 'Active applications',             free: '3',        premium: 'Unlimited', highlight: true },
    { label: 'Profile visibility',              free: 'Standard', premium: 'Featured placement', highlight: true },
    { label: 'Opportunity discovery',           free: 'Limited',  premium: 'Full access' },
    { label: 'Match explainability',            free: false,      premium: true },
    { label: 'Negotiation panel',               free: true,       premium: true },
    { label: 'Reputation analytics',            free: false,      premium: true, highlight: true },
    { label: 'Application priority boost',      free: false,      premium: true },
  ],
};

const ROLE_LABELS: Record<ViewRole, string> = {
  founder: 'Founder',
  investor: 'Investor',
  professional: 'Professional',
};

// --- Helpers -------------------------------------------------------------------

function FeatureCell({ val, premium = false }: { val: boolean | string; premium?: boolean }) {
  if (val === false) {
    return (
      <div className="flex justify-center">
        <svg width="14" height="14" fill="none" stroke="#35446A" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }
  if (val === true) {
    return (
      <div className="flex justify-center">
        <svg width="14" height="14" fill="none" stroke={premium ? '#C67A4E' : '#22C55E'} strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  return (
    <p className={`text-center text-[11.5px] font-medium ${premium ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{val}</p>
  );
}

// --- Subviews ------------------------------------------------------------------

function OverviewView({
  role, isPremium, onUpgrade, onRoleChange,
}: {
  role: ViewRole;
  isPremium: boolean;
  onUpgrade: () => void;
  onRoleChange: (r: ViewRole) => void;
}) {
  const allFeatures = [...ROLE_FEATURES[role], ...SHARED_FEATURES];

  return (
    <div className="max-w-[780px] mx-auto">

      {/* Hero */}
      <div className="relative rounded-[20px] overflow-hidden mb-7 p-8 text-center"
        style={{ background: 'rgba(26,28,29,0.9)', border: '1px solid rgba(198,122,78,0.2)' }}>
        {/* Gradient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% -10%, rgba(198,122,78,0.12), transparent), radial-gradient(ellipse 40% 40% at 80% 110%, rgba(198,122,78,0.10), transparent)'
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.24)' }}>
            <svg width="12" height="12" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-[11.5px] font-semibold text-[#C67A4E] tracking-wide">VAULT VENTURES PREMIUM</span>
          </div>
          <h1 className="font-display text-[26px] sm:text-[32px] font-semibold leading-tight mb-3"
            style={{ background: 'linear-gradient(135deg, #F0EEEC 30%, #C67A4E 60%, #E8A878 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isPremium ? 'Premium Active' : 'Unlock the Full Platform'}
          </h1>
          <p className="text-[14px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto leading-relaxed mb-6">
            {isPremium
              ? 'You have full access to all Premium capabilities on this account.'
              : 'Premium gives you deeper insights, higher limits, and priority access - all within the same Vault Ventures platform you know.'}
          </p>

          {isPremium ? (
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-[10px]"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
              </svg>
              <span className="text-[13px] font-semibold text-[#22C55E]">Premium Active - All features enabled</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={onUpgrade}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mr-1.5 inline -mt-0.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Choose Premium
              </Button>
              <p className="text-[11px] text-[#35446A]">Prototype - no real payment</p>
            </div>
          )}
        </div>
      </div>

      {/* Role filter */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Feature Comparison</p>
        <div className="flex items-center gap-1 p-1 rounded-[9px] border border-[color:var(--vv-border)]"
          style={{ background: 'rgba(26,28,29,0.9)' }}>
          {(['founder', 'investor', 'professional'] as ViewRole[]).map(r => (
            <button key={r} onClick={() => onRoleChange(r)}
              className="px-3 py-1 rounded-[7px] text-[11px] font-medium capitalize transition-all"
              style={role === r ? {
                background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.22)',
              } : { color: '#5E6D8F', border: '1px solid transparent' }}>
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden mb-5"
        style={{ background: 'rgba(26,28,29,0.85)' }}>
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_120px] sm:grid-cols-[1fr_120px_150px] border-b border-[color:var(--vv-border)]">
          <div className="px-5 py-3.5">
            <p className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Feature</p>
          </div>
          <div className="px-4 py-3.5 text-center border-l border-[color:var(--vv-border)]">
            <p className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)]">Free</p>
          </div>
          <div className="px-4 py-3.5 text-center border-l border-[color:var(--vv-border)]"
            style={{ background: 'rgba(198,122,78,0.04)' }}>
            <div className="flex items-center justify-center gap-1.5">
              <svg width="10" height="10" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <p className="text-[11px] font-semibold text-[#C67A4E]">Premium</p>
            </div>
          </div>
        </div>

        {/* Rows */}
        {allFeatures.map((f, i) => (
          <div key={i} className={`grid grid-cols-[1fr_100px_120px] sm:grid-cols-[1fr_120px_150px] border-b border-[#1E2C44] last:border-b-0 ${f.highlight ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]/40' : ''}`}>
            <div className="px-5 py-3 flex items-center gap-2">
              <p className="text-[12px] text-[color:var(--vv-text)]">{f.label}</p>
              {f.highlight && (
                <svg width="9" height="9" fill="#C67A4E" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              )}
            </div>
            <div className="px-4 py-3 flex items-center justify-center border-l border-[#1E2C44]">
              <FeatureCell val={f.free} />
            </div>
            <div className="px-4 py-3 flex items-center justify-center border-l border-[#1E2C44]"
              style={{ background: 'rgba(198,122,78,0.02)' }}>
              <FeatureCell val={f.premium} premium />
            </div>
          </div>
        ))}
      </div>

      {/* Prototype disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] mb-6"
        style={{ background: 'rgba(198,122,78,0.05)', border: '1px solid rgba(198,122,78,0.15)' }}>
        <svg width="13" height="13" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
        </svg>
        <p className="text-[11.5px] text-[#C67A4E]">
          <span className="font-semibold">Prototype / simulated upgrade experience.</span>
          {" "}No real payment is processed. Premium pricing has not been defined for this prototype.
        </p>
      </div>

      {!isPremium && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onUpgrade} className="sm:min-w-[200px]">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mr-1.5 inline -mt-0.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Choose Premium
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>Maybe Later</Button>
        </div>
      )}
    </div>
  );
}

function ConfirmView({ role, onConfirm, onBack, confirming }: {
  role: ViewRole;
  onConfirm: () => void;
  onBack: () => void;
  confirming: boolean;
}) {
  const highlights = ROLE_FEATURES[role].filter(f => f.highlight && f.premium !== false).slice(0, 4);

  return (
    <div className="max-w-[460px] mx-auto">
      <div className="rounded-[18px] border border-[color:var(--vv-border-strong)] overflow-hidden"
        style={{ background: 'rgba(26,28,29,0.95)' }}>
        {/* Gradient line */}
        <div className="h-0.5" style={{ background: 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)' }} />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(198,122,78,0.1)', border: '1px solid rgba(198,122,78,0.24)' }}>
              <svg width="18" height="18" fill="none" stroke="#C67A4E" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <p className="font-display text-[16px] font-semibold text-[color:var(--vv-text)]">Vault Ventures Premium</p>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{ROLE_LABELS[role]} plan</p>
            </div>
          </div>

          {/* Plan summary */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden mb-5"
            style={{ background: 'rgba(24,35,56,0.6)' }}>
            <div className="px-4 py-3 border-b border-[#1E2C44] flex items-center justify-between">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Selected Plan</p>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.2)' }}>
                <svg width="9" height="9" fill="#C67A4E" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-[10.5px] font-semibold text-[#C67A4E]">Premium</span>
              </div>
            </div>
            <div className="px-4 py-3 border-b border-[#1E2C44] flex items-center justify-between">
              <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">Price</span>
              <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">Premium pricing</span>
            </div>
            <div className="px-4 py-3 border-b border-[#1E2C44]">
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2">Key features unlocked</p>
              <div className="space-y-1.5">
                {highlights.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg width="11" height="11" fill="none" stroke="#C67A4E" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[11.5px] text-[color:var(--vv-text-secondary)]">{f.label}</span>
                    {typeof f.premium === 'string' && (
                      <span className="text-[11px] text-[#C67A4E]">? {f.premium}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10.5px] text-[#35446A]">
                ? Prototype / simulated upgrade - no real payment is processed.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={onConfirm} disabled={confirming}>
              {confirming ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/>
                  </svg>
                  Activating-
                </span>
              ) : 'Confirm Upgrade'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onBack}>Back</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessView({ role, onContinue, onExplore }: {
  role: ViewRole;
  onContinue: () => void;
  onExplore: () => void;
}) {
  return (
    <div className="max-w-[420px] mx-auto text-center">
      <div className="rounded-[18px] border overflow-hidden"
        style={{ background: 'rgba(26,28,29,0.95)', borderColor: 'rgba(198,122,78,0.25)' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)' }} />
        <div className="p-8">
          {/* Animated checkmark */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'radial-gradient(circle, rgba(198,122,78,0.12), rgba(198,122,78,0.08))',
              border: '2px solid rgba(198,122,78,0.35)',
            }}>
            <svg width="28" height="28" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(198,122,78,0.15)"/>
            </svg>
          </div>

          <p className="font-display text-[22px] font-semibold mb-2"
            style={{ background: 'linear-gradient(135deg, #EAF0FA 20%, #C67A4E 60%, #C67A4E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Premium Activated
          </p>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-6 leading-relaxed">
            Your {ROLE_LABELS[role]} account now has full Premium access. Explore the platform to see what&apos;s unlocked.
          </p>

          <div className="space-y-2 mb-6 text-left">
            {[
              'Premium access enabled',
              'All feature limits removed',
              'Priority support activated',
              'Match explainability unlocked',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                </svg>
                <span className="text-[12.5px] text-[color:var(--vv-text-secondary)]">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <Button className="w-full" onClick={onExplore}>Explore Premium Features</Button>
            <Button variant="ghost" className="w-full" onClick={onContinue}>Continue to Vault Ventures</Button>
          </div>

          <p className="text-[10px] text-[#35446A] mt-4">
            Prototype - no real transaction occurred.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main ----------------------------------------------------------------------

export default function PremiumUpgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '/app/founder/dashboard';

  const [step, setStep] = useState<Step>('overview');
  const [role, setRole] = useState<ViewRole>('founder');
  const [isPremium, setIsPremium] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setIsPremium(true);
      setStep('success');
    }, 1200);
  }

  const dashMap: Record<ViewRole, string> = {
    founder: '/app/founder/dashboard',
    investor: '/app/investor/dashboard',
    professional: '/app/professional/dashboard',
  };

  return (
    <div className="min-h-full px-4 sm:px-6 py-6">

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6 max-w-[780px] mx-auto">
        <button onClick={() => step === 'overview' ? navigate(-1) : setStep('overview')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {step === 'overview' ? 'Back' : 'Premium'}
        </button>
        {step !== 'overview' && (
          <>
            <span className="text-[#35446A]">/</span>
            <span className="text-[12px] text-[color:var(--vv-text-secondary)] capitalize">{step}</span>
          </>
        )}
      </div>

      {/* Step content */}
      {step === 'overview' && (
        <OverviewView
          role={role}
          isPremium={isPremium}
          onUpgrade={() => setStep('confirm')}
          onRoleChange={setRole}
        />
      )}

      {step === 'confirm' && (
        <ConfirmView
          role={role}
          onConfirm={handleConfirm}
          onBack={() => setStep('overview')}
          confirming={confirming}
        />
      )}

      {step === 'success' && (
        <SuccessView
          role={role}
          onContinue={() => navigate(dashMap[role])}
          onExplore={() => navigate(dashMap[role])}
        />
      )}

    </div>
  );
}
