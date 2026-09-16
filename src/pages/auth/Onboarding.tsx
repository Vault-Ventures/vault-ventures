import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck } from '../../components/layout/Icons';
import { useAuth, NormalRole } from '../../context/AuthContext';

type Role = NormalRole;

// ─── Shared ───────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
        <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
          fill="#C67A4E" fillOpacity="0.22" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M11 14l2 2 4-4" stroke="#C67A4E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)] tracking-tight">Vault Ventures</span>
    </Link>
  );
}

function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors -ml-0.5">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      {label}
    </button>
  );
}

function Field({ id, label, type = 'text', placeholder, value, onChange, description }: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; description?: string;
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1" htmlFor={id}>{label}</label>
      {description && <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1.5">{description}</p>}
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors" />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, description }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; description?: string;
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1" htmlFor={id}>{label}</label>
      {description && <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1.5">{description}</p>}
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors appearance-none cursor-pointer">
        <option value="">Select…</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TagSelector({ label, options, selected, onChange, description }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; description?: string;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  }
  return (
    <div>
      <p className="text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">{label}</p>
      {description && <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-1.5">{description}</p>}
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                active
                  ? 'bg-[#C67A4E]/10 border-[#C67A4E]/50 text-[#C67A4E]'
                  : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:border-[#5E6D8F]'
              }`}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

function OnboardingProgress({ roles, currentStep }: { roles: Role[]; currentStep: number }) {
  const roleLabels: Record<Role, string> = { founder: 'Founder', investor: 'Investor', professional: 'Professional' };
  const steps = ['Account', 'Roles', ...roles.map(r => roleLabels[r]), 'Complete'];
  const activeIndex = currentStep + 2;

  return (
    <div className="flex items-center gap-0 flex-wrap justify-center mb-8">
      {steps.map((label, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-semibold transition-colors ${
                done ? 'bg-[#C67A4E] border-[#C67A4E]' :
                active ? 'border-[#C67A4E] text-[#C67A4E]' :
                'border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]'
              }`}>
                {done ? <IconCheck s={8} className="text-[color:var(--vv-on-copper)]" /> : i + 1}
              </div>
              <span className={`text-[9.5px] mt-1 whitespace-nowrap transition-colors ${
                active ? 'text-[color:var(--vv-text)]' : done ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)]'
              }`}>{label}</span>
            </div>
            {!isLast && (
              <div className={`w-8 h-px mb-4 transition-colors ${done ? 'bg-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Role setup forms ─────────────────────────────────────────────────────────

function FounderSetup({ onNext, onSkip }: { onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const [business, setBusiness] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#C67A4E] font-semibold mb-1">Founder Setup</p>
        <h2 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)]">Tell us about your venture</h2>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">This initial information will help initialize your profile.</p>
      </div>
      <Field id="ob-biz" label="Business name" placeholder="e.g. NovaTech Solutions" value={business} onChange={setBusiness} />
      <SelectField id="ob-ind" label="Primary industry" value={industry} onChange={setIndustry}
        options={['FinTech', 'HealthTech', 'Enterprise SaaS', 'Consumer', 'CleanTech', 'AI & Data', 'E-commerce', 'Other']} />
      <SelectField id="ob-stage" label="Current stage" value={stage} onChange={setStage}
        options={['Idea / Concept', 'MVP / Prototype', 'Early Traction', 'Growth / Scaling']} />
      <SelectField id="ob-exp" label="Founder experience" value={experience} onChange={setExperience}
        options={['First-time founder', 'Serial founder (1-2 exits)', 'Experienced operator', 'Academic / Research']} />
      <TagSelector label="Key domain strengths" options={['Product', 'Engineering', 'Sales & GTM', 'Finance & Ops', 'Design & UX', 'Marketing']}
        selected={skills} onChange={setSkills} description="Select up to 3 core areas" />
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={onNext}>Continue</Button>
        <Button variant="ghost" onClick={onSkip} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]">Complete later</Button>
      </div>
    </div>
  );
}

function InvestorSetup({ onNext, onSkip }: { onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const [investorType, setInvestorType] = useState('');
  const [ticketSize, setTicketSize] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#C9A24B] font-semibold mb-1">Investor Setup</p>
        <h2 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)]">Your investment thesis</h2>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Set parameters for opportunity matching.</p>
      </div>
      <SelectField id="ob-inv-type" label="Investor profile" value={investorType} onChange={setInvestorType}
        options={['Angel Investor', 'Family Office', 'Venture Capital', 'Corporate VC', 'Syndicate Lead']} />
      <SelectField id="ob-ticket" label="Preferred check size" value={ticketSize} onChange={setTicketSize}
        options={['৳10K - ৳50K', '৳50K - ৳250K', '৳250K - ৳1M', '৳1M+']} />
      <TagSelector label="Target sectors" options={['FinTech', 'HealthTech', 'Enterprise SaaS', 'CleanTech', 'AI & Data', 'Consumer']}
        selected={industries} onChange={setIndustries} description="Select all that fit your mandate" />
      <TagSelector label="Target stages" options={['Pre-Seed', 'Seed', 'Series A', 'Series B+']}
        selected={stages} onChange={setStages} />
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={onNext}>Continue</Button>
        <Button variant="ghost" onClick={onSkip} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]">Complete later</Button>
      </div>
    </div>
  );
}

function ProfessionalSetup({ onNext, onSkip }: { onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [rate, setRate] = useState('');
  const [availability, setAvailability] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#22C55E] font-semibold mb-1">Professional Setup</p>
        <h2 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)]">Your expertise & availability</h2>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Configure your profile for matching opportunities.</p>
      </div>
      <Field id="ob-title" label="Headline / Primary Title" placeholder="e.g. Fractional CTO | Senior ML Engineer" value={title} onChange={setTitle} />
      <TagSelector label="Core skills" options={['React/TypeScript', 'Python/ML', 'Go/Cloud', 'UI/UX Design', 'Product Strategy', 'Growth Marketing', 'Financial Modeling', 'Legal/Contracts']}
        selected={skills} onChange={setSkills} description="Select skills relevant to startup engagements" />
      <SelectField id="ob-rate" label="Hourly rate / compensation" value={rate} onChange={setRate}
        options={['৳50 - ৳100/hr', '৳100 - ৳175/hr', '৳175 - ৳250/hr', '৳250+/hr', 'Equity / Advisory only']} />
      <SelectField id="ob-avail" label="Weekly availability" value={availability} onChange={setAvailability}
        options={['5-10 hrs/week (Advisory)', '10-20 hrs/week (Part-time)', '20-40 hrs/week (Full project)', 'Available immediately']} />
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={onNext}>Continue</Button>
        <Button variant="ghost" onClick={onSkip} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]">Complete later</Button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const roles: Role[] = session.roles.length > 0 ? session.roles : ['founder'];
  const [step, setStep] = useState(0); // index into roles[]

  function next() {
    if (step < roles.length - 1) {
      setStep(s => s + 1);
    } else {
      navigate('/onboarding/complete?role=' + roles[0]);
    }
  }

  function back() {
    if (step === 0) {
      navigate('/register');
    } else {
      setStep(s => s - 1);
    }
  }

  function skip() {
    navigate('/onboarding/complete?role=' + roles[0] + '&skip=1');
  }

  const currentRole = roles[step] || 'founder';

  const formMap: Record<Role, React.ReactNode> = {
    founder: <FounderSetup onNext={next} onBack={back} onSkip={skip} />,
    investor: <InvestorSetup onNext={next} onBack={back} onSkip={skip} />,
    professional: <ProfessionalSetup onNext={next} onBack={back} onSkip={skip} />,
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Back */}
        <div className="mb-6">
          <BackButton onClick={back} label={step === 0 ? 'Back to Registration' : 'Back'} />
        </div>

        {/* Progress */}
        <OnboardingProgress roles={roles} currentStep={step} />

        {/* Content card */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-6">
          {formMap[currentRole]}
        </div>

        {/* Role context note */}
        {roles.length > 1 && (
          <p className="text-center text-[11px] text-[color:var(--vv-text-tertiary)] mt-4">
            Setting up{' '}
            <strong className="text-[color:var(--vv-text)]">{step + 1} of {roles.length}</strong>{' '}
            selected roles. Your account keeps all roles.
          </p>
        )}
      </div>
    </div>
  );
}