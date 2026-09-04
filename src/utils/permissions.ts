import type { NormalRole } from '../context/AuthContext';

export type Workspace = 'founder' | 'investor' | 'professional' | 'admin';
export type Permission =
  | 'workspace.view'
  | 'business.manage'
  | 'business.publish'
  | 'business.discover'
  | 'business.save'
  | 'business.interest'
  | 'business.apply'
  | 'readiness.view'
  | 'connections.view'
  | 'portfolio.view'
  | 'applications.view'
  | 'profile.manage'
  | 'deal.view'
  | 'deal.founderActions'
  | 'deal.investorActions'
  | 'deal.professionalActions'
  | 'admin.manage';

const ROLE_PERMISSIONS: Record<Workspace, readonly Permission[]> = {
  founder: [
    'workspace.view', 'business.manage', 'business.publish', 'business.discover', 'readiness.view',
    'connections.view', 'profile.manage', 'deal.view', 'deal.founderActions',
  ],
  investor: [
    'workspace.view', 'business.discover', 'business.save', 'business.interest', 'connections.view',
    'portfolio.view', 'profile.manage', 'deal.view', 'deal.investorActions',
  ],
  professional: [
    'workspace.view', 'business.discover', 'business.apply', 'connections.view', 'applications.view',
    'profile.manage', 'deal.view', 'deal.professionalActions',
  ],
  admin: ['admin.manage'],
};

export function canAccess(role: Workspace, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasNormalRole(roles: readonly NormalRole[], role: Workspace): role is NormalRole {
  return role !== 'admin' && roles.includes(role);
}

export function permissionsFor(role: Workspace): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
