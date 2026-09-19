import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconBuilding, IconCheck, IconX, IconSearch, IconShield, IconEye } from '../../components/layout/Icons';
import { api, ApiError, BusinessRecord, resolveMediaUrl } from '../../services/api';
import { usePhotoViewer } from '../../context/PhotoViewerContext';

function fmtBDT(n: number): string {
  return 'BDT ' + n.toLocaleString('en-IN');
}

export default function AdminBusinesses() {
  const { openPhoto } = usePhotoViewer();
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'published' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [approveModal, setApproveModal] = useState<BusinessRecord | null>(null);
  const [rejectModal, setRejectModal] = useState<BusinessRecord | null>(null);
  const [viewModal, setViewModal] = useState<BusinessRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.businesses.list({ status: activeTab });
      setBusinesses(res.businesses || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load businesses for review.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleApprove = async () => {
    if (!approveModal) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.admin.businesses.approve(approveModal.id);
      setSuccessToast(`"${approveModal.name}" approved successfully.`);
      setApproveModal(null);
      await fetchBusinesses();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve business.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await api.admin.businesses.reject(rejectModal.id, rejectionReason.trim());
      setSuccessToast(`"${rejectModal.name}" rejected.`);
      setRejectModal(null);
      setRejectionReason('');
      await fetchBusinesses();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject business.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = businesses.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.industry && b.industry.toLowerCase().includes(q)) ||
      (b.founder && b.founder.name.toLowerCase().includes(q)) ||
      (b.founder && b.founder.email.toLowerCase().includes(q)) ||
      (b.location && b.location.toLowerCase().includes(q))
    );
  });

  const pendingCount = businesses.filter(b => b.status === 'pending_approval').length;
  const approvedCount = businesses.filter(b => b.status === 'approved').length;
  const publishedCount = businesses.filter(b => b.status === 'published' || b.status === 'submitted').length;

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Business Approvals & Oversight</h1>
            <Badge variant="neutral">Admin Governance</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            Review submitted ventures, verify compliance parameters, and authorize eligible businesses for public discovery.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fetchBusinesses()}>
          Refresh Queue
        </Button>
      </div>

      {/* Success Toast Banner */}
      {successToast && (
        <div className="mb-5 px-4 py-3 rounded-[10px] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.25)] text-[#22C55E] flex items-center gap-2.5 text-[12.5px]">
          <IconCheck s={14} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B]">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Pending Review</p>
          <p className="text-xl font-bold text-[#F59E0B] mt-1 font-mono">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B]">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Approved (Ready)</p>
          <p className="text-xl font-bold text-[#10B981] mt-1 font-mono">{approvedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B]">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Published / Live</p>
          <p className="text-xl font-bold text-[#22C55E] mt-1 font-mono">{publishedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B]">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold tracking-wider">Total in View</p>
          <p className="text-xl font-bold text-[color:var(--vv-text)] mt-1 font-mono">{businesses.length}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#121A2B] rounded-lg border border-[color:var(--vv-border)] overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'published', label: 'Published' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Ventures' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#C67A4E] text-white shadow-sm'
                  : 'text-[color:var(--vv-text-secondary)] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <IconSearch s={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search business or founder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121A2B] border border-[color:var(--vv-border)] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E]"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-[14px] border border-[color:var(--vv-border)] bg-[#121A2B] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[color:var(--vv-text-tertiary)] text-[13px]" role="status">
            Loading business review queue...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#EF4444] text-[13px]" role="alert">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-3 text-[#C67A4E]">
              <IconBuilding s={20} />
            </div>
            <h3 className="text-[14px] font-semibold text-white mb-1">No businesses found</h3>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-sm mx-auto">
              There are no businesses matching the selected status tab or search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-[color:var(--vv-border)] bg-[#151F33] text-[11px] uppercase tracking-wider text-[color:var(--vv-text-tertiary)] font-semibold">
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Founder</th>
                  <th className="py-3 px-4">Industry & Stage</th>
                  <th className="py-3 px-4">Funding Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--vv-border)]">
                {filtered.map((b) => {
                  const logo = resolveMediaUrl(b.logo_url);
                  const isPending = b.status === 'pending_approval';
                  const isApproved = b.status === 'approved';
                  const isPublished = b.status === 'published' || b.status === 'submitted';
                  const isRejected = b.status === 'rejected';

                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {logo ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPhoto({
                                  src: logo,
                                  alt: `${b.name} logo`,
                                  title: `${b.name} - Logo`,
                                });
                              }}
                              title={`View ${b.name} logo`}
                              aria-label={`View ${b.name} logo`}
                              className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67A4E]"
                            >
                              <img src={logo} alt={`${b.name} logo`} className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#182338] border border-white/10 flex items-center justify-center font-bold text-[11px] text-[#C67A4E] shrink-0">
                              {b.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white leading-tight">{b.name}</p>
                            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{b.location || 'Location unlisted'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white font-medium">{b.founder?.name || 'Unknown Founder'}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{b.founder?.email || 'No email'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white">{b.industry || 'General'}</p>
                        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{b.business_stage || 'Not specified'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#C67A4E] font-medium">
                        {b.requirements?.funding_amount ? fmtBDT(Number(b.requirements.funding_amount)) : 'Not specified'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.25)] text-[#F59E0B]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.25)] text-[#10B981]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            Approved
                          </span>
                        )}
                        {isPublished && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.25)] text-[#22C55E]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            Published
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.25)] text-[#EF4444]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                            Rejected
                          </span>
                        )}
                        {!isPending && !isApproved && !isPublished && !isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium border bg-[rgba(94,109,143,0.1)] border-[rgba(94,109,143,0.25)] text-[color:var(--vv-text-tertiary)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5E6D8F]" />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setViewModal(b)} icon={<IconEye s={12} />}>
                            Inspect
                          </Button>
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                className="bg-[#10B981] hover:bg-[#059669] text-white border-none"
                                onClick={() => {
                                  setActionError(null);
                                  setApproveModal(b);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="hover:bg-red-500/10 hover:border-red-500/30 hover:text-[#EF4444]"
                                onClick={() => {
                                  setActionError(null);
                                  setRejectionReason('');
                                  setRejectModal(b);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[color:var(--vv-border)]">
              <h3 className="font-display text-lg font-semibold text-white">Venture Details</h3>
              <button onClick={() => setViewModal(null)} className="text-[color:var(--vv-text-tertiary)] hover:text-white">
                <IconX s={16} />
              </button>
            </div>
            <div className="space-y-3.5 text-[12.5px]">
              <div>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Business Name</p>
                <p className="text-white font-medium text-[14px] mt-0.5">{viewModal.name}</p>
              </div>
              <div>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Description</p>
                <p className="text-[color:var(--vv-text-secondary)] mt-0.5 leading-relaxed">{viewModal.description || 'None provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Industry</p>
                  <p className="text-white mt-0.5">{viewModal.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Stage</p>
                  <p className="text-white mt-0.5">{viewModal.business_stage || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Funding Target</p>
                  <p className="text-[#C67A4E] font-mono mt-0.5">
                    {viewModal.requirements?.funding_amount ? fmtBDT(Number(viewModal.requirements.funding_amount)) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase font-semibold">Location</p>
                  <p className="text-white mt-0.5">{viewModal.location || 'N/A'}</p>
                </div>
              </div>
              {viewModal.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[#EF4444]">
                  <p className="font-semibold text-[11.5px]">Rejection Reason:</p>
                  <p className="mt-0.5">{viewModal.rejection_reason}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setViewModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-white mb-2">Approve Business</h3>
            <p className="text-[13px] text-[color:var(--vv-text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to approve <span className="text-white font-semibold">{approveModal.name}</span>? Once approved, the founder will be authorized to publish it to discovery.
            </p>
            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[#EF4444] text-[12px]">
                {actionError}
              </div>
            )}
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setApproveModal(null)} disabled={actionLoading}>Cancel</Button>
              <Button onClick={handleApprove} loading={actionLoading} className="bg-[#10B981] hover:bg-[#059669] text-white border-none">
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-white mb-2">Reject Business Submission</h3>
            <p className="text-[13px] text-[color:var(--vv-text-secondary)] mb-3 leading-relaxed">
              Provide specific feedback explaining why <span className="text-white font-semibold">{rejectModal.name}</span> was not approved:
            </p>
            <textarea
              rows={3}
              placeholder="Explain reasons for rejection or required amendments..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#182338] border border-[color:var(--vv-border)] rounded-lg p-3 text-[12.5px] text-white placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] mb-3"
            />
            {actionError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[#EF4444] text-[12px]">
                {actionError}
              </div>
            )}
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setRejectModal(null)} disabled={actionLoading}>Cancel</Button>
              <Button onClick={handleReject} loading={actionLoading} className="bg-[#EF4444] hover:bg-[#DC2626] text-white border-none">
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}