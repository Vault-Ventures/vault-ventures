import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconBuilding, IconFileText, IconTrendingUp } from '../../components/layout/Icons';

export default function AdminBusinesses() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Business Oversight</h1>
            <Badge variant="neutral">Enterprise Governance</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Monitor registered venture profiles, financial submissions, and disclosure compliance.
          </p>
        </div>
      </div>

      {/* Truthful State Panel */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-4 text-[#C67A4E]">
          <IconBuilding s={24} />
        </div>
        <h2 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">
          Business Administration via Financial Governance
        </h2>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-lg mx-auto mb-6 leading-relaxed">
          Business oversight is conducted through audited financial reports, revenue and expenditure records, and investment governance metrics rather than an unverified global directory.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate('/app/admin/financial-reports')} icon={<IconFileText s={14} />}>
            Review Financial Reports
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/admin/financial-governance')} icon={<IconTrendingUp s={14} />}>
            Financial Governance
          </Button>
        </div>
      </div>
    </div>
  );
}