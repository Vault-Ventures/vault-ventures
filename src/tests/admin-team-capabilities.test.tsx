import React from 'react';
import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import TeamManagement from '../pages/admin/TeamManagement';

it('describes the binary persisted access model without inventing staff tiers or provisioning', async () => {
  render(<TeamManagement />);
  await screen.findByRole('heading', { level: 1, name: 'Administrative Access & Capabilities' });
  expect(screen.getByText('admin_access')).toBeTruthy();
  expect(screen.getByText(/All admin-access users pass the common backend/)).toBeTruthy();
  expect(screen.getByText(/does not implement separate Super Admin/)).toBeTruthy();
  expect(screen.queryByRole('columnheader', { name: 'Super Admin' })).toBeNull();
  expect(screen.queryByText(/can:admin|seeds and configuration|Immutable Administrative Authorization/)).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
});

it('lists only seven implemented capabilities with explicit status and scope', async () => {
  render(<TeamManagement />);
  const table = within(await screen.findByRole('table', { name: 'Implemented administrative capabilities' }));
  const names = ['User governance / directory', 'Tier 1 verification review', 'Business governance', 'Deal oversight', 'Financial reports / discrepancies', 'Governance analytics', 'Financial / verification audit inspection'];
  expect(table.getAllByRole('rowheader').map(row => row.textContent)).toEqual(names);
  expect(table.getAllByText('Available')).toHaveLength(2);
  expect(table.getAllByText('Restricted')).toHaveLength(5);
  expect(table.getByText(/cannot approve their own business/)).toBeTruthy();
  expect(table.getByText(/does not authorize participant deal actions/)).toBeTruthy();
});

it('marks all six unsupported workflows as not implemented', async () => {
  render(<TeamManagement />);
  const table = within(await screen.findByRole('table', { name: 'Documentation-only and unavailable areas' }));
  expect(table.getAllByRole('rowheader').map(row => row.textContent)).toEqual(['Platform policy editing', 'Staff-tier RBAC', 'Staff role assignment', 'Match-engine administration', 'Notification-template administration', 'Staff permission audit history']);
  expect(table.getAllByText('Not Implemented')).toHaveLength(6);
  expect(table.queryByText('Available')).toBeNull();
});

it('uses semantic associations and keyboard-scrollable navy tables', async () => {
  render(<TeamManagement />);
  await screen.findByRole('heading', { level: 1 });
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  for (const table of screen.getAllByRole('table')) {
    expect(table.getAttribute('aria-describedby')).toBeTruthy();
    expect(table.className).toContain('min-w-[640px]');
    expect(table.parentElement?.getAttribute('tabindex')).toBe('0');
    for (const header of within(table).getAllByRole('columnheader')) expect(header.getAttribute('scope')).toBe('col');
    for (const header of within(table).getAllByRole('rowheader')) expect(header.getAttribute('scope')).toBe('row');
    expect(table.closest('section')?.style.background).toBe('rgb(13, 22, 38)');
  }
});
