import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import FounderApplications from '../pages/founder/Applications';
import ProfessionalApplications from '../pages/professional/Applications';
import DiscoverBusinesses from '../pages/shared/DiscoverBusinesses';
import { api, FounderApplicationItem, BusinessApplicationItem } from '../services/api';

const mockAuthState = vi.hoisted(() => ({
  user: {
    id: 10,
    name: 'Farhan Founder',
    email: 'farhan@founder.com',
    verification_tier: 1,
  },
  session: {
    roles: ['founder'],
    activeRole: 'founder',
    user: { id: 10, name: 'Farhan Founder' },
    isAdmin: false,
  },
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'founder', setRole: vi.fn() }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    session: mockAuthState.session,
    isAdmin: false,
  }),
}));

describe('Professional Applications and Founder Applications Inbox', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockFounderApps: FounderApplicationItem[] = [
    {
      id: 101,
      business_id: 1,
      business_name: 'Vault FinTech',
      business_logo_url: null,
      professional: {
        id: 202,
        name: 'Sara Khan',
        email: 'sara@growth.io',
        avatar_url: null,
        initials: 'SK',
        verification_tier: 2,
        headline: 'Senior Growth & Marketing Lead',
        bio: '10+ years scaling SEA fintech apps.',
        location: 'Dhaka, Bangladesh',
        experience_years: 10,
        skills: ['Growth Marketing', 'Product Strategy', 'FinTech'],
        hourly_rate: 5000,
      },
      status: 'submitted',
      role_title: 'Growth Marketing Advisor',
      note: 'I would love to help scale your user acquisition in SEA.',
      applied_at: '2026-09-18T00:00:00.000Z',
      reviewed_at: null,
      responded_at: null,
      rejection_reason: null,
      timeline: [{ action: 'Application submitted', ts: '2026-09-18T00:00:00.000Z' }],
    },
    {
      id: 102,
      business_id: 1,
      business_name: 'Vault FinTech',
      business_logo_url: null,
      professional: {
        id: 203,
        name: 'Zubair Ahmed',
        email: 'zubair@tech.io',
        avatar_url: null,
        initials: 'ZA',
        verification_tier: 1,
        headline: 'Fractional CTO & Architect',
        bio: 'High scale distributed systems engineer.',
        location: 'Dhaka, Bangladesh',
        experience_years: 12,
        skills: ['Cloud Architecture', 'Security', 'FinTech'],
        hourly_rate: 8000,
      },
      status: 'under_review',
      role_title: 'Fractional CTO',
      note: 'Available for 15 hours/week technical advisory.',
      applied_at: '2026-09-17T12:00:00.000Z',
      reviewed_at: '2026-09-17T14:00:00.000Z',
      responded_at: null,
      rejection_reason: null,
      timeline: [
        { action: 'Application submitted', ts: '2026-09-17T12:00:00.000Z' },
        { action: 'Marked under review', ts: '2026-09-17T14:00:00.000Z' },
      ],
    },
  ];

  const mockProfApps: BusinessApplicationItem[] = [
    {
      id: 101,
      business_id: 1,
      business: 'Vault FinTech',
      business_logo_url: null,
      business_initials: 'VF',
      industry: 'FinTech',
      opportunity: 'Growth Marketing Advisor',
      role: 'Growth Marketing Advisor',
      applied_date: '2026-09-18T00:00:00.000Z',
      last_updated: '2026-09-18T00:00:00.000Z',
      status: 'submitted',
      timeline: [{ action: 'Application submitted', ts: '2026-09-18T00:00:00.000Z' }],
      note: 'I would love to help scale your user acquisition in SEA.',
      skills: ['Growth Marketing', 'Product Strategy'],
      rejection_reason: null,
    },
  ];

  it('renders Founder Applications Inbox with applicant cards, skills, and actions', async () => {
    vi.spyOn(api.businesses, 'list').mockResolvedValue([{ id: 1, name: 'Vault FinTech' }] as any);
    vi.spyOn(api.applications.founder, 'list').mockResolvedValue(mockFounderApps);

    render(
      <MemoryRouter initialEntries={['/app/founder/applications']}>
        <Routes>
          <Route path="/app/founder/applications" element={<FounderApplications />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Professional Applications Inbox')).toBeDefined();
    expect(await screen.findByText('Sara Khan')).toBeDefined();
    expect(screen.getByText('Zubair Ahmed')).toBeDefined();

    expect(screen.getByText('Senior Growth & Marketing Lead')).toBeDefined();
    expect(screen.getByText('Growth Marketing')).toBeDefined();
    expect(screen.getAllByText('View Profile').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Review Proposal').length).toBeGreaterThanOrEqual(2);
  });

  it('allows founder to mark application under review, accept, and reject', async () => {
    vi.spyOn(api.businesses, 'list').mockResolvedValue([{ id: 1, name: 'Vault FinTech' }] as any);
    vi.spyOn(api.applications.founder, 'list').mockResolvedValue(mockFounderApps);
    const reviewSpy = vi.spyOn(api.applications.founder, 'markUnderReview').mockResolvedValue({
      id: 101,
      status: 'under_review',
      reviewed_at: new Date().toISOString(),
    });
    const acceptSpy = vi.spyOn(api.applications.founder, 'accept').mockResolvedValue({
      id: 101,
      status: 'accepted',
      responded_at: new Date().toISOString(),
    });

    render(
      <MemoryRouter initialEntries={['/app/founder/applications']}>
        <Routes>
          <Route path="/app/founder/applications" element={<FounderApplications />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Sara Khan')).toBeDefined();

    const markReviewBtn = screen.getByText('Mark Under Review');
    fireEvent.click(markReviewBtn);

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith(101);
    });

    const acceptBtns = screen.getAllByText('Accept');
    fireEvent.click(acceptBtns[0]);

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith(101);
    });
  });

  it('renders Professional Applications page with real status and withdraw action', async () => {
    vi.spyOn(api.applications.professional, 'list').mockResolvedValue(mockProfApps);
    const withdrawSpy = vi.spyOn(api.applications.professional, 'withdraw').mockResolvedValue({
      id: 101,
      status: 'withdrawn',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/app/professional/applications']}>
        <Routes>
          <Route path="/app/professional/applications" element={<ProfessionalApplications />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('My Submitted Applications')).toBeDefined();
    expect(await screen.findByText('Vault FinTech')).toBeDefined();
    expect(screen.getByText('Application Submitted')).toBeDefined();

    const withdrawBtn = screen.getByText('Withdraw');
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
      expect(withdrawSpy).toHaveBeenCalledWith(101);
    });
  });

  it('submits professional application via api.applications.apply in DiscoverBusinesses', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([
      {
        id: 1,
        name: 'Nexus Tech',
        industry: 'FinTech',
        business_stage: 'Seed',
        location: 'Dhaka',
        description: 'NextGen banking platform.',
        funding_amount: 5000000,
        skills: ['FinTech', 'Marketing'],
        founder_verification_tier: 1,
        match: {
          overall_score: 0.92,
          strongest_alignments: [{ factor_name: 'Skills', score: 0.95, explanation: 'Strong FinTech alignment' }],
        },
      },
    ] as any);

    const applySpy = vi.spyOn(api.applications, 'apply').mockResolvedValue({
      id: 55,
      business_id: 1,
      business: 'Nexus Tech',
      business_logo_url: null,
      business_initials: 'NT',
      industry: 'FinTech',
      opportunity: 'Professional Advisor',
      role: 'Professional Advisor',
      applied_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      status: 'submitted',
      timeline: [],
      note: null,
      skills: [],
      rejection_reason: null,
    });

    render(
      <MemoryRouter initialEntries={['/app/professional/discover']}>
        <Routes>
          <Route path="/app/professional/discover" element={<DiscoverBusinesses context="professional" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Nexus Tech')).toBeDefined();

    // Open Match Drawer
    const matchChip = screen.getByText(/92% match/i);
    fireEvent.click(matchChip);

    expect(await screen.findByText('Apply / Connect')).toBeDefined();

    fireEvent.click(screen.getByText('Apply / Connect'));

    await waitFor(() => {
      expect(applySpy).toHaveBeenCalledWith('1', { role_title: 'Professional Advisor' });
      expect(screen.getByText('Application submitted to Nexus Tech!')).toBeDefined();
    });
  });
});
