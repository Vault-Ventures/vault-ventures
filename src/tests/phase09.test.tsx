import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MatchExplainDrawer, type MatchExplainData } from '../components/ui/MatchExplainDrawer';
import NDAFlow from '../pages/shared/NDAFlow';
import Settings from '../pages/shared/Settings';
import PremiumUpgrade from '../pages/shared/PremiumUpgrade';
import { api, type BusinessNdaData } from '../services/api';


const context = vi.hoisted(() => ({
  role: 'investor',
  user: { id: 10, name: 'Tariq Investor', roles: ['investor'] },
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

beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'investor';
  context.user = { id: 10, name: 'Tariq Investor', roles: ['investor'] };
});

describe('Phase 09: Advanced Features & Matching', () => {
  describe('REQ-PH09-01 / BUG-038: Explainable AI Match Scoring Engine', () => {
    it('renders explainable match factors with weights and descriptions in Investor mode', async () => {
      const investorMatchData: MatchExplainData = {
        score: 91,
        subjectName: 'NovaTech AI Ltd',
        subjectInitials: 'NT',
        subjectRole: 'Early Traction Enterprise AI',
        summaryLine: 'Strong alignment across industry, stage, and investment thesis.',
        viewerRole: 'investor',
        ctaLabel: 'Express Interest',
        whyBullets: [
          'Both parties are focused on FinTech and Enterprise AI.',
          'Funding request falls cleanly within investor ticket range.',
        ],
        factors: [
          { name: 'Industry Match', score: 95, weight: 5, explanation: 'Both parties are focused on Technology / AI.' },
          { name: 'Investment Range Compatibility', score: 90, weight: 5, explanation: 'Target funding is within the preferred ৳50,000 - ৳500,000 range.' },
          { name: 'Business Stage Match', score: 85, weight: 4, explanation: 'Early traction matches growth-stage investment thesis.' },
          { name: 'Risk Level Compatibility', score: 90, weight: 4, explanation: 'Moderate risk rating aligns with balanced risk appetite.' },
          { name: 'Location Preference', score: 100, weight: 3, explanation: 'Both based in Dhaka, Bangladesh.' },
          { name: 'Expected Involvement', score: 80, weight: 3, explanation: 'Advisor / Board seat preference matches founder requirements.' },
        ],
      };

      render(<MatchExplainDrawer data={investorMatchData} state="ready" onClose={vi.fn()} />);

      // Overall score & band label
      expect(await screen.findByText('91')).toBeTruthy();
      expect(screen.getByText('Strong Match')).toBeTruthy();
      expect(screen.getByText('NovaTech AI Ltd')).toBeTruthy();
      expect(screen.getByText(/Strong alignment across industry/i)).toBeTruthy();

      // All 6 weighted factors rendered
      expect(screen.getAllByText('Industry Match').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Investment Range Compatibility').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Business Stage Match').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Risk Level Compatibility').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Location Preference').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Expected Involvement').length).toBeGreaterThan(0);

      // Explanations present
      expect(screen.getByText(/Both parties are focused on Technology \/ AI/i)).toBeTruthy();
      expect(screen.getByText(/Target funding is within the preferred/i)).toBeTruthy();
    });

    it('renders explainable match factors with weights and descriptions in Professional mode', async () => {
      const profMatchData: MatchExplainData = {
        score: 88,
        subjectName: 'FinFlow Systems',
        subjectInitials: 'FS',
        subjectRole: 'FinTech Startup',
        summaryLine: 'High skill overlap and compensation alignment.',
        viewerRole: 'professional',
        ctaLabel: 'Apply Now',
        whyBullets: ['Required React and TypeScript skills are verified.'],
        factors: [
          { name: 'Required Skill Overlap', score: 95, weight: 5, explanation: 'Match for React, TypeScript, and Laravel.' },
          { name: 'Industry Experience', score: 85, weight: 4, explanation: 'Previous fintech project history confirmed.' },
          { name: 'Experience Level', score: 90, weight: 4, explanation: 'Senior engineer level matches lead role requirements.' },
          { name: 'Availability', score: 80, weight: 3, explanation: 'Part-time / 20 hrs/week availability matches vacancy.' },
          { name: 'Location', score: 100, weight: 3, explanation: 'Remote / Dhaka.' },
          { name: 'Compensation Preference', score: 75, weight: 2, explanation: 'Hybrid equity and stipend preference acceptable.' },
        ],
      };

      render(<MatchExplainDrawer data={profMatchData} state="ready" onClose={vi.fn()} />);

      expect(await screen.findByText('88')).toBeTruthy();
      expect(screen.getByText('FinFlow Systems')).toBeTruthy();
      expect(screen.getAllByText('Required Skill Overlap').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Industry Experience').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Experience Level').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Compensation Preference').length).toBeGreaterThan(0);
    });
  });


  describe('REQ-PH09-02 / BUG-023: Bilateral NDA Execution & Staged Disclosure', () => {
    it('renders bilateral NDA status and allows digital signing for Stage 3 access', async () => {
      const mockNdaData: BusinessNdaData = {
        id: 5,
        business_id: 12,
        counterparty_user_id: 10,
        founder_accepted: true,
        founder_accepted_at: '2026-09-15T12:00:00Z',
        counterparty_accepted: false,
        counterparty_accepted_at: null,
        status: 'pending',
        current_user_is_owner: false,
        current_user_accepted: false,
        can_sign: true,
        parties: {
          founder: { name: 'Alice Founder', role: 'founder', accepted: true, accepted_at: '2026-09-15T12:00:00Z' },
          counterparty: { name: 'Tariq Investor', role: 'investor', accepted: false, accepted_at: null },
        },
      };

      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url.includes('/api/businesses/12')) {
          return { id: 12, name: 'Apex Logistics', description: 'Smart logistics solution' };
        }
        if (url.includes('/api/me/businesses/12/nda')) {
          return mockNdaData;
        }
        return {};
      });

      const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
        ...mockNdaData,
        counterparty_accepted: true,
        status: 'active',
      });

      render(
        <MemoryRouter initialEntries={['/app/nda/12']}>
          <Routes>
            <Route path="/app/nda/:id" element={<NDAFlow />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify page and party statuses
      expect(await screen.findByText(/Non-Disclosure Agreement/i)).toBeTruthy();
      expect(screen.getByText('Apex Logistics (Founder)')).toBeTruthy();
      expect(screen.getByText('You (Tariq Investor)')).toBeTruthy();
      expect((await screen.findAllByText('Accepted')).length).toBeGreaterThan(0);
      expect((await screen.findAllByText('Awaiting')).length).toBeGreaterThan(0);

      // Proceed to review document
      fireEvent.click(screen.getByRole('button', { name: /Review NDA/i }));

      // Proceed to sign step
      expect(await screen.findByText('Key Terms Summary')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /Continue to Sign/i }));

      // Check agreement checkbox and submit signature
      const checkbox = await screen.findByRole('checkbox');
      fireEvent.click(checkbox);

      const signBtn = screen.getByRole('button', { name: /Confirm & Sign/i });
      fireEvent.click(signBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/api/me/businesses/12/nda/accept', expect.any(Object));
      });
    });


    it('handles Tier 1 identity verification requirement error gracefully', async () => {
      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url.includes('/api/businesses/12')) {
          return { id: 12, name: 'Apex Logistics' };
        }
        if (url.includes('/api/me/businesses/12/nda')) {
          const err: any = new Error('Tier 1 identity verification is required to initiate an NDA.');
          err.status = 403;
          throw err;
        }
        return {};
      });

      render(
        <MemoryRouter initialEntries={['/app/nda/12']}>
          <Routes>
            <Route path="/app/nda/:id" element={<NDAFlow />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText('Tier 1 Verification Required')).toBeTruthy();
      expect(screen.getByText(/Tier 1 identity verification is required to initiate an NDA/i)).toBeTruthy();
    });

  });

  describe('REQ-PH09-03: Notification Preferences in Settings', () => {
    it('fetches notification preferences and allows toggling settings with API persistence', async () => {
      const mockPrefs = {
        new_matches: true,
        interest_received: true,
        deal_room_updates: false,
        milestone_updates: true,
      };

      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url === '/api/me/notification-preferences') {
          return mockPrefs;
        }
        return {};
      });

      const patchSpy = vi.spyOn(api, 'patch').mockResolvedValue({
        ...mockPrefs,
        deal_room_updates: true,
      });

      render(<Settings />);

      expect(await screen.findByText('Notifications')).toBeTruthy();
      expect(screen.getByText('New matches')).toBeTruthy();
      expect(screen.getByText('Interest received')).toBeTruthy();
      expect(screen.getByText('Deal Room updates')).toBeTruthy();
      expect(screen.getByText('Milestone updates')).toBeTruthy();


      // Toggle 'Deal Room updates'
      const toggleButtons = await screen.findAllByRole('button', { pressed: false });
      expect(toggleButtons.length).toBeGreaterThan(0);
      fireEvent.click(toggleButtons[0]);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith(
          '/api/me/notification-preferences',
          expect.objectContaining({ preferences: expect.any(Object) })
        );
      });
    });
  });

  describe('REQ-PH09-04: Role-Specific Premium Feature Comparison', () => {
    it('displays role-specific feature matrix and supports simulated upgrade workflow', async () => {
      render(
        <MemoryRouter initialEntries={['/app/premium']}>
          <Routes>
            <Route path="/app/premium" element={<PremiumUpgrade />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify role feature matrix tabs and headers
      expect(await screen.findByText('VAULT VENTURES PREMIUM')).toBeTruthy();
      expect(screen.getByText('Unlock the Full Platform')).toBeTruthy();
      expect(screen.getByText('Founder')).toBeTruthy();
      expect(screen.getByText('Investor')).toBeTruthy();
      expect(screen.getByText('Professional')).toBeTruthy();

      // Free vs Premium comparison rows
      expect(screen.getByText('AI Match Score')).toBeTruthy();
      expect(screen.getByText('Full explainability')).toBeTruthy();
      expect(screen.getByText('Priority platform support')).toBeTruthy();

      // Test simulated upgrade flow
      const upgradeBtns = screen.getAllByRole('button', { name: /Choose Premium/i });
      expect(upgradeBtns.length).toBeGreaterThan(0);
      fireEvent.click(upgradeBtns[0]);

      // Confirm step
      expect(await screen.findByText('Selected Plan')).toBeTruthy();
      expect(screen.getByText(/Prototype \/ simulated upgrade/i)).toBeTruthy();

      const confirmBtn = screen.getByRole('button', { name: /Confirm Upgrade/i });
      fireEvent.click(confirmBtn);

      // Success step
      expect(await screen.findByText('Premium Activated', {}, { timeout: 3000 })).toBeTruthy();
      expect(screen.getByText(/account now has full Premium access/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Explore Premium Features/i })).toBeTruthy();
    });
  });
});



