import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import AdminMatchingEngine, { MATCHING_MODULES } from '../pages/admin/MatchingEngine';

afterEach(cleanup);

describe('Admin matching engine source reference', () => {
  it('documents all backend weights without introducing frontend scoring', () => {
    for (const module of MATCHING_MODULES) {
      const source = readFileSync(`backend/app/Services/Matching/${module.service}.php`, 'utf8');
      const constants = [...source.matchAll(/public const WEIGHT_(\w+) = ([\d.]+);/g)];
      expect(module.rules).toHaveLength(constants.length);
      for (const [, key, value] of constants) {
        expect(module.rules.find(rule => rule.key === key)?.weight).toBeCloseTo(Number(value) * 100);
      }
      expect(module.rules.reduce((sum, rule) => sum + rule.weight, 0)).toBe(100);
    }
  });

  it('renders a semantic, keyboard-scrollable table with all twelve factors', async () => {
    render(<AdminMatchingEngine />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Matching Engine' })).toBeTruthy();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader').map(cell => cell.textContent)).toEqual(['Module', 'Purpose', 'Actual Criteria / Logic', 'Status']);
    expect(within(table).getAllByRole('rowheader')).toHaveLength(12);
    expect(within(table).getAllByText('Used in scoring')).toHaveLength(12);
    expect(screen.getByRole('region', { name: 'Matching scoring rules' }).getAttribute('tabindex')).toBe('0');
    expect(table.getAttribute('aria-describedby')).toBe('rules-description');
    expect(within(table).getAllByText('Investor Matching')).toHaveLength(6);
    expect(within(table).getAllByText('Professional Matching')).toHaveLength(6);
    for (const module of MATCHING_MODULES) {
      for (const rule of module.rules) {
        expect(within(table).getByText(rule.logic)).toBeTruthy();
      }
    }
  });

  it('discloses source status, fixed configuration and defaults', async () => {
    render(<AdminMatchingEngine />);
    expect(await screen.findByText('Backend rules · Source reference')).toBeTruthy();
    expect(screen.getByText(/Read-only source reference. No live health/)).toBeTruthy();
    expect(screen.getByText(/Weights are fixed in the two matcher classes/)).toBeTruthy();
    expect(screen.getByText(/professional matcher defaults to salary and equity/)).toBeTruthy();
    expect(screen.getByText(/Exact skill-name overlap/)).toBeTruthy();
    expect(screen.getByText(/The frontend cannot change weights or rules/)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    for (const name of ['Deterministic Matching Engine', 'Data Driven', 'Deterministic Rules', 'Authoritative Backend', 'Engine Configuration']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeTruthy();
    }
    expect(screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent)).toEqual(['Algorithm Weights', 'Database / Matching Inputs', 'Client Modification']);
    expect(document.body.textContent).not.toMatch(/preferred_sectors|preferred_stages|min_investment_bdt|Keyword and domain token|Dynamic Engine Configuration/);
  });
});
