import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FeedbackFlow from '../pages/shared/FeedbackFlow';
import { api, DealFeedbackStatusData, ReputationSummaryData } from '../services/api';

const context = vi.hoisted(() => ({
  role: 'founder',
  user: { id: 1, name: 'Alice Founder', roles: ['founder'] },
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: context.role }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: context.user }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'founder';
  context.user = { id: 1, name: 'Alice Founder', roles: ['founder'] };
});

function mountFeedbackFlow(initialUrl = '/app/feedback') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path="/app/feedback" element={<FeedbackFlow />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('FeedbackFlow Component & Feedback Lifecycle Suite', () => {
  const mockReputation: ReputationSummaryData = {
    user_id: 1,
    role: 'founder',
    verification: {
      tier: 1,
      is_identity_verified: true,
      is_track_record_verified: false,
    },
    track_record: {
      completed_deals_count: 2,
      completed_milestones_count: 4,
      total_simulated_bdt: '350000.00',
    },
    feedback: {
      reviews_count: 1,
      average_rating: 5.0,
      reviews: [
        {
          id: 10,
          deal_id: 2,
          reviewer_name: 'Bob Investor',
          reviewer_role: 'investor',
          business_name: 'naim health care',
          rating: 5,
          comment: 'Great team execution on all milestones.',
          submitted_at: '2026-09-19T20:00:00Z',
        },
      ],
    },
    profile_evidence: {
      businesses_count: 1,
      businesses: [],
    },
  };

  it('renders feedback overview with quick stats and verifiable feedback list', async () => {
    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockReputation);

    mountFeedbackFlow('/app/feedback');

    expect(await screen.findByText('Deal Feedback')).toBeTruthy();
    expect(screen.getByText('Completed Deals')).toBeTruthy();
    expect(screen.getByText('Reviews Received')).toBeTruthy();
    expect(screen.getByText('Recent Verifiable Feedback')).toBeTruthy();
    expect(await screen.findByText('Bob Investor')).toBeTruthy();
    expect(await screen.findByText(/Great team execution on all milestones/i)).toBeTruthy();
  });

  it('preselects and loads deal feedback status when ?dealId=2 is in URL query', async () => {
    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockReputation);
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 2,
      business_name: 'naim health care',
      stage: 'completed',
    } as any);

    const statusData: DealFeedbackStatusData = {
      deal_id: 2,
      deal_stage: 'completed',
      can_submit_feedback: true,
      has_submitted_feedback: false,
      founder_feedback_submitted: false,
      counterparty_feedback_submitted: false,
      reviews: [],
    };
    vi.spyOn(api.deals.feedback, 'getStatus').mockResolvedValue(statusData);

    mountFeedbackFlow('/app/feedback?dealId=2');

    expect(await screen.findByText(/Deal #2 — naim health care/i)).toBeTruthy();
    expect(screen.getByText('Overall Rating')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Describe your experience collaborating on this deal.../i)).toBeTruthy();
  });

  it('allows selecting star rating, entering comments, and submitting feedback', async () => {
    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockReputation);
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 2,
      business_name: 'naim health care',
      stage: 'completed',
    } as any);

    const statusData: DealFeedbackStatusData = {
      deal_id: 2,
      deal_stage: 'completed',
      can_submit_feedback: true,
      has_submitted_feedback: false,
      founder_feedback_submitted: false,
      counterparty_feedback_submitted: false,
      reviews: [],
    };
    vi.spyOn(api.deals.feedback, 'getStatus').mockResolvedValue(statusData);
    const submitSpy = vi.spyOn(api.deals.feedback, 'submit').mockResolvedValue({
      id: 1,
      deal_id: 2,
      reviewer_user_id: 1,
      reviewer_role: 'founder',
      recipient_user_id: 2,
      recipient_role: 'investor',
      rating: 5,
      comment: 'Excellent collaboration and swift funding release.',
      submitted_at: '2026-09-20T12:00:00Z',
    });

    mountFeedbackFlow('/app/feedback?dealId=2');

    expect(await screen.findByText(/Deal #2/i)).toBeTruthy();

    // Select 5 stars (StarPicker buttons are inside the Overall Rating form section)
    const ratingLabel = screen.getByText('Overall Rating');
    const formSection = ratingLabel.parentElement!;
    const starButtons = formSection.querySelectorAll('button');
    expect(starButtons.length).toBe(5);
    fireEvent.click(starButtons[4]); // 5th star

    // Enter comment
    const commentInput = screen.getByPlaceholderText(/Describe your experience collaborating on this deal.../i);
    fireEvent.change(commentInput, {
      target: { value: 'Excellent collaboration and swift funding release.' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          rating: 5,
          comment: 'Excellent collaboration and swift funding release.',
          role: 'founder',
        })
      );
    });

    expect(await screen.findByText('Feedback Submitted')).toBeTruthy();
  });

  it('renders already-submitted banner and recorded reviews when user has already submitted feedback', async () => {
    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockReputation);
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 2,
      business_name: 'naim health care',
      stage: 'completed',
    } as any);

    const statusData: DealFeedbackStatusData = {
      deal_id: 2,
      deal_stage: 'completed',
      can_submit_feedback: false,
      has_submitted_feedback: true,
      founder_feedback_submitted: true,
      counterparty_feedback_submitted: true,
      reviews: [
        {
          id: 1,
          deal_id: 2,
          reviewer_user_id: 2,
          reviewer_role: 'investor',
          recipient_user_id: 1,
          recipient_role: 'founder',
          rating: 5,
          comment: 'Great milestone deliveries.',
          submitted_at: '2026-09-20T11:52:45Z',
        },
        {
          id: 2,
          deal_id: 2,
          reviewer_user_id: 1,
          reviewer_role: 'founder',
          recipient_user_id: 2,
          recipient_role: 'investor',
          rating: 5,
          comment: 'nice',
          submitted_at: '2026-09-20T11:55:07Z',
        },
      ],
    };
    vi.spyOn(api.deals.feedback, 'getStatus').mockResolvedValue(statusData);

    mountFeedbackFlow('/app/feedback?dealId=2');

    expect(await screen.findByText('You have already submitted feedback for this deal')).toBeTruthy();
    expect(screen.getByText('Recorded Reviews for Deal #2')).toBeTruthy();
    expect(screen.getByText(/Great milestone deliveries/i)).toBeTruthy();
    expect(screen.getByText(/nice/i)).toBeTruthy();
    // Form should not be rendered
    expect(screen.queryByPlaceholderText(/Describe your experience collaborating on this deal.../i)).toBeNull();
  });

  it('renders Deal In Progress state and hides feedback submission form for uncompleted deal', async () => {
    vi.spyOn(api.reputation, 'get').mockResolvedValue(mockReputation);
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 5,
      business_name: 'Beta Co',
      stage: 'milestone_funding_active',
    } as any);

    const statusData: DealFeedbackStatusData = {
      deal_id: 5,
      deal_stage: 'milestone_funding_active',
      can_submit_feedback: false,
      has_submitted_feedback: false,
      founder_feedback_submitted: false,
      counterparty_feedback_submitted: false,
      reviews: [],
    };
    vi.spyOn(api.deals.feedback, 'getStatus').mockResolvedValue(statusData);

    mountFeedbackFlow('/app/feedback?dealId=5');

    expect(await screen.findByText('Deal In Progress')).toBeTruthy();
    expect(
      screen.getByText(/Feedback can only be submitted once the deal has completed all agreed milestones/i)
    ).toBeTruthy();
    expect(screen.queryByPlaceholderText(/Describe your experience collaborating on this deal.../i)).toBeNull();
  });

  it('renders feedback submission form for Professional counterparty on a completed deal', async () => {
    context.role = 'professional';
    context.user = { id: 8, name: 'Rafiul Professional', roles: ['professional'] };

    vi.spyOn(api.reputation, 'get').mockResolvedValue({
      ...mockReputation,
      user_id: 8,
      role: 'professional',
    });
    vi.spyOn(api.deals, 'get').mockResolvedValue({
      id: 3,
      business_name: 'naim health care',
      stage: 'completed',
    } as any);

    const statusData: DealFeedbackStatusData = {
      deal_id: 3,
      deal_stage: 'completed',
      can_submit_feedback: true,
      has_submitted_feedback: false,
      founder_feedback_submitted: false,
      counterparty_feedback_submitted: false,
      reviews: [],
    };
    vi.spyOn(api.deals.feedback, 'getStatus').mockResolvedValue(statusData);

    mountFeedbackFlow('/app/feedback?dealId=3');

    expect(await screen.findByText(/Deal #3 — naim health care/i)).toBeTruthy();
    expect(screen.getByText(/professional/i)).toBeTruthy();
    expect(screen.getByText('Overall Rating')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Describe your experience collaborating on this deal.../i)).toBeTruthy();
  });

  it('proves standard ApiResponse contract { success: true, data: {...} } unwraps and enables feedback form at API boundary', async () => {
    // Intercept fetch directly to verify the real apiClient parsing behavior
    const originalFetch = global.fetch;
    const fetchSpy = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/reputation')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              message: 'Reputation retrieved',
              data: mockReputation,
            }),
            { headers: { 'content-type': 'application/json' }, status: 200 }
          )
        );
      }
      if (url.includes('/api/me/deals/3/feedback')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              message: 'Deal feedback status retrieved successfully.',
              data: {
                deal_id: 3,
                deal_stage: 'completed',
                can_submit_feedback: true,
                has_submitted_feedback: false,
                founder_feedback_submitted: false,
                counterparty_feedback_submitted: false,
                reviews: [],
              },
            }),
            { headers: { 'content-type': 'application/json' }, status: 200 }
          )
        );
      }
      if (url.includes('/api/me/deals/3')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              message: 'Deal retrieved',
              data: {
                id: 3,
                business_name: 'naim health care',
                stage: 'completed',
              },
            }),
            { headers: { 'content-type': 'application/json' }, status: 200 }
          )
        );
      }
      return Promise.reject(new Error(`Unhandled url: ${url}`));
    });
    global.fetch = fetchSpy;

    try {
      mountFeedbackFlow('/app/feedback?dealId=3');

      // The standard ApiResponse unwraps to deal_stage='completed', rendering the form
      expect(await screen.findByText(/Deal #3 — naim health care/i)).toBeTruthy();
      expect(screen.getByText('Overall Rating')).toBeTruthy();
      expect(screen.getByPlaceholderText(/Describe your experience collaborating on this deal.../i)).toBeTruthy();
      expect(screen.queryByText('Deal In Progress')).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('demonstrates that non-standard response without success: true trips Deal In Progress (regression boundary test)', async () => {
    const originalFetch = global.fetch;
    const fetchSpy = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/reputation')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: mockReputation,
            }),
            { headers: { 'content-type': 'application/json' }, status: 200 }
          )
        );
      }
      // Buggy response missing 'success: true'
      if (url.includes('/api/me/deals/3/feedback')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                deal_id: 3,
                deal_stage: 'completed',
                can_submit_feedback: true,
                has_submitted_feedback: false,
                founder_feedback_submitted: false,
                counterparty_feedback_submitted: false,
                reviews: [],
              },
            }),
            { headers: { 'content-type': 'application/json' }, status: 200 }
          )
        );
      }
      if (url.includes('/api/me/deals/3')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                id: 3,
                business_name: 'naim health care',
                stage: 'completed',
              },
            }),
            { headers: { 'content-type': 'application/json' }, status: 200 }
          )
        );
      }
      return Promise.reject(new Error(`Unhandled url: ${url}`));
    });
    global.fetch = fetchSpy;

    try {
      mountFeedbackFlow('/app/feedback?dealId=3');

      // Without success: true, apiClient does not unwrap data, causing dealStatus.deal_stage to be undefined -> Deal In Progress
      expect(await screen.findByText('Deal In Progress')).toBeTruthy();
      expect(screen.queryByPlaceholderText(/Describe your experience collaborating on this deal.../i)).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
