import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

// --- Types --------------------------------------------------------------------

type AppStatus = 'submitted' | 'under_review' | 'interview' | 'offer' | 'joined' | 'accepted' | 'rejected' | 'withdrawn';

interface AppItem {
  id: string;
  business: string;
  businessInitials: string;
  industry: string;
  opportunity: string;
  role: string;
  appliedDate: string;
  lastUpdated: string;
  status: AppStatus;
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
        const recs = await api.recommendations.businesses('professional');
        if (recs && recs.length > 0 && isMounted) {
          const appList: AppItem[] = [];
          for (const b of recs.slice(0, 5)) {
            try {
              const statusRes = await api.businesses.getConnectionStatus(b.id);
              if (statusRes && statusRes.status && statusRes.status !== 'none') {
                appList.push({
                  id: String(b.id),
                  business: b.name || 'Startup',
                  businessInitials: (b.name || 'ST').substring(0, 2).toUpperCase(),
                  industry: b.industry || 'Technology',
                  opportunity: b.tagline || 'Advisory Engagement',
                  role: 'Professional Advisor',
                  appliedDate: 'Recently',
                  lastUpdated: 'Recently',
                  status: (statusRes.status === 'deal_active' ? 'joined' : 'submitted') as AppStatus,
                  timeline: [{ action: 'Application submitted', ts: 'Recently' }],
                  note: 'Connection initiated via Vault Ventures Discovery',
                });
              }
            } catch (e) {}
          }
          if (isMounted) setApplications(appList);
        }
      } catch (e) {
        // empty
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
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="rounded-[14px] border border-[color:var(--vv-border)] p-5 bg-[#121A2B]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-[color:var(--vv-text)]">{item.opportunity}</p>
                  <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">{item.business} • {item.industry}</p>
                </div>
                <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Applied: {item.appliedDate}</span>
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
