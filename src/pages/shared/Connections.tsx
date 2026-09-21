import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api, type ConnectionItem } from '../../services/api';

// --- Types --------------------------------------------------------------------

type ConnectionStatus =
  | 'interest_sent'
  | 'mutual_interest'
  | 'deal_room'
  | 'nda_signed'
  | 'negotiating'
  | 'agreement'
  | 'active'
  | 'completed';

type ConnectionKind = 'investment' | 'professional';

interface Connection {
  id: string;
  connectionId: number | null;
  businessId: number;
  canReciprocate: boolean;
  canFounderExpressInterest: boolean;
  counterpartyId: number;
  counterpartyRole: ConnectionItem['counterparty_role'];
  participantRole?: string;
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
  interest_sent:   { label: 'Interest Sent',   variant: 'info',    color: '#3B82F6', description: 'Waiting for mutual interest' },
  mutual_interest: { label: 'Mutual Interest', variant: 'warning', color: '#C9A24B', description: 'Both parties interested – open a deal room' },
  deal_room:       { label: 'Deal Room',        variant: 'info',    color: '#3B82F6', description: 'Deal room open and active' },
  nda_signed:      { label: 'NDA Signed',       variant: 'success', color: '#22C55E', description: 'NDA complete – negotiation stage' },
  negotiating:     { label: 'Negotiating',      variant: 'warning', color: '#C9A24B', description: 'Terms under negotiation' },
  agreement:       { label: 'Agreement',        variant: 'success', color: '#22C55E', description: 'Terms agreed – finalising agreement' },
  active:          { label: 'Active',           variant: 'success', color: '#22C55E', description: 'Investment or collaboration active' },
  completed:       { label: 'Completed',        variant: 'success', color: '#22C55E', description: 'Deal successfully completed' },
};

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
      {model === 'micro' ? '◆ Micro – P/L Sharing' : '◆ Standard – Equity'}
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

