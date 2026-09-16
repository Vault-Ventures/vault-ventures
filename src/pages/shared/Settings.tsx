import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../services/api';

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
        <p className="text-[13px] font-semibold font-display text-[color:var(--vv-text)]">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 border-b border-[#1c2a3e] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{label}</p>
        {description && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: 'dark' | 'light'; setTheme: (t: 'dark' | 'light') => void }) {
  const isDark = theme === 'dark';
  return (
    <div className="flex items-center gap-1 p-1 rounded-[9px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
      <button
        onClick={() => setTheme('light')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all"
        style={!isDark ? {
          background: 'rgba(255,255,255,0.92)',
          color: '#0F1B2D',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        } : { color: '#5E6D8F' }}
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all"
        style={isDark ? {
          background: 'rgba(198,122,78,0.10)',
          color: '#C67A4E',
          border: '1px solid rgba(198,122,78,0.22)',
        } : { color: '#5E6D8F' }}
      >
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        Dark
      </button>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-9 h-5 rounded-full cursor-pointer transition-all duration-200 flex items-center flex-shrink-0"
      style={{
        background: enabled ? 'rgba(198,122,78,0.2)' : 'rgba(94,109,143,0.15)',
        border: enabled ? '1px solid rgba(198,122,78,0.35)' : '1px solid rgba(94,109,143,0.25)',
      }}
      aria-pressed={enabled}
    >
      <span
        className="absolute w-3.5 h-3.5 rounded-full transition-all duration-200"
        style={{
          right: enabled ? '2px' : undefined,
          left: enabled ? undefined : '2px',
          background: enabled ? '#C67A4E' : '#5E6D8F',
        }}
      />
    </button>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [error, setError] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError({});
    try {
      await api.put('/api/me/password', form);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.details)) {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        }
        setError(mapped);
      } else if (err instanceof ApiError) {
        setError({ current_password: err.message });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
          <p className="text-[14px] font-semibold font-display text-[color:var(--vv-text)]">Change Password</p>
          <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className="px-5 py-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] flex items-center justify-center mx-auto">
              <svg width="16" height="16" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[color:var(--vv-text)]">Password changed successfully.</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Other sessions have been logged out.</p>
            <button onClick={onClose} className="mt-2 px-4 py-2 rounded-md text-[12px] font-medium text-[#C67A4E] border border-[rgba(198,122,78,0.3)] hover:border-[#C67A4E] transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            {(['current_password', 'new_password', 'new_password_confirmation'] as const).map(field => (
              <div key={field}>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5">
                  {field === 'current_password' ? 'Current password' :
                   field === 'new_password' ? 'New password' : 'Confirm new password'}
                </label>
                <input
                  type="password"
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  autoComplete={field === 'current_password' ? 'current-password' : 'new-password'}
                  className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors"
                  style={{ borderColor: error[field] ? '#F04438' : 'var(--vv-border)' }}
                  required
                />
                {error[field] && (
                  <p className="text-[11px] text-[#F04438] mt-1">{error[field]}</p>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 h-9 rounded-md text-[12px] font-medium text-[color:var(--vv-text-secondary)] border border-[color:var(--vv-border)] hover:border-[#5E6D8F] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 h-9 rounded-md text-[12px] font-semibold text-white transition-all"
                style={{ background: saving ? 'rgba(198,122,78,0.5)' : 'linear-gradient(135deg, #C67A4E, #E8A878)' }}>
                {saving ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Notification preference keys ─────────────────────────────────────────────

const NOTIF_PREF_LABELS: Array<{ key: string; label: string; description: string }> = [
  { key: 'new_matches',       label: 'New matches',       description: 'When a high-confidence match is found for you.' },
  { key: 'interest_received', label: 'Interest received', description: 'When someone expresses interest in your business.' },
  { key: 'deal_room_updates', label: 'Deal Room updates', description: 'Messages, documents, and stage changes.' },
  { key: 'milestone_updates', label: 'Milestone updates', description: 'When milestones are submitted or confirmed.' },
];

type NotifPrefs = Record<string, boolean>;

// ─── Main Settings page ────────────────────────────────────────────────────────

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({});
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Load notification preferences on mount
  useEffect(() => {
    api.get<NotifPrefs>('/api/me/notification-preferences')
      .then(data => {
        if (data && typeof data === 'object') setNotifPrefs(data as NotifPrefs);
      })
      .catch(() => {
        // Default all to true if fetch fails
        const defaults: NotifPrefs = {};
        NOTIF_PREF_LABELS.forEach(p => { defaults[p.key] = true; });
        setNotifPrefs(defaults);
      });
  }, []);

  async function togglePref(key: string) {
    const newVal = !notifPrefs[key];
    setNotifPrefs(prev => ({ ...prev, [key]: newVal }));
    setPrefsSaving(true);
    try {
      const updated = await api.patch<NotifPrefs>('/api/me/notification-preferences', {
        preferences: { [key]: newVal },
      });
      if (updated && typeof updated === 'object') setNotifPrefs(updated as NotifPrefs);
    } catch {
      // Revert on error
      setNotifPrefs(prev => ({ ...prev, [key]: !newVal }));
    } finally {
      setPrefsSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-[720px] mx-auto space-y-5">
      <div className="mb-6">
        <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Settings</h1>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Manage your account preferences and appearance.</p>
      </div>

      {/* Appearance */}
      <SectionCard title="Appearance">
        <Row
          label="Theme"
          description="Choose between Light and Dark mode. Your preference is saved automatically."
        >
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </Row>
        <Row label="Current theme">
          <span className="flex items-center gap-2 text-[12px] font-mono text-[color:var(--vv-text-tertiary)]">
            {theme === 'dark' ? (
              <>
                <svg width="11" height="11" fill="#C67A4E" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <span style={{ color: '#C67A4E' }}>Dark</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#C67A4E" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <span style={{ color: '#C67A4E' }}>Light</span>
              </>
            )}
          </span>
        </Row>
      </SectionCard>

      {/* Account */}
      <SectionCard title="Account">
        <Row label="Name" description="Your display name across the platform.">
          <span className="text-[12.5px] text-[color:var(--vv-text-secondary)]">{user?.name ?? '—'}</span>
        </Row>
        <Row label="Email" description="Used for notifications and sign in.">
          <span className="text-[12.5px] font-mono text-[color:var(--vv-text-tertiary)]">{user?.email ?? '—'}</span>
        </Row>
        <Row label="Password">
          <button
            id="settings-change-password-btn"
            onClick={() => setShowPasswordModal(true)}
            className="text-[12px] text-[#C67A4E] hover:underline transition-colors"
          >
            Change password
          </button>
        </Row>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications">
        {prefsSaving && (
          <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-2 animate-pulse">Saving…</p>
        )}
        {NOTIF_PREF_LABELS.map(item => (
          <Row key={item.key} label={item.label} description={item.description}>
            <Toggle
              enabled={notifPrefs[item.key] !== false}
              onToggle={() => togglePref(item.key)}
            />
          </Row>
        ))}
      </SectionCard>

      {/* Privacy */}
      <SectionCard title="Privacy">
        <Row label="Profile visibility" description="Control who can discover your profile.">
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">Coming soon</span>
        </Row>
        <Row label="Data usage" description="How Vault Ventures uses your data to improve matching.">
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">Coming soon</span>
        </Row>
      </SectionCard>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}