import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ScoreDetail } from '../components/ui/ScoreComponents';
import { IconArrowRight, IconShield, IconCheck, IconChevronDown } from '../components/layout/Icons';
import { AuthModal, AuthModalView } from '../components/landing/AuthModal';
import { NormalRole } from '../context/AuthContext';

const MATCH_FACTORS = [
  { name: 'Industry Alignment', weight: 25, score: 92, explanation: 'Both parties selected FinTech as primary industry, with 3 overlapping sub-sectors.' },
  { name: 'Stage Compatibility', weight: 20, score: 88, explanation: "Seed-stage startup aligns with investor's Series A readiness preference window." },
  { name: 'Funding Range Overlap', weight: 20, score: 85, explanation: "৳500K ask falls within the investor's ৳250K-৳750K preferred ticket size." },
  { name: 'Geographic Fit', weight: 15, score: 100, explanation: 'Both US-based. Investor has stated no geographic restrictions.' },
  { name: 'Risk Profile Match', weight: 12, score: 74, explanation: 'Moderate-risk tolerance aligns; one traction factor is below investor threshold.' },
  { name: 'Involvement Preference', weight: 8, score: 60, explanation: 'Founder prefers hands-off capital; investor seeks active board participation.', belowThreshold: true },
];

const TRUST_TIERS = [
  { tier: 'Tier 0', label: 'Unverified', desc: 'Email verified only. Limited access.', color: '#5E6D8F' },
  { tier: 'Tier 1', label: 'ID Verified', desc: 'Government ID checked. Core features unlocked.', color: '#22C55E' },
  { tier: 'Tier 2', label: 'Accredited', desc: 'Financial credentials verified. Full access.', color: '#C9A24B' },
  { tier: 'Tier 3', label: 'Institutional', desc: 'Organisation-level verification. Premium trust.', color: '#C67A4E' },
];

const PRICING = [
  {
    role: 'Founder', price: '৳49',
    free: ['1 business listing', 'Readiness Score (basic)', 'Tier 1 verification', 'Up to 5 connections'],
    premium: ['Unlimited listings', 'Full AI Readiness + improvement plan', 'Tier 2 verification support', 'Priority discovery', 'Advanced analytics'],
  },
  {
    role: 'Investor', price: '৳79',
    free: ['Discovery browse (no AI rank)', 'Save up to 10 opportunities', 'Standard Deal Room'],
    premium: ['AI Match Score & recommendations', 'Unlimited saved opportunities', 'Portfolio dashboard', 'Reverse Discovery', 'Analytics export'],
  },
  {
    role: 'Professional', price: '৳29',
    free: ['Profile + browse', 'Apply to 3 per month', 'Standard Deal Room'],
    premium: ['AI opportunity ranking', 'Unlimited applications', 'Priority badge', 'Negotiation history'],
  },
];

const VALUE_PROPS: Record<string, { headline: string; body: string; features: { icon: string; title: string; desc: string }[] }> = {
  Founder: {
    headline: 'Find the right investors and professionals.',
    body: 'Build a verified business profile, get an AI-generated Readiness Score, and connect with matched capital and talent through a structured, trust-gated deal process.',
    features: [
      { icon: 'AI', title: 'AI Readiness Score', desc: '8-factor analysis of your business health with direct improvement actions.' },
      { icon: 'MATCH', title: 'Matched Investors', desc: 'AI surfaces investors who fit your stage, sector, and funding requirements.' },
      { icon: 'NDA', title: 'Staged Disclosure', desc: 'Share only what you want, to who you trust, when you are ready.' },
      { icon: 'DEAL', title: 'Structured Deal Room', desc: 'Progress from match to milestones inside a verified, audited workspace.' },
    ],
  },
  Investor: {
    headline: 'Discover and evaluate opportunities with confidence.',
    body: 'AI-ranked deal flow, transparent match scoring, and a structured environment to evaluate, connect, and progress deals - without the noise.',
    features: [
      { icon: 'AI', title: 'AI Match Score', desc: '6-factor compatibility score, fully explained. No black-box recommendations.' },
      { icon: 'VERIFY', title: 'Verified Deal Flow', desc: 'Every business and founder is identity-verified before appearing in discovery.' },
      { icon: 'PORTFOLIO', title: 'Portfolio Dashboard', desc: 'Track active deal rooms, pipeline stages, and relationship history.' },
      { icon: 'REVERSE', title: 'Reverse Discovery', desc: 'Post investment theses so matched founders can approach you directly.' },
    ],
  },
  Professional: {
    headline: 'Find meaningful, well-matched collaboration.',
    body: 'Apply to opportunities ranked by AI compatibility, negotiate terms on-platform, and build a verified reputation across every engagement.',
    features: [
      { icon: 'RANK', title: 'AI Opportunity Ranking', desc: 'Opportunities ranked by fit score - not recency. Your time is respected.' },
      { icon: 'NEGOTIATE', title: 'On-Platform Negotiation', desc: 'Discuss, revise, and confirm engagement terms inside a tracked workspace.' },
      { icon: 'TRUST', title: 'Verified Reputation', desc: 'Every completed deal contributes to a transparent, earned reputation score.' },
      { icon: 'ROLES', title: 'Multi-Role Account', desc: 'Hold Founder, Investor, and Professional roles on one verified account.' },
    ],
  },
};

