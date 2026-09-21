import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ParticipantVerification from '../components/verification/ParticipantVerification';
import Profile from '../pages/shared/Profile';
import NDAFlow from '../pages/shared/NDAFlow';
import { ToastProvider } from '../components/ui/Feedback';
import { api, ApiError, ParticipantVerificationRequestData, VerificationAccountData, VerificationRequestStatus } from '../services/api';

const context = vi.hoisted(() => ({ role: 'professional', user: { id: 91, name: 'Participant', verification_tier: 0 }, refreshUser: vi.fn() }));
vi.mock('../components/layout/AppShell', () => ({ useRole: () => ({ role: context.role }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: context.user, isAdmin: false, refreshUser: context.refreshUser, session: { user: context.user, roles: [context.role], activeRole: context.role } }) }));

let account: VerificationAccountData;
let request: ParticipantVerificationRequestData | null;
let evidence: any[];
function record(status: VerificationRequestStatus): ParticipantVerificationRequestData {
  return { id: 45, user_id: 91, requested_tier: 1, requested_tier_label: 'Identity Verified', status, submitted_at: '2026-09-21T12:00:00Z', reviewed_at: null, created_at: null, updated_at: null };
}
function contactsVerified() { account.email_verified_at = '2026-09-21'; account.phone_verified_at = '2026-09-21'; account.phone = '+8801712345678'; }
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
async function click(element: HTMLElement) { await act(async () => { fireEvent.click(element); }); }
async function change(element: HTMLElement, event: any) { await act(async () => { fireEvent.change(element, event); }); }
const section = (name: string) => within(screen.getByRole('region', { name }));
async function ready() { await screen.findByRole('region', { name: 'Identity Verification Request' }); await waitFor(() => expect(button('Refresh Status').disabled).toBe(false)); }
async function mount() { const view = render(<ParticipantVerification />); await ready(); return view; }
beforeEach(() => {
  vi.restoreAllMocks();
  context.role = 'professional';
  context.user = { id: 91, name: 'Participant', verification_tier: 0 };
  account = { id: 91, email: 'participant@example.test', email_verified_at: null, phone: null, phone_verified_at: null, verification_tier: 0 };
  request = null;
  evidence = [];
  vi.spyOn(api.verification, 'account').mockImplementation(async () => ({ ...account }));
  vi.spyOn(api.verification, 'latest').mockImplementation(async () => request ? { ...request } : null);
  vi.spyOn(api.verification, 'evidence').mockImplementation(async () => [...evidence]);
  vi.spyOn(api.verification, 'sendEmail').mockResolvedValue(null);
  vi.spyOn(api.verification, 'sendPhoneCode').mockResolvedValue({ delivery_channel: 'local_capture' });
  vi.spyOn(api.verification, 'verifyPhone').mockResolvedValue(null);
  vi.spyOn(api.verification, 'create').mockImplementation(async () => { request = record('pending'); return request; });
  vi.spyOn(api.verification, 'uploadEvidence').mockImplementation(async () => evidence[0]);
  vi.spyOn(api.admin.verificationRequests, 'approve').mockRejectedValue(new Error('Participant must not approve'));
  vi.spyOn(api.profile, 'get').mockResolvedValue({ user: { id: 91, name: 'Participant' }, roles: [context.role], profiles: {} } as any);
});

