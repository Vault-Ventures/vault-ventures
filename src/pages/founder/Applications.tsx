import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api, FounderApplicationItem, resolveMediaUrl } from '../../services/api';
import { usePhotoViewer } from '../../context/PhotoViewerContext';

const STATUS_TABS = [
  { key: 'all', label: 'All Applications' },
  { key: 'submitted', label: 'Pending Review' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

export default function FounderApplications() {
  const navigate = useNavigate();
  const { openPhoto } = usePhotoViewer();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<FounderApplicationItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBizId, setSelectedBizId] = useState<string>(searchParams.get('business_id') || 'all');
  const [myBusinesses, setMyBusinesses] = useState<{ id: number; name: string }[]>([]);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<FounderApplicationItem | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      // Load businesses for filter dropdown
      try {
        const bizList = await api.businesses.list();
        if (bizList && Array.isArray(bizList)) {
          setMyBusinesses(bizList.map((b: any) => ({ id: b.id, name: b.name })));
        }
      } catch (e) {
        // non-blocking
      }

      const params: { status?: string; business_id?: number | string; search?: string } = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (selectedBizId !== 'all') params.business_id = selectedBizId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.applications.founder.list(params);
      setApplications(res || []);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to load applications.' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, selectedBizId, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (key: string) => {
    setFilterStatus(key);
    const newParams = new URLSearchParams(searchParams);
    if (key === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', key);
    }
    setSearchParams(newParams);
  };

  const handleMarkReview = async (appId: number) => {
    setActionLoadingId(appId);
    try {
      await api.applications.founder.markUnderReview(appId);
      setFeedbackMsg({ type: 'success', text: 'Application marked as under review.' });
      loadData();
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: 'under_review', reviewed_at: new Date().toISOString() } : null);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to update application status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAccept = async (appId: number) => {
    setActionLoadingId(appId);
    try {
      await api.applications.founder.accept(appId);
      setFeedbackMsg({ type: 'success', text: 'Application accepted! You can now view their profile and initiate collaboration.' });
      loadData();
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: 'accepted', responded_at: new Date().toISOString() } : null);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to accept application.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedApp) return;
    setActionLoadingId(selectedApp.id);
    try {
      await api.applications.founder.reject(selectedApp.id, rejectReason);
      setFeedbackMsg({ type: 'success', text: 'Application rejected.' });
      setShowRejectModal(false);
      setRejectReason('');
      loadData();
      setSelectedApp(prev => prev ? { ...prev, status: 'rejected', responded_at: new Date().toISOString(), rejection_reason: rejectReason } : null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to reject application.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending Review
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Under Review
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Rejected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">
        <button
          type="button"
          onClick={() => navigate('/app/founder/dashboard')}
          className="hover:text-[color:var(--vv-text)] transition-colors"
        >
          Dashboard
        </button>
        <span>/</span>
        <span className="text-[color:var(--vv-text-secondary)]">Applications Inbox</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-[color:var(--vv-text)] tracking-tight">
            Professional Applications Inbox
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Review incoming advisor, executive, and specialized talent proposals submitted for your published businesses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/app/founder/discover-professionals')}>
            Discover Talent
          </Button>
          <Button variant="outline" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-[10px] text-[13px] mb-6 flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-white/60 hover:text-white text-[11px] underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Search / Business Selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all whitespace-nowrap ${
                filterStatus === tab.key
                  ? 'bg-[#C67A4E] text-white shadow-sm font-semibold'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Business Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {myBusinesses.length > 1 && (
            <select
              value={selectedBizId}
              onChange={e => setSelectedBizId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text)] outline-none"
            >
              <option value="all">All Businesses</option>
              {myBusinesses.map(b => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidate, role..."
              className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] p-12 text-center bg-[color:var(--vv-raised)]">
          <div className="w-8 h-8 border-2 border-[#C67A4E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading applications inbox...</p>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map(item => {
            const prof = item.professional;
            const avatarSrc = resolveMediaUrl(prof?.avatar_url);

            return (
              <div
                key={item.id}
                className="rounded-[14px] border border-[color:var(--vv-border)] p-5 bg-[color:var(--vv-raised)] hover:border-[color:var(--vv-border-hover)] transition-all shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Candidate Overview */}
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Avatar */}
                    {avatarSrc ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPhoto({
                            src: avatarSrc,
                            alt: prof.name,
                            title: `${prof.name} - Profile Photo`,
                          });
                        }}
                        title={`View ${prof.name}'s photo`}
                        aria-label={`View ${prof.name}'s photo`}
                        className="w-12 h-12 rounded-full overflow-hidden bg-[#1a253a] border border-[color:var(--vv-border)] flex items-center justify-center font-bold text-[14px] text-[#C67A4E] shrink-0 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67A4E]"
                      >
                        <img
                          src={avatarSrc}
                          alt={prof.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </button>
                    ) : (
                      <div
                        onClick={() => navigate(`/app/profile/${prof.id}`)}
                        className="w-12 h-12 rounded-full overflow-hidden bg-[#1a253a] border border-[color:var(--vv-border)] flex items-center justify-center font-bold text-[14px] text-[#C67A4E] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <span>{prof.initials || 'PR'}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/app/profile/${prof.id}`)}
                          className="font-display text-[15px] font-bold text-[color:var(--vv-text)] hover:text-[#C67A4E] transition-colors text-left"
                        >
                          {prof.name}
                        </button>

                        {/* Tier Badge */}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1F2E4D] text-[#8AA2D6] border border-[#2B3F6C]">
                          Tier {prof.verification_tier ?? 0} Verified
                        </span>

                        {/* Status */}
                        {getStatusBadge(item.status)}
                      </div>

                      <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] font-medium">
                        {prof.headline || 'Professional Advisor'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                        <span>
                          Applied for: <strong className="text-[color:var(--vv-text)]">{item.role_title}</strong> at{' '}
                          <strong className="text-[color:var(--vv-text)]">{item.business_name}</strong>
                        </span>
                        {prof.location && <span>• {prof.location}</span>}
                        {prof.experience_years > 0 && <span>• {prof.experience_years} yrs exp</span>}
                        <span>• Applied {new Date(item.applied_at).toLocaleDateString()}</span>
                      </div>

                      {/* Proposal Note */}
                      {item.note && (
                        <div className="mt-2.5 p-3 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-canvas)_70%,transparent)] border border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed line-clamp-2">
                          <span className="text-[color:var(--vv-text-tertiary)] font-medium mr-1">Pitch:</span>
                          &ldquo;{item.note}&rdquo;
                        </div>
                      )}

                      {/* Skills Tags */}
                      {prof.skills && prof.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {prof.skills.slice(0, 6).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[#1a253a] text-[#8AA2D6] border border-[#2B3F6C]"
                            >
                              {skill}
                            </span>
                          ))}
                          {prof.skills.length > 6 && (
                            <span className="text-[11px] text-[color:var(--vv-text-tertiary)] self-center">
                              +{prof.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Right Column */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[color:var(--vv-border)] shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/profile/${prof.id}`)}
                    >
                      View Profile
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedApp(item)}
                    >
                      Review Proposal
                    </Button>

                    {item.status === 'submitted' && (
                      <Button
                        size="sm"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleMarkReview(item.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {actionLoadingId === item.id ? 'Updating...' : 'Mark Under Review'}
                      </Button>
                    )}

                    {['submitted', 'under_review'].includes(item.status) && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleAccept(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={actionLoadingId === item.id}
                          onClick={() => {
                            setSelectedApp(item);
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] p-12 text-center bg-[color:var(--vv-raised)]">
          <div className="w-12 h-12 rounded-full bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center mx-auto mb-4 text-[#C67A4E]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="font-display text-[16px] font-bold text-[color:var(--vv-text)] mb-1">
            No Applications Found
          </p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-6">
            {filterStatus === 'all'
              ? 'No professionals have applied to your published businesses yet. You can also proactively discover talent.'
              : `There are currently no applications matching the "${filterStatus}" status filter.`}
          </p>
          <Button onClick={() => navigate('/app/founder/discover-professionals')}>
            Find & Invite Professionals
          </Button>
        </div>
      )}

      {/* Review Proposal Drawer / Modal */}
      {selectedApp && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[16px] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C67A4E]">
                  Proposal Review
                </span>
                <h2 className="font-display text-[18px] font-bold text-[color:var(--vv-text)] mt-0.5">
                  {selectedApp.professional.name}
                </h2>
                <p className="text-[12.5px] text-[color:var(--vv-text-secondary)]">
                  Applied for {selectedApp.role_title} • {selectedApp.business_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] text-[18px] p-1"
              >
                ✕
              </button>
            </div>

            {/* Candidate Summary */}
            <div className="p-4 rounded-[10px] bg-[#182338] border border-[color:var(--vv-border)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">
                    {selectedApp.professional.headline}
                  </p>
                  <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                    {selectedApp.professional.location || 'Location not specified'} • Tier {selectedApp.professional.verification_tier ?? 0}
                  </p>
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>

              {selectedApp.professional.bio && (
                <div className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed pt-2 border-t border-[color:var(--vv-border)]">
                  {selectedApp.professional.bio}
                </div>
              )}
            </div>

            {/* Proposal Note */}
            <div>
              <h3 className="text-[12px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-2">
                Candidate Proposal & Pitch
              </h3>
              <div className="p-3.5 rounded-[10px] bg-[#0E1524] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] leading-relaxed whitespace-pre-wrap">
                {selectedApp.note || 'No proposal note provided.'}
              </div>
            </div>

            {/* Skills */}
            {selectedApp.professional.skills && selectedApp.professional.skills.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-2">
                  Key Skills & Qualifications
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.professional.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium bg-[#1F2E4D] text-[#8AA2D6] border border-[#2B3F6C]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {selectedApp.timeline && selectedApp.timeline.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-2">
                  Application Timeline
                </h3>
                <div className="space-y-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                  {selectedApp.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>• {step.action}</span>
                      <span>{new Date(step.ts).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[color:var(--vv-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/app/profile/${selectedApp.professional.id}`);
                  setSelectedApp(null);
                }}
              >
                Open Full Profile
              </Button>

              <div className="flex items-center gap-2">
                {selectedApp.status === 'submitted' && (
                  <Button
                    size="sm"
                    disabled={actionLoadingId === selectedApp.id}
                    onClick={() => handleMarkReview(selectedApp.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Mark Under Review
                  </Button>
                )}

                {['submitted', 'under_review'].includes(selectedApp.status) && (
                  <>
                    <Button
                      size="sm"
                      disabled={actionLoadingId === selectedApp.id}
                      onClick={() => handleAccept(selectedApp.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Accept Application
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowRejectModal(true)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[16px] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-display text-[16px] font-bold text-[color:var(--vv-text)]">
              Reject Application for {selectedApp.professional.name}
            </h3>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">
              Are you sure you want to decline this application? You can optionally provide feedback to the candidate.
            </p>

            <div>
              <label className="block text-[12px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                Reason / Note for Applicant (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Currently looking for candidates with deep B2B SaaS background..."
                className="w-full px-3 py-2 rounded-[8px] bg-[#0E1524] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[color:var(--vv-border)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={actionLoadingId === selectedApp.id}
                onClick={handleConfirmReject}
              >
                {actionLoadingId === selectedApp.id ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
