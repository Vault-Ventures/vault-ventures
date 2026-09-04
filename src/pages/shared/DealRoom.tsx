import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { StagedDisclosure } from '../../components/ui/StagedDisclosure';
import { useRole } from '../../components/layout/AppShell';
import { canAccess } from '../../utils/permissions';
import {
  IconCheck, IconLock, IconFileText, IconMessageSquare, IconAlertTriangle, IconShield, IconChevronDown, IconChevronLeft
} from '../../components/layout/Icons';

// --- Constants ----------------------------------------------------------------

const STAGES = ['Matched', 'Interest Confirmed', 'Deal Room', 'NDA Signed', 'Negotiation', 'Agreement', 'Milestone Funding Active', 'Completed'];

type DocAccess = 'available' | 'nda_required' | 'locked' | 'pending' | 'finalized';

interface Doc {
  name: string;
  stage: number;
  access: DocAccess;
  type: string;
  size: string;
  date: string;
}

const DOCS: Doc[] = [
  { name: 'Executive Summary',       stage: 1, access: 'available',     type: 'PDF',  size: '2.4 MB', date: 'Mar 14' },
  { name: 'Pitch Deck v3',           stage: 1, access: 'available',     type: 'PDF',  size: '8.1 MB', date: 'Mar 14' },
  { name: 'Business Model Canvas',   stage: 2, access: 'available',     type: 'PDF',  size: '1.1 MB', date: 'Mar 18' },
  { name: 'Market Research Report',  stage: 2, access: 'available',     type: 'PDF',  size: '4.7 MB', date: 'Mar 18' },
  { name: 'Audited Financials FY2023', stage: 3, access: 'available',   type: 'XLSX', size: '512 KB', date: 'Mar 21' },
  { name: 'Cap Table (Full)',         stage: 3, access: 'available',     type: 'XLSX', size: '280 KB', date: 'Mar 21' },
  { name: 'Full Data Room',           stage: 3, access: 'available',     type: 'ZIP',  size: '142 MB', date: 'Mar 21' },
  { name: 'Term Sheet Draft',         stage: 4, access: 'pending',       type: 'PDF',  size: '-',      date: '-' },
  { name: 'Shareholders Agreement',   stage: 4, access: 'pending',       type: 'PDF',  size: '-',      date: '-' },
];

const ACCESS_CFG: Record<DocAccess, { label: string; color: string; icon: string }> = {
  available:    { label: 'Available',     color: '#22C55E', icon: 'OK' },
  nda_required: { label: 'NDA Required',  color: '#A78BFA', icon: 'NDA' },
  locked:       { label: 'Restricted',    color: '#5E6D8F', icon: 'LOCK' },
  pending:      { label: 'Pending',       color: '#C67A4E', icon: 'WAIT' },
  finalized:    { label: 'Finalized',     color: '#C67A4E', icon: 'DONE' },
};

const MILESTONES = [
  { label: 'Product MVP Launch',         amount: 'BDT 15,00,000', status: 'completed', date: 'Oct 2023' },
  { label: 'First 100 Paying Customers', amount: 'BDT 20,00,000', status: 'completed', date: 'Jan 2024' },
  { label: 'Series A Bridge Round',      amount: 'BDT 25,00,000', status: 'active',    date: 'Q2 2024' },
  { label: 'Break-even Point',           amount: '-',           status: 'pending',   date: 'Q4 2024' },
  { label: 'Series A Close',             amount: 'BDT 1,00,00,000', status: 'pending', date: '2025' },
];

const TERMS = [
  { term: 'Investment Amount',     founder: 'BDT 60,00,000', investor: 'BDT 45,00,000', agreed: false },
  { term: 'Equity',                founder: '12%',         investor: '10%',          agreed: false },
  { term: 'Pre-money Valuation',   founder: 'BDT 5,00,00,000', investor: 'BDT 4,50,00,000', agreed: false },
  { term: 'Board Seat',            founder: 'Observer',    investor: 'Full seat',    agreed: false },
  { term: 'Pro-rata Rights',       founder: 'Yes',         investor: 'Yes',          agreed: true },
  { term: 'Liquidation Preference',founder: '1- non-part.',investor: '1- non-part.', agreed: true },
];

type ChatEntry = {
  kind: 'message';
  from: string;
  fromRole: 'founder' | 'investor';
  time: string;
  text: string;
} | {
  kind: 'event';
  text: string;
  time: string;
  dot: string;
};

const CHAT_ENTRIES: ChatEntry[] = [
  { kind: 'event',   text: 'Deal Room opened',                   time: 'Mar 17 - 09:00', dot: '#5E6D8F' },
  { kind: 'event',   text: 'NDA sent to both parties',           time: 'Mar 20 - 10:00', dot: '#3B82F6' },
  { kind: 'event',   text: 'NDA signed by NovaTech AI',          time: 'Mar 21 - 14:15', dot: '#22C55E' },
  { kind: 'event',   text: 'NDA signed by Meridian Capital',     time: 'Mar 21 - 15:42', dot: '#22C55E' },
  { kind: 'event',   text: 'Stage 3 documents unlocked',         time: 'Mar 21 - 15:42', dot: '#C67A4E' },
  { kind: 'message', from: 'Meridian Capital', fromRole: 'investor', time: '10:42',
    text: "We've reviewed the extended information and are very interested. The AI credit risk angle aligns well with our FinTech thesis." },
  { kind: 'message', from: 'NovaTech AI', fromRole: 'founder', time: '11:15',
    text: "Great to hear. Full data room is now accessible under Stage 3 documents - cap table and FY2023 financials are in there." },
  { kind: 'event',   text: 'Negotiation terms submitted - Version 1',  time: 'Mar 23 - 09:30', dot: '#A78BFA' },
  { kind: 'message', from: 'Meridian Capital', fromRole: 'investor', time: '14:03',
    text: 'One question on the CAC/LTV ratio breakdown - can you clarify how the 18-month LTV is projected?' },
];

