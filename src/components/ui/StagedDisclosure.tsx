import React, { useState } from 'react';
import { Button } from './Button';

// --- Stage definitions --------------------------------------------------------

export interface DisclosureStage {
  number: 1 | 2 | 3 | 4;
  label: string;
  description: string;
  unlockRequirement: string;
  unlockAction?: string;
}

export const DISCLOSURE_STAGES: DisclosureStage[] = [
  {
    number: 1,
    label: 'Teaser',
    description: 'High-level overview available to all verified members.',
    unlockRequirement: 'Available to all verified members',
    unlockAction: undefined,
  },
  {
    number: 2,
    label: 'Extended Information',
    description: 'Additional business details shared after expressing interest.',
    unlockRequirement: 'Express interest to unlock extended information',
    unlockAction: 'Express Interest',
  },
  {
    number: 3,
    label: 'NDA Protected',
    description: 'Confidential financials and deal data - mutual NDA required.',
    unlockRequirement: 'Mutual NDA acceptance required from both parties',
    unlockAction: 'Start NDA Process',
  },
  {
    number: 4,
    label: 'Full Proposal',
    description: 'Complete deal documentation after NDA and founder confirmation.',
    unlockRequirement: 'NDA must be signed and founder confirmation required',
    unlockAction: undefined,
  },
];

// --- Disclosure Progress ------------------------------------------------------

interface DisclosureProgressProps {
  currentStage: number;
  onUnlock?: (stage: number) => void;
  compact?: boolean;
}

