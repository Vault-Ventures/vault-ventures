import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconClipboard, IconShield, IconTrendingUp, IconStar } from '../../components/layout/Icons';

export default function AdminApplications() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Applications Oversight</h1>
            <Badge variant="neutral">Peer-to-Peer Scoped</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Platform collaboration requests, professional engagements, and deal connection workflows.
          </p>
        </div>
      </div>

      {/* Truthful State Panel */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-4 text-[#C67A4E]">
          <IconClipboard s={24} />
        </div>
        <h2 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">
          Collaboration Applications Handled Directly Between Counterparties
        </h2>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-lg mx-auto mb-6 leading-relaxed">
          In Vault Ventures, collaboration applications and connection requests are negotiated directly between founders, investors, and professionals within confidential Deal Rooms. Platform administration focuses on KYC identity verification, financial transparency oversight, and participant reputation auditing rather than manual application gatekeeping.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate('/app/admin/verification')} icon={<IconShield s={14} />}>
            Open Verification Queue
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/admin/financial-governance')} icon={<IconTrendingUp s={14} />}>
            Financial Governance
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/admin/reputation')} icon={<IconStar s={14} />}>
            Audit User Reputation
          </Button>
        </div>
      </div>
    </div>
  );
}