const LOG = [
  { text: 'NDA signed by Meridian Capital',  time: 'Mar 21 - 15:42', dot: '#22C55E' },
  { text: 'NDA signed by NovaTech AI',        time: 'Mar 21 - 14:15', dot: '#22C55E' },
  { text: 'Stage 3 documents unlocked',       time: 'Mar 21 - 14:16', dot: '#C67A4E' },
  { text: 'NDA sent to both parties',         time: 'Mar 20 - 10:00', dot: '#3B82F6' },
  { text: 'Interest confirmed by Meridian',   time: 'Mar 18 - 16:30', dot: '#3B82F6' },
  { text: 'Stage 2 info shared',              time: 'Mar 18 - 16:31', dot: '#C67A4E' },
  { text: 'Deal Room opened',                 time: 'Mar 17 - 09:00', dot: '#5E6D8F' },
  { text: 'Matched - 86% compatibility',      time: 'Mar 14 - 11:00', dot: '#C67A4E' },
];

const PARTICIPANTS = [
  { name: 'NovaTech AI',     role: 'Founder',  tier: 2 as const, score: 78, scoreLabel: 'Readiness' },
  { name: 'Meridian Capital',role: 'Investor', tier: 2 as const, score: 86, scoreLabel: 'Match' },
];

const DEAL_DETAILS = [
  { label: 'Opened',    value: 'Mar 14, 2024', mono: false },
  { label: 'NDA Signed',value: 'Mar 21, 2024', mono: false },
  { label: 'Ask',       value: 'BDT 60,00,000',    mono: true },
];

type Tab = 'overview' | 'documents' | 'terms' | 'milestones' | 'investment' | 'chat' | 'agreement';
type InvestmentModel = 'large' | 'micro';

// --- Sub-components -----------------------------------------------------------

