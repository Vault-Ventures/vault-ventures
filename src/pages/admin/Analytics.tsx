import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { IconSearch, IconX, IconFilter, IconFileText, IconChevronDown } from '../../components/layout/Icons';

// --- Design tokens -------------------------------------------------------------
// Categorical series - fixed order, dark-mode validated
const C1 = '#C67A4E'; // copper - primary series
const C2 = '#C9A24B'; // gold - secondary
const C3 = '#8B5CF6'; // purple - tertiary
const C4 = '#22C55E'; // green - quaternary
const C_REJECTED = '#F04438';
const C_WARN = '#F59E0B';
const GRID = '#1C2A3E';
const SURFACE = '#121A2B';
const T_PRIMARY = '#EAF0FA';
const T_MUTED = '#5E6D8F';
const T_SEC = '#93A1BF';

// --- Data generation ----------------------------------------------------------
type Range = '7d' | '30d' | '90d' | 'year';

function genSeries(base: number, len: number, trend: number, noise: number): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v = Math.max(0, v + trend + (Math.random() - 0.5) * noise);
    out.push(Math.round(v));
  }
  return out;
}

function makeData(range: Range) {
  const pts = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 52;
  const label = range === 'year' ? 'wk' : range === '90d' ? '3d' : 'd';
  return {
    pts, label,
    newUsers: genSeries(160, pts, 2.1, 40),
    activeUsers: genSeries(9800, pts, 18, 200),
    newBiz: genSeries(18, pts, 0.3, 6),
    activeBiz: genSeries(740, pts, 3, 20),
    verifiedBiz: genSeries(410, pts, 1.8, 12),
    appsSubmitted: genSeries(90, pts, 1, 20),
    appsAccepted: genSeries(44, pts, 0.6, 12),
    appsRejected: genSeries(22, pts, 0.2, 8),
    newTeams: genSeries(12, pts, 0.15, 4),
    activeTeams: genSeries(310, pts, 1.5, 10),
    openReports: genSeries(8, pts, 0.05, 3),
    resolvedReports: genSeries(6, pts, 0.05, 2),
  };
}

// --- Helpers ------------------------------------------------------------------
function pct(now: number, prev: number) {
  if (!prev) return 0;
  return ((now - prev) / prev) * 100;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'k';
  return String(n);
}

function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }
function last(arr: number[]) { return arr[arr.length - 1] ?? 0; }

// SVG path from values
function toLinePath(values: number[], W: number, H: number, padL = 0, padR = 0, padT = 8, padB = 24): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = (W - padL - padR) / Math.max(values.length - 1, 1);
  return values.map((v, i) => {
    const x = padL + i * xStep;
    const y = padT + ((max - v) / range) * (H - padT - padB);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function toAreaPath(values: number[], W: number, H: number, padL = 0, padR = 0, padT = 8, padB = 24): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = (W - padL - padR) / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => ({
    x: padL + i * xStep,
    y: padT + ((max - v) / range) * (H - padT - padB),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const baseline = H - padB;
  return `${line} L${pts[pts.length - 1].x.toFixed(1)},${baseline} L${pts[0].x.toFixed(1)},${baseline} Z`;
}

// --- Skeleton -----------------------------------------------------------------
function ChartSkeleton({ h = 160 }: { h?: number }) {
  return <div className="animate-pulse rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)]" style={{ height: h }} />;
}

// --- KPI Tile -----------------------------------------------------------------
function KpiTile({ label, value, delta, color = C1 }: { label: string; value: string; delta?: number; color?: string }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3">
      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1 leading-none">{label}</p>
      <p className="font-mono text-[22px] font-semibold tabular-nums leading-none mb-1" style={{ color }}>{value}</p>
      {delta !== undefined && (
        <p className={`text-[10.5px] font-semibold font-mono ${up ? 'text-[#22C55E]' : 'text-[#F04438]'}`}>
          {up ? '?' : '?'} {Math.abs(delta).toFixed(1)}% vs prev period
        </p>
      )}
    </div>
  );
}

// --- Tooltip ------------------------------------------------------------------
function Tooltip({ x, y, lines, W }: { x: number; y: number; lines: { label: string; value: string; color: string }[]; W: number }) {
  const flip = x > W * 0.65;
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={999} stroke={GRID} strokeWidth={1} strokeDasharray="3 2" />
      <foreignObject x={flip ? x - 130 : x + 8} y={Math.max(4, y - 10)} width={120} height={lines.length * 22 + 16}>
        <div className="bg-[#0D1626] border border-[color:var(--vv-border-strong)] rounded-[6px] px-2.5 py-2 shadow-xl pointer-events-none">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
              <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">{l.label}</span>
              <span className="text-[10px] font-mono font-semibold text-[color:var(--vv-text)] ml-auto">{l.value}</span>
            </div>
          ))}
        </div>
      </foreignObject>
    </g>
  );
}

