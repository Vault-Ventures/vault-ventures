import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconFileText, IconEye, IconAlertTriangle } from '../../components/layout/Icons';
import { api, FinancialReportItem } from '../../services/api';

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<FinancialReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.admin.financialReports.list();
        if (mounted) {
          setReports(res?.reports || []);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load reports from backend.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReports();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Financial Reports & Audits</h1>
            <Badge variant="neutral">Administrative Evidence</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Examine submitted revenue, expense, and discrepancy reports with attached cryptographic evidence.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/app/admin/financial-governance')}>
          Governance Overview
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[13px]">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-[color:var(--vv-text-tertiary)]">
            Loading audited reports from backend...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <IconFileText s={32} className="mx-auto mb-3 text-[color:var(--vv-text-tertiary)]" />
            <p className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">
              No Financial Reports Found
            </p>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto">
              No financial disclosure reports have been submitted across platform deals yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[color:var(--vv-border)]">
                  {['Report ID', 'Business', 'Deal #', 'Period', 'Revenue (৳)', 'Expenses (৳)', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">#{r.id}</td>
                    <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)]">{r.business_name || `Business #${r.business_id}`}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">Deal #{r.deal_id}</td>
                    <td className="px-4 py-3 text-[11.5px] text-[color:var(--vv-text-secondary)]">{r.reporting_period_start} — {r.reporting_period_end}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#22C55E]">৳{Number(r.revenue).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[color:var(--vv-text-secondary)]">৳{Number(r.expenses).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === 'verified' ? 'success' : r.status === 'disputed' ? 'danger' : 'warning'}>
                        {r.status_label || r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" icon={<IconEye s={12} />} onClick={() => navigate(`/app/admin/financial-reports`)}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}