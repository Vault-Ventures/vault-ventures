import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, ApiError, type MatchingInsightRecord, type MatchingFactorExplanation } from '../../services/api';
import { Button } from '../ui/Button';

export const MATCHING_INSIGHTS_DISCLOSURE =
  'AI explains the existing rule-based match using the available matching data. It does not change the match score or ranking and does not guarantee investment, collaboration, or deal success.';

export function formatFactorLabel(factor: string): string {
  if (!factor) return 'Match Factor';
  const normalized = factor.toLowerCase().replace(/[\s-]+/g, '_');
  const mapping: Record<string, string> = {
    industry: 'Industry Alignment',
    industry_alignment: 'Industry Alignment',
    investment_range: 'Investment Range',
    available_investment: 'Investment Range',
    check_size: 'Investment Range',
    business_stage: 'Business Stage',
    stage: 'Business Stage',
    risk_level: 'Risk Compatibility',
    risk: 'Risk Compatibility',
    location: 'Location Compatibility',
    involvement: 'Expected Involvement',
    expected_involvement: 'Expected Involvement',
    skills: 'Skills Alignment',
    skills_alignment: 'Skills Alignment',
    industry_experience: 'Industry Experience',
    experience_level: 'Experience Level',
    availability: 'Availability',
    compensation: 'Compensation Preferences',
    compensation_preferences: 'Compensation Preferences',
  };

  if (mapping[normalized]) {
    return mapping[normalized];
  }

  return factor
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export interface MatchingInsightsSectionProps {
  businessId?: number | string | null;
  role?: 'investor' | 'professional' | string | null;
  candidateId?: number | string | null;
  initialInsight?: MatchingInsightRecord | null;
  className?: string;
}

export default function MatchingInsightsSection({
  businessId,
  role,
  candidateId: initialCandidateId,
  initialInsight = null,
  className = '',
}: MatchingInsightsSectionProps) {
  const [record, setRecord] = useState<MatchingInsightRecord | null>(initialInsight);
  const [resolvedCandidateId, setResolvedCandidateId] = useState<number | string | null>(initialCandidateId ?? null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MatchingInsightRecord[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryRecord, setActiveHistoryRecord] = useState<MatchingInsightRecord | null>(null);

  const isMounted = useRef(true);
  const isGenerating = useRef(false);

  // Sync candidate ID if prop changes
  useEffect(() => {
    if (initialCandidateId !== undefined && initialCandidateId !== null) {
      setResolvedCandidateId(initialCandidateId);
    }
  }, [initialCandidateId]);

  // Resolve candidate ID from current user profile if missing and role is investor or professional
  useEffect(() => {
    isMounted.current = true;

    async function resolveCandidate() {
      if (resolvedCandidateId !== null || !role) return;
      try {
        const profileData = await api.profile.get();
        if (!isMounted.current) return;
        if (role === 'investor' && profileData?.profiles?.investor?.id) {
          setResolvedCandidateId(profileData.profiles.investor.id);
        } else if (role === 'professional' && profileData?.profiles?.professional?.id) {
          setResolvedCandidateId(profileData.profiles.professional.id);
        }
      } catch {
        // Fallback gracefully
      }
    }

    if (!resolvedCandidateId && (role === 'investor' || role === 'professional')) {
      resolveCandidate();
    }

    return () => {
      isMounted.current = false;
    };
  }, [role, resolvedCandidateId]);

  // Fetch current insight when IDs are available
  const fetchCurrentInsight = useCallback(async () => {
    if (!businessId || !role || !resolvedCandidateId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.matchingInsights.current(businessId, role, resolvedCandidateId);
      if (isMounted.current) {
        setRecord(data);
        setActiveHistoryRecord(null);
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Authentication required to view AI insights.');
        } else if (err.status === 403) {
          setError('You do not have permission to view AI insights for this match.');
          setRecord(null);
        } else if (err.status === 404) {
          setError('AI match insight is not available for this match.');
          setRecord(null);
        } else if (err.status === 503 || err.code === 'PROVIDER_UNAVAILABLE') {
          setError('AI-assisted match insights are currently unavailable.');
        } else {
          setError('AI insight could not be loaded at this time. Please try again.');
        }
      } else {
        setError('AI insight could not be loaded at this time. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [businessId, role, resolvedCandidateId]);

  useEffect(() => {
    if (businessId && role && resolvedCandidateId) {
      fetchCurrentInsight();
    }
  }, [businessId, role, resolvedCandidateId, fetchCurrentInsight]);

  // Handle generation / regeneration
  const handleGenerate = async () => {
    if (!businessId || !role || !resolvedCandidateId) return;
    if (isGenerating.current || busy) return;

    isGenerating.current = true;
    setBusy(true);
    setError(null);

    try {
      const data = await api.matchingInsights.generate(businessId, role, resolvedCandidateId);
      if (isMounted.current) {
        setRecord(data);
        setActiveHistoryRecord(null);
        if (history) {
          setHistory(prev => (prev ? [data, ...prev.filter(h => h.id !== data.id)] : [data]));
        }
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Authentication required to generate insights.');
        } else if (err.status === 403) {
          setError('You do not have permission to generate AI insights for this match.');
          setRecord(null);
        } else if (err.status === 404 || err.code === 'MATCH_NOT_AVAILABLE') {
          setError('AI match insight is not available for this match.');
        } else if (err.status === 409 && err.code === 'SOURCE_CHANGED') {
          setError('The match data changed while the insight was being generated. Refresh the match and try again.');
        } else if (err.status === 409 && err.code === 'GENERATION_IN_PROGRESS') {
          setError('An insight is already being generated for this match.');
        } else if (err.status === 502 || err.code === 'INVALID_ANALYSIS_OUTPUT') {
          setError('AI insight could not be generated due to invalid provider output. Please try again.');
        } else if (err.status === 503 || err.code === 'PROVIDER_UNAVAILABLE') {
          setError('AI-assisted match insights are currently unavailable.');
        } else {
          setError('AI insight could not be generated right now. Please try again.');
        }
      } else {
        setError('AI insight could not be generated right now. Please try again.');
      }
    } finally {
      isGenerating.current = false;
      if (isMounted.current) {
        setBusy(false);
      }
    }
  };

  // Load history
  const handleToggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    setShowHistory(true);
    if (!history && businessId && role && resolvedCandidateId) {
      setHistoryLoading(true);
      try {
        const items = await api.matchingInsights.history(businessId, role, resolvedCandidateId);
        if (isMounted.current) {
          setHistory(items);
        }
      } catch {
        if (isMounted.current) {
          setHistory([]);
        }
      } finally {
        if (isMounted.current) {
          setHistoryLoading(false);
        }
      }
    }
  };

  const displayedRecord = activeHistoryRecord || record;
  const isViewingHistorical = !!activeHistoryRecord && activeHistoryRecord.id !== record?.id;

  return (
    <section
      aria-label="AI-Assisted Match Insights"
      className={`rounded-xl border border-[color:var(--vv-border)] bg-[#0A101D] p-4 space-y-4 ${className}`}
    >
      {/* Header & Tag */}
      <div className="flex items-center justify-between gap-2 border-b border-[#1c2a3e] pb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              color: '#A78BFA',
              borderColor: 'rgba(167,139,250,0.22)',
              background: 'rgba(167,139,250,0.07)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            AI-Assisted
          </div>
          <h3 className="font-display text-[13px] font-semibold text-[color:var(--vv-text)]">
            AI-Assisted Match Insights
          </h3>
        </div>

        {displayedRecord && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">
              v{displayedRecord.version}
            </span>
            {isViewingHistorical ? (
              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                Archived
              </span>
            ) : displayedRecord.freshness?.is_current === false ? (
              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                Stale
              </span>
            ) : (
              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Current
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advisory Disclosure */}
      <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-relaxed bg-[rgba(167,139,250,0.04)] border border-[rgba(167,139,250,0.1)] rounded-lg p-2.5">
        {MATCHING_INSIGHTS_DISCLOSURE}
      </p>

      {/* Loading state */}
      {loading && (
        <p role="status" className="text-[12px] text-[color:var(--vv-text-secondary)] animate-pulse py-2">
          Loading match insights...
        </p>
      )}

      {/* In-progress generating state */}
      {busy && (
        <div role="status" className="flex items-center gap-2 text-[12px] text-[#A78BFA] animate-pulse py-1">
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="3" strokeDasharray="30 60" />
          </svg>
          <span>Generating match insight...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-lg p-3 text-[11.5px] bg-red-950/30 border border-red-800/40 text-red-300 leading-snug space-y-1"
        >
          <p>{error}</p>
        </div>
      )}

      {/* Stale State Banner */}
      {!isViewingHistorical && displayedRecord && displayedRecord.freshness?.is_current === false && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg p-3 bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11.5px] leading-snug"
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-amber-300">Stale Insight</p>
            <p className="text-amber-200/80 text-[11px] mt-0.5">
              This insight was generated from an earlier version of the match data.
            </p>
          </div>
        </div>
      )}

      {/* Viewing Historical Version Banner */}
      {isViewingHistorical && (
        <div className="flex items-center justify-between gap-2 rounded-lg p-2.5 bg-blue-950/30 border border-blue-800/40 text-blue-200 text-[11px]">
          <span>Viewing historical version {displayedRecord?.version}</span>
          <button
            type="button"
            onClick={() => setActiveHistoryRecord(null)}
            className="text-[11px] text-blue-300 hover:underline font-medium"
          >
            Back to current insight
          </button>
        </div>
      )}

      {/* Empty State / No insight yet */}
      {!loading && !displayedRecord && !error && (
        <div className="py-4 text-center space-y-3">
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">
            No AI-assisted insight has been generated for this match yet.
          </p>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={busy || loading || !businessId || !role || !resolvedCandidateId}
          >
            {busy ? 'Generating...' : 'Generate AI Insight'}
          </Button>
        </div>
      )}

      {/* Display Insight Content */}
      {displayedRecord && (
        <article className="space-y-4 pt-1" aria-label={`Matching insight version ${displayedRecord.version}`}>
          {/* Summary */}
          <section>
            <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[color:var(--vv-text-tertiary)] mb-1">
              Summary
            </h4>
            <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
              {displayedRecord.summary}
            </p>
          </section>

          {/* Strengths & Gaps 2-column or list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Match Strengths */}
            <section className="rounded-lg p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] border border-[color:var(--vv-border)]">
              <h4 className="font-semibold text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Match Strengths
              </h4>
              {displayedRecord.match_strengths && displayedRecord.match_strengths.length > 0 ? (
                <ul className="space-y-1.5">
                  {displayedRecord.match_strengths.map((s, i) => (
                    <li key={i} className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug whitespace-pre-wrap break-words">
                      • {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                  No additional items identified.
                </p>
              )}
            </section>

            {/* Potential Gaps */}
            <section className="rounded-lg p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] border border-[color:var(--vv-border)]">
              <h4 className="font-semibold text-[11px] uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Potential Gaps
              </h4>
              {displayedRecord.potential_gaps && displayedRecord.potential_gaps.length > 0 ? (
                <ul className="space-y-1.5">
                  {displayedRecord.potential_gaps.map((g, i) => (
                    <li key={i} className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug whitespace-pre-wrap break-words">
                      • {g}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                  No additional items identified.
                </p>
              )}
            </section>
          </div>

          {/* Discussion Points */}
          <section className="rounded-lg p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] border border-[color:var(--vv-border)]">
            <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[#60A5FA] mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
              Discussion Points
            </h4>
            {displayedRecord.discussion_points && displayedRecord.discussion_points.length > 0 ? (
              <ul className="space-y-1.5">
                {displayedRecord.discussion_points.map((d, i) => (
                  <li key={i} className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug whitespace-pre-wrap break-words">
                    • {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                No additional items identified.
              </p>
            )}
          </section>

          {/* Cautions */}
          <section className="rounded-lg p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] border border-[color:var(--vv-border)]">
            <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[#F87171] mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
              Cautions
            </h4>
            {displayedRecord.cautions && displayedRecord.cautions.length > 0 ? (
              <ul className="space-y-1.5">
                {displayedRecord.cautions.map((c, i) => (
                  <li key={i} className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug whitespace-pre-wrap break-words">
                    • {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] italic">
                No additional items identified.
              </p>
            )}
          </section>

          {/* Factor Explanations */}
          {displayedRecord.factor_explanations && displayedRecord.factor_explanations.length > 0 && (
            <section className="space-y-2">
              <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[color:var(--vv-text-tertiary)]">
                Factor Explanations
              </h4>
              <div className="space-y-2">
                {displayedRecord.factor_explanations.map((fe: MatchingFactorExplanation, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-[#1c2a3e] bg-[#0E1726] text-[11.5px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[color:var(--vv-text)]">
                        {formatFactorLabel(fe.factor_key ?? fe.factor ?? '')}
                      </span>
                      {typeof fe.confidence === 'number' && (
                        <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">
                          Confidence: {Math.round(fe.confidence > 1 ? fe.confidence : fe.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    {(fe.explanation ?? fe.observation) && (
                      <p className="text-[color:var(--vv-text-secondary)] whitespace-pre-wrap break-words">
                        <span className="text-[color:var(--vv-text-tertiary)] font-medium">Observation: </span>
                        {fe.explanation ?? fe.observation}
                      </p>
                    )}
                    {fe.evidence && (
                      <p className="text-[color:var(--vv-text-tertiary)] text-[11px] whitespace-pre-wrap break-words">
                        <span className="text-[color:var(--vv-text-tertiary)] font-medium">Evidence: </span>
                        {fe.evidence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations if present */}
          {displayedRecord.recommendations && displayedRecord.recommendations.length > 0 && (
            <section className="rounded-lg p-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] border border-[color:var(--vv-border)]">
              <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[#A78BFA] mb-1.5">
                Recommendations
              </h4>
              <ul className="space-y-1.5">
                {displayedRecord.recommendations.map((rec, i) => (
                  <li key={i} className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug whitespace-pre-wrap break-words">
                    • {rec}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1c2a3e]">
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={busy || loading || !businessId || !role || !resolvedCandidateId}
            >
              {busy
                ? 'Generating...'
                : displayedRecord.freshness?.is_current === false
                ? 'Regenerate Insight'
                : 'Regenerate Insight'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchCurrentInsight}
              disabled={busy || loading}
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleHistory}
              disabled={busy || loading}
            >
              {showHistory ? 'Hide previous insights' : 'View previous insights'}
            </Button>
          </div>

          {/* History list */}
          {showHistory && (
            <div className="rounded-lg p-3 bg-[#0E1726] border border-[#1c2a3e] space-y-2">
              <p className="text-[11px] font-semibold text-[color:var(--vv-text)]">Insight History</p>
              {historyLoading && (
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] animate-pulse">
                  Loading previous insights...
                </p>
              )}
              {history && history.length === 0 && (
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">No previous versions available.</p>
              )}
              {history && history.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {history.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveHistoryRecord(item)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] border transition-colors ${
                        (displayedRecord?.id === item.id)
                          ? 'bg-[rgba(167,139,250,0.12)] border-[#A78BFA] text-[color:var(--vv-text)]'
                          : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_50%,transparent)] border-[color:var(--vv-border)] text-[color:var(--vv-text-secondary)] hover:border-[#5E6D8F]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Version {item.version}</span>
                        <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">
                          {item.generated_at ? new Date(item.generated_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <span className="text-[10px]">
                        {item.freshness?.is_current ? (
                          <span className="text-emerald-400">Current</span>
                        ) : (
                          <span className="text-amber-400">Stale</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </article>
      )}
    </section>
  );
}
