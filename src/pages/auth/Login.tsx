import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck } from '../../components/layout/Icons';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInDemo } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      signInDemo({ email });
      navigate('/app/founder/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 bg-[#0D1626] border-r border-[#1c2a3e] p-10 shrink-0">
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-14">
            <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
              <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
                fill="#C67A4E" fillOpacity="0.22" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
              <path d="M11 14l2 2 4-4" stroke="#C67A4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)] tracking-tight">Vault Ventures</span>
          </Link>
          <div className="space-y-6">
            {[
              { title: 'One account, multiple roles', desc: 'Hold Founder, Investor, and Professional roles simultaneously on a single account.' },
              { title: 'Verified identity', desc: 'Every participant is ID-verified before accessing core platform features.' },
              { title: 'Staged trust', desc: 'Business information unlocks progressively as deal relationships develop.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 w-4 h-4 rounded-full border border-[#C67A4E]/40 flex items-center justify-center flex-shrink-0">
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
        <div className="space-y-2">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Financial figures are simulations. No real capital is raised on-platform.</p>
          <Link to="/admin-login" className="block text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">Admin access →</Link>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Back nav */}
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors mb-7 -ml-0.5">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6">
              <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z" fill="#C67A4E" fillOpacity="0.18" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)]">Vault Ventures</span>
          </Link>
          <h1 className="font-display text-[22px] font-semibold text-[color:var(--vv-text)] mb-1.5">Sign in</h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-7">
            No account?{' '}
            <Link to="/register" className="text-[#C67A4E] hover:underline">Create account</Link>
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-[#F04438]/8 border border-[#F04438]/30 rounded-md">
              <p className="text-[12px] text-[#F04438]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11.5px] font-medium text-[color:var(--vv-text-secondary)]" htmlFor="login-pw">Password</label>
                <Link to="/forgot-password" className="text-[11.5px] text-[#C67A4E] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input id="login-pw" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full h-9 px-3 pr-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                  placeholder="••••••••" />
                <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
                  {showPw ? (
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
              </div>
            </div>
            <Button type="submit" className="w-full" size="md" loading={loading}>Sign in</Button>
          </form>

          <div className="mt-5 px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md">
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] text-center">Demo: click Sign in to enter as Founder. Use the role switcher in the sidebar to explore all roles.</p>
          </div>

          <p className="text-center mt-5 text-[11px] text-[color:var(--vv-text-tertiary)]">
            Admin access?{' '}
            <Link to="/admin-login" className="text-[#C67A4E] hover:underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}