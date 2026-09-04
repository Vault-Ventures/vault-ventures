import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { IconCheck, IconShield } from '../../components/layout/Icons';

// --- Types ---------------------------------------------------------------------

type TemplateType = 'system' | 'transactional' | 'engagement' | 'admin';
type TemplateStatus = 'active' | 'inactive';

interface NotifTemplate {
  id: string;
  name: string;
  type: TemplateType;
  status: TemplateStatus;
  trigger: string;
  title: string;
  message: string;
  lastUpdated: string;
  updatedBy: string;
}

// --- Data ----------------------------------------------------------------------

const INITIAL_TEMPLATES: NotifTemplate[] = [
  {
    id: 't1', type: 'system', status: 'active', lastUpdated: 'Aug 24, 2026', updatedBy: 'alvi@vaultventures.io',
    name: 'Welcome - New User',
    trigger: 'User registration completed',
    title: 'Welcome to Vault Ventures',
    message: 'Your account has been created. Complete your profile to get matched with the right opportunities.',
  },
  {
    id: 't2', type: 'system', status: 'active', lastUpdated: 'Aug 20, 2026', updatedBy: 'admin@vaultventures.io',
    name: 'Verification Approved',
    trigger: 'Admin approves user verification',
    title: 'Your account is verified',
    message: 'Congratulations - your identity has been verified. You now have full access to all platform features.',
  },
  {
    id: 't3', type: 'system', status: 'active', lastUpdated: 'Aug 18, 2026', updatedBy: 'admin@vaultventures.io',
    name: 'Verification Rejected',
    trigger: 'Admin rejects verification with reason',
    title: 'Verification could not be completed',
    message: 'Unfortunately, we were unable to verify your account at this time. Please review the feedback and resubmit.',
  },
  {
    id: 't4', type: 'transactional', status: 'active', lastUpdated: 'Aug 22, 2026', updatedBy: 'alvi@vaultventures.io',
    name: 'New Match Alert',
    trigger: 'High-confidence match (>75%) generated',
    title: 'You have a new match',
    message: 'A new high-confidence match has been found for you. Review the opportunity before it expires.',
  },
  {
    id: 't5', type: 'transactional', status: 'active', lastUpdated: 'Aug 19, 2026', updatedBy: 'admin@vaultventures.io',
    name: 'Interest Received',
    trigger: 'Investor or professional sends interest',
    title: 'Someone is interested',
    message: 'You have received a new interest request. Log in to review and respond.',
  },
  {
    id: 't6', type: 'transactional', status: 'active', lastUpdated: 'Aug 15, 2026', updatedBy: 'admin@vaultventures.io',
    name: 'Deal Room Opened',
    trigger: 'Deal Room created between parties',
    title: 'Your Deal Room is ready',
    message: 'A Deal Room has been created. Both parties can now share documents and communicate securely.',
  },
  {
    id: 't7', type: 'transactional', status: 'active', lastUpdated: 'Aug 14, 2026', updatedBy: 'alvi@vaultventures.io',
    name: 'NDA Signed',
    trigger: 'NDA signed by all parties',
    title: 'NDA completed',
    message: 'The Non-Disclosure Agreement has been signed by all parties. Confidential documents are now accessible.',
  },
  {
    id: 't8', type: 'transactional', status: 'active', lastUpdated: 'Aug 10, 2026', updatedBy: 'admin@vaultventures.io',
    name: 'Counter Offer Received',
    trigger: 'Negotiation counter offer submitted',
    title: 'Counter offer received',
    message: 'A counter offer has been submitted in your negotiation. Review the terms and respond.',
  },
  {
    id: 't9', type: 'engagement', status: 'inactive', lastUpdated: 'Aug 5, 2026', updatedBy: 'admin@vaultventures.io',
    name: 'Profile Incomplete Reminder',
    trigger: '7 days after registration if profile < 60%',
    title: 'Complete your profile',
    message: 'Your profile is incomplete. A complete profile improves your match quality significantly.',
  },
  {
    id: 't10', type: 'engagement', status: 'active', lastUpdated: 'Aug 8, 2026', updatedBy: 'admin@vaultventures.io',
    name: 'Readiness Score Update',
    trigger: 'Business readiness score changes significantly',
    title: 'Your Readiness Score changed',
    message: 'Your business Readiness Score has been updated. See what you can improve to attract better matches.',
  },
  {
    id: 't11', type: 'admin', status: 'active', lastUpdated: 'Aug 23, 2026', updatedBy: 'alvi@vaultventures.io',
    name: 'Admin Role Changed',
    trigger: 'Admin user role updated',
    title: 'Your admin role has been updated',
    message: 'Your admin role has been changed. If you believe this is an error, contact your platform administrator.',
  },
  {
    id: 't12', type: 'admin', status: 'active', lastUpdated: 'Aug 21, 2026', updatedBy: 'alvi@vaultventures.io',
    name: 'Security Alert',
    trigger: 'Suspicious activity or system security event',
    title: 'Security notice',
    message: 'A security event has been detected on your account. Please review your recent activity.',
  },
];