const FAQ_ITEMS = [
  { q: 'What is Vault Ventures?', a: 'Vault Ventures is a verified deal-facilitation platform connecting founders, investors, and professionals through AI-powered matching, staged disclosure, and structured Deal Rooms.' },
  { q: 'Who can join?', a: 'Any verified professional: founders raising capital, investors deploying it, or professionals offering skills. A single account can hold all three roles simultaneously.' },
  { q: 'Can one account have multiple roles?', a: 'Yes. A single account can hold Founder, Investor, and Professional roles. Each workspace is completely separate with independent dashboards and deal rooms.' },
  { q: 'How does AI matching work?', a: 'The engine uses rule-based scoring with documented, auditable weights across 6 factors. It is deterministic and fully explainable - you can inspect every factor and weight in the Match Score breakdown.' },
  { q: 'How does verification work?', a: 'Identity verification is tiered: Tier 1 (government ID), Tier 2 (accredited investor credentials), Tier 3 (institutional). Each tier unlocks additional platform capabilities.' },
  { q: 'How does the Deal Room work?', a: 'The Deal Room progresses through 8 defined stages from Match → Interest → NDA → Negotiation → Agreement → Milestones → Completed. Every action is time-stamped and auditable.' },
];

const JOURNEY_STEPS = ['Discover', 'Match', 'Connect', 'Build Trust', 'Collaborate', 'Deal'];

