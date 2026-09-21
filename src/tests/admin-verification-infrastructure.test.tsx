import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import VerificationQueue from '../pages/admin/VerificationQueue';
import { api, AdminVerificationRequestData } from '../services/api';

let request: AdminVerificationRequestData;
beforeEach(() => {
  vi.restoreAllMocks();
  request = {
    id: 41, user_id: 91, requested_tier: 1, status: 'pending',
    user: { id: 91, name: 'Applicant', email: 'applicant@example.test' },
    evidence: [{ id: 23, verification_request_id: 41, original_filename: 'identity.pdf', mime_type: 'application/pdf', file_size_bytes: 2048, created_at: '2026-09-21T12:00:00Z' }],
  };
  vi.spyOn(api.admin.verificationRequests, 'list').mockImplementation(async () => [request]);
  vi.spyOn(api.admin.verificationRequests, 'get').mockImplementation(async () => request);
  vi.spyOn(api.admin.verificationRequests, 'downloadEvidence').mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
  vi.spyOn(api.admin.verificationRequests, 'requestInformation').mockResolvedValue(request);
  vi.spyOn(api.admin.verificationRequests, 'reject').mockResolvedValue(request);
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:private-document');
    static revokeObjectURL = vi.fn();
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
async function click(element: HTMLElement) { await act(async () => { fireEvent.click(element); }); }
async function change(element: HTMLElement, value: string) { await act(async () => { fireEvent.change(element, { target: { value } }); }); }
async function open() {
  const view = render(<VerificationQueue />);
  await click(await screen.findByRole('button', { name: 'Review' }));
  return view;
}
async function documents() {
  const view = await open();
  await click(screen.getByRole('button', { name: 'Submitted Evidence' }));
  return view;
}

it('renders authoritative evidence size, MIME and creation time without invented categories', async () => {
  await documents();
  expect(screen.getByText(/application\/pdf.*2 KiB/)).toBeTruthy();
  expect(screen.getByText(new Date('2026-09-21T12:00:00Z').toLocaleString())).toBeTruthy();
  expect(screen.queryByText(/NaN|National ID/)).toBeNull();
});

it.each(['application/pdf', 'image/jpeg', 'image/png'])('retrieves %s through the authenticated helper and revokes the URL on close', async mime => {
  vi.mocked(api.admin.verificationRequests.downloadEvidence).mockResolvedValue(new Blob(['document'], { type: mime }));
  const view = await documents(); await click(screen.getByRole('button', { name: 'View Evidence' }));
  expect(api.admin.verificationRequests.downloadEvidence).toHaveBeenCalledExactlyOnceWith(41, 23);
  expect(screen.getByRole('link', { name: 'Download document' }).getAttribute('href')).toBe('blob:private-document');
  view.unmount(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-document');
});

it('expires object URLs after a minute', async () => {
  await documents();
  const timers = vi.spyOn(window, 'setTimeout');
  await click(screen.getByRole('button', { name: 'View Evidence' }));
  await screen.findByRole('link', { name: 'Download document' });
  const expiry = timers.mock.calls.find(([, delay]) => delay === 60_000)?.[0];
  expect(typeof expiry).toBe('function');
  await act(async () => { (expiry as () => void)(); });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-document');
  expect(screen.queryByRole('link', { name: 'Download document' })).toBeNull();
});

it('handles denied evidence access without creating a link', async () => {
  vi.mocked(api.admin.verificationRequests.downloadEvidence).mockRejectedValue(new Error('Forbidden'));
  await documents(); await click(screen.getByRole('button', { name: 'View Evidence' }));
  expect(screen.getByRole('alert').textContent).toBe('Forbidden');
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('does not offer decisions on cancelled requests', async () => {
  request.status = 'cancelled'; await open();
  for (const name of ['Approve', 'Reject', 'Request Info']) expect(screen.queryByRole('button', { name })).toBeNull();
});

it('separates participant instructions from internal notes for information requests', async () => {
  await open(); await click(screen.getByRole('button', { name: 'Request Info' }));
  const modal = within(screen.getByRole('dialog', { name: 'Request Additional Information' }));
  await change(modal.getByLabelText('Message to Participant'), 'Please upload a legible copy.');
  await change(modal.getByLabelText('Internal Admin Notes'), 'Internal risk review');
  await click(modal.getByRole('button', { name: 'Send Request' }));
  expect(api.admin.verificationRequests.requestInformation).toHaveBeenCalledWith(41, 'Please upload a legible copy.', 'Internal risk review');
});

it('separates participant rejection message from private reason/notes', async () => {
  await open(); await click(screen.getByRole('button', { name: 'Reject' }));
  const modal = within(screen.getByRole('dialog', { name: 'Reject Verification' }));
  await change(modal.getByRole('combobox'), 'Insufficient evidence');
  await change(modal.getByLabelText('Message to Participant'), 'Resubmit with a clear copy.');
  await change(modal.getByLabelText('Internal Admin Notes'), 'Internal only');
  await click(modal.getByRole('button', { name: 'Confirm Rejection' }));
  expect(api.admin.verificationRequests.reject).toHaveBeenCalledWith(41, 'Insufficient evidence', 'Internal only', 'Resubmit with a clear copy.');
});
