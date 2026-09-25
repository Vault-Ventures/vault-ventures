import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { AnalysisMeta, BusinessAnalysisRecord } from '../../services/api';
import { Button } from '../ui/Button';

export const ANALYSIS_DISCLOSURE = 'AI-assisted analysis based on the business information provided. Use these insights as guidance, not as a platform decision or investment guarantee.';

const sections = ['strengths', 'weaknesses', 'opportunities', 'risks', 'recommendations'] as const;
const titles = { strengths: 'Strengths', weaknesses: 'Weaknesses', opportunities: 'Opportunities', risks: 'Risks', recommendations: 'Recommendations' };

function failureMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number };
  if (status === 401) return 'Please sign in again to access your business analysis.';
  if (status === 403 || status === 404) return 'You do not have access to analysis for this business.';
  if (status === 419) return 'Your session has expired. Refresh the page and try again.';
  if (code === 'ANALYSIS_DISABLED' || code === 'ANALYSIS_NOT_CONFIGURED') return 'AI analysis is currently unavailable. Provider configuration is required.';
  if (code === 'ANALYSIS_TIMEOUT') return 'Analysis timed out. Please try again later.';
  if (code === 'ANALYSIS_RATE_LIMIT' || code === 'ANALYSIS_PROVIDER_RATE_LIMIT' || status === 429) return 'The analysis request limit has been reached. Please try again later.';
  if (code === 'GENERATION_IN_PROGRESS') return 'Analysis is already processing. Wait a moment, then refresh the analysis.';
  if (code === 'SOURCE_CHANGED') return 'Business information changed during generation. Refresh the analysis and try again.';
  if (code === 'INVALID_ANALYSIS_OUTPUT') return 'AI returned an invalid analysis. Nothing was saved. Please try again later.';
  if (status === 422) return 'This business is not ready for analysis. Check its submission and current readiness assessment, then refresh.';
  return 'Analysis is temporarily unavailable. Please try again later.';
}

// The keyed child resets immediately on a business change and ignores late responses.
export default function BusinessAnalysisPanel({ businessId }: { businessId: number | string }) {
  return <AnalysisForBusiness key={String(businessId)} businessId={businessId} />;
}

