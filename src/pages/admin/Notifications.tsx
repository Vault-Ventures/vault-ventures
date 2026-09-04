import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

/* ─── Types ─── */
type NotifType = 'verification' | 'report' | 'dispute' | 'business' | 'application' | 'team' | 'deal' | 'security' | 'system';
type Priority = 'normal' | 'important' | 'high' | 'critical';
type FilterTab = 'all' | 'unread' | 'action' | 'high';
type Category = 'all' | 'verification' | 'report' | 'deal' | 'security' | 'system';

interface Notif {
  id: string;
  type: NotifType;
  priority: Priority;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  action?: { label: string; route: string };
}

/* ─── Demo data ─── */
const INITIAL: Notif[] = [
  {
    id: 'n1', type: 'security', priority: 'critical',
    title: 'Suspicious login attempt detected',
    desc: 'Multiple failed login attempts on admin account "alvi@vaultventures.io" from IP 203.0.113.45. Account temporarily restricted.',
    time: '2 min ago', unread: true,
    action: { label: 'Review in Audit Logs', route: '/app/admin/audit' },
  },
  {
    id: 'n2', type: 'report', priority: 'high',
    title: 'High-priority dispute escalated',
    desc: 'Case #RPT-2041 escalated by reviewer Mira Hasan. Involves potential fraud claim against NovaTech AI. Requires admin review within 24 hours.',
    time: '14 min ago', unread: true,
    action: { label: 'Review Case', route: '/app/admin/reports' },
  },
  {
    id: 'n3', type: 'verification', priority: 'high',
    title: 'Tier 2 verification request — business documents',
    desc: 'Structra Build submitted supporting documents for Tier 2 verification. Business registration and bank statement attached.',
    time: '31 min ago', unread: true,
    action: { label: 'Review', route: '/app/admin/verification' },
  },
  {
    id: 'n4', type: 'verification', priority: 'important',
    title: 'Tier 1 identity verification request',
    desc: 'Alex Morgan submitted a Tier 1 verification request. Government ID and selfie uploaded. Awaiting compliance review.',
    time: '1 hr ago', unread: true,
    action: { label: 'Review', route: '/app/admin/verification' },
  },
  {
    id: 'n5', type: 'deal', priority: 'important',
    title: 'Deal milestone payment triggered',
    desc: 'Milestone 3 "Series A Bridge Round" for NovaTech AI × Meridian Capital deal is marked active. ৳2.5Cr disbursement pending confirmation.',
    time: '2 hr ago', unread: true,
    action: { label: 'Review Deal', route: '/app/admin/deals' },
  },
  {
    id: 'n6', type: 'report', priority: 'important',
    title: 'New dispute filed',
    desc: 'Case #RPT-2044 opened. Investor Meridian Capital disputes terms interpretation in deal room with GreenPath Logistics.',
    time: '3 hr ago', unread: true,
    action: { label: 'Open Case', route: '/app/admin/reports' },
  },
  {
    id: 'n7', type: 'business', priority: 'important',
    title: 'Business profile flagged for review',
    desc: 'Orbit Analytics business profile flagged by automated compliance check. Inconsistent financial disclosures detected.',
    time: '4 hr ago', unread: false,
    action: { label: 'Review', route: '/app/admin/businesses' },
  },
  {
    id: 'n8', type: 'verification', priority: 'normal',
    title: 'Verification approved — Tier 1',
    desc: 'Medify Health Tier 1 identity verification approved by reviewer Alvi Rahman. Profile is now verified.',
    time: '5 hr ago', unread: false,
  },
  {
    id: 'n9', type: 'application', priority: 'normal',
    title: '12 new applications submitted',
    desc: 'Batch of 12 new applications received across Structra Build, Chainlink Legal, and NovaTech AI opportunities in the last 6 hours.',
    time: '6 hr ago', unread: false,
  },
  {
    id: 'n10', type: 'team', priority: 'normal',
    title: 'New team formed',
    desc: 'Team "NovaTech Core" created. 3 members onboarded including founding engineer Jordan Park. Linked to NovaTech AI deal room.',
    time: '8 hr ago', unread: false,
  },
  {
    id: 'n11', type: 'security', priority: 'high',
    title: 'Admin role settings changed',
    desc: 'Admin account "mira@vaultventures.io" updated notification and permission settings. Change logged in audit trail.',
    time: '9 hr ago', unread: false,
    action: { label: 'View Audit', route: '/app/admin/audit' },
  },
  {
    id: 'n12', type: 'deal', priority: 'normal',
    title: 'Deal stage advanced — NDA Signed',
    desc: 'Structra Build × Apex Capital deal progressed to NDA Signed stage. Both parties have completed document signing.',
    time: '11 hr ago', unread: false,
  },
  {
    id: 'n13', type: 'system', priority: 'important',
    title: 'Platform maintenance scheduled',
    desc: 'Routine maintenance window scheduled for Sunday 02:00–04:00 UTC. No data loss expected. Deal room messaging will be temporarily unavailable.',
    time: 'Yesterday · 18:42', unread: false,
  },
  {
    id: 'n14', type: 'verification', priority: 'normal',
    title: '5 verification requests pending review',
    desc: 'Queue has 5 unreviewed verification submissions older than 48 hours. Oldest: GreenPath Logistics (Tier 2).',
    time: 'Yesterday · 15:00', unread: false,
    action: { label: 'View Queue', route: '/app/admin/verification' },
  },
  {
    id: 'n15', type: 'report', priority: 'normal',
    title: 'Report resolved — Case #RPT-2038',
    desc: 'Dispute case #RPT-2038 marked Resolved by reviewer Alvi Rahman. No further action required.',
    time: 'Yesterday · 11:25', unread: false,
  },
  {
    id: 'n16', type: 'security', priority: 'normal',
    title: 'Two-factor authentication enabled',
    desc: 'Admin account "alvi@vaultventures.io" enabled 2FA. Device: Chrome / macOS. IP: 192.168.1.1.',
    time: '2 days ago', unread: false,
  },
  {
    id: 'n17', type: 'system', priority: 'normal',
    title: 'Weekly platform summary ready',
    desc: 'Analytics report for week ending Mar 24 is available. Key: 43 new users, 8 verification completions, 3 new deal rooms.',
    time: '2 days ago', unread: false,
    action: { label: 'View Analytics', route: '/app/admin/analytics' },
  },
  {
    id: 'n18', type: 'business', priority: 'normal',
    title: 'New business profile submitted',
    desc: 'Chainlink Legal submitted a business profile for platform review. Industry: LegalTech. Stage: Seed.',
    time: '3 days ago', unread: false,
    action: { label: 'Review', route: '/app/admin/businesses' },
  },
];

