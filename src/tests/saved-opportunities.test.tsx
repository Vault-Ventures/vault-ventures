import { describe, expect, it } from 'vitest';
import { mapConnectionsToSavedItems, SavedItem } from '../pages/investor/SavedOpportunities';
import { ConnectionItem } from '../services/api';

const mockConnectionItem = (overrides: Partial<ConnectionItem> = {}): ConnectionItem => ({
  connection_id: 101,
  business: { id: 1, name: 'Apex Logistics' },
  founder: { id: 10, name: 'Founder One' },
  counterparty: { id: 2, name: 'Investor User' },
  counterparty_role: 'investor',
  has_founder_interest: false,
  has_counterparty_interest: true,
  is_mutual: false,
  is_connected: false,
  connected_at: '2026-09-17T00:00:00Z',
  deal: null,
  ...overrides,
});

describe('Saved Opportunities (Pipeline Data Linkage & State Mapping)', () => {
  it('maps opportunity with counterparty interest to interest_sent state', () => {
    const connList = [
      mockConnectionItem({
        has_counterparty_interest: true,
        has_founder_interest: false,
        is_connected: false,
      }),
    ];
    const recs = [
      { id: 1, name: 'Apex Logistics', industry: 'Logistics', business_stage: 'Seed', funding_amount: 5000000 },
    ];

    const result = mapConnectionsToSavedItems(connList, recs);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].name).toBe('Apex Logistics');
    expect(result[0].status).toBe('interest_sent');
    expect(result[0].industry).toBe('Logistics');
    expect(result[0].stage).toBe('Seed');
    expect(result[0].funding).toBe('৳50L');
  });

  it('maps mutual connected opportunity to saved (connected) state', () => {
    const connList = [
      mockConnectionItem({
        business: { id: 2, name: 'Dhaka HealthTech' },
        is_connected: true,
        is_mutual: true,
        has_founder_interest: true,
        has_counterparty_interest: true,
        deal: null,
      }),
    ];
    const recs = [
      { id: 2, name: 'Dhaka HealthTech', industry: 'HealthTech', business_stage: 'Series A', funding_amount: 15000000 },
    ];

    const result = mapConnectionsToSavedItems(connList, recs);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Dhaka HealthTech');
    expect(result[0].status).toBe('saved');
    expect(result[0].funding).toBe('৳1.5Cr');
    expect(result[0].dealId).toBeUndefined();
  });

  it('maps opportunity with active deal to in_deal state with dealId', () => {
    const connList = [
      mockConnectionItem({
        business: { id: 3, name: 'FinFlow BD' },
        is_connected: true,
        deal: { id: 88, stage: 'negotiation' },
      }),
    ];
    const recs = [
      { id: 3, name: 'FinFlow BD', industry: 'FinTech', business_stage: 'Growth', funding_amount: 25000000 },
    ];

    const result = mapConnectionsToSavedItems(connList, recs);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('FinFlow BD');
    expect(result[0].status).toBe('in_deal');
    expect(result[0].dealId).toBe('88');
  });

  it('maps opportunity with completed deal to completed state', () => {
    const connList = [
      mockConnectionItem({
        business: { id: 4, name: 'AgriSense' },
        is_connected: true,
        deal: { id: 99, stage: 'completed' },
      }),
    ];

    const result = mapConnectionsToSavedItems(connList, []);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('AgriSense');
    expect(result[0].status).toBe('completed');
    expect(result[0].dealId).toBe('99');
  });

  it('returns an empty array when no connections exist', () => {
    const result = mapConnectionsToSavedItems([], []);
    expect(result).toEqual([]);
  });

  it('deduplicates opportunities for the same business id', () => {
    const connList = [
      mockConnectionItem({ business: { id: 5, name: 'Solaris Power' }, connection_id: 1 }),
      mockConnectionItem({ business: { id: 5, name: 'Solaris Power' }, connection_id: 2 }),
    ];

    const result = mapConnectionsToSavedItems(connList, []);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('5');
    expect(result[0].name).toBe('Solaris Power');
  });
});
