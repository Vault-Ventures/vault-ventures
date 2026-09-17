import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api, resolveMediaUrl } from '../services/api';
import MyBusinesses from '../pages/founder/MyBusinesses';
import BusinessProfile from '../pages/founder/BusinessProfile';
import AdminBusinesses from '../pages/admin/Businesses';

const mockAuthState = {
  user: { id: 1, name: 'Tariq Rahman', verification_tier: 1 },
  session: { roles: ['founder'], activeRole: 'founder', user: { id: 1, name: 'Tariq Rahman' } },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    session: mockAuthState.session,
    isAuthenticated: true,
  }),
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'founder', setRole: vi.fn() }),
}));

function mountWithRouter(element: React.ReactNode, initialUrl = '/', path = '/') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="*" element={<div>Other Route</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Founder My Businesses Feature & Admin Approval Workflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders published, approved, pending, rejected, and draft businesses with accurate statuses and actions', async () => {
    const mockList = [
      {
        id: 101,
        name: 'Dhaka Logistics Hub',
        description: 'Nationwide cold-chain distribution network',
        industry: 'Logistics',
        business_stage: 'Seed',
        location: 'Dhaka, Bangladesh',
        status: 'published',
        logo_url: '/storage/business-logos/dhaka.png',
        created_at: '2026-09-10T12:00:00Z',
        requirements: { funding_amount: 5000000, skills: ['Supply Chain', 'Operations'] },
      },
      {
        id: 102,
        name: 'AgriTech Green Fields',
        description: 'IoT sensors for precision soil telemetry',
        industry: 'AgriTech',
        business_stage: 'Pre-Seed',
        location: 'Rajshahi, Bangladesh',
        status: 'pending_approval',
        logo_url: null,
        created_at: '2026-09-15T12:00:00Z',
        requirements: { funding_amount: 1500000, skills: ['IoT', 'Embedded Systems'] },
      },
      {
        id: 103,
        name: 'Sylhet Cloud Services',
        description: 'B2B enterprise cloud backup infrastructure',
        industry: 'SaaS',
        business_stage: 'Seed',
        location: 'Sylhet, Bangladesh',
        status: 'approved',
        logo_url: null,
        created_at: '2026-09-15T12:00:00Z',
        requirements: { funding_amount: 3000000, skills: ['Cloud Architecture', 'DevOps'] },
      },
      {
        id: 104,
        name: 'Rejected FinTech App',
        description: 'P2P Micro-lending platform',
        industry: 'FinTech',
        business_stage: 'Idea',
        location: 'Chittagong, Bangladesh',
        status: 'rejected',
        rejection_reason: 'Please provide valid license details and compliance certificates.',
        logo_url: null,
        created_at: '2026-09-15T12:00:00Z',
        requirements: { funding_amount: 2000000, skills: ['FinTech', 'Legal'] },
      },
      {
        id: 105,
        name: 'Incomplete Idea Venture',
        description: null,
        industry: null,
        business_stage: null,
        location: null,
        status: 'draft',
        logo_url: null,
        created_at: '2026-09-16T12:00:00Z',
        requirements: null,
      },
    ];

    vi.spyOn(api, 'get').mockResolvedValue({ items: mockList });

    mountWithRouter(<MyBusinesses />);

    // All businesses should appear
    expect((await screen.findAllByText('Dhaka Logistics Hub')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('AgriTech Green Fields').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sylhet Cloud Services').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rejected FinTech App').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Incomplete Idea Venture').length).toBeGreaterThan(0);

    // Published count summary: 1 published · 1 pending review · 1 approved · 2 drafts
    expect(screen.getByText(/1 published · 1 pending review · 1 approved · 2 drafts/i)).toBeTruthy();

    // Verify distinct status badges
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending Admin Approval').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);

    // Pending business shows Under Review, no publish button
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0);

    // Approved business exposes Publish button
    expect(screen.getAllByRole('button', { name: 'Publish' }).length).toBeGreaterThan(0);

    // Rejected business shows rejection reason and resubmit
    expect(screen.getAllByText(/Please provide valid license details and compliance certificates/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Resubmit' }).length).toBeGreaterThan(0);

    // Incomplete business shows missing requirements banner
    expect(screen.getByText(/Required before submitting for approval/i)).toBeTruthy();
  });

  it('allows submitting an eligible draft business for Admin approval', async () => {
    const completeDraft = {
      id: 201,
      name: 'Sylhet Tea Exports',
      description: 'Organic specialty tea export marketplace',
      industry: 'AgriTech',
      business_stage: 'Seed',
      location: 'Sylhet, Bangladesh',
      status: 'draft',
      logo_url: null,
      created_at: '2026-09-16T12:00:00Z',
      requirements: {
        funding_amount: 3000000,
        skills: ['International Trade', 'Export Marketing'],
      },
    };

    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ items: [completeDraft] })
      .mockResolvedValueOnce({ items: [{ ...completeDraft, status: 'pending_approval' }] });

    const submitSpy = vi.spyOn(api.businesses, 'submit').mockResolvedValue({
      ...completeDraft,
      status: 'pending_approval',
    });

    mountWithRouter(<MyBusinesses />);

    expect((await screen.findAllByText('Sylhet Tea Exports')).length).toBeGreaterThan(0);

    // Complete draft has "Submit for Approval" button
    const submitBtns = screen.getAllByRole('button', { name: 'Submit for Approval' });
    expect(submitBtns.length).toBeGreaterThan(0);

    fireEvent.click(submitBtns[0]);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith('201');
    });

    // After submission, confirmation banner appears
    await waitFor(() => {
      expect(screen.getByText(/submitted for Admin review/i)).toBeTruthy();
    });
  });

  it('allows founder to publish only after Admin approval and updates UI to Published', async () => {
    const approvedBusiness = {
      id: 202,
      name: 'Approved BioTech Lab',
      description: 'Diagnostic genomics testing laboratory',
      industry: 'HealthTech',
      business_stage: 'Seed',
      location: 'Dhaka, Bangladesh',
      status: 'approved',
      approved_at: '2026-09-17T10:00:00Z',
      logo_url: null,
      created_at: '2026-09-16T12:00:00Z',
      requirements: {
        funding_amount: 5000000,
        skills: ['Genomics', 'Lab Operations'],
      },
    };

    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ items: [approvedBusiness] })
      .mockResolvedValueOnce({ items: [{ ...approvedBusiness, status: 'published' }] });

    const publishSpy = vi.spyOn(api.businesses, 'publish').mockResolvedValue({
      ...approvedBusiness,
      status: 'published',
      published_at: '2026-09-17T12:00:00Z',
    });

    mountWithRouter(<MyBusinesses />);

    expect((await screen.findAllByText('Approved BioTech Lab')).length).toBeGreaterThan(0);

    // Approved business has Publish button
    const publishBtns = screen.getAllByRole('button', { name: 'Publish' });
    expect(publishBtns.length).toBeGreaterThan(0);

    fireEvent.click(publishBtns[0]);

    await waitFor(() => {
      expect(publishSpy).toHaveBeenCalledWith('202');
    });

    // After publishing, confirmation banner appears
    await waitFor(() => {
      expect(screen.getByText(/is now published and eligible for discovery/i)).toBeTruthy();
    });
  });

  it('renders business logo with resolveMediaUrl and falls back on error or missing image', async () => {
    const biz = {
      id: 301,
      name: 'Chittagong Maritime',
      description: 'Port operations ERP software',
      industry: 'SaaS',
      business_stage: 'Pre-Seed',
      location: 'Chittagong',
      status: 'published',
      logo_url: '/storage/business-logos/chittagong.png',
      created_at: '2026-09-10T12:00:00Z',
      requirements: { funding_amount: 2000000, skills: ['Shipping', 'Logistics'] },
    };

    vi.spyOn(api, 'get').mockResolvedValue({ items: [biz] });

    mountWithRouter(<MyBusinesses />);

    expect((await screen.findAllByText('Chittagong Maritime')).length).toBeGreaterThan(0);

    // Check that resolved logo img is rendered
    const logoImgs = screen.getAllByRole('img', { name: 'Logo' });
    expect(logoImgs.length).toBeGreaterThan(0);
    expect(logoImgs[0].getAttribute('src')).toBe(resolveMediaUrl('/storage/business-logos/chittagong.png'));

    // Trigger onError to verify graceful fallback to initials 'CM'
    fireEvent.error(logoImgs[0]);

    await waitFor(() => {
      expect(screen.getAllByText('CM').length).toBeGreaterThan(0);
    });
  });
});

