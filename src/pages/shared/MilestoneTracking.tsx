import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useRole } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import {
  api,
  ApiError,
  type DealMilestoneData,
  type FundingSummaryData,
  type CreateMilestonePayload,
} from '../../services/api';
import { IconAlertTriangle, IconCheck, IconLock } from '../../components/layout/Icons';

// --- Types --------------------------------------------------------------------

type DisplayMilestoneStatus = 'completed' | 'active' | 'submitted' | 'disputed' | 'upcoming';
type ViewRole = 'founder' | 'investor' | 'professional';

interface ActivityEntry {
  actor: string;
  action: string;
  time: string;
}

export function getMilestoneDisplayStatus(m: DealMilestoneData): DisplayMilestoneStatus {
  if (m.status === 'funded') return 'completed';
  if (m.status === 'submitted') return 'submitted';
  if (m.status === 'active') {
    if (m.dispute_reason) return 'disputed';
    return 'active';
  }
  return 'upcoming';
}

export function generateMilestoneActivity(m: DealMilestoneData): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  if (m.funded_at) {
    entries.push({
      actor: 'Counterparty',
      action: `Confirmed milestone completion • Tranche released${m.confirmation_notes ? ` ("${m.confirmation_notes}")` : ''}`,
      time: new Date(m.funded_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    });
  }

  if (m.dispute_reason) {
    entries.push({
      actor: 'Counterparty',
      action: `Returned for revision: "${m.dispute_reason}"`,
      time: 'Action required',
    });
  }

  if (m.submitted_at) {
    entries.push({
      actor: 'Founder',
      action: `Submitted 100% completion verification${m.evidence_notes ? ` ("${m.evidence_notes}")` : ''}`,
      time: new Date(m.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    });
  } else if (m.status === 'active' && m.progress_percentage > 0) {
    entries.push({
      actor: 'Founder',
      action: `Updated progress to ${m.progress_percentage}%${m.evidence_notes ? ` ("${m.evidence_notes}")` : ''}`,
      time: m.updated_at ? new Date(m.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'In progress',
    });
  }

  if (m.created_at) {
    entries.push({
      actor: 'System',
      action: `Milestone #${m.sequence_order} defined (৳${Number(m.target_amount).toLocaleString('en-IN')})`,
      time: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  }

  return entries;
}

// --- Helpers ------------------------------------------------------------------

const STATUS_CONFIG: Record<DisplayMilestoneStatus, { label: string; color: string; bg: string; border: string }> = {
  completed: { label: 'Funded & Complete',    color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.22)' },
  active:    { label: 'Active',              color: '#C67A4E', bg: 'rgba(198,122,78,0.07)',  border: 'rgba(198,122,78,0.20)' },
  submitted: { label: 'Awaiting Confirmation', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  disputed:  { label: 'Revision Requested',   color: '#F04438', bg: 'rgba(240,68,56,0.07)',   border: 'rgba(240,68,56,0.20)' },
  upcoming:  { label: 'Pending',             color: '#5E6D8F', bg: 'rgba(94,109,143,0.06)',  border: 'rgba(94,109,143,0.18)' },
};

function StatusPill({ status }: { status: DisplayMilestoneStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

function ProgressBar({ value, status }: { value: number; status: DisplayMilestoneStatus }) {
  const color = status === 'completed' ? '#22C55E' : status === 'disputed' ? '#F04438' : '#C67A4E';
  return (
    <div className="h-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
      />
    </div>
  );
}

// --- Submit Progress Modal -----------------------------------------------------

function SubmitProgressModal({
  milestone,
  onClose,
  onSubmit,
}: {
  milestone: DealMilestoneData;
  onClose: () => void;
  onSubmit: (progress: number, note: string, evidenceUrls?: string[]) => Promise<void>;
}) {
  const [progress, setProgress] = useState(milestone.progress_percentage);
  const [note, setNote] = useState(milestone.evidence_notes ?? '');
  const [urlInput, setUrlInput] = useState(milestone.evidence_urls ? milestone.evidence_urls.join(', ') : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFullSubmit = progress === 100;

  async function handleSubmit() {
    if (!note.trim() && isFullSubmit) {
      setError('Evidence notes or summary are required for 100% milestone completion submission.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const urls = urlInput
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      await onSubmit(progress, note.trim(), urls.length > 0 ? urls : undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit milestone progress.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-progress-title"
      >
        <div className="w-full max-w-md rounded-[16px] overflow-hidden vv-glass-elevated bg-[#121A2B] border border-[color:var(--vv-border)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vv-border)]">
            <p id="submit-progress-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">
              {isFullSubmit ? 'Submit Milestone for Verification' : 'Update Milestone Progress'}
            </p>
            <button
              onClick={onClose}
              aria-label="Close submit progress"
              className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] rounded-[10px]">
                <IconAlertTriangle s={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Milestone ref */}
            <div className="px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-0.5">{milestone.title}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                Target Tranche: ৳{Number(milestone.target_amount).toLocaleString('en-IN')}
                {milestone.target_date ? ` • Target Date: ${milestone.target_date}` : ''}
              </p>
            </div>

            {/* Progress slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[12px] text-[color:var(--vv-text-tertiary)]">Progress Percentage</label>
                <span className="text-[12px] font-mono font-semibold text-[#C67A4E]">{progress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#C67A4E] cursor-pointer mb-2"
              />
              <ProgressBar value={progress} status={isFullSubmit ? 'submitted' : 'active'} />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                {isFullSubmit ? 'Evidence Notes / Deliverables' : 'Progress Notes'} {isFullSubmit && <span className="text-[#F04438]">*</span>}
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isFullSubmit ? 'Describe the deliverables completed and provide evidence details for verification...' : 'Describe intermediate achievements and current status...'}
                className="w-full px-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Evidence URLs */}
            <div>
              <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                Evidence Links / Documentation URLs <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">(optional, comma-separated)</span>
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://drive.google.com/..., https://github.com/..."
                className="w-full h-9 px-3 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Processing...' : isFullSubmit ? 'Submit for Verification (100%)' : `Update Progress (${progress}%)`}
              </Button>
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Confirm Progress Modal ----------------------------------------------------

function ConfirmProgressModal({
  milestone,
  onClose,
  onConfirm,
  onOpenDispute,
}: {
  milestone: DealMilestoneData;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  onOpenDispute: () => void;
}) {
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setConfirming(true);
    try {
      await onConfirm(confirmNotes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm milestone.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-progress-title"
      >
        <div className="w-full max-w-md rounded-[16px] overflow-hidden vv-glass-elevated bg-[#121A2B] border border-[color:var(--vv-border)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vv-border)]">
            <p id="confirm-progress-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">
              Confirm Milestone & Release Tranche
            </p>
            <button
              onClick={onClose}
              aria-label="Close confirm progress"
              className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] rounded-[10px]">
                <IconAlertTriangle s={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-0.5">{milestone.title}</p>
              <p className="text-[11px] text-[#C67A4E] font-mono font-semibold">
                Simulated Tranche: ৳{Number(milestone.target_amount).toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] mb-1">Founder's Submitted Deliverables</p>
              <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed px-3.5 py-3 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)]">
                {milestone.evidence_notes || 'Milestone submitted for completion verification.'}
              </p>
            </div>

            {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
              <div>
                <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] mb-2">Evidence Documentation</p>
                <div className="space-y-1.5">
                  {milestone.evidence_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] hover:border-[#C67A4E]/40 transition-colors"
                    >
                      <svg width="13" height="13" fill="none" stroke="#C67A4E" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <p className="flex-1 text-[11.5px] text-[#C67A4E] underline truncate">{url}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                Confirmation Notes / Verification Reference <span className="text-[10.5px]">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="e.g. Verified deliverables against specifications. Tranche release approved."
                className="w-full px-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Confirming...' : 'Confirm & Release Tranche'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDispute();
                }}
                disabled={confirming}
                className="px-4 py-2 rounded-[8px] text-[12.5px] text-[#F59E0B] border border-[rgba(245,158,11,0.22)] hover:bg-[rgba(245,158,11,0.05)] transition-colors"
              >
                Request Revision
              </button>
              <Button variant="secondary" onClick={onClose} disabled={confirming}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Dispute Modal -------------------------------------------------------------

function DisputeModal({
  milestone,
  onClose,
  onDispute,
}: {
  milestone: DealMilestoneData;
  onClose: () => void;
  onDispute: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDispute() {
    if (!reason.trim()) {
      setError('A revision reason or dispute description is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onDispute(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dispute milestone.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-title"
      >
        <div className="w-full max-w-md rounded-[16px] overflow-hidden vv-glass-elevated bg-[#121A2B] border border-red-500/20">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vv-border)]">
            <p id="dispute-title" className="text-[14px] font-semibold text-red-400 font-display">
              Request Milestone Revision
            </p>
            <button
              onClick={onClose}
              aria-label="Close dispute modal"
              className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] rounded-[10px]">
                <IconAlertTriangle s={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
              <p className="text-[12px] font-semibold text-[color:var(--vv-text)] mb-0.5">{milestone.title}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                The milestone will return to Active status for the founder to address your feedback.
              </p>
            </div>

            <div>
              <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">
                Revision / Clarification Reason <span className="text-[#F04438]">*</span>
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain what deliverables need adjustment or what evidence is required before confirmation..."
                className="w-full px-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-red-500/30 text-[12.5px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] outline-none resize-none leading-relaxed focus:border-red-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDispute}
                disabled={!reason.trim() || submitting}
                className="flex-1 py-2 px-4 rounded-[8px] text-[12.5px] font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Return for Revision'}
              </button>
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Milestone Detail Drawer ---------------------------------------------------

function MilestoneDrawer({
  milestone,
  isFounder,
  isCounterparty,
  onClose,
  onSubmit,
  onConfirm,
  onDispute,
}: {
  milestone: DealMilestoneData;
  isFounder: boolean;
  isCounterparty: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  onConfirm?: () => void;
  onDispute?: () => void;
}) {
  const displayStatus = getMilestoneDisplayStatus(milestone);
  const cfg = STATUS_CONFIG[displayStatus];
  const activity = generateMilestoneActivity(milestone);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col overflow-hidden bg-[#121A2B] border-l border-[color:var(--vv-border)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-detail-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2a3e] flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-0.5">
              Milestone Detail
            </p>
            <p id="milestone-detail-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">
              {milestone.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close milestone detail"
            className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1 -mr-1"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {/* Status + progress */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <StatusPill status={displayStatus} />
              <span className="font-mono text-[13px] font-semibold tabular-nums" style={{ color: cfg.color }}>
                {milestone.progress_percentage}%
              </span>
            </div>
            <ProgressBar value={milestone.progress_percentage} status={displayStatus} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Target Date</p>
                <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">
                  {milestone.target_date
                    ? new Date(milestone.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Flexible'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Tranche Amount</p>
                <p className="text-[12.5px] font-mono font-semibold text-[#C67A4E]">
                  ৳{Number(milestone.target_amount).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Objective */}
          {milestone.description && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Objective</p>
              <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed">{milestone.description}</p>
            </div>
          )}

          {/* Submitted note */}
          {milestone.evidence_notes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Founder Deliverable Notes</p>
              <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
                {milestone.evidence_notes}
              </p>
            </div>
          )}

          {/* Evidence URLs */}
          {milestone.evidence_urls && milestone.evidence_urls.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Evidence Documentation</p>
              <div className="space-y-2">
                {milestone.evidence_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B] hover:border-[#C67A4E]/40 transition-colors"
                  >
                    <svg width="13" height="13" fill="none" stroke="#C67A4E" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p className="flex-1 text-[12px] font-medium text-[#C67A4E] underline truncate">{url}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Disputed notice */}
          {milestone.dispute_reason && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-[10px]"
              style={{ background: 'rgba(240,68,56,0.06)', border: '1px solid rgba(240,68,56,0.20)' }}
            >
              <svg width="14" height="14" fill="none" stroke="#F04438" strokeWidth="1.8" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <div>
                <p className="text-[12px] font-semibold text-[#F04438] mb-0.5">Revision Requested by Counterparty</p>
                <p className="text-[11.5px] text-red-300/90 leading-snug">{milestone.dispute_reason}</p>
              </div>
            </div>
          )}

          {/* Activity */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Activity History</p>
            <div className="space-y-0">
              {activity.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#1c2a3e] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#35446A] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[color:var(--vv-text-secondary)]">
                      <span className="font-medium text-[color:var(--vv-text)]">{entry.actor}</span> {entry.action}
                    </p>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono mt-0.5">{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-[#1c2a3e] flex-shrink-0 space-y-2">
          {isFounder && milestone.status === 'active' && onSubmit && (
            <Button className="w-full" onClick={onSubmit}>
              Update / Submit Progress
            </Button>
          )}
          {isCounterparty && milestone.status === 'submitted' && onConfirm && (
            <>
              <Button className="w-full" onClick={onConfirm}>
                Confirm Progress & Release Tranche
              </Button>
              {onDispute && (
                <button
                  type="button"
                  onClick={onDispute}
                  className="w-full py-2 rounded-[8px] text-[12.5px] text-[#F59E0B] border border-[rgba(245,158,11,0.22)] hover:bg-[rgba(245,158,11,0.05)] transition-colors"
                >
                  Request Revision
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// --- Timeline Item -------------------------------------------------------------

function TimelineItem({
  milestone,
  index,
  isLast,
  onClick,
}: {
  milestone: DealMilestoneData;
  index: number;
  isLast: boolean;
  onClick: () => void;
}) {
  const displayStatus = getMilestoneDisplayStatus(milestone);
  const cfg = STATUS_CONFIG[displayStatus];
  const isCompleted = displayStatus === 'completed';
  const isActive = displayStatus === 'active' || displayStatus === 'submitted';

  const formattedDate = milestone.target_date
    ? new Date(milestone.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Flexible';

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isCompleted
              ? 'bg-[#22C55E] border-[#22C55E]'
              : isActive
              ? 'border-[#C67A4E] bg-[rgba(198,122,78,0.10)]'
              : displayStatus === 'disputed'
              ? 'border-[#F04438] bg-[rgba(240,68,56,0.08)]'
              : 'border-[color:var(--vv-border-strong)] bg-transparent'
          }`}
        >
          {isCompleted ? (
            <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span
              className="text-[10px] font-bold"
              style={{
                color: isActive ? '#C67A4E' : displayStatus === 'disputed' ? '#F04438' : '#5E6D8F',
              }}
            >
              {milestone.sequence_order || index + 1}
            </span>
          )}
        </div>
        {!isLast && (
          <div
            className={`w-px flex-1 mt-1 ${isCompleted ? 'bg-[#22C55E]/30' : 'bg-[color:var(--vv-border-strong)]'}`}
            style={{ minHeight: '24px' }}
          />
        )}
      </div>

      {/* Card */}
      <button
        onClick={onClick}
        className={`flex-1 mb-4 text-left rounded-[12px] border transition-all group hover:border-[color:var(--vv-border-strong)] bg-[#121A2B] ${
          isActive ? 'border-[#C67A4E]/30' : 'border-[color:var(--vv-border)]'
        }`}
      >
        <div className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p
                className={`text-[13px] font-semibold leading-snug ${
                  displayStatus === 'upcoming' ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[color:var(--vv-text)]'
                }`}
              >
                {milestone.title}
              </p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{formattedDate}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <StatusPill status={displayStatus} />
              <span className="text-[11px] font-mono font-semibold tabular-nums" style={{ color: cfg.color }}>
                ৳{Number(milestone.target_amount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {milestone.description && (
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2 leading-snug line-clamp-2">
              {milestone.description}
            </p>
          )}

          {displayStatus !== 'upcoming' && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <ProgressBar value={milestone.progress_percentage} status={displayStatus} />
              </div>
              <span className="text-[10.5px] font-mono text-[color:var(--vv-text-tertiary)] flex-shrink-0">
                {milestone.progress_percentage}%
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// --- Main Page -----------------------------------------------------------------

export default function MilestoneTracking() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const dealId = routeId || searchParams.get('deal_id') || searchParams.get('deal') || searchParams.get('id');
  const returnTo = searchParams.get('return') ?? (dealId ? `/app/deals/${dealId}` : '/app/connections');

  const { role } = useRole();
  const { user } = useAuth();
  const roleParam = role === 'investor' || role === 'professional' ? role : undefined;

  const [milestones, setMilestones] = useState<DealMilestoneData[]>([]);
  const [fundingSummary, setFundingSummary] = useState<FundingSummaryData | null>(null);
  const [dealInfo, setDealInfo] = useState<{ id: number; stage: string; stage_label: string; founder_user_id: number; counterparty_user_id: number; business_id: number } | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isCompletingDeal, setIsCompletingDeal] = useState(false);
  const [dealCompletionError, setDealCompletionError] = useState<string | null>(null);

  const isFounder = dealInfo ? user?.id === dealInfo.founder_user_id || role === 'founder' : role === 'founder';
  const isCounterparty = dealInfo ? user?.id === dealInfo.counterparty_user_id || role === 'investor' || role === 'professional' : role === 'investor' || role === 'professional';

  const fetchMilestonesData = useCallback(async () => {
    if (!dealId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      try {
        const deal = await api.deals.get(dealId, roleParam);
        setDealInfo(deal);
        if (deal.business_id) {
          try {
            const bus = await api.get<{ id: number; name: string }>(`/api/businesses/${deal.business_id}`);
            setBusinessName(bus.name);
          } catch {
            // Non-blocking business name fetch
          }
        }
      } catch {
        // Continue to milestone load
      }

      const res = await api.deals.milestones.list(dealId, roleParam);
      setMilestones(res.milestones || []);
      setFundingSummary(res.summary || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load milestone data for this deal.');
    } finally {
      setLoading(false);
    }
  }, [dealId, roleParam]);

  useEffect(() => {
    fetchMilestonesData();
  }, [fetchMilestonesData]);

  const selected = milestones.find((m) => m.id === selectedId) ?? null;
  const completedCount = milestones.filter((m) => m.status === 'funded').length;
  const active = milestones.find((m) => m.status === 'active' || m.status === 'submitted');
  const nextUpcoming = milestones.find((m) => m.status === 'pending');
  const overallProgress = fundingSummary ? fundingSummary.funding_progress_percentage : Math.round(milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0);

  const isDealCompletionEligible =
    dealInfo?.stage === 'milestone_funding_active' &&
    milestones.length > 0 &&
    milestones.every((m) => m.status === 'funded') &&
    (fundingSummary
      ? fundingSummary.total_committed_bdt === 0 ||
        fundingSummary.total_released_bdt === fundingSummary.total_committed_bdt
      : true);

  async function handleCompleteDeal() {
    if (!dealId || isCompletingDeal) return;
    setIsCompletingDeal(true);
    setDealCompletionError(null);
    try {
      await api.deals.complete(dealId, roleParam);
      setSuccessBanner('Deal completed successfully! All milestones and simulated tranche funding finalized.');
      await fetchMilestonesData();
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      setDealCompletionError(err?.message || 'Failed to complete deal.');
    } finally {
      setIsCompletingDeal(false);
    }
  }

  async function handleProgressSubmit(progress: number, note: string, evidenceUrls?: string[]) {
    if (!dealId || !selectedId) return;
    if (progress === 100) {
      await api.deals.milestones.submit(
        dealId,
        selectedId,
        {
          progress_percentage: 100,
          evidence_notes: note,
          evidence_urls: evidenceUrls,
        },
        roleParam
      );
      setSuccessBanner('Milestone submitted for verification. Counterparty has been notified.');
    } else {
      await api.deals.milestones.updateProgress(
        dealId,
        selectedId,
        {
          progress_percentage: progress,
          notes: note,
          evidence_urls: evidenceUrls,
        },
        roleParam
      );
      setSuccessBanner(`Milestone progress updated to ${progress}%.`);
    }
    await fetchMilestonesData();
    setTimeout(() => setSuccessBanner(null), 4000);
  }

  async function handleConfirmProgress(notes?: string) {
    if (!dealId || !selectedId) return;
    await api.deals.milestones.confirm(
      dealId,
      selectedId,
      {
        confirmation_notes: notes,
      },
      roleParam
    );
    setShowConfirm(false);
    setSelectedId(null);
    setSuccessBanner('Milestone confirmed. Tranche funding release simulated successfully.');
    await fetchMilestonesData();
    setTimeout(() => setSuccessBanner(null), 4000);
  }

  async function handleDisputeProgress(reason: string) {
    if (!dealId || !selectedId) return;
    await api.deals.milestones.dispute(
      dealId,
      selectedId,
      {
        dispute_reason: reason,
      },
      roleParam
    );
    setShowDispute(false);
    setSelectedId(null);
    setSuccessBanner('Revision requested. The milestone has been returned to the founder.');
    await fetchMilestonesData();
    setTimeout(() => setSuccessBanner(null), 4000);
  }

  if (role === 'professional' && !dealId) {
    return (
      <div className="p-8 max-w-[720px] mx-auto text-center">
        <p className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-2">Milestone Tracking</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">
          Select an active deal from Connections to view milestone schedules and funding progress.
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/app/professional/connections')}>
          View Connections
        </Button>
      </div>
    );
  }

  if (!dealId) {
    return (
      <div className="p-8 max-w-[720px] mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E] mx-auto">
          <IconLock s={22} />
        </div>
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-1">
            No Deal Selected
          </h1>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto">
            Milestone tracking is deal-scoped. Please open a Deal Room to view and track authoritative milestone schedules.
          </p>
        </div>
        <Button onClick={() => navigate('/app/connections')}>Go to Connections</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="w-8 h-8 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mb-4" />
        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">Loading Milestone Tracking...</p>
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Retrieving authoritative milestone and funding state</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[720px] mx-auto p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
          <IconAlertTriangle s={24} />
        </div>
        <p className="text-[15px] font-semibold text-[color:var(--vv-text)]">Unable to Load Milestones</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto">{error}</p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate(returnTo)}>Back</Button>
          <Button onClick={fetchMilestonesData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
      {/* Modals */}
      {showSubmit && selected && (
        <SubmitProgressModal
          milestone={selected}
          onClose={() => setShowSubmit(false)}
          onSubmit={handleProgressSubmit}
        />
      )}
      {showConfirm && selected && (
        <ConfirmProgressModal
          milestone={selected}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmProgress}
          onOpenDispute={() => setShowDispute(true)}
        />
      )}
      {showDispute && selected && (
        <DisputeModal
          milestone={selected}
          onClose={() => setShowDispute(false)}
          onDispute={handleDisputeProgress}
        />
      )}

      {/* Detail drawer */}
      {selected && !showSubmit && !showConfirm && !showDispute && (
        <MilestoneDrawer
          milestone={selected}
          isFounder={isFounder}
          isCounterparty={isCounterparty}
          onClose={() => setSelectedId(null)}
          onSubmit={() => setShowSubmit(true)}
          onConfirm={() => setShowConfirm(true)}
          onDispute={() => setShowDispute(true)}
        />
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(returnTo)}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <span className="text-[color:var(--vv-text-tertiary)]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Milestones</span>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}
        >
          <IconCheck s={14} className="text-[#22C55E] shrink-0" />
          <p className="flex-1 text-[12.5px] text-[#22C55E]">{successBanner}</p>
          <button onClick={() => setSuccessBanner(null)} className="text-[#22C55E]/60 hover:text-[#22C55E]">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            {businessName ? `${businessName} — Milestones` : `Deal #${dealId} — Milestones`}
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Funding milestone schedule and simulated tranche releases
          </p>
        </div>

        <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
          Viewing as <span className="font-medium text-[#C67A4E] capitalize">{isFounder ? 'Founder' : 'Counterparty'}</span>
        </span>
      </div>

      {/* Deal Completed Status */}
      {dealInfo?.stage === 'completed' && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-6"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)' }}
        >
          <IconCheck s={15} className="text-[#22C55E] shrink-0" />
          <div>
            <p className="text-[12.5px] font-semibold text-[#22C55E]">Deal Stage: Completed</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
              All milestones have been verified and full simulated tranche funding has completed.
            </p>
          </div>
        </div>
      )}

      {/* Deal Completion CTA */}
      {isDealCompletionEligible && (
        <div className="bg-[#121A2B] border border-[#22C55E]/40 rounded-[14px] p-5 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] flex-shrink-0 mt-0.5">
                <IconCheck s={18} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">
                  All Milestones Funded — Ready to Complete Deal
                </p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                  100% of milestones are funded and all tranches have been released. Finalize the deal to transition to completed.
                </p>
              </div>
            </div>
            {role === 'admin' ? (
              <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                Admin oversight: completion disabled
              </span>
            ) : (isFounder || isCounterparty) ? (
              <Button
                disabled={isCompletingDeal}
                onClick={handleCompleteDeal}
                className="flex-shrink-0"
              >
                {isCompletingDeal ? 'Completing Deal...' : 'Complete Deal'}
              </Button>
            ) : null}
          </div>
          {dealCompletionError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[11.5px] rounded-md">
              <IconAlertTriangle s={14} className="shrink-0" />
              <span>{dealCompletionError}</span>
            </div>
          )}
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Overall Progress', value: `${overallProgress}%`, color: '#C67A4E' },
          { label: 'Completed', value: `${completedCount} of ${milestones.length}`, color: '#22C55E' },
          { label: 'Active Milestone', value: active?.title ?? (completedCount === milestones.length && milestones.length > 0 ? 'All Funded' : 'None'), color: '#C67A4E', small: true },
          { label: 'Next Upcoming', value: nextUpcoming?.title ?? (completedCount === milestones.length && milestones.length > 0 ? 'All Completed' : 'None'), color: '#5E6D8F', small: true },
        ].map((tile, i) => (
          <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-4 py-3.5">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-1.5">{tile.label}</p>
            <p
              className={`font-display font-semibold leading-tight ${tile.small ? 'text-[13px] truncate' : 'text-[22px] tabular-nums'}`}
              style={{ color: tile.color }}
            >
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-5 py-4 mb-6">
        <div className="flex justify-between text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">
          <span>Milestone Funding Progress</span>
          <span className="font-mono font-semibold text-[#C67A4E]">{overallProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(0, overallProgress))}%`,
              background: 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[color:var(--vv-text-tertiary)] mt-1.5 font-mono">
          <span>
            Released: ৳{fundingSummary ? fundingSummary.total_released_bdt.toLocaleString('en-IN') : '0'}
          </span>
          <span>
            Total Committed: ৳{fundingSummary ? fundingSummary.total_committed_bdt.toLocaleString('en-IN') : '0'}
          </span>
        </div>
      </div>

      {/* Active milestone CTA (role-aware) */}
      {active && (
        <div className="bg-[#121A2B] border border-[#C67A4E]/30 rounded-[14px] p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold">
                  Current Milestone
                </p>
                <StatusPill status={getMilestoneDisplayStatus(active)} />
              </div>
              <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">{active.title}</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                Target Tranche: ৳{Number(active.target_amount).toLocaleString('en-IN')}
                {active.target_date ? ` • Due ${active.target_date}` : ''}
              </p>
              {active.evidence_notes && (
                <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] mt-2 leading-snug line-clamp-2">
                  {active.evidence_notes}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {isFounder && active.status === 'active' && (
                <Button onClick={() => { setSelectedId(active.id); setShowSubmit(true); }}>
                  Submit Progress
                </Button>
              )}
              {isCounterparty && active.status === 'submitted' && (
                <Button onClick={() => { setSelectedId(active.id); setShowConfirm(true); }}>
                  Confirm Progress
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedId(active.id)}>
                View Detail
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1">
              <span>Progress</span>
              <span className="font-mono text-[#C67A4E]">{active.progress_percentage}%</span>
            </div>
            <ProgressBar value={active.progress_percentage} status={getMilestoneDisplayStatus(active)} />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] px-5 py-5">
        <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-5">
          Milestone Timeline
        </p>
        {milestones.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-[13px] font-medium text-[color:var(--vv-text)]">No Milestones Defined</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
              Milestones will appear here once defined for this deal.
            </p>
          </div>
        ) : (
          milestones.map((m, i) => (
            <TimelineItem
              key={m.id}
              milestone={m}
              index={i}
              isLast={i === milestones.length - 1}
              onClick={() => setSelectedId(m.id)}
            />
          ))
        )}
      </div>

      {/* Next milestone callout */}
      {nextUpcoming && (
        <div className="mt-4 flex items-center gap-4 px-5 py-4 rounded-[12px] border border-[color:var(--vv-border)] bg-[#121A2B]">
          <div className="w-8 h-8 rounded-full border border-[color:var(--vv-border-strong)] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-0.5">
              Next Upcoming
            </p>
            <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{nextUpcoming.title}</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
              Target Tranche: ৳{Number(nextUpcoming.target_amount).toLocaleString('en-IN')}
              {nextUpcoming.target_date ? ` • Due ${nextUpcoming.target_date}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Back to deal room */}
      <div className="mt-6 pt-5 border-t border-[#1c2a3e] flex justify-start">
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          ← Back to Deal Room
        </Button>
      </div>
    </div>
  );
}