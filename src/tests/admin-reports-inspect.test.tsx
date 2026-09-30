import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminReports from '../pages/admin/Reports';
import AdminFinancialReports from '../pages/admin/FinancialReports';
import { api, FinancialReportItem } from '../services/api';

const mockReports: FinancialReportItem[] = [
  {
    id: 3,
    deal_id: 4,
    business_id: 12,
    business_name: 'alvi health tech',
    business: { id: 12, name: 'alvi health tech' },
    deal: {
      id: 4,
      stage: 'milestone_funding_active',
      founder: { id: 2, name: 'Farhan Founder' },
      counterparty: { id: 5, name: 'Imran Investor', role: 'lead_investor' },
    },
    submitted_by: { id: 2, name: 'Farhan Founder' },
    reporting_period_start: '2026-09-27',
    reporting_period_end: '2026-09-30',
    revenue: 5000,
    expenses: 200,
    net_profit_loss: 4800,
    cash_position: 125000,
    notes: 'Q3 operational telemetry notes and gross receipts verified.',
    status: 'verified',
    status_label: 'Verified',
    evidence_count: 1,
    evidences: [
      {
        id: 101,
        financial_report_id: 3,
        original_filename: 'q3_bank_statement.pdf',
        file_size: 204800,
        mime_type: 'application/pdf',
        evidence_type: 'bank_statement',
        uploaded_by: { id: 2, name: 'Farhan Founder' },
        created_at: '2026-09-30T12:00:00Z',
      },
    ],
    reviewed_at: '2026-10-01T08:00:00Z',
    reviewed_by: { id: 1, name: 'Super Admin' },
    admin_review_notes: 'Verified against bank statements.',
    audit_logs: [
      {
        id: 50,
        action: 'financial_report_reviewed',
        actor_role: 'admin',
        actor: { id: 1, name: 'Super Admin' },
        created_at: '2026-10-01T08:00:00Z',
      },
    ],
  },
  {
    id: 8,
    deal_id: 9,
    business_id: 15,
    business_name: 'Dhaka Agritech',
    business: { id: 15, name: 'Dhaka Agritech' },
    deal: {
      id: 9,
      stage: 'completed',
      founder: { id: 3, name: 'Tanvir Hossain' },
    },
    submitted_by: { id: 3, name: 'Tanvir Hossain' },
    reporting_period_start: '2026-10-01',
    reporting_period_end: '2026-10-31',
    revenue: 12000,
    expenses: 3500,
    net_profit_loss: 8500,
    cash_position: 45000,
    notes: 'October harvest sales figures.',
    status: 'evidence_submitted',
    status_label: 'Evidence Attached',
    evidence_count: 2,
    evidences: [
      {
        id: 201,
        financial_report_id: 8,
        original_filename: 'harvest_ledger_oct.xlsx',
        file_size: 512000,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        evidence_type: 'general_ledger',
        uploaded_by: { id: 3, name: 'Tanvir Hossain' },
        created_at: '2026-10-31T15:00:00Z',
      },
    ],
    reviewed_at: null,
    reviewed_by: null,
    admin_review_notes: null,
  },
];