// --- Line Chart ---------------------------------------------------------------
function LineChart({
  title, series, labels, yUnit = '', h = 160,
}: {
  title: string;
  series: { name: string; values: number[]; color: string }[];
  labels?: string[];
  yUnit?: string;
  h?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ xi: number; x: number; y: number } | null>(null);
  const W = 500; const H = h;
  const padL = 36; const padR = 8; const padT = 10; const padB = 22;

  const allVals = series.flatMap(s => s.values);
  const min = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - min || 1;
  const n = series[0]?.values.length ?? 0;
  const xStep = (W - padL - padR) / Math.max(n - 1, 1);

  const xOf = (i: number) => padL + i * xStep;
  const yOf = (v: number) => padT + ((maxV - v) / range) * (H - padT - padB);

  const gridCount = 4;
  const gridVals = Array.from({ length: gridCount + 1 }, (_, i) => min + (range * i) / gridCount);

  // x-axis label indices
  const labelIdxs = n <= 8 ? Array.from({ length: n }, (_, i) => i) :
    [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1];

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    const xi = Math.round((rawX - padL) / xStep);
    if (xi < 0 || xi >= n) { setHover(null); return; }
    const x = xOf(xi);
    const y = yOf(series[0].values[xi]);
    setHover({ xi, x, y });
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-[color:var(--vv-text-secondary)] mb-2">{title}</p>
      {series.length > 1 && (
        <div className="flex items-center gap-3 mb-2">
          {series.map(s => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-[2px] rounded-full" style={{ background: s.color }} />
              <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">{s.name}</span>
            </div>
          ))}
        </div>
      )}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: h }}
        onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {gridVals.map((v, i) => {
          const y = yOf(v);
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={GRID} strokeWidth={0.75} />
              <text x={padL - 4} y={y + 3.5} textAnchor="end" fill={T_MUTED} fontSize={8} fontFamily="monospace">
                {v >= 1000 ? fmt(v) : Math.round(v)}{yUnit}
              </text>
            </g>
          );
        })}
        {/* Area fills */}
        {series.map(s => (
          <path key={s.name + '-area'}
            d={toAreaPath(s.values, W, H, padL, padR, padT, padB)}
            fill={s.color} fillOpacity={0.06} />
        ))}
        {/* Lines */}
        {series.map(s => (
          <path key={s.name}
            d={toLinePath(s.values, W, H, padL, padR, padT, padB)}
            fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* Hover dots */}
        {hover && series.map(s => (
          <circle key={s.name} cx={xOf(hover.xi)} cy={yOf(s.values[hover.xi])} r={4}
            fill={SURFACE} stroke={s.color} strokeWidth={2} />
        ))}
        {/* X labels */}
        {labelIdxs.map(i => (
          <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fill={T_MUTED} fontSize={8} fontFamily="monospace">
            {labels?.[i] ?? i + 1}
          </text>
        ))}
        {/* Baseline */}
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke={GRID} strokeWidth={1} />
        {/* Tooltip */}
        {hover && (
          <Tooltip x={xOf(hover.xi)} y={yOf(series[0].values[hover.xi])} W={W}
            lines={series.map(s => ({ label: s.name, value: fmt(s.values[hover.xi]), color: s.color }))} />
        )}
        {/* Invisible hit area */}
        <rect x={padL} y={0} width={W - padL - padR} height={H} fill="transparent" />
      </svg>
    </div>
  );
}

