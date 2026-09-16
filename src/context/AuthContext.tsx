import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../services/api';

export type NormalRole = 'founder' | 'investor' | 'professional';
export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated';
export type VerificationTier = 0 | 1 | 2;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  cover_photo_url?: string | null;
  verification_tier: VerificationTier;
  verification_tier_label: string;
  roles: NormalRole[];
  isAdmin: boolean;
}

export interface FrontendSession {
  status: SessionStatus;
  user: AuthUser | null;
  roles: NormalRole[];
  activeRole: NormalRole;
  onboardingComplete: boolean;
  isAdmin: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  session: FrontendSession;
  status: SessionStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginPayload) => Promise<AuthUser>;
  register: (data: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  enrollRoles: (roles: NormalRole[]) => Promise<void>;
  enrollRole: (role: NormalRole, data?: Record<string, any>) => Promise<void>;
  removeRole: (role: NormalRole) => Promise<void>;
  verifyEmail: (id: string, hash: string, queryString: string) => Promise<void>;
  resendVerificationNotification: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  setActiveRole: (role: NormalRole) => void;
  updateNormalRoles: (roles: NormalRole[]) => void;
  hasRole: (role: NormalRole) => boolean;
}

const unauthenticatedSession: FrontendSession = {
  status: 'unauthenticated',
  user: null,
  roles: [],
  activeRole: 'founder',
  onboardingComplete: false,
  isAdmin: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<FrontendSession>({
    status: 'initializing',
    user: null,
    roles: [],
    activeRole: 'founder',
    onboardingComplete: false,
    isAdmin: false,
  });

  /**
   * Helper to inspect if the authenticated user has admin access.
   */
  const checkAdminPrivilege = async (currentAdminState?: boolean): Promise<boolean> => {
    try {
      await api.get('/api/admin/verification-requests');
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
        return false;
      }
      // If error is not an explicit 403/401 forbidden (e.g. server 500 or network error), retain admin state if already set
      if (currentAdminState) {
        return true;
      }
      return false;
    }
  };

  /**
   * Helper to load the user's enrolled roles and profiles.
   */
  const loadUserRoles = async (): Promise<NormalRole[]> => {
    try {
      const profileData = await api.get<{ roles?: NormalRole[] }>('/api/me/profile');
      if (profileData && Array.isArray(profileData.roles)) {
        return profileData.roles;
      }
    } catch {
      // Profile not created or error
    }
    return [];
  };

  /**
   * Restores user session from backend cookies.
   */
  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const userData = await api.get<Omit<AuthUser, 'roles' | 'isAdmin'>>('/api/auth/user');
      if (!userData || !userData.id) {
        setSession(unauthenticatedSession);
        return null;
      }

      const [roles, isAdmin] = await Promise.all([
        loadUserRoles(),
        checkAdminPrivilege(session.isAdmin),
      ]);

      const activeRole: NormalRole = roles.length > 0 ? roles[0] : 'founder';
      const tier: VerificationTier = (userData.verification_tier === 1 || userData.verification_tier === 2) ? (userData.verification_tier as 1 | 2) : 0;
      const authUser: AuthUser = {
        ...userData,
        verification_tier: tier,
        roles,
        isAdmin,
      };

      setSession({
        status: 'authenticated',
        user: authUser,
        roles,
        activeRole,
        onboardingComplete: roles.length > 0,
        isAdmin,
      });

      return authUser;
    } catch {
      setSession(unauthenticatedSession);
      return null;
    }
  }, []);

  // Probe backend session on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Login with email and password against Laravel backend.
   */
  const login = async (credentials: LoginPayload): Promise<AuthUser> => {
    const userData = await api.post<Omit<AuthUser, 'roles' | 'isAdmin'>>('/api/auth/login', credentials);

    const [roles, isAdmin] = await Promise.all([
      loadUserRoles(),
      checkAdminPrivilege(),
    ]);

    const activeRole: NormalRole = roles.length > 0 ? roles[0] : 'founder';
    const tier: VerificationTier = (userData.verification_tier === 1 || userData.verification_tier === 2) ? (userData.verification_tier as 1 | 2) : 0;
    const authUser: AuthUser = {
      ...userData,
      verification_tier: tier,
      roles,
      isAdmin,
    };

    setSession({
      status: 'authenticated',
      user: authUser,
      roles,
      activeRole,
      onboardingComplete: roles.length > 0,
      isAdmin,
    });

    return authUser;
  };

  /**
   * Register a new user against Laravel backend.
   */
  const register = async (data: RegisterPayload): Promise<AuthUser> => {
    const userData = await api.post<Omit<AuthUser, 'roles' | 'isAdmin'>>('/api/auth/register', data);

    const authUser: AuthUser = {
      ...userData,
      phone: null,
      phone_verified_at: null,
      verification_tier: 0,
      verification_tier_label: 'Tier 0',
      roles: [],
      isAdmin: false,
    };

    setSession({
      status: 'authenticated',
      user: authUser,
      roles: [],
      activeRole: 'founder',
      onboardingComplete: false,
      isAdmin: false,
    });

    return authUser;
  };

  /**
   * Log out the current user session on the backend.
   */
  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network / logout errors and force client session reset
    } finally {
      setSession(unauthenticatedSession);
    }
  };

  /**
   * Authoritatively enroll roles for the current user.
   */
  const enrollRoles = async (rolesToEnroll: NormalRole[]): Promise<void> => {
    if (rolesToEnroll.length === 0) return;

    for (const role of rolesToEnroll) {
      await api.post('/api/me/roles', { role });
    }

    const currentRoles = await loadUserRoles();
    const finalRoles = currentRoles.length > 0 ? currentRoles : rolesToEnroll;
    const activeRole = finalRoles.includes(session.activeRole) ? session.activeRole : finalRoles[0];

    setSession((prev) => {
      if (!prev.user) return prev;
      const updatedUser: AuthUser = {
        ...prev.user,
        roles: finalRoles,
      };
      return {
        ...prev,
        user: updatedUser,
        roles: finalRoles,
        activeRole,
        onboardingComplete: true,
      };
    });
  };

  const enrollRole = async (roleToEnroll: NormalRole, data?: Record<string, any>): Promise<void> => {
    await api.roles.enroll(roleToEnroll, data);
    const currentRoles = await loadUserRoles();
    const finalRoles = currentRoles.includes(roleToEnroll) ? currentRoles : [...currentRoles, roleToEnroll];
    const activeRole = finalRoles.includes(session.activeRole) ? session.activeRole : roleToEnroll;

    setSession((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, roles: finalRoles },
        roles: finalRoles,
        activeRole,
        onboardingComplete: true,
      };
    });
  };

  /**
   * Unenroll / remove an active role for the current user.
   */
  const removeRole = async (roleToRemove: NormalRole): Promise<void> => {
    if (session.roles.length <= 1) {
      throw new Error('Cannot remove your only active role.');
    }

    await api.roles.remove(roleToRemove);
    const updatedRoles = await loadUserRoles();
    const finalRoles = updatedRoles.filter((r) => r !== roleToRemove);
    const activeRole = finalRoles.includes(session.activeRole) ? session.activeRole : finalRoles[0] || 'founder';

    setSession((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, roles: finalRoles },
        roles: finalRoles,
        activeRole,
      };
    });
  };

  /**
   * Verifies signed email verification URL with the backend.
   */
  const verifyEmail = async (id: string, hash: string, queryString: string): Promise<void> => {
    const qs = queryString.startsWith('?') ? queryString : `?${queryString}`;
    await api.get(`/api/auth/email/verify/${id}/${hash}${qs}`);
    await refreshUser();
  };

  /**
   * Resends email verification notification link.
   */
  const resendVerificationNotification = async (): Promise<void> => {
    await api.post('/api/auth/email/verification-notification');
  };

  /**
   * Manually sets the active workspace role.
   */
  const setActiveRole = (activeRole: NormalRole) => {
    setSession((prev) => ({
      ...prev,
      activeRole,
    }));
  };

  /**
   * Update active normal roles.
   */
  const updateNormalRoles = (roles: NormalRole[]) => {
    const activeRole = roles.includes(session.activeRole) ? session.activeRole : roles[0] || 'founder';
    setSession((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, roles },
        roles,
        activeRole,
      };
    });
  };

  /**
   * Check if user has a specific role.
   */
  const hasRole = (role: NormalRole) => {
    return !session.isAdmin && session.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        status: session.status,
        user: session.user,
        isAuthenticated: session.status === 'authenticated',
        isAdmin: session.isAdmin,
        login,
        register,
        logout,
        enrollRoles,
        enrollRole,
        removeRole,
        verifyEmail,
        resendVerificationNotification,
        refreshUser,
        setActiveRole,
        updateNormalRoles,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