const TYPE_CFG: Record<TemplateType, { label: string; color: string; bg: string; border: string }> = {
  system:        { label: 'System',        color: '#C67A4E', bg: 'rgba(198,122,78,0.07)', border: 'rgba(198,122,78,0.2)' },
  transactional: { label: 'Transactional', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
  engagement:    { label: 'Engagement',    color: '#C67A4E', bg: 'rgba(198,122,78,0.08)', border: 'rgba(198,122,78,0.22)' },
  admin:         { label: 'Admin',         color: '#EF4444', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.2)' },
};

type FilterTab = 'all' | TemplateType;
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'system', label: 'System' },
  { key: 'transactional', label: 'Transactional' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'admin', label: 'Admin' },
];

// --- Sub-components ------------------------------------------------------------

function TypeBadge({ type }: { type: TemplateType }) {
  const c = TYPE_CFG[type];
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-9 h-5 rounded-full transition-all duration-200 flex items-center"
      style={{ background: value ? 'rgba(198,122,78,0.25)' : 'rgba(36,48,74,0.8)', border: `1px solid ${value ? 'rgba(198,122,78,0.4)' : '#35446A'}` }}>
      <span className="absolute w-3.5 h-3.5 rounded-full transition-all duration-200"
        style={{ left: value ? '18px' : '2px', background: value ? '#C67A4E' : '#5E6D8F' }} />
    </button>
  );
}

interface EditorDrawerProps {
  template: NotifTemplate;
  onSave: (updated: NotifTemplate) => void;
  onClose: () => void;
}

