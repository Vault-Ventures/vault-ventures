import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';

// --- Design tokens (matching Analytics.tsx) ------------------------------------
const C1 = '#C67A4E';
const C2 = '#C9A24B';
const C3 = '#8B5CF6';
const C4 = '#22C55E';
const C_WARN = '#F59E0B';
const GRID = '#1C2A3E';
const SURFACE = '#121A2B';
const T_PRIMARY = '#EAF0FA';
const T_MUTED = '#5E6D8F';
const T_SEC = '#93A1BF';

// --- SVG helpers ---------------------------------------------------------------

function toLine(vals: number[], W: number, H: number, pL = 0, pR = 0, pT = 8, pB = 24): string {
  const min = Math.min(...vals), max = Math.max(...vals);
  const rng = max - min || 1;
  const xStep = (W - pL - pR) / Math.max(vals.length - 1, 1);
  return vals.map((v, i) => {
    const x = pL + i * xStep;
    const y = pT + ((max - v) / rng) * (H - pT - pB);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function toArea(vals: number[], W: number, H: number, pL = 0, pR = 0, pT = 8, pB = 24): string {
  const line = toLine(vals, W, H, pL, pR, pT, pB);
  const lastX = pL + (vals.length - 1) * ((W - pL - pR) / Math.max(vals.length - 1, 1));
  return `${line} L${lastX.toFixed(1)},${H - pB} L${pL},${H - pB} Z`;
}

function seed(base: number, len: number, trend: number, noise: number) {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v = Math.max(0, v + trend + (Math.random() - 0.5) * noise);
    out.push(Math.round(v));
  }
  return out;
}

// --- Static demo data ----------------------------------------------------------

const READINESS_DIST = [
  { range: '0-20',  count: 12,  color: '#EF4444' },
  { range: '21-40', count: 38,  color: '#F59E0B' },
  { range: '41-60', count: 142, color: '#C67A4E' },
  { range: '61-80', count: 198, color: C1 },
  { range: '81-100',count: 87,  color: C4 },
];

const MATCH_DIST = [
  { range: '<40',   count: 24,  color: '#EF4444' },
  { range: '40-60', count: 118, color: '#F59E0B' },
  { range: '61-75', count: 203, color: C2 },
  { range: '76-90', count: 167, color: C1 },
  { range: '>90',   count: 64,  color: C4 },
];

const DEAL_STAGES = [
  { label: 'Interest Confirmed', count: 87,  color: C1 },
  { label: 'Deal Room',          count: 64,  color: C3 },
  { label: 'NDA Signed',         count: 41,  color: C2 },
  { label: 'Negotiation',        count: 29,  color: C1 },
  { label: 'Agreement',          count: 18,  color: C4 },
  { label: 'Milestones',         count: 12,  color: C4 },
  { label: 'Completed',          count: 31,  color: C4 },
];

const TREND_WEEKS = 12;
const readinessTrend = seed(61, TREND_WEEKS, 0.4, 3);
const matchTrend = seed(68, TREND_WEEKS, 0.6, 4);
const dealCompletionTrend = seed(4, TREND_WEEKS, 0.15, 1.5);

const PLATFORM_STATS = [
  { label: 'Total Users',       value: '3,841', delta: '+12%', up: true },
  { label: 'Active Users',      value: '1,204', delta: '+8%',  up: true },
  { label: 'Verified Users',    value: '2,197', delta: '+5%',  up: true },
  { label: 'Businesses',        value: '748',   delta: '+11%', up: true },
  { label: 'Applications',      value: '1,923', delta: '+18%', up: true },
  { label: 'Active Deals',      value: '142',   delta: '+6%',  up: true },
  { label: 'Completed Deals',   value: '31',    delta: '+29%', up: true },
  { label: 'Avg Readiness',     value: '66.4',  delta: '+2.1', up: true },
  { label: 'Avg Match Score',   value: '74.2',  delta: '+1.8', up: true },
];

const COMMISSION_DATA = [
  { month: 'Mar', amount: 128000 },
  { month: 'Apr', amount: 184000 },
  { month: 'May', amount: 211000 },
  { month: 'Jun', amount: 175000 },
  { month: 'Jul', amount: 263000 },
  { month: 'Aug', amount: 308000 },
];

// --- Components ----------------------------------------------------------------

function StatCard({ label, value, delta, up }: { label: string; value: string; delta: string; up: boolean }) {
  return (
    <div className="rounded-[10px] border border-[color:var(--vv-border)] px-4 py-3.5" style={{ background: SURFACE }}>
      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-1 uppercase tracking-widest font-semibold">{label}</p>
      <p className="font-display text-[20px] font-bold text-[color:var(--vv-text)]">{value}</p>
      <p className={`text-[10.5px] mt-0.5 font-mono ${up ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{delta} vs prev period</p>
    </div>
  );
}

function BarChart({ data, color, W = 320, H = 80 }: { data: { range: string; count: number }[]; color?: string; W?: number; H?: number }) {
  const max = Math.max(...data.map(d => d.count));
  const bw = (W - 20) / data.length - 4;
  const colors = (data as any)[0]?.color ? data.map((d: any) => d.color) : data.map(() => color ?? C1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', height: 'auto' }}>
      {data.map((d, i) => {
        const x = 10 + i * ((W - 20) / data.length);
        const barH = ((d.count / max) * (H - 10));
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x + 2} y={y} width={bw} height={barH} rx={3} fill={(data[i] as any).color ?? color ?? C1} opacity={0.85} />
            <text x={x + bw / 2 + 2} y={H + 16} textAnchor="middle" fill={T_MUTED} fontSize={9}>{d.range}</text>
            <text x={x + bw / 2 + 2} y={y - 3} textAnchor="middle" fill={T_SEC} fontSize={9}>{d.count}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ values, color, label, W = 320, H = 80 }: { values: number[]; color: string; label?: string; W?: number; H?: number }) {
  const linePath = toLine(values, W, H, 8, 8);
  const areaPath = toArea(values, W, H, 8, 8);
  const min = Math.min(...values), max = Math.max(...values);
  const xStep = (W - 16) / Math.max(values.length - 1, 1);
  const lastV = values[values.length - 1];
  const lastX = 8 + (values.length - 1) * xStep;
  const lastY = 8 + ((max - lastV) / (max - min || 1)) * (H - 32);
  return (
    <svg viewBox={`0 0 ${W} ${H + 8}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={`ag-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={8} y1={8 + f * (H - 32)} x2={W - 8} y2={8 + f * (H - 32)} stroke={GRID} strokeWidth={1} />
      ))}
      <path d={areaPath} fill={`url(#ag-${color.replace('#','')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3} fill={color} />
      {label && <text x={lastX + 6} y={lastY + 4} fill={color} fontSize={9}>{label}</text>}
    </svg>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-4">{children}</p>;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: SURFACE }}>
      <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
        <p className="text-[12.5px] font-semibold" style={{ color: T_PRIMARY }}>{title}</p>
        {subtitle && <p className="text-[10.5px] mt-0.5" style={{ color: T_MUTED }}>{subtitle}</p>}
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

// --- Filter bar ----------------------------------------------------------------

function FilterBar({ period, onPeriod }: { period: string; onPeriod: (p: string) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-[9px] border border-[color:var(--vv-border)] w-fit mb-5" style={{ background: 'rgba(13,22,38,0.8)' }}>
      {['30d', '90d', 'Year', 'All'].map(p => (
        <button key={p} onClick={() => onPeriod(p)}
          className="px-3 py-1 rounded-[7px] text-[11px] font-medium transition-all"
          style={period === p ? { background: 'rgba(198,122,78,0.1)', color: C1, border: `1px solid rgba(198,122,78,0.22)` } : { color: T_MUTED, border: '1px solid transparent' }}>
          {p}
        </button>
      ))}
    </div>
  );
}

// --- Main ----------------------------------------------------------------------

export default function AdminAdvancedAnalytics() {
  const [period, setPeriod] = useState('30d');

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Advanced Analytics</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Readiness, match, deal, and platform performance - demo data.</p>
        </div>
        <Badge variant="warning">Demo Data - not real metrics</Badge>
      </div>

      <FilterBar period={period} onPeriod={setPeriod} />

      {/* -- Platform Stats -- */}
      <section>
        <SectionTitle>Platform Overview</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {PLATFORM_STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* -- Readiness Analytics -- */}
      <section>
        <SectionTitle>Readiness Score Analytics</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          <ChartCard title="Score Distribution" subtitle="Businesses by readiness range">
            <BarChart data={READINESS_DIST} W={300} H={80} />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Avg Readiness Score</p>
              <span className="text-[14px] font-bold font-mono" style={{ color: C1 }}>66.4</span>
            </div>
          </ChartCard>

          <ChartCard title="Readiness Trend" subtitle={`12-week rolling average (demo)`}>
            <LineChart values={readinessTrend} color={C1} W={300} H={80} />
            <div className="flex justify-between mt-1">
              <p className="text-[10px]" style={{ color: T_MUTED }}>12 weeks ago</p>
              <p className="text-[10px]" style={{ color: T_MUTED }}>Now</p>
            </div>
          </ChartCard>

          <ChartCard title="Readiness Bands" subtitle="Count of businesses per band">
            <div className="space-y-2.5 mt-1">
              {READINESS_DIST.map(d => (
                <div key={d.range} className="flex items-center gap-3">
                  <p className="text-[11px] w-12 shrink-0" style={{ color: T_SEC }}>{d.range}</p>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,48,74,0.8)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(d.count / 198) * 100}%`, background: d.color }} />
                  </div>
                  <p className="text-[11px] w-8 text-right font-mono" style={{ color: T_SEC }}>{d.count}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </section>

      {/* -- Match Score Analytics -- */}
      <section>
        <SectionTitle>Match Score Analytics</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          <ChartCard title="Score Distribution" subtitle="Matches by score range">
            <BarChart data={MATCH_DIST} W={300} H={80} />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10.5px]" style={{ color: T_MUTED }}>Strong matches (&gt;75)</p>
              <span className="text-[13px] font-bold font-mono" style={{ color: C4 }}>
                {Math.round(((167 + 64) / (24+118+203+167+64)) * 100)}%
              </span>
            </div>
          </ChartCard>

          <ChartCard title="Match Score Trend" subtitle="Average score, 12-week (demo)">
            <LineChart values={matchTrend} color={C2} W={300} H={80} />
            <div className="flex justify-between mt-1">
              <p className="text-[10px]" style={{ color: T_MUTED }}>12 weeks ago</p>
              <p className="text-[10px]" style={{ color: T_MUTED }}>Now</p>
            </div>
          </ChartCard>

          <ChartCard title="Key Match Metrics" subtitle="Current period">
            <div className="space-y-3">
              {[
                { label: 'Avg Match Score', value: '74.2', color: C1 },
                { label: 'Strong Matches (>75)', value: '32.4%', color: C4 },
                { label: 'Weak Matches (<50)', value: '18.1%', color: C_WARN },
                { label: 'Total Matches Run', value: '14,832', color: T_SEC },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
                  <p className="text-[11.5px]" style={{ color: T_MUTED }}>{r.label}</p>
                  <p className="text-[13px] font-bold font-mono" style={{ color: r.color }}>{r.value}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </section>

      {/* -- Deal Analytics -- */}
      <section>
        <SectionTitle>Deal Analytics</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          <ChartCard title="Deals by Stage" subtitle="Current active funnel">
            <div className="space-y-2.5 mt-1">
              {DEAL_STAGES.map(d => (
                <div key={d.label} className="flex items-center gap-3">
                  <p className="text-[10.5px] w-28 shrink-0 truncate" style={{ color: T_SEC }}>{d.label}</p>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,48,74,0.8)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(d.count / 87) * 100}%`, background: d.color }} />
                  </div>
                  <p className="text-[11px] w-6 text-right font-mono" style={{ color: T_SEC }}>{d.count}</p>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Deal Completion Trend" subtitle="Completed deals / week (demo)">
            <LineChart values={dealCompletionTrend} color={C4} W={300} H={80} />
            <div className="flex justify-between mt-1">
              <p className="text-[10px]" style={{ color: T_MUTED }}>12 weeks ago</p>
              <p className="text-[10px]" style={{ color: T_MUTED }}>Now</p>
            </div>
          </ChartCard>

          <ChartCard title="Deal Summary" subtitle="All-time metrics">
            <div className="space-y-3">
              {[
                { label: 'Total Deals Opened',    value: '282',   color: C1 },
                { label: 'Active Deals',           value: '142',   color: C_WARN },
                { label: 'Completed Deals',        value: '31',    color: C4 },
                { label: 'Avg. Deal Duration',     value: '64 days', color: T_SEC },
                { label: 'NDA Completion Rate',    value: '78.4%', color: C1 },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0">
                  <p className="text-[11.5px]" style={{ color: T_MUTED }}>{r.label}</p>
                  <p className="text-[13px] font-bold font-mono" style={{ color: r.color }}>{r.value}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </section>

      {/* -- Simulated Commission -- */}
      <section>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <SectionTitle>Simulated Commission Revenue</SectionTitle>
          <Badge variant="warning">Simulated - no real transactions</Badge>
        </div>

        <div className="flex items-start gap-3 px-4 py-3 rounded-[10px] mb-4"
          style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.18)' }}>
          <svg width="13" height="13" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          <p className="text-[11.5px]" style={{ color: '#C67A4E' }}>
            <strong>Prototype data only.</strong> These figures are simulated for demonstration purposes. No real financial transactions have occurred. Currency shown in BDT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Monthly Simulated Commission (BDT)" subtitle="6-month demo trend">
            <div className="space-y-2.5">
              {COMMISSION_DATA.map((d, i) => {
                const max = Math.max(...COMMISSION_DATA.map(x => x.amount));
                return (
                  <div key={d.month} className="flex items-center gap-3">
                    <p className="text-[11px] w-8 shrink-0" style={{ color: T_SEC }}>{d.month}</p>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(36,48,74,0.8)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${(d.amount / max) * 100}%`,
                        background: `linear-gradient(90deg, ${C1}, #C67A4E)`,
                      }} />
                    </div>
                    <p className="text-[11px] w-24 text-right font-mono" style={{ color: T_SEC }}>
                      ?{(d.amount / 100000).toFixed(1)}L
                    </p>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Simulated Revenue Summary" subtitle="6-month demo totals">
            <div className="space-y-3">
              {[
                { label: 'Total Simulated Revenue', value: 'BDT 12.69L',  color: C2, highlight: true },
                { label: 'Avg Monthly (Simulated)',  value: 'BDT 2.12L',   color: C1 },
                { label: 'Best Month (Simulated)',   value: 'BDT 3.08L (Aug)', color: C4 },
                { label: 'Growth (Simulated)',       value: '+140.6%',   color: C4 },
                { label: 'Source',                   value: 'Deal commissions', color: T_SEC },
              ].map(r => (
                <div key={r.label} className={`flex items-center justify-between py-2 border-b border-[#1c2a3e] last:border-0 ${r.highlight ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_30%,transparent)] -mx-4 px-4' : ''}`}>
                  <p className="text-[11.5px]" style={{ color: T_MUTED }}>{r.label}</p>
                  <p className={`font-mono ${r.highlight ? 'text-[14px] font-bold' : 'text-[12px] font-semibold'}`} style={{ color: r.color }}>{r.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3" style={{ color: '#35446A' }}>? All values are simulated. Not real revenue.</p>
          </ChartCard>
        </div>
      </section>

    </div>
  );
}