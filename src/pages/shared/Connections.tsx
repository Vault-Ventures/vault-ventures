import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// --- Types --------------------------------------------------------------------

type ConnectionStatus =
  | 'interest_sent'
  | 'mutual_interest'
  | 'deal_room'
  | 'nda_signed'
  | 'negotiating'
  | 'agreement'
  | 'active'
  | 'completed'
  | 'declined';

type ConnectionKind = 'investment' | 'professional';

interface Connection {
  id: string;
  counterpartName: string;
  counterpartInitials: string;
  counterpartRole: string;
  businessName: string;
  businessInitials: string;
  opportunity?: string;
  status: ConnectionStatus;
  updatedAt: string;
  kind: ConnectionKind;
  dealId?: string;
  investmentModel?: 'micro' | 'large';
  note?: string;
}

// --- Status config -------------------------------------------------------------

const STATUS_CFG: Record<ConnectionStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'neutral' | 'accent'; color: string; description: string }> = {
  interest_sent:   { label: 'Interest Sent',   variant: 'info',    color: '#3B82F6', description: 'Waiting for founder to respond' },
  mutual_interest: { label: 'Mutual Interest', variant: 'warning', color: '#C9A24B', description: 'Both parties interested - open a deal room' },
  deal_room:       { label: 'Deal Room',        variant: 'info',    color: '#3B82F6', description: 'Deal room open and active' },
  nda_signed:      { label: 'NDA Signed',       variant: 'success', color: '#22C55E', description: 'NDA complete - negotiation stage' },
  negotiating:     { label: 'Negotiating',      variant: 'warning', color: '#C9A24B', description: 'Terms under negotiation' },
  agreement:       { label: 'Agreement',        variant: 'success', color: '#22C55E', description: 'Terms agreed - finalising agreement' },
  active:          { label: 'Active',           variant: 'success', color: '#22C55E', description: 'Investment or collaboration active' },
  completed:       { label: 'Completed',        variant: 'success', color: '#22C55E', description: 'Deal successfully completed' },
  declined:        { label: 'Declined',         variant: 'neutral', color: '#5E6D8F', description: 'Interest or application declined' },
};

// --- Seed data -----------------------------------------------------------------

const FOUNDER_CONNECTIONS: Connection[] = [
  {
    id: 'fc-1',
    counterpartName: 'Rahim Chowdhury',
    counterpartInitials: 'RC',
    counterpartRole: 'Investor - Meridian Capital',
    businessName: 'Nova Health',
    businessInitials: 'NH',
    status: 'nda_signed',
    kind: 'investment',
    investmentModel: 'large',
    updatedAt: 'Aug 28, 2026',
    dealId: 'deal-room',
    note: 'NDA signed on Aug 28. Stage 3 documents unlocked. Awaiting negotiation terms response.',
  },
  {
    id: 'fc-2',
    counterpartName: 'Tariq Hossain',
    counterpartInitials: 'TH',
    counterpartRole: 'Growth Strategy Advisor',
    businessName: 'Nova Health',
    businessInitials: 'NH',
    opportunity: 'Growth Strategy Advisor',
    status: 'negotiating',
    kind: 'professional',
    updatedAt: 'Aug 26, 2026',
    dealId: 'negotiation',
    note: 'Counter-proposal v2 submitted by Tariq. Awaiting your response.',
  },
  {
    id: 'fc-3',
    counterpartName: 'Priya Mehta',
    counterpartInitials: 'PM',
    counterpartRole: 'Investor - BlueSky Ventures',
    businessName: 'Nova Health',
    businessInitials: 'NH',
    status: 'mutual_interest',
    kind: 'investment',
    investmentModel: 'micro',
    updatedAt: 'Aug 24, 2026',
    note: 'Mutual interest confirmed. You can open a dedicated deal room to proceed.',
  },
  {
    id: 'fc-4',
    counterpartName: 'Sadia Islam',
    counterpartInitials: 'SI',
    counterpartRole: 'Investor - Dhaka Angel Network',
    businessName: 'Nova Health',
    businessInitials: 'NH',
    status: 'declined',
    kind: 'investment',
    updatedAt: 'Aug 20, 2026',
    note: 'Stage mismatch - investor indicated current stage does not fit their portfolio focus.',
  },
];

