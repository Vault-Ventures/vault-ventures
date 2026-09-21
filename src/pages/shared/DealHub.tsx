import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { api, type DealListItem, type DealListResponse } from '../../services/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconShield,
  IconAlertTriangle,
  IconBriefcase,
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconGrid,
  IconList,
  IconBuilding,
  IconUsers,
  IconX,
} from '../../components/layout/Icons';

const DEAL_STAGES = [
  { order: 1, key: 'matched', label: 'Matched' },
  { order: 2, key: 'interest_confirmed', label: 'Interest Confirmed' },
  { order: 3, key: 'deal_room', label: 'Deal Room' },
  { order: 4, key: 'nda_signed', label: 'NDA Signed' },
  { order: 5, key: 'negotiation', label: 'Negotiation' },
  { order: 6, key: 'agreement', label: 'Agreement' },
  { order: 7, key: 'milestone_funding_active', label: 'Milestone Funding Active' },
  { order: 8, key: 'completed', label: 'Completed' },
];

function getStageBadgeVariant(stageOrder: number): 'success' | 'accent' | 'warning' | 'neutral' {
  if (stageOrder >= 8) return 'success';
  if (stageOrder >= 6) return 'accent';
  if (stageOrder >= 4) return 'warning';
  return 'neutral';
}

function getNextActionHint(stageOrder: number): string {
  switch (stageOrder) {
    case 1:
      return 'Mutual interest registered — prepare for deal opening';
    case 2:
      return 'Interest confirmed — open deal room to proceed';
    case 3:
      return 'Review mutual NDA and introductory disclosures';
    case 4:
      return 'NDA active — begin proposal terms negotiation';
    case 5:
      return 'Review, counter, or approve negotiation terms';
    case 6:
      return 'Generate and execute bilateral deal agreement';
    case 7:
      return 'Milestone funding active — monitor and fulfill tranches';
    case 8:
      return 'Deal completed — all milestones executed';
    default:
      return 'Review deal room workspace';
  }
}

