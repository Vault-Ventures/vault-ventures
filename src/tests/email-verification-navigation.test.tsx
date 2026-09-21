import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import VerifyEmail from '../pages/auth/VerifyEmail';

const verifyEmail = vi.hoisted(() => vi.fn());
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ verifyEmail }) }));
beforeEach(() => { verifyEmail.mockReset().mockResolvedValue(undefined); });
function Destination() { return <p>{useLocation().pathname}{useLocation().search}</p>; }
it('returns successful SPA email verification to the Verification tab, not a workspace dashboard', async () => {
  render(<MemoryRouter initialEntries={['/auth/email/verify/91/testhash?expires=123&signature=signed']}><Routes>
    <Route path="/auth/email/verify/:id/:hash" element={<VerifyEmail />} />
    <Route path="/app/profile" element={<Destination />} />
  </Routes></MemoryRouter>);
  const button = await screen.findByRole('button', { name: 'Continue to Verification' });
  expect(verifyEmail).toHaveBeenCalledWith('91', 'testhash', '?expires=123&signature=signed');
  await act(async () => { fireEvent.click(button); });
  expect(screen.getByText('/app/profile?tab=verification')).toBeTruthy();
  expect(verifyEmail).toHaveBeenCalledTimes(1);
});