// --- Bar Chart ----------------------------------------------------------------
function BarChart({
  title, series, labels, h = 150,
}: {
  title: string;
  series: { name: string; values: number[]; color: string }[];
  labels?: string[];
  h?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ xi: number; x: number } | null>(null);
  const W = 500; const H = h;
  const padL = 36; const padR = 8; const padT = 10; const padB = 22;
  const n = series[0]?.values.length ?? 0;
  const allVals = series.flatMap(s => s.values);
  const maxV = Math.max(...allVals, 1);
  const plotW = W - padL - padR;
  const slotW = plotW / n;
  const barW = Math.max(2, (slotW / series.length) - 2);

  const gridCount = 4;
  const gridVals = Array.from({ length: gridCount + 1 }, (_, i) => (maxV * i) / gridCount);
  const yOf = (v: number) => padT + ((maxV - v) / maxV) * (H - padT - padB);
  const labelIdxs = n <= 8 ? Array.from({ length: n }, (_, i) => i) :
    [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1];

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    const xi = Math.floor((rawX - padL) / slotW);
    if (xi < 0 || xi >= n) { setHover(null); return; }
    const x = padL + (xi + 0.5) * slotW;
    setHover({ xi, x });
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-[color:var(--vv-text-secondary)] mb-2">{title}</p>
      {series.length > 1 && (
        <div className="flex items-center gap-3 mb-2">
          {series.map(s => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">{s.name}</span>
            </div>
          ))}
        </div>
      )}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: h }}
        onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)}>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={yOf(v)} y2={yOf(v)} stroke={GRID} strokeWidth={0.75} />
            <text x={padL - 4} y={yOf(v) + 3.5} textAnchor="end" fill={T_MUTED} fontSize={8} fontFamily="monospace">
              {v >= 1000 ? fmt(v) : Math.round(v)}
            </text>
          </g>
        ))}
        {series.map((s, si) => s.values.map((v, xi) => {
          const bH = (H - padB) - yOf(v);
          if (bH <= 0) return null;
          const x = padL + xi * slotW + si * (barW + 2) + (slotW - series.length * (barW + 2) + 2) / 2;
          return (
            <rect key={`${si}-${xi}`} x={x} y={yOf(v)} width={barW} height={bH}
              fill={s.color} fillOpacity={hover?.xi === xi ? 1 : 0.75} rx={2} />
          );
        }))}
        {hover && (
          <g>
            <rect x={padL + hover.xi * slotW} y={padT} width={slotW} height={H - padT - padB}
              fill={T_PRIMARY} fillOpacity={0.03} />
            <Tooltip x={hover.x} y={padT + 10} W={W}
              lines={series.map(s => ({ label: s.name, value: fmt(s.values[hover.xi]), color: s.color }))} />
          </g>
        )}
        {labelIdxs.map(i => (
          <text key={i} x={padL + (i + 0.5) * slotW} y={H - 4} textAnchor="middle" fill={T_MUTED} fontSize={8} fontFamily="monospace">
            {labels?.[i] ?? i + 1}
          </text>
        ))}
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke={GRID} strokeWidth={1} />
        <rect x={padL} y={0} width={W - padL - padR} height={H} fill="transparent" />
      </svg>
    </div>
  );
}

