import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';

type TemplateType = 'system' | 'transactional' | 'engagement' | 'admin';

interface NotifTemplate {
  id: string;
  name: string;
  type: TemplateType;
  trigger: string;
  title: string;
  message: string;
}

const STATIC_TEMPLATES: NotifTemplate[] = [
  {
    id: 't1', type: 'system',
    name: 'Welcome - New User Registration',
    trigger: 'User registration completed',
    title: 'Welcome to Vault Ventures',
    message: 'Your account has been created. Complete your profile and verification to unlock platform features.',
  },
  {
    id: 't2', type: 'system',
    name: 'Verification Approved',
    trigger: 'Admin approves user verification request',
    title: 'Your account is verified',
    message: 'Congratulations — your identity and business credentials have been approved by compliance.',
  },
  {
    id: 't3', type: 'system',
    name: 'Verification Information Requested',
    trigger: 'Admin requests additional evidence in verification queue',
    title: 'Additional verification information needed',
    message: 'Compliance has requested additional supporting documents for your verification review.',
  },
  {
    id: 't4', type: 'transactional',
    name: 'New Deal Room Match Alert',
    trigger: 'High-confidence mutual match generated',
    title: 'You have a new opportunity match',
    message: 'A mutual match has been identified based on verified sector, stage, and ticket preferences.',
  },
  {
    id: 't5', type: 'transactional',
    name: 'NDA Signed Notification',
    trigger: 'All parties execute Non-Disclosure Agreement in Deal Room',
    title: 'NDA Executed',
    message: 'The Non-Disclosure Agreement has been signed by all participants. Confidential room materials are unlocked.',
  },
  {
    id: 't6', type: 'transactional',
    name: 'Milestone Disbursed',
    trigger: 'Milestone marked funded and payout released',
    title: 'Milestone funding released',
    message: 'Milestone funding has been confirmed and transferred to the business milestone account.',
  },
  {
    id: 't7', type: 'engagement',
    name: 'Readiness Score Updated',
    trigger: 'Founder updates business readiness criteria',
    title: 'Readiness Score re-evaluated',
    message: 'Your business readiness score and dimension audit have been refreshed.',
  },
  {
    id: 't8', type: 'admin',
    name: 'Dispute Escalated',
    trigger: 'User files formal report in Deal Room or Financial Governance',
    title: 'Dispute report pending review',
    message: 'A formal compliance report has been submitted requiring administrative review.',
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
  { key: 'all', label: 'All Templates' },
  { key: 'system', label: 'System' },
  { key: 'transactional', label: 'Transactional' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'admin', label: 'Admin' },
];

export default function AdminNotificationTemplates() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const filtered = STATIC_TEMPLATES.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.trigger.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Notification Dispatch Catalog</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Platform transactional notification schemas and system trigger blueprints.</p>
        </div>
        <Badge variant="neutral">Code-Defined Schemas</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 p-1 rounded-[9px] border border-[color:var(--vv-border)] w-fit" style={{ background: 'rgba(13,22,38,0.8)' }}>
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? STATIC_TEMPLATES.length : STATIC_TEMPLATES.filter(t => t.type === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="px-3 py-1 rounded-[7px] text-[11px] font-medium transition-all flex items-center gap-1.5"
                style={filter === tab.key
                  ? { background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.22)' }
                  : { color: '#5E6D8F', border: '1px solid transparent' }}
              >
                {tab.label}
                <span className="text-[10px] font-mono opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="px-3 py-1.5 rounded-[9px] text-[12px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none w-52 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)]"
          />
        </div>
      </div>

      {/* Templates List */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
        <div className="divide-y divide-[color:var(--vv-border)]">
          {filtered.map(t => {
            const cfg = TYPE_CFG[t.type];
            return (
              <div key={t.id} className="p-4 sm:p-5 hover:bg-[color:var(--vv-raised)]/20 transition-colors space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      {cfg.label}
                    </span>
                    <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{t.name}</p>
                  </div>
                  <span className="text-[10.5px] font-mono text-[color:var(--vv-text-tertiary)]">{t.id}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md p-3">
                    <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] mb-1">Trigger Event</p>
                    <p className="text-[color:var(--vv-text-secondary)]">{t.trigger}</p>
                  </div>
                  <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md p-3">
                    <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] mb-1">Rendered Copy ({t.title})</p>
                    <p className="text-[color:var(--vv-text-secondary)]">{t.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
