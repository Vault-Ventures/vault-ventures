import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../services/api';

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=test-token; path=/';
  fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ success: true, data: null }), { headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'; });

it('uses participant endpoints, session credentials and CSRF for mutations', async () => {
  await api.verification.sendEmail();
  await api.verification.sendPhoneCode('+8801712345678');
  await api.verification.verifyPhone('123456');
  await api.verification.create();
  expect(fetchMock.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
    '/api/auth/email/verification-notification', '/api/me/phone/send-code', '/api/me/phone/verify-code', '/api/me/verification-requests',
  ]);
  for (const [, options] of fetchMock.mock.calls) {
    expect(options.method).toBe('POST'); expect(options.credentials).toBe('include'); expect(options.headers['X-XSRF-TOKEN']).toBe('test-token');
  }
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ phone: '+8801712345678' });
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ code: '123456' });
  expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ requested_tier: 1 });
  expect('approve' in api.verification).toBe(false);
});

it('reads account, latest request, detail and evidence without mutations', async () => {
  await api.verification.account(); await api.verification.latest(); await api.verification.get(45); await api.verification.evidence(45);
  expect(fetchMock.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
    '/api/auth/user', '/api/me/verification-requests/latest', '/api/me/verification-requests/45', '/api/me/verification-requests/45/evidence',
  ]);
  for (const [, options] of fetchMock.mock.calls) expect(options.method).toBe('GET');
});

it('uploads multipart file without overriding the browser content boundary', async () => {
  const file = new File(['document'], 'identity.pdf', { type: 'application/pdf' });
  await api.verification.uploadEvidence(45, file);
  const [url, options] = fetchMock.mock.calls[0];
  expect(new URL(url).pathname).toBe('/api/me/verification-requests/45/evidence');
  expect(options.method).toBe('POST'); expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get('file')).toBe(file); expect(options.headers['Content-Type']).toBeUndefined();
});

it('retrieves admin evidence with cookies as binary, never as a public URL', async () => {
  fetchMock.mockResolvedValue(new Response('document', { headers: { 'content-type': 'application/pdf' } }));
  const result = await api.admin.verificationRequests.downloadEvidence(41, 23);
  expect(result.type).toBe('application/pdf');
  const [url, options] = fetchMock.mock.calls[0];
  expect(new URL(url).pathname).toBe('/api/admin/verification-requests/41/evidence/23/download');
  expect(options.credentials).toBe('include'); expect(options.method).toBe('GET');
});

it('preserves authorization errors on binary retrieval', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Forbidden' } }), { status: 403, headers: { 'content-type': 'application/json' } }));
  await expect(api.admin.verificationRequests.downloadEvidence(41, 23)).rejects.toMatchObject({ status: 403, message: 'Forbidden' });
});

it('keeps public and internal decision messages in separate fields', async () => {
  await api.admin.verificationRequests.requestInformation(41, 'Public instructions', 'Internal notes');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ participant_message: 'Public instructions', admin_notes: 'Internal notes' });
  await api.admin.verificationRequests.reject(41, 'Private reason', 'Private notes', 'Public rejection');
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ participant_message: 'Public rejection', admin_notes: 'Private notes', rejection_reason: 'Private reason' });
});