export function DisclosureProgress({ currentStage, onUnlock, compact = false }: DisclosureProgressProps) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {DISCLOSURE_STAGES.map((s) => {
        const unlocked = s.number <= currentStage;
        const isNext = s.number === currentStage + 1;
        const isNDA = s.number === 3;
        const isProposal = s.number === 4;
        const accentColor = isNDA ? '#A78BFA' : isProposal ? '#C9A24B' : '#C67A4E';

        return (
          <div key={s.number} className="flex items-start gap-3">
            {/* Step marker column */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                unlocked
                  ? 'bg-[#22C55E] border-[#22C55E]'
                  : isNext
                  ? 'border-[rgba(198,122,78,0.60)] bg-[rgba(198,122,78,0.07)]'
                  : 'border-[color:var(--vv-border-strong)] bg-transparent'
              }`}
                style={isNext && (isNDA || isProposal) ? { borderColor: `${accentColor}60`, background: `${accentColor}09` } : undefined}>
                {unlocked ? (
                  <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isNDA || isProposal ? (
                  <svg width="9" height="9" fill="none" stroke={isNext ? accentColor : '#35446A'} strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                ) : (
                  <svg width="9" height="9" fill="none" stroke={isNext ? '#C67A4E' : '#35446A'} strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                )}
              </div>
              {s.number < 4 && (
                <div className={`w-px mt-0.5 ${compact ? 'h-3' : 'h-4'} ${s.number < currentStage ? 'bg-[#22C55E]/40' : 'bg-[#35446A]/50'}`} />
              )}
            </div>

            {/* Text + action */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11.5px] font-medium ${unlocked ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)]'}`}>
                  Stage {s.number} - {s.label}
                </span>
                {isNDA && !unlocked && (
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
                    style={{ color: '#A78BFA', borderColor: 'rgba(167,139,250,0.25)', background: 'rgba(167,139,250,0.06)' }}>
                    NDA
                  </span>
                )}
                {isProposal && !unlocked && (
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
                    style={{ color: '#C9A24B', borderColor: 'rgba(201,162,75,0.25)', background: 'rgba(201,162,75,0.06)' }}>
                    Final
                  </span>
                )}
                {unlocked && (
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
                    style={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)' }}>
                    Unlocked
                  </span>
                )}
                {isNext && (
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
                    style={{ color: accentColor, borderColor: `${accentColor}36`, background: `${accentColor}0A` }}>
                    Next
                  </span>
                )}
              </div>
              {!compact && (
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug mt-0.5">{s.description}</p>
              )}
              {isNext && onUnlock && s.unlockAction && !compact && (
                <button
                  onClick={() => onUnlock(s.number)}
                  className="mt-1.5 text-[11px] hover:underline"
                  style={{ color: accentColor }}>
                  {s.unlockAction} ?
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Locked Section Panel -----------------------------------------------------

interface LockedSectionProps {
  stageRequired: 2 | 3 | 4;
  currentStage: number;
  title: string;
  hint?: string;
  onUnlock?: (stage: number) => void;
  className?: string;
}

export function LockedSection({ stageRequired, currentStage, title, hint, onUnlock, className = '' }: LockedSectionProps) {
  const [showWhy, setShowWhy] = useState(false);
  const stageDef = DISCLOSURE_STAGES[stageRequired - 1];
  const isNDA = stageRequired === 3;
  const isProposal = stageRequired === 4;
  const accentColor = isNDA ? '#A78BFA' : isProposal ? '#C9A24B' : '#C67A4E';
  const stageLabel = isNDA ? 'NDA Required' : isProposal ? 'Founder Confirmation Required' : 'Stage 2';

  return (
    <div className={`relative rounded-[12px] overflow-hidden ${className}`}
      style={{
        background: 'rgba(8,12,18,0.72)',
        border: `1px solid ${accentColor}1A`,
        backdropFilter: 'blur(16px)',
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 50% 50%, ${accentColor}07 0%, transparent 70%)`,
        }} />

      <div className="relative px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Lock icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: `${accentColor}0E`,
            border: `1px solid ${accentColor}28`,
          }}>
          <svg width="15" height="15" fill="none" stroke={accentColor} strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[13px] font-semibold text-[color:var(--vv-text)]">{title}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border"
              style={{ color: accentColor, borderColor: `${accentColor}30`, background: `${accentColor}09` }}>
              {stageLabel}
            </span>
          </div>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">
            {hint ?? stageDef.unlockRequirement}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowWhy(v => !v)}
              className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors px-2.5 py-1 rounded border border-[color:var(--vv-border)] hover:border-[color:var(--vv-border-strong)]">
              Why locked?
            </button>
            {showWhy && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWhy(false)} />
                <div className="absolute right-0 bottom-full mb-2 z-50 w-64 rounded-[10px] p-4 shadow-2xl"
                  style={{ background: 'rgba(8,12,18,0.97)', border: '1px solid rgba(180,200,220,0.10)', backdropFilter: 'blur(24px)' }}>
                  <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] mb-1.5">Why is this locked?</p>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-relaxed mb-3">
                    {isNDA
                      ? "Confidential financial and deal information is protected. A mutual NDA ensures sensitive data is only shared with verified, committed parties."
                      : isProposal
                      ? "The full investment proposal is only available after NDA completion and founder approval to proceed to deal stage."
                      : 'Extended business details are shared after you express interest, helping founders connect with genuinely interested parties.'}
                  </p>
                  <div className="border-t border-[#1c2a3e] pt-2.5">
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-semibold uppercase tracking-wide mb-1">To unlock:</p>
                    <p className="text-[11px] text-[color:var(--vv-text-secondary)]">{stageDef.unlockRequirement}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {onUnlock && stageDef.unlockAction && (
            <Button size="sm" onClick={() => onUnlock(stageRequired)}>
              {stageDef.unlockAction}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Disclosure Gate ----------------------------------------------------------

interface DisclosureGateProps {
  stageRequired: 2 | 3 | 4;
  currentStage: number;
  title: string;
  hint?: string;
  onUnlock?: (stage: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function DisclosureGate({ stageRequired, currentStage, title, hint, onUnlock, children, className = '' }: DisclosureGateProps) {
  if (currentStage >= stageRequired) {
    return <div className={className}>{children}</div>;
  }
  return (
    <LockedSection
      stageRequired={stageRequired}
      currentStage={currentStage}
      title={title}
      hint={hint}
      onUnlock={onUnlock}
      className={className}
    />
  );
}

// --- Locked Document Row ------------------------------------------------------

interface LockedDocumentProps {
  name: string;
  type: string;
  stageRequired: 2 | 3 | 4;
  currentStage: number;
  onUnlock?: (stage: number) => void;
}

export function LockedDocument({ name, type, stageRequired, currentStage, onUnlock }: LockedDocumentProps) {
  const unlocked = currentStage >= stageRequired;
  const isNDA = stageRequired === 3;
  const isProposal = stageRequired === 4;
  const color = isNDA ? '#A78BFA' : isProposal ? '#C9A24B' : '#C67A4E';
  const label = isNDA ? 'NDA Required' : isProposal ? 'Stage 4' : 'Stage 2';

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B]">
      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)]">
        <svg width="14" height="14" fill="none" stroke={unlocked ? '#C67A4E' : '#5E6D8F'} strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{name}</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{type}</p>
      </div>
      {unlocked ? (
        <button className="text-[11.5px] text-[#C67A4E] hover:underline flex-shrink-0">View</button>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
            style={{ color, borderColor: `${color}30`, background: `${color}09` }}>
            {label}
          </span>
          {onUnlock && (
            <button onClick={() => onUnlock(stageRequired)} className="text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Access Granted Banner ----------------------------------------------------

interface AccessGrantedProps {
  stage: number;
  onDismiss: () => void;
}

export function AccessGrantedBanner({ stage, onDismiss }: AccessGrantedProps) {
  const stageDef = DISCLOSURE_STAGES[stage - 1];
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-4"
      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
      <div className="w-6 h-6 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center flex-shrink-0">
        <svg width="11" height="11" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="flex-1 text-[12.5px] text-[#22C55E]">
        Stage {stage} unlocked - {stageDef?.label} information is now available.
      </p>
      <button onClick={onDismiss} className="text-[#22C55E]/60 hover:text-[#22C55E] transition-colors">
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

// --- NDA Status Panel ---------------------------------------------------------

export interface NDAParty {
  name: string;
  role: string;
  accepted: boolean;
  acceptedAt?: string;
}

export interface NDARecord {
  version: string;
  date: string;
  parties: [NDAParty, NDAParty];
}

interface NDAStatusPanelProps {
  nda: NDARecord;
  currentUserAccepted: boolean;
  onAccept?: () => void;
}

export function NDAStatusPanel({ nda, currentUserAccepted, onAccept }: NDAStatusPanelProps) {
  const allAccepted = nda.parties.every(p => p.accepted);

  return (
    <div className="rounded-[12px] overflow-hidden"
      style={{ border: '1px solid rgba(167,139,250,0.18)', background: 'rgba(167,139,250,0.03)' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[rgba(167,139,250,0.10)]">
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.22)' }}>
          <svg width="12" height="12" fill="none" stroke="#A78BFA" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Mutual Non-Disclosure Agreement</p>
          <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Version {nda.version} - {nda.date}</p>
        </div>
        {allAccepted ? (
          <span className="text-[9.5px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
            style={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)' }}>
            Active
          </span>
        ) : (
          <span className="text-[9.5px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
            style={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.07)' }}>
            Pending
          </span>
        )}
      </div>

      {/* Party acceptance rows */}
      <div className="divide-y divide-[rgba(167,139,250,0.07)]">
        {nda.parties.map((party, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                party.accepted ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[color:var(--vv-border-strong)] bg-transparent'
              }`}>
                {party.accepted && (
                  <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <p className="text-[12px] font-medium text-[color:var(--vv-text)]">{party.name}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{party.role}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {party.accepted ? (
                <p className="text-[11px] text-[#22C55E]">Accepted {party.acceptedAt ?? ''}</p>
              ) : (
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Pending acceptance</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      {!allAccepted && !currentUserAccepted && onAccept && (
        <div className="px-4 py-3 border-t border-[rgba(167,139,250,0.10)]">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-2.5">
            Review and accept the NDA to allow Stage 3 content to unlock for both parties.
          </p>
          <Button size="sm" onClick={onAccept}>Review &amp; Accept NDA</Button>
        </div>
      )}
      {!allAccepted && currentUserAccepted && (
        <div className="px-4 py-3 border-t border-[rgba(167,139,250,0.10)]">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
            Waiting for the other party to accept. Stage 3 unlocks once both parties sign.
          </p>
        </div>
      )}
    </div>
  );
}

// --- NDA Request Modal --------------------------------------------------------

interface NDAModalProps {
  onClose: () => void;
  onSubmit: () => void;
}

export function NDARequestModal({ onClose, onSubmit }: NDAModalProps) {
  const [step, setStep] = useState<'request' | 'sent'>('request');
  const [accepted, setAccepted] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="nda-agreement-title">
        <div className="w-full max-w-md rounded-[16px] overflow-hidden"
          style={{ background: '#0D1626', border: '1px solid rgba(167,139,250,0.18)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(167,139,250,0.10)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.22)' }}>
                <svg width="13" height="13" fill="none" stroke="#A78BFA" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div>
                <span id="nda-agreement-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display block">NDA Agreement</span>
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Stage 3 - Mutual Non-Disclosure</span>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close NDA agreement" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="p-6">
            {step === 'request' ? (
              <>
                {/* NDA summary */}
                <div className="mb-4 p-4 rounded-[10px] border border-[rgba(167,139,250,0.14)] bg-[rgba(167,139,250,0.04)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-[#A78BFA]">Vault Ventures Platform NDA</span>
                    <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Version 2.1</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[color:var(--vv-text-tertiary)]">
                    <span>Effective upon dual acceptance</span>
                    <span>2026</span>
                  </div>
                </div>

                <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mb-2">Unlocks after both parties sign:</p>
                <ul className="space-y-1.5 mb-5">
                  {['Detailed financial projections & runway', 'Equity structure & cap table', 'Confidential strategic documents', 'Full deal terms & term sheet draft'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px] text-[color:var(--vv-text-secondary)]">
                      <svg width="11" height="11" fill="none" stroke="#A78BFA" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Acceptance checkbox */}
                <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                  <div
                    onClick={() => setAccepted(v => !v)}
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      accepted ? 'bg-[#A78BFA] border-[#A78BFA]' : 'border-[color:var(--vv-border-strong)] bg-transparent hover:border-[#A78BFA]/60'
                    }`}>
                    {accepted && (
                      <svg width="8" height="8" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
                    I agree to the terms of the Vault Ventures Platform NDA and understand that Stage 3 content activates only when both parties have accepted.
                  </p>
                </label>

                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-4">
                  This NDA does not provide legal guarantees beyond the platform agreement. Review with a legal advisor for significant commitments.
                </p>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button
                    className="flex-1"
                    onClick={() => { if (accepted) { setStep('sent'); onSubmit(); } }}
                    disabled={!accepted}>
                    Submit Acceptance
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)' }}>
                  <svg width="20" height="20" fill="none" stroke="#A78BFA" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display mb-1">NDA Accepted</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-5">The founder has been notified. Stage 3 content unlocks once the other party also accepts.</p>
                <Button className="w-full" onClick={onClose}>Done</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Founder Confirmation Panel -----------------------------------------------

interface FounderConfirmationProps {
  partyName: string;
  onConfirm: () => void;
  onDecline: () => void;
}

export function FounderConfirmationPanel({ partyName, onConfirm, onDecline }: FounderConfirmationProps) {
  return (
    <div className="rounded-[12px] p-4"
      style={{ background: 'rgba(201,162,75,0.04)', border: '1px solid rgba(201,162,75,0.18)' }}>
      <div className="flex items-center gap-2 mb-2">
        <svg width="13" height="13" fill="none" stroke="#C9A24B" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <p className="text-[12px] font-semibold text-[#C9A24B]">Founder Confirmation Required</p>
      </div>
      <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3 leading-snug">
        <span className="text-[color:var(--vv-text)] font-medium">{partyName}</span> has completed NDA requirements and is requesting access to the Full Proposal (Stage 4).
        Confirm to unlock your complete deal documentation.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm}>Confirm &amp; Unlock Stage 4</Button>
        <Button variant="secondary" size="sm" onClick={onDecline}>Not Yet</Button>
      </div>
    </div>
  );
}

// --- Legacy compat ------------------------------------------------------------

interface LegacyProps {
  currentStage: number;
  compact?: boolean;
}

export function StagedDisclosure({ currentStage, compact }: LegacyProps) {
  return <DisclosureProgress currentStage={currentStage} compact={compact} />;
}