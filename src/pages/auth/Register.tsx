import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck } from '../../components/layout/Icons';
import { useAuth } from '../../context/AuthContext';

type Role = 'founder' | 'investor' | 'professional';

const ROLES: { id: Role; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'founder',
    label: 'Founder',
    desc: 'Build and list your business, raise capital, and build your team.',
    color: '#C67A4E',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V12m0 0L8.5 8.5M12 12l3.5-3.5M3.5 17.5l3-3m11 3l-3-3M12 3v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
      </svg>
    ),
  },
  {
    id: 'investor',
    label: 'Investor',
    desc: 'Discover verified startups matched to your investment thesis.',
    color: '#C9A24B',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: 'professional',
    label: 'Professional',
    desc: 'Apply your skills to matched startup opportunities.',
    color: '#22C55E',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
        <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
          fill="#C67A4E" fillOpacity="0.18" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M11 14l2 2 4-4" stroke="#C67A4E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)] tracking-tight">Vault Ventures</span>
    </Link>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors -ml-0.5">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Back
    </button>
  );
}

function Field({ id, label, type = 'text', placeholder, value, onChange, error, hint, suffix }: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string; hint?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor={id}>{label}</label>
      <div className="relative">
        <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full h-9 px-3 ${suffix ? 'pr-10' : ''} bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors ${
            error ? 'border-[#F04438] focus:border-[#F04438]' : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'
          }`} />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {error && <p className="text-[11px] text-[#F04438] mt-1">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">{hint}</p>}
    </div>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: number }) {
  const steps = ['Account', 'Roles', 'Verify'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold transition-colors ${
                done ? 'bg-[#C67A4E] border-[#C67A4E]' :
                active ? 'border-[#C67A4E] text-[#C67A4E]' :
                'border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]'
              }`}>
                {done ? <IconCheck s={10} className="text-[color:var(--vv-on-copper)]" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap transition-colors ${
                active ? 'text-[color:var(--vv-text)]' : done ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)]'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-px mb-4 transition-colors ${done ? 'bg-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Steps ─────────────────────────────────────────────────────────────────────

function AccountStep({ onNext, onBack }: { onNext: (data: { name: string; email: string }) => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwWeak = pw.length > 0 && pw.length < 8;
  const pwMismatch = !!confirm && pw !== confirm;
  const valid = name.trim() && email.includes('@') && pw.length >= 8 && pw === confirm;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onNext({ name, email }); }, 600);
  }

  const eyeIcon = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
      {show ? (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
        </svg>
      ) : (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
          <path strokeLinecap="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
        </svg>
      )}
    </button>
  );

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-1">Create your account</h1>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-6">
        Already have an account? <Link to="/login" className="text-[#C67A4E] hover:underline">Sign in</Link>
      </p>
      <form onSubmit={submit} className="space-y-3.5">
        <Field id="reg-name" label="Full name" value={name} onChange={setName} placeholder="Alex Morgan"
          error={touched && !name.trim() ? 'Full name is required.' : undefined} />
        <Field id="reg-email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com"
          error={touched && !email.includes('@') ? 'A valid email address is required.' : undefined} />
        <Field id="reg-pw" label="Password" type={showPw ? 'text' : 'password'} value={pw} onChange={setPw}
          placeholder="Min. 8 characters"
          hint={pw.length === 0 ? undefined : undefined}
          error={pwWeak ? 'At least 8 characters required.' : undefined}
          suffix={eyeIcon(showPw, () => setShowPw(v => !v))} />
        <Field id="reg-confirm" label="Confirm password" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={setConfirm}
          placeholder="Repeat password"
          error={pwMismatch ? 'Passwords do not match.' : undefined}
          suffix={eyeIcon(showConfirm, () => setShowConfirm(v => !v))} />
        <Button type="submit" className="w-full mt-1" loading={loading}>Continue</Button>
      </form>
      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center mt-5 leading-relaxed">
        By creating an account you agree to our{' '}
        <span className="text-[#C67A4E] hover:underline cursor-pointer">Terms of Service</span>{' '}
        and{' '}
        <span className="text-[#C67A4E] hover:underline cursor-pointer">Privacy Policy</span>.
      </p>
    </div>
  );
}

