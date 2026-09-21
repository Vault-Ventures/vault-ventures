import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconShield, IconUsers, IconStar, IconFilter,
} from '../../components/layout/Icons';
import { api, AdminUserData, ApiError } from '../../services/api';

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  founder: { bg: 'rgba(198,122,78,0.12)', color: '#C67A4E', border: 'rgba(198,122,78,0.25)' },
  investor: { bg: 'rgba(201,162,75,0.12)', color: '#C9A24B', border: 'rgba(201,162,75,0.25)' },
  professional: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E', border: 'rgba(34,197,94,0.22)' },
  admin: { bg: 'rgba(147,161,191,0.12)', color: '#93A1BF', border: 'rgba(147,161,191,0.25)' },
};

function Skeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#1c2a3e] last:border-0">
          <div className="w-9 h-9 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-36 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2.5 w-24 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-6 w-24 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-6 w-20 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-6 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden sm:block" />
          <div className="h-8 w-24 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: currentPage,
        per_page: 25,
      };

      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (roleFilter) params.role = roleFilter;
      if (tierFilter !== '') params.verification_tier = tierFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.admin.users.list(params);
      if (res?.users) {
        setUsers(res.users);
        setTotalUsers(res.pagination?.total ?? res.users.length);
        setCurrentPage(res.pagination?.current_page ?? 1);
        setLastPage(res.pagination?.last_page ?? 1);
      } else {
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load user directory from server.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, tierFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setTierFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== '' || tierFilter !== '' || statusFilter !== '';

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">User Management</h1>
            <Badge variant="neutral">Access Governance</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Platform participant directory, role mapping, verification tiers, and reputation governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/app/admin/verification')} icon={<IconShield s={14} />}>
            Verification Queue
          </Button>
          <Button size="sm" onClick={() => navigate('/app/admin/reputation')} icon={<IconStar s={14} />}>
            Reputation Audit
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={() => fetchUsers()}>
            Retry
          </Button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <IconSearch s={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-8 py-2 text-[13px] rounded-lg border border-[color:var(--vv-border)] bg-[#0B111E] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E]/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"
              >
                <IconX s={14} />
              </button>
            )}
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              aria-label="Filter by participant role"
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-[12.5px] rounded-lg border border-[color:var(--vv-border)] bg-[#0B111E] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]/50"
            >
              <option value="">All Roles</option>
              <option value="founder">Founder</option>
              <option value="investor">Investor</option>
              <option value="professional">Professional</option>
            </select>

            {/* Tier Filter */}
            <select
              aria-label="Filter by verification tier"
              value={tierFilter}
              onChange={e => { setTierFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-[12.5px] rounded-lg border border-[color:var(--vv-border)] bg-[#0B111E] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]/50"
            >
              <option value="">All Verification Tiers</option>
              <option value="0">Tier 0 - Unverified</option>
              <option value="1">Tier 1 - Identity Verified</option>
              <option value="2">Tier 2 - Track Record Verified</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by account status"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-[12.5px] rounded-lg border border-[color:var(--vv-border)] bg-[#0B111E] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]/50"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-[11.5px] text-[color:var(--vv-text-tertiary)] pt-1">
          <span>
            {loading ? 'Searching directory...' : `Showing ${users.length} of ${totalUsers} registered account${totalUsers === 1 ? '' : 's'}`}
          </span>
          {hasActiveFilters && (
            <span className="text-[#C67A4E]">Filters active</span>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] overflow-hidden">
        {loading ? (
          <Skeleton />
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto text-[color:var(--vv-text-tertiary)]">
              <IconUsers s={20} />
            </div>
            <h3 className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">
              No matching accounts found
            </h3>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No users match your active search or filter criteria. Try clearing filters to view all platform participants.'
                : 'There are currently no registered users on the platform.'}
            </p>
            {hasActiveFilters && (
              <Button size="sm" variant="secondary" onClick={handleClearFilters}>
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]">
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">
                    Participant User
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">
                    Assigned Roles
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">
                    Account Status
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider text-right">
                    Governance Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2a3e]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_30%,transparent)] transition-colors">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#182338] border border-[#223354] flex items-center justify-center font-bold text-[12px] text-[color:var(--vv-text)] shrink-0">
                          {(u.name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[color:var(--vv-text)] truncate">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] font-mono truncate">
                            {u.email}
                          </p>
                          {u.phone && (
                            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">
                              {u.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map(r => {
                            const cfg = ROLE_COLORS[r] || ROLE_COLORS.founder;
                            return (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded text-[11px] font-medium capitalize"
                                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                              >
                                {r}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                            No participant roles
                          </span>
                        )}
                        {u.is_admin && (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{ background: ROLE_COLORS.admin.bg, color: ROLE_COLORS.admin.color, border: `1px solid ${ROLE_COLORS.admin.border}` }}
                          >
                            Staff Admin
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="px-5 py-4">
                      <VerificationBadge
                        tier={u.verification_tier === 1 || u.verification_tier === 2 ? u.verification_tier : 0}
                      />
                    </td>

                    {/* Account Status */}
                    <td className="px-5 py-4">
                      <Badge variant={u.status === 'suspended' ? 'danger' : 'success'}>
                        {u.status_label || (u.is_suspended ? 'Suspended' : 'Active')}
                      </Badge>
                      {u.suspension_reason && (
                        <p className="text-[10px] text-rose-400 mt-1 truncate max-w-[140px]" title={u.suspension_reason}>
                          {u.suspension_reason}
                        </p>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-[12px] text-[color:var(--vv-text-tertiary)] font-mono whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate('/app/admin/reputation')}
                        icon={<IconStar s={13} />}
                      >
                        View Reputation
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && users.length > 0 && lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_30%,transparent)]">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)] font-mono">
              Page {currentPage} of {lastPage} ({totalUsers} users)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage >= lastPage}
                onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}