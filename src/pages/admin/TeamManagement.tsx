import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconSearch, IconX, IconCheck, IconShield } from '../../components/layout/Icons';

// --- Types ---------------------------------------------------------------------

type AdminRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Verification Ops';
type AdminStatus = 'Active' | 'Inactive' | 'Suspended';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastActive: string;
  permissions: string[];
}

// --- Data ----------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  'Super Admin':       ['users', 'verification', 'businesses', 'deals', 'reports', 'analytics', 'settings', 'audit', 'teams', 'matching', 'notifications'],
  'Admin':             ['users', 'verification', 'businesses', 'deals', 'reports', 'analytics', 'audit', 'notifications'],
  'Moderator':         ['users', 'businesses', 'reports', 'audit'],
  'Verification Ops':  ['verification', 'users', 'audit'],
};

const ALL_PERMISSIONS = [
  { key: 'users',         label: 'User Management' },
  { key: 'verification',  label: 'Verification Review' },
  { key: 'businesses',    label: 'Business Management' },
  { key: 'deals',         label: 'Deal Oversight' },
  { key: 'reports',       label: 'Reports & Disputes' },
  { key: 'analytics',     label: 'Analytics' },
  { key: 'settings',      label: 'Platform Settings' },
  { key: 'audit',         label: 'Audit Logs' },
  { key: 'teams',         label: 'Team Management' },
  { key: 'matching',      label: 'Matching Engine' },
  { key: 'notifications', label: 'Notifications' },
];

const ADMIN_USERS: AdminUser[] = [
  { id: 'a1', name: 'Alvi Rahman', email: 'alvi@vaultventures.io', role: 'Super Admin', status: 'Active', lastActive: 'Just now', permissions: ROLE_PERMISSIONS['Super Admin'] },
  { id: 'a2', name: 'Mira Hasan', email: 'mira@vaultventures.io', role: 'Admin', status: 'Active', lastActive: '2 hr ago', permissions: ROLE_PERMISSIONS['Admin'] },
  { id: 'a3', name: 'Tanvir Islam', email: 'tanvir@vaultventures.io', role: 'Moderator', status: 'Active', lastActive: '1 day ago', permissions: ROLE_PERMISSIONS['Moderator'] },
  { id: 'a4', name: 'Nadia Chowdhury', email: 'nadia@vaultventures.io', role: 'Verification Ops', status: 'Active', lastActive: '3 hr ago', permissions: ROLE_PERMISSIONS['Verification Ops'] },
  { id: 'a5', name: 'Rafiq Uddin', email: 'rafiq@vaultventures.io', role: 'Moderator', status: 'Inactive', lastActive: '12 days ago', permissions: ROLE_PERMISSIONS['Moderator'] },
];

const ROLE_CFG: Record<AdminRole, { color: string; bg: string; border: string }> = {
  'Super Admin':      { color: '#C67A4E', bg: 'rgba(198,122,78,0.08)', border: 'rgba(198,122,78,0.22)' },
  'Admin':            { color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)' },
  'Moderator':        { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
  'Verification Ops': { color: '#22C55E', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.2)' },
};

// --- Helpers ------------------------------------------------------------------

function RoleBadge({ role }: { role: AdminRole }) {
  const cfg = ROLE_CFG[role];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {role}
    </span>
  );
}

