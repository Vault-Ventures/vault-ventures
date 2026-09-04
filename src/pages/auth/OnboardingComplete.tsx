import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck } from '../../components/layout/Icons';

const roleDestinations: Record<string, string> = {
  founder: '/app/founder/dashboard',
  investor: '/app/investor/dashboard',
  professional: '/app/professional/dashboard',
};

const roleProfilePaths: Record<string, string> = {
  founder: '/app/profile',
  investor: '/app/profile',
  professional: '/app/profile',
};

const nextActions: Record<string, { label: string; detail: string }> = {
  founder: { label: 'Submit for verification', detail: 'Identity verification unlocks investor discovery and deal rooms.' },
  investor: { label: 'Browse startups', detail: 'Your Match Score is now active. Discover startups matched to your thesis.' },
  professional: { label: 'Browse opportunities', detail: 'Your Skills Score is active. Start applying to matched startup roles.' },
};

export default function OnboardingComplete() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const role = params.get('role') || 'founder';
  const skipped = params.get('skip') === '1';

  const dashboard = roleDestinations[role] || '/app/founder/dashboard';
  const profilePath = roleProfilePaths[role] || '/app/profile';
  const next = nextActions[role] || nextActions.founder;

  const completion = skipped ? 42 : 78;

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link to="/" className="flex items-center gap-2">
            <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
              <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z" fill="#C67A4E" fillOpacity="0.18" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
              <path d="M11 14l2 2 4-4" stroke="#C67A4E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)]">Vault Ventures</span>
          </Link>
        </div>

        {/* Outer progress - all complete */}
        <div className="flex items-center gap-0 justify-center mb-8">
          {['Account', 'Profile', 'Verification', 'Complete'].map((label, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold ${
                  i < 3 ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#22C55E] text-[#22C55E]'
                }`}>
                  {i < 3 ? <IconCheck s={10} className="text-white" /> : <IconCheck s={10} className="text-[#22C55E]" />}
                </div>
                <span className={`text-[10px] mt-1 whitespace-nowrap ${i === 3 ? 'text-[color:var(--vv-text)]' : 'text-[#22C55E]'}`}>{label}</span>
              </div>
              {i < 3 && <div className="w-12 h-px mb-4 bg-[#22C55E]" />}
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-6">
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-1">
            {skipped ? 'Account created' : 'Your profile is ready'}
          </h1>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">
            {skipped ? "You can complete your profile at any time from the dashboard." : "You're set up as a " + role + " on Vault Ventures."}
          </p>

          {/* Status rows */}
          <div className="space-y-0 border border-[color:var(--vv-border)] rounded-md overflow-hidden mb-5">
            {[
              { label: 'Profile completion', value: `${completion}%`, color: completion >= 70 ? '#22C55E' : '#F59E0B' },
              { label: 'Verification status', value: 'Unverified - Tier 0', color: '#5E6D8F' },
              { label: 'Role', value: role.charAt(0).toUpperCase() + role.slice(1), color: '#EAF0FA' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1c2a3e] last:border-0">
                <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
                <span className="font-mono text-[12px] font-medium tabular-nums" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Next recommended action */}
          <div className="px-3.5 py-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md mb-5">
            <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-1">Recommended next step</p>
            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mb-0.5">{next.label}</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{next.detail}</p>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Button className="w-full" size="md" onClick={() => navigate(dashboard)}>Go to Dashboard</Button>
            <Button variant="secondary" className="w-full" size="md" onClick={() => navigate(profilePath)}>View Profile</Button>
          </div>
        </div>

        {skipped && (
          <p className="text-center mt-4 text-[11.5px] text-[color:var(--vv-text-tertiary)]">
            Complete your profile from <span className="text-[color:var(--vv-text)]">Dashboard ? Profile</span> at any time.
          </p>
        )}
      </div>
    </div>
  );
}