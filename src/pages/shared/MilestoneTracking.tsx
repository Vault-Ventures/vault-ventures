import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useRole } from '../../components/layout/AppShell';

// --- Types --------------------------------------------------------------------

type MilestoneStatus = 'completed' | 'active' | 'submitted' | 'awaiting' | 'disputed' | 'upcoming';
type ViewRole = 'founder' | 'investor';

interface Evidence {
  name: string;
  type: string;
  submittedAt: string;
  submittedBy: string;
}

interface ActivityEntry {
  actor: string;
  action: string;
  time: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  target: string;
  targetAmount?: string;
  progress: number; // 0-100
  status: MilestoneStatus;
  due: string;
  submittedNote?: string;
  evidence?: Evidence[];
  activity: ActivityEntry[];
}

// --- Data ---------------------------------------------------------------------

const MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    name: 'Product MVP Launch',
    description: 'Ship the AI scheduling MVP with core EMR integration and deploy to the first 3 pilot clinics.',
    target: '3 pilot clinics live on platform',
    targetAmount: 'BDT 1,50,000',
    progress: 100,
    status: 'completed',
    due: 'Oct 2024',
    evidence: [
      { name: 'Pilot Deployment Report', type: 'PDF', submittedAt: 'Oct 12, 2024', submittedBy: 'Rifat Ahsan' },
      { name: 'Clinic Onboarding Screenshots', type: 'ZIP', submittedAt: 'Oct 12, 2024', submittedBy: 'Rifat Ahsan' },
    ],
    activity: [
      { actor: 'Meridian Capital', action: 'Confirmed milestone completed', time: 'Oct 18, 2024' },
      { actor: 'Rifat Ahsan', action: 'Submitted progress with evidence', time: 'Oct 12, 2024' },
      { actor: 'System', action: 'Milestone activated', time: 'Aug 01, 2024' },
    ],
  },
  {
    id: 'ms-2',
    name: 'First 100 Paying Customers',
    description: 'Convert pilot users and new sign-ups to paid SaaS subscriptions across at least 5 distinct clinic operators.',
    target: '100 paying facility subscriptions',
    targetAmount: 'BDT 2,00,000',
    progress: 35,
    status: 'active',
    due: 'Q1 2025',
    submittedNote: 'Currently at 35 paying subscribers. On track for Q1 close. Pipeline includes 4 hospital network prospects in Dhaka.',
    evidence: [],
    activity: [
      { actor: 'Rifat Ahsan', action: 'Updated progress to 35%', time: 'Jan 14, 2025' },
      { actor: 'System', action: 'Milestone activated after MS-1 completion', time: 'Oct 18, 2024' },
    ],
  },
  {
    id: 'ms-3',
    name: 'Reach BDT 10L Monthly Revenue',
    description: 'Achieve BDT 10,00,000 in verified monthly recurring revenue across the active customer base.',
    target: 'BDT 10,00,000 MRR',
    targetAmount: 'BDT 2,50,000',
    progress: 0,
    status: 'upcoming',
    due: 'Q3 2025',
    evidence: [],
    activity: [
      { actor: 'System', action: 'Milestone added', time: 'Aug 01, 2024' },
    ],
  },
  {
    id: 'ms-4',
    name: 'Launch in 3 New Cities',
    description: 'Expand platform operations to Chittagong, Sylhet, and Khulna with at least 10 active facilities in each market.',
    target: '30+ facilities across 3 cities',
    targetAmount: '-',
    progress: 0,
    status: 'upcoming',
    due: 'Q4 2025',
    evidence: [],
    activity: [
      { actor: 'System', action: 'Milestone added', time: 'Aug 01, 2024' },
    ],
  },
  {
    id: 'ms-5',
    name: 'Series A Close',
    description: 'Complete Series A funding round with lead investor and at least one co-investor, with signed term sheets.',
    target: 'Full Series A round closed',
    targetAmount: 'BDT 1,00,00,000',
    progress: 0,
    status: 'upcoming',
    due: '2026',
    evidence: [],
    activity: [
      { actor: 'System', action: 'Milestone added', time: 'Aug 01, 2024' },
    ],
  },
];