function ActivityLog() {
  return (
    <div className="px-4 py-4">
      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Activity Log</p>
      <div className="space-y-3">
        {LOG.map((e, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.dot }} />
            <div className="min-w-0">
              <p className="text-[11px] text-[color:var(--vv-text-secondary)] leading-snug">{e.text}</p>
              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono tabular-nums">{e.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealSummaryPanel({ dealStage }: { dealStage: number }) {
  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Participants</p>
        {PARTICIPANTS.map((p, i) => (
          <div key={i} className="mb-3 pb-3 border-b border-[#1c2a3e] last:border-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">{p.name[0]}</div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[color:var(--vv-text)] truncate">{p.name}</p>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{p.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <VerificationBadge tier={p.tier} />
              <ScoreChip score={p.score} label={p.scoreLabel} topFactors={['FinTech', 'Seed stage']} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Deal Details</p>
        <div className="space-y-1.5">
          {DEAL_DETAILS.map((row, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-[#1c2a3e]">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] shrink-0">{row.label}</span>
              <span className={`text-[11.5px] text-[color:var(--vv-text-secondary)] ${row.mono ? 'font-mono tabular-nums' : ''}`}>{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-1 border-b border-[#1c2a3e]">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Status</span>
            <Badge variant={dealStage >= 8 ? 'success' : 'accent'}>
              {dealStage >= 8 ? 'Completed' : dealStage >= 6 ? 'Agreement' : 'NDA Signed'}
            </Badge>
          </div>
          <p className="text-[10px] text-[#F59E0B] pt-0.5">? Simulated - no real capital</p>
        </div>
      </div>

      <StagedDisclosure currentStage={3} compact />
    </div>
  );
}

// --- Document access badge ----------------------------------------------------

function AccessBadge({ access }: { access: DocAccess }) {
  const cfg = ACCESS_CFG[access];
  const variantMap: Record<DocAccess, 'success' | 'accent' | 'neutral' | 'warning' | 'info'> = {
    available: 'success', nda_required: 'info', locked: 'neutral', pending: 'warning', finalized: 'accent',
  };
  return <Badge variant={variantMap[access]}>{cfg.label}</Badge>;
}

// --- Locked document card -----------------------------------------------------

function LockedDocCard({ doc, onNDA }: { doc: Doc; onNDA: () => void }) {
  const isNDA = doc.access === 'nda_required';
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2a3e] last:border-0 opacity-70">
      <IconLock s={14} className={isNDA ? 'text-[#A78BFA] shrink-0' : 'text-[color:var(--vv-text-tertiary)] shrink-0'} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[color:var(--vv-text-tertiary)] truncate">{doc.name}</p>
        <p className="text-[10.5px] text-[#35446A] font-mono mt-0.5">{doc.type}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <AccessBadge access={doc.access} />
        {isNDA && (
          <button onClick={onNDA} className="text-[10.5px] text-[#A78BFA] hover:underline whitespace-nowrap">
            Review NDA
          </button>
        )}
      </div>
    </div>
  );
}

// --- Completion view ----------------------------------------------------------

function CompletionView({ onReputation, onSummary }: { onReputation: () => void; onSummary: () => void }) {
  return (
    <div className="max-w-xl space-y-4">
      {/* Banner */}
      <div className="rounded-[14px] border p-6 text-center"
        style={{ background: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.22)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
          <svg width="26" height="26" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="font-display text-[18px] font-semibold text-[#22C55E] mb-1">Deal Completed</p>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-1">NovaTech AI - Meridian Capital</p>
        <p className="text-[11px] text-[#35446A]">Completed Aug 26, 2026</p>
      </div>

      {/* Summary */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
        <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Deal Summary</p>
        </div>
        {[
          { label: 'Final Status', value: 'Agreement Executed', highlight: true },
          { label: 'Completion Date', value: 'Aug 26, 2026', highlight: false },
          { label: 'Milestones', value: '5 of 5 completed', highlight: false },
          { label: 'Investment', value: 'BDT 52,50,000 (Simulated)', highlight: false },
          { label: 'Equity Agreed', value: '11%', highlight: false },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E2C44] last:border-b-0">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{row.label}</span>
            <span className={`text-[12px] font-semibold ${row.highlight ? 'text-[#22C55E]' : 'text-[color:var(--vv-text-secondary)]'}`}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Reputation prompt */}
      <div className="rounded-[12px] border p-4 flex items-start gap-3"
        style={{ background: 'rgba(198,122,78,0.04)', borderColor: 'rgba(198,122,78,0.16)' }}>
        <svg width="18" height="18" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] mb-0.5">Leave Feedback</p>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3">Share your experience to help build trust across the platform.</p>
          <Button size="sm" variant="secondary" onClick={onReputation}>Leave Feedback ?</Button>
        </div>
      </div>

      <Button variant="ghost" className="w-full" onClick={onSummary}>View Full Activity Log</Button>
    </div>
  );
}

// --- Agreement tab ------------------------------------------------------------

function AgreementTab({ dealStage }: { dealStage: number }) {
  const [agrStatus, setAgrStatus] = useState<'pending' | 'finalized'>(dealStage >= 8 ? 'finalized' : 'pending');

  const clauses = [
    { label: 'Investment Amount',  value: 'BDT 52,50,000 (Simulated)' },
    { label: 'Equity',             value: '11%' },
    { label: 'Pre-money Valuation',value: 'BDT 4,77,00,000 (Simulated)' },
    { label: 'Board Seat',         value: 'Observer rights' },
    { label: 'Pro-rata Rights',    value: 'Yes' },
    { label: 'Liquidation Pref.',  value: '1- non-participating' },
    { label: 'Milestone Funding',  value: '5 tranches over 18 months' },
    { label: 'Governing Law',      value: 'Laws of Bangladesh' },
  ];

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">
          Shareholders Agreement
        </p>
        <Badge variant={agrStatus === 'finalized' ? 'success' : 'warning'} dot>
          {agrStatus === 'finalized' ? 'Finalized' : 'Pending Signatures'}
        </Badge>
      </div>

      {agrStatus === 'finalized' && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px]"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
          </svg>
          <p className="text-[12px] font-semibold text-[#22C55E]">Agreement Finalized - Aug 26, 2026</p>
        </div>
      )}

      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
        <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Agreed Terms</p>
          <p className="text-[10.5px] text-[#35446A]">? Simulated - no real financial obligation</p>
        </div>
        {clauses.map((c, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#2B2D2F] last:border-b-0">
            <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{c.label}</span>
            <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{c.value}</span>
          </div>
        ))}
      </div>

      {/* Signatures */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
        <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Signatures</p>
        </div>
        {PARTICIPANTS.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#2B2D2F] last:border-b-0">
            <div className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] shrink-0">{p.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[color:var(--vv-text)]">{p.name}</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{p.role}</p>
            </div>
            {agrStatus === 'finalized' ? (
              <Badge variant="success" dot>Signed - Aug 26</Badge>
            ) : (
              <Badge variant="warning" dot>Awaiting signature</Badge>
            )}
          </div>
        ))}
      </div>

      {agrStatus === 'pending' && (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => setAgrStatus('finalized')}>Sign Agreement</Button>
          <Button variant="ghost">Download Draft</Button>
        </div>
      )}
      {agrStatus === 'finalized' && (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1">Download Agreement</Button>
          <Button variant="ghost">Share with Parties</Button>
        </div>
      )}
    </div>
  );
}

// --- Investment tab -----------------------------------------------------------

const MICRO_PL = [
  { period: 'Aug 2026', revenue: 480000, expenses: 310000 },
  { period: 'Jul 2026', revenue: 420000, expenses: 295000 },
  { period: 'Jun 2026', revenue: 375000, expenses: 280000 },
  { period: 'May 2026', revenue: 310000, expenses: 268000 },
];

function fmtBDT(n: number) {
  return 'BDT ' + n.toLocaleString('en-IN');
}

function InvestmentTab({ model }: { model: InvestmentModel }) {
  const [viewModel, setViewModel] = React.useState<InvestmentModel>(model);

  const microTerms = [
    { label: 'Investment Amount (Simulated)', value: 'BDT 12,00,000' },
    { label: 'Profit/Loss Share', value: '22% of Net P/L' },
    { label: 'Sharing Period', value: '18 months from deployment' },
    { label: 'Reporting Frequency', value: 'Monthly' },
    { label: 'Minimum Revenue Target', value: 'BDT 3,00,000/month' },
  ];
  const largeTerms = [
    { label: 'Investment Amount (Simulated)', value: 'BDT 52,50,000' },
    { label: 'Equity Stake', value: '11%' },
    { label: 'Pre-money Valuation', value: 'BDT 4,77,00,000 (Simulated)' },
    { label: 'Board Rights', value: 'Observer seat' },
    { label: 'Pro-rata Rights', value: 'Yes, for next round' },
    { label: 'Liquidation Preference', value: '1- non-participating' },
    { label: 'Lock-up Period', value: '24 months' },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      {/* Simulation boundary notice */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] text-[12px] font-medium"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span><strong>SIMULATION</strong> - All investment figures, equity terms, and P/L data shown here are simulated. No real capital transfers, equity settlement, or financial obligations exist on this platform.</span>
      </div>

      {/* Model toggle */}
      <div className="flex items-center gap-1 p-1 rounded-[10px] inline-flex" style={{ background: 'rgba(26,28,29,0.8)', border: '1px solid rgba(43,45,47,0.8)' }}>
        {(['large', 'micro'] as InvestmentModel[]).map(m => (
          <button
            key={m}
            onClick={() => setViewModel(m)}
            className="px-4 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all"
            style={viewModel === m
              ? { background: 'rgba(198,122,78,0.2)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.3)' }
              : { color: '#5E6D8F' }}
          >
            {m === 'large' ? '? Standard - Equity/Ownership' : '? Micro - P/L Sharing'}
          </button>
        ))}
      </div>

      {/* Large / Equity model */}
      {viewModel === 'large' && (
        <div className="space-y-3">
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Equity / Ownership Terms</p>
              <Badge variant="warning">Simulated</Badge>
            </div>
            {largeTerms.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#2B2D2F] last:border-0">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{t.label}</span>
                <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{t.value}</span>
              </div>
            ))}
          </div>

          {/* Ownership visual */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] p-4" style={{ background: 'rgba(26,28,29,0.85)' }}>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Simulated Ownership Breakdown</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 rounded-l-full" style={{ width: '11%', background: '#C67A4E' }} title="Meridian Capital 11%" />
              <div className="h-3 rounded-r-full flex-1" style={{ background: 'rgba(43,45,47,0.5)' }} title="Founders + Reserved 89%" />
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#C67A4E' }} /> <span className="text-[color:var(--vv-text-secondary)]">Meridian Capital - 11%</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'rgba(43,45,47,0.5)' }} /> <span className="text-[color:var(--vv-text-secondary)]">Founders + Reserved - 89%</span></div>
            </div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-2">? Simulated - no real equity settlement occurs on this platform.</p>
          </div>
        </div>
      )}

      {/* Micro / P/L Sharing model */}
      {viewModel === 'micro' && (
        <div className="space-y-3">
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)] flex items-center justify-between">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Profit/Loss Sharing Terms</p>
              <Badge variant="warning">Simulated</Badge>
            </div>
            {microTerms.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#2B2D2F] last:border-0">
                <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{t.label}</span>
                <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{t.value}</span>
              </div>
            ))}
          </div>

          {/* P/L table */}
          <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: 'rgba(26,28,29,0.85)' }}>
            <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
              <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Simulated P/L Report</p>
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Net P/L = Revenue - Expenses. Returns are not guaranteed.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    {['Period', 'Revenue', 'Expenses', 'Net P/L', 'Your Share (22%)'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MICRO_PL.map((row, i) => {
                    const net = row.revenue - row.expenses;
                    const share = Math.round(net * 0.22);
                    const isPos = net >= 0;
                    return (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0">
                        <td className="px-4 py-2.5 text-[12px] text-[color:var(--vv-text-secondary)] font-medium">{row.period}</td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#22C55E]">{fmtBDT(row.revenue)}</td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#C67A4E]">{fmtBDT(row.expenses)}</td>
                        <td className="px-4 py-2.5 font-mono text-[12px] font-bold" style={{ color: isPos ? '#22C55E' : '#EF4444' }}>
                          {isPos ? '+' : ''}{fmtBDT(net)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] font-semibold" style={{ color: isPos ? '#C9A24B' : '#5E6D8F' }}>
                          {isPos ? '+' : ''}{fmtBDT(share)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[color:var(--vv-border)]">
                    <td className="px-4 py-3 text-[11px] font-bold text-[color:var(--vv-text)]">Total (4 months)</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#22C55E]">{fmtBDT(MICRO_PL.reduce((a, r) => a + r.revenue, 0))}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#C67A4E]">{fmtBDT(MICRO_PL.reduce((a, r) => a + r.expenses, 0))}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#22C55E]">{fmtBDT(MICRO_PL.reduce((a, r) => a + (r.revenue - r.expenses), 0))}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#C9A24B]">{fmtBDT(Math.round(MICRO_PL.reduce((a, r) => a + (r.revenue - r.expenses), 0) * 0.22))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[color:var(--vv-border)]">
              <p className="text-[10px] text-[#35446A]">? Simulated figures. Past performance does not guarantee future results. No returns are guaranteed on this platform.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function DealRoom() {
  const navigate = useNavigate();
  const { role } = useRole();
  const isAdmin = role === 'admin';
  const canFounderAct = canAccess(role, 'deal.founderActions');
  const canInvestorAct = canAccess(role, 'deal.investorActions');
  const canParticipantAct = canFounderAct || canInvestorAct;
  const [dealStage, setDealStage] = useState(5); // 1-indexed; 5 = Negotiation
  const [tab, setTab] = useState<Tab>('overview');
  const [msg, setMsg] = useState('');
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>(CHAT_ENTRIES);
  const [activityOpen, setActivityOpen] = useState(false);
  const [investmentModel] = useState<InvestmentModel>('large');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // scroll chat to bottom when new message added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatEntries]);

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'terms',     label: 'Negotiation Terms' },
    { id: 'milestones',  label: 'Milestones' },
    { id: 'investment',  label: investmentModel === 'micro' ? 'Investment - P/L' : 'Investment - Equity' },
    { id: 'agreement',   label: 'Agreement' },
    { id: 'chat',        label: 'Chat', badge: '3' },
  ];

  function handleSendMessage() {
    if (!msg.trim() || !canParticipantAct) return;
    setChatEntries(prev => [...prev, {
      kind: 'message',
      from: `You (${canFounderAct ? 'NovaTech AI' : 'Meridian Capital'})`,
      fromRole: canFounderAct ? 'founder' : 'investor',
      time: 'Just now',
      text: msg.trim(),
    }]);
    setMsg('');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* -- Back nav -- */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-[#1c2a3e] bg-[#0D1626]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <IconChevronLeft s={13} />
          Back
        </button>
        <span className="text-[#35446A] text-[11px]">/</span>
        <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] font-medium">Deal Room - NovaTech AI - Meridian Capital</span>
      </div>

      <div className="flex-shrink-0 px-4 py-2.5 border-b border-[color:var(--vv-border)] bg-[#121A2B]">
        <div className="flex items-start gap-2.5">
          <IconShield s={14} className="text-[#C67A4E] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">
              {isAdmin ? 'Admin oversight view' : canFounderAct ? 'Founder deal view' : canInvestorAct ? 'Investor deal view' : 'Deal Room view'}
            </p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
              {isAdmin
                ? 'Review deal activity and governance signals. Participant actions are unavailable in the Admin Console.'
                : canFounderAct
                  ? 'Manage founder-side responses, business disclosures, and agreement progression for NovaTech AI.'
                  : canInvestorAct
                    ? 'Review investor-side terms, protected documents, and responses for Meridian Capital.'
                    : 'Your workspace can view this Deal Room but has no participant actions here.'}
            </p>
          </div>
        </div>
      </div>

      {/* -- Lifecycle stepper -- */}
      <div className="flex-shrink-0 bg-[#0D1626] border-b border-[color:var(--vv-border)]">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center px-5 py-3 min-w-max gap-0">
            {STAGES.map((s, i) => {
              const stageNum = i + 1;
              const done    = stageNum < dealStage;
              const current = stageNum === dealStage;
              return (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => setDealStage(stageNum)}
                    className="flex flex-col items-center group"
                    title={`Jump to: ${s}`}>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all ${
                      done    ? 'bg-[#22C55E] border-[#22C55E] text-white' :
                      current ? 'bg-[#C67A4E] border-[#C67A4E] text-white' :
                                'bg-transparent border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] group-hover:border-[#5E6D8F]'
                    }`}>
                      {done ? <IconCheck s={10} /> : stageNum}
                    </div>
                    <span className={`text-[9px] mt-1 whitespace-nowrap tracking-wide transition-colors ${
                      current ? 'text-[#C67A4E]' : done ? 'text-[color:var(--vv-text-secondary)]' : 'text-[#35446A]'
                    }`}>{s}</span>
                  </button>
                  {i < STAGES.length - 1 && (
                    <div className={`w-8 h-px mx-1 mb-3.5 shrink-0 transition-colors ${done ? 'bg-[#22C55E]' : 'bg-[#35446A]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Stage demo hint */}
        <div className="px-5 pb-2">
          <p className="text-[9.5px] text-[#35446A]">Click any stage above to preview that lifecycle state</p>
        </div>
      </div>

      {/* -- Body -- */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left sidebar */}
        <aside className="hidden lg:flex flex-col w-48 xl:w-52 shrink-0 border-r border-[color:var(--vv-border)] bg-[#0D1626] overflow-y-auto">
          <DealSummaryPanel dealStage={dealStage} />
        </aside>

        {/* Center workspace */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Mobile deal summary toggle */}
          <div className="lg:hidden border-b border-[color:var(--vv-border)] bg-[#0D1626]">
            <button
              onClick={() => setActivityOpen(a => !a)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] text-[color:var(--vv-text-secondary)]">
              <span className="font-medium">NovaTech AI - Meridian Capital</span>
              <div className="flex items-center gap-1.5">
                <Badge variant={dealStage >= 8 ? 'success' : 'accent'}>
                  {STAGES[dealStage - 1]}
                </Badge>
                <IconChevronDown s={13} className={`text-[color:var(--vv-text-tertiary)] transition-transform ${activityOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {activityOpen && (
              <div className="border-t border-[#1c2a3e]">
                <DealSummaryPanel dealStage={dealStage} />
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="shrink-0 border-b border-[color:var(--vv-border)] bg-[#121A2B] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center px-4 min-w-max">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-3.5 text-[12.5px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.id ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}>
                  {t.label}
                  {t.badge && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#C67A4E] text-[color:var(--vv-on-copper)]">{t.badge}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5">

            {/* -- OVERVIEW -- */}
            {tab === 'overview' && (
              dealStage >= 8 ? (
                <CompletionView
                  onReputation={() => navigate('/app/feedback')}
                  onSummary={() => {}}
                />
              ) : (
                <div className="space-y-4 max-w-2xl">

                  {/* NDA status card */}
                  {dealStage < 4 ? (
                    <div className="flex items-start gap-3 p-4 rounded-[10px] border"
                      style={{ background: 'rgba(167,139,250,0.05)', borderColor: 'rgba(167,139,250,0.22)' }}>
                      <IconLock s={15} className="text-[#A78BFA] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#A78BFA] mb-0.5">NDA Required</p>
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">Protected information is unavailable until both parties have signed the mutual NDA.</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => navigate('/app/nda/nova-health')}>Review NDA</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-[10px]"
                      style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)' }}>
                      <svg width="13" height="13" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
                      </svg>
                      <p className="text-[12px] text-[#22C55E] font-medium">NDA Completed - both parties signed Mar 21, 2024</p>
                    </div>
                  )}

                  {/* Action required */}
                  {dealStage === 5 && canParticipantAct && (
                    <div className="flex items-start gap-3 p-4 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px]">
                      <IconAlertTriangle s={15} className="text-[#F59E0B] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">Action required: Review negotiation terms</p>
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">{canFounderAct ? 'Review and respond to the investor proposal for NovaTech AI.' : 'Meridian Capital submitted preliminary terms. Review and respond within 5 business days.'}</p>
                      </div>
                      <Button size="sm" onClick={() => setTab('terms')}>Review</Button>
                    </div>
                  )}

                  {dealStage === 6 && (
                    <div className="flex items-start gap-3 p-4 rounded-[10px]"
                      style={{ background: 'rgba(198,122,78,0.05)', border: '1px solid rgba(198,122,78,0.2)' }}>
                      <IconFileText s={15} className="text-[#C67A4E] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">Agreement ready to sign</p>
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">Both parties agreed on terms. Review and sign the shareholders agreement.</p>
                      </div>
                      <Button size="sm" onClick={() => setTab('agreement')}>Review Agreement</Button>
                    </div>
                  )}

                  {/* Deal status table */}
                  <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
                      <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Deal Status</p>
                    </div>
                    <div>
                      {[
                        { label: 'Current stage',      value: STAGES[dealStage - 1], badge: null },
                        { label: 'NDA status',         value: null, badge: dealStage >= 4 ? { v: 'success', text: 'Both parties signed' } : { v: 'warning', text: 'Pending' } },
                        { label: 'NDA expiry',         value: dealStage >= 4 ? 'Mar 21, 2025' : '-', badge: null },
                        { label: 'Data room access',   value: null, badge: { v: dealStage >= 4 ? 'accent' : 'neutral', text: dealStage >= 4 ? 'Stage 3 unlocked' : 'Stage 1 only' } },
                        { label: 'Documents',          value: dealStage >= 4 ? '7 accessible - 2 locked' : '4 accessible - 5 locked', badge: null },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                          <span className="text-[12px] text-[color:var(--vv-text-tertiary)] shrink-0">{row.label}</span>
                          {row.badge ? (
                            <Badge variant={row.badge.v as any} dot>{row.badge.text}</Badge>
                          ) : (
                            <span className="text-[12px] text-[color:var(--vv-text-secondary)] text-right">{row.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestone summary */}
                  {dealStage >= 7 && (
                    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
                        <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Current Milestone</p>
                        <button onClick={() => navigate('/app/milestones?return=/app/deal-room')}
                          className="text-[11px] text-[#C67A4E] hover:underline">
                          Full Tracking ?
                        </button>
                      </div>
                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Series A Bridge Round</p>
                          <span className="text-[14px] font-bold text-[#C67A4E] font-mono">64%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(43,45,47,0.8)' }}>
                          <div className="h-full rounded-full" style={{ width: '64%', background: 'linear-gradient(90deg,#C67A4E,#C67A4E)' }} />
                        </div>
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Next: Break-even Point</p>
                      </div>
                    </div>
                  )}

                  <div className="lg:hidden">
                    <StagedDisclosure currentStage={dealStage >= 4 ? 3 : 2} />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-[color:var(--vv-border)] rounded-md">
                    <IconShield s={13} className="text-[color:var(--vv-text-tertiary)] shrink-0" />
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Staying on-platform provides verified history, milestone protection, and dispute support.</p>
                  </div>
                </div>
              )
            )}

            {/* -- DOCUMENTS -- */}
            {tab === 'documents' && (
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">
                    Data Room - {dealStage >= 4 ? 'Stage 3 Active' : 'Stage 1 Active'}
                  </p>
                  <Button variant="ghost" size="sm">Download accessible</Button>
                </div>

                {dealStage < 4 && (
                  <div className="flex items-start gap-3 p-3.5 rounded-[10px] mb-3"
                    style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <IconLock s={13} className="text-[#A78BFA] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#A78BFA]">NDA completion is required to access protected documents.</p>
                      <button onClick={() => navigate('/app/nda/nova-health')}
                        className="text-[11px] text-[#A78BFA] underline mt-1">Review NDA ?</button>
                    </div>
                  </div>
                )}

                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="border-b border-[color:var(--vv-border)]">
                          {['Document', 'Stage', 'Access', 'Type', 'Date', ''].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DOCS.map((doc, i) => {
                          const effectiveAccess: DocAccess = dealStage < 4 && doc.stage >= 3
                            ? 'nda_required'
                            : doc.access;
                          const isOpen = effectiveAccess === 'available' || effectiveAccess === 'finalized';
                          return (
                            <tr key={i} className={`border-b border-[#1c2a3e] last:border-0 ${isOpen ? 'hover:bg-[color:var(--vv-raised)]/50 cursor-pointer' : 'opacity-60'}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isOpen
                                    ? <IconFileText s={14} className="text-[#C67A4E] shrink-0" />
                                    : <IconLock s={14} className={`shrink-0 ${effectiveAccess === 'nda_required' ? 'text-[#A78BFA]' : 'text-[color:var(--vv-text-tertiary)]'}`} />}
                                  <span className={`text-[12.5px] font-medium ${isOpen ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{doc.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={doc.stage <= 2 ? 'success' : doc.stage === 3 ? 'accent' : 'neutral'}>
                                  S{doc.stage}
                                </Badge>
                              </td>
                              <td className="px-4 py-3"><AccessBadge access={effectiveAccess} /></td>
                              <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{doc.type}</td>
                              <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{doc.date}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {isOpen
                                  ? <Button variant="ghost" size="sm">Download</Button>
                                  : effectiveAccess === 'nda_required'
                                    ? <button onClick={() => navigate('/app/nda/nova-health')} className="text-[10.5px] text-[#A78BFA] hover:underline">Review NDA</button>
                                    : <span className="text-[10.5px] text-[#35446A]">{ACCESS_CFG[effectiveAccess].label}</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile stacked */}
                  <div className="sm:hidden">
                    {DOCS.map((doc, i) => {
                      const effectiveAccess: DocAccess = dealStage < 4 && doc.stage >= 3 ? 'nda_required' : doc.access;
                      const isOpen = effectiveAccess === 'available' || effectiveAccess === 'finalized';
                      return (
                        <div key={i} className={`px-4 py-3 border-b border-[#1c2a3e] last:border-0 ${!isOpen ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {isOpen ? <IconFileText s={13} className="text-[#C67A4E] shrink-0" /> : <IconLock s={13} className={effectiveAccess === 'nda_required' ? 'text-[#A78BFA] shrink-0' : 'text-[color:var(--vv-text-tertiary)] shrink-0'} />}
                            <p className={`text-[12px] font-medium truncate ${isOpen ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{doc.name}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <AccessBadge access={effectiveAccess} />
                            <span className="text-[10px] text-[#35446A] font-mono">{doc.type} - {doc.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* -- TERMS -- */}
            {tab === 'terms' && (
              <div className="max-w-2xl space-y-4">
                {/* Negotiation panel link */}
                <div className="flex items-center justify-between p-4 rounded-[12px] border"
                  style={{ background: 'rgba(167,139,250,0.05)', borderColor: 'rgba(167,139,250,0.2)' }}>
                  <div>
                    <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Negotiation Panel</p>
                    <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Version 3 - Revised Offer - Awaiting your response</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/app/negotiation/nova-health?return=/app/deal-room')}>
                    Open Negotiation ?
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Summary - Version 3 (Current)</p>
                  <Badge variant="warning">In Negotiation</Badge>
                </div>

                {/* Desktop */}
                <div className="hidden sm:block bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="border-b border-[color:var(--vv-border)]">
                          {['Term', 'Founder position', 'Investor proposal', 'Status'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TERMS.map((t, i) => (
                          <tr key={i} className="border-b border-[#1c2a3e] last:border-0">
                            <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{t.term}</td>
                            <td className="px-4 py-3 font-mono text-[12px] text-[color:var(--vv-text-secondary)] tabular-nums">{t.founder}</td>
                            <td className={`px-4 py-3 font-mono text-[12px] tabular-nums ${t.agreed ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>{t.investor}</td>
                            <td className="px-4 py-3"><Badge variant={t.agreed ? 'success' : 'warning'}>{t.agreed ? 'Agreed' : 'Open'}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  {TERMS.map((t, i) => (
                    <div key={i} className="px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{t.term}</p>
                        <Badge variant={t.agreed ? 'success' : 'warning'}>{t.agreed ? 'Agreed' : 'Open'}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-0.5">Founder</p>
                          <p className="font-mono text-[12px] text-[color:var(--vv-text-secondary)] tabular-nums">{t.founder}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-0.5">Investor</p>
                          <p className={`font-mono text-[12px] tabular-nums ${t.agreed ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>{t.investor}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {canParticipantAct ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => navigate('/app/negotiation/nova-health?return=/app/deal-room')}>
                      {canFounderAct ? 'Send Founder Response' : 'Send Counter Offer'}
                    </Button>
                    <Button className="flex-1" onClick={() => { setDealStage(6); setTab('agreement'); }}>
                      {canFounderAct ? 'Approve Terms' : 'Accept Terms'}
                    </Button>
                  </div>
                ) : (
                  <div className="px-3 py-2.5 rounded-md border border-[color:var(--vv-border)] text-[11px] text-[color:var(--vv-text-tertiary)]">
                    {isAdmin ? 'Admin oversight: participant negotiation actions are disabled.' : 'Negotiation actions are unavailable in this workspace.'}
                  </div>
                )}
              </div>
            )}

            {/* -- MILESTONES -- */}
            {tab === 'milestones' && (
              <div className="max-w-xl">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Milestone Funding Schedule</p>
                  <button onClick={() => navigate('/app/milestones?return=/app/deal-room')}
                    className="text-[11.5px] text-[#C67A4E] hover:underline flex items-center gap-1">
                    Full Tracking View
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  {MILESTONES.map((m, i) => (
                    <div key={i} className={`flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 ${m.status === 'active' ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)]' : ''}`}>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                        m.status === 'completed' ? 'bg-[#22C55E] border-[#22C55E]' :
                        m.status === 'active'    ? 'bg-[#C67A4E] border-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
                      }`}>
                        {m.status === 'completed'
                          ? <IconCheck s={11} className="text-white" />
                          : <span className={`text-[9px] font-bold ${m.status === 'active' ? 'text-white' : 'text-[color:var(--vv-text-tertiary)]'}`}>{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12.5px] font-medium ${m.status === 'pending' ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[color:var(--vv-text)]'}`}>{m.label}</p>
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{m.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-[12px] font-semibold tabular-nums ${m.status === 'completed' ? 'text-[#22C55E]' : m.status === 'active' ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{m.amount}</p>
                        <Badge variant={m.status === 'completed' ? 'success' : m.status === 'active' ? 'accent' : 'neutral'} dot>
                          {m.status === 'completed' ? 'Completed' : m.status === 'active' ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -- AGREEMENT -- */}
            {/* -- INVESTMENT -- */}
            {tab === 'investment' && <InvestmentTab model={investmentModel} />}

            {tab === 'agreement' && <AgreementTab dealStage={dealStage} />}

            {/* -- CHAT -- */}
            {tab === 'chat' && (
              <div className="flex flex-col max-w-2xl h-full min-h-[400px]">
                <div className="flex-1 space-y-2 mb-4 overflow-y-auto">
                  {chatEntries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <IconMessageSquare s={24} className="text-[#35446A] mb-3" />
                      <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No messages yet.</p>
                      <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">Start the conversation with the deal participants.</p>
                    </div>
                  )}
                  {chatEntries.map((entry, i) => {
                    if (entry.kind === 'event') {
                      return (
                        <div key={i} className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px" style={{ background: 'rgba(43,45,47,0.5)' }} />
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.dot }} />
                            <p className="text-[10.5px] text-[#35446A]">{entry.text}</p>
                            <p className="text-[10px] text-[#2A3A52] font-mono">- {entry.time}</p>
                          </div>
                          <div className="flex-1 h-px" style={{ background: 'rgba(43,45,47,0.5)' }} />
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex gap-3 py-1">
                        <div className="w-7 h-7 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0 mt-0.5">{entry.from[0]}</div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">{entry.from}</span>
                            <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{entry.time}</span>
                          </div>
                          <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-lg px-3.5 py-2.5">{entry.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-[#1E2C44]">
                  <input value={msg} onChange={e => setMsg(e.target.value)} disabled={!canParticipantAct}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                    placeholder="Message deal participants-"
                    className="flex-1 min-w-0 h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] focus:outline-none focus:border-[#C67A4E] transition-colors" />
                  <Button size="sm" icon={<IconMessageSquare s={13} />} onClick={handleSendMessage} disabled={!canParticipantAct}>Send</Button>
                </div>
              </div>
            )}

            {/* Mobile activity log */}
            <div className="xl:hidden mt-6 pt-4 border-t border-[color:var(--vv-border)]">
              <div className="bg-[#0D1626] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                <ActivityLog />
              </div>
            </div>

          </div>
        </div>

        {/* Right: activity log (desktop) */}
        <aside className="hidden xl:flex flex-col w-52 shrink-0 border-l border-[color:var(--vv-border)] bg-[#0D1626] overflow-y-auto">
          <ActivityLog />
        </aside>

      </div>
    </div>
  );
}