function ConfirmModal({ title, message, onConfirm, onClose }: { title: string; message: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="team-confirm-title" style={{ background: 'rgba(4,8,15,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-[14px] border border-[color:var(--vv-border-strong)] p-5 w-full max-w-sm" style={{ background: 'rgba(13,22,38,0.98)' }}>
        <div className="flex items-start gap-2.5 mb-3">
          <IconShield s={15} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <p id="team-confirm-title" className="text-[13px] font-semibold text-[color:var(--vv-text)]">{title}</p>
        </div>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">{message}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm} className="flex-1">Confirm</Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// --- Edit Role Drawer ----------------------------------------------------------

function EditRoleDrawer({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (id: string, role: AdminRole) => void }) {
  const [selectedRole, setSelectedRole] = useState<AdminRole>(user.role);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-labelledby="edit-role-title">
      <div className="flex-1" onClick={onClose} style={{ background: 'rgba(4,8,15,0.6)' }} />
      <div className="w-full max-w-[380px] h-full overflow-y-auto border-l border-[color:var(--vv-border)] flex flex-col" style={{ background: 'rgba(10,15,26,0.98)', backdropFilter: 'blur(24px)' }}>
        {showConfirm && (
          <ConfirmModal
            title="Change Admin Role?"
            message={`You are about to change ${user.name}'s role to ${selectedRole}. This will update their permissions immediately.`}
            onConfirm={() => { onSave(user.id, selectedRole); setShowConfirm(false); onClose(); }}
            onClose={() => setShowConfirm(false)}
          />
        )}
        <div className="flex items-center justify-between p-4 border-b border-[#1E2C44]">
          <p id="edit-role-title" className="text-[13px] font-semibold text-[color:var(--vv-text)]">Edit Role - {user.name}</p>
          <button onClick={onClose} aria-label="Close edit role" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]">
            <IconX s={16} />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-4">
          <div>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Select Role</p>
            <div className="space-y-2">
              {(['Super Admin', 'Admin', 'Moderator', 'Verification Ops'] as AdminRole[]).map(r => {
                const cfg = ROLE_CFG[r];
                const active = selectedRole === r;
                return (
                  <button key={r} onClick={() => setSelectedRole(r)}
                    className="w-full flex items-center gap-3 p-3 rounded-[9px] border text-left transition-all"
                    style={active ? { background: `${cfg.bg}`, borderColor: cfg.border } : { background: 'rgba(26,28,29,0.6)', borderColor: '#2B2D2F' }}>
                    <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={active ? { borderColor: cfg.color, background: cfg.color } : { borderColor: '#35446A' }}>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold" style={{ color: active ? cfg.color : '#EAF0FA' }}>{r}</p>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{ROLE_PERMISSIONS[r].length} permissions</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Permissions for {selectedRole}</p>
            <div className="rounded-[9px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.6)' }}>
              {ALL_PERMISSIONS.map((p, i) => {
                const allowed = ROLE_PERMISSIONS[selectedRole].includes(p.key);
                return (
                  <div key={p.key} className={`flex items-center justify-between px-3 py-2.5 ${i < ALL_PERMISSIONS.length - 1 ? 'border-b border-[#1E2C44]' : ''}`}>
                    <p className="text-[11.5px] text-[color:var(--vv-text-secondary)]">{p.label}</p>
                    {allowed
                      ? <IconCheck s={13} className="text-[#22C55E]" />
                      : <IconX s={13} className="text-[#35446A]" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#1E2C44] space-y-2">
          <Button className="w-full" onClick={() => setShowConfirm(true)} disabled={selectedRole === user.role}>
            Save Role Change
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// --- Main ----------------------------------------------------------------------

export default function AdminTeamManagement() {
  const [users, setUsers] = useState<AdminUser[]>(ADMIN_USERS);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [confirmDeactivate, setConfirmDeactivate] = useState<AdminUser | null>(null);

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleRoleSave(id: string, role: AdminRole) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role, permissions: ROLE_PERMISSIONS[role] } : u));
  }

  function handleToggleStatus(u: AdminUser) {
    setUsers(prev => prev.map(p => p.id === u.id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p));
    setConfirmDeactivate(null);
  }

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      {editUser && <EditRoleDrawer user={editUser} onClose={() => setEditUser(null)} onSave={handleRoleSave} />}
      {confirmDeactivate && (
        <ConfirmModal
          title={`${confirmDeactivate.status === 'Active' ? 'Deactivate' : 'Activate'} Admin Account?`}
          message={`This will ${confirmDeactivate.status === 'Active' ? 'revoke access for' : 'restore access for'} ${confirmDeactivate.name}. All actions will be logged.`}
          onConfirm={() => handleToggleStatus(confirmDeactivate)}
          onClose={() => setConfirmDeactivate(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Admin Team Management</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Manage admin users, roles, and platform permissions.</p>
        </div>
        <Button size="sm" variant="secondary">Invite Admin User</Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-[9px] border border-[color:var(--vv-border)] mb-5 w-fit" style={{ background: 'rgba(13,22,38,0.8)' }} role="tablist" aria-label="Team management views">
        {(['users', 'permissions'] as const).map(t => (
          <button key={t} id={`team-tab-${t}`} role="tab" aria-selected={activeTab === t} aria-controls={`team-panel-${t}`} tabIndex={activeTab === t ? 0 : -1} onClick={() => setActiveTab(t)}
            className="px-4 py-1.5 rounded-[7px] text-[12px] font-medium capitalize transition-all"
            style={activeTab === t ? { background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.22)' } : { color: '#5E6D8F', border: '1px solid transparent' }}>
            {t === 'users' ? 'Admin Users' : 'Permission Matrix'}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div id="team-panel-users" role="tabpanel" aria-labelledby="team-tab-users">
          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <IconSearch s={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search admin users-"
              className="w-full pl-8 pr-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none focus:border-[#C67A4E] transition-colors" />
          </div>

          {/* Table */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
            <div className="hidden md:grid grid-cols-[1fr_1fr_150px_100px_120px_160px] border-b border-[color:var(--vv-border)]">
              {['Name', 'Email', 'Role', 'Status', 'Last Active', 'Actions'].map(h => (
                <div key={h} className="px-4 py-2.5 text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">{h}</div>
              ))}
            </div>
            {filtered.map((u, i) => (
              <div key={u.id} className={`md:grid md:grid-cols-[1fr_1fr_150px_100px_120px_160px] flex flex-col gap-2 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/30 transition-colors`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0"
                    style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.16)' }}>
                    {u.name[0]}
                  </div>
                  <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{u.name}</p>
                </div>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] truncate self-center">{u.email}</p>
                <div className="self-center"><RoleBadge role={u.role} /></div>
                <div className="self-center">
                  <Badge variant={u.status === 'Active' ? 'success' : 'neutral'} dot>{u.status}</Badge>
                </div>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] self-center font-mono">{u.lastActive}</p>
                <div className="flex items-center gap-2 self-center flex-wrap">
                  <button onClick={() => setEditUser(u)} className="text-[11px] text-[#C67A4E] hover:underline">Edit Role</button>
                  <span className="text-[#35446A]">-</span>
                  {u.role !== 'Super Admin' && (
                    <button onClick={() => setConfirmDeactivate(u)}
                      className={`text-[11px] hover:underline ${u.status === 'Active' ? 'text-[#C67A4E]' : 'text-[#22C55E]'}`}>
                      {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div id="team-panel-permissions" role="tabpanel" aria-labelledby="team-tab-permissions" className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[color:var(--vv-border)]">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest w-48">Permission</th>
                  {(['Super Admin', 'Admin', 'Moderator', 'Verification Ops'] as AdminRole[]).map(r => {
                    const cfg = ROLE_CFG[r];
                    return (
                      <th key={r} className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: cfg.color }}>
                        {r}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((p, i) => (
                  <tr key={p.key} className={`border-b border-[#1c2a3e] last:border-0 ${i % 2 === 0 ? '' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]/20'}`}>
                    <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)] font-medium">{p.label}</td>
                    {(['Super Admin', 'Admin', 'Moderator', 'Verification Ops'] as AdminRole[]).map(r => {
                      const allowed = ROLE_PERMISSIONS[r].includes(p.key);
                      return (
                        <td key={r} className="px-4 py-3 text-center">
                          {allowed
                            ? <IconCheck s={14} className="text-[#22C55E] mx-auto" />
                            : <span className="text-[#35446A] text-[12px]">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