describe('Business Profile Page Details, Approval Banners & Photo Uploads', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and displays persisted backend business data by ID and shows approved banner with publish action', async () => {
    const approvedBusiness = {
      id: 55,
      name: 'Apex Solar Energy',
      description: 'Distributed rooftop solar financing for commercial factories across Gazipur.',
      industry: 'Energy',
      business_stage: 'Series A',
      location: 'Gazipur, Bangladesh',
      risk_level: 'Moderate',
      expected_involvement: '10 full-time engineers',
      logo_url: '/storage/business-logos/apex.png',
      cover_photo_url: '/storage/business-covers/apex-banner.jpg',
      status: 'approved',
      approved_at: '2026-09-17T10:00:00Z',
      created_at: '2026-09-10T12:00:00Z',
      requirements: {
        funding_amount: 25000000,
        skills: ['Solar Engineering', 'Project Finance', 'EPC Contracts'],
      },
    };

    vi.spyOn(api.businesses, 'get').mockResolvedValue(approvedBusiness);
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    const publishSpy = vi.spyOn(api.businesses, 'publish').mockResolvedValue({
      ...approvedBusiness,
      status: 'published',
      published_at: '2026-09-17T12:00:00Z',
    });

    mountWithRouter(
      <BusinessProfile />,
      '/app/founder/businesses/55',
      '/app/founder/businesses/:id'
    );

    // Verify real persisted business information is rendered
    expect(await screen.findByText('Apex Solar Energy')).toBeTruthy();
    expect(screen.getAllByText(/Distributed rooftop solar financing for commercial factories/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gazipur, Bangladesh').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('10 full-time engineers').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Solar Engineering').length).toBeGreaterThanOrEqual(1);

    // Approved banner is displayed
    expect(screen.getByText(/Approved by Admin/i)).toBeTruthy();

    // Click Publish Now
    const publishBtn = screen.getByRole('button', { name: 'Publish Now' });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(publishSpy).toHaveBeenCalledWith(55);
    });

    // Verification of published status banner
    await waitFor(() => {
      expect(screen.getByText(/Business is now published and eligible for investor and professional discovery/i)).toBeTruthy();
    });
  });

  it('shows Under Admin Review banner and disables publish action when business is pending approval', async () => {
    const pendingBusiness = {
      id: 66,
      name: 'Dhaka AI Robotics',
      description: 'Warehouse automated guided vehicles',
      industry: 'Robotics',
      business_stage: 'Seed',
      location: 'Dhaka',
      status: 'pending_approval',
      requirements: { funding_amount: 8000000, skills: ['Robotics', 'ROS'] },
    };

    vi.spyOn(api.businesses, 'get').mockResolvedValue(pendingBusiness);
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    mountWithRouter(
      <BusinessProfile />,
      '/app/founder/businesses/66',
      '/app/founder/businesses/:id'
    );

    expect(await screen.findByText('Dhaka AI Robotics')).toBeTruthy();

    // Under Admin Review banner displayed
    expect(screen.getByText(/Under Admin Review/i)).toBeTruthy();
    expect(screen.getByText(/Publishing is restricted until an Admin approves it/i)).toBeTruthy();

    // No Publish button should be present
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish Now' })).toBeNull();
  });

  it('allows owner to upload business logo and updates image immediately', async () => {
    const liveBusiness = {
      id: 77,
      name: 'Bengal FinTech',
      description: 'Merchant payment gateway',
      industry: 'FinTech',
      business_stage: 'Seed',
      location: 'Dhaka',
      logo_url: null,
      cover_photo_url: null,
      status: 'published',
      requirements: { funding_amount: 10000000, skills: ['FinTech'] },
    };

    vi.spyOn(api.businesses, 'get').mockResolvedValue(liveBusiness);
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    const uploadSpy = vi.spyOn(api.businesses, 'uploadLogo').mockResolvedValue({
      logo_url: '/storage/business-logos/new-bengal.png',
      business: { ...liveBusiness, logo_url: '/storage/business-logos/new-bengal.png' },
    });

    mountWithRouter(
      <BusinessProfile />,
      '/app/founder/businesses/77',
      '/app/founder/businesses/:id'
    );

    expect(await screen.findByText('Bengal FinTech')).toBeTruthy();

    // Upload new logo
    const fileInput = screen.getByTestId('business-logo-input') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const testFile = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(77, testFile);
    });

    // Logo image should now be displayed
    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Logo' });
      expect(img.getAttribute('src')).toBe(resolveMediaUrl('/storage/business-logos/new-bengal.png'));
    });
  });

  it('renders business profile header layout with long name, cover banner, logo, and status badges clearly visible', async () => {
    const customBusiness = {
      id: 88,
      name: 'International Automated AgriTech & Cold Storage Infrastructure Solutions Ltd.',
      description: 'End-to-end solar-powered cold chain network across rural Bangladesh districts.',
      industry: 'AgriTech',
      business_stage: 'Growth',
      location: 'Bogura, Bangladesh',
      logo_url: null,
      cover_photo_url: '/storage/business-covers/farm-cover.jpg',
      status: 'published',
      verification_tier: 2,
      requirements: { funding_amount: 25000000, skills: ['Cold Chain', 'IoT'] },
    };

    vi.spyOn(api.businesses, 'get').mockResolvedValue(customBusiness);
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null);

    mountWithRouter(
      <BusinessProfile />,
      '/app/founder/businesses/88',
      '/app/founder/businesses/:id'
    );

    // Header title and details are present and accessible
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('International Automated AgriTech & Cold Storage Infrastructure Solutions Ltd.');

    // Logo initials fallback rendered
    expect(screen.getByText('IA')).toBeTruthy();

    // Cover image rendered
    const coverImg = screen.getByRole('img', { name: 'Cover' });
    expect(coverImg.getAttribute('src')).toBe(resolveMediaUrl('/storage/business-covers/farm-cover.jpg'));

    // Status and verification badges rendered
    expect(screen.getByText('Published')).toBeTruthy();
    expect(screen.getByText('Track-record Verified')).toBeTruthy();

    // Action buttons rendered
    expect(screen.getByRole('button', { name: 'Manage Business' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add Business/i })).toBeTruthy();
  });
});