function EditorDrawer({ template, onSave, onClose }: EditorDrawerProps) {
  const [draft, setDraft] = useState<NotifTemplate>({ ...template });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSaveClick() {
    if (template.type === 'system' || template.type === 'admin') {
      setShowConfirm(true);
    } else {
      doSave();
    }
  }

  function doSave() {
    setSaving(true);
    setShowConfirm(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      onSave({ ...draft, lastUpdated: 'Aug 26, 2026', updatedBy: 'current.admin@vaultventures.io' });
      setTimeout(() => setSaved(false), 2000);
    }, 900);
  }

  const dirty = draft.title !== template.title || draft.message !== template.message || draft.status !== template.status;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="template-editor-title" style={{ background: 'rgba(4,8,15,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md h-full overflow-y-auto flex flex-col" style={{ background: '#0D1626', borderLeft: '1px solid #2B2D2F' }}>

        {showConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="template-save-title" style={{ background: 'rgba(4,8,15,0.85)' }}>
            <div className="rounded-[14px] border border-[color:var(--vv-border-strong)] p-5 w-full max-w-xs" style={{ background: 'rgba(13,22,38,0.98)' }}>
              <div className="flex items-start gap-2 mb-3">
                <IconShield s={14} className="text-[#F59E0B] shrink-0 mt-0.5" />
                <p id="template-save-title" className="text-[13px] font-semibold text-[color:var(--vv-text)]">Save System Template?</p>
              </div>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Changes to {TYPE_CFG[template.type].label} templates affect all users. This will be recorded in the Audit Log.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={doSave} className="flex-1">Confirm Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
          <div>
            <p id="template-editor-title" className="text-[13px] font-semibold text-[color:var(--vv-text)]">Edit Template</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{template.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close template editor" className="w-7 h-7 rounded-full flex items-center justify-center text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors"
            style={{ border: '1px solid #2B2D2F' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {saved && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[9px]"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <IconCheck s={12} className="text-[#22C55E]" />
              <p className="text-[12px] text-[#22C55E]">Saved and logged to Audit Log.</p>
            </div>
          )}

          {/* Read-only meta */}
          <div className="rounded-[10px] p-3.5 space-y-2" style={{ background: 'rgba(26,28,29,0.8)', border: '1px solid #2B2D2F' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Type</span>
              <TypeBadge type={template.type} />
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0">Trigger</span>
              <span className="text-[11px] text-[color:var(--vv-text-secondary)] text-right">{template.trigger}</span>
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">Status</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Enable or disable this template</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: draft.status === 'active' ? '#22C55E' : '#5E6D8F' }}>
                {draft.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <ToggleSwitch value={draft.status === 'active'} onChange={v => setDraft(d => ({ ...d, status: v ? 'active' : 'inactive' }))} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-tertiary)] mb-1.5">Notification Title</label>
            <input value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Notification title-"
              className="w-full px-3 py-2.5 rounded-[9px] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-all"
              style={{ background: '#182338', border: '1px solid #35446A' }}
              onFocus={e => (e.target.style.borderColor = '#C67A4E')}
              onBlur={e => (e.target.style.borderColor = '#35446A')}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-tertiary)] mb-1.5">Message Body</label>
            <textarea value={draft.message}
              onChange={e => setDraft(d => ({ ...d, message: e.target.value }))}
              rows={5}
              placeholder="Notification message-"
              className="w-full px-3 py-2.5 rounded-[9px] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none resize-none leading-relaxed transition-all"
              style={{ background: '#182338', border: '1px solid #35446A' }}
              onFocus={e => (e.target.style.borderColor = '#C67A4E')}
              onBlur={e => (e.target.style.borderColor = '#35446A')}
            />
          </div>

          {/* Last updated */}
          <div className="text-[10.5px]" style={{ color: '#35446A' }}>
            Last updated {template.lastUpdated} by {template.updatedBy}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[color:var(--vv-border)] flex gap-2">
          <Button size="sm" onClick={handleSaveClick} disabled={!dirty || saving} className="flex-1">
            {saving ? 'Saving-' : 'Save Template'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// --- Main ----------------------------------------------------------------------

export default function AdminNotificationTemplates() {
  const [templates, setTemplates] = useState<NotifTemplate[]>(INITIAL_TEMPLATES);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = templates.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.trigger.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleToggle(id: string) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t));
  }

  function handleSave(updated: NotifTemplate) {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  const editingTemplate = editingId ? templates.find(t => t.id === editingId) : null;

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
      {editingTemplate && (
        <EditorDrawer template={editingTemplate} onSave={handleSave} onClose={() => setEditingId(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Notification Templates</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Manage platform notification templates. Changes are logged to Audit Logs.</p>
        </div>
        <Badge>{templates.filter(t => t.status === 'active').length} Active</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-1 p-1 rounded-[9px] border border-[color:var(--vv-border)] w-fit" style={{ background: 'rgba(13,22,38,0.8)' }}>
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? templates.length : templates.filter(t => t.type === tab.key).length;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className="px-3 py-1 rounded-[7px] text-[11px] font-medium transition-all flex items-center gap-1.5"
                style={filter === tab.key
                  ? { background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.22)' }
                  : { color: '#5E6D8F', border: '1px solid transparent' }}>
                {tab.label}
                <span className="text-[10px] font-mono opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <svg width="13" height="13" className="absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates-"
            className="pl-8 pr-3 py-2 rounded-[9px] text-[12px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none w-52"
            style={{ background: 'rgba(26,28,29,0.8)', border: '1px solid #2B2D2F' }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2A3E' }}>
                {['Name / Trigger', 'Type', 'Status', 'Last Updated', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: '#5E6D8F' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No templates found</p>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1C2A3E' : 'none' }}
                  className="hover:bg-[color:var(--vv-raised)]/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{t.name}</p>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 leading-snug max-w-xs">{t.trigger}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <TypeBadge type={t.type} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <ToggleSwitch value={t.status === 'active'} onChange={() => handleToggle(t.id)} />
                      <span className="text-[11px]" style={{ color: t.status === 'active' ? '#22C55E' : '#5E6D8F' }}>
                        {t.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[11.5px] font-mono text-[color:var(--vv-text-tertiary)]">{t.lastUpdated}</p>
                    <p className="text-[10.5px] text-[#35446A] mt-0.5">{t.updatedBy}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => setEditingId(t.id)}
                      className="text-[11.5px] font-medium px-3 py-1.5 rounded-[7px] transition-all"
                      style={{ color: '#C67A4E', background: 'rgba(198,122,78,0.07)', border: '1px solid rgba(198,122,78,0.18)' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-[#35446A] mt-3">
        Template changes are logged to the Admin Audit Log and take effect immediately.
      </p>
    </div>
  );
}
