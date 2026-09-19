import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api, BusinessApplicationItem, resolveMediaUrl } from '../../services/api';
import { usePhotoViewer } from '../../context/PhotoViewerContext';

const FILTER_TABS = [
  { key: 'all', label: 'All Applications' },
  { key: 'submitted', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Not Selected' },
  { key: 'withdrawn', label: 'Withdrawn' },
];

export default function ProfessionalApplications() {
  const navigate = useNavigate();
  const { openPhoto } = usePhotoViewer();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<BusinessApplicationItem[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedApp, setSelectedApp] = useState<BusinessApplicationItem | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const params: { status?: string; search?: string } = {};
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();

      const list = await api.applications.professional.list(params);
      setApplications(list || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load applications.' });
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleWithdraw = async (appId: number) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }
    setWithdrawingId(appId);
    try {
      await api.applications.professional.withdraw(appId);
      setFeedback({ type: 'success', message: 'Application withdrawn successfully.' });
      loadApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp(null);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to withdraw application.' });
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Application Submitted
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Under Review by Founder
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Application Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Not Selected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
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
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/app/professional/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Dashboard
        </button>
        <span className="text-[color:var(--vv-border)]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Applications & Proposals</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-bold text-[color:var(--vv-text)] leading-tight">
            My Submitted Applications
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            Track and manage your advisory and collaboration proposals sent to businesses.
          </p>
        </div>
        <Button onClick={() => navigate('/app/professional/discover')}>
          Discover Opportunities
        </Button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-[10px] text-[13px] mb-6 flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-white/60 hover:text-white text-[11px] underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 p-1 rounded-[10px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-[#C67A4E] text-white shadow-sm font-semibold'
                  : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search business, role..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] outline-none"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="rounded-[14px] border border-[color:var(--vv-border)] p-12 text-center bg-[color:var(--vv-raised)]">
          <div className="w-8 h-8 border-2 border-[#C67A4E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading your applications...</p>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map(item => {
            const logoSrc = resolveMediaUrl(item.business_logo_url);

            return (
              <div
                key={item.id}
                className="rounded-[14px] border border-[color:var(--vv-border)] p-5 bg-[color:var(--vv-raised)] hover:border-[color:var(--vv-border-hover)] transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Business Logo / Initials */}
                    {logoSrc ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPhoto({
                            src: logoSrc,
                            alt: item.business,
                            title: `${item.business} - Logo`,
                          });
                        }}
                        title={`View ${item.business} logo`}
                        aria-label={`View ${item.business} logo`}
                        className="w-12 h-12 rounded-[10px] overflow-hidden bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center font-bold text-[14px] text-[#C67A4E] shrink-0 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67A4E]"
                      >
                        <img
                          src={logoSrc}
                          alt={item.business}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </button>
                    ) : (
                      <div
                        onClick={() => navigate(`/app/business/${item.business_id}`)}
                        className="w-12 h-12 rounded-[10px] overflow-hidden bg-[#182338] border border-[color:var(--vv-border)] flex items-center justify-center font-bold text-[14px] text-[#C67A4E] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <span>{item.business_initials || 'BZ'}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/app/business/${item.business_id}`)}
                          className="font-display text-[15px] font-bold text-[color:var(--vv-text)] hover:text-[#C67A4E] transition-colors text-left"
                        >
                          {item.business}
                        </button>
                        <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">• {item.industry}</span>
                        {getStatusBadge(item.status)}
                      </div>

                      <p className="text-[13px] font-semibold text-[color:var(--vv-text-secondary)]">
                        Role: {item.role}
                      </p>

                      <div className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                        Applied: {new Date(item.applied_date).toLocaleDateString()}
                      </div>

                      {item.note && (
                        <div className="mt-2 p-3 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-canvas)_70%,transparent)] border border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text-secondary)] line-clamp-2">
                          <span className="font-semibold text-[color:var(--vv-text-tertiary)] mr-1">Your Proposal:</span>
                          {item.note}
                        </div>
                      )}

                      {item.rejection_reason && (
                        <div className="mt-2 p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/20 text-[12px] text-rose-300">
                          <span className="font-semibold mr-1">Founder Feedback:</span>
                          {item.rejection_reason}
                        </div>
                      )}

                      {item.skills && item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {item.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[#1a253a] text-[#8AA2D6] border border-[#2B3F6C]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[color:var(--vv-border)] shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/business/${item.business_id}`)}
                    >
                      View Business
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedApp(item)}
                    >
                      View Details
                    </Button>

                    {['submitted', 'under_review'].includes(item.status) && (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={withdrawingId === item.id}
                        onClick={() => handleWithdraw(item.id)}
                      >
                        {withdrawingId === item.id ? 'Withdrawing...' : 'Withdraw'}
                      </Button>
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="font-display text-[15px] font-semibold text-[color:var(--vv-text)] mb-1">
            No Applications Found
          </p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-6">
            {filter === 'all'
              ? 'You currently have no submitted application proposals. Browse businesses seeking advisory expertise in the Discovery section.'
              : `You have no applications with status "${filter}".`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => navigate('/app/professional/discover')}>
              Browse Discovery
            </Button>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[16px] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C67A4E]">
                  Application Overview
                </span>
                <h2 className="font-display text-[18px] font-bold text-[color:var(--vv-text)] mt-0.5">
                  {selectedApp.business}
                </h2>
                <p className="text-[12.5px] text-[color:var(--vv-text-secondary)]">
                  Role: {selectedApp.role} • {selectedApp.industry}
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

            <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#182338] border border-[color:var(--vv-border)]">
              <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Current Status:</span>
              {getStatusBadge(selectedApp.status)}
            </div>

            {selectedApp.note && (
              <div>
                <h3 className="text-[12px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-1.5">
                  Submitted Proposal & Note
                </h3>
                <div className="p-3 rounded-[8px] bg-[#0E1524] border border-[color:var(--vv-border)] text-[12.5px] text-[color:var(--vv-text)] leading-relaxed whitespace-pre-wrap">
                  {selectedApp.note}
                </div>
              </div>
            )}

            {selectedApp.rejection_reason && (
              <div>
                <h3 className="text-[12px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5">
                  Feedback from Business Founder
                </h3>
                <div className="p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/20 text-[12.5px] text-rose-200 leading-relaxed whitespace-pre-wrap">
                  {selectedApp.rejection_reason}
                </div>
              </div>
            )}

            {selectedApp.timeline && selectedApp.timeline.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider mb-1.5">
                  Activity Timeline
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

            <div className="flex items-center justify-between pt-3 border-t border-[color:var(--vv-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/app/business/${selectedApp.business_id}`);
                  setSelectedApp(null);
                }}
              >
                Go to Business Profile
              </Button>

              {['submitted', 'under_review'].includes(selectedApp.status) && (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={withdrawingId === selectedApp.id}
                  onClick={() => handleWithdraw(selectedApp.id)}
                >
                  {withdrawingId === selectedApp.id ? 'Withdrawing...' : 'Withdraw Application'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
