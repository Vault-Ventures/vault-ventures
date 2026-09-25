import React, { useEffect, useRef, useState } from 'react';
import { api, AdminInsightRecord, ApiError } from '../../services/api';

export const ADMIN_INSIGHTS_DISCLOSURE =
  'AI-Assisted Platform Insights are advisory summaries derived from deterministic platform metrics. AI does not perform administrative actions, approve verifications, resolve discrepancies, or alter user permissions.';

interface AdminInsightsSectionProps {
  className?: string;
}

export const AdminInsightsSection: React.FC<AdminInsightsSectionProps> = ({ className = '' }) => {
  const [insight, setInsight] = useState<AdminInsightRecord | null>(null);
  const [history, setHistory] = useState<AdminInsightRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const isGenerating = useRef<boolean>(false);

  const loadData = async (preserveSelectedVersion = false) => {
    try {
      setLoading(true);
      setError(null);
      const [currentRes, historyRes] = await Promise.all([
        api.admin.insights.current().catch((err: ApiError) => {
          if (err.status === 403 || err.status === 401) throw err;
          return null;
        }),
        api.admin.insights.history().catch(() => []),
      ]);

      const currentData: AdminInsightRecord | null =
        currentRes && typeof currentRes === 'object' && 'data' in currentRes
          ? (currentRes as any).data
          : (currentRes as AdminInsightRecord | null);

      const historyData: AdminInsightRecord[] = Array.isArray(historyRes)
        ? historyRes
        : (historyRes as any)?.data || [];

      setInsight(currentData);
      setHistory(historyData);

      if (!preserveSelectedVersion || selectedVersion === null) {
        if (currentData) {
          setSelectedVersion(currentData.version);
        } else if (historyData.length > 0) {
          setSelectedVersion(historyData[0].version);
        } else {
          setSelectedVersion(null);
        }
      }
    } catch (err: any) {
      if (err.status === 403) {
        setError('You do not have permission to generate AI platform insights.');
      } else {
        setError('Failed to load platform insights.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (isGenerating.current || generating) return;

    try {
      isGenerating.current = true;
      setGenerating(true);
      setError(null);

      const res = await api.admin.insights.generate();
      const newInsight: AdminInsightRecord =
        res && typeof res === 'object' && 'data' in res ? (res as any).data : res;

      setInsight(newInsight);
      setSelectedVersion(newInsight.version);

      const historyRes = await api.admin.insights.history().catch(() => []);
      const historyData: AdminInsightRecord[] = Array.isArray(historyRes)
        ? historyRes
        : (historyRes as any)?.data || [];
      setHistory(historyData);
    } catch (err: any) {
      const code = err?.code || '';
      const status = err?.status;

      if (code === 'PROVIDER_UNAVAILABLE' || status === 503) {
        setError('AI insights are temporarily unavailable. Platform operations remain fully usable.');
      } else if (code === 'SOURCE_CHANGED' || (status === 409 && code === 'SOURCE_CHANGED')) {
        setError('Platform metrics changed while the insight was being generated. Please try again.');
      } else if (code === 'GENERATION_IN_PROGRESS' || status === 409) {
        setError('An AI insight is already being generated for the platform.');
      } else if (status === 403) {
        setError('You do not have permission to generate AI platform insights.');
      } else if (code === 'INVALID_ANALYSIS_OUTPUT' || status === 502) {
        setError('AI analysis output could not be validated. Platform operations remain fully usable.');
      } else {
        setError(err.message || 'Failed to generate AI platform insight.');
      }
    } finally {
      isGenerating.current = false;
      setGenerating(false);
    }
  };

  const displayedInsight = selectedVersion !== null
    ? history.find((h) => h.version === selectedVersion) || (insight?.version === selectedVersion ? insight : insight)
    : insight;

  const isStale = (insight === null && history.length > 0) || (displayedInsight && !displayedInsight.is_current);

  return (
    <div
      data-testid="admin-insights-section"
      className={`rounded-2xl border border-amber-500/20 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 p-6 backdrop-blur-sm shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-slate-100">AI-Assisted Platform Insights</h3>
              <span
                data-testid="advisory-badge"
                className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30"
              >
                Advisory
              </span>
              {displayedInsight && (
                <span className="text-xs text-slate-400 font-mono">v{displayedInsight.version}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated high-level telemetry explanation derived from live platform metrics
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              data-testid="toggle-history-btn"
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              History ({history.length})
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          <button
            type="button"
            data-testid="generate-insight-btn"
            disabled={generating || loading}
            onClick={handleGenerate}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={generating ? 'animate-spin' : ''} aria-hidden="true">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            {generating
              ? 'Generating…'
              : isStale
              ? 'Regenerate Platform Insight'
              : insight
              ? 'Refresh Insight'
              : 'Generate Platform Insight'}
          </button>
        </div>
      </div>

      {/* Required Advisory Disclosure */}
      <div
        data-testid="admin-insights-disclosure"
        className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11.5px] text-amber-200/90 leading-relaxed flex items-start gap-2.5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <div>
          <span>{ADMIN_INSIGHTS_DISCLOSURE}</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          data-testid="insights-error-banner"
          className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stale / Changed state warning */}
      {isStale && !generating && (
        <div
          data-testid="stale-insight-banner"
          className="mt-4 p-3 rounded-lg bg-amber-900/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              <strong>Outdated / Platform state changed:</strong> Deterministic platform metrics have changed since this insight was generated.
            </span>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="text-xs font-semibold text-amber-400 underline hover:text-amber-300 ml-3 shrink-0 cursor-pointer"
          >
            Regenerate
          </button>
        </div>
      )}

      {/* History Version Drawer */}
      {showHistory && history.length > 0 && (
        <div
          data-testid="history-drawer"
          className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-medium text-slate-300">Version History</span>
            <span className="text-[11px] text-slate-500">Click a version to inspect past advisory summary</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto">
            {history.map((h) => (
              <button
                key={h.id}
                type="button"
                data-testid={`history-version-item-${h.version}`}
                onClick={() => setSelectedVersion(h.version)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedVersion === h.version
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Version {h.version}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      h.is_current
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {h.is_current ? 'Current' : 'Outdated'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {new Date(h.generated_at).toLocaleDateString()} {new Date(h.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mt-5">
        {loading ? (
          <div
            data-testid="insights-loading"
            className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-amber-500" aria-hidden="true">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <p className="text-xs">Loading platform insights…</p>
          </div>
        ) : generating ? (
          <div
            data-testid="insights-generating"
            className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300"
          >
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 animate-spin" aria-hidden="true">
                <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200">Generating platform governance summary…</p>
              <p className="text-xs text-slate-400 mt-0.5">Aggregating telemetry and formulating advisory overview</p>
            </div>
          </div>
        ) : !displayedInsight ? (
          /* Empty state */
          <div
            data-testid="insights-empty-state"
            className="py-10 px-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/40 mx-auto mb-2" aria-hidden="true">
              <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
            </svg>
            <h4 className="text-sm font-semibold text-slate-200">No AI Platform Insight Generated</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              No AI platform insight has been generated for the current platform state. Click below to formulate an advisory governance summary.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
              </svg>
              Generate Platform Insight
            </button>
          </div>
        ) : (
          /* Success rendering state */
          <div data-testid="insights-content" className="space-y-4">
            {/* Executive Summary */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  Executive Governance Summary
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(displayedInsight.generated_at).toLocaleString()}
                </span>
              </div>
              <p data-testid="insight-summary" className="text-sm text-slate-200 leading-relaxed">
                {displayedInsight.summary}
              </p>
            </div>

            {/* Factor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Governance Observations */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Governance Observations
                  </h4>
                </div>
                {displayedInsight.governance_observations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No specific observations noted.</p>
                ) : (
                  <ul data-testid="governance-observations-list" className="space-y-2">
                    {displayedInsight.governance_observations.map((item, index) => (
                      <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Operational Highlights */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Operational Highlights
                  </h4>
                </div>
                {displayedInsight.operational_highlights.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No operational highlights recorded.</p>
                ) : (
                  <ul data-testid="operational-highlights-list" className="space-y-2">
                    {displayedInsight.operational_highlights.map((item, index) => (
                      <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Attention Areas */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Attention Areas
                  </h4>
                </div>
                {displayedInsight.attention_areas.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No critical attention areas identified.</p>
                ) : (
                  <ul data-testid="attention-areas-list" className="space-y-2">
                    {displayedInsight.attention_areas.map((item, index) => (
                      <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Suggested Review Points */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Suggested Review Points
                  </h4>
                </div>
                {displayedInsight.suggested_review_points.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No review suggestions for this cycle.</p>
                ) : (
                  <ul data-testid="suggested-review-points-list" className="space-y-2">
                    {displayedInsight.suggested_review_points.map((item, index) => (
                      <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
