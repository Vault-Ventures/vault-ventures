import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// --- Empty State --------------------------------------------------------------

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center mb-4 text-[color:var(--vv-text-tertiary)]">
          {icon}
        </div>
      )}
      <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] mb-1">{title}</p>
      {description && <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-xs leading-snug">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// --- Error State --------------------------------------------------------------

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-[#F04438]/10 border border-[#F04438]/20 flex items-center justify-center mb-4">
        <svg width="18" height="18" fill="none" stroke="#F04438" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <p className="text-[13.5px] font-semibold text-[color:var(--vv-text)] mb-1">{title}</p>
      <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-xs leading-snug mb-4">{description}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="h-8 px-3.5 text-[12px] font-medium bg-transparent text-[color:var(--vv-text)] border border-[color:var(--vv-border-strong)] hover:border-[#4d5e7a] hover:bg-[color:var(--vv-raised)] rounded-md transition-colors">
          Retry
        </button>
      )}
    </div>
  );
}

// --- Skeleton primitives ------------------------------------------------------

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton shapes for common content

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  const widths = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16', 'w-36'];
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-3.5 ${widths[i % widths.length]} flex-shrink-0`} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      <div className="flex gap-4 px-4 py-2.5 border-b border-[color:var(--vv-border)]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-4">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
      <Skeleton className="w-full h-36 rounded-none" />
      <div className="px-5 -mt-10 pb-5">
        <Skeleton className="w-20 h-20 rounded-full mb-4 border-4 border-[#121A2B]" />
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-3.5 w-24 mb-1" />
        <Skeleton className="h-3 w-64 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

// --- Toast system -------------------------------------------------------------

type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (variant: ToastVariant, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
    </svg>
  ),
  danger: (
    <svg width="14" height="14" fill="none" stroke="#F04438" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
};

const TOAST_COLORS: Record<ToastVariant, string> = {
  success: 'border-l-[#22C55E]',
  warning: 'border-l-[#F59E0B]',
  danger:  'border-l-[#F04438]',
  info:    'border-l-[#C67A4E]',
};

function ToastNotification({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`flex items-start gap-3 w-72 bg-[#121A2B] border border-[color:var(--vv-border-strong)] border-l-4 ${TOAST_COLORS[item.variant]} rounded-[8px] px-3 py-2.5 shadow-2xl`}>
      <div className="mt-0.5 flex-shrink-0">{TOAST_ICONS[item.variant]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] leading-snug">{item.title}</p>
        {item.description && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 leading-snug">{item.description}</p>}
      </div>
      <button onClick={onDismiss} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors mt-0.5 flex-shrink-0">
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((variant: ToastVariant, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, variant, title, description }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(item => (
          <div key={item.id} className="pointer-events-auto">
            <ToastNotification item={item} onDismiss={() => dismiss(item.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// --- Confirmation Modal -------------------------------------------------------

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const CONFIRM_STYLES = {
  danger:  { confirm: 'bg-transparent text-[#F04438] hover:bg-red-500/8 border border-[#F04438]/30 hover:border-[#F04438]/60', icon: '#F04438' },
  warning: { confirm: 'bg-transparent text-[#F59E0B] hover:bg-amber-500/8 border border-[#F59E0B]/30 hover:border-[#F59E0B]/60', icon: '#F59E0B' },
  default: { confirm: 'bg-[#C67A4E] text-white hover:bg-[#B06736] border border-[#C67A4E]', icon: '#C67A4E' },
};

export function ConfirmModal({
  title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'default', onConfirm, onCancel, loading,
}: ConfirmModalProps) {
  const styles = CONFIRM_STYLES[variant];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="feedback-confirm-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-[#121A2B] border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-[380px] shadow-2xl p-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: `${styles.icon}18`, border: `1px solid ${styles.icon}40` }}>
          {variant === 'danger' ? (
            <svg width="16" height="16" fill="none" stroke={styles.icon} strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke={styles.icon} strokeWidth="1.75" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
          )}
        </div>
        <h2 id="feedback-confirm-title" className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">{title}</h2>
        <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] leading-snug mb-6">{description}</p>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={onCancel}
            className="h-8 px-3.5 text-[12px] font-medium bg-transparent text-[color:var(--vv-text)] border border-[color:var(--vv-border-strong)] hover:border-[#4d5e7a] hover:bg-[color:var(--vv-raised)] rounded-md transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`h-8 px-3.5 text-[12px] font-medium rounded-md transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 ${styles.confirm}`}>
            {loading && (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Drawer shell -------------------------------------------------------------

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, width = 'w-[480px]', children, footer }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${width} max-w-full h-full bg-[#0D1626] border-l border-[color:var(--vv-border)] flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#1c2a3e] flex-shrink-0">
          <div>
            <h2 id="drawer-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display leading-snug">{title}</h2>
            {subtitle && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label={`Close ${title}`}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-colors flex-shrink-0 ml-3">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-[#1c2a3e] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}