function AnalysisForBusiness({ businessId }: { businessId: number | string }) {
  const [record, setRecord] = useState<BusinessAnalysisRecord | null>(null);
  const [meta, setMeta] = useState<AnalysisMeta | null>(null);
  const [history, setHistory] = useState<BusinessAnalysisRecord[]>([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(false);
  const busy = useRef(false);
  const historyBusy = useRef(false);
  const requestId = useRef(0);

  function acceptRecord(next: BusinessAnalysisRecord | null) {
    if (next && String(next.business_id) !== String(businessId)) throw new Error('Business mismatch');
    setRecord(next);
  }

  async function refresh() {
    if (busy.current || historyBusy.current) return;
    const request = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await api.businessAnalysis.latest(businessId);
      if (!alive.current || request !== requestId.current) return;
      acceptRecord(response.data);
      setMeta(response.meta);
    } catch (e) {
      if (alive.current && request === requestId.current) {
        setError(failureMessage(e));
        const status = (e as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) { setRecord(null); setHistory([]); setMeta(null); }
      }
    } finally {
      if (alive.current && request === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => { alive.current = false; requestId.current++; };
  }, [businessId]);

  async function generate() {
    if (busy.current || historyBusy.current || !meta?.generation_enabled || !meta.eligible) return;
    busy.current = true;
    setProcessing(true);
    setError(null);
    ++requestId.current;
    try {
      const response = await api.businessAnalysis.generate(businessId);
      if (!alive.current) return;
      acceptRecord(response.data);
      setMeta(response.meta);
      setHistory([]); setPage(0); setHistoryOpen(false);
    } catch (e) {
      if (alive.current) {
        setError(failureMessage(e));
        const status = (e as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) { setRecord(null); setHistory([]); setMeta(null); }
      }
    } finally {
      busy.current = false;
      if (alive.current) setProcessing(false);
    }
  }

  async function loadHistory(nextPage = 1) {
    if (historyBusy.current || busy.current) return;
    historyBusy.current = true;
    setHistoryLoading(true);
    setError(null);
    try {
      const response = await api.businessAnalysis.history(businessId, nextPage);
      if (!alive.current) return;
      if (response.data.some(item => String(item.business_id) !== String(businessId))) throw new Error('Business mismatch');
      setHistory(old => nextPage === 1 ? response.data : [...old, ...response.data]);
      setPage(nextPage); setLastPage(response.meta.pagination?.last_page ?? 1); setHistoryOpen(true);
    } catch (e) {
      if (alive.current) {
        setError(failureMessage(e));
        const status = (e as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) { setRecord(null); setHistory([]); setMeta(null); setHistoryOpen(false); }
      }
    } finally {
      historyBusy.current = false;
      if (alive.current) setHistoryLoading(false);
    }
  }

  const unavailable = meta && !meta.generation_enabled;
  const current = meta?.current_version != null;
  const card = 'rounded-xl border border-[color:var(--vv-border)] bg-[color:var(--vv-surface)] p-5';

  return <section aria-label="Business AI analysis" className="space-y-4">
    <div className={card}>
      <p className="text-xs font-semibold text-[#C67A4E]">AI-assisted analysis</p>
      <h2 className="font-display text-lg font-semibold mt-1">Business Analysis</h2>
      <p className="text-sm text-[color:var(--vv-text-secondary)] mt-2">{ANALYSIS_DISCLOSURE}</p>
      <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-2">This is not verification, a platform score, or investment advice. Funding on Vault Ventures is simulated and non-custodial.</p>
      {loading && <p role="status" className="mt-4">Loading analysis...</p>}
      {processing && <p role="status" className="mt-4">Processing AI analysis. This may take a moment.</p>}
      {unavailable && <p role="status" className="mt-4">AI analysis is currently unavailable. Provider configuration is required. Saved analyses remain available.</p>}
      {meta && !meta.eligible && <div className="mt-4 text-sm">
        {meta.eligibility_reasons.includes('BUSINESS_NOT_SUBMITTED') ? <p>Submit this business before generating analysis.</p> : <p>Save readiness inputs and ensure a current readiness assessment exists before generating analysis.</p>}
        <Link className="underline text-[#C67A4E]" to={`/app/founder/readiness?businessId=${businessId}`}>View readiness assessment</Link>
      </div>}
      {!loading && meta && !record && <p className="mt-4 text-sm">No AI analysis generated yet.</p>}
      {current && <p className="mt-4 text-sm">An analysis already exists for the current information. Update business information to generate a new version.</p>}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button onClick={generate} loading={processing} disabled={loading || historyLoading || !meta?.generation_enabled || !meta.eligible || current}>
          {processing ? 'Generating Analysis...' : record ? 'Generate New Analysis' : 'Generate AI Analysis'}
        </Button>
        <Button variant="secondary" onClick={refresh} disabled={loading || processing || historyLoading}>Refresh Analysis</Button>
        <Button variant="secondary" onClick={() => loadHistory()} disabled={loading || processing || historyLoading || !meta}>View History</Button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
    {historyLoading && <p role="status">Loading history...</p>}
    {historyOpen && <div className={card}>
      <h3 className="font-semibold">Analysis History</h3>
      <p className="text-sm mt-1">Successful versions are preserved. Unchanged requests reuse the existing analysis.</p>
      <div className="flex flex-wrap gap-2 mt-3">{history.map(item => <Button key={item.id} variant={record?.id === item.id ? 'primary' : 'secondary'} onClick={() => { setRecord(item); setError(null); }} disabled={processing}>
        Version {item.version}{item.version === meta?.current_version ? ' · Current' : ''}
      </Button>)}</div>
      {history.length === 0 && <p className="mt-2 text-sm">No saved versions.</p>}
      {page < lastPage && <Button variant="secondary" className="mt-3" onClick={() => loadHistory(page + 1)} disabled={historyLoading || processing}>Load More History</Button>}
    </div>}
    {record && <article className="space-y-4" aria-label={`Analysis version ${record.version}`}>
      <div className="text-xs text-[color:var(--vv-text-secondary)]">
        <p>Completed · Version {record.version} · Generated {new Date(record.generated_at).toLocaleString('en-GB')}</p>
        <p>{record.provider_identifier}{record.model_identifier ? ` · ${record.model_identifier}` : ''}</p>
        {!record.freshness.is_current && <p className="mt-1">Historical analysis — it may not reflect the current business information.</p>}
        {record.test_fixture && <p role="status">Automated test fixture. No live AI analysis.</p>}
      </div>
      {record.analysis ? <>
        <section className={card}><h3 className="font-semibold">Executive Summary</h3><p className="text-sm mt-3 whitespace-pre-wrap break-words">{record.analysis.summary}</p></section>
        <div className="grid gap-4 md:grid-cols-2">{sections.map(field => <section key={field} className={card}>
          <h3 className="font-semibold">{titles[field]}</h3>
          {record.analysis![field].length ? <ul className="list-disc pl-5 space-y-2 mt-3 text-sm break-words">{record.analysis![field].map((text, index) => <li key={index} className="whitespace-pre-wrap">{text}</li>)}</ul> : <p className="text-sm mt-3 text-[color:var(--vv-text-secondary)]">None identified from the supplied information.</p>}
        </section>)}</div>
      </> : <section className={card}>
        <h3 className="font-semibold">Legacy Reference Analysis</h3>
        <p className="text-sm mt-2">This saved version predates the six-section advisory analysis.</p>
        {record.rendered_output?.business_summary?.map(item => <p key={item.source_ref} className="text-sm mt-2 break-words">{item.source_ref}: {item.value}</p>)}
        {record.rendered_output?.review_points?.map((item, index) => <p key={index} className="text-sm mt-2">{item.factor_key}: {item.label}</p>)}
        {record.rendered_output?.recommended_actions?.map(item => <p key={item.id} className="text-sm mt-2">{item.text ?? item.message}</p>)}
      </section>}
    </article>}
  </section>;
}