describe('Admin Business Approval Oversight UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders pending businesses and allows an admin to approve a business', async () => {
    const pendingBiz = {
      id: 99,
      name: 'BioGen Pharma Labs',
      description: 'Bio-similar medicine research laboratory',
      industry: 'HealthTech',
      business_stage: 'Seed',
      location: 'Dhaka',
      status: 'pending_approval',
      created_at: '2026-09-17T09:00:00Z',
      requirements: { funding_amount: 5000000, skills: ['Biotech'] },
      founder: { id: 2, name: 'Dr. Kamal Hossain', email: 'kamal@biogen.com' },
    };

    vi.spyOn(api.admin.businesses, 'list')
      .mockResolvedValueOnce({ businesses: [pendingBiz] })
      .mockResolvedValueOnce({ businesses: [] });

    const approveSpy = vi.spyOn(api.admin.businesses, 'approve').mockResolvedValue({
      id: 99,
      status: 'approved',
      approved_at: '2026-09-17T12:00:00Z',
    });

    mountWithRouter(<AdminBusinesses />);

    expect(await screen.findByText('BioGen Pharma Labs')).toBeTruthy();
    expect(screen.getByText('Dr. Kamal Hossain')).toBeTruthy();

    // Click Approve
    const approveBtn = screen.getByRole('button', { name: 'Approve' });
    fireEvent.click(approveBtn);

    // Confirmation modal opens
    expect(await screen.findByText(/Confirm Approval/i)).toBeTruthy();

    // Confirm approval
    const confirmBtn = screen.getByRole('button', { name: 'Confirm Approval' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith(99);
    });

    // Success toast appears
    await waitFor(() => {
      expect(screen.getByText(/"BioGen Pharma Labs" approved successfully./i)).toBeTruthy();
    });
  });

  it('allows an admin to reject a business with a reason', async () => {
    const pendingBiz = {
      id: 100,
      name: 'Unverified Crypto Exchange',
      description: 'Peer to peer crypto trading',
      industry: 'FinTech',
      business_stage: 'Idea',
      location: 'Dhaka',
      status: 'pending_approval',
      created_at: '2026-09-17T09:00:00Z',
      requirements: { funding_amount: 10000000, skills: ['Crypto'] },
      founder: { id: 3, name: 'Anisul Huq', email: 'anis@crypto.com' },
    };

    vi.spyOn(api.admin.businesses, 'list')
      .mockResolvedValueOnce({ businesses: [pendingBiz] })
      .mockResolvedValueOnce({ businesses: [] });

    const rejectSpy = vi.spyOn(api.admin.businesses, 'reject').mockResolvedValue({
      id: 100,
      status: 'rejected',
      rejected_at: '2026-09-17T12:00:00Z',
      rejection_reason: 'Unregulated financial activities not permitted.',
    });

    mountWithRouter(<AdminBusinesses />);

    expect(await screen.findByText('Unverified Crypto Exchange')).toBeTruthy();

    // Click Reject
    const rejectBtn = screen.getByRole('button', { name: 'Reject' });
    fireEvent.click(rejectBtn);

    // Reject modal opens
    expect(await screen.findByText(/Reject Business Submission/i)).toBeTruthy();

    // Fill rejection reason
    const textarea = screen.getByPlaceholderText(/Explain reasons for rejection/i);
    fireEvent.change(textarea, { target: { value: 'Unregulated financial activities not permitted.' } });

    // Confirm rejection
    const confirmRejectBtn = screen.getByRole('button', { name: 'Confirm Rejection' });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith(100, 'Unregulated financial activities not permitted.');
    });

    // Toast appears
    await waitFor(() => {
      expect(screen.getByText(/"Unverified Crypto Exchange" rejected./i)).toBeTruthy();
    });
  });
});