function ConnectionCard({ conn, onChanged }: { conn: Connection; onChanged: (founderInterestSubmitted?: boolean) => void }) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const founderSubmission = useRef(false);
  const previousConnection = useRef(conn);
  useEffect(() => {
    if (previousConnection.current !== conn && founderSubmission.current) {
      founderSubmission.current = false;
      setOpening(false);
    }
    previousConnection.current = conn;
  }, [conn]);
  const cfg = STATUS_CFG[conn.status];
  const isActionable = ['mutual_interest', 'deal_room', 'nda_signed', 'negotiating', 'agreement', 'active', 'completed'].includes(conn.status);
  const isWaiting = conn.status === 'interest_sent';

  async function handleFounderInterest() {
    if (!conn.canFounderExpressInterest || conn.counterpartyRole !== 'professional' || founderSubmission.current) return;
    founderSubmission.current = true;
    setOpening(true);
    setOpenError(null);
    try {
      await api.connections.expressFounderProfessionalInterest(conn.businessId, conn.counterpartyId);
      onChanged(true);
      // Keep submission locked until the authoritative list refreshes this card.
    } catch (err: any) {
      setOpenError(err?.message || 'Unable to express interest. Please try again.');
      founderSubmission.current = false;
      setOpening(false);
    }
  }

  async function handlePrimaryAction() {
    if (conn.dealId) {
      navigate(`/app/deals/${conn.dealId}`);
      return;
    }

    if (conn.connectionId && isActionable) {
      setOpening(true);
      setOpenError(null);
      try {
        const res = await api.post<{ id: number }>(`/api/me/connections/${conn.connectionId}/deal`, conn.participantRole ? { role: conn.participantRole } : {});
        if (res && res.id) {
          navigate(`/app/deals/${res.id}`);
        } else {
          setOpenError('The server did not return a Deal ID.');
        }
      } catch (err: any) {
        setOpenError(err?.message || 'Failed to open deal room. Refresh connections to check for an existing deal.');
      } finally {
        setOpening(false);
      }
    }
  }

  return (
    <div
      className={`rounded-[14px] border transition-all duration-200 bg-[#121A2B] border-[color:var(--vv-border)]`}
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
            <span className="text-[10px] text-[color:var(--vv-text-tertiary)] px-2 py-0.5 rounded-full border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
              {conn.opportunity}
            </span>
          )}
          {conn.investmentModel && <InvestmentModelPill model={conn.investmentModel} />}
        </div>

        {/* Lifecycle bar for investment connections */}
        {conn.kind === 'investment' && <MiniLifecycle status={conn.status} />}
      </div>

      {/* Interest status tracker */}
      {conn.status === 'interest_sent' && (
        <div className="px-5 py-3 border-b border-[#1c2a3e]">
          <InterestStatusCard conn={conn} />
        </div>
      )}

      {openError && (
        <div className="px-5 py-2 text-[11px] text-red-400 bg-red-950/20 border-b border-red-900/30">
          {openError}
        </div>
      )}

      {/* Note + actions */}
      <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          {conn.note && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed">{conn.note}</p>}
          {conn.canFounderExpressInterest && <p className="text-[11.5px] text-[color:var(--vv-text-secondary)]">This professional has expressed interest. Express your interest to connect.</p>}
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1">Updated {conn.updatedAt}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {conn.canFounderExpressInterest && (
            <Button size="sm" disabled={opening} onClick={handleFounderInterest}>
              {opening ? 'Expressing Interest...' : 'Express Interest'}
            </Button>
          )}
          {isActionable && (
            <Button size="sm" variant={conn.dealId ? 'primary' : 'secondary'} onClick={handlePrimaryAction} disabled={opening}>
              {opening ? 'Opening…' :
               conn.status === 'mutual_interest' ? 'Open Deal Room' : 'View'}
            </Button>
          )}
          {conn.canReciprocate && <Button size="sm" disabled={opening} onClick={async () => {
            setOpening(true);
            setOpenError(null);
            try {
              await api.post(`/api/me/businesses/${conn.businessId}/reciprocal-interest`, { role: conn.participantRole });
              onChanged();
            } catch (err: any) { setOpenError(err.message || 'Unable to reciprocate interest.'); }
            finally { setOpening(false); }
          }}>Reciprocate interest</Button>}
          {isWaiting && !conn.canReciprocate && !conn.canFounderExpressInterest && (
            <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">Awaiting response…</span>
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
                  {done ? '✓' : i + 1}
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

type Filter = 'all' | 'active' | 'pending' | 'completed';

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active Deals' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
];

function matchesFilter(conn: Connection, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return ['deal_room', 'nda_signed', 'negotiating', 'agreement', 'active', 'mutual_interest'].includes(conn.status);
  if (filter === 'pending') return ['interest_sent'].includes(conn.status);
  if (filter === 'completed') return conn.status === 'completed';
  return true;
}

// --- Main component ------------------------------------------------------------

export default function Connections() {
  const { role: activeRole } = useRole();
  const location = useLocation();
  const role = location.pathname.match(/^\/app\/(founder|investor|professional)\/connections/)?.[1] ?? activeRole;
  const [revision, setRevision] = useState(0);
  const founderRefreshPending = useRef(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => { setPage(1); }, [role]);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api.connections.list(role, page).then(result => {
      if (!mounted) return;
      const stages: Record<string, ConnectionStatus> = {
        matched: 'mutual_interest', interest_confirmed: 'mutual_interest', deal_room_opened: 'deal_room',
        nda_signed: 'nda_signed', negotiation: 'negotiating', agreement: 'agreement',
        milestone_funding_active: 'active', completed: 'completed',
      };
      setConnections(result.items.map((item: ConnectionItem): Connection => {
        const counterpart = role === 'founder' ? item.counterparty : item.founder;
        return {
          id: `${item.business.id}-${item.counterparty.id}-${item.counterparty_role}`,
          connectionId: item.connection_id,
          businessId: item.business.id,
          counterpartyId: item.counterparty.id,
          counterpartyRole: item.counterparty_role,
          canFounderExpressInterest: role === 'founder' && item.counterparty_role === 'professional'
            && item.has_counterparty_interest === true && item.has_founder_interest === false
            && item.is_mutual === false && item.is_connected === false && !item.deal,
          canReciprocate: role !== 'founder' && item.has_founder_interest && !item.has_counterparty_interest && !item.is_connected,
          participantRole: role === 'founder' ? undefined : item.counterparty_role,
          counterpartName: counterpart.name,
          counterpartInitials: counterpart.name.split(' ').map(n => n[0]).join('').slice(0, 2),
          counterpartRole: role === 'founder' ? item.counterparty_role : 'founder',
          businessName: item.business.name, businessInitials: item.business.name.slice(0, 2),
          status: item.deal ? stages[item.deal.stage] ?? 'deal_room' : item.is_connected ? 'mutual_interest' : 'interest_sent',
          updatedAt: item.connected_at ? new Date(item.connected_at).toLocaleDateString() : 'Pending mutual interest',
          kind: item.counterparty_role === 'investor' ? 'investment' : 'professional',
          dealId: item.deal ? String(item.deal.id) : undefined,
        };
      }));
      setLastPage(result.pagination.last_page);
      founderRefreshPending.current = false;
    }).catch(err => { if (mounted) setError(founderRefreshPending.current
      ? `Interest was submitted, but connections could not be refreshed. Refresh the page to confirm the current status. ${err.message || ''}`
      : err.message || 'Unable to load connections.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [role, page, revision]);

  const filtered = connections.filter(c => matchesFilter(c, filter));

  const activeCount = connections.filter(c =>
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
          <strong>Simulation platform</strong> – All deal flows, investments and agreements on Vault Ventures are simulated. No real capital transfers occur.
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
                {connections.filter(c => matchesFilter(c, opt.id)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {lastPage > 1 && <div className="flex gap-3 mb-4">
        <Button disabled={loading || page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span>Page {page} of {lastPage}</span>
        <Button disabled={loading || page === lastPage} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>}
      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : error ? <p role="alert">{error}</p> : filtered.length === 0 && filter === 'all' ? (
        <EmptyState role={role} />
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">No connections match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(conn => (
            <ConnectionCard key={conn.id} conn={conn} onChanged={(founderInterestSubmitted) => {
              founderRefreshPending.current = founderInterestSubmitted === true;
              setRevision(r => r + 1);
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