// --- Donut Chart --------------------------------------------------------------
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const R = 52; const r = 30; const cx = 70; const cy = 70;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let angle = -Math.PI / 2;
  const slices = segments.map(s => {
    const a0 = angle;
    const a1 = angle + (s.value / total) * 2 * Math.PI;
    angle = a1;
    return { ...s, a0, a1 };
  });

  function arc(a0: number, a1: number, outer: number, inner: number) {
    const cos0 = Math.cos(a0), sin0 = Math.sin(a0);
    const cos1 = Math.cos(a1), sin1 = Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return [
      `M ${cx + outer * cos0} ${cy + outer * sin0}`,
      `A ${outer} ${outer} 0 ${large} 1 ${cx + outer * cos1} ${cy + outer * sin1}`,
      `L ${cx + inner * cos1} ${cy + inner * sin1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${cx + inner * cos0} ${cy + inner * sin0}`,
      'Z',
    ].join(' ');
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" width={120} height={120} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={arc(s.a0, s.a1, hov === i ? R + 3 : R, r)}
            fill={s.color} fillOpacity={hov === null || hov === i ? 1 : 0.4}
            stroke={SURFACE} strokeWidth={2}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ cursor: 'default', transition: 'fill-opacity 0.15s' }} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={T_PRIMARY} fontSize={13} fontWeight="700" fontFamily="monospace">
          {fmt(total)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={T_MUTED} fontSize={8}>role activations</text>
      </svg>
      <div className="space-y-2 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 cursor-default"
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[11px] text-[color:var(--vv-text-secondary)] flex-1">{s.label}</span>
            <span className="font-mono text-[11px] text-[color:var(--vv-text)] font-semibold">{fmt(s.value)}</span>
            <span className="font-mono text-[10px] text-[color:var(--vv-text-tertiary)]">{((s.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Funnel -------------------------------------------------------------------
function FunnelChart({ stages }: { stages: { label: string; value: number; color?: string }[] }) {
  const max = stages[0]?.value || 1;
  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => {
        const pct = (s.value / max) * 100;
        const convFrom = i > 0 ? ((s.value / stages[i - 1].value) * 100).toFixed(0) + '% from prev' : '';
        return (
          <div key={i}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] w-36 shrink-0 truncate">{s.label}</span>
              <div className="flex-1 h-5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-sm overflow-hidden relative">
                <div className="h-full rounded-sm transition-all duration-300"
                  style={{ width: `${pct}%`, background: s.color ?? C1, opacity: 0.85 }} />
                <span className="absolute left-2 top-0 h-full flex items-center font-mono text-[10px] font-semibold text-white/80">{fmt(s.value)}</span>
              </div>
              {convFrom && <span className="text-[9px] text-[color:var(--vv-text-tertiary)] w-20 text-right shrink-0 font-mono">{convFrom}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Insight row --------------------------------------------------------------
function InsightRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-[#1c2a3e] last:border-0">
      <span className="text-[12px] shrink-0 mt-0.5">{icon}</span>
      <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">{text}</p>
    </div>
  );
}

// --- Chart card wrapper -------------------------------------------------------
function Card({ children, className = '', title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <div className={`bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <p className="text-[12px] font-semibold text-[color:var(--vv-text)] font-display">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

const RANGES: { label: string; value: Range }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This Year', value: 'year' },
];

function dateLabels(range: Range): string[] {
  const now = new Date(2026, 3, 20); // Apr 20 2026
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (range === '7d') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - 6 + i);
      return `${months[d.getMonth()]} ${d.getDate()}`;
    });
  }
  if (range === '30d') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - 29 + i);
      return `${d.getDate()} ${months[d.getMonth()]}`;
    });
  }
  if (range === '90d') {
    return Array.from({ length: 90 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - 89 + i);
      return `${months[d.getMonth()]} ${d.getDate()}`;
    });
  }
  // year = 52 weeks
  return Array.from({ length: 52 }, (_, i) => `W${i + 1}`);
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(() => makeData('30d'));
  const [showExport, setShowExport] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [userTab, setUserTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const labels = dateLabels(range);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => { setData(makeData(range)); setLoading(false); }, 380);
    return () => clearTimeout(t);
  }, [range]);

  // Summary KPIs (use last value + prev-period comparison)
  const totalUsers = 12482;
  const activeUsers = last(data.activeUsers);
  const prevActive = data.activeUsers[Math.floor(data.activeUsers.length / 2)] ?? activeUsers;
  const activeBiz = last(data.activeBiz);
  const prevBiz = data.activeBiz[Math.floor(data.activeBiz.length / 2)] ?? activeBiz;
  const activeDeals = 94; // fixed platform metric

  // Verification breakdown (totals over period)
  const verifData = {
    approved: Math.round(sum(data.newUsers) * 0.42),
    pending: Math.round(sum(data.newUsers) * 0.18),
    rejected: Math.round(sum(data.newUsers) * 0.12),
    needsInfo: Math.round(sum(data.newUsers) * 0.08),
  };

  // Deal funnel
  const dealBase = 320;
  const dealFunnel = [
    { label: 'Matched', value: dealBase, color: C1 },
    { label: 'Interest Confirmed', value: Math.round(dealBase * 0.74), color: C1 },
    { label: 'Deal Room', value: Math.round(dealBase * 0.58), color: C2 },
    { label: 'NDA Signed', value: Math.round(dealBase * 0.44), color: C2 },
    { label: 'Negotiation', value: Math.round(dealBase * 0.31), color: C3 },
    { label: 'Agreement', value: Math.round(dealBase * 0.22), color: C3 },
    { label: 'Milestone Funding', value: Math.round(dealBase * 0.14), color: C4 },
    { label: 'Completed', value: Math.round(dealBase * 0.09), color: C4 },
  ];

  const rangeLabel = RANGES.find(r => r.value === range)?.label ?? 'Last 30 days';

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Analytics</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Platform performance, growth and operational insights.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button onClick={() => setShowRangePicker(v => !v)}
              className="flex items-center gap-2 h-8 px-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] transition-colors">
              {rangeLabel} <IconChevronDown s={11} />
            </button>
            {showRangePicker && (
              <div className="absolute right-0 top-9 z-20 bg-[#121A2B] border border-[color:var(--vv-border-strong)] rounded-[8px] shadow-2xl overflow-hidden min-w-[140px]">
                {RANGES.map(r => (
                  <button key={r.value} onClick={() => { setRange(r.value); setShowRangePicker(false); }}
                    className={`w-full px-3 py-2 text-left text-[12px] hover:bg-[color:var(--vv-raised)] transition-colors ${
                      range === r.value ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-secondary)]'
                    }`}>{r.label}</button>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" icon={<IconFileText s={12} />} onClick={() => setShowExport(true)}>Export Report</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Total Users" value={fmt(totalUsers)} delta={8.4} color={C1} />
        <KpiTile label="Active Users" value={fmt(activeUsers)} delta={pct(activeUsers, prevActive)} color={C1} />
        <KpiTile label="Active Businesses" value={fmt(activeBiz)} delta={pct(activeBiz, prevBiz)} color={C2} />
        <KpiTile label="Active Deals" value={String(activeDeals)} delta={4.2} color={C4} />
      </div>

      {/* Key Insights */}
      <Card title="Key Insights" className="mb-4"
        action={<span className="text-[10px] text-[color:var(--vv-text-tertiary)]">{rangeLabel}</span>}>
        <InsightRow icon="?" text={`User growth increased 8.4% compared with the previous period. New registrations are trending upward across all weeks.`} />
        <InsightRow icon="?" text={`Verification request volume is elevated. Pending applications represent ${((verifData.pending / (verifData.approved + verifData.pending + verifData.rejected + verifData.needsInfo)) * 100).toFixed(0)}% of the review queue.`} />
        <InsightRow icon="?" text={`Most active deal opportunities are currently in Seed and Pre-Seed stage. ${dealFunnel[6].value} deals have reached Milestone Funding.`} />
      </Card>

      {/* Primary: User Growth + Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <Card title="User Growth" className="lg:col-span-2"
          action={
            <div className="flex items-center gap-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md p-0.5">
              {(['daily', 'weekly', 'monthly'] as const).map(t => (
                <button key={t} onClick={() => setUserTab(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors ${
                    userTab === t ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                  }`}>{t}</button>
              ))}
            </div>
          }>
          {loading ? <ChartSkeleton h={160} /> : (
            <LineChart title="" h={160} labels={labels}
              series={[
                { name: 'New Users', values: data.newUsers, color: C1 },
                { name: 'Active Users', values: data.activeUsers.map(v => Math.round(v / 60)), color: C2 },
              ]} />
          )}
        </Card>

        <Card title="Role Distribution">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-3">Users may have multiple roles. Counts reflect role activations, not unique users.</p>
          {loading ? <ChartSkeleton h={110} /> : (
            <DonutChart segments={[
              { label: 'Founder', value: 7142, color: C1 },
              { label: 'Investor', value: 4209, color: C2 },
              { label: 'Professional', value: 3811, color: C3 },
            ]} />
          )}
        </Card>
      </div>

      {/* Secondary: Business Growth + Verification Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Business Growth">
          {loading ? <ChartSkeleton h={150} /> : (
            <LineChart title="" h={150} labels={labels}
              series={[
                { name: 'New Businesses', values: data.newBiz, color: C2 },
                { name: 'Verified Businesses', values: data.verifiedBiz.map(v => Math.round(v / 22)), color: C4 },
              ]} />
          )}
        </Card>

        <Card title="Verification Activity">
          {loading ? <ChartSkeleton h={150} /> : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Approved', value: verifData.approved, color: C4 },
                  { label: 'Pending', value: verifData.pending, color: C_WARN },
                  { label: 'Needs Info', value: verifData.needsInfo, color: C2 },
                  { label: 'Rejected', value: verifData.rejected, color: C_REJECTED },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="font-mono text-[16px] font-semibold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] text-[color:var(--vv-text-tertiary)] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <BarChart title="" h={110} labels={labels}
                series={[
                  { name: 'Approved', values: data.newUsers.map(v => Math.round(v * 0.42)), color: C4 },
                  { name: 'Pending', values: data.newUsers.map(v => Math.round(v * 0.18)), color: C_WARN },
                ]} />
            </>
          )}
        </Card>
      </div>

      {/* Tertiary: Application Activity + Deal Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card title="Application Activity">
          {loading ? <ChartSkeleton h={160} /> : (
            <LineChart title="" h={160} labels={labels}
              series={[
                { name: 'Submitted', values: data.appsSubmitted, color: C1 },
                { name: 'Accepted', values: data.appsAccepted, color: C4 },
                { name: 'Rejected', values: data.appsRejected, color: C_REJECTED },
              ]} />
          )}
          {!loading && (
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-2 font-mono">
              Acceptance rate: {((sum(data.appsAccepted) / Math.max(sum(data.appsSubmitted), 1)) * 100).toFixed(1)}% over period
            </p>
          )}
        </Card>

        <Card title="Deal Lifecycle">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mb-3">Active deal pipeline by stage. Conversion rate shown relative to Matched.</p>
          {loading ? <ChartSkeleton h={160} /> : <FunnelChart stages={dealFunnel} />}
        </Card>
      </div>

      {/* Bottom: Team Activity + Trust & Safety + Engagement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card title="Team Activity">
          {loading ? <ChartSkeleton h={130} /> : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'New Teams', value: sum(data.newTeams), color: C3 },
                  { label: 'Active', value: last(data.activeTeams), color: C1 },
                  { label: 'Avg Size', value: 3.8, color: T_SEC },
                ].map(s => (
                  <div key={s.label}>
                    <p className="font-mono text-[16px] font-semibold" style={{ color: s.color }}>{typeof s.value === 'number' && s.value < 10 ? s.value.toFixed(1) : fmt(Math.round(s.value as number))}</p>
                    <p className="text-[9px] text-[color:var(--vv-text-tertiary)]">{s.label}</p>
                  </div>
                ))}
              </div>
              <BarChart title="" h={90} labels={labels}
                series={[{ name: 'New Teams', values: data.newTeams, color: C3 }]} />
            </>
          )}
        </Card>

        <Card title="Trust & Safety"
          action={
            <button className="text-[10.5px] text-[#C67A4E] hover:underline">View Reports ?</button>
          }>
          {loading ? <ChartSkeleton h={130} /> : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Open Reports', value: sum(data.openReports), color: C_WARN },
                  { label: 'Resolved', value: sum(data.resolvedReports), color: C4 },
                  { label: 'Escalated', value: 4, color: C_REJECTED },
                  { label: 'High/Critical', value: 7, color: C_REJECTED },
                ].map(s => (
                  <div key={s.label}>
                    <p className="font-mono text-[16px] font-semibold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] text-[color:var(--vv-text-tertiary)]">{s.label}</p>
                  </div>
                ))}
              </div>
              <BarChart title="" h={90} labels={labels}
                series={[
                  { name: 'Open', values: data.openReports, color: C_WARN },
                  { name: 'Resolved', values: data.resolvedReports, color: C4 },
                ]} />
            </>
          )}
        </Card>

        <Card title="Platform Engagement">
          {loading ? <ChartSkeleton h={130} /> : (
            <div className="space-y-3">
              {[
                { label: 'Profile Views', value: '48,320', delta: '+12.1%', up: true },
                { label: 'Discovery Searches', value: '19,841', delta: '+6.3%', up: true },
                { label: 'Saved Opportunities', value: '4,102', delta: '+3.8%', up: true },
                { label: 'Connections Made', value: '1,844', delta: '-1.2%', up: false },
                { label: 'Deal Room Sessions', value: '623', delta: '+9.4%', up: true },
              ].map(e => (
                <div key={e.label} className="flex items-center justify-between py-1.5 border-b border-[#1c2a3e] last:border-0">
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{e.label}</span>
                  <div className="text-right">
                    <span className="font-mono text-[12px] font-semibold text-[color:var(--vv-text)]">{e.value}</span>
                    <span className={`ml-2 text-[10px] font-mono ${e.up ? 'text-[#22C55E]' : 'text-[#F04438]'}`}>{e.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="analytics-export-title">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowExport(false)} />
          <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
            <p id="analytics-export-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display mb-1">Export Report</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mb-4">Export analytics for: <strong className="text-[color:var(--vv-text-secondary)]">{rangeLabel}</strong></p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {['CSV', 'PDF'].map(f => (
                <button key={f} onClick={() => setShowExport(false)}
                  className="h-10 rounded-md border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] text-[12px] font-semibold text-[color:var(--vv-text-secondary)] transition-colors">
                  Export {f}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">Analytics exports contain aggregated platform data only. No individual sensitive information is included.</p>
          </div>
        </div>
      )}

      {/* Close range picker on outside click */}
      {showRangePicker && (
        <div className="fixed inset-0 z-10" onClick={() => setShowRangePicker(false)} />
      )}
    </div>
  );
}