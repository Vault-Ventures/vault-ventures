import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 900);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Back */}
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

        {!sent ? (
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-6">
            <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-1">Reset password</h1>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">Enter your account email. We will send a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="fp-email">Email address</label>
                <input id="fp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                  placeholder="you@example.com" />
              </div>
              <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
            </form>
          </div>
        ) : (
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-6">
            <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#22C55E]/30 flex items-center justify-center mb-4">
              <svg width="18" height="18" fill="none" stroke="#22C55E" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M3 8l9 6 9-6M3 8v12h18V8M3 8l9 6m0 0l9-6"/>
              </svg>
            </div>
            <h2 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1">Check your inbox</h2>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-4">A password reset link was sent to <span className="text-[color:var(--vv-text)]">{email}</span>. The link expires in 15 minutes.</p>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/login')}>Back to Sign in</Button>
          </div>
        )}
      </div>
    </div>
  );
}