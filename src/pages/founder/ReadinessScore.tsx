import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconArrowRight, IconAlertTriangle, IconTrendingUp } from '../../components/layout/Icons';
import { api, ReadinessAssessmentData, ApiError } from '../../services/api';

export default function ReadinessScore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('businessId');
  const currentId = useRef(selectedId);
  currentId.current = selectedId;
  const [choices, setChoices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [business, setBusiness] = useState<any | null>(null);
  const [assessment, setAssessment] = useState<ReadinessAssessmentData | null>(null);
  const [history, setHistory] = useState<ReadinessAssessmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setBusiness(null);
        setAssessment(null);
        setHistory([]);
        if (!selectedId) {
          const result = await api.businesses.listPage(page);
          if (mounted) {
            if (page > result.pagination.last_page) { setPage(result.pagination.last_page); return; }
            setChoices(result.items);
            setLastPage(result.pagination.last_page);
          }
          return;
        }
        if (!/^[1-9]\d*$/.test(selectedId)) throw new Error('Invalid business ID.');
        const primaryBiz = await api.businesses.get(selectedId);

        if (mounted) setBusiness(primaryBiz);

        // Load latest assessment and assessment history
        const [latestAss, allAss] = await Promise.all([
          api.readiness.getLatestAssessment(primaryBiz.id).catch((err) => { if (err instanceof ApiError && err.status === 404) return null; throw err; }),
          api.readiness.listAssessments(primaryBiz.id),
        ]);

        if (mounted) {
          setAssessment(latestAss);
          setHistory(Array.isArray(allAss) ? allAss : []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load readiness assessment data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [selectedId, page]);

  async function handleRecalculate() {
    if (!business) return;
    try {
      setRecalculating(true);
      setError(null);
      const updated = await api.readiness.createAssessment(business.id);
      if (currentId.current !== String(business.id)) return;
      setAssessment(updated);
      const allAss = await api.readiness.listAssessments(business.id).catch(() => []);
      if (currentId.current === String(business.id)) setHistory(Array.isArray(allAss) ? allAss : []);
    } catch (err: any) {
      if (currentId.current !== String(business.id)) return;
      if (err instanceof ApiError && err.details) {
        const first = Object.values(err.details).flat()[0];
        setError(first || err.message);
      } else {
        setError(err.message || 'Unable to re-evaluate readiness assessment.');
      }
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-[900px] mx-auto text-center py-16">
        <div className="inline-block w-8 h-8 border-2 border-[#C67A4E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading readiness assessment from server...</p>
      </div>
    );
  }

  if (error && !business) return <div className="p-6" role="alert">{error}</div>;
  if (!selectedId && choices.length > 0) return (
    <div className="p-6 space-y-4">
      <h1>Select a business for readiness</h1>
      {choices.map(choice => <Button key={choice.id} onClick={() => setSearchParams({ businessId: String(choice.id) })}>{choice.name}</Button>)}
      <div className="flex gap-3">
        <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous businesses</Button>
        <span>Page {page} of {lastPage}</span>
        <Button disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Next businesses</Button>
      </div>
    </div>
  );

  if (!business) {
    return (
      <div className="p-6 max-w-[900px] mx-auto">
        <div className="rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B] p-8 text-center">
          <p className="text-[16px] font-semibold text-[color:var(--vv-text)] mb-2 font-display">No Business Profile Registered</p>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] max-w-md mx-auto mb-6">
            Register your business profile to generate an automated, rule-based readiness assessment.
          </p>
          <Button onClick={() => navigate('/app/founder/businesses/new')}>
            Register Business
          </Button>
        </div>
      </div>
    );
  }

  const rawOverall = assessment?.overall_score ? parseFloat(String(assessment.overall_score)) : 0;
  const overallScore = Math.round(rawOverall);
  const band = overallScore >= 80 ? 'Investor-Ready' : overallScore >= 60 ? 'Developing' : 'Early Stage';
  const bandColor = overallScore >= 80 ? '#22C55E' : overallScore >= 60 ? '#F59E0B' : '#F04438';

  const r = 60;
  const circ = 2 * Math.PI * r;

  const factorResults = assessment?.factor_results ? Object.entries(assessment.factor_results).map(([key, val]: [string, any]) => ({
    key,
    name: val.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    weight: val.weight ? Math.round(parseFloat(String(val.weight))) : 12,
    score: Math.round(parseFloat(String(val.score || 0))),
    isWeak: Boolean(val.is_weak),
    isIncomplete: Boolean(val.is_incomplete),
    suggestions: val.suggestions || [],
    reasons: val.reason_codes || [],
  })) : [];

  const weakFactors = factorResults.filter(f => f.isWeak);
  const suggestions = assessment?.suggestions || [];

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[color:var(--vv-text)]">Readiness Score</h1>
            <Badge variant="neutral">Rule-based assessment</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-0.5">
            {business.name} • {assessment?.evaluated_at ? `Version ${assessment.version} evaluated on ${new Date(assessment.evaluated_at).toLocaleDateString()}` : 'Awaiting initial assessment evaluation'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleRecalculate} disabled={recalculating}>
            {recalculating ? 'Evaluating...' : 'Recalculate Assessment'}
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400">
          <IconAlertTriangle s={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Weak area alert */}
      {weakFactors.length > 0 && (
        <div className="mb-6 p-4 bg-amber-500/6 border border-amber-400/20 rounded-xl flex items-start gap-3">
          <IconAlertTriangle s={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">
              {weakFactors.length} factor{weakFactors.length > 1 ? 's' : ''} require attention
            </p>
            <p className="text-[12px] text-[color:var(--vv-text-secondary)]">
              {weakFactors.map(f => f.name).join(', ')} currently have low scores or missing inputs. Addressing these will raise your readiness tier.
            </p>
          </div>
        </div>
      )}

      {/* Incomplete inputs alert */}
      {assessment?.is_incomplete && (
        <div className="mb-6 p-3.5 bg-[#F59E0B]/6 border border-[#F59E0B]/20 rounded-xl">
          <p className="text-[12px] font-medium text-[color:var(--vv-text)] mb-0.5">Some readiness inputs are incomplete</p>
          <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">
            The assessment is calculated using existing data. Complete the missing readiness inputs to achieve full assessment accuracy.
          </p>
        </div>
      )}

      {/* Top 3 summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Gauge */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-6 flex flex-col items-center">
          <svg width="144" height="144" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r={r} fill="none" stroke="#1e2e45" strokeWidth="8" />
            <circle cx="72" cy="72" r={r} fill="none" stroke="#C67A4E" strokeWidth="8"
              strokeDasharray={`${(overallScore / 100) * circ} ${circ - (overallScore / 100) * circ}`}
              strokeLinecap="round" transform="rotate(-90 72 72)" />
            <text x="72" y="67" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'IBM Plex Mono', fontSize: '30px', fontWeight: 600, fill: '#C67A4E' }}>
              {overallScore}
            </text>
            <text x="72" y="88" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'Inter', fontSize: '11px', fill: '#5E6D8F' }}>/ 100</text>
          </svg>
          <p className="font-display text-lg font-semibold mt-2" style={{ color: bandColor }}>{band}</p>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-1">Overall Readiness Score</p>
          <div className="mt-3 p-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-lg text-center w-full">
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">
              Evaluated across <span className="text-[color:var(--vv-text)]">{factorResults.length || 8} weighted factors</span>
            </p>
          </div>
        </div>

        {/* Score history */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-5">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <IconTrendingUp s={14} className="text-[#22C55E]" /> Assessment History
          </p>
          {history.length > 0 ? (
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {history.slice(0, 5).map((h, i) => {
                const s = Math.round(parseFloat(String(h.overall_score || 0)));
                const dateStr = h.created_at ? new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `v${h.version}`;
                return (
                  <div key={h.id || i} className="flex items-center gap-3">
                    <span className="text-[11px] text-[color:var(--vv-text-tertiary)] w-16 flex-shrink-0">
                      v{h.version} ({dateStr})
                    </span>
                    <div className="flex-1 h-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C67A4E] rounded-full transition-all" style={{ width: `${s}%` }} />
                    </div>
                    <span className="font-mono text-[12px] text-[#C67A4E] tabular-nums w-8 text-right">{s}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-[12px] text-[color:var(--vv-text-tertiary)]">
              No historical versions recorded yet.
            </div>
          )}
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-4">
            New immutable versions are generated when profile or financial parameters change.
          </p>
        </div>

        {/* Quick stats */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-5 space-y-3">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">Assessment Summary</p>
          <div className="flex items-center justify-between py-2 border-b border-[color:var(--vv-border)]">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">Passing Factors</span>
            <span className="font-mono text-[12px] font-semibold text-[#22C55E] tabular-nums">
              {factorResults.filter(f => !f.isWeak).length} / {factorResults.length || 8}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[color:var(--vv-border)]">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">Factors Needing Work</span>
            <span className="font-mono text-[12px] font-semibold text-[#F04438] tabular-nums">
              {weakFactors.length} / {factorResults.length || 8}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[color:var(--vv-border)]">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">Assessment Status</span>
            <span className="text-[12px] font-semibold text-[color:var(--vv-text)]">
              {assessment?.is_incomplete ? 'Incomplete Inputs' : 'Complete'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">Rubric Version</span>
            <span className="font-mono text-[12px] text-[color:var(--vv-text-secondary)]">
              {assessment?.rubric_version || 'v1.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[color:var(--vv-border)] flex items-center justify-between">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold">
            Factor Breakdown
          </p>
          <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">Click a factor to view details</span>
        </div>
        <div className="divide-y divide-[#24304A]">
          {factorResults.map(f => (
            <div
              key={f.key}
              onClick={() => setExpandedFactor(expandedFactor === f.key ? null : f.key)}
              className={`px-5 py-4 cursor-pointer hover:bg-white/2 transition-colors ${f.isWeak ? 'border-l-2 border-amber-400' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-medium text-[color:var(--vv-text)]">{f.name}</span>
                    {f.isWeak && <Badge variant="warning">Needs Attention</Badge>}
                    {f.isIncomplete && <Badge variant="warning">Incomplete</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden max-w-[240px]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${f.score}%`, backgroundColor: f.score >= 70 ? '#C67A4E' : f.score >= 50 ? '#F59E0B' : '#F04438' }}
                      />
                    </div>
                    <span className="font-mono text-[12px] tabular-nums" style={{ color: f.score >= 70 ? '#C67A4E' : f.score >= 50 ? '#F59E0B' : '#F04438' }}>
                      {f.score}/100
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{f.weight}% weight</p>
                </div>
              </div>
              {expandedFactor === f.key && (
                <div className="mt-3 p-3.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-lg text-[12px] space-y-2">
                  {f.suggestions.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-semibold text-[color:var(--vv-text-secondary)] mb-1">Backend Suggestions:</p>
                      <ul className="list-disc list-inside space-y-1 text-[color:var(--vv-text-tertiary)]">
                        {f.suggestions.map((s: any, idx: number) => (
                          <li key={idx}>{s.text || s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-[color:var(--vv-text-secondary)]">This factor meets or exceeds the platform threshold requirements.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Backend Improvement Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-[14px] font-semibold text-[color:var(--vv-text)] mb-3 font-display">Targeted Improvement Suggestions</p>
          <div className="space-y-3">
            {suggestions.map((s: any, i: number) => (
              <div key={i} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-xl p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconAlertTriangle s={15} className="text-[#F59E0B]" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">
                    {s.factor ? s.factor.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Action Item'}
                  </p>
                  <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-snug">{s.text}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/app/founder/businesses/${business.id}`)} iconRight={<IconArrowRight s={12} />}>
                  Update Profile
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basis disclaimer */}
      <div className="p-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B]/60 text-[11px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
        {assessment?.basis || 'Rule-based assessment using founder-reported inputs; not independent verification, investment advice, or a prediction of returns.'}
      </div>
    </div>
  );
}