const INVESTOR_CONNECTIONS: Connection[] = [
  {
    id: 'ic-1',
    counterpartName: 'Rifat Ahsan',
    counterpartInitials: 'RA',
    counterpartRole: 'Founder - Nova Health',
    businessName: 'Nova Health',
    businessInitials: 'NH',
    status: 'nda_signed',
    kind: 'investment',
    investmentModel: 'large',
    updatedAt: 'Aug 28, 2026',
    dealId: 'deal-room',
    note: 'NDA signed. Stage 3 documents available. Negotiation terms pending.',
  },
  {
    id: 'ic-2',
    counterpartName: 'Karim Uddin',
    counterpartInitials: 'KU',
    counterpartRole: 'Founder - AgriLink BD',
    businessName: 'AgriLink BD',
    businessInitials: 'AL',
    status: 'interest_sent',
    kind: 'investment',
    investmentModel: 'micro',
    updatedAt: 'Aug 22, 2026',
    note: 'Interest sent. Waiting for the founder to respond.',
  },
  {
    id: 'ic-3',
    counterpartName: 'Nadia Rahman',
    counterpartInitials: 'NR',
    counterpartRole: 'Founder - FinFlow',
    businessName: 'FinFlow',
    businessInitials: 'FF',
    status: 'declined',
    kind: 'investment',
    updatedAt: 'Aug 15, 2026',
    note: 'Founder is not currently open to new investors at this stage.',
  },
];

const PROFESSIONAL_CONNECTIONS: Connection[] = [
  {
    id: 'pc-1',
    counterpartName: 'Rifat Ahsan',
    counterpartInitials: 'RA',
    counterpartRole: 'Founder - Nova Health',
    businessName: 'Nova Health',
    businessInitials: 'NH',
    opportunity: 'Growth Strategy Advisor',
    status: 'negotiating',
    kind: 'professional',
    updatedAt: 'Aug 26, 2026',
    dealId: 'negotiation',
    note: 'Nova Health has proposed collaboration terms. Review and respond to proceed.',
  },
  {
    id: 'pc-2',
    counterpartName: 'Karim Uddin',
    counterpartInitials: 'KU',
    counterpartRole: 'Founder - AgriLink BD',
    businessName: 'AgriLink BD',
    businessInitials: 'AL',
    opportunity: 'Market Entry Consultant',
    status: 'interest_sent',
    kind: 'professional',
    updatedAt: 'Aug 18, 2026',
    note: 'Application submitted. Awaiting review from AgriLink BD.',
  },
];

// --- Deal lifecycle stages -----------------------------------------------------

const DEAL_STAGES = ['Matched', 'Interest Confirmed', 'Deal Room', 'NDA Signed', 'Negotiation', 'Agreement', 'Active', 'Completed'];

const STATUS_TO_STAGE: Partial<Record<ConnectionStatus, number>> = {
  interest_sent: 1,
  mutual_interest: 1,
  deal_room: 2,
  nda_signed: 3,
  negotiating: 4,
  agreement: 5,
  active: 6,
  completed: 7,
};

// --- Sub-components -----------------------------------------------------------

function InvestmentModelPill({ model }: { model: 'micro' | 'large' }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
      style={model === 'micro'
        ? { background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }
        : { background: 'rgba(198,122,78,0.1)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.2)' }}
    >
      {model === 'micro' ? '? Micro - P/L Sharing' : '? Standard - Equity'}
    </span>
  );
}

function MiniLifecycle({ status }: { status: ConnectionStatus }) {
  const currentStage = STATUS_TO_STAGE[status] ?? 0;
  const stages = ['Matched', 'Interest', 'Deal Room', 'NDA', 'Negotiate', 'Agreement', 'Active', 'Done'];
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {stages.map((s, i) => {
        const done = i <= currentStage;
        const current = i === currentStage;
        return (
          <React.Fragment key={i}>
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: current ? 20 : 10,
                background: done
                  ? (current ? '#C67A4E' : 'rgba(198,122,78,0.5)')
                  : 'rgba(53,68,106,0.6)',
              }}
              title={s}
            />
          </React.Fragment>
        );
      })}
      <span className="text-[9px] text-[color:var(--vv-text-tertiary)] ml-1.5">{DEAL_STAGES[currentStage]}</span>
    </div>
  );
}

