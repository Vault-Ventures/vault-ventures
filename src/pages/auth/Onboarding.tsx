import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck } from '../../components/layout/Icons';
import { useAuth } from '../../context/AuthContext';

type Role = 'founder' | 'investor' | 'professional';

// Read roles from session (set during registration) or default to founder
function getRegisteredRoles(): Role[] {
  try {
    const stored = sessionStorage.getItem('vv_reg_roles');
    if (stored) {
      const roles = JSON.parse(stored) as Role[];
      if (Array.isArray(roles) && roles.length > 0) return roles;
    }
  } catch {}
  return ['founder'];
}

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
  // currentStep: 0=founder setup, 1=investor setup, etc; offset by 2 for Account+Roles
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

function FounderSetup({ onNext, onBack, onSkip }: { onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const [business, setBusiness] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const INDUSTRIES = ['FinTech', 'HealthTech', 'EdTech', 'SaaS', 'Logistics', 'AI/ML', 'Consumer', 'CleanTech', 'BioTech', 'Other'];
  const STAGES = ['Pre-Idea', 'Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'];
  const SKILLS = ['Product', 'Engineering', 'Design', 'Sales', 'Marketing', 'Finance', 'Operations', 'Legal', 'Data'];
  const INTERESTS = ['Angel Investment', 'Strategic Advisors', 'Technical Co-founder', 'GTM Partners', 'Enterprise Sales'];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-md bg-[#C67A4E]/10 border border-[#C67A4E]/30 flex items-center justify-center text-[10px] font-bold text-[#C67A4E]">F</span>
        <h2 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Founder Setup</h2>
      </div>
      <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-5">Tell us about your business to improve your matches.</p>
      <div className="space-y-3.5 mb-6">
        <Field id="f-biz" label="Business / Company name" placeholder="e.g. NovaTech AI" value={business} onChange={setBusiness} />
        <SelectField id="f-industry" label="Industry" value={industry} onChange={setIndustry} options={INDUSTRIES} />
        <SelectField id="f-stage" label="Business stage" value={stage} onChange={setStage} options={STAGES} />
        <SelectField id="f-exp" label="Founder experience" value={experience} onChange={setExperience}
          options={['First-time founder', '1–2 previous companies', '3+ previous companies', 'Exited founder']} />
        <TagSelector label="Your skills" options={SKILLS} selected={skills} onChange={setSkills}
          description="Select skills you bring as a founder." />
        <TagSelector label="What you're looking for" options={INTERESTS} selected={interests} onChange={setInterests} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onNext}>Continue</Button>
        <Button variant="ghost" onClick={onSkip} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]">Complete later</Button>
      </div>
    </div>
  );
}

function InvestorSetup({ onNext, onBack, onSkip }: { onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const [investorType, setInvestorType] = useState('');
  const [stage, setStage] = useState('');
  const [range, setRange] = useState('');
  const [location, setLocation] = useState('');
  const [involvement, setInvolvement] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);

  const TYPES = ['Angel Investor', 'Venture Capital', 'Family Office', 'Corporate VC', 'Syndicate Lead', 'Private Equity'];
  const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'All Stages'];
  const RANGES = ['Under ৳25L', '৳25L–৳1Cr', '৳1Cr–৳5Cr', '৳5Cr–৳20Cr', '৳20Cr+', 'Varies'];
  const INVOLVEMENT = ['Hands-on advisor', 'Board seat', 'Passive investor', 'Strategic connector', 'Open to discussion'];
  const INDUSTRIES = ['FinTech', 'HealthTech', 'EdTech', 'SaaS', 'Logistics', 'AI/ML', 'Consumer', 'CleanTech', 'BioTech'];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-md bg-[#C9A24B]/10 border border-[#C9A24B]/30 flex items-center justify-center text-[10px] font-bold text-[#C9A24B]">I</span>
        <h2 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Investor Setup</h2>
      </div>
      <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-5">Define your investment thesis for better startup matches.</p>
      <div className="space-y-3.5 mb-6">
        <SelectField id="i-type" label="Investor type" value={investorType} onChange={setInvestorType} options={TYPES} />
        <TagSelector label="Preferred industries" options={INDUSTRIES} selected={industries} onChange={setIndustries} />
        <SelectField id="i-stage" label="Preferred stage" value={stage} onChange={setStage} options={STAGES} />
        <SelectField id="i-range" label="Investment range" value={range} onChange={setRange} options={RANGES} />
        <Field id="i-loc" label="Location" placeholder="e.g. London, UK" value={location} onChange={setLocation} />
        <SelectField id="i-inv" label="Involvement preference" value={involvement} onChange={setInvolvement} options={INVOLVEMENT} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onNext}>Continue</Button>
        <Button variant="ghost" onClick={onSkip} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]">Complete later</Button>
      </div>
    </div>
  );
}

function ProfessionalSetup({ onNext, onBack, onSkip }: { onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [workPref, setWorkPref] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  const SKILLS = ['Product Management', 'Engineering', 'Design / UX', 'Marketing', 'Sales', 'Finance / CFO', 'Legal / Compliance', 'Data Science', 'Operations', 'HR / Talent'];
  const INDUSTRIES = ['FinTech', 'HealthTech', 'EdTech', 'SaaS', 'Logistics', 'AI/ML', 'Consumer', 'CleanTech', 'BioTech'];
  const EXP = ['0–2 years', '3–5 years', '6–10 years', '10+ years', 'Executive / C-suite'];
  const AVAIL = ['Full-time', 'Part-time', 'Advisory only', 'Project-based', 'Open'];
  const WORK = ['Remote', 'Hybrid', 'On-site', 'Flexible'];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-md bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[10px] font-bold text-[#22C55E]">P</span>
        <h2 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Professional Setup</h2>
      </div>
      <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-5">Tell us about your expertise to match you with the right opportunities.</p>
      <div className="space-y-3.5 mb-6">
        <TagSelector label="Your skills" options={SKILLS} selected={skills} onChange={setSkills}
          description="Select your primary professional skills." />
        <TagSelector label="Industry experience" options={INDUSTRIES} selected={industries} onChange={setIndustries} />
        <SelectField id="p-exp" label="Years of experience" value={experience} onChange={setExperience} options={EXP} />
        <SelectField id="p-avail" label="Availability" value={availability} onChange={setAvailability} options={AVAIL} />
        <SelectField id="p-work" label="Work preference" value={workPref} onChange={setWorkPref} options={WORK} />
        <Field id="p-loc" label="Location" placeholder="e.g. Berlin, Germany" value={location} onChange={setLocation} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onNext}>Continue</Button>
        <Button variant="ghost" onClick={onSkip} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]">Complete later</Button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const roles = getRegisteredRoles();
  const [step, setStep] = useState(0); // index into roles[]

  function next() {
    if (step < roles.length - 1) {
      setStep(s => s + 1);
    } else {
      completeOnboarding(roles);
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
    completeOnboarding(roles);
    navigate('/onboarding/complete?role=' + roles[0] + '&skip=1');
  }

  const currentRole = roles[step];

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