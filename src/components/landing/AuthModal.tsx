import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { IconCheck, IconX } from '../layout/Icons';
import { useAuth, NormalRole } from '../../context/AuthContext';
import { api, ApiError } from '../../services/api';

export type AuthModalView = 'login' | 'register' | 'forgot-password';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthModalView;
  initialRole?: NormalRole;
}

const ROLES: { id: NormalRole; label: string; desc: string; color: string; icon: React.ReactNode }[] = [
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

function EyeIcon({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors p-1"
    >
      {show ? (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path strokeLinecap="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      )}
    </button>
  );
}

export function AuthModal({ isOpen, onClose, initialView = 'login', initialRole }: AuthModalProps) {
  const navigate = useNavigate();
  const { login, register, enrollRoles, resendVerificationNotification } = useAuth();
  
  const [view, setView] = useState<AuthModalView>(initialView);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regStep, setRegStep] = useState(0);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regShowPw, setRegShowPw] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);
  const [regTouched, setRegTouched] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regGeneralError, setRegGeneralError] = useState('');
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<Set<NormalRole>>(initialRole ? new Set([initialRole]) : new Set());
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  // Verification step state
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState('');

  // Forgot password form state
  const [fpEmail, setFpEmail] = useState('');
  const [fpSent, setFpSent] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(isOpen);

  // Sync initialView & initialRole when modal opens
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setView(initialView);
      if (initialRole) {
        setSelectedRoles(new Set([initialRole]));
      }
      setLoginError('');
      setRegGeneralError('');
      setRegFieldErrors({});
      setFpError('');
      setFpSent(false);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialView, initialRole]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const user = await login({ email: loginEmail, password: loginPassword });
      onClose();
      if (user.isAdmin) {
        navigate('/app/admin/dashboard');
      } else if (user.roles && user.roles.length > 0) {
        navigate(`/app/${user.roles[0]}/dashboard`);
      } else {
        navigate('/app/founder/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.details && err.details.email) {
          setLoginError(err.details.email[0]);
        } else if (err.details && err.details.password) {
          setLoginError(err.details.password[0]);
        } else {
          setLoginError(err.message || 'Login failed. Please check your credentials.');
        }
      } else {
        setLoginError('Unable to connect to server. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Register account submit
  const regPwValid = regPw.length >= 12 && /[A-Z]/.test(regPw) && /[a-z]/.test(regPw) && /[0-9]/.test(regPw);
  const regPwMismatch = !!regConfirm && regPw !== regConfirm;
  const regValid = regName.trim() && regEmail.includes('@') && regPwValid && regPw === regConfirm;

  const handleRegisterAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegTouched(true);
    setRegGeneralError('');
    setRegFieldErrors({});

    if (!regValid) return;
    setRegLoading(true);

    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPw,
        password_confirmation: regConfirm,
      });
      setRegisteredEmail(regEmail.trim());
      setRegStep(1);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.details) {
          const errors: Record<string, string> = {};
          if (err.details.name) errors.name = err.details.name[0];
          if (err.details.email) errors.email = err.details.email[0];
          if (err.details.password) errors.password = err.details.password[0];
          setRegFieldErrors(errors);
        }
        setRegGeneralError(err.message || 'Registration failed. Please check your inputs.');
      } else {
        setRegGeneralError('Unable to connect to server. Please try again.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  // Toggle role selection
  const toggleRole = (role: NormalRole) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  };

  // Register role submit
  const handleRegisterRolesSubmit = async () => {
    if (selectedRoles.size === 0) return;
    setRegGeneralError('');
    setRegLoading(true);

    try {
      await enrollRoles(Array.from(selectedRoles));
      setRegStep(2);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setRegGeneralError(err.message || 'Failed to enroll selected roles.');
      } else {
        setRegGeneralError('Unable to save roles. Please try again.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  // Resend verification email
  const handleResendEmail = async () => {
    setResending(true);
    setVerifyStatusMessage('');
    try {
      await resendVerificationNotification();
      setResent(true);
      setVerifyStatusMessage('Verification email resent successfully.');
      setTimeout(() => {
        setResent(false);
        setVerifyStatusMessage('');
      }, 4000);
    } catch {
      setVerifyStatusMessage('Unable to resend email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  // Forgot password submit
  const handleForgotPwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    setFpLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email: fpEmail.trim() });
      setFpSent(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.details && err.details.email) {
          setFpError(err.details.email[0]);
        } else {
          setFpError(err.message || 'Unable to process password reset request.');
        }
      } else {
        setFpError('Unable to connect to server. Please try again.');
      }
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div
      data-testid="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#070C16]/80 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        data-testid="auth-modal"
        className="relative w-full max-w-md bg-[#0D1626] border border-[#1c2a3e] rounded-2xl shadow-2xl shadow-black/80 z-10 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1.5 rounded-lg hover:bg-white/5 z-20"
          aria-label="Close dialog"
        >
          <IconX s={18} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Brand header */}
          <div className="flex items-center gap-2.5 mb-6">
            <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 vv-logo-glow">
              <path
                d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
                fill="#C67A4E"
                fillOpacity="0.22"
                stroke="#C67A4E"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <path d="M11 14l2 2 4-4" stroke="#E8A878" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display font-semibold text-[13.5px] text-[color:var(--vv-text)] tracking-tight">
              Vault Ventures
            </span>
          </div>

          {/* ======================================================== */}
          {/* VIEW: SIGN IN                                            */}
          {/* ======================================================== */}
          {view === 'login' && (
            <div>
              <h2 id="auth-modal-title" className="font-display text-[22px] font-semibold text-[color:var(--vv-text)] mb-1.5">
                Sign in
              </h2>
              <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-6">
                No account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setRegStep(0);
                  }}
                  className="text-[#C67A4E] hover:underline font-medium"
                >
                  Create account
                </button>
              </p>

              {loginError && (
                <div className="mb-4 px-3 py-2.5 bg-[#F04438]/10 border border-[#F04438]/30 rounded-lg">
                  <p className="text-[12px] text-[#F04438]">{loginError}</p>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="modal-login-email">
                    Email address
                  </label>
                  <input
                    id="modal-login-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-lg text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11.5px] font-medium text-[color:var(--vv-text-secondary)]" htmlFor="modal-login-pw">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot-password');
                        setFpEmail(loginEmail);
                      }}
                      className="text-[11.5px] text-[#C67A4E] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-login-pw"
                      type={loginShowPw ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      className="w-full h-9 px-3 pr-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-lg text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                      placeholder="••••••••"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <EyeIcon show={loginShowPw} toggle={() => setLoginShowPw(v => !v)} />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="md" loading={loginLoading}>
                  Sign in
                </Button>
              </form>

              <p className="text-center mt-6 text-[11px] text-[color:var(--vv-text-tertiary)]">
                Admin access?{' '}
                <Link to="/admin-login" onClick={onClose} className="text-[#C67A4E] hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: REGISTER / CREATE ACCOUNT                          */}
          {/* ======================================================== */}
          {view === 'register' && (
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-0 mb-6">
                {['Account', 'Roles', 'Verify'].map((label, i) => {
                  const done = i < regStep;
                  const active = i === regStep;
                  return (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold transition-colors ${
                            done
                              ? 'bg-[#C67A4E] border-[#C67A4E]'
                              : active
                              ? 'border-[#C67A4E] text-[#C67A4E]'
                              : 'border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]'
                          }`}
                        >
                          {done ? <IconCheck s={10} className="text-[color:var(--vv-on-copper)]" /> : i + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-1 whitespace-nowrap transition-colors ${
                            active ? 'text-[color:var(--vv-text)]' : done ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)]'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          className={`w-10 sm:w-12 h-px mb-4 transition-colors ${
                            done ? 'bg-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)]'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {regGeneralError && (
                <div className="mb-4 px-3 py-2.5 bg-[#F04438]/10 border border-[#F04438]/30 rounded-lg">
                  <p className="text-[12px] text-[#F04438]">{regGeneralError}</p>
                </div>
              )}

              {/* Step 0: Account details */}
              {regStep === 0 && (
                <div>
                  <h2 id="auth-modal-title" className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-1">
                    Create your account
                  </h2>
                  <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setView('login')} className="text-[#C67A4E] hover:underline font-medium">
                      Sign in
                    </button>
                  </p>

                  <form onSubmit={handleRegisterAccountSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1" htmlFor="modal-reg-name">
                        Full name
                      </label>
                      <input
                        id="modal-reg-name"
                        type="text"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        placeholder="Alex Morgan"
                        className={`w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border rounded-lg text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors ${
                          regFieldErrors.name || (regTouched && !regName.trim())
                            ? 'border-[#F04438] focus:border-[#F04438]'
                            : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'
                        }`}
                      />
                      {(regFieldErrors.name || (regTouched && !regName.trim())) && (
                        <p className="text-[11px] text-[#F04438] mt-1">{regFieldErrors.name || 'Full name is required.'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1" htmlFor="modal-reg-email">
                        Email address
                      </label>
                      <input
                        id="modal-reg-email"
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border rounded-lg text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors ${
                          regFieldErrors.email || (regTouched && !regEmail.includes('@'))
                            ? 'border-[#F04438] focus:border-[#F04438]'
                            : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'
                        }`}
                      />
                      {(regFieldErrors.email || (regTouched && !regEmail.includes('@'))) && (
                        <p className="text-[11px] text-[#F04438] mt-1">{regFieldErrors.email || 'A valid email address is required.'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1" htmlFor="modal-reg-pw">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="modal-reg-pw"
                          type={regShowPw ? 'text' : 'password'}
                          value={regPw}
                          onChange={e => setRegPw(e.target.value)}
                          placeholder="Min. 12 characters"
                          className={`w-full h-9 px-3 pr-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border rounded-lg text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors ${
                            regFieldErrors.password || (regTouched && !regPwValid)
                              ? 'border-[#F04438] focus:border-[#F04438]'
                              : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'
                          }`}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <EyeIcon show={regShowPw} toggle={() => setRegShowPw(v => !v)} />
                        </div>
                      </div>
                      {(regFieldErrors.password || (regTouched && !regPwValid)) ? (
                        <p className="text-[11px] text-[#F04438] mt-1">
                          {regFieldErrors.password || 'Password must be at least 12 characters with uppercase, lowercase, and a number.'}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">
                          Min 12 chars with uppercase, lowercase, and numbers.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1" htmlFor="modal-reg-confirm">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          id="modal-reg-confirm"
                          type={regShowConfirm ? 'text' : 'password'}
                          value={regConfirm}
                          onChange={e => setRegConfirm(e.target.value)}
                          placeholder="Repeat password"
                          className={`w-full h-9 px-3 pr-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border rounded-lg text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors ${
                            regPwMismatch
                              ? 'border-[#F04438] focus:border-[#F04438]'
                              : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'
                          }`}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <EyeIcon show={regShowConfirm} toggle={() => setRegShowConfirm(v => !v)} />
                        </div>
                      </div>
                      {regPwMismatch && <p className="text-[11px] text-[#F04438] mt-1">Passwords do not match.</p>}
                    </div>

                    <Button type="submit" className="w-full mt-2" size="md" loading={regLoading}>
                      Continue
                    </Button>
                  </form>
                </div>
              )}

              {/* Step 1: Role Selection */}
              {regStep === 1 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setRegStep(0)}
                    className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors mb-3"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Back to account details
                  </button>

                  <h2 id="auth-modal-title" className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-1">
                    How will you use Vault?
                  </h2>
                  <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-4">
                    Select one or more roles. You can add more later.
                  </p>

                  <div className="space-y-2 mb-5">
                    {ROLES.map(r => {
                      const active = selectedRoles.has(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleRole(r.id)}
                          className={`w-full flex items-start gap-3.5 px-3.5 py-3 rounded-xl border text-left transition-all ${
                            active
                              ? 'border-[#C67A4E] bg-[#C67A4E]/10'
                              : 'border-[color:var(--vv-border)] bg-[#121A2B] hover:border-[color:var(--vv-border-strong)]'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              active ? 'bg-[#C67A4E]/20' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]'
                            }`}
                            style={{ color: active ? r.color : '#5E6D8F' }}
                          >
                            {r.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">{r.label}</p>
                            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{r.desc}</p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                              active ? 'bg-[#C67A4E] border-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
                            }`}
                          >
                            {active && <IconCheck s={9} className="text-[color:var(--vv-on-copper)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    className="w-full"
                    disabled={selectedRoles.size === 0}
                    loading={regLoading}
                    onClick={handleRegisterRolesSubmit}
                  >
                    Continue {selectedRoles.size > 0 && `with ${selectedRoles.size} role${selectedRoles.size > 1 ? 's' : ''}`}
                  </Button>
                </div>
              )}

              {/* Step 2: Verification Notification */}
              {regStep === 2 && (
                <div>
                  <div className="w-11 h-11 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#C67A4E]/30 flex items-center justify-center mb-4">
                    <svg width="20" height="20" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>

                  <h2 id="auth-modal-title" className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-1">
                    Check your email
                  </h2>
                  <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-2">
                    We sent a verification link to <span className="text-[color:var(--vv-text)] font-medium">{registeredEmail}</span>.
                  </p>
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-5">
                    Click the link in the email to confirm your account and continue setup.
                  </p>

                  {verifyStatusMessage && (
                    <div className="mb-4 px-3 py-2 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg">
                      <p className="text-[12px] text-[#22C55E]">{verifyStatusMessage}</p>
                    </div>
                  )}

                  <div className="space-y-2.5 mb-5">
                    <Button
                      className="w-full"
                      onClick={() => {
                        onClose();
                        navigate('/onboarding');
                      }}
                    >
                      Continue to Profile Setup
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handleResendEmail}
                      disabled={resent || resending}
                      loading={resending}
                    >
                      {resent ? 'Email resent' : 'Resend email'}
                    </Button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
                    >
                      Back to Sign in
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: FORGOT PASSWORD                                    */}
          {/* ======================================================== */}
          {view === 'forgot-password' && (
            <div>
              <button
                type="button"
                onClick={() => setView('login')}
                className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors mb-4 -ml-0.5"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back to Sign in
              </button>

              {!fpSent ? (
                <div>
                  <h2 id="auth-modal-title" className="font-display text-[20px] font-semibold text-[color:var(--vv-text)] mb-1">
                    Reset password
                  </h2>
                  <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">
                    Enter your account email. We will send a reset link.
                  </p>

                  {fpError && (
                    <div className="mb-4 px-3 py-2.5 bg-[#F04438]/10 border border-[#F04438]/30 rounded-lg">
                      <p className="text-[12px] text-[#F04438]">{fpError}</p>
                    </div>
                  )}

                  <form onSubmit={handleForgotPwSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5" htmlFor="modal-fp-email">
                        Email address
                      </label>
                      <input
                        id="modal-fp-email"
                        type="email"
                        value={fpEmail}
                        onChange={e => setFpEmail(e.target.value)}
                        required
                        className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-lg text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                    <Button type="submit" className="w-full" size="md" loading={fpLoading}>
                      Send reset link
                    </Button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[#22C55E]/30 flex items-center justify-center mb-4">
                    <svg width="18" height="18" fill="none" stroke="#22C55E" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path d="M3 8l9 6 9-6M3 8v12h18V8M3 8l9 6m0 0l9-6" />
                    </svg>
                  </div>
                  <h2 id="auth-modal-title" className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-1">
                    Check your inbox
                  </h2>
                  <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">
                    If an account exists for <span className="text-[color:var(--vv-text)] font-medium">{fpEmail}</span>, a password reset link has been sent. The link expires in 60 minutes.
                  </p>
                  <Button variant="secondary" className="w-full" onClick={() => setView('login')}>
                    Back to Sign in
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
