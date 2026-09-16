import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconStar, IconSearch, IconShield, IconCheck, IconAlertTriangle } from '../../components/layout/Icons';
import { api, AdminUserReputationData, ReputationSummaryData } from '../../services/api';

export default function AdminReputation() {
  const [userIdInput, setUserIdInput] = useState('1');
  const [reputationData, setReputationData] = useState<AdminUserReputationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e?: React.FormEvent, overrideId?: string) => {
    if (e) e.preventDefault();
    const id = (overrideId ?? userIdInput).trim();
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.admin.reputation.getUser(id);
      setReputationData(data);
    } catch (err: any) {
      setError(err.message || `Failed to retrieve reputation records for User #${id}`);
      setReputationData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLookup(undefined, '1');
  }, []);

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Reputation Audit</h1>
            <Badge variant="neutral">Computed Authority</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Audit objective, multi-dimensional reputation scores and verified track records for any platform user.
          </p>
        </div>
      </div>

      {/* User Search Bar */}
      <form onSubmit={handleLookup} className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#35446A] pointer-events-none">
            <IconSearch s={14} />
          </span>
          <input
            type="number"
            min="1"
            value={userIdInput}
            onChange={e => setUserIdInput(e.target.value)}
            placeholder="Enter User ID (e.g. 1)"
            className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none"
          />
        </div>
        <Button size="sm" onClick={() => handleLookup()} disabled={loading || !userIdInput.trim()}>
          {loading ? 'Auditing...' : 'Audit User'}
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[13px]">
          {error}
        </div>
      )}

      {/* Results */}
      {reputationData ? (
        <div className="space-y-6">
          {/* User Overview Card */}
          <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[color:var(--vv-raised)] p-5">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[color:var(--vv-border)] mb-4">
              <div>
                <p className="text-[15px] font-semibold text-[color:var(--vv-text)] font-display">{reputationData.user.name}</p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] font-mono">{reputationData.user.email} • ID: {reputationData.user.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Tier {reputationData.user.verification_tier} Verified</Badge>
                {reputationData.user.roles.map(r => (
                  <span key={r} className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#C67A4E]/10 border border-[#C67A4E]/30 text-[#C67A4E]">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Role-Specific Reputation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(reputationData.reputation_by_role || {}).map(([role, summary]: [string, ReputationSummaryData]) => {
                const dealsCount = summary.track_record?.completed_deals_count ?? 0;
                const milestonesCount = summary.track_record?.completed_milestones_count ?? 0;
                const reviewsCount = summary.feedback?.reviews_count ?? 0;
                const avgRating = summary.feedback?.average_rating;
                return (
                  <div key={role} className="rounded-xl border border-[color:var(--vv-border)] bg-[color:var(--vv-surface)] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[color:var(--vv-text)] uppercase tracking-wider capitalize">
                        {role} Track Record
                      </span>
                      <span className="font-mono text-sm font-bold text-[#C67A4E]">
                        Tier {summary.verification?.tier ?? 0}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                      <div className="flex justify-between">
                        <span>Completed Deals:</span>
                        <span className="font-mono font-semibold text-[color:var(--vv-text)]">{dealsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Milestones:</span>
                        <span className="font-mono font-semibold text-[color:var(--vv-text)]">{milestonesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Feedback Score:</span>
                        <span className="font-mono font-semibold text-[color:var(--vv-text)]">
                          {reviewsCount > 0 ? `${avgRating ?? 0}/5.0 (${reviewsCount})` : 'No feedback yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[color:var(--vv-raised)] p-12 text-center">
          <IconStar s={32} className="mx-auto mb-3 text-[#C67A4E]" />
          <p className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">
            Participant Reputation Lookup
          </p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto">
            Enter any User ID to retrieve authentic, backend-calculated reputation summaries and milestone track records.
          </p>
        </div>
      )}
    </div>
  );
}