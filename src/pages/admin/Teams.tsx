import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function AdminTeams() {
  const navigate = useNavigate();

  return (
    <div className="p-5 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Teams & Collaboration Workspaces</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">
            Deal room collaboration teams and participant structures.
          </p>
        </div>
        <Badge variant="neutral">Deal Workspace Scoped</Badge>
      </div>

      {/* Unavailable State Card */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mx-auto text-[color:var(--vv-text-tertiary)]">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-[14px] font-semibold text-[color:var(--vv-text)]">Global Team Directory Not Exposed</h3>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
            In Vault Ventures, collaborative teams and participation permissions are strictly scoped to individual verified Deal Rooms and Business entities. There is no independent global team directory API in the Laravel backend.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/admin/deals')}>
            View Deal Governance
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/admin/reports')}>
            View Financial Reports
          </Button>
        </div>
      </div>
    </div>
  );
}