describe('Admin Reports → Inspect Workflow Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(api.admin.financialReports, 'list').mockResolvedValue({
      reports: mockReports,
      pagination: { current_page: 1, last_page: 1, per_page: 50, total: mockReports.length },
    });

    vi.spyOn(api.admin.financialReports, 'getGovernance').mockResolvedValue({
      overview: {
        total_financial_reports_count: 2,
        total_deals_with_reporting: 2,
        total_discrepancies_count: 0,
      },
      verification_pipeline: {
        self_reported_count: 0,
        evidence_submitted_count: 1,
        under_review_count: 0,
        verified_count: 1,
      },
      discrepancy_queue: {
        pending_under_review_count: 0,
        resolved_count: 0,
        disputed_count: 0,
      },
      financial_totals_bdt: {
        currency: 'BDT',
        total_reported_revenue: 17000,
        total_reported_expenses: 3700,
        total_calculated_profit_loss: 13300,
      },
      disclaimer: 'Verified simulated platform reporting.',
    });

    vi.spyOn(api.admin.financialReports, 'get').mockImplementation(async (id: number | string) => {
      const match = mockReports.find(r => String(r.id) === String(id));
      if (!match) {
        throw new Error(`Report #${id} not found.`);
      }
      return match;
    });

    vi.spyOn(api.admin.financialReports, 'getAuditLogs').mockImplementation(async (id: number | string) => {
      const match = mockReports.find(r => String(r.id) === String(id));
      return {
        financial_report_id: Number(id),
        audit_logs: match?.audit_logs || [],
      };
    });
  });

  // TEST 1: Reports page → Report #3 → Inspect navigates to /app/admin/financial-reports?reportId=3 and opens Report #3 details
  it('TEST 1: Admin Reports Inspect button navigates with reportId parameter and renders details', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/reports']}>
        <Routes>
          <Route path="/app/admin/reports" element={<AdminReports />} />
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify Reports page loaded
    await waitFor(() => {
      expect(screen.getByText('alvi health tech')).toBeTruthy();
      expect(screen.getByText('#3')).toBeTruthy();
    });

    // Click "Inspect" for Report #3
    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    // Expect Report #3 Inspection modal to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Financial Report #3/i)).toBeTruthy();
      expect(screen.getAllByText(/alvi health tech/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Q3 operational telemetry notes and gross receipts verified./i)).toBeTruthy();
    });
  });

  // TEST 2: Inspect Report A displays Report A data
  it('TEST 2: Direct or URL navigation to Report #3 displays Report #3 data specifically', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports?reportId=3']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Financial Report #3/i)).toBeTruthy();
      expect(screen.getAllByText(/alvi health tech/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/q3_bank_statement.pdf/i)).toBeTruthy();
    });
  });

  // TEST 3: Inspect Report B displays Report B data, not Report A
  it('TEST 3: Inspect Report #8 displays Report #8 data and not Report #3 data', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports?reportId=8']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Financial Report #8/i)).toBeTruthy();
      expect(screen.getAllByText(/Dhaka Agritech/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/harvest_ledger_oct.xlsx/i)).toBeTruthy();
      expect(screen.queryByText('q3_bank_statement.pdf')).toBeNull();
    });
  });

  // TEST 4: Refresh while inspecting a report preserves inspection view
  it('TEST 4: URL preservation on page reload keeps inspection open', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports?reportId=3']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Financial Report #3/i)).toBeTruthy();
      expect(screen.getByText(/2026-09-27 → 2026-09-30/i)).toBeTruthy();
    });
  });

  // TEST 5: Direct visit to /app/admin/financial-reports renders normal list without modal
  it('TEST 5: Normal visit to /app/admin/financial-reports without query param renders report list and governance', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Financial Reports & Governance/i)).toBeTruthy();
      expect(screen.getByText('Operational Reports (2)')).toBeTruthy();
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  // TEST 6: Invalid/nonexistent report ID displays safe error state without crash
  it('TEST 6: Invalid report ID shows safe error message and allows closing cleanly', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports?reportId=99999']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Report Inspection Failed/i)).toBeTruthy();
      expect(screen.getByText(/Report #99999 not found/i)).toBeTruthy();
    });

    // Close button returns to normal view
    const backBtn = screen.getByRole('button', { name: /Back to Financial Reports/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  // TEST 7: Verified report displays Verified Clean status correctly
  it('TEST 7: Verified report shows verified status and review history', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports?reportId=3']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Report is Verified/i)).toBeTruthy();
      expect(screen.getByText(/Verified against bank statements/i)).toBeTruthy();
      expect(screen.getByText(/Reviewed by Super Admin/i)).toBeTruthy();
    });
  });

  // TEST 8: Unverified report allows verification workflow
  it('TEST 8: Unverified report provides functional verification action', async () => {
    const reviewSpy = vi.spyOn(api.admin.financialReports, 'review').mockResolvedValue({
      id: 8,
      status: 'verified',
      status_label: 'Verified',
      reviewed_at: '2026-11-01T00:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports?reportId=8']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Financial Report #8/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Verify Report/i })).toBeTruthy();
    });

    // Add optional review notes and submit verification
    const notesInput = screen.getByPlaceholderText(/Optional audit review notes/i);
    fireEvent.change(notesInput, { target: { value: 'Verified invoices and ledger.' } });

    const verifyBtn = screen.getByRole('button', { name: /Verify Report/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith(8, {
        status: 'verified',
        notes: 'Verified invoices and ledger.',
      });
      expect(screen.getByText(/Report #8 marked as verified/i)).toBeTruthy();
    });
  });

  // TEST 9: Evidence is displayed with metadata and downloadable link using real backend endpoint
  it('TEST 9: Evidence metadata and download URL are rendered accurately', async () => {
    render(
      <MemoryRouter initialEntries={['/app/admin/financial-reports?reportId=3']}>
        <Routes>
          <Route path="/app/admin/financial-reports" element={<AdminFinancialReports />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('q3_bank_statement.pdf')).toBeTruthy();
      expect(screen.getByText(/bank statement • 200 KiB/i)).toBeTruthy();
    });

    const downloadLink = screen.getByRole('link', { name: /Download/i });
    expect(downloadLink.getAttribute('href')).toContain('/api/admin/financial-reports/3/evidence/101/download');
  });
});
