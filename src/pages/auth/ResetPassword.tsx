import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck } from '../../components/layout/Icons';
import { api, ApiError } from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const pwValid = password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  const mismatch = confirm && password !== confirm;
  const valid = pwValid && password === confirm && token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setDone(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.details && err.details.email) {
          setError(err.details.email[0]);
        } else if (err.details && err.details.password) {
          setError(err.details.password[0]);
        } else if (err.details && err.details.token) {
          setError(err.details.token[0]);
        } else {
          setError(err.message || 'Password reset failed. The link may have expired.');
        }
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors mb-8 -ml-0.5">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Sign in
        </button>
        <Link to="/" className="flex items-center gap-2 mb-8">
          <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
            <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z" fill="#C67A4E" fillOpacity="0.18" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
            <path d="M11 14l2 2 4-4" stroke="#C67A4E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)]">Vault Ventures</span>
        </Link>

        {!done ? (
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-6">
            <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-1">Set new password</h1>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">Choose a strong password for your account.</p>

            {error && (
              <div className="mb-4 px-3 py-2.5 bg-[#F04438]/8 border border-[#F04438]/30 rounded-md">
                <p className="text-[12px] text-[#F04438]">{error}</p>
              </div>
            )}

            {!token && (
              <div className="mb-4 px-3 py-2.5 bg-[#F59E0B]/8 border border-[#F59E0B]/30 rounded-md">
                <p className="text-[12px] text-[#F59E0B]">No password reset token provided. Please request a new link.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="rp-pw">New password</label>
                <input id="rp-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                  placeholder="Min. 12 characters" />
                {password.length > 0 && !pwValid && (
                  <p className="text-[11px] text-[#F59E0B] mt-1">Min. 12 characters with uppercase, lowercase, and numbers</p>
                )}
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="rp-confirm">Confirm password</label>
                <input id="rp-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className={`w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors ${mismatch ? 'border-[#F04438] focus:border-[#F04438]' : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'}`}
                  placeholder="Repeat password" />
                {mismatch && <p className="text-[11px] text-[#F04438] mt-1">Passwords do not match</p>}
              </div>
              <Button type="submit" className="w-full mt-1" disabled={!valid} loading={loading}>Set new password</Button>
            </form>
          </div>
        ) : (
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-6">
            <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#22C55E]/30 flex items-center justify-center mb-4">
              <IconCheck s={18} className="text-[#22C55E]" />
            </div>
            <h2 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1">Password updated</h2>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-4">Your password has been changed. Sign in with your new credentials.</p>
            <Button className="w-full" onClick={() => navigate('/login')}>Sign in</Button>
          </div>
        )}
      </div>
    </div>
  );
}