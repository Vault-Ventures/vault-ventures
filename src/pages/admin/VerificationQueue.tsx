import React, { useEffect, useState, useRef } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconAlertTriangle, IconShield,
  IconFilter, IconEye, IconFileText,
} from '../../components/layout/Icons';
import { api, AdminVerificationRequestData, AdminVerificationEvidenceData, ApiError } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifStatus = 'Pending' | 'Under Review' | 'Needs Information' | 'Approved' | 'Rejected' | 'Cancelled';

const REJECT_REASONS = [
  'Insufficient evidence',
  'Information mismatch',
  'Invalid submission',
  'Policy issue',
  'Suspicious activity',
  'Other',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatStatus = (s: string): VerifStatus => {
  switch (s?.toLowerCase()) {
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'needs_information': return 'Needs Information';
    case 'under_review': return 'Under Review';
    case 'cancelled': return 'Cancelled';
    default: return 'Pending';
  }
};

const statusVariant = (s: VerifStatus) =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : s === 'Needs Information' ? 'warning' : s === 'Under Review' ? 'info' : 'neutral';

function Skeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0">
          <div className="w-7 h-7 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-32 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-7 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Request Information modal ────────────────────────────────────────────────

function RequestInfoModal({ req, onSend, onCancel, loading }: {
  req: AdminVerificationRequestData;
  onSend: (msg: string, notes: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [msg, setMsg] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="request-verification-info-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <p id="request-verification-info-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display mb-1">Request Additional Information</p>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">
          For <strong className="text-[color:var(--vv-text-secondary)]">{req.user?.name || `User #${req.user_id}`}</strong> — Tier {req.requested_tier} request
        </p>
        <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
          Message to Participant
        </label>
        <textarea
          aria-label="Message to Participant" maxLength={2000} value={msg} onChange={e => setMsg(e.target.value)}
          rows={4} placeholder="Describe what information or documents are required from the applicant…"
          className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none"
        />
        <label className="block text-xs mt-3">Internal Admin Notes (optional)
          <textarea aria-label="Internal Admin Notes" maxLength={2000} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className="w-full bg-transparent border rounded p-2" />
        </label>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button size="sm" className="flex-1" onClick={() => msg.trim() && onSend(msg, internalNotes)} disabled={!msg.trim() || loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({ req, onReject, onCancel, loading }: {
  req: AdminVerificationRequestData;
  onReject: (reason: string, notes: string, message: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [participantMessage, setParticipantMessage] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-verification-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center shrink-0">
            <IconX s={14} className="text-[#F04438]" />
          </div>
          <div>
            <p id="reject-verification-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Reject Verification</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{req.user?.name || `User #${req.user_id}`} · Tier {req.requested_tier} request</p>
          </div>
        </div>
        <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
          Rejection reason <span className="text-[#F04438]">*</span>
        </label>
        <select value={reason} onChange={e => setReason(e.target.value)}
          className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors mb-3">
          <option value="">Select a reason…</option>
          {REJECT_REASONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1.5">
          Internal Admin Notes (optional)
        </label>
        <textarea aria-label="Internal Admin Notes" maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)}
          rows={3} placeholder="Private context for the audit record"
          className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none mb-4"
        />
        <label className="block text-xs my-3">Message to Participant (optional)
          <textarea aria-label="Message to Participant" maxLength={2000} value={participantMessage} onChange={e => setParticipantMessage(e.target.value)} className="w-full bg-transparent border rounded p-2" />
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => reason && onReject(reason, notes, participantMessage)} disabled={!reason || loading}>
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Approve modal ────────────────────────────────────────────────────────────

function ApproveModal({ req, onApprove, onCancel, loading }: {
  req: AdminVerificationRequestData;
  onApprove: (notes?: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="approve-verification-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
            <IconCheck s={14} className="text-[#22C55E]" />
          </div>
          <div>
            <p id="approve-verification-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Approve Tier {req.requested_tier} Verification</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Action will be logged in audit trail</p>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between py-1 border-b border-[#1c2a3e]">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Applicant</span>
            <span className="text-[11.5px] text-[color:var(--vv-text)] font-medium">{req.user?.name || `User #${req.user_id}`}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#1c2a3e]">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Email</span>
            <span className="text-[11.5px] text-[color:var(--vv-text)] font-medium">{req.user?.email}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Requested Tier</span>
            <span className="text-[11.5px] text-[color:var(--vv-text)] font-medium">Tier {req.requested_tier}</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1">
            Approval Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional verification review notes..."
            rows={2}
            className="w-full px-3 py-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12px] text-[color:var(--vv-text)]"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={() => onApprove(notes)} disabled={loading}>
            {loading ? 'Approving...' : `Approve Tier ${req.requested_tier}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Review drawer ────────────────────────────────────────────────────────────

function EvidenceDownload({ requestId, evidence }: { requestId: number; evidence: AdminVerificationEvidenceData }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const alive = useRef(true);
  const pending = useRef(false);
  const objectUrl = useRef<string | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); };
  }, []);
  useEffect(() => {
    if (!url) return;
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url); objectUrl.current = null; setUrl(null);
    }, 60_000);
    return () => window.clearTimeout(timer);
  }, [url]);
  async function retrieve() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const blob = await api.admin.verificationRequests.downloadEvidence(requestId, evidence.id);
      if (!alive.current) return;
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(blob.type)) throw new Error('Unsupported document response.');
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      const next = URL.createObjectURL(blob); objectUrl.current = next; setUrl(next);
    } catch (err) {
      if (alive.current) setError(err instanceof Error ? err.message : 'Unable to retrieve evidence.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return <div className="space-y-1 text-xs">
    <p>{evidence.created_at ? new Date(evidence.created_at).toLocaleString() : 'Upload time unavailable'}</p>
    <Button size="sm" variant="secondary" disabled={busy} onClick={retrieve}>{busy ? 'Loading…' : 'View Evidence'}</Button>
    {url && <a className="block underline" href={url} download={evidence.original_filename}>Download document</a>}
    {error && <p role="alert" className="text-red-400">{error}</p>}
  </div>;
}

function ReviewDrawer({ req, onClose, onApprove, onRequestInfo, onReject }: {
  req: AdminVerificationRequestData;
  onClose: () => void;
  onApprove: () => void;
  onRequestInfo: () => void;
  onReject: () => void;
}) {
  const [section, setSection] = useState<'details' | 'evidence'>('details');
  const isFinal = ['approved', 'rejected', 'cancelled'].includes(req.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="verification-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[460px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full overflow-y-auto flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] bg-[#0D1626] sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[13px] font-bold text-[color:var(--vv-text)] shrink-0">
                {(req.user?.name || 'U')[0]}
              </div>
              <div className="min-w-0">
                <p id="verification-drawer-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{req.user?.name || `User #${req.user_id}`}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Request #{req.id} · Tier {req.requested_tier}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0 mt-0.5">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(formatStatus(req.status))} dot>{formatStatus(req.status)}</Badge>
            <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Tier {req.requested_tier}</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="shrink-0 flex border-b border-[color:var(--vv-border)] overflow-x-auto">
          {(['details', 'evidence'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSection(t)}
              className={`px-4 py-2.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${
                section === t ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              {t === 'details' ? 'Applicant Details' : 'Submitted Evidence'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {section === 'details' && (
            <div className="px-5 py-4 space-y-5">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Applicant Identity</p>
                <div className="space-y-2">
                  {[
                    { label: 'Name', value: req.user?.name || '—' },
                    { label: 'Email', value: <span className="font-mono text-[10.5px]">{req.user?.email || '—'}</span> },
                    { label: 'Phone', value: req.user?.phone || 'Not verified' },
                    { label: 'Submitted At', value: req.submitted_at ? new Date(req.submitted_at).toLocaleString() : '—' },
                    { label: 'Reviewed At', value: req.reviewed_at ? new Date(req.reviewed_at).toLocaleString() : 'Not reviewed yet' },
                    { label: 'Assigned Reviewer', value: req.assigned_admin?.name || 'Unassigned' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-1.5 border-b border-[#1c2a3e] last:border-0">
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0 pt-0.5">{r.label}</span>
                      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right leading-snug">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {req.admin_notes && (
                <div className="p-3 bg-[#141E33] border border-[color:var(--vv-border)] rounded-md">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1">Admin Notes</p>
                  <p className="text-[12px] text-[color:var(--vv-text-secondary)]">{req.admin_notes}</p>
                </div>
              )}

              {req.rejection_reason && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-md">
                  <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold mb-1">Rejection Reason</p>
                  <p className="text-[12px] text-rose-300">{req.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {section === 'evidence' && (
            <div className="px-5 py-4">
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">
                Submitted Documents ({req.evidence?.length || req.evidence_count || 0})
              </p>
              {req.evidence && req.evidence.length > 0 ? (
                <div className="space-y-2">
                  {req.evidence.map(e => (
                    <div key={e.id} className="flex items-start gap-3 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[8px]">
                      <IconFileText s={14} className="text-[#C67A4E] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{e.original_filename}</p>
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                          {e.mime_type} • {Math.ceil(e.file_size_bytes / 1024)} KiB
                        </p>
                      </div>
                      <EvidenceDownload requestId={req.id} evidence={e} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-[12px] text-[color:var(--vv-text-tertiary)] bg-[#121A2B] rounded-lg border border-[color:var(--vv-border)]">
                  {req.evidence_count ? `${req.evidence_count} evidence files submitted.` : 'No verification evidence uploaded.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isFinal && (
          <div className="shrink-0 p-4 border-t border-[color:var(--vv-border)] bg-[#0D1626] flex gap-2">
            <Button size="sm" className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white border-transparent" onClick={onApprove}>
              Approve
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={onRequestInfo}>
              Request Info
            </Button>
            <Button size="sm" variant="destructive" onClick={onReject}>
              Reject
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Main Verification Queue ──────────────────────────────────────────────────

export default function AdminVerificationQueue() {
  const [queue, setQueue] = useState<AdminVerificationRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'needs_information' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState<AdminVerificationRequestData | null>(null);
  const [modal, setModal] = useState<'approve' | 'reject' | 'requestInfo' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = filter !== 'all' ? { status: filter } : undefined;
      const data = await api.admin.verificationRequests.list(params);
      setQueue(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification queue from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [filter]);

  const handleOpenDrawer = async (item: AdminVerificationRequestData) => {
    try {
      const full = await api.admin.verificationRequests.get(item.id);
      setDrawer(full || item);
    } catch {
      setDrawer(item);
    }
  };

  const handleApprove = async (notes?: string) => {
    if (!drawer) return;
    try {
      setActionLoading(true);
      await api.admin.verificationRequests.approve(drawer.id, notes);
      setModal(null);
      setDrawer(null);
      await loadQueue();
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string, notes: string, message: string) => {
    if (!drawer) return;
    try {
      setActionLoading(true);
      await api.admin.verificationRequests.reject(drawer.id, reason, notes, message);
      setModal(null);
      setDrawer(null);
      await loadQueue();
    } catch (err: any) {
      setError(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async (message: string, notes: string) => {
    if (!drawer) return;
    try {
      setActionLoading(true);
      await api.admin.verificationRequests.requestInformation(drawer.id, message, notes);
      setModal(null);
      setDrawer(null);
      await loadQueue();
    } catch (err: any) {
      setError(err.message || 'Information request failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = queue.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.user?.name && r.user.name.toLowerCase().includes(s)) ||
      (r.user?.email && r.user.email.toLowerCase().includes(s)) ||
      String(r.id).includes(s)
    );
  });

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Verification Queue</h1>
            <Badge variant="neutral">Tier 1 Identity & Accreditation</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Review and adjudicate user verification requests submitted across the platform.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={loadQueue} disabled={loading}>
          Refresh Queue
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="underline ml-4 text-[12px]">Dismiss</button>
        </div>
      )}

      {/* Filter bar & search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 p-1 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-x-auto">
          {[
            { key: 'all', label: 'All Active' },
            { key: 'pending', label: 'Pending' },
            { key: 'under_review', label: 'Under Review' },
            { key: 'needs_information', label: 'Needs Info' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key as any)}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all whitespace-nowrap ${
                filter === t.key
                  ? 'bg-[#C67A4E] text-white shadow-sm'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#35446A] pointer-events-none">
            <IconSearch s={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, request ID..."
            className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] overflow-hidden">
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <IconShield s={32} className="mx-auto mb-3 text-[color:var(--vv-text-tertiary)]" />
            <p className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">
              No Verification Requests Found
            </p>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto">
              There are no verification requests matching the current status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[color:var(--vv-border)]">
                  {['Applicant', 'Requested Tier', 'Submitted', 'Status', 'Evidence Files', 'Assigned Admin', 'Action'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer"
                    onClick={() => handleOpenDrawer(r)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                          {(r.user?.name || 'U')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{r.user?.name || `User #${r.user_id}`}</p>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{r.user?.email || `Req #${r.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <VerificationBadge tier={Number(r.requested_tier) as 1 | 2} />
                        <span className="text-[11.5px] text-[color:var(--vv-text-secondary)]">Tier {r.requested_tier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(formatStatus(r.status))} dot>{formatStatus(r.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">
                      {r.evidence_count ?? r.evidence?.length ?? 0} file(s)
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">
                      {r.assigned_admin?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => handleOpenDrawer(r)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Drawer */}
      {drawer && (
        <ReviewDrawer
          req={drawer}
          onClose={() => setDrawer(null)}
          onApprove={() => setModal('approve')}
          onRequestInfo={() => setModal('requestInfo')}
          onReject={() => setModal('reject')}
        />
      )}

      {/* Modals */}
      {drawer && modal === 'approve' && (
        <ApproveModal
          req={drawer}
          onApprove={handleApprove}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {drawer && modal === 'reject' && (
        <RejectModal
          req={drawer}
          onReject={handleReject}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {drawer && modal === 'requestInfo' && (
        <RequestInfoModal
          req={drawer}
          onSend={handleRequestInfo}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
