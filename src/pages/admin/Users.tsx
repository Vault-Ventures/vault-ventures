import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconUsers,
  IconSearch,
  IconShield,
  IconEye,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconStar,
  IconBriefcase,
  IconLock,
} from '../../components/layout/Icons';
import {
  api,
  ApiError,
  AdminUserListItem,
  AdminUserDetail,
  AdminUsersFilterParams,
  resolveMediaUrl,
} from '../../services/api';
import { usePhotoViewer } from '../../context/PhotoViewerContext';

function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoString;
  }
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getTierBadge(tier: number) {
  switch (tier) {
    case 3:
      return <Badge variant="gold">Tier 3 • Track Record</Badge>;
    case 2:
      return <Badge variant="primary">Tier 2 • Track Record</Badge>;
    case 1:
      return <Badge variant="secondary">Tier 1 • Identity</Badge>;
    default:
      return <Badge variant="neutral">Tier 0 • Basic</Badge>;
  }
}

function getRoleBadge(role: string) {
  switch (role.toLowerCase()) {
    case 'founder':
      return <Badge key={role} variant="primary">Founder</Badge>;
    case 'investor':
      return <Badge key={role} variant="gold">Investor</Badge>;
    case 'professional':
      return <Badge key={role} variant="accent">Professional</Badge>;
    case 'admin':
      return <Badge key={role} variant="danger">Admin</Badge>;
    default:
      return <Badge key={role} variant="neutral">{role}</Badge>;
  }
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { openPhoto } = usePhotoViewer();

  // Directory state
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 15;

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'email' | 'verification_tier'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Details Drawer state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Actions & Modals state
  const [suspendModalUser, setSuspendModalUser] = useState<AdminUserListItem | null>(null);
  const [restoreModalUser, setRestoreModalUser] = useState<AdminUserListItem | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users directory
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: AdminUsersFilterParams = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (selectedRole !== 'all') {
        params.role = selectedRole;
      }
      if (selectedTier !== 'all') {
        params.verification_tier = Number(selectedTier);
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const res = await api.admin.users.list(params);
      setUsers(res.users || []);
      setTotalPages(res.pagination?.last_page || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Failed to load user directory.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedRole, selectedTier, selectedStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch full user detail when drawer opens
  const openUserDetails = async (userId: number) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await api.admin.users.get(userId);
      setDetailUser(data);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load user details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetails = () => {
    setSelectedUserId(null);
    setDetailUser(null);
    setDetailError(null);
  };

  // Suspend action
  const handleSuspend = async () => {
    if (!suspendModalUser) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await api.admin.users.suspend(suspendModalUser.id, suspensionReason.trim() || undefined);
      setToastMessage({
        text: `User "${suspendModalUser.name}" has been suspended.`,
        type: 'success',
      });
      setSuspendModalUser(null);
      setSuspensionReason('');

      // Refresh list and detail view if open
      await fetchUsers();
      if (selectedUserId === suspendModalUser.id) {
        setDetailUser(updated);
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to suspend user account.');
    } finally {
      setActionLoading(false);
    }
  };

  // Restore action
  const handleRestore = async () => {
    if (!restoreModalUser) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await api.admin.users.restore(restoreModalUser.id);
      setToastMessage({
        text: `User "${restoreModalUser.name}" account has been restored.`,
        type: 'success',
      });
      setRestoreModalUser(null);

      // Refresh list and detail view if open
      await fetchUsers();
      if (selectedUserId === restoreModalUser.id) {
        setDetailUser(updated);
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to restore user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedRole('all');
    setSelectedTier('all');
    setSelectedStatus('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-[#122A21] border-[#1E4D38] text-[#4ADE80]'
              : 'bg-[#2A1515] border-[#4D2020] text-[#F87171]'
          }`}
        >
          {toastMessage.type === 'success' ? <IconCheck s={18} /> : <IconAlertTriangle s={18} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-current opacity-70 hover:opacity-100 p-0.5"
            aria-label="Dismiss toast"
          >
            <IconX s={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">User Management</h1>
            <Badge variant="neutral">{totalCount} Total Users</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Admin directory, participant role governance, verification oversight, and account suspension controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchUsers()}
            disabled={loading}
            className="text-[13px]"
          >
            Refresh Directory
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/admin/verification')}
            icon={<IconShield s={14} />}
            className="text-[13px]"
          >
            Verification Queue
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/admin/reputation')}
            icon={<IconStar s={14} />}
            className="text-[13px]"
          >
            Reputation
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Sorting */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] bg-[#121A2B] p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <IconSearch
              s={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-[#182338] border border-[color:var(--vv-border)] rounded-[8px] text-[13px] text-[color:var(--vv-text)] placeholder:text-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] p-0.5"
                aria-label="Clear search"
              >
                <IconX s={14} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div>
            <select
              aria-label="Filter by Role"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 bg-[#182338] border border-[color:var(--vv-border)] rounded-[8px] text-[13px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
            >
              <option value="all">All Roles</option>
              <option value="founder">Founder</option>
              <option value="investor">Investor</option>
              <option value="professional">Professional</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Verification Tier Filter */}
          <div>
            <select
              aria-label="Filter by Verification Tier"
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 bg-[#182338] border border-[color:var(--vv-border)] rounded-[8px] text-[13px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
            >
              <option value="all">All Tiers</option>
              <option value="0">Tier 0 (Basic)</option>
              <option value="1">Tier 1 (Identity)</option>
              <option value="2">Tier 2 (Track Record)</option>
              <option value="3">Tier 3 (Institutional)</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              aria-label="Filter by Status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full h-10 px-3 bg-[#182338] border border-[color:var(--vv-border)] rounded-[8px] text-[13px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C67A4E]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Second Row: Sort controls and active filter indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text-tertiary)]">
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              aria-label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 px-2 bg-[#182338] border border-[color:var(--vv-border)] rounded-[6px] text-[12px] text-[color:var(--vv-text)] focus:outline-none"
            >
              <option value="created_at">Joined Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="verification_tier">Verification Tier</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 px-2.5 bg-[#182338] border border-[color:var(--vv-border)] rounded-[6px] text-[12px] text-[color:var(--vv-text)] hover:bg-[#202E48] transition-colors"
              title={`Sorting ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>

          {(debouncedSearch || selectedRole !== 'all' || selectedTier !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-[#C67A4E] hover:underline flex items-center gap-1 font-medium"
            >
              <IconX s={12} /> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div data-testid="loading-skeleton" className="rounded-[12px] border border-[color:var(--vv-border)] bg-[#121A2B] overflow-hidden p-6 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[#182338] rounded w-1/4"></div>
            <div className="h-10 bg-[#182338] rounded"></div>
            <div className="h-10 bg-[#182338] rounded"></div>
            <div className="h-10 bg-[#182338] rounded"></div>
            <div className="h-10 bg-[#182338] rounded"></div>
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-[12px] border border-[#4D2020] bg-[#1F1414] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#351C1C] border border-[#5A2525] flex items-center justify-center mx-auto mb-3 text-[#F87171]">
            <IconAlertTriangle s={24} />
          </div>
          <h3 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-1">
            Unable to Load User Directory
          </h3>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-4">
            {error}
          </p>
          <Button onClick={() => fetchUsers()} variant="secondary" className="text-[13px]">
            Retry
          </Button>
        </div>
      ) : users.length === 0 ? (
        /* Empty / No Results State */
        <div className="rounded-[12px] border border-[color:var(--vv-border)] bg-[#121A2B] p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-4 text-[color:var(--vv-text-tertiary)]">
            <IconUsers s={24} />
          </div>
          <h3 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-1">
            {debouncedSearch || selectedRole !== 'all' || selectedTier !== 'all' || selectedStatus !== 'all'
              ? 'No Users Found Matching Filters'
              : 'No Users in Directory'}
          </h3>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-4">
            {debouncedSearch || selectedRole !== 'all' || selectedTier !== 'all' || selectedStatus !== 'all'
              ? 'Try modifying your search criteria or resetting the active filters.'
              : 'There are currently no registered users in the database.'}
          </p>
          {(debouncedSearch || selectedRole !== 'all' || selectedTier !== 'all' || selectedStatus !== 'all') && (
            <Button onClick={handleResetFilters} variant="secondary" className="text-[13px]">
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        /* Users Table */
        <div className="rounded-[12px] border border-[color:var(--vv-border)] bg-[#121A2B] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[color:var(--vv-border)] bg-[#0E1524] text-[color:var(--vv-text-tertiary)] font-medium">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--vv-border)]">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#182338] transition-colors cursor-pointer group"
                    onClick={() => openUserDetails(user.id)}
                  >
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const resolved = resolveMediaUrl(user.avatar_url);
                              if (resolved) {
                                openPhoto({
                                  src: resolved,
                                  alt: user.name,
                                  title: `${user.name} - Profile Photo`,
                                });
                              }
                            }}
                            title={`View ${user.name}'s photo`}
                            aria-label={`View ${user.name}'s photo`}
                            className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[color:var(--vv-border)] hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67A4E]"
                          >
                            <img
                              src={resolveMediaUrl(user.avatar_url) || undefined}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // fallback on load error
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </button>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#202E48] border border-[color:var(--vv-border)] flex items-center justify-center text-[12px] font-semibold text-[#C67A4E] shrink-0">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-[color:var(--vv-text)] flex items-center gap-1.5">
                            <span className="truncate">{user.name}</span>
                            {user.is_admin && (
                              <Badge variant="danger" size="sm">Admin</Badge>
                            )}
                          </div>
                          <div className="text-[12px] text-[color:var(--vv-text-tertiary)] truncate">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-[11px] text-[color:var(--vv-text-tertiary)] flex items-center gap-1 mt-0.5">
                              <span>{user.phone}</span>
                              {user.phone_verified_at && (
                                <span className="text-[#4ADE80]" title="Phone Verified">✓</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((r) => getRoleBadge(r))
                        ) : (
                          <span className="text-[color:var(--vv-text-tertiary)] text-[12px]">None</span>
                        )}
                      </div>
                    </td>

                    {/* Verification Tier */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getTierBadge(user.verification_tier)}
                        {user.latest_verification_request && (
                          <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                            Req: Tier {user.latest_verification_request.requested_tier} ({user.latest_verification_request.status})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      {user.is_suspended ? (
                        <div className="flex flex-col gap-0.5 items-start">
                          <Badge variant="danger">Suspended</Badge>
                          {user.suspension_reason && (
                            <span
                              className="text-[11px] text-[#F87171] truncate max-w-[150px]"
                              title={user.suspension_reason}
                            >
                              {user.suspension_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-[color:var(--vv-text-secondary)] whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openUserDetails(user.id)}
                          icon={<IconEye s={13} />}
                        >
                          View
                        </Button>
                        {user.is_suspended ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setRestoreModalUser(user)}
                            className="text-[#4ADE80] border-[#1E4D38] hover:bg-[#122A21]"
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSuspendModalUser(user);
                              setSuspensionReason('');
                              setActionError(null);
                            }}
                            className="text-[#F87171] border-[#4D2020] hover:bg-[#2A1515]"
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[color:var(--vv-border)] bg-[#0E1524] text-[13px] text-[color:var(--vv-text-tertiary)]">
            <div>
              Showing <span className="font-medium text-[color:var(--vv-text)]">{(page - 1) * perPage + 1}</span> to{' '}
              <span className="font-medium text-[color:var(--vv-text)]">
                {Math.min(page * perPage, totalCount)}
              </span>{' '}
              of <span className="font-medium text-[color:var(--vv-text)]">{totalCount}</span> users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
                icon={<IconChevronLeft s={14} />}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-[color:var(--vv-text)]">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                icon={<IconChevronRight s={14} />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Drawer */}
      {selectedUserId !== null && (
        <div
          role="dialog"
          aria-label="User Details"
          className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end"
          onClick={closeUserDetails}
        >
          <div
            className="w-full max-w-[560px] bg-[#0E1524] border-l border-[color:var(--vv-border)] h-full overflow-y-auto p-6 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[color:var(--vv-border)]">
              <div className="flex items-center gap-2">
                <IconUsers s={20} className="text-[#C67A4E]" />
                <h2 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">
                  User Details
                </h2>
              </div>
              <button
                onClick={closeUserDetails}
                className="w-8 h-8 rounded-full hover:bg-[#182338] flex items-center justify-center text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"
                aria-label="Close drawer"
              >
                <IconX s={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 py-6 space-y-6">
              {detailLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-[#182338] rounded-lg"></div>
                  <div className="h-28 bg-[#182338] rounded-lg"></div>
                  <div className="h-32 bg-[#182338] rounded-lg"></div>
                </div>
              ) : detailError ? (
                <div className="p-4 rounded-lg bg-[#1F1414] border border-[#4D2020] text-[#F87171] text-[13px]">
                  {detailError}
                </div>
              ) : detailUser ? (
                <>
                  {/* Identity Header Card */}
                  <div className="rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B] p-4 flex items-start gap-4">
                    {detailUser.avatar_url ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const resolved = resolveMediaUrl(detailUser.avatar_url);
                          if (resolved) {
                            openPhoto({
                              src: resolved,
                              alt: detailUser.name,
                              title: `${detailUser.name} - Profile Photo`,
                            });
                          }
                        }}
                        title={`View ${detailUser.name}'s photo`}
                        aria-label={`View ${detailUser.name}'s photo`}
                        className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[color:var(--vv-border)] hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67A4E]"
                      >
                        <img
                          src={resolveMediaUrl(detailUser.avatar_url) || undefined}
                          alt={detailUser.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#202E48] border border-[color:var(--vv-border)] flex items-center justify-center text-[18px] font-semibold text-[#C67A4E] shrink-0">
                        {getInitials(detailUser.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] truncate">
                          {detailUser.name}
                        </h3>
                        {detailUser.is_suspended ? (
                          <Badge variant="danger">Suspended</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                      <p className="text-[13px] text-[color:var(--vv-text-secondary)] truncate">
                        {detailUser.email}
                      </p>
                      {detailUser.headline && (
                        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1 line-clamp-2">
                          {detailUser.headline}
                        </p>
                      )}
                      {detailUser.location && (
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-1">
                          📍 {detailUser.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Account Status / Suspension Notice */}
                  {detailUser.is_suspended && (
                    <div className="rounded-[10px] border border-[#4D2020] bg-[#1F1414] p-4 text-[13px]">
                      <div className="flex items-center gap-2 text-[#F87171] font-semibold mb-1">
                        <IconLock s={15} /> Account Suspended
                      </div>
                      {detailUser.suspension_reason && (
                        <p className="text-[color:var(--vv-text-secondary)] mt-1">
                          <strong>Reason:</strong> {detailUser.suspension_reason}
                        </p>
                      )}
                      <div className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-2 space-y-0.5">
                        {detailUser.suspended_at && (
                          <div>Suspended on: {formatDateTime(detailUser.suspended_at)}</div>
                        )}
                        {detailUser.suspended_by && (
                          <div>Suspended by: {detailUser.suspended_by.name} ({detailUser.suspended_by.email})</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification & Roles Card */}
                  <div className="rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B] p-4 space-y-3">
                    <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--vv-text-tertiary)]">
                      Governance & Verification
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <span className="text-[color:var(--vv-text-tertiary)] text-[11px] block">Verification Tier</span>
                        <div className="mt-1">{getTierBadge(detailUser.verification_tier)}</div>
                      </div>
                      <div>
                        <span className="text-[color:var(--vv-text-tertiary)] text-[11px] block">Joined Platform</span>
                        <span className="text-[color:var(--vv-text)] font-medium block mt-1">
                          {formatDate(detailUser.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[color:var(--vv-text-tertiary)] text-[11px] block">Email Verification</span>
                        <span className="text-[color:var(--vv-text)] font-medium block mt-1">
                          {detailUser.email_verified_at ? (
                            <span className="text-[#4ADE80]">Verified ({formatDate(detailUser.email_verified_at)})</span>
                          ) : (
                            <span className="text-[color:var(--vv-text-tertiary)]">Unverified</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[color:var(--vv-text-tertiary)] text-[11px] block">Phone Verification</span>
                        <span className="text-[color:var(--vv-text)] font-medium block mt-1">
                          {detailUser.phone ? (
                            detailUser.phone_verified_at ? (
                              <span className="text-[#4ADE80]">{detailUser.phone} (Verified)</span>
                            ) : (
                              <span>{detailUser.phone} (Pending)</span>
                            )
                          ) : (
                            <span className="text-[color:var(--vv-text-tertiary)]">None</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[color:var(--vv-border)]">
                      <span className="text-[color:var(--vv-text-tertiary)] text-[11px] block mb-1.5">Enrolled Roles</span>
                      <div className="flex flex-wrap gap-1.5">
                        {detailUser.roles && detailUser.roles.length > 0 ? (
                          detailUser.roles.map((r) => getRoleBadge(r))
                        ) : (
                          <span className="text-[color:var(--vv-text-tertiary)] text-[12px]">No roles enrolled</span>
                        )}
                        {detailUser.is_admin && <Badge variant="danger">System Administrator</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Bio & Profile details */}
                  {detailUser.bio && (
                    <div className="rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B] p-4 space-y-1.5">
                      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--vv-text-tertiary)]">
                        About
                      </h4>
                      <p className="text-[13px] text-[color:var(--vv-text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {detailUser.bio}
                      </p>
                    </div>
                  )}

                  {/* Verification Requests History */}
                  {detailUser.verification_requests && detailUser.verification_requests.length > 0 && (
                    <div className="rounded-[10px] border border-[color:var(--vv-border)] bg-[#121A2B] p-4 space-y-3">
                      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--vv-text-tertiary)]">
                        Verification History ({detailUser.verification_requests.length})
                      </h4>
                      <div className="space-y-2">
                        {detailUser.verification_requests.map((vr) => (
                          <div
                            key={vr.id}
                            className="p-2.5 rounded bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-between text-[12px]"
                          >
                            <div>
                              <span className="font-medium text-[color:var(--vv-text)]">
                                Requested Tier {vr.requested_tier}
                              </span>
                              <div className="text-[11px] text-[color:var(--vv-text-tertiary)]">
                                Submitted {formatDate(vr.submitted_at)}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  vr.status === 'approved'
                                    ? 'success'
                                    : vr.status === 'rejected'
                                    ? 'danger'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {vr.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Drawer Footer Actions */}
            {detailUser && (
              <div className="pt-4 border-t border-[color:var(--vv-border)] flex items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/app/admin/reputation`)}
                  icon={<IconStar s={13} />}
                >
                  Audit Reputation
                </Button>
                {detailUser.is_suspended ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setRestoreModalUser(detailUser)}
                    className="bg-[#122A21] border-[#1E4D38] text-[#4ADE80] hover:bg-[#18392C]"
                  >
                    Restore Account
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSuspendModalUser(detailUser);
                      setSuspensionReason('');
                      setActionError(null);
                    }}
                    className="text-[#F87171] border-[#4D2020] hover:bg-[#2A1515]"
                  >
                    Suspend Account
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalUser && (
        <div
          role="dialog"
          aria-label="Confirm Suspend Account"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-[480px] bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#2A1515] border border-[#4D2020] flex items-center justify-center text-[#F87171] shrink-0">
                <IconAlertTriangle s={20} />
              </div>
              <div>
                <h3 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)]">
                  Suspend User Account
                </h3>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
                  Target: {suspendModalUser.name} ({suspendModalUser.email})
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[color:var(--vv-text-secondary)] mb-4 leading-relaxed">
              Suspending this user will restrict their access to platform services, deal rooms, and participant communications. This action is logged for audit compliance.
            </p>

            <div className="mb-4">
              <label className="block text-[12px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                Reason for Suspension (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Specify the policy violation or rationale..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full p-3 bg-[#182338] border border-[color:var(--vv-border)] rounded-[8px] text-[13px] text-[color:var(--vv-text)] placeholder:text-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E]"
              />
            </div>

            {actionError && (
              <div className="p-3 mb-4 rounded-lg bg-[#2A1515] border border-[#4D2020] text-[#F87171] text-[12px]">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => {
                  setSuspendModalUser(null);
                  setActionError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={actionLoading}
                onClick={handleSuspend}
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white border-transparent"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreModalUser && (
        <div
          role="dialog"
          aria-label="Confirm Restore Account"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-[480px] bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#122A21] border border-[#1E4D38] flex items-center justify-center text-[#4ADE80] shrink-0">
                <IconCheck s={20} />
              </div>
              <div>
                <h3 className="font-display text-[16px] font-semibold text-[color:var(--vv-text)]">
                  Restore User Account
                </h3>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
                  Target: {restoreModalUser.name} ({restoreModalUser.email})
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[color:var(--vv-text-secondary)] mb-6 leading-relaxed">
              Restoring this user will lift account restrictions and allow them to resume platform activities under their verified credentials.
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-lg bg-[#2A1515] border border-[#4D2020] text-[#F87171] text-[12px]">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => {
                  setRestoreModalUser(null);
                  setActionError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={actionLoading}
                onClick={handleRestore}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white border-transparent"
              >
                {actionLoading ? 'Restoring...' : 'Confirm Restore'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}