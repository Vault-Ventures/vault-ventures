import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

// --- Types & Status Config ---------------------------------------------------

type SavedStatus = 'saved' | 'interest_sent' | 'in_deal' | 'completed';

interface SavedItem {
  id: string;
  name: string;
  initials: string;
  industry: string;
  stage: string;
  description: string;
  match: number;
  funding: string;
  savedDate: string;
  status: SavedStatus;
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'saved', label: 'Saved' },
  { key: 'interest_sent', label: 'Interest Sent' },
  { key: 'in_deal', label: 'In Deal Room' },
  { key: 'completed', label: 'Completed' },
];

export default function SavedOpportunities() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadSaved() {
      setLoading(true);
      try {
        const recs = await api.recommendations.businesses('investor');
        if (recs && recs.length > 0 && isMounted) {
          // Check for any expressed or saved items
          const savedList: SavedItem[] = [];
          for (const b of recs.slice(0, 5)) {
            try {
              const statusRes = await api.businesses.getConnectionStatus(b.id);
              if (statusRes && statusRes.status && statusRes.status !== 'none') {
                const raw = b.funding_amount_cents ? b.funding_amount_cents / 100 : (b.funding_amount || 2500000);
                const s = statusRes.status === 'deal_active' ? 'in_deal' : statusRes.status === 'completed' ? 'completed' : 'interest_sent';
                savedList.push({
                  id: String(b.id),
                  name: b.name || 'Startup',
                  initials: (b.name || 'ST').substring(0, 2).toUpperCase(),
                  industry: b.industry || 'Technology',
                  stage: b.stage || 'Seed',
                  description: b.tagline || b.short_description || 'High-growth Bangladesh opportunity',
                  match: b.match_score ?? 85,
                  funding: `৳${(raw / 100000).toFixed(0)}L`,
                  savedDate: 'Recently',
                  status: s as SavedStatus,
                });
              }
            } catch (e) {}
          }
          if (isMounted) setItems(savedList);
        }
      } catch (e) {
        // empty list
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSaved();
    return () => { isMounted = false; };
  }, []);

  const filtered = items.filter(item => {
    const matchTab = activeTab === 'all' || item.status === activeTab;
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.industry.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6">

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/app/investor/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Dashboard
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Saved Opportunities</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Saved Opportunities
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Track and monitor curated business opportunities from your discovery pipeline.
          </p>
        </div>
        <Button onClick={() => navigate('/app/investor/discover')}>
          Explore Discovery
        </Button>
      </div>

      {/* Filter bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#C67A4E] text-white shadow-sm'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
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
            placeholder="Filter saved businesses..."
            className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="rounded-[14px] border overflow-hidden transition-all hover:border-[#2E3E5E] p-5"
              style={{ background: 'rgba(26,28,29,0.85)', borderColor: '#2B2D2F' }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 flex-shrink-0 rounded-[10px] flex items-center justify-center text-[12px] font-bold text-[#C67A4E] bg-[#C67A4E]/10 border border-[#C67A4E]/20">
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] truncate">{item.name}</p>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{item.industry} • {item.stage}</p>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">{item.description}</p>
              <div className="flex items-center justify-between text-[11.5px] pt-3 border-t border-[color:var(--vv-border)]">
                <span className="text-[color:var(--vv-text-secondary)]">Seeking: {item.funding}</span>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                  className="text-rose-400 hover:underline text-[11px]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] p-12 text-center bg-[#121A2B]">
          <div className="w-12 h-12 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-4 text-[#C67A4E]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">
            No Saved Opportunities
          </p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-6">
            You currently have no saved businesses. Discover high-match Bangladesh ventures and initiate connections directly from the Discovery portal.
          </p>
          <Button onClick={() => navigate('/app/investor/discover')}>
            Browse Discovery Opportunities
          </Button>
        </div>
      )}
    </div>
  );
}