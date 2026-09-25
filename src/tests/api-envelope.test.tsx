import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../services/api';

afterEach(() => vi.unstubAllGlobals());

it('preserves business items and pagination while unwrapping the API envelope', async () => {
  const data = { items: [{ id: 42, name: 'Later business' }], pagination: { current_page: 2, total: 16, per_page: 15 } };
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  expect(await api.businesses.listPage(2)).toEqual({ ...data, pagination: { ...data.pagination, last_page: 2 } });
  expect(fetch.mock.calls[0][0]).toContain('/api/me/businesses?page=2');
});

it('preserves analysis availability metadata even when no analysis exists', async () => {
  const envelope = { success: true, data: null, meta: { generation_enabled: false, provider_status: 'not_configured', eligible: true, current_version: null } };
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(envelope), { headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  expect(await api.businessAnalysis.latest(7)).toEqual(envelope);
  expect(fetch.mock.calls[0][0]).toContain('/api/me/businesses/7/business-analyses/latest');
  expect(fetch.mock.calls[0][1]).not.toHaveProperty('preserveEnvelope');
});