// --- Helpers ------------------------------------------------------------------

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; bg: string; border: string }> = {
  completed:  { label: 'Completed',           color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.22)' },
  active:     { label: 'Active',              color: '#C67A4E', bg: 'rgba(198,122,78,0.07)',  border: 'rgba(198,122,78,0.20)' },
  submitted:  { label: 'Submitted',           color: '#C67A4E', bg: 'rgba(198,122,78,0.07)',   border: 'rgba(198,122,78,0.20)' },
  awaiting:   { label: 'Awaiting Confirmation', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  disputed:   { label: 'Disputed',            color: '#F04438', bg: 'rgba(240,68,56,0.07)',   border: 'rgba(240,68,56,0.20)' },
  upcoming:   { label: 'Upcoming',            color: '#5E6D8F', bg: 'rgba(94,109,143,0.06)',  border: 'rgba(94,109,143,0.18)' },
};

function StatusPill({ status }: { status: MilestoneStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

function ProgressBar({ value, status }: { value: number; status: MilestoneStatus }) {
  const color = status === 'completed' ? '#22C55E' : status === 'disputed' ? '#F04438' : '#C67A4E';
  return (
    <div className="h-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
    </div>
  );
}

// --- Submit Progress Modal -----------------------------------------------------

function SubmitProgressModal({ milestone, onClose, onSubmit }: {
  milestone: Milestone;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [progress, setProgress] = useState(milestone.progress);
  const [note, setNote] = useState(milestone.submittedNote ?? '');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    if (!note.trim()) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSubmit(note); }, 900);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="submit-progress-title">
        <div className="w-full max-w-md rounded-[16px] overflow-hidden vv-glass-elevated">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vv-border)]">
            <p id="submit-progress-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Submit Progress</p>
            <button onClick={onClose} aria-label="Close submit progress" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            {/* Milestone ref */}
            <div className="px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
              <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] mb-0.5">{milestone.name}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Target: {milestone.target}</p>
            </div>

            {/* Progress slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[12px] text-[color:var(--vv-text-tertiary)]">Current Progress</label>
                <span className="text-[12px] font-mono font-semibold text-[#C67A4E]">{progress}%</span>
              </div>
              <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))}
                className="w-full accent-[#C67A4E] cursor-pointer" />
              <ProgressBar value={progress} status="active" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">Progress Update <span className="text-[#F04438]">*</span></label>
              <textarea
                rows={4}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Describe what has been achieved, any blockers, and your confidence in hitting the target..."
                className="w-full px-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Evidence note */}
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
              Evidence files can be attached via the document section after submission.
            </p>

            <div className="flex gap-3 pt-1">
              <Button className="flex-1" onClick={handleSubmit} disabled={!note.trim() || submitting}>
                {submitting ? 'Submitting-' : 'Submit Progress'}
              </Button>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Confirm Progress Modal ----------------------------------------------------

function ConfirmProgressModal({ milestone, onClose, onConfirm, onDispute }: {
  milestone: Milestone;
  onClose: () => void;
  onConfirm: () => void;
  onDispute: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    setConfirming(true);
    setTimeout(() => { setConfirming(false); onConfirm(); }, 800);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-progress-title">
        <div className="w-full max-w-md rounded-[16px] overflow-hidden vv-glass-elevated">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vv-border)]">
            <p id="confirm-progress-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Confirm Progress</p>
            <button onClick={onClose} aria-label="Close confirm progress" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
              <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] mb-0.5">{milestone.name}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Target: {milestone.target}</p>
            </div>

            <div>
              <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] mb-1">Founder's Update</p>
              <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed px-3.5 py-3 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)]">
                {milestone.submittedNote ?? 'No notes submitted.'}
              </p>
            </div>

            {milestone.evidence && milestone.evidence.length > 0 && (
              <div>
                <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] mb-2">Evidence</p>
                <div className="space-y-1.5">
                  {milestone.evidence.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)]">
                      <svg width="13" height="13" fill="none" stroke="#C67A4E" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[color:var(--vv-text)] truncate">{ev.name}</p>
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{ev.type} - {ev.submittedAt}</p>
                      </div>
                      <button className="text-[11px] text-[#C67A4E] hover:underline flex-shrink-0">View</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button className="flex-1" onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Confirming-' : 'Confirm Progress'}
              </Button>
              <button onClick={onDispute}
                className="px-4 py-2 rounded-[8px] text-[12.5px] text-[#F59E0B] border border-[rgba(245,158,11,0.22)] hover:bg-[rgba(245,158,11,0.05)] transition-colors">
                Dispute
              </button>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Milestone Detail Drawer ---------------------------------------------------