export default function Landing() {
  const [activePricingRole, setActivePricingRole] = useState('Founder');
  const [activeValueRole, setActiveValueRole] = useState<'Founder' | 'Investor' | 'Professional'>('Founder');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [authModalRole, setAuthModalRole] = useState<NormalRole | undefined>(undefined);

  const openAuth = (view: AuthModalView = 'login', role?: NormalRole) => {
    setAuthModalView(view);
    setAuthModalRole(role);
    setAuthModalOpen(true);
  };

  const pricing = PRICING.find(p => p.role === activePricingRole)!;
  const valueProp = VALUE_PROPS[activeValueRole];

  return (
    <div className="min-h-screen bg-[#0B1220] text-[color:var(--vv-text)]">

      {/* -- Public Nav --------------------------------------------- */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-5 lg:px-10 bg-[#0D1626] border-b border-[#1c2a3e]">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
            <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
              fill="#C67A4E" fillOpacity="0.22" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round" />
            <path d="M11 14l2 2 4-4" stroke="#E8A878" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display font-semibold text-[13.5px] text-[color:var(--vv-text)] tracking-tight">Vault Ventures</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-[12.5px]">
          {[['How It Works', '#how-it-works'], ['Trust', '#trust'], ['Premium', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
            <a key={label} href={href} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">{label}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => openAuth('login')}>Sign in</Button>
          <Button size="sm" onClick={() => openAuth('register')}>Get started</Button>
          <button className="md:hidden ml-1 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors p-1" onClick={() => setMobileNavOpen(v => !v)} aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileNavOpen}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileNavOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>

        {mobileNavOpen && (
          <div className="absolute top-full left-0 right-0 vv-glass-elevated border-b border-[#1c2a3e] py-3 px-5 flex flex-col gap-1">
            {[['How It Works', '#how-it-works'], ['Trust', '#trust'], ['Premium', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileNavOpen(false)}
                className="block py-2 text-[13px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] transition-colors">{label}</a>
            ))}
            <div className="pt-2 border-t border-[#1c2a3e] mt-1">
              <button onClick={() => { setMobileNavOpen(false); openAuth('login'); }} className="block w-full text-left py-2 text-[13px] text-[color:var(--vv-text-tertiary)]">Sign in</button>
            </div>
          </div>
        )}
      </nav>

      {/* -- Immersive Landing Hero Image --------------------------- */}
      <section className="relative w-full pt-14 bg-[#0B1220] flex items-center justify-center overflow-hidden border-b border-[#1c2a3e]/40">
        <div className="relative w-full max-w-[1920px] mx-auto flex items-center justify-center">
          <img
            src="/hero/vault-hero-base.png"
            alt="Vault Ventures Platform"
            className="w-full h-auto object-contain object-center select-none pointer-events-none"
            loading="eager"
          />
        </div>
      </section>

      {/* -- How It Works ------------------------------------------- */}
      <section id="how-it-works" className="py-20 px-5 lg:px-10 border-t border-[#1c2a3e] bg-[#0D1626]">
        <div className="max-w-[1120px] mx-auto">
          <div className="mb-10">
            <p className="text-[10px] text-[#C67A4E] uppercase tracking-[0.13em] font-semibold mb-3">How It Works</p>
            <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-[color:var(--vv-text)] tracking-tight">From discovery to trusted deal.</h2>
          </div>

          {/* Linear journey */}
          <div className="mb-12 overflow-x-auto pb-2">
            <div className="flex items-center gap-0 min-w-max mx-auto w-fit">
              {JOURNEY_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-full border flex items-center justify-center text-[11px] font-semibold"
                      style={{
                        borderColor: i === 0 ? '#C67A4E' : i === JOURNEY_STEPS.length - 1 ? '#C67A4E' : `rgba(198,122,78,${0.55 - i * 0.06})`,
                        color: i === 0 ? '#C67A4E' : i === JOURNEY_STEPS.length - 1 ? '#C67A4E' : `rgba(198,122,78,${0.75 - i * 0.07})`,
                        background: i === 0 ? 'rgba(198,122,78,0.08)' : i === JOURNEY_STEPS.length - 1 ? 'rgba(198,122,78,0.08)' : 'rgba(198,122,78,0.04)',
                      }}>
                      {i + 1}
                    </div>
                    <span className="text-[11.5px] font-medium whitespace-nowrap"
                      style={{ color: i === 0 ? '#C67A4E' : i === JOURNEY_STEPS.length - 1 ? '#C9845A' : '#93A1BF' }}>
                      {step}
                    </span>
                  </div>
                  {i < JOURNEY_STEPS.length - 1 && (
                    <div className="w-12 sm:w-16 h-px mx-1 mb-5 flex-shrink-0"
                      style={{ background: `linear-gradient(90deg, rgba(198,122,78,${0.28 - i * 0.03}), rgba(198,122,78,${0.10 + i * 0.03}))` }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 3-column role journeys */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-xl overflow-hidden">
            {[
              { role: 'Founder', color: '#C67A4E', steps: ['Register & verify identity', 'Build your Business Profile', 'AI generates Readiness Score', 'Discover investors & professionals', 'Progress through Staged Disclosure', 'Sign NDA → Deal Room', 'Track milestones, grow reputation'] },
              { role: 'Investor', color: '#C9A24B', steps: ['Register & verify credentials', 'Set investment preferences', 'AI surfaces matched startups', 'Review Match Score breakdowns', 'Express interest & connect', 'Due diligence via Deal Room', 'Portfolio tracking'] },
              { role: 'Professional', color: '#22C55E', steps: ['Register & verify skills', 'Build structured profile', 'AI ranks best-fit opportunities', 'Apply to matched startups', 'Negotiate terms on-platform', 'Join Deal Room as team member', 'Build verified reputation'] },
            ].map(({ role, color, steps }) => (
              <div key={role} className="bg-[#121A2B] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <p className="font-display font-semibold text-[14px] text-[color:var(--vv-text)]">{role}</p>
                </div>
                <div className="space-y-0">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-3 pb-3 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ borderColor: color, color }}>
                          {i + 1}
                        </div>
                        {i < steps.length - 1 && <div className="w-px flex-1 mt-1 min-h-[14px]" style={{ backgroundColor: `${color}25` }} />}
                      </div>
                      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] leading-snug pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-[color:var(--vv-border)]">
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => openAuth('register', role.toLowerCase() as NormalRole)}>
                    Register as {role}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Value Proposition -------------------------------------- */}
      <section className="py-20 px-5 lg:px-10">
        <div className="max-w-[1120px] mx-auto">
          <div className="mb-8">
            <p className="text-[10px] text-[#C67A4E] uppercase tracking-[0.13em] font-semibold mb-3">Built for Every Role</p>
            <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-[color:var(--vv-text)] tracking-tight">One platform. Three perspectives.</h2>
          </div>

          {/* Role tabs */}
          <div className="flex gap-1.5 mb-8">
            {(['Founder', 'Investor', 'Professional'] as const).map(role => (
              <button key={role} onClick={() => setActiveValueRole(role)}
                className={`px-4 py-2 rounded-md text-[12.5px] font-medium transition-all duration-150 ${activeValueRole === role
                    ? 'text-white border border-white/14'
                    : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}
                style={activeValueRole === role ? {
                  background: 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)',
                } : undefined}>
                {role}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div>
              <h3 className="font-display text-[22px] font-semibold text-[color:var(--vv-text)] mb-3 leading-snug">{valueProp.headline}</h3>
              <p className="text-[14px] text-[color:var(--vv-text-tertiary)] leading-relaxed mb-6">{valueProp.body}</p>
              <Button size="md" onClick={() => openAuth('register', activeValueRole.toLowerCase() as NormalRole)}>
                Get started as {activeValueRole} <IconArrowRight s={14} />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {valueProp.features.map((f, i) => (
                <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-4">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center mb-3"
                    style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.15)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">{f.title}</p>
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- AI Capabilities ---------------------------------------- */}
      <section id="ai" className="py-20 px-5 lg:px-10 border-t border-[#1c2a3e] bg-[#0D1626]">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <p className="text-[10px] text-[#C67A4E] uppercase tracking-[0.13em] font-semibold mb-3">AI Capabilities</p>
              <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-[color:var(--vv-text)] mb-4 tracking-tight">Explainable by design.</h2>
              <p className="text-[14px] text-[color:var(--vv-text-tertiary)] leading-relaxed mb-6">
                Every score is rule-based and transparent. The matching engine uses documented, auditable weights. No ML opacity - just clear logic you can inspect and act on.
              </p>
              <div className="space-y-px bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-[10px] overflow-hidden mb-5">
                {[
                  { title: 'Readiness Score', desc: '8-factor analysis of your business. Each factor links directly to improvement actions.' },
                  { title: 'Match Engine', desc: '6-factor weighted compatibility score. Always explained. Never a black box.' },
                  { title: 'Search vs. Suggestions', desc: 'Search results and AI recommendations are always visually distinct - never merged.' },
                  { title: 'Explainability', desc: 'Every AI recommendation can be inspected: which factors drove the score, with what weight.' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#121A2B] px-5 py-4 flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]/60 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">{item.title}</p>
                      <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-transparent border border-[color:var(--vv-border-strong)] rounded-[10px]">
                <p className="text-[11px] font-semibold text-[#F59E0B] mb-1">MVP Transparency Notice</p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Current platform uses deterministic rule-based scoring, not ML. Explainability is a core design requirement, not a roadmap item.</p>
              </div>
            </div>
            <div>
              <ScoreDetail score={86} label="Match Score" qualitativeBand="Strong Match"
                factors={MATCH_FACTORS} title="Live Match Score Breakdown"
                subtitle="Click any factor to see the explanation"
                type="match" partyA={{ name: 'NovaTech AI' }} partyB={{ name: 'Meridian Capital' }} />
            </div>
          </div>
        </div>
      </section>

      {/* -- Trust & Security --------------------------------------- */}
      <section id="trust" className="py-20 px-5 lg:px-10">
        <div className="max-w-[1120px] mx-auto">
          <div className="mb-10">
            <p className="text-[10px] text-[#C67A4E] uppercase tracking-[0.13em] font-semibold mb-3">Trust & Security</p>
            <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-[color:var(--vv-text)] tracking-tight">Verified identity. Staged access. Full audit trail.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Verification Tiers</p>
              </div>
              {TRUST_TIERS.map(({ tier, label, desc, color }) => (
                <div key={tier} className="flex items-center gap-4 px-5 py-4 border-b border-[#1c2a3e] last:border-0">
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}>
                    <span style={{ color }}><IconShield s={14} /></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[12px] font-semibold" style={{ color }}>{tier}</p>
                      <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{label}</p>
                    </div>
                    <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Staged Disclosure</p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Information unlocks progressively as trust develops</p>
              </div>
              <div className="px-5 pt-5 pb-5 space-y-0">
                {[
                  { label: 'Stage 1 - Teaser', desc: 'Company name, 1-line pitch, industry, stage. Always visible.', locked: false },
                  { label: 'Stage 2 - Extended Info', desc: 'Business model, market size, team overview. Unlocks after expressed interest.', locked: false },
                  { label: 'Stage 3 - NDA Required', desc: 'Full financials, cap table, data room. Unlocks after NDA signed.', locked: true },
                  { label: 'Stage 4 - Full Proposal', desc: 'Term sheet, shareholders agreement. Agreement-gated.', locked: true },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${!s.locked ? 'bg-[#22C55E] border-[#22C55E]' : 'bg-transparent border-[color:var(--vv-border-strong)]'
                        }`}>
                        {!s.locked ? <IconCheck s={12} className="text-white" /> : <span className="text-[color:var(--vv-text-tertiary)] text-[9px] font-bold">{i + 1}</span>}
                      </div>
                      {i < 3 && <div className={`w-px flex-1 mt-1 min-h-[16px] ${!s.locked ? 'bg-[#22C55E]/30' : 'bg-[#35446A]/40'}`} />}
                    </div>
                    <div className="pb-1">
                      <p className={`text-[12.5px] font-semibold mb-0.5 ${s.locked ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[color:var(--vv-text)]'}`}>{s.label}</p>
                      <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust features row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { title: 'Identity Verification', icon: 'ID', desc: 'Government ID - Tier 1 required for core features.' },
              { title: 'Reputation System', icon: 'TRUST', desc: 'Earned scores from completed, verified on-platform deals.' },
              { title: 'NDA / Confidentiality', icon: 'NDA', desc: 'Platform-level NDA before Stage 3 content is accessible.' },
              { title: 'Secure Deal Room', icon: 'DEAL', desc: 'All deal activity is logged, time-stamped, and auditable.' },
              { title: 'Role Isolation', icon: 'ROLES', desc: 'Founder, Investor, Professional workspaces are fully isolated.' },
            ].map((item, i) => (
              <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-4">
                <div className="w-2 h-2 rounded-full mb-3" style={{ background: 'rgba(198,122,78,0.6)' }} />
                <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-1.5">{item.title}</p>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Premium ------------------------------------------------ */}
      <section id="pricing" className="py-20 px-5 lg:px-10 border-t border-[#1c2a3e] bg-[#0D1626]">
        <div className="max-w-[800px] mx-auto">
          <div className="mb-8">
            <p className="text-[10px] text-[#C67A4E] uppercase tracking-[0.13em] font-semibold mb-3">Premium</p>
            <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-[color:var(--vv-text)] tracking-tight">Start free. Upgrade when ready.</h2>
          </div>
          <div className="flex gap-1.5 mb-6">
            {['Founder', 'Investor', 'Professional'].map(r => (
              <button key={r} onClick={() => setActivePricingRole(r)}
                className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${activePricingRole === r
                    ? 'text-white border border-white/14'
                    : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}
                style={activePricingRole === r ? {
                  background: 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)',
                } : undefined}>
                {r}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-5">
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-1.5">Free</p>
              <p className="font-display text-[28px] font-semibold text-[color:var(--vv-text)] mb-4">৳0<span className="text-[13px] font-normal text-[color:var(--vv-text-tertiary)]">/mo</span></p>
              <ul className="space-y-2 mb-6">
                {pricing.free.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12.5px] text-[color:var(--vv-text-secondary)]">
                    <IconCheck s={12} className="text-[#22C55E] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="w-full" size="md" onClick={() => openAuth('register', activePricingRole.toLowerCase() as NormalRole)}>
                Start free
              </Button>
            </div>
            <div className="bg-[#121A2B] border rounded-[10px] p-5 relative overflow-hidden"
              style={{ borderColor: 'rgba(198,122,78,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.065), 0 0 24px rgba(198,122,78,0.06), 0 0 40px rgba(198,122,78,0.04)' }}>
              <div className="absolute top-0 right-0 px-2.5 py-1 text-white text-[10px] font-semibold rounded-bl-lg"
                style={{ background: 'linear-gradient(135deg, #7A4527, #C67A4E)' }}>Premium</div>
              <p className="text-[10px] uppercase tracking-widest text-[#C67A4E] font-semibold mb-1.5">Premium</p>
              <p className="font-display text-[28px] font-semibold text-[color:var(--vv-text)] mb-4">{pricing.price}<span className="text-[13px] font-normal text-[color:var(--vv-text-tertiary)]">/mo</span></p>
              <ul className="space-y-2 mb-6">
                {pricing.premium.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12.5px] text-[color:var(--vv-text-secondary)]">
                    <IconCheck s={12} className="text-[#C67A4E] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" size="md" onClick={() => openAuth('register', activePricingRole.toLowerCase() as NormalRole)}>
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* -- FAQ ---------------------------------------------------- */}
      <section id="faq" className="py-20 px-5 lg:px-10">
        <div className="max-w-[680px] mx-auto">
          <div className="mb-8">
            <p className="text-[10px] text-[#C67A4E] uppercase tracking-[0.13em] font-semibold mb-3">FAQ</p>
            <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-[color:var(--vv-text)] tracking-tight">Common questions</h2>
          </div>
          <div className="space-y-1">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden bg-[#121A2B]">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[color:var(--vv-raised)]/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[13px] font-medium text-[color:var(--vv-text)] pr-4">{item.q}</span>
                  <IconChevronDown s={14} className={`flex-shrink-0 text-[color:var(--vv-text-tertiary)] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-[color:var(--vv-border)]">
                    <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Final CTA ---------------------------------------------- */}
      <section className="py-20 px-5 lg:px-10 border-t border-[#1c2a3e] bg-[#0D1626]">
        <div className="max-w-[560px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C67A4E]/20 bg-[#C67A4E]/6 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />
            <span className="text-[11.5px] text-[#C67A4E] font-medium">Verified platform</span>
          </div>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold text-[color:var(--vv-text)] mb-4 tracking-tight leading-tight">
            Build better connections.<br />Move from discovery to<br />trusted collaboration.
          </h2>
          <p className="text-[14px] text-[color:var(--vv-text-tertiary)] mb-8 leading-relaxed">
            Join verified founders, investors, and professionals building structured deals on a platform designed for trust.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={() => openAuth('register')}>Get Started <IconArrowRight s={15} /></Button>
            <Button size="lg" variant="secondary" onClick={() => openAuth('login')}>Sign In</Button>
          </div>
        </div>
      </section>

      {/* -- Footer ------------------------------------------------- */}
      <footer className="border-t border-[#1c2a3e] bg-[#0D1626]">
        <div className="max-w-[1120px] mx-auto px-5 lg:px-10 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5 vv-logo-glow">
                  <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
                    fill="#C67A4E" fillOpacity="0.22" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round" />
                  <path d="M11 14l2 2 4-4" stroke="#E8A878" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)]">Vault Ventures</span>
              </div>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed">A verified deal-facilitation platform for founders, investors, and professionals.</p>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-3">Platform</p>
              <div className="space-y-2">
                {[['How It Works', '#how-it-works'], ['Trust & Security', '#trust'], ['FAQ', '#faq'], ['Premium', '#pricing']].map(([label, href]) => (
                  <a key={label} href={href} className="block text-[12.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">{label}</a>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-3">Legal</p>
              <div className="space-y-2">
                <span className="block text-[12.5px] text-[color:var(--vv-text-tertiary)]/50 cursor-default">Privacy</span>
                <span className="block text-[12.5px] text-[color:var(--vv-text-tertiary)]/50 cursor-default">Terms</span>
              </div>
            </div>

            {/* Auth */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--vv-text-tertiary)] mb-3">Get Access</p>
              <div className="space-y-2.5">
                <button onClick={() => openAuth('login')} className="block text-[12.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors text-left">
                  Sign In
                </button>
                <button onClick={() => openAuth('register')} className="block text-[12.5px] text-[#C67A4E] hover:text-[#C67A4E] transition-colors text-left">
                  Get Started →
                </button>
                <Link to="/admin-login" className="block text-[11px] text-[color:var(--vv-text-tertiary)]/50 hover:text-[color:var(--vv-text-tertiary)] transition-colors">
                  Admin access
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#1c2a3e] flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">© 2025 Vault Ventures. All rights reserved.</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center sm:text-right">Financial figures are simulations. No real capital is raised or transferred on-platform.</p>
          </div>
        </div>
      </footer>

      {/* -- Auth Modal Dialog -------------------------------------- */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
        initialRole={authModalRole}
      />

    </div>
  );
}