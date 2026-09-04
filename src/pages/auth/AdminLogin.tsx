import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconShield } from '../../components/layout/Icons';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInAdmin } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      signInAdmin();
      navigate('/app/admin/dashboard');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Back */}
        <button onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors mb-8 -ml-0.5">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Sign in
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
              <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
                fill="#C67A4E" fillOpacity="0.18" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
              <path d="M11 14l2 2 4-4" stroke="#C67A4E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)] tracking-tight">Vault Ventures</span>
          </Link>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-full">
            <IconShield s={12} className="text-[color:var(--vv-text-tertiary)]" />
            <span className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">Admin Console</span>
          </div>
        </div>

        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-6">
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-1">Admin Sign in</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-5">
            Authorised admin accounts only. Not for regular users.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-[#F04438]/8 border border-[#F04438]/30 rounded-md">
              <p className="text-[12px] text-[#F04438]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="adm-email">
                Admin email
              </label>
              <input
                id="adm-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                placeholder="admin@vault.io"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="adm-pw">
                Password
              </label>
              <div className="relative">
                <input
                  id="adm-pw" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className="w-full h-9 px-3 pr-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
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
            <Button type="submit" className="w-full mt-1" loading={loading}>Sign in to Admin Console</Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#1c2a3e]">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] text-center leading-relaxed">
              Admin accounts cannot be created here. Contact your platform administrator for access.
            </p>
          </div>
        </div>

        <div className="mt-4 px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] text-center">Demo: click Sign in to enter the Admin Console.</p>
        </div>

        <p className="text-center mt-4 text-[11px] text-[color:var(--vv-text-tertiary)]">
          Not an admin?{' '}
          <Link to="/login" className="text-[#C67A4E] hover:underline">Sign in as a user</Link>
        </p>
      </div>
    </div>
  );
}