export default function DealHub() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { user } = useAuth();

  const [deals, setDeals] = useState<DealListItem[]>([]);
  const [pagination, setPagination] = useState<DealListResponse['pagination'] | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'grid' | 'pipeline'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string>('all');

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roleParam = role === 'investor' || role === 'professional' ? role : undefined;
      const res = await api.deals.list({ role: roleParam, page, per_page: 30 });
      setDeals(res?.items || []);
      setPagination(res?.pagination || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal rooms.');
    } finally {
      setLoading(false);
    }
  }, [role, page]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleOpenDeal = (dealId: number) => {
    navigate(`/app/deals/${dealId}`);
  };

  const connectionsRoute = role ? `/app/${role}/connections` : '/app/connections';

  // Extract unique businesses for multi-business filtering
  const uniqueBusinesses = useMemo(() => {
    const map = new Map<number, string>();
    deals.forEach((d) => {
      if (d.business?.id && d.business?.name) {
        map.set(d.business.id, d.business.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [deals]);

  // Filter deals based on search query, stage, and business
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const businessName = deal.business?.name || '';
      const isFounder = user?.id === deal.founder_user_id;
      const counterpartyName = isFounder
        ? deal.counterparty?.name || ''
        : deal.founder?.name || '';
      const industry = deal.business?.industry || '';
      const stageLabel = deal.stage_label || deal.stage || '';

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText =
          businessName.toLowerCase().includes(query) ||
          counterpartyName.toLowerCase().includes(query) ||
          industry.toLowerCase().includes(query) ||
          stageLabel.toLowerCase().includes(query) ||
          `deal #${deal.id}`.includes(query);
        if (!matchesText) return false;
      }

      // Stage filter
      if (stageFilter !== 'all') {
        const targetOrder = Number(stageFilter);
        if (deal.stage_order !== targetOrder) return false;
      }

      // Business filter
      if (businessFilter !== 'all') {
        const targetBusinessId = Number(businessFilter);
        if (deal.business_id !== targetBusinessId) return false;
      }

      return true;
    });
  }, [deals, searchQuery, stageFilter, businessFilter, user]);

  const hasActiveFilters = searchQuery.trim() !== '' || stageFilter !== 'all' || businessFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setBusinessFilter('all');
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1626] text-[color:var(--vv-text)] p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1c2a3e] mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E]">
              <IconShield s={16} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--vv-text)] font-display">
              Deal Rooms
            </h1>
            {!loading && !error && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#121A2B] border border-[#1c2a3e] text-[color:var(--vv-text-secondary)]">
                {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[color:var(--vv-text-tertiary)] max-w-2xl leading-relaxed">
            Centralized workspace to monitor, filter, and access all active deal rooms across your businesses and counterparties.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          {/* View Toggle */}
          <div className="flex items-center bg-[#121A2B] border border-[#1c2a3e] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#1C283E] text-[color:var(--vv-text)] shadow-sm'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
              title="Card Grid View"
            >
              <IconGrid s={14} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'pipeline'
                  ? 'bg-[#1C283E] text-[color:var(--vv-text)] shadow-sm'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
              title="Stage Pipeline View"
            >
              <IconList s={14} />
              <span>Pipeline</span>
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={() => navigate(connectionsRoute)}>
            View Connections
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      {!loading && !error && deals.length > 0 && (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6 p-3 bg-[#121A2B] border border-[#1c2a3e] rounded-lg">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch s={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search deals, businesses, counterparties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-[#0D1626] border border-[#1c2a3e] rounded-md text-xs text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"
                >
                  <IconX s={13} />
                </button>
              )}
            </div>

            {/* Stage Filter */}
            <div className="flex items-center gap-2">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="h-9 px-3 bg-[#0D1626] border border-[#1c2a3e] rounded-md text-xs text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors cursor-pointer"
              >
                <option value="all">All Deal Stages</option>
                {DEAL_STAGES.map((s) => (
                  <option key={s.order} value={s.order}>
                    {s.order}. {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Filter for Multi-Business Founders */}
            {uniqueBusinesses.length > 1 && (
              <div className="flex items-center gap-2">
                <select
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value)}
                  className="h-9 px-3 bg-[#0D1626] border border-[#1c2a3e] rounded-md text-xs text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E] transition-colors cursor-pointer"
                >
                  <option value="all">All Businesses ({uniqueBusinesses.length})</option>
                  {uniqueBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#C67A4E] hover:underline self-end lg:self-center font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-16 my-auto text-center" data-testid="deal-hub-loading">
          <div className="w-8 h-8 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-medium text-[color:var(--vv-text)]">Loading Deal Rooms...</p>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1">Retrieving accessible deals</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center p-8 my-auto text-center bg-[#121A2B] rounded-xl border border-red-500/20 max-w-lg mx-auto" data-testid="deal-hub-error">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <IconAlertTriangle s={24} />
          </div>
          <h2 className="text-base font-semibold text-[color:var(--vv-text)] mb-1">Unable to Load Deals</h2>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-6">{error}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate(connectionsRoute)}>Go to Connections</Button>
            <Button onClick={fetchDeals}>Retry</Button>
          </div>
        </div>
      )}

      {/* Empty state (no deals at all) */}
      {!loading && !error && deals.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 my-auto text-center bg-[#121A2B] rounded-xl border border-[#1c2a3e] max-w-lg mx-auto" data-testid="deal-hub-empty">
          <div className="w-12 h-12 rounded-full bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E] mb-4">
            <IconBriefcase s={24} />
          </div>
          <h2 className="text-base font-semibold text-[color:var(--vv-text)] mb-1">No Active Deal Rooms</h2>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-6 max-w-sm leading-relaxed">
            You do not have any active deal rooms yet. Deal rooms open automatically when mutual interest is established with a connection.
          </p>
          <Button onClick={() => navigate(connectionsRoute)}>
            Explore Connections
          </Button>
        </div>
      )}

      {/* No search results state */}
      {!loading && !error && deals.length > 0 && filteredDeals.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 my-8 text-center bg-[#121A2B] rounded-xl border border-[#1c2a3e] max-w-md mx-auto">
          <div className="w-10 h-10 rounded-full bg-[#1c2a3e] flex items-center justify-center text-[color:var(--vv-text-tertiary)] mb-3">
            <IconSearch s={18} />
          </div>
          <p className="text-sm font-semibold text-[color:var(--vv-text)] mb-1">No Matching Deals Found</p>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mb-4">
            No deals match your current search and filter criteria.
          </p>
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Reset Filters
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      {!loading && !error && filteredDeals.length > 0 && (
        <div className="space-y-6" data-testid="deal-hub-list">
          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDeals.map((deal) => {
                const businessName = deal.business?.name || 'Business Deal';
                const isFounder = user?.id === deal.founder_user_id;
                const counterpartyName = isFounder
                  ? deal.counterparty?.name || 'Counterparty'
                  : deal.founder?.name || 'Founder';
                const roleDisplay = deal.counterparty_role === 'investor' ? 'Investor' : 'Professional';
                const counterpartyRoleDisplay = isFounder ? roleDisplay : 'Founder';
                const stageLabel = deal.stage_label || deal.stage;
                const nextAction = getNextActionHint(deal.stage_order);

                return (
                  <div
                    key={deal.id}
                    className="flex flex-col justify-between p-5 bg-[#121A2B] hover:bg-[#152035] border border-[#1c2a3e] hover:border-[#2a3c57] rounded-xl transition-all duration-150 group"
                    data-testid={`deal-item-${deal.id}`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#1C283E] border border-[#2a3c57] flex items-center justify-center text-sm font-bold text-[#C67A4E] shrink-0">
                            {businessName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-semibold text-sm text-[color:var(--vv-text)] truncate group-hover:text-[#C67A4E] transition-colors">
                              {businessName}
                            </h2>
                            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] font-mono">
                              Deal #{deal.id}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStageBadgeVariant(deal.stage_order)} dot>
                          {stageLabel}
                        </Badge>
                      </div>

                      {/* Card Meta Details */}
                      <div className="space-y-2 py-3 border-y border-[#1c2a3e] text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[color:var(--vv-text-tertiary)] flex items-center gap-1.5">
                            <IconUsers s={13} />
                            <span>Counterparty</span>
                          </span>
                          <span className="font-medium text-[color:var(--vv-text-secondary)] truncate max-w-[160px]">
                            {counterpartyName} <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">({counterpartyRoleDisplay})</span>
                          </span>
                        </div>

                        {deal.business?.industry && (
                          <div className="flex items-center justify-between">
                            <span className="text-[color:var(--vv-text-tertiary)] flex items-center gap-1.5">
                              <IconBuilding s={13} />
                              <span>Industry</span>
                            </span>
                            <span className="text-[color:var(--vv-text-secondary)] truncate max-w-[160px]">
                              {deal.business.industry}
                            </span>
                          </div>
                        )}

                        {deal.created_at && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[color:var(--vv-text-tertiary)]">Opened</span>
                            <span className="text-[color:var(--vv-text-tertiary)] font-mono">
                              {new Date(deal.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Next Action Hint */}
                      <div className="pt-3 pb-4">
                        <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold mb-1">
                          Current Stage Focus
                        </p>
                        <p className="text-xs text-[color:var(--vv-text-secondary)] line-clamp-1">
                          {nextAction}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenDeal(deal.id)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <span>Open Room</span>
                        <IconArrowRight s={13} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PIPELINE VIEW (Kanban by Stage) */}
          {viewMode === 'pipeline' && (
            <div className="overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-[#1c2a3e] [&::-webkit-scrollbar-thumb]:rounded">
              <div className="flex gap-4 min-w-max">
                {DEAL_STAGES.map((stage) => {
                  const stageDeals = filteredDeals.filter((d) => d.stage_order === stage.order);

                  return (
                    <div
                      key={stage.order}
                      className="w-72 flex flex-col bg-[#121A2B] border border-[#1c2a3e] rounded-xl overflow-hidden shrink-0"
                    >
                      {/* Column Header */}
                      <div className="p-3.5 border-b border-[#1c2a3e] bg-[#0F1728] flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#1c2a3e] text-[10px] font-bold flex items-center justify-center text-[color:var(--vv-text-secondary)]">
                            {stage.order}
                          </span>
                          <span className="text-xs font-semibold text-[color:var(--vv-text)] truncate" title={stage.label}>
                            {stage.label}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-[#1c2a3e] text-[color:var(--vv-text-tertiary)]">
                          {stageDeals.length}
                        </span>
                      </div>

                      {/* Column Deals List */}
                      <div className="p-3 space-y-3 flex-1 min-h-[220px] max-h-[600px] overflow-y-auto">
                        {stageDeals.length === 0 ? (
                          <div className="h-full flex items-center justify-center p-6 text-center text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                            No deals in this stage
                          </div>
                        ) : (
                          stageDeals.map((deal) => {
                            const businessName = deal.business?.name || 'Business Deal';
                            const isFounder = user?.id === deal.founder_user_id;
                            const counterpartyName = isFounder
                              ? deal.counterparty?.name || 'Counterparty'
                              : deal.founder?.name || 'Founder';
                            const roleDisplay = deal.counterparty_role === 'investor' ? 'Investor' : 'Professional';
                            const counterpartyRoleDisplay = isFounder ? roleDisplay : 'Founder';

                            return (
                              <div
                                key={deal.id}
                                className="p-3.5 bg-[#0D1626] hover:bg-[#142034] border border-[#1c2a3e] hover:border-[#2a3c57] rounded-lg transition-colors group cursor-pointer space-y-2.5"
                                onClick={() => handleOpenDeal(deal.id)}
                                data-testid={`deal-item-${deal.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-semibold text-[color:var(--vv-text)] group-hover:text-[#C67A4E] transition-colors truncate">
                                    {businessName}
                                  </span>
                                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono shrink-0">
                                    #{deal.id}
                                  </span>
                                </div>

                                <div className="text-[11px] text-[color:var(--vv-text-tertiary)] space-y-1">
                                  <p className="truncate">
                                    With <span className="text-[color:var(--vv-text-secondary)] font-medium">{counterpartyName}</span> ({counterpartyRoleDisplay})
                                  </p>
                                  {deal.business?.industry && (
                                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] truncate">
                                      {deal.business.industry}
                                    </p>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-[#1c2a3e]/80 flex items-center justify-between text-[11px]">
                                  <span className="text-[10px] text-[#C67A4E] font-medium flex items-center gap-1 group-hover:underline">
                                    <span>Open Room</span>
                                    <IconArrowRight s={11} />
                                  </span>
                                  {deal.created_at && (
                                    <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">
                                      {new Date(deal.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[#1c2a3e] text-xs text-[color:var(--vv-text-tertiary)]">
              <span>
                Showing Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total deals)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft s={13} />
                  <span>Previous</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                >
                  <span>Next</span>
                  <IconChevronRight s={13} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