function RoleStep({ onNext, onBack }: { onNext: (roles: Role[]) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<Set<Role>>(new Set());

  function toggle(role: Role) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  }

  return (
    <div>
      <h1 className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-1">How will you use Vault Ventures?</h1>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-6">Select one or more roles. You can add more later.</p>
      <div className="space-y-2.5 mb-6">
        {ROLES.map(r => {
          const active = selected.has(r.id);
          return (
            <button key={r.id} type="button" onClick={() => toggle(r.id)}
              className={`w-full flex items-start gap-4 px-4 py-3.5 rounded-[10px] border-2 text-left transition-all ${
                active
                  ? 'border-[#C67A4E] bg-[#C67A4E]/5'
                  : 'border-[color:var(--vv-border)] bg-[#121A2B] hover:border-[color:var(--vv-border-strong)]'
              }`}>
              <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                active ? 'bg-[#C67A4E]/15' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]'
              }`} style={{ color: active ? r.color : '#5E6D8F' }}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">{r.label}</p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{r.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                active ? 'bg-[#C67A4E] border-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
              }`}>
                {active && <IconCheck s={10} className="text-[color:var(--vv-on-copper)]" />}
              </div>
            </button>
          );
        })}
      </div>
      <Button className="w-full" disabled={selected.size === 0} onClick={() => onNext(Array.from(selected))}>
        Continue {selected.size > 0 && `with ${selected.size} role${selected.size > 1 ? 's' : ''}`}
      </Button>
      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center mt-3">One account holds all your selected roles.</p>
    </div>
  );
}

function VerifyStep({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);

  function resend() { setResent(true); setTimeout(() => setResent(false), 3000); }

  return (
    <div>
      <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#C67A4E]/30 flex items-center justify-center mb-5">
        <svg width="22" height="22" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
        </svg>
      </div>
      <h1 className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-1">Check your email</h1>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-2">
        We sent a verification link to <span className="text-[color:var(--vv-text)] font-medium">{email}</span>.
      </p>
      <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-6">Click the link in the email to confirm your account and continue setup.</p>

      <div className="space-y-2.5 mb-6">
        <Button className="w-full" onClick={() => navigate('/onboarding')}>
          Continue to Profile Setup
        </Button>
        <Button variant="secondary" className="w-full" onClick={resend} disabled={resent}>
          {resent ? 'Email resent' : 'Resend email'}
        </Button>
      </div>

      <div className="flex flex-col gap-2 items-center">
        <button className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          Change email address
        </button>
        <Link to="/login" className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          Back to Sign in
        </Link>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const { beginRegistration } = useAuth();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');

  function handleAccount(data: { name: string; email: string }) {
    beginRegistration(data);
    setEmail(data.email);
    setStep(1);
  }

  function handleRoles(roles: Role[]) {
    // Store roles for onboarding (in real app this would be in auth state)
    sessionStorage.setItem('vv_reg_roles', JSON.stringify(roles));
    setStep(2);
  }

  const leftPanel = (
    <div className="hidden lg:flex flex-col justify-between w-96 bg-[#0D1626] border-r border-[#1c2a3e] p-10 shrink-0">
      <div>
        <Logo />
        <div className="mt-14 space-y-6">
          {[
            { title: 'One account, multiple roles', desc: 'A single Vault Ventures account can hold Founder, Investor, and Professional roles simultaneously.' },
            { title: 'Verified identity', desc: 'Every participant is ID-verified before accessing core platform features.' },
            { title: 'Unified profile', desc: 'All your roles, businesses, and connections live in one place.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 w-4 h-4 rounded-full border border-[#C67A4E]/40 flex items-center justify-center shrink-0">
                <IconCheck s={9} className="text-[#C67A4E]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-0.5">{item.title}</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Financial figures are simulations. No real capital is raised on-platform.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1220] flex">
      {leftPanel}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Back */}
          <div className="mb-7">
            {step === 0 && (
              <button onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors -ml-0.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back to Sign in
              </button>
            )}
            {step === 1 && <BackButton onClick={() => setStep(0)} />}
            {step === 2 && <BackButton onClick={() => setStep(1)} />}
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden mb-7">
            <Logo />
          </div>

          <StepProgress step={step} />

          {step === 0 && <AccountStep onNext={handleAccount} onBack={() => navigate('/login')} />}
          {step === 1 && <RoleStep onNext={handleRoles} onBack={() => setStep(0)} />}
          {step === 2 && <VerifyStep email={email} onBack={() => setStep(1)} />}
        </div>
      </div>
    </div>
  );
}