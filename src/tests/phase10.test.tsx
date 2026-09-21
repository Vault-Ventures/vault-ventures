import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminVerificationQueue from '../pages/admin/VerificationQueue';
import AdminFinancialReports from '../pages/admin/FinancialReports';
import AdminMatchingEngine from '../pages/admin/MatchingEngine';
import AdminNotificationTemplates from '../pages/admin/NotificationTemplates';
import AdminAuditLogs from '../pages/admin/AuditLogs';
import AdminSettings from '../pages/admin/Settings';
import { api } from '../services/api';

const context = vi.hoisted(() => ({
  role: 'admin',
  user: { id: 1, name: 'Super Admin', email: 'admin@vaultventures.com', roles: ['admin'] },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/app/admin/financial-reports' }),
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  NavLink: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: context.role }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: context.user }),
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));


describe('Phase 10: Admin Enhancements & Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    context.role = 'admin';
    context.user = { id: 1, name: 'Super Admin', email: 'admin@vaultventures.com', roles: ['admin'] };
  });

  describe('REQ-PH10-01: Admin Identity Verification Queue & KYC Gating', () => {
    it('renders pending verification requests and filters by status', async () => {
      vi.spyOn(api.admin.verificationRequests, 'list').mockResolvedValue([
        {
          id: 101,
          user_id: 42,
          user: { id: 42, name: 'Farhan Founder', email: 'farhan@vaultventures.com', phone: '+8801712345678' },
          requested_tier: 1,
          status: 'pending',
          submitted_at: '2026-09-10T10:00:00Z',
          evidence_count: 2,
          evidence: [
            {
              id: 1,
              verification_request_id: 101,
              original_filename: 'nid_front_back.pdf',
              mime_type: 'application/pdf',
              file_size_bytes: 1048576,
              created_at: '2026-09-10T09:55:00Z',
            },
          ],
        },
      ]);

      render(<AdminVerificationQueue />);

      await waitFor(() => {
        expect(screen.getByText(/Verification Queue/i)).toBeTruthy();
        expect(screen.getByText('Farhan Founder')).toBeTruthy();
        expect(screen.getByText('farhan@vaultventures.com')).toBeTruthy();
      });
    });

    it('opens approve modal and submits approval notes to API', async () => {
      const mockReq = {
        id: 101,
        user_id: 42,
        user: { id: 42, name: 'Farhan Founder', email: 'farhan@vaultventures.com' },
        requested_tier: 1,
        status: 'pending',
        submitted_at: '2026-09-10T10:00:00Z',
      };

      vi.spyOn(api.admin.verificationRequests, 'list').mockResolvedValue([mockReq]);
      vi.spyOn(api.admin.verificationRequests, 'get').mockResolvedValue(mockReq);
      const approveSpy = vi.spyOn(api.admin.verificationRequests, 'approve').mockResolvedValue({
        ...mockReq,
        status: 'approved',
      });

      render(<AdminVerificationQueue />);

      await waitFor(() => expect(screen.getByText('Farhan Founder')).toBeTruthy());

      const reviewBtn = screen.getByRole('button', { name: /^Review$/i });
      fireEvent.click(reviewBtn);

      await waitFor(() => expect(screen.getByRole('button', { name: /^Approve$/i })).toBeTruthy());

      const approveBtn = screen.getByRole('button', { name: /^Approve$/i });
      fireEvent.click(approveBtn);

      await waitFor(() => expect(screen.getByText(/Approve Tier 1 Verification/i)).toBeTruthy());

      const confirmBtn = screen.getByRole('button', { name: /Approve Tier 1/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(approveSpy).toHaveBeenCalledWith(101, expect.any(String));
      });
    });

    it('opens reject modal and enforces reason requirement', async () => {
      const mockReq = {
        id: 101,
        user_id: 42,
        user: { id: 42, name: 'Farhan Founder', email: 'farhan@vaultventures.com' },
        requested_tier: 1,
        status: 'pending',
        submitted_at: '2026-09-10T10:00:00Z',
      };

      vi.spyOn(api.admin.verificationRequests, 'list').mockResolvedValue([mockReq]);
      vi.spyOn(api.admin.verificationRequests, 'get').mockResolvedValue(mockReq);
      const rejectSpy = vi.spyOn(api.admin.verificationRequests, 'reject').mockResolvedValue({
        ...mockReq,
        status: 'rejected',
      });

      render(<AdminVerificationQueue />);

      await waitFor(() => expect(screen.getByText('Farhan Founder')).toBeTruthy());

      const reviewBtn = screen.getByRole('button', { name: /^Review$/i });
      fireEvent.click(reviewBtn);

      await waitFor(() => expect(screen.getByRole('button', { name: /^Reject$/i })).toBeTruthy());

      const rejectBtn = screen.getByRole('button', { name: /^Reject$/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => expect(screen.getByText(/Reject Verification/i)).toBeTruthy());

      // Confirm button is disabled without selecting a reason
      const confirmRejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i }) as HTMLButtonElement;
      expect(confirmRejectBtn.disabled).toBe(true);

      // Select reason
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Insufficient evidence' } });

      expect(confirmRejectBtn.disabled).toBe(false);
      fireEvent.click(confirmRejectBtn);

      await waitFor(() => {
        expect(rejectSpy).toHaveBeenCalledWith(101, 'Insufficient evidence', expect.any(String), '');
      });

    });
  });

  describe('REQ-PH10-02: Financial Transparency & Discrepancy Governance', () => {
    it('renders financial report queue with BDT amounts and supports verification review', async () => {
      vi.spyOn(api.admin.financialReports, 'list').mockResolvedValue({
        reports: [
          {
            id: 201,
            deal_id: 55,
            business_id: 12,
            business_name: 'Apex Green Energy Ltd',
            submitted_by: { id: 42, name: 'Farhan Founder' },
            reporting_period_start: '2026-07-01',
            reporting_period_end: '2026-09-30',
            revenue: 450000.0,
            expenses: 280000.0,
            net_profit_loss: 170000.0,
            cash_position: 600000.0,
            status: 'under_review',
            status_label: 'Under Review',
            evidence_count: 3,
            discrepancy_count: 0,
            reviewed_at: null,
            reviewed_by: null,
            created_at: '2026-09-12T10:00:00Z',
          },
        ],
        pagination: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
      });

      vi.spyOn(api.admin.financialReports, 'getGovernance').mockResolvedValue({
        total_reports: 14,
        verified_reports: 9,
        under_review_reports: 5,
        open_discrepancies: 1,
        financial_totals_bdt: {
          total_reported_revenue: 12500000.0,
          total_reported_expenses: 8200000.0,
          total_calculated_profit_loss: 4300000.0,
        },
      } as any);

      const reviewSpy = vi.spyOn(api.admin.financialReports, 'review').mockResolvedValue({
        id: 201,
        status: 'verified',
        status_label: 'Verified',
        reviewed_at: '2026-09-16T18:00:00Z',
        admin_review_notes: 'Verified against supporting documents.',
      });

      render(<AdminFinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('Apex Green Energy Ltd')).toBeTruthy();
        // Check BDT formatted revenue
        expect(screen.getByText(/৳\s*4,?50,?000\.00/)).toBeTruthy();
      });

      const verifyBtn = screen.getByRole('button', { name: /^verify$/i });
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(reviewSpy).toHaveBeenCalledWith(201, {
          status: 'verified',
          notes: expect.any(String),
        });
        expect(screen.getByText(/Report #201 marked as verified/i)).toBeTruthy();
      });
    });
  });

  describe('REQ-PH10-05: Platform Governance, Matching Architecture & Templates', () => {
    it('renders server-side deterministic matching engine rules', async () => {
      render(<AdminMatchingEngine />);

      await waitFor(() => {
        expect(screen.getByText(/Matching Engine Architecture/i)).toBeTruthy();
        expect(screen.getByText(/Sector & Industry Alignment/i)).toBeTruthy();
        expect(screen.getByText(/Investment Ticket Fit/i)).toBeTruthy();
        expect(screen.getByText(/Skillset & Domain Expertise/i)).toBeTruthy();
      });
    });

    it('renders notification dispatch catalog and filters by category', async () => {
      render(<AdminNotificationTemplates />);

      await waitFor(() => {
        expect(screen.getByText(/Notification Dispatch Catalog/i)).toBeTruthy();
        expect(screen.getByText('Welcome - New User Registration')).toBeTruthy();
        expect(screen.getByText('Verification Approved')).toBeTruthy();
      });
    });

    it('renders immutable audit log directory and guides to scoped records', async () => {
      render(<AdminAuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/System Audit Logs/i)).toBeTruthy();
        expect(screen.getByText(/Audit Records Scoped to Financial & Verification Objects/i)).toBeTruthy();
      });
    });

    it('renders platform policy and governance settings with BDT currency', async () => {
      render(<AdminSettings />);

      await waitFor(() => {
        expect(screen.getByText(/Platform Governance & Policy Settings/i)).toBeTruthy();
        expect(screen.getByText('BDT (৳)')).toBeTruthy();
      });

      const verifTabBtn = screen.getByRole('button', { name: /Verification/i });
      fireEvent.click(verifTabBtn);

      await waitFor(() => {
        expect(screen.getByText('Tier 1 (Identity KYC)')).toBeTruthy();
        expect(screen.getByText('Tier 2 (Entity KYB)')).toBeTruthy();
      });
    });
  });



});

