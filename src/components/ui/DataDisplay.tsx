import React from 'react';

// --- Page Header --------------------------------------------------------------

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, breadcrumb, className = '' }: PageHeaderProps) {
  return (
    <div className={`px-5 pt-5 pb-4 border-b vv-border ${className}`}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[17px] font-semibold vv-text-primary leading-snug tracking-tight">{title}</h1>
          {subtitle && <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">{actions}</div>}
      </div>
    </div>
  );
}

// --- Section Header -----------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">{title}</p>
      {action}
    </div>
  );
}

// --- Breadcrumb ---------------------------------------------------------------

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-1.5 text-[11.5px] ${className}`} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-[#35446A]">/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
              {item.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? 'text-[color:var(--vv-text-secondary)]' : 'text-[color:var(--vv-text-tertiary)]'}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// --- Tabs ---------------------------------------------------------------------

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs({ tabs, active, onChange, className = '', size = 'md' }: TabsProps) {
  const textSize = size === 'sm' ? 'text-[11.5px]' : 'text-[12.5px]';
  const padding  = size === 'sm' ? 'px-3 py-2'   : 'px-4 py-2.5';
  return (
    <div className={`flex border-b vv-border-strong overflow-x-auto ${className}`} role="tablist">
      {tabs.map(tab => (
        <button key={tab.key} id={`tab-${tab.key}`} role="tab" aria-selected={active === tab.key} tabIndex={active === tab.key ? 0 : -1} onClick={() => onChange(tab.key)}
          className={`flex-shrink-0 ${padding} ${textSize} font-medium border-b-2 transition-colors inline-flex items-center gap-1.5 ${
            active === tab.key
              ? 'border-[#C67A4E] text-[color:var(--vv-text)]'
              : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
          }`}>
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              active === tab.key ? 'bg-[#C67A4E]/15 text-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-tertiary)]'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// --- Metric Tile --------------------------------------------------------------

interface MetricTileProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive: boolean };
  sub?: string;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export function MetricTile({ label, value, delta, sub, color = '#C67A4E', className = '', onClick }: MetricTileProps) {
  return (
    <div
      className={`vv-surface border rounded-[10px] px-4 py-4 ${onClick ? 'cursor-pointer hover:border-[color:var(--vv-border-strong)] transition-colors' : ''} ${className}`}
      onClick={onClick}>
      <p className="text-[10.5px] font-medium text-[color:var(--vv-text-tertiary)] uppercase tracking-wider leading-none mb-2.5">{label}</p>
      <p className="font-display text-[24px] font-semibold leading-none tabular-nums" style={{ color }}>{value}</p>
      {(delta || sub) && (
        <div className="flex items-center gap-2 mt-2">
          {delta && (
            <span className={`text-[11px] font-medium flex items-center gap-0.5 ${delta.positive ? 'text-[#22C55E]' : 'text-[#F04438]'}`}>
              <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                {delta.positive ? <path d="M18 15l-6-6-6 6"/> : <path d="M6 9l6 6 6-6"/>}
              </svg>
              {delta.value}
            </span>
          )}
          {sub && <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// --- Info Row -----------------------------------------------------------------

export function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b vv-border last:border-0 gap-4">
      <span className="text-[12px] text-[color:var(--vv-text-tertiary)] shrink-0">{label}</span>
      <span className={`text-[12.5px] text-[color:var(--vv-text)] text-right ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</span>
    </div>
  );
}

// --- Table system -------------------------------------------------------------

// Table wrapper with consistent border + overflow treatment
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full min-w-max border-collapse">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-[color:var(--vv-border)]">{children}</thead>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

interface ThProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onClick?: () => void;
}

export function Th({ children, className = '', align = 'left', sortable, sorted, onClick }: ThProps) {
  return (
    <th
      className={`px-4 py-2.5 text-[10.5px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider whitespace-nowrap select-none ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${sortable ? 'cursor-pointer hover:text-[color:var(--vv-text-secondary)] transition-colors' : ''} ${className}`}
      onClick={onClick}>
      {sortable ? (
        <span className="inline-flex items-center gap-1">
          {children}
          <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="opacity-60">
            {sorted === 'asc'  ? <path d="M18 15l-6-6-6 6"/> :
             sorted === 'desc' ? <path d="M6 9l6 6 6-6"/> :
                                 <><path d="M18 15l-6-6-6 6" opacity=".4"/><path d="M6 9l6 6 6-6" opacity=".4"/></>}
          </svg>
        </span>
      ) : children}
    </th>
  );
}

interface TrProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Tr({ children, className = '', onClick, selected }: TrProps) {
  return (
    <tr
      className={`border-b border-[#1c2a3e] transition-colors ${
        onClick ? 'cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)]' : ''
      } ${selected ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]' : ''} ${className}`}
      onClick={onClick}>
      {children}
    </tr>
  );
}

interface TdProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
  muted?: boolean;
}

export function Td({ children, className = '', align = 'left', mono, muted }: TdProps) {
  return (
    <td
      className={`px-4 py-3 text-[12.5px] whitespace-nowrap ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${mono ? 'font-mono tabular-nums' : ''} ${muted ? 'text-[color:var(--vv-text-tertiary)]' : 'text-[color:var(--vv-text)]'} ${className}`}>
      {children}
    </td>
  );
}

// Pagination row
interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, total, pageSize, onPage }: PaginationProps) {
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#1c2a3e]">
      <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] font-mono tabular-nums">
        {start}-{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        {[
          { label: '?', disabled: page <= 1,     onClick: () => onPage(page - 1) },
          { label: '?', disabled: page >= pages,  onClick: () => onPage(page + 1) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled}
            className="w-7 h-7 flex items-center justify-center rounded text-[12.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Filter Toolbar -----------------------------------------------------------

interface FilterToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterToolbar({ children, className = '' }: FilterToolbarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#1c2a3e] ${className}`}>
      {children}
    </div>
  );
}

// Compact filter pill / select used in admin toolbars
interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[] | string[];
}

export function FilterSelect({ options, className = '', ...props }: FilterSelectProps) {
  const normalizedOptions = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  return (
    <div className="relative">
      <select
        {...props}
        className={`h-7 pl-2.5 pr-6 appearance-none bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors ${className}`}>
        {normalizedOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]">
        <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}

// --- Stat Strip ---------------------------------------------------------------
// Horizontal summary numbers row used at the top of admin pages

interface StatStripItem {
  label: string;
  value: string | number;
  color?: string;
  onClick?: () => void;
}

interface StatStripProps {
  stats: StatStripItem[];
  className?: string;
}

export function StatStrip({ stats, className = '' }: StatStripProps) {
  return (
    <div className={`flex flex-wrap gap-px border-b border-[#1c2a3e] ${className}`}>
      {stats.map((s, i) => (
        <button
          key={i}
          onClick={s.onClick}
          className={`flex flex-col items-start px-5 py-3 flex-1 min-w-[100px] ${s.onClick ? 'hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] transition-colors cursor-pointer' : 'cursor-default'}`}>
          <span className="text-[11px] font-medium text-[color:var(--vv-text-tertiary)] mb-0.5">{s.label}</span>
          <span className="font-display text-[20px] font-semibold tabular-nums leading-none" style={{ color: s.color ?? '#EAF0FA' }}>
            {s.value}
          </span>
        </button>
      ))}
    </div>
  );
}