describe('participant verification', () => {
  it.each(['needs_information', 'rejected'] as const)('shows only the participant message for %s', async status => {
    request = { ...record(status), participant_message: 'Please provide a legible copy.', admin_notes: 'SECRET', rejection_reason: 'PRIVATE' } as any;
    await mount();
    expect(screen.getByText('Please provide a legible copy.')).toBeTruthy();
    expect(screen.queryByText(/SECRET|PRIVATE/)).toBeNull();
  });
  it('does not fabricate phone verification when delivery fails', async () => {
    vi.mocked(api.verification.sendPhoneCode).mockRejectedValue(new Error('Service unavailable'));
    await mount(); await change(screen.getByLabelText('International phone number'), { target: { value: '+8801712345678' } });
    await click(button('Send Code'));
    expect(screen.getByRole('alert').textContent).toContain('Service unavailable');
    expect(screen.getByText('Phone verification required')).toBeTruthy();
    expect(screen.getByText(/private developer capture, not an SMS/)).toBeTruthy();
  });
  it('loads correctly under React StrictMode effect replay', async () => {
    render(<React.StrictMode><ParticipantVerification /></React.StrictMode>); await ready();
    expect(screen.getByText('No verification request')).toBeTruthy();
  });
  it('blocks repeat email requests while the first request is in flight', async () => {
    let resolve!: (value: null) => void;
    vi.mocked(api.verification.sendEmail).mockReturnValue(new Promise(done => { resolve = done; }));
    await mount();
    await click(button('Send Verification Email')); await click(button('Send Verification Email'));
    expect(button('Send Verification Email').disabled).toBe(true);
    expect(api.verification.sendEmail).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(null); }); await ready();
  });
  it('renders the complete Tier 0 workflow and unmet prerequisites', async () => {
    await mount();
    for (const name of ['Email Verification', 'Phone Verification', 'Identity Verification Request', 'Evidence', 'Verification Review']) expect(screen.getByRole('region', { name })).toBeTruthy();
    expect(screen.getByText('Email verification required')).toBeTruthy();
    expect(screen.getByText('Phone verification required')).toBeTruthy();
    expect(button('Request Tier 1 Verification').disabled).toBe(true);
  });
  it('shows authoritative verified email without resend', async () => {
    account.email_verified_at = '2026-09-21'; await mount();
    expect(section('Email Verification').getByText('Verified')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send Verification Email' })).toBeNull();
    expect(button('Request Tier 1 Verification').disabled).toBe(true);
  });
  it('requests email safely, permits retry, and does not fabricate verification', async () => {
    await mount(); await click(button('Send Verification Email'));
    await screen.findByText(/Verification email requested/); await ready();
    expect(api.verification.sendEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Email verification required')).toBeTruthy();
    await click(button('Send Verification Email')); await ready();
    expect(api.verification.sendEmail).toHaveBeenCalledTimes(2);
  });
  it('shows email failure and allows another attempt', async () => {
    vi.mocked(api.verification.sendEmail).mockRejectedValue(new Error('Too many requests. Try later.'));
    await mount(); await click(button('Send Verification Email'));
    expect((await screen.findByRole('alert')).textContent).toContain('Too many requests');
    expect(button('Send Verification Email').disabled).toBe(false);
  });
  it('accepts an international phone and sends the exact payload without claiming delivery', async () => {
    await mount(); expect(button('Send Code').disabled).toBe(true);
    await change(screen.getByLabelText('International phone number'), { target: { value: '+8801712345678' } });
    await click(button('Send Code')); await ready();
    expect(api.verification.sendPhoneCode).toHaveBeenCalledExactlyOnceWith('+8801712345678');
    expect(screen.getByText(/Code delivery completed/)).toBeTruthy();
    expect(screen.getByText('Phone verification required')).toBeTruthy();
  });
  it('shows phone verification only after reloading server confirmation', async () => {
    vi.mocked(api.verification.verifyPhone).mockImplementation(async () => { account.phone_verified_at = '2026-09-21'; account.phone = '+8801712345678'; return null; });
    await mount(); await change(screen.getByLabelText('Six-digit code'), { target: { value: '123456' } });
    await click(button('Verify Phone')); await ready();
    expect(api.verification.verifyPhone).toHaveBeenCalledExactlyOnceWith('123456');
    expect(section('Phone Verification').getByText('Verified')).toBeTruthy();
  });
  it('does not infer phone verification from a successful POST alone', async () => {
    await mount(); await change(screen.getByLabelText('Six-digit code'), { target: { value: '123456' } });
    await click(button('Verify Phone')); await ready();
    expect(screen.getByText('Phone verification required')).toBeTruthy();
  });
  it('shows backend code validation failure', async () => {
    vi.mocked(api.verification.verifyPhone).mockRejectedValue(new ApiError(422, 'Invalid', undefined, { code: ['The verification code is incorrect.'] }));
    await mount(); await change(screen.getByLabelText('Six-digit code'), { target: { value: '123456' } });
    await click(button('Verify Phone'));
    expect((await screen.findByRole('alert')).textContent).toContain('The verification code is incorrect.');
    expect(screen.getByText('Phone verification required')).toBeTruthy();
  });
  it('creates one Tier 1 request and reads pending state without changing tier', async () => {
    contactsVerified(); await mount();
    await click(button('Request Tier 1 Verification')); await click(button('Request Tier 1 Verification'));
    await screen.findByText('Pending'); await ready();
    expect(api.verification.create).toHaveBeenCalledTimes(1);
    expect(button('Request Tier 1 Verification').disabled).toBe(true);
    expect(account.verification_tier).toBe(0);
    expect(context.user.verification_tier).toBe(0);
    expect(api.admin.verificationRequests.approve).not.toHaveBeenCalled();
  });
  it.each([['pending', 'Pending'], ['under_review', 'Under Review'], ['needs_information', 'Needs Information']] as const)('loads %s and blocks duplicate submission', async (status, label) => {
    contactsVerified(); request = record(status); await mount();
    expect(screen.getByText(label)).toBeTruthy();
    expect(button('Request Tier 1 Verification').disabled).toBe(true);
    expect(screen.getByLabelText('Evidence file')).toBeTruthy();
    if (status === 'needs_information') expect(screen.getByText(/Specific review instructions are not available/)).toBeTruthy();
    expect(api.verification.create).not.toHaveBeenCalled();
  });
  it.each(['rejected', 'cancelled'] as const)('allows a new request after %s', async status => {
    contactsVerified(); request = record(status); await mount();
    expect(button('Submit New Tier 1 Request').disabled).toBe(false);
    expect(screen.queryByLabelText('Evidence file')).toBeNull();
    await click(button('Submit New Tier 1 Request')); await screen.findByText('Pending');
  });
  it('shows approved account tier, no upload and no participant approval control', async () => {
    contactsVerified(); account.verification_tier = 1; request = record('approved'); await mount();
    expect(screen.getByText('Approved — Tier 1 Identity Verified.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Request Tier 1|Approve/i })).toBeNull();
    expect(screen.queryByLabelText('Evidence file')).toBeNull();
    expect(api.admin.verificationRequests.approve).not.toHaveBeenCalled();
  });
  it('does not promote the account based on approved request status alone', async () => {
    contactsVerified(); request = record('approved'); await mount();
    expect(screen.getByText(/account does not currently show Tier 1/)).toBeTruthy();
    expect(account.verification_tier).toBe(0);
    expect(button('Request Tier 1 Verification').disabled).toBe(true);
  });
  it('uploads evidence and persists server metadata after refetch/remount', async () => {
    request = record('pending');
    const uploaded = { id: 11, verification_request_id: 45, original_filename: 'identity.pdf', mime_type: 'application/pdf', file_size_bytes: 1024, created_at: null };
    vi.mocked(api.verification.uploadEvidence).mockImplementation(async () => { evidence = [uploaded]; return uploaded; });
    const view = await mount(); const file = new File(['document'], 'identity.pdf', { type: 'application/pdf' });
    await change(screen.getByLabelText('Evidence file'), { target: { files: [file] } });
    await click(button('Upload Evidence')); await screen.findByText(/identity.pdf — application\/pdf — 1 KiB/);
    expect(api.verification.uploadEvidence).toHaveBeenCalledExactlyOnceWith(45, file);
    view.unmount(); await mount(); expect(screen.getByText(/identity.pdf/)).toBeTruthy();
    expect(api.verification.evidence).toHaveBeenCalledTimes(3);
  });
  it.each(['type', 'size'])('rejects invalid evidence %s before upload', async invalid => {
    request = record('pending'); await mount();
    const file = invalid === 'type' ? new File(['x'], 'bad.exe', { type: 'application/octet-stream' }) : new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' });
    await change(screen.getByLabelText('Evidence file'), { target: { files: [file] } }); await click(button('Upload Evidence'));
    expect(screen.getByRole('alert').textContent).toContain('no larger than 5 MiB');
    expect(api.verification.uploadEvidence).not.toHaveBeenCalled();
  });
  it('shows server upload errors and does not add local evidence', async () => {
    request = record('pending'); vi.mocked(api.verification.uploadEvidence).mockRejectedValue(new Error('Evidence upload rejected'));
    await mount(); await change(screen.getByLabelText('Evidence file'), { target: { files: [new File(['x'], 'id.pdf', { type: 'application/pdf' })] } });
    await click(button('Upload Evidence')); expect((await screen.findByRole('alert')).textContent).toContain('Evidence upload rejected');
    expect(screen.getByText('No evidence uploaded.')).toBeTruthy();
  });
  it('blocks uploads at the five-file limit', async () => {
    request = record('needs_information'); evidence = Array.from({ length: 5 }, (_, id) => ({ id, original_filename: `${id}.pdf`, mime_type: 'application/pdf', file_size_bytes: 10 }));
    await mount(); expect(screen.getByText('The five-file limit has been reached.')).toBeTruthy(); expect(screen.queryByLabelText('Evidence file')).toBeNull();
  });
  it('reloads authoritative approval on refresh', async () => {
    request = record('pending'); await mount(); account.verification_tier = 1; request = record('approved');
    await click(button('Refresh Status')); await screen.findByText('Approved — Tier 1 Identity Verified.');
    expect(api.verification.latest).toHaveBeenCalledTimes(2);
  });
  it('reloads on window focus after external email verification', async () => {
    await mount(); account.email_verified_at = '2026-09-21'; await act(async () => { fireEvent.focus(window); });
    await waitFor(() => expect(section('Email Verification').getByText('Verified')).toBeTruthy());
  });
  it('fails closed when status cannot load and recovers with refresh', async () => {
    contactsVerified(); vi.mocked(api.verification.latest).mockRejectedValueOnce(new Error('Offline'));
    render(<ParticipantVerification />); await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Request Tier 1 Verification' })).toBeNull();
    await click(button('Refresh Status')); await ready(); expect(button('Request Tier 1 Verification').disabled).toBe(false);
  });
  it('reloads a concurrent pending request after the backend rejects a duplicate', async () => {
    contactsVerified(); vi.mocked(api.verification.create).mockImplementation(async () => { request = record('pending'); throw new Error('You already have an active verification request under review.'); });
    await mount(); await click(button('Request Tier 1 Verification')); await screen.findByRole('alert');
    expect(screen.getByText('Pending')).toBeTruthy(); expect(button('Request Tier 1 Verification').disabled).toBe(true);
  });
  it('never renders admin-only fields or private evidence paths', async () => {
    request = { ...record('needs_information'), admin_notes: 'SECRET ADMIN NOTE' } as any;
    evidence = [{ id: 11, original_filename: 'id.pdf', mime_type: 'application/pdf', file_size_bytes: 10, path: 'SECRET PATH' }];
    await mount(); expect(screen.queryByText(/SECRET/)).toBeNull();
  });
});

function Location() { return <output data-testid="location">{useLocation().pathname}{useLocation().search}</output>; }
function profileApp(url = '/app/profile?tab=verification') {
  return <MemoryRouter initialEntries={[url]}><ToastProvider><Location /><Routes><Route path="/app/profile" element={<Profile />} /><Route path="/app/nda/:id" element={<NDAFlow />} /></Routes></ToastProvider></MemoryRouter>;
}
describe('shared Profile verification navigation', () => {
  it.each(['founder', 'investor', 'professional'])('supports %s and direct URL remount', async role => {
    context.role = role; const view = render(profileApp()); await ready();
    expect(screen.getByRole('heading', { name: 'Identity Verification' })).toBeTruthy();
    view.unmount(); render(profileApp()); await ready(); expect(api.verification.latest).toHaveBeenCalledTimes(2);
  });
  it('updates the URL when selecting the tab and reloads after navigation away/back', async () => {
    render(profileApp('/app/profile')); await click(await screen.findByRole('button', { name: 'Verification' })); await ready();
    expect(screen.getByTestId('location').textContent).toBe('/app/profile?tab=verification');
    await click(button('Overview')); request = record('under_review'); await click(button('Verification'));
    await screen.findByText('Under Review'); expect(api.verification.latest).toHaveBeenCalledTimes(2);
  });
  it('refetches on workspace switch without creating another request', async () => {
    request = record('pending'); const view = render(profileApp()); await ready();
    context.role = 'investor'; view.rerender(profileApp()); await ready();
    expect(api.verification.latest).toHaveBeenCalledTimes(2); expect(api.verification.create).not.toHaveBeenCalled();
  });
  it('clears prior user state across logout/login remount', async () => {
    request = record('pending'); const view = render(profileApp()); await ready(); view.unmount();
    context.user = { id: 92, name: 'Other participant', verification_tier: 0 }; account.id = 92; request = null;
    render(profileApp()); await ready(); expect(screen.getByText('No verification request')).toBeTruthy(); expect(screen.queryByText('Pending')).toBeNull();
  });
  it('NDA Go to Verification opens the actual Profile Verification tab', async () => {
    vi.spyOn(api, 'get').mockImplementation(async url => { if (url.includes('/nda')) throw Object.assign(new Error('Tier 1 identity verification is required to initiate an NDA.'), { status: 403 }); return { id: 42, name: 'Business' }; });
    render(profileApp('/app/nda/42')); await click(await screen.findByRole('button', { name: 'Go to Verification' })); await ready();
    expect(screen.getByTestId('location').textContent).toBe('/app/profile?tab=verification'); expect(screen.getByRole('heading', { name: 'Identity Verification' })).toBeTruthy();
  });
});