function ConnectionCard({ conn }: { conn: Connection }) {
  const navigate = useNavigate();
  const cfg = STATUS_CFG[conn.status];
  const isActionable = ['mutual_interest', 'deal_room', 'nda_signed', 'negotiating', 'agreement', 'active'].includes(conn.status);
  const isDeclined = conn.status === 'declined';
  const isWaiting = conn.status === 'interest_sent';

  function handlePrimaryAction() {
    if (conn.dealId === 'deal-room') navigate('/app/deal-room');
    else if (conn.dealId === 'negotiation') navigate('/app/negotiation');
    else if (conn.status === 'mutual_interest') navigate('/app/deal-room');
  }

  return (
    <div
      className="rounded-[14px] border transition-all duration-200"
      style={{
        background: isDeclined ? 'rgba(26,28,29,0.6)' : 'rgba(26,28,29,0.85)',
        borderColor: isDeclined ? 'rgba(36,48,74,0.5)' : 'rgba(36,48,74,0.9)',
        opacity: isDeclined ? 0.65 : 1,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-[#1c2a3e]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-[color:var(--vv-text)] shrink-0"
              style={{ background: 'rgba(198,122,78,0.12)', border: '1.5px solid rgba(198,122,78,0.25)' }}
            >
              {conn.counterpartInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] truncate">{conn.counterpartName}</p>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] truncate">{conn.counterpartRole}</p>
            </div>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>

        {/* Business context */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded text-[9px] font-bold text-[color:var(--vv-text)] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(198,122,78,0.15)', border: '1px solid rgba(198,122,78,0.25)' }}
            >
              {conn.businessInitials}
            </div>
            <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] font-medium">{conn.businessName}</span>
          </div>
          {conn.opportunity && (
            <span className="text-[10px] text-[color:var(--vv-text-tertiary)] px-2 py-0.5 rounded-full" style={{ background: 'rgba(36,48,74,0.5)', border: '1px solid rgba(53,68,106,0.4)' }}>
              {conn.opportunity}
            </span>
          )}
          {conn.investmentModel && <InvestmentModelPill model={conn.investmentModel} />}
        </div>

        {/* Lifecycle bar for investment connections */}
        {conn.kind === 'investment' && !isDeclined && <MiniLifecycle status={conn.status} />}
      </div>

      {/* Interest status tracker */}
      {conn.status === 'interest_sent' && (
        <div className="px-5 py-3 border-b border-[#1c2a3e]">
          <InterestStatusCard conn={conn} />
        </div>
      )}

      {/* Note + actions */}
      <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          {conn.note && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed">{conn.note}</p>}
          <p className="text-[10px] text-[#35446A] mt-1">Updated {conn.updatedAt}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isActionable && (
            <Button size="sm" variant={conn.dealId ? 'primary' : 'secondary'} onClick={handlePrimaryAction}>
              {conn.dealId === 'deal-room' ? 'Open Deal Room' :
               conn.dealId === 'negotiation' ? 'View Negotiation' :
               conn.status === 'mutual_interest' ? 'Open Deal Room' : 'View'}
            </Button>
          )}
          {isWaiting && (
            <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">Awaiting response-</span>
          )}
          {isDeclined && (
            <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">No further action needed</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ role }: { role: string }) {
  const navigate = useNavigate();
  const discoverPath = role === 'investor' ? '/app/investor/discover' :
                       role === 'founder' ? '/app/founder/discover-investors' :
                       '/app/professional/discover';
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'rgba(198,122,78,0.08)', border: '1.5px solid rgba(198,122,78,0.2)' }}
      >
        <svg width="26" height="26" fill="none" stroke="#C67A4E" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-2">No connections yet</p>
      <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-xs mb-6 leading-relaxed">
        Connections are created when both parties confirm mutual interest. Discover opportunities to get started.
      </p>
      <Button variant="primary" size="md" onClick={() => navigate(discoverPath)}>
        Discover Opportunities
      </Button>
    </div>
  );
}

// --- Interest Status Detail (for investor interest_sent) ---------------------

function InterestStatusCard({ conn }: { conn: Connection }) {
  const stages = ['Interest Sent', 'Waiting for Founder', 'Founder Interested', 'Mutual Interest'];
  const currentIndex = conn.status === 'interest_sent' ? 1 : 3;

  return (
    <div className="mt-3 pt-3 border-t border-[#1c2a3e]">
      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2.5">Interest Status</p>
      <div className="flex items-center gap-0">
        {stages.map((stage, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px]"
                  style={{
                    background: done ? '#C67A4E' : current ? 'rgba(198,122,78,0.15)' : 'transparent',
                    borderColor: done || current ? '#C67A4E' : '#35446A',
                    color: done ? '#fff' : current ? '#C67A4E' : '#35446A',
                  }}
                >
                  {done ? '?' : i + 1}
                </div>
                <p className="text-[8.5px] text-[color:var(--vv-text-tertiary)] mt-1 text-center w-14 leading-tight hidden sm:block">{stage}</p>
              </div>
              {i < stages.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-1"
                  style={{ background: i < currentIndex - 1 ? '#C67A4E' : 'rgba(53,68,106,0.6)' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// --- Filter pill ---------------------------------------------------------------

type Filter = 'all' | 'active' | 'pending' | 'completed' | 'declined';

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active Deals' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'declined', label: 'Declined' },
];

function matchesFilter(conn: Connection, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return ['deal_room', 'nda_signed', 'negotiating', 'agreement', 'active', 'mutual_interest'].includes(conn.status);
  if (filter === 'pending') return ['interest_sent'].includes(conn.status);
  if (filter === 'completed') return conn.status === 'completed';
  if (filter === 'declined') return conn.status === 'declined';
  return true;
}

// --- Main component ------------------------------------------------------------

export default function Connections() {
  const { role } = useRole();
  const [filter, setFilter] = useState<Filter>('all');

  const allConnections =
    role === 'founder' ? FOUNDER_CONNECTIONS :
    role === 'investor' ? INVESTOR_CONNECTIONS :
    PROFESSIONAL_CONNECTIONS;

  const filtered = allConnections.filter(c => matchesFilter(c, filter));

  const activeCount = allConnections.filter(c =>
    ['deal_room', 'nda_signed', 'negotiating', 'agreement', 'active', 'mutual_interest'].includes(c.status)
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-[color:var(--vv-text)] tracking-tight">
            Connections
          </h1>
          {activeCount > 0 && (
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(198,122,78,0.12)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.25)' }}
            >
              {activeCount} active
            </span>
          )}
        </div>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">
          {role === 'investor'
            ? 'Businesses where mutual interest has been confirmed or interest is pending.'
            : role === 'founder'
            ? 'Investors and professionals connected to your business.'
            : 'Founders and businesses you have applied to or connected with.'}
        </p>
      </div>

      {/* Simulation notice */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] mb-5 text-[11.5px]"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B' }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>
          <strong>Simulation platform</strong> - All deal flows, investments and agreements on Vault Ventures are simulated. No real capital transfers occur.
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className="px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all"
            style={filter === opt.id
              ? { background: 'rgba(198,122,78,0.15)', color: '#C67A4E', border: '1px solid rgba(198,122,78,0.3)' }
              : { background: 'rgba(36,48,74,0.4)', color: '#5E6D8F', border: '1px solid rgba(53,68,106,0.4)' }}
          >
            {opt.label}
            {opt.id !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {allConnections.filter(c => matchesFilter(c, opt.id)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 && filter === 'all' ? (
        <EmptyState role={role} />
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">No connections match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(conn => (
            <ConnectionCard key={conn.id} conn={conn} />
          ))}
        </div>
      )}
    </div>
  );
}