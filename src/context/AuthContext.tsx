import React, { createContext, useContext, useState } from 'react';

export type NormalRole = 'founder' | 'investor' | 'professional';
export type SessionStatus = 'authenticated' | 'unauthenticated';

export interface DemoUser {
  name: string;
  email: string;
}

export interface FrontendSession {
  status: SessionStatus;
  user: DemoUser | null;
  roles: NormalRole[];
  activeRole: NormalRole;
  onboardingComplete: boolean;
  isAdmin: boolean;
}

interface AuthContextValue {
  session: FrontendSession;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signInDemo: (user?: Partial<DemoUser>) => void;
  beginRegistration: (user: DemoUser) => void;
  completeOnboarding: (roles: NormalRole[]) => void;
  signInAdmin: () => void;
  setActiveRole: (role: NormalRole) => void;
  updateNormalRoles: (roles: NormalRole[]) => void;
  hasRole: (role: NormalRole) => boolean;
  logout: () => void;
}

const NORMAL_SESSION_KEY = 'vv_demo_session';
const ADMIN_SESSION_KEY = 'vv_admin_session';
const DEFAULT_USER: DemoUser = { name: 'Alex Morgan', email: 'alex@example.com' };
const DEFAULT_ROLES: NormalRole[] = ['founder', 'investor', 'professional'];

const unauthenticatedSession: FrontendSession = {
  status: 'unauthenticated',
  user: null,
  roles: [],
  activeRole: 'founder',
  onboardingComplete: false,
  isAdmin: false,
};

function readNormalSession(): FrontendSession {
  try {
    const stored = sessionStorage.getItem(NORMAL_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<FrontendSession>;
      const roles = Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles as NormalRole[] : DEFAULT_ROLES;
      const activeRole = roles.includes(parsed.activeRole as NormalRole) ? parsed.activeRole as NormalRole : roles[0];
      return {
        status: 'authenticated',
        user: parsed.user ?? DEFAULT_USER,
        roles,
        activeRole,
        onboardingComplete: parsed.onboardingComplete !== false,
        isAdmin: false,
      };
    }
  } catch {
    sessionStorage.removeItem(NORMAL_SESSION_KEY);
  }
  return unauthenticatedSession;
}

function readInitialSession(): FrontendSession {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
    return { ...unauthenticatedSession, status: 'authenticated', user: { name: 'Admin', email: 'admin@vault.io' }, isAdmin: true };
  }
  return readNormalSession();
}

function persistNormalSession(session: FrontendSession) {
  sessionStorage.setItem(NORMAL_SESSION_KEY, JSON.stringify({ ...session, isAdmin: false }));
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<FrontendSession>(readInitialSession);

  function signInDemo(user: Partial<DemoUser> = {}) {
    const next: FrontendSession = {
      status: 'authenticated',
      user: { ...DEFAULT_USER, ...user },
      roles: DEFAULT_ROLES,
      activeRole: 'founder',
      onboardingComplete: true,
      isAdmin: false,
    };
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    persistNormalSession(next);
    setSession(next);
  }

  function beginRegistration(user: DemoUser) {
    const next: FrontendSession = {
      status: 'authenticated',
      user,
      roles: ['founder'],
      activeRole: 'founder',
      onboardingComplete: false,
      isAdmin: false,
    };
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    persistNormalSession(next);
    setSession(next);
  }

  function completeOnboarding(roles: NormalRole[]) {
    const normalizedRoles: NormalRole[] = roles.length > 0 ? roles : ['founder'];
    const next: FrontendSession = { ...session, status: 'authenticated', roles: normalizedRoles, activeRole: normalizedRoles[0], onboardingComplete: true, isAdmin: false };
    persistNormalSession(next);
    setSession(next);
  }

  function signInAdmin() {
    sessionStorage.removeItem(NORMAL_SESSION_KEY);
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setSession({ ...unauthenticatedSession, status: 'authenticated', user: { name: 'Admin', email: 'admin@vault.io' }, isAdmin: true });
  }

  function setActiveRole(role: NormalRole) {
    if (session.isAdmin || !session.roles.includes(role)) return;
    const next = { ...session, activeRole: role };
    persistNormalSession(next);
    setSession(next);
  }

  function updateNormalRoles(roles: NormalRole[]) {
    if (session.isAdmin || roles.length === 0) return;
    const activeRole = roles.includes(session.activeRole) ? session.activeRole : roles[0];
    const next = { ...session, roles, activeRole };
    persistNormalSession(next);
    setSession(next);
  }

  function logout() {
    if (session.isAdmin) sessionStorage.removeItem(ADMIN_SESSION_KEY);
    else sessionStorage.removeItem(NORMAL_SESSION_KEY);
    setSession(unauthenticatedSession);
  }

  function hasRole(role: NormalRole) {
    return !session.isAdmin && session.roles.includes(role);
  }

  return (
    <AuthContext.Provider value={{
      session,
      isAuthenticated: session.status === 'authenticated',
      isAdmin: session.isAdmin,
      signInDemo,
      beginRegistration,
      completeOnboarding,
      signInAdmin,
      setActiveRole,
      updateNormalRoles,
      hasRole,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