function MilestoneDrawer({ milestone, viewRole, onClose, onSubmit, onConfirm, onDispute }: {
  milestone: Milestone;
  viewRole: ViewRole;
  onClose: () => void;
  onSubmit?: () => void;
  onConfirm?: () => void;
  onDispute?: () => void;
}) {
  const cfg = STATUS_CONFIG[milestone.status];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="milestone-detail-title"
        style={{
          background: 'rgba(6,10,16,0.97)',
          backdropFilter: 'blur(32px) saturate(160%)',
          borderLeft: '1px solid rgba(180,200,220,0.09)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.60)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2a3e] flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-0.5">Milestone Detail</p>
            <p id="milestone-detail-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{milestone.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close milestone detail" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1 -mr-1">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {/* Status + progress */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <StatusPill status={milestone.status} />
              <span className="font-mono text-[13px] font-semibold tabular-nums" style={{ color: cfg.color }}>
                {milestone.progress}%
              </span>
            </div>
            <ProgressBar value={milestone.progress} status={milestone.status} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Due</p>
                <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{milestone.due}</p>
              </div>
              {milestone.targetAmount && milestone.targetAmount !== '-' && (
                <div>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-0.5">Tranche</p>
                  <p className="text-[12.5px] font-mono font-semibold text-[#C67A4E]">{milestone.targetAmount}</p>
                </div>
              )}
            </div>
          </div>

          {/* Objective */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Objective</p>
            <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed">{milestone.description}</p>
          </div>

          {/* Target */}
          <div className="px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-1">Target</p>
            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{milestone.target}</p>
          </div>

          {/* Submitted note */}
          {milestone.submittedNote && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Founder Update</p>
              <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
                {milestone.submittedNote}
              </p>
            </div>
          )}

          {/* Evidence */}
          {milestone.evidence && milestone.evidence.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Evidence</p>
              <div className="space-y-2">
                {milestone.evidence.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B]">
                    <svg width="13" height="13" fill="none" stroke="#C67A4E" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[color:var(--vv-text)] truncate">{ev.name}</p>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{ev.type} - {ev.submittedAt} - {ev.submittedBy}</p>
                    </div>
                    <button className="text-[11px] text-[#C67A4E] hover:underline flex-shrink-0">View</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disputed notice */}
          {milestone.status === 'disputed' && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-[10px]"
              style={{ background: 'rgba(240,68,56,0.06)', border: '1px solid rgba(240,68,56,0.20)' }}>
              <svg width="14" height="14" fill="none" stroke="#F04438" strokeWidth="1.8" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
              <p className="text-[12px] text-[#F04438] leading-snug">
                Progress requires clarification before this milestone can be completed. Both parties should review and respond.
              </p>
            </div>
          )}

          {/* Activity */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-2">Activity</p>
            <div className="space-y-0">
              {milestone.activity.map((entry, i) => (
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
          {viewRole === 'founder' && milestone.status === 'active' && onSubmit && (
            <Button className="w-full" onClick={onSubmit}>Submit Progress</Button>
          )}
          {viewRole === 'investor' && (milestone.status === 'submitted' || milestone.status === 'awaiting') && onConfirm && (
            <>
              <Button className="w-full" onClick={onConfirm}>Confirm Progress</Button>
              {onDispute && (
                <button onClick={onDispute}
                  className="w-full py-2 rounded-[8px] text-[12.5px] text-[#F59E0B] border border-[rgba(245,158,11,0.22)] hover:bg-[rgba(245,158,11,0.05)] transition-colors">
                  Dispute
                </button>
              )}
            </>
          )}
          <button onClick={onClose}
            className="w-full py-2 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// --- Timeline Item -------------------------------------------------------------

function TimelineItem({ milestone, index, isLast, onClick }: {
  milestone: Milestone;
  index: number;
  isLast: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[milestone.status];
  const isCompleted = milestone.status === 'completed';
  const isActive = milestone.status === 'active' || milestone.status === 'submitted' || milestone.status === 'awaiting';

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          isCompleted ? 'bg-[#22C55E] border-[#22C55E]'
          : isActive   ? 'border-[#C67A4E] bg-[rgba(198,122,78,0.10)]'
          : milestone.status === 'disputed' ? 'border-[#F04438] bg-[rgba(240,68,56,0.08)]'
          : 'border-[color:var(--vv-border-strong)] bg-transparent'
        }`}>
          {isCompleted ? (
            <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <span className="text-[10px] font-bold" style={{ color: isActive ? '#C67A4E' : milestone.status === 'disputed' ? '#F04438' : '#5E6D8F' }}>
              {index + 1}
            </span>
          )}
        </div>
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${isCompleted ? 'bg-[#22C55E]/30' : 'bg-[#35446A]/40'}`}
            style={{ minHeight: '24px' }} />
        )}
      </div>

      {/* Card */}
      <button
        onClick={onClick}
        className="flex-1 mb-4 text-left rounded-[12px] border transition-all group hover:border-[color:var(--vv-border-strong)]"
        style={{
          background: isActive ? 'rgba(198,122,78,0.03)' : 'rgba(14,20,28,0.6)',
          border: isActive ? '1px solid rgba(198,122,78,0.14)' : '1px solid rgba(36,48,74,0.8)',
        }}>
        <div className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-semibold leading-snug ${
                milestone.status === 'upcoming' ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[color:var(--vv-text)]'
              }`}>{milestone.name}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{milestone.due}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <StatusPill status={milestone.status} />
              {milestone.targetAmount && milestone.targetAmount !== '-' && (
                <span className="text-[10.5px] font-mono font-semibold tabular-nums" style={{ color: cfg.color }}>
                  {milestone.targetAmount}
                </span>
              )}
            </div>
          </div>

          {milestone.status !== 'upcoming' && (
            <>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-2 leading-snug line-clamp-2">{milestone.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ProgressBar value={milestone.progress} status={milestone.status} />
                </div>
                <span className="text-[10.5px] font-mono text-[color:var(--vv-text-tertiary)] flex-shrink-0">{milestone.progress}%</span>
              </div>
            </>
          )}

          {milestone.status === 'upcoming' && (
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Target: {milestone.target}</p>
          )}
        </div>
      </button>
    </div>
  );
}

// --- Main Page -----------------------------------------------------------------

export default function MilestoneTracking() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') ?? '/app/founder/dashboard';
  const viewRole: ViewRole = role === 'investor' ? 'investor' : 'founder';
  const [milestones, setMilestones] = useState<Milestone[]>(MILESTONES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const selected = milestones.find(m => m.id === selectedId) ?? null;
  const completed = milestones.filter(m => m.status === 'completed').length;
  const active = milestones.find(m => m.status === 'active' || m.status === 'submitted' || m.status === 'awaiting');
  const overallProgress = Math.round((completed / milestones.length) * 100);
  const nextUpcoming = milestones.find(m => m.status === 'upcoming');

  if (role === 'professional') {
    return (
      <div className="p-6 max-w-[720px] mx-auto text-center">
        <p className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-2">Milestones are unavailable here</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5">Milestone tracking is limited to Founder and Investor deal workspaces.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/app/professional/dashboard')}>Back to workspace</Button>
      </div>
    );
  }

  function handleSubmitProgress(note: string) {
    setMilestones(ms => ms.map(m =>
      m.id === selectedId ? { ...m, status: 'awaiting' as MilestoneStatus, submittedNote: note, progress: Math.max(m.progress, 35),
        activity: [{ actor: 'You', action: 'Submitted progress update', time: 'Just now' }, ...m.activity] } : m
    ));
    setShowSubmit(false);
    setSuccessBanner('Progress submitted - awaiting investor confirmation.');
    setTimeout(() => setSuccessBanner(null), 4000);
  }

  function handleConfirmProgress() {
    setMilestones(ms => ms.map((m, i) => {
      if (m.id === selectedId) {
        return { ...m, status: 'completed' as MilestoneStatus, progress: 100,
          activity: [{ actor: 'You', action: 'Confirmed milestone completed', time: 'Just now' }, ...m.activity] };
      }
      // Activate the next upcoming milestone
      if (m.status === 'upcoming' && ms[i - 1]?.id === selectedId) {
        return { ...m, status: 'active' as MilestoneStatus };
      }
      return m;
    }));
    setShowConfirm(false);
    setSelectedId(null);
    setSuccessBanner('Milestone confirmed - next milestone is now active.');
    setTimeout(() => setSuccessBanner(null), 4000);
  }

  function handleDispute() {
    setMilestones(ms => ms.map(m =>
      m.id === selectedId ? { ...m, status: 'disputed' as MilestoneStatus,
        activity: [{ actor: 'You', action: 'Disputed progress - clarification requested', time: 'Just now' }, ...m.activity] } : m
    ));
    setShowConfirm(false);
    setSuccessBanner('Dispute raised - the founder has been notified.');
    setTimeout(() => setSuccessBanner(null), 4000);
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">

      {/* Modals */}
      {showSubmit && selected && (
        <SubmitProgressModal
          milestone={selected}
          onClose={() => setShowSubmit(false)}
          onSubmit={handleSubmitProgress}
        />
      )}
      {showConfirm && selected && (
        <ConfirmProgressModal
          milestone={selected}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmProgress}
          onDispute={handleDispute}
        />
      )}

      {/* Detail drawer */}
      {selected && !showSubmit && !showConfirm && (
        <MilestoneDrawer
          milestone={selected}
          viewRole={viewRole}
          onClose={() => setSelectedId(null)}
          onSubmit={() => setShowSubmit(true)}
          onConfirm={() => setShowConfirm(true)}
          onDispute={handleDispute}
        />
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(returnTo)}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Milestones</span>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="flex-1 text-[12.5px] text-[#22C55E]">{successBanner}</p>
          <button onClick={() => setSuccessBanner(null)} className="text-[#22C55E]/60 hover:text-[#22C55E]">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Nova Health - Milestones
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">Funding milestone schedule and progress tracking</p>
        </div>

        <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Viewing as <span className="font-medium text-[#C67A4E] capitalize">{viewRole}</span></span>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Overall Progress', value: `${overallProgress}%`, color: '#C67A4E' },
          { label: 'Completed', value: `${completed} / ${milestones.length}`, color: '#22C55E' },
          { label: 'Active Milestone', value: active?.name ?? '-', color: '#C67A4E', small: true },
          { label: 'Next Upcoming', value: nextUpcoming?.name ?? 'All done', color: '#5E6D8F', small: true },
        ].map((tile, i) => (
          <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-4 py-3.5">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-1.5">{tile.label}</p>
            <p className={`font-display font-semibold leading-tight ${tile.small ? 'text-[13px]' : 'text-[22px] tabular-nums'}`}
              style={{ color: tile.color }}>
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] px-5 py-4 mb-6">
        <div className="flex justify-between text-[11px] text-[color:var(--vv-text-tertiary)] mb-2">
          <span>Milestone Progress</span>
          <span className="font-mono font-semibold text-[#C67A4E]">{overallProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overallProgress}%`, background: 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)' }} />
        </div>
        <div className="flex justify-between text-[10px] text-[#35446A] mt-1.5">
          <span>Start</span>
          <span>Series A Close</span>
        </div>
      </div>

      {/* Active milestone CTA (role-aware) */}
      {active && (
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5 mb-6"
          style={{ borderColor: 'rgba(198,122,78,0.18)', background: 'rgba(198,122,78,0.025)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold">Current Milestone</p>
                <StatusPill status={active.status} />
              </div>
              <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">{active.name}</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Target: {active.target} - Due {active.due}</p>
              {active.submittedNote && (
                <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] mt-2 leading-snug line-clamp-2">{active.submittedNote}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {viewRole === 'founder' && active.status === 'active' && (
                <Button onClick={() => { setSelectedId(active.id); setShowSubmit(true); }}>
                  Submit Progress
                </Button>
              )}
              {viewRole === 'investor' && (active.status === 'submitted' || active.status === 'awaiting') && (
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
              <span className="font-mono text-[#C67A4E]">{active.progress}%</span>
            </div>
            <ProgressBar value={active.progress} status={active.status} />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] px-5 py-5">
        <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-5">Milestone Timeline</p>
        {milestones.map((m, i) => (
          <TimelineItem
            key={m.id}
            milestone={m}
            index={i}
            isLast={i === milestones.length - 1}
            onClick={() => setSelectedId(m.id)}
          />
        ))}
      </div>

      {/* Next milestone callout */}
      {nextUpcoming && (
        <div className="mt-4 flex items-center gap-4 px-5 py-4 rounded-[12px] border border-[color:var(--vv-border)] bg-[#121A2B]">
          <div className="w-8 h-8 rounded-full border border-[color:var(--vv-border-strong)] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-0.5">Next Upcoming</p>
            <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{nextUpcoming.name}</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Target: {nextUpcoming.target} - Due {nextUpcoming.due}</p>
          </div>
        </div>
      )}

      {/* Back to deal room */}
      <div className="mt-6 pt-5 border-t border-[#1c2a3e] flex justify-start">
        <Button variant="secondary" onClick={() => navigate('/app/deal-room')}>
          ? Back to Deal Room
        </Button>
      </div>
    </div>
  );
}