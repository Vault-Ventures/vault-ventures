import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  api,
  ApiError,
  ReputationSummaryData,
  DealFeedbackItem,
} from '../../services/api';

function fmtBDT(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n) || 0 : n || 0;
  return '৳ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ActiveDealItem {
  id: number | string;
  businessId: number | string;
  businessName: string;
  industry: string;
  stage: string;
  investmentType: string;
  connectionStatus: string;
  dealId?: number;
}

export default function Portfolio() {
  const navigate = useNavigate();
  const [reputation, setReputation] = useState<ReputationSummaryData | null>(null);
  const [activeDeals, setActiveDeals] = useState<ActiveDealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [repRes, recsRes] = await Promise.all([
        api.reputation.get('investor').catch(() => null),
        api.recommendations.businesses().catch(() => []),
      ]);

      setReputation(repRes);

      // Extract connected opportunities from recommendations
      const connectedItems: ActiveDealItem[] = (recsRes || [])
        .filter((rec: any) => rec.connection_status && rec.connection_status !== 'none')
        .map((rec: any) => ({
          id: rec.id || rec.business_id,
          businessId: rec.id || rec.business_id,
          businessName: rec.name || rec.business_name || 'Enterprise',
          industry: rec.industry || 'Technology',
          stage: rec.business_stage || rec.stage || 'Active',
          investmentType: rec.investment_type || 'Standard Equity / P&L',
          connectionStatus: rec.connection_status || 'Active',
          dealId: rec.deal_id,
        }));

      setActiveDeals(connectedItems);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load investment portfolio.');
      } else {
        setError('Unable to connect to investment portfolio services.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completedReviews: DealFeedbackItem[] = reputation?.feedback?.reviews || [];

  const filteredActive = activeDeals.filter(
    d =>
      !search ||
      d.businessName.toLowerCase().includes(search.toLowerCase()) ||
      d.industry.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCompleted = completedReviews.filter(
    r =>
      !search ||
      (r.business_name && r.business_name.toLowerCase().includes(search.toLowerCase())) ||
      (r.reviewer_name && r.reviewer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSimulatedBDT = reputation?.track_record?.total_simulated_bdt
    ? fmtBDT(reputation.track_record.total_simulated_bdt)
    : '৳ 0.00';

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/investor/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Dashboard
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Portfolio</span>
      </div>

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Investment Portfolio
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Track active deals, completed investments, and verified ledger deployments.
          </p>
        </div>
        <div className="relative flex-shrink-0 w-full sm:w-56">
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#5E6D8F"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search portfolio..."
            className="w-full pl-9 pr-4 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none"
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-800/60 text-red-300 text-[12.5px]">
          {error}
        </div>
      )}

      {/* Summary Strip */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-[12px] border border-[color:var(--vv-border)] p-4 animate-pulse bg-[#121A2B]">
              <div className="h-6 w-12 rounded bg-[color:var(--vv-raised)] mb-2" />
              <div className="h-3 w-20 rounded bg-[color:var(--vv-raised)]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-[12px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
            <p className="font-display text-[22px] font-bold text-[#C67A4E] font-mono leading-none mb-1">
              {activeDeals.length}
            </p>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Active Deals</p>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">In pipeline</p>
          </div>

          <div className="rounded-[12px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
            <p className="font-display text-[22px] font-bold text-[#22C55E] font-mono leading-none mb-1">
              {reputation?.track_record?.completed_deals_count ?? 0}
            </p>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Completed Deals</p>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Fully released</p>
          </div>

          <div className="rounded-[12px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
            <p className="font-display text-[22px] font-bold text-[#C9A24B] font-mono leading-none mb-1">
              {reputation?.track_record?.completed_milestones_count ?? 0}
            </p>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Milestones Funded</p>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Verified tranches</p>
          </div>

          <div className="rounded-[12px] border border-[color:var(--vv-border)] p-4 bg-[#121A2B]">
            <p className="font-display text-[16px] sm:text-[18px] font-bold text-[#22C55E] font-mono leading-none mb-1 truncate">
              {totalSimulatedBDT}
            </p>
            <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">Capital Deployed</p>
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Simulated volume</p>
          </div>
        </div>
      )}

      {/* Simulation Disclaimer */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-[10px]"
        style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.2)' }}
      >
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="#C67A4E"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="flex-shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
        <p className="text-[11.5px] text-[#C67A4E]">
          <span className="font-semibold">Simulated Environment</span> — Milestone disbursements, revenue tracking, and deal amounts are simulated in Bangladeshi Taka (BDT / ৳). No real-world banking custody is involved.
        </p>
      </div>

      {/* Active Deals Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">
            Active Investment Engagements
          </h2>
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">
            {filteredActive.length} active deal{filteredActive.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[13px] text-[color:var(--vv-text-tertiary)]">
            Loading active investment pipeline...
          </div>
        ) : filteredActive.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B]">
            <p className="text-[14px] font-semibold text-[color:var(--vv-text)] mb-1">
              No active deals{search ? ' matching your search' : ''}
            </p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4 max-w-sm">
              Explore businesses seeking investment and establish connections to initiate deal rooms.
            </p>
            <Button onClick={() => navigate('/app/investor/discover')} size="sm">
              Discover Opportunities
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActive.map(item => (
              <div
                key={item.id}
                className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B] p-5 space-y-4 transition-all hover:border-[#2E3E5E]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[color:var(--vv-text)]">
                      {item.businessName}
                    </h3>
                    <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                      {item.industry} • {item.stage}
                    </p>
                  </div>
                  <Badge variant="info">{item.connectionStatus.replace('_', ' ').toUpperCase()}</Badge>
                </div>

                <div className="p-3 rounded-[8px] bg-[#1A2338] border border-[color:var(--vv-border)] text-[12px]">
                  <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">
                    Investment Structure
                  </p>
                  <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] mt-0.5">
                    {item.investmentType}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-[color:var(--vv-border)]">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (item.dealId) {
                        navigate(`/app/deals/${item.dealId}`);
                      } else {
                        navigate('/app/deal-room');
                      }
                    }}
                  >
                    Open Deal Room
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/app/businesses/${item.businessId}`)}
                  >
                    Business Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Deals Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">
            Completed Deals & Verified Records
          </h2>
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">
            {filteredCompleted.length} record{filteredCompleted.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[13px] text-[color:var(--vv-text-tertiary)]">
            Loading verified completed records...
          </div>
        ) : filteredCompleted.length === 0 ? (
          <div className="py-10 text-center rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B]">
            <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">
              No completed deals{search ? ' matching your search' : ''} on record yet.
            </p>
          </div>
        ) : (
          <div className="rounded-[14px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B] divide-y divide-[color:var(--vv-border)]">
            {filteredCompleted.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">
                      {item.business_name || 'Completed Investment Deal'}
                    </p>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
                    Partner: {item.reviewer_name || 'Founder'}
                    {item.deal_id ? ` • Deal #${item.deal_id}` : ''}
                    {item.submitted_at ? ` • Finalized on ${new Date(item.submitted_at).toLocaleDateString()}` : ''}
                  </p>
                  {item.comment && (
                    <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] italic mt-1">
                      &ldquo;{item.comment}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (item.deal_id) {
                        navigate(`/app/deals/${item.deal_id}`);
                      } else {
                        navigate('/app/investor/reputation');
                      }
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
