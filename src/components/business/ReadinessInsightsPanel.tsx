import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../services/api';
import type { AnalysisMeta, ReadinessInsightRecord } from '../../services/api';
import { Button } from '../ui/Button';

export const READINESS_DISCLOSURE = 'These AI-assisted insights explain your existing Vault Ventures Readiness Score and suggest areas for improvement. They do not change your score or guarantee investment, approval, or funding.';
const sections = { strengths: 'Strong Areas', weaknesses: 'Improvement Areas', opportunities: 'Opportunities', risks: 'Risk Notes', recommendations: 'Priority Actions' } as const;

export default function ReadinessInsightsPanel({ businessId }: { businessId: number }) {
  // A keyed session also discards pending responses when the selected business changes.
  return <InsightSession key={businessId} businessId={businessId} />;
}

function InsightSession({ businessId }: { businessId: number }) {
  const [record, setRecord] = useState<ReadinessInsightRecord | null>(null);
  const [meta, setMeta] = useState<AnalysisMeta | null>(null);
  const [history, setHistory] = useState<ReadinessInsightRecord[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(true);
  const pending = useRef(false);

  function fail(err: unknown) {
    if (!active.current) return;
    if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
      setRecord(null); setHistory(null); setMeta(null);
    }
    setError('Readiness insights could not be loaded or generated. Please try again. Your deterministic score is unchanged.');
  }

  async function refresh() {
    setLoading(true); setError(null);
    try {
      const result = await api.readinessInsights.latest(businessId);
      if (active.current) { setRecord(result.data); setMeta(result.meta); setHistory(null); }
    } catch (err) { fail(err); }
    finally { if (active.current) setLoading(false); }
  }

  useEffect(() => {
    active.current = true;
    refresh();
    return () => { active.current = false; };
  }, [businessId]);

  async function generate() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null);
    try {
      const result = await api.readinessInsights.generate(businessId);
      if (active.current) { setRecord(result.data); setMeta(result.meta); setHistory(null); }
    } catch (err) { fail(err); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  }

  async function loadHistory() {
    setError(null);
    try {
      const result = await api.readinessInsights.history(businessId);
      if (active.current) { setHistory(result.data); setMeta(result.meta); }
    } catch (err) { fail(err); }
  }

  return <section aria-label="AI-Assisted Readiness Insights" className="my-6 space-y-4 rounded-xl border border-[color:var(--vv-border)] bg-[#121A2B] p-5">
    <h2 className="font-display text-lg font-semibold">AI-Assisted Readiness Insights</h2>
    <p className="text-sm text-[color:var(--vv-text-secondary)]">{READINESS_DISCLOSURE}</p>
    {loading && <p role="status">Loading readiness insights...</p>}
    {error && <p role="alert">{error}</p>}
    {meta && !meta.generation_enabled && <p role="status">AI readiness insights are unavailable. Provider configuration is required before generation.</p>}
    {meta?.eligibility_reasons.includes('ASSESSMENT_MISSING') && <p>Create a readiness assessment before generating insights.</p>}
    {meta?.eligibility_reasons.includes('ASSESSMENT_STALE') && <p>Recalculate your readiness assessment before updating insights.</p>}
    {!loading && !record && meta?.eligible && meta.generation_enabled && <p>Ready to generate insights for your existing assessment.</p>}
    {busy && <p role="status">Generating readiness insights...</p>}
    <div className="flex flex-wrap gap-2">
      <Button onClick={generate} disabled={loading || busy || !meta?.generation_enabled || !meta.eligible || meta.current_version !== null}>
        {busy ? 'Generating...' : record ? 'Update Insights' : 'Generate Insights'}
      </Button>
      <Button variant="secondary" onClick={refresh} disabled={busy || loading}>Refresh Insights</Button>
      <Button variant="secondary" onClick={loadHistory} disabled={busy || loading || !meta}>View Insight History</Button>
    </div>
    {history && <div className="flex flex-wrap gap-2" aria-label="Insight history">
      {history.length === 0 && <p>No saved insights.</p>}
      {history.map(item => <Button key={item.id} variant="secondary" onClick={() => setRecord(item)}>Version {item.version}</Button>)}
    </div>}
    {record && <article className="space-y-4" aria-label={`Readiness insight version ${record.version}`}>
      <p className="text-xs">Version {record.version} · Assessment {record.readiness_assessment_id} · Generated {new Date(record.generated_at).toLocaleString('en-GB')}</p>
      {!record.freshness.is_current && <p role="status">Stale insight: the source information has changed. Generate updated insights after recalculating your assessment if needed.</p>}
      <section><h3 className="font-semibold">Summary</h3><p className="whitespace-pre-wrap break-words text-sm mt-2">{record.summary}</p></section>
      <div className="grid gap-4 md:grid-cols-2">{Object.entries(sections).map(([field, title]) => <section key={field}>
        <h3 className="font-semibold">{title}</h3>
        <ul className="list-disc pl-5 text-sm space-y-2 mt-2">{record[field as keyof typeof sections].map((text, i) => <li className="whitespace-pre-wrap break-words" key={i}>{text}</li>)}</ul>
        {record[field as keyof typeof sections].length === 0 && <p className="text-sm mt-2">None identified from the supplied information.</p>}
      </section>)}</div>
    </article>}
  </section>;
}