/* ─── Category filter mapping ─── */
const CATEGORY_TYPES: Record<Category, NotifType[]> = {
  all:          ['verification', 'report', 'dispute', 'business', 'application', 'team', 'deal', 'security', 'system'],
  verification: ['verification'],
  report:       ['report', 'dispute'],
  deal:         ['deal'],
  security:     ['security'],
  system:       ['system'],
};

/* ─── Icons per type ─── */
function TypeIcon({ type }: { type: NotifType }) {
  const map: Record<NotifType, { path: string; color: string }> = {
    verification: { color: '#C67A4E', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    report:       { color: '#F59E0B', path: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
    dispute:      { color: '#F04438', path: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
    business:     { color: '#3B82F6', path: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
    application:  { color: '#93A1BF', path: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
    team:         { color: '#C67A4E', path: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z' },
    deal:         { color: '#C9A24B', path: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' },
    security:     { color: '#F04438', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    system:       { color: '#5E6D8F', path: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
  };
  const { path, color } = map[type] ?? map.system;
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
      <svg width="13" height="13" fill="none" stroke={color} strokeWidth="1.75" viewBox="0 0 24 24">
        <path d={path}/>
      </svg>
    </div>
  );
}

/* ─── Priority badge ─── */
function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'normal') return null;
  const map: Record<string, { label: string; variant: any }> = {
    important: { label: 'Important', variant: 'info' },
    high:      { label: 'High',      variant: 'warning' },
    critical:  { label: 'Critical',  variant: 'danger' },
  };
  const { label, variant } = map[priority];
  return <Badge variant={variant}>{label}</Badge>;
}

/* ─── Skeleton row ─── */
function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#1c2a3e] animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-48" />
        <div className="h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-full" />
        <div className="h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-4/5" />
      </div>
      <div className="h-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded w-16 mt-1 shrink-0" />
    </div>
  );
}

/* ─── Notification row ─── */
function NotifRow({
  n, onMarkRead, onAction,
}: {
  n: Notif;
  onMarkRead: (id: string) => void;
  onAction: (route: string) => void;
}) {
  const isCritical = n.priority === 'critical';

  return (
    <div className={`relative flex items-start gap-3 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 group transition-colors ${
      n.unread ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]/40' : 'hover:bg-[color:var(--vv-raised)]/20'
    } ${isCritical && n.unread ? 'border-l-2 border-l-[#F04438]' : ''}`}>

      {/* Unread dot */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: n.unread ? (isCritical ? '#F04438' : '#C67A4E') : 'transparent' }} />

      {/* Type icon */}
      <div className="mt-0.5 ml-1">
        <TypeIcon type={n.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-0.5">
          <p className={`text-[12.5px] leading-snug ${n.unread ? 'font-semibold text-[color:var(--vv-text)]' : 'font-medium text-[color:var(--vv-text-secondary)]'}`}>
            {n.title}
          </p>
          <PriorityBadge priority={n.priority} />
        </div>
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed mb-1.5 line-clamp-2">{n.desc}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">{n.time}</span>
          {n.action && (
            <button
              onClick={() => onAction(n.action!.route)}
              className="text-[11px] font-medium text-[#C67A4E] hover:underline transition-colors">
              {n.action.label} →
            </button>
          )}
        </div>
      </div>

      {/* Mark read */}
      {n.unread && (
        <button
          onClick={() => onMarkRead(n.id)}
          title="Mark as read"
          className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] p-1">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<FilterTab>('all');
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setNotifs(INITIAL); setLoading(false); }, 380);
    return () => clearTimeout(t);
  }, []);

  const unreadCount = notifs.filter(n => n.unread).length;
  const highCount   = notifs.filter(n => n.priority === 'high' || n.priority === 'critical').length;
  const actionCount = notifs.filter(n => n.action).length;

  const filtered = notifs.filter(n => {
    if (tab === 'unread' && !n.unread) return false;
    if (tab === 'action' && !n.action) return false;
    if (tab === 'high' && n.priority !== 'high' && n.priority !== 'critical') return false;
    if (!CATEGORY_TYPES[category].includes(n.type)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.desc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all',    label: 'All',             count: notifs.length },
    { id: 'unread', label: 'Unread',          count: unreadCount },
    { id: 'action', label: 'Requires Action', count: actionCount },
    { id: 'high',   label: 'High Priority',   count: highCount },
  ];

  const CATEGORIES: { id: Category; label: string }[] = [
    { id: 'all',          label: 'All categories' },
    { id: 'verification', label: 'Verification' },
    { id: 'report',       label: 'Reports' },
    { id: 'deal',         label: 'Deals' },
    { id: 'security',     label: 'Security' },
    { id: 'system',       label: 'System' },
  ];

  return (
    <div className="max-w-[1100px] mx-auto p-5 pb-10 space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[18px] font-bold text-[color:var(--vv-text)] tracking-tight">Notifications</h1>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Important platform events and actions requiring attention.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/admin/settings')}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" className="mr-1.5">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Settings
          </Button>
          <Button size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Unread',          value: unreadCount, color: '#C67A4E' },
            { label: 'High Priority',   value: highCount,   color: '#F59E0B' },
            { label: 'Requires Action', value: actionCount, color: '#F04438' },
          ].map(s => (
            <div key={s.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3 flex items-center justify-between">
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{s.label}</p>
              <p className="font-mono text-[18px] font-bold tabular-nums" style={{ color: s.value > 0 ? s.color : '#35446A' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">

        {/* Filter tabs + category + search */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 px-4 py-3 border-b border-[#1c2a3e]">
          {/* Tabs — scrollable on narrow screens */}
          <div className="overflow-x-auto">
            <div className="flex bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md p-0.5 min-w-max">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11.5px] font-medium whitespace-nowrap transition-colors ${
                    tab === t.id ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}>
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      tab === t.id ? 'bg-[#35446A] text-[color:var(--vv-text)]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-tertiary)]'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category + search row */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Category */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="h-7 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            {/* Search */}
            <div className="relative flex-1 min-w-[140px]">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notifications…"
                className="h-7 pl-8 pr-3 w-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[11.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-[#F04438]/10 border border-[#F04438]/20 flex items-center justify-center mb-3">
              <svg width="18" height="18" fill="none" stroke="#F04438" strokeWidth="1.75" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">Notifications couldn't be loaded.</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Please try again.</p>
            <Button size="sm" variant="secondary" onClick={() => { setLoading(true); setTimeout(() => { setNotifs(INITIAL); setLoading(false); }, 600); }}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mb-3">
              <svg width="18" height="18" fill="none" stroke="#5E6D8F" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[color:var(--vv-text)] mb-1">
              {tab === 'unread' ? 'No unread notifications.' : "You're all caught up."}
            </p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
              {tab === 'unread' ? 'All notifications have been reviewed.' : 'Important platform events will appear here.'}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map(n => (
              <NotifRow
                key={n.id}
                n={n}
                onMarkRead={markRead}
                onAction={route => { markRead(n.id); navigate(route); }}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#1c2a3e] flex items-center justify-between">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
              {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-[11.5px] text-[#C67A4E] hover:underline transition-colors">
                Mark all as read
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}