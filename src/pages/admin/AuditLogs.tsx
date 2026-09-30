import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api, AdminVerificationRequestData, FinancialReportItem } from '../../services/api';

type Tab = 'financial' | 'verification';
type Event = {
  key: string; action: string; actor?: string | null; role?: string | null;
  time?: string | null; previous?: unknown; next?: unknown; notes?: string | null;
  evidenceId?: number;
};
type Details = { fields: [string, string][]; events: Event[] };
const panel = 'rounded-[14px] border border-[color:var(--vv-border)] bg-[color:var(--vv-surface)] p-5';
const input = 'w-full rounded-lg border border-[color:var(--vv-border)] bg-[color:var(--vv-bg)] p-3 text-[color:var(--vv-text)]';
const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Not recorded';
const fieldLabels: Record<string, string> = {
  net_profit_loss: 'Net P/L', cash_position: 'Cash Position', evidence_id: 'Evidence ID',
  admin_review_notes: 'Review Notes', reviewed_by_user_id: 'Reviewed By (User ID)',
};
const moneyFields = new Set(['revenue', 'expenses', 'net_profit_loss', 'cash_position']);
const readableDate = (value: string) => {
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : parsed.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Flatten persisted snapshots into readable fields, never JSON or inferred values.
function snapshotFields(snapshot: unknown, prefix = ''): Map<string, string> {
  const fields = new Map<string, string>();
  if (snapshot == null) return fields;
  const entries = typeof snapshot === 'object' ? Object.entries(snapshot) : [['status', snapshot]];
  for (const [key, value] of entries) {
    if (value == null || value === '') continue;
    const name = prefix + (fieldLabels[key] || label(key).replace(/\bId\b/g, 'ID'));
    if (typeof value === 'object') {
      for (const [nestedName, nestedValue] of snapshotFields(value, `${name} · `)) fields.set(nestedName, nestedValue);
    } else if (moneyFields.has(key) && /^-?\d+(\.\d+)?$/.test(String(value))) {
      fields.set(name, `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } else if (key.endsWith('_at') || key.startsWith('reporting_period_')) {
      fields.set(name, readableDate(String(value)));
    } else {
      // Preserve filenames, names and free-form notes exactly as recorded.
      fields.set(name, typeof value === 'boolean' ? (value ? 'Yes' : 'No')
        : /status|role|type/.test(key) ? label(String(value)) : String(value));
    }
  }
  if (fields.has('Reporting Period Start') && fields.has('Reporting Period End')) {
    fields.set('Reporting Period', `${fields.get('Reporting Period Start')} – ${fields.get('Reporting Period End')}`);
    fields.delete('Reporting Period Start'); fields.delete('Reporting Period End');
  }
  return fields;
}

function AuditEventCard({ event }: { event: Event }) {
  const previous = snapshotFields(event.previous);
  const next = snapshotFields(event.next);
  const names = [...new Set([...next.keys(), ...previous.keys()])];
  const isReview = ['report_verified', 'report_reviewed', 'report_under_review'].includes(event.action);
  const title = event.action === 'report_reviewed' && next.get('Status') === 'Verified'
    ? 'Report Verified' : label(event.action);
  return <li className="min-w-0 rounded-lg border border-[color:var(--vv-border)] border-l-2 border-l-[#C67A4E] p-3">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 className="font-semibold [overflow-wrap:anywhere]">{title}</h3>
      {event.time && <time dateTime={event.time} className="text-xs text-[color:var(--vv-text-tertiary)]">{readableDate(event.time)}</time>}
    </div>
    {(event.actor || event.role) && <p className="text-xs mt-1 [overflow-wrap:anywhere] text-[color:var(--vv-text-tertiary)]">
      {event.actor && <>{isReview ? 'Reviewed By' : 'Actor'}: {event.actor}</>}{event.role && <>{event.actor ? ' · ' : ''}{label(event.role)}</>}
    </p>}
    {event.evidenceId != null && <p className="text-xs mt-2">Chain of custody · Evidence #{event.evidenceId}</p>}
    {names.length > 0 && <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-2 mt-3 text-xs">
      {names.map(name => {
        const before = previous.get(name);
        const after = next.get(name);
        return <div key={name} className="min-w-0 [overflow-wrap:anywhere]">
          <dt className="text-[color:var(--vv-text-tertiary)] mb-0.5">{after === undefined ? `Previous ${name}` : name}</dt>
          <dd className="whitespace-pre-wrap leading-relaxed">{before !== undefined && after !== undefined && before !== after
            ? <><span>{before}</span> <span aria-label="changed to">→</span> <span>{after}</span></>
            : after ?? before}</dd>
        </div>;
      })}
    </dl>}
    {event.notes && <div className="mt-2 text-xs [overflow-wrap:anywhere]"><p className="text-[color:var(--vv-text-tertiary)]">Notes / Reason</p><p className="whitespace-pre-wrap leading-relaxed">{event.notes}</p></div>}
  </li>;
}

function History({ tab }: { tab: Tab }) {
  const [reports, setReports] = useState<FinancialReportItem[]>([]);
  const [requests, setRequests] = useState<AdminVerificationRequestData[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [details, setDetails] = useState<Details | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setListError(false);
    async function load() {
      try {
        if (tab === 'financial') {
          const all: FinancialReportItem[] = [];
          let page = 1;
          let last = 1;
          do {
            const result = await api.admin.financialReports.list({ page, per_page: 100 });
            if (!active) return;
            all.push(...result.reports);
            last = result.pagination.last_page;
            page++;
          } while (page <= last);
          setReports(all);
        } else {
          const result = await api.admin.verificationRequests.list({ status: 'all' });
          if (active) setRequests(result);
        }
      } catch { if (active) setListError(true); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [tab, retry]);

  useEffect(() => {
    let active = true;
    setDetails(null); setDetailError('');
    if (!selected) { setDetailLoading(false); return; }
    setDetailLoading(true);
    async function load() {
      try {
        let result: Details;
        if (tab === 'financial') {
          const [report, history] = await Promise.all([
            api.admin.financialReports.get(selected), api.admin.financialReports.getAuditLogs(selected),
          ]);
          result = {
            fields: [
              ['Report ID', String(report.id)], ['Business', report.business?.name || report.business_name || 'Not recorded'],
              ['Deal ID', String(report.deal_id)],
              ['Reporting period', `${report.reporting_period_start} – ${report.reporting_period_end}`],
              ['Current status', report.status_label || label(report.status)],
            ],
            events: [...history.audit_logs.map(log => ({
              key: `audit-${log.id}`, action: log.action, actor: log.actor?.name, role: log.actor_role,
              time: log.created_at, previous: log.old_state, next: log.new_state,
            })), ...(history.evidence_access_logs || []).map(log => ({
              key: `access-${log.id}`, action: log.action, actor: log.actor?.name, role: log.actor_role,
              time: log.created_at, evidenceId: log.financial_report_evidence_id,
            }))],
          };
        } else {
          const [request, history] = await Promise.all([
            api.admin.verificationRequests.get(selected), api.admin.verificationRequests.getAuditLogs(selected),
          ]);
          result = {
            fields: [
              ['Request ID', String(request.id)], ['Applicant', request.user?.name || 'Not recorded'],
              ['Requested tier', request.requested_tier_label || String(request.requested_tier)],
              ['Current status', label(request.status)], ['Submitted date', date(request.submitted_at)],
              ['Reviewed date', date(request.reviewed_at)],
              ['Assigned admin', request.assigned_admin?.name || (request.assigned_admin_id ? `Admin #${request.assigned_admin_id}` : 'Unassigned')],
            ],
            events: [
              ...history.audit_logs.map(log => ({
                key: `audit-${log.id}`, action: log.action, actor: log.actor?.name, time: log.occurred_at,
                previous: log.previous_status, next: log.new_status, notes: log.notes,
              })),
              ...history.evidence_access_logs.map(log => ({
                key: `access-${log.id}`, action: log.action, actor: log.actor?.name,
                time: log.occurred_at, evidenceId: log.verification_evidence_id,
              })),
            ],
          };
        }
        result.events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        if (active) setDetails(result);
      } catch (error) {
        if (active) setDetailError((error as { status?: number })?.status === 404
          ? 'This record is unavailable or has been deleted.' : 'Unable to load audit history. Please try again.');
      } finally { if (active) setDetailLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [selected, tab, retry]);

  const items = tab === 'financial'
    ? reports.map(r => ({ id: r.id, text: `Report #${r.id} · ${r.business_name || r.business?.name || 'Business not recorded'} · Deal #${r.deal_id} · ${r.reporting_period_start} – ${r.reporting_period_end} · ${r.status}` }))
    : requests.map(r => ({ id: r.id, text: `Request #${r.id} · ${r.user?.name || 'Applicant not recorded'} · ${r.user?.email || ''} · ${r.status}` }));
  const filtered = items.filter(item => item.text.toLowerCase().includes(query.toLowerCase()));
  const noun = tab === 'financial' ? 'report' : 'verification request';
  return (
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-5">
      <div className={panel}>
        {loading ? <p role="status">Loading {noun}s…</p> : listError ? <div role="alert">Unable to load {noun}s. <Button variant="secondary" onClick={() => setRetry(v => v + 1)}>Retry</Button></div>
          : items.length === 0 ? <p>No {noun}s available.</p> : <div className="space-y-3">
            <label className="block">Search {noun}s
              <input className={`${input} mt-2`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by ID, name or status" />
            </label>
            <label className="block">Select a {noun}
              <select className={`${input} mt-2`} value={selected} onChange={e => { setSelected(e.target.value); setDetails(null); }}>
                <option value="">Choose a {noun}</option>
                {items.filter(item => filtered.includes(item) || String(item.id) === selected).map(item => <option key={item.id} value={item.id}>{item.text}</option>)}
              </select>
            </label>
            {filtered.length === 0 && <p>No matching {noun}s.</p>}
          </div>}
      </div>
      {detailLoading && <p role="status">Loading audit history…</p>}
      {detailError && <div role="alert" className={panel}>{detailError} <Button variant="secondary" onClick={() => setRetry(v => v + 1)}>Retry</Button></div>}
      {details && <>
        <dl className={`${panel} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`}>
          {details.fields.map(([name, value]) => <div key={name}><dt className="text-[color:var(--vv-text-tertiary)] text-xs mb-1">{name}</dt><dd className="break-words">{value}</dd></div>)}
        </dl>
        <section className={panel} aria-label="Audit timeline">
          <h2 className="font-display text-lg font-semibold mb-4">Audit timeline</h2>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-5">Persisted events, oldest first. Missing events and fields are not inferred.</p>
          {details.events.length === 0 ? <p>No audit events recorded.</p> : <ol className="space-y-3">
            {details.events.map(event => <AuditEventCard key={event.key} event={event} />)}
          </ol>}
        </section>
      </>}
    </div>
  );
}

export default function AdminAuditLogs() {
  const [tab, setTab] = useState<Tab>('financial');
  return <div className="p-6 max-w-[1280px] mx-auto text-[color:var(--vv-text)] text-sm">
    <div className="flex flex-wrap items-center gap-3 mb-2"><h1 className="font-display text-2xl font-semibold">System Audit Logs</h1><Badge variant="neutral">Read-only history</Badge></div>
    <p className="text-[color:var(--vv-text-tertiary)] mb-6">Review financial report and Tier 1 verification history from persisted records.</p>
    <div role="tablist" aria-label="Audit history" className="flex flex-wrap gap-3 mb-5">
      {(['financial', 'verification'] as const).map((value, index) => <button key={value} id={`tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`}
        className={`px-4 py-3 rounded-lg border ${tab === value ? 'border-[#C67A4E] bg-[#C67A4E]/10' : 'border-[color:var(--vv-border)]'}`}
        onClick={() => setTab(value)}>{index === 0 ? 'Financial Report Audit Trail' : 'Verification History'}</button>)}
    </div>
    <History key={tab} tab={tab} />
  </div>;
}
