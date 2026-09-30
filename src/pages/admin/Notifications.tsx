import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function AdminNotifications() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1100px] mx-auto p-5 pb-10 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[18px] font-bold text-[color:var(--vv-text)] tracking-tight">Admin Operations & Notifications Hub</h1>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Administrative review queues, operational governance, and dispatch blueprints.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Operations Hub</Badge>
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/admin/notification-templates')}>
            View Dispatch Templates
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mx-auto text-[color:var(--vv-text-tertiary)]">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </div>

        <div className="max-w-xl mx-auto space-y-2">
          <h3 className="text-[14px] font-semibold text-[color:var(--vv-text)]">Administrative Queue Routing</h3>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
            A live admin notification inbox is not implemented on this page. Administrative actions are managed directly within dedicated operational queues. Standard participant in-app notifications (such as mutual connection alerts) are handled separately in user workspaces.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <Button size="sm" onClick={() => navigate('/app/admin/verification')}>
            Check Verification Queue
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/admin/reports')}>
            Inspect Governance Reports
          </Button>
        </div>
      </div>
    </div>
  );
}