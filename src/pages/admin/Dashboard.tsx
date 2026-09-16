import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconCheck, IconX, IconEye, IconAlertTriangle, IconShield, IconUsers,
  IconSearch, IconFileText, IconBuilding, IconStar, IconTrendingUp,
} from '../../components/layout/Icons';
import { api, AdminFinancialGovernanceOverviewData, AdminVerificationRequestData, FinancialReportItem } from '../../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [governance, setGovernance] = useState<AdminFinancialGovernanceOverviewData | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<AdminVerificationRequestData[]>([]);
  const [recentReports, setRecentReports] = useState<FinancialReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadAdminData() {
      try {
        setLoading(true);
        setError(null);
        const [govRes, verifRes, reportsRes] = await Promise.all([
          api.admin.financialReports.getGovernance().catch(() => null),
          api.admin.verificationRequests.list().catch(() => []),
          api.admin.financialReports.list({ per_page: 5 }).catch(() => ({ reports: [] })),
        ]);

        if (mounted) {
          setGovernance(govRes);
          setVerificationQueue(Array.isArray(verifRes) ? verifRes : []);
          setRecentReports(reportsRes?.reports || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load admin metrics from server.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAdminData();
    return () => {
      mounted = false;
    };
  }, []);

  const pendingVerifs = verificationQueue.filter(v => v.status === 'pending' || v.status === 'under_review' || v.status === 'needs_information');

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Admin Console</h1>
            <Badge variant="neutral">System Oversight</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Platform governance, verification review, financial reporting audit, and reputation integrity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/app/admin/verification')}>
            Verification Queue ({pendingVerifs.length})
          </Button>
          <Button size="sm" onClick={() => navigate('/app/admin/financial-governance')}>
            Financial Governance
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[13px]">
          {error}
        </div>
      )}

      {/* Top Governance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">Pending Verifications</span>
            <IconShield s={16} className="text-[#F59E0B]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#F59E0B] tabular-nums">
            {loading ? '—' : pendingVerifs.length}
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">Tier 1 requests requiring review</p>
        </div>

        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">Financial Reports</span>
            <IconFileText s={16} className="text-[#C67A4E]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[color:var(--vv-text)] tabular-nums">
            {loading ? '—' : governance?.overview?.total_financial_reports_count ?? recentReports.length}
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">
            {governance?.verification_pipeline?.verified_count ? `${governance.verification_pipeline.verified_count} verified` : 'Audited submissions'}
          </p>
        </div>

        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">Flagged Discrepancies</span>
            <IconAlertTriangle s={16} className="text-[#F04438]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#F04438] tabular-nums">
            {loading ? '—' : governance?.discrepancy_queue?.pending_under_review_count ?? 0}
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">Open financial flags</p>
        </div>

        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)] uppercase tracking-wider font-semibold">Platform Currency</span>
            <span className="text-xs font-bold text-[#22C55E]">BDT</span>
          </div>
          <p className="font-mono text-2xl font-bold text-[#22C55E] tabular-nums">
            ৳ BDT
          </p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">Bangladesh standard legal tender</p>
        </div>
      </div>

      {/* 2-Column Grid: Active Verification Requests & Recent Financial Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Verification Queue Section */}
        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[color:var(--vv-border)] mb-4">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Active Verification Requests</h2>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Live queue from authentication and accreditation engine</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/app/admin/verification')}>
              View All
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">Loading queue...</div>
          ) : pendingVerifs.length === 0 ? (
            <div className="py-12 text-center text-[12.5px] text-[color:var(--vv-text-tertiary)]">
              No pending verification requests in the queue.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVerifs.slice(0, 5).map(req => (
                <div
                  key={req.id}
                  onClick={() => navigate('/app/admin/verification')}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#1c2a3e] bg-[color:color-mix(in_srgb,var(--vv-raised)_30%,transparent)] hover:border-[#C67A4E]/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#1c2a3e] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                      {(req.user?.name || 'U')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] truncate">{req.user?.name || `User #${req.user_id}`}</p>
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">{req.user?.email || `Req #${req.id}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={req.status === 'under_review' ? 'info' : req.status === 'needs_information' ? 'warning' : 'neutral'}>
                      {req.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Reports Audit Section */}
        <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[color:var(--vv-border)] mb-4">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Recent Financial Submissions</h2>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">Audited revenue and expense reports from deal rooms</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/app/admin/financial-reports')}>
              View All
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">Loading reports...</div>
          ) : recentReports.length === 0 ? (
            <div className="py-12 text-center text-[12.5px] text-[color:var(--vv-text-tertiary)]">
              No financial reports submitted yet across deals.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.slice(0, 5).map(rep => (
                <div
                  key={rep.id}
                  onClick={() => navigate('/app/admin/financial-reports')}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#1c2a3e] bg-[color:color-mix(in_srgb,var(--vv-raised)_30%,transparent)] hover:border-[#C67A4E]/30 transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] truncate">{rep.business_name || `Business #${rep.business_id}`}</p>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                      Period: {rep.reporting_period_start} — {rep.reporting_period_end}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <p className="font-mono text-[12px] font-semibold text-[#22C55E]">
                        ৳{Number(rep.revenue).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{rep.status_label || rep.status}</p>
                    </div>
                    <Badge variant={rep.status === 'verified' ? 'success' : rep.status === 'disputed' ? 'danger' : 'warning'}>
                      {rep.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick Access Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => navigate('/app/admin/verification')}
          className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B] hover:border-[#C67A4E]/40 text-left transition-all"
        >
          <IconShield s={18} className="text-[#C67A4E] mb-2" />
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Verification</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Tier 1 adjudication</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/admin/financial-reports')}
          className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B] hover:border-[#C67A4E]/40 text-left transition-all"
        >
          <IconFileText s={18} className="text-[#22C55E] mb-2" />
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Financial Reports</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Audit & discrepancies</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/admin/reputation')}
          className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B] hover:border-[#C67A4E]/40 text-left transition-all"
        >
          <IconStar s={18} className="text-[#F59E0B] mb-2" />
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Reputation Audit</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Participant scores</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/admin/settings')}
          className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B] hover:border-[#C67A4E]/40 text-left transition-all"
        >
          <IconBuilding s={18} className="text-[#5E6D8F] mb-2" />
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Platform Settings</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Immutable parameters</p>
        </button>
      </div>

    </div>
  );
}