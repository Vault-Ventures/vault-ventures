import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconClipboard, IconFileText, IconShield } from '../../components/layout/Icons';

export default function AdminAuditLogs() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">System Audit Logs</h1>
            <Badge variant="neutral">Immutable Trails</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Cryptographically verifiable audit trails for sensitive financial evidence and verification records.
          </p>
        </div>
      </div>

      {/* Truthful State Panel */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-4 text-[#C67A4E]">
          <IconClipboard s={24} />
        </div>
        <h2 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">
          Audit Records Scoped to Financial & Verification Objects
        </h2>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-lg mx-auto mb-6 leading-relaxed">
          In Vault Ventures, immutable audit logs are generated and bound directly to individual financial reports, evidence downloads, and verification requests to ensure tamper-evident chain-of-custody.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate('/app/admin/financial-reports')} icon={<IconFileText s={14} />}>
            View Report Audit Logs
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/admin/verification')} icon={<IconShield s={14} />}>
            Verification History
          </Button>
        </div>
      </div>
    </div>
  );
}