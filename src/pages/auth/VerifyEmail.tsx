import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck } from '../../components/layout/Icons';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';

export default function VerifyEmail() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function processVerification() {
      if (!id || !hash) {
        setError('Invalid verification link. Missing parameters.');
        setLoading(false);
        return;
      }

      try {
        await verifyEmail(id, hash, location.search);
        if (active) {
          setSuccess(true);
          setError('');
        }
      } catch (err: unknown) {
        if (active) {
          setSuccess(false);
          if (err instanceof ApiError) {
            setError(err.message || 'Email verification failed or link has expired.');
          } else {
            setError('Unable to verify email. Please ensure you are logged in and try again.');
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    processVerification();

    return () => {
      active = false;
    };
  }, [id, hash, location.search, verifyEmail]);

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
              <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z" fill="#C67A4E" fillOpacity="0.18" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round"/>
              <path d="M11 14l2 2 4-4" stroke="#C67A4E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-semibold text-[13px] text-[color:var(--vv-text)]">Vault Ventures</span>
          </Link>
        </div>

        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-6 text-center">
          {loading ? (
            <div className="py-8">
              <div className="w-10 h-10 border-2 border-[#C67A4E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1">Verifying your email…</h2>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Please wait while we confirm your email address.</p>
            </div>
          ) : success ? (
            <div>
              <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#22C55E]/30 flex items-center justify-center mx-auto mb-4">
                <IconCheck s={22} className="text-[#22C55E]" />
              </div>
              <h1 className="font-display text-[19px] font-semibold text-[color:var(--vv-text)] mb-1">Email Verified</h1>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-6">
                Your email address has been verified. Continue with phone and identity verification to unlock protected deal actions.
              </p>
              <Button className="w-full" onClick={() => navigate('/app/profile?tab=verification')}>
                Continue to Verification
              </Button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#F04438]/30 flex items-center justify-center mx-auto mb-4 text-[#F04438]">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="font-display text-[19px] font-semibold text-[color:var(--vv-text)] mb-1">Verification Failed</h1>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-6">
                {error || 'This verification link is invalid, expired, or has already been used.'}
              </p>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => navigate('/login')}>
                  Back to Sign in
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
