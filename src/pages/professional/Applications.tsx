import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api, ConnectionItem } from '../../services/api';

// --- Types --------------------------------------------------------------------

type AppStatus = 'submitted' | 'under_review' | 'interview' | 'offer' | 'joined' | 'accepted' | 'rejected' | 'withdrawn';

interface AppItem {
  id: string;
  businessId: number | string;
  business: string;
  businessInitials: string;
  industry: string;
  opportunity: string;
  role: string;
  appliedDate: string;
  lastUpdated: string;
  status: AppStatus;
  isMutual: boolean;
  isConnected: boolean;
  dealId?: number;
  dealStage?: string;
  timeline: { action: string; ts: string }[];
  note: string;
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Applied' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'joined', label: 'Joined' },
  { key: 'rejected', label: 'Not Selected' },
  { key: 'withdrawn', label: 'Withdrawn' },
];

export default function ProfessionalApplications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<AppItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadApplications() {
      setLoading(true);
      try {
        const res = await api.connections.list('professional');
        if (!isMounted) return;

        const rawItems: ConnectionItem[] = Array.isArray(res) ? res : res?.items || [];
        // Strictly filter to professional counterparty role
        const professionalItems = rawItems.filter(item => !item.counterparty_role || item.counterparty_role === 'professional');

        const appList: AppItem[] = professionalItems.map(item => {
          const isJoined = Boolean(item.is_connected || item.deal || item.is_mutual);
          const status: AppStatus = isJoined ? 'joined' : 'submitted';
          const appliedDate = item.connected_at
            ? new Date(item.connected_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Recently';

          return {
            id: String(item.connection_id ?? item.business?.id ?? Math.random()),
            businessId: item.business?.id,
            business: item.business?.name || 'Venture Opportunity',
            businessInitials: (item.business?.name || 'VO').substring(0, 2).toUpperCase(),
            industry: 'Advisory & Growth',
            opportunity: 'Professional Advisory & Engagement',
            role: 'Professional Advisor',
            appliedDate,
            lastUpdated: appliedDate,
            status,
            isMutual: Boolean(item.is_mutual),
            isConnected: Boolean(item.is_connected),
            dealId: item.deal?.id,
            dealStage: item.deal?.stage,
            timeline: [
              { action: 'Expressed interest / Applied', ts: appliedDate },
              ...(item.is_mutual ? [{ action: 'Founder reciprocated interest', ts: appliedDate }] : []),
              ...(item.is_connected ? [{ action: 'Connection established', ts: appliedDate }] : []),
            ],
            note: item.is_connected
              ? 'Active connection established with founder'
              : item.is_mutual
              ? 'Mutual interest confirmed'
              : 'Application pending founder review',
          };
        });

        setApplications(appList);
      } catch (e) {
        if (isMounted) setApplications([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadApplications();
    return () => { isMounted = false; };
  }, []);

  const filtered = applications.filter(app => {
    const matchFilter = filter === 'all' || app.status === filter;
    const matchSearch = !search ||
      app.business.toLowerCase().includes(search.toLowerCase()) ||
      app.opportunity.toLowerCase().includes(search.toLowerCase()) ||
      app.industry.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6">

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/app/professional/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Dashboard
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Applications & Engagements</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Applications & Engagements
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Track your professional advisory proposals, discovery connections, and deal engagements.
          </p>
        </div>
        <Button onClick={() => navigate('/app/professional/discover')}>
          Find Opportunities
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 p-1 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-[#C67A4E] text-white shadow-sm'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#35446A] pointer-events-none">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] p-12 text-center bg-[#121A2B]">
          <div className="animate-spin w-6 h-6 border-2 border-[#C67A4E] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-[13px] text-[color:var(--vv-text-secondary)]">Loading applications...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="rounded-[14px] border border-[color:var(--vv-border)] p-5 bg-[#121A2B] hover:border-[#C67A4E]/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center text-[13px] font-bold text-[#C67A4E]">
                    {item.businessInitials}
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-[color:var(--vv-text)]">{item.business}</h2>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">{item.opportunity} &bull; {item.industry}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                    item.status === 'joined'
                      ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.22)] text-[#22C55E]'
                      : 'bg-[rgba(198,122,78,0.08)] border-[rgba(198,122,78,0.22)] text-[#C67A4E]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'joined' ? 'bg-[#22C55E]' : 'bg-[#C67A4E]'}`} />
                    {item.status === 'joined' ? 'Connected / Joined' : 'Applied'}
                  </span>
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Applied: {item.appliedDate}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[color:var(--vv-border)] flex items-center justify-between gap-2">
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] italic">
                  {item.note}
                </p>
                <div className="flex items-center gap-2">
                  {item.businessId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/app/businesses/${item.businessId}`)}
                    >
                      View Business
                    </Button>
                  )}
                  {item.isConnected && (
                    <Button
                      size="sm"
                      onClick={() => navigate(item.dealId ? `/app/deal-room?dealId=${item.dealId}` : '/app/deal-room')}
                    >
                      Deal Room
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] p-12 text-center bg-[#121A2B]">
          <div className="w-12 h-12 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-4 text-[#C67A4E]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">
            No Active Applications
          </p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-6">
            You currently have no submitted application proposals. Browse businesses seeking advisory expertise in the Discovery section or access active collaborative Deal Rooms.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => navigate('/app/professional/discover')}>
              Browse Discovery
            </Button>
            <Button variant="secondary" onClick={() => navigate('/app/deal-room')}>
              Open Deal Room
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
