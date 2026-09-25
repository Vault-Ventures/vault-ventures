import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, ApiError, type DealInsightRecord } from '../../services/api';
import { Button } from '../ui/Button';

export const DEAL_INSIGHTS_DISCLOSURE =
  'AI-Assisted Deal Insights are advisory explanations only. AI does not advance deal stages, execute agreements, approve milestones, or release simulated funds. Legal and financial terms are governed by the Deal Room records and platform rules.';

export const DEAL_INSIGHTS_LEGAL_DISCLAIMER =
  'AI explanations are informational and are not legal advice.';

export interface DealInsightsSectionProps {
  dealId?: number | string | null;
  role?: 'investor' | 'professional' | string | null;
  canGenerate?: boolean;
  initialInsight?: DealInsightRecord | null;
  className?: string;
}

export default function DealInsightsSection({
  dealId,
  role,
  canGenerate = true,
  initialInsight = null,
  className = '',
}: DealInsightsSectionProps) {
  const [record, setRecord] = useState<DealInsightRecord | null>(initialInsight);
  const [history, setHistory] = useState<DealInsightRecord[] | null>(null);
  const [activeHistoryRecord, setActiveHistoryRecord] = useState<DealInsightRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const isMounted = useRef<boolean>(true);
  const isGenerating = useRef<boolean>(false);

  // Fetch current insight and history on mount or when dealId/role changes
  const fetchInsightData = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    setError(null);
    try {
      const [currentRes, historyRes] = await Promise.allSettled([
        api.dealInsights.current(dealId, role || undefined),
        api.dealInsights.history(dealId, role || undefined),
      ]);

      if (!isMounted.current) return;

      if (currentRes.status === 'fulfilled') {
        setRecord(currentRes.value);
        setActiveHistoryRecord(null);
      }

      if (historyRes.status === 'fulfilled') {
        setHistory(Array.isArray(historyRes.value) ? historyRes.value : []);
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Authentication required to view AI insights.');
        } else if (err.status === 403) {
          setError('You do not have permission to view AI insights for this Deal.');
        } else if (err.status === 404) {
          setError('Deal not found or inaccessible.');
        } else {
          setError(err.message || 'Failed to load AI deal insights.');
        }
      } else {
        setError('Failed to load AI deal insights.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [dealId, role]);

  useEffect(() => {
    isMounted.current = true;
    fetchInsightData();
    return () => {
      isMounted.current = false;
    };
  }, [fetchInsightData]);

  // Handle explicit generation or regeneration
  const handleGenerate = async () => {
    if (!dealId || isGenerating.current || !canGenerate) return;

    isGenerating.current = true;
    setBusy(true);
    setError(null);

    try {
      const newRecord = await api.dealInsights.generate(dealId, role || undefined);
      if (!isMounted.current) return;

      setRecord(newRecord);
      setActiveHistoryRecord(null);

      // Refresh history silently
      try {
        const histData = await api.dealInsights.history(dealId, role || undefined);
        if (isMounted.current) {
          setHistory(Array.isArray(histData) ? histData : []);
        }
      } catch {
        // Non-critical
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;

      if (err instanceof ApiError) {
        const code = err.code || '';
        if (err.status === 401) {
          setError('Authentication required to generate AI insights.');
        } else if (err.status === 403) {
          setError('You do not have permission to generate AI insights for this Deal.');
        } else if (err.status === 404) {
          setError('Deal not found or inaccessible.');
        } else if (err.status === 409 || code === 'SOURCE_CHANGED') {
          if (code === 'GENERATION_IN_PROGRESS') {
            setError('An AI insight is already being generated for this Deal.');
          } else {
            setError('The Deal changed while the insight was being generated. Please try again.');
          }
        } else if (err.status === 503 || code === 'PROVIDER_UNAVAILABLE') {
          setError('AI insights are temporarily unavailable. The Deal Room remains fully usable.');
        } else if (err.status === 502 || code === 'INVALID_ANALYSIS_OUTPUT') {
          setError('Unable to process AI insight output. Please try again later.');
        } else {
          setError(err.message || 'Unable to generate AI insight. Please try again later.');
        }
      } else {
        setError('Unable to generate AI insight. Please try again later.');
      }
    } finally {
      isGenerating.current = false;
      if (isMounted.current) {
        setBusy(false);
      }
    }
  };

  // Toggle history drawer
  const toggleHistory = async () => {
    if (!showHistory && (!history || history.length === 0) && dealId) {
      setHistoryLoading(true);
      try {
        const histData = await api.dealInsights.history(dealId, role || undefined);
        if (isMounted.current) {
          setHistory(Array.isArray(histData) ? histData : []);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted.current) {
          setHistoryLoading(false);
        }
      }
    }
    setShowHistory((prev) => !prev);
  };

  // The active record being viewed (either current or a selected historical record)
  const displayRecord = activeHistoryRecord || record;
  const isViewingHistorical = activeHistoryRecord !== null;
  const hasHistory = history && history.length > 0;
  const isStale = record ? !record.freshness?.is_current : (!record && hasHistory);

  return (
    <div
      data-testid="deal-insights-section"
      className={`rounded-xl border border-[#1c2a3e] bg-[#121A2B] p-5 space-y-4 ${className}`}
    >
      {/* --- Section Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1c2a3e]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-[#C67A4E]/10 border border-[#C67A4E]/20 flex items-center justify-center text-[#C67A4E] shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[color:var(--vv-text)]">
                AI-Assisted Deal Insights
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#C67A4E]/10 text-[#C67A4E] border border-[#C67A4E]/20">
                Advisory
              </span>
              {displayRecord && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    isViewingHistorical
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : displayRecord.freshness?.is_current
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isViewingHistorical
                    ? `Viewing v${displayRecord.version} (Historical)`
                    : displayRecord.freshness?.is_current
                    ? 'Current'
                    : 'Outdated / Deal changed'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">
              Structured advisory explanation of the current deal progress and key discussion points.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {hasHistory && (
            <button
              onClick={toggleHistory}
              data-testid="deal-insights-history-toggle"
              className="text-xs font-medium text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] px-2.5 py-1.5 rounded-lg border border-[#1c2a3e] hover:bg-[#1C283E] transition-colors"
            >
              {showHistory ? 'Close History' : `History (${history.length})`}
            </button>
          )}

          {canGenerate && displayRecord && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleGenerate}
              disabled={busy}
              data-testid="deal-insights-regenerate-btn"
            >
              {busy ? 'Generating…' : isStale ? 'Regenerate AI Insight' : 'Regenerate'}
            </Button>
          )}
        </div>
      </div>

      {/* --- Error Banner --- */}
      {error && (
        <div
          data-testid="deal-insights-error"
          className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-400">Notice:</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 font-bold shrink-0"
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      {/* --- History Drawer / List --- */}
      {showHistory && (
        <div data-testid="deal-insights-history-drawer" className="p-3.5 rounded-lg bg-[#0F1728] border border-[#1c2a3e] space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[color:var(--vv-text)] uppercase tracking-wider">
              Insight Version History
            </h4>
            {isViewingHistorical && (
              <button
                onClick={() => setActiveHistoryRecord(null)}
                className="text-[11px] text-[#C67A4E] hover:underline font-medium"
              >
                ← Return to latest insight
              </button>
            )}
          </div>

          {historyLoading ? (
            <p className="text-xs text-[color:var(--vv-text-tertiary)] italic">Loading history…</p>
          ) : !history || history.length === 0 ? (
            <p className="text-xs text-[color:var(--vv-text-tertiary)] italic">No version history available.</p>
          ) : (
            <div className="divide-y divide-[#1c2a3e] max-h-48 overflow-y-auto">
              {history.map((hItem) => {
                const isSelected = displayRecord?.id === hItem.id;
                const dateStr = hItem.generated_at
                  ? new Date(hItem.generated_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Earlier';

                return (
                  <div
                    key={hItem.id}
                    onClick={() => setActiveHistoryRecord(hItem)}
                    className={`py-2 px-2.5 flex items-center justify-between text-xs cursor-pointer rounded transition-colors ${
                      isSelected ? 'bg-[#1C283E] text-[#C67A4E]' : 'hover:bg-[#1C283E]/50 text-[color:var(--vv-text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono">v{hItem.version}</span>
                      <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          hItem.freshness?.is_current
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-700/40 text-[color:var(--vv-text-tertiary)]'
                        }`}
                      >
                        {hItem.freshness?.is_current ? 'Current' : 'Outdated'}
                      </span>
                      {isSelected && <span className="text-[10px] font-bold text-[#C67A4E]">Active View</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Main Content States --- */}
      {loading ? (
        <div data-testid="deal-insights-loading" className="py-8 text-center space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[color:var(--vv-text-tertiary)]">Loading AI deal insights…</p>
        </div>
      ) : busy ? (
        <div data-testid="deal-insights-generating" className="py-8 text-center space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-[#C67A4E] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-[color:var(--vv-text)]">Generating advisory summary…</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
            Analyzing allowlisted deal metadata, negotiation status, and milestone progress.
          </p>
        </div>
      ) : !displayRecord ? (
        /* --- Empty / No-Insight State --- */
        <div data-testid="deal-insights-empty" className="py-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#1C283E] border border-[#1c2a3e] flex items-center justify-center mx-auto text-[color:var(--vv-text-tertiary)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[color:var(--vv-text)]">
              {isStale ? 'Previous Insight is Outdated' : 'No AI Insight Generated Yet'}
            </h4>
            <p className="text-xs text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mt-1">
              {isStale
                ? 'The Deal Room has changed since this insight was generated. You may generate a fresh insight for the current deal state.'
                : 'No AI insight has been generated for the current deal state. AI provides an advisory overview of deal progress, key terms, and discussion points.'}
            </p>
          </div>

          {canGenerate ? (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={busy}
              data-testid="deal-insights-generate-btn"
            >
              {isStale ? 'Regenerate AI Insight' : 'Generate AI Insight'}
            </Button>
          ) : (
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
              AI insight generation is available to deal participants. Admin oversight is read-only.
            </p>
          )}
        </div>
      ) : (
        /* --- Populated Insight View --- */
        <div data-testid="deal-insights-content" className="space-y-4">
          {/* Stale Warning Banner (when viewing an outdated record) */}
          {isStale && !isViewingHistorical && (
            <div
              data-testid="deal-insights-stale-banner"
              className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-300 font-medium">
                  The Deal Room has changed since this insight was generated.
                </span>
              </div>
              {canGenerate && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={busy}
                  className="shrink-0 text-xs"
                >
                  Regenerate AI Insight
                </Button>
              )}
            </div>
          )}

          {/* 1. Overall Summary */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">
              Deal Summary
            </h4>
            <p className="text-xs text-[color:var(--vv-text)] leading-relaxed font-normal">
              {displayRecord.summary}
            </p>
          </div>

          {/* 2. Current Stage Explanation */}
          <div className="space-y-1 p-3 rounded-lg bg-[#0F1728] border border-[#1c2a3e]">
            <h4 className="text-[11px] font-semibold text-[#C67A4E] uppercase tracking-wider">
              Current Stage Explanation
            </h4>
            <p className="text-xs text-[color:var(--vv-text-secondary)] leading-relaxed">
              {displayRecord.current_stage_summary}
            </p>
          </div>

          {/* 3. Structured Factors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Key Points */}
            <div className="p-3 rounded-lg bg-[#0F1728] border border-[#1c2a3e] space-y-2">
              <h5 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Key Points
              </h5>
              <ul className="space-y-1.5 text-xs text-[color:var(--vv-text-secondary)]">
                {displayRecord.key_points && displayRecord.key_points.length > 0 ? (
                  displayRecord.key_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400/80 mt-0.5 shrink-0">•</span>
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[color:var(--vv-text-tertiary)] italic">None noted.</li>
                )}
              </ul>
            </div>

            {/* Open Items */}
            <div className="p-3 rounded-lg bg-[#0F1728] border border-[#1c2a3e] space-y-2">
              <h5 className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Open Items
              </h5>
              <ul className="space-y-1.5 text-xs text-[color:var(--vv-text-secondary)]">
                {displayRecord.open_items && displayRecord.open_items.length > 0 ? (
                  displayRecord.open_items.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-400/80 mt-0.5 shrink-0">•</span>
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[color:var(--vv-text-tertiary)] italic">None outstanding.</li>
                )}
              </ul>
            </div>

            {/* Discussion Points */}
            <div className="p-3 rounded-lg bg-[#0F1728] border border-[#1c2a3e] space-y-2">
              <h5 className="text-[11px] font-semibold text-[#C67A4E] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />
                Discussion Points
              </h5>
              <ul className="space-y-1.5 text-xs text-[color:var(--vv-text-secondary)]">
                {displayRecord.discussion_points && displayRecord.discussion_points.length > 0 ? (
                  displayRecord.discussion_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#C67A4E]/80 mt-0.5 shrink-0">•</span>
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[color:var(--vv-text-tertiary)] italic">None suggested.</li>
                )}
              </ul>
            </div>

            {/* Cautions */}
            <div className="p-3 rounded-lg bg-[#0F1728] border border-[#1c2a3e] space-y-2">
              <h5 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Cautions
              </h5>
              <ul className="space-y-1.5 text-xs text-[color:var(--vv-text-secondary)]">
                {displayRecord.cautions && displayRecord.cautions.length > 0 ? (
                  displayRecord.cautions.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400/80 mt-0.5 shrink-0">•</span>
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[color:var(--vv-text-tertiary)] italic">None identified.</li>
                )}
              </ul>
            </div>
          </div>

          {/* --- Metadata & Disclosures Footer --- */}
          <div className="pt-3 border-t border-[#1c2a3e] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[color:var(--vv-text-tertiary)] flex-wrap gap-2">
              <span>
                Version {displayRecord.version} • Generated{' '}
                {displayRecord.generated_at
                  ? new Date(displayRecord.generated_at).toLocaleString()
                  : 'Recently'}
              </span>
              <span className="italic">{DEAL_INSIGHTS_LEGAL_DISCLAIMER}</span>
            </div>

            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
              {DEAL_INSIGHTS_DISCLOSURE}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
