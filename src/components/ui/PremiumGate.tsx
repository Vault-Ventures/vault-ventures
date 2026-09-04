import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface PremiumGateProps {
  feature: string;
  description?: string;
  compact?: boolean;
  children?: React.ReactNode;
  isPremium?: boolean;
}

export function PremiumGate({ feature, description, compact = false, children, isPremium = false }: PremiumGateProps) {
  const navigate = useNavigate();

  if (isPremium && children) return <>{children}</>;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
        style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.18)' }}>
        <svg width="12" height="12" fill="none" stroke="#C67A4E" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
        </svg>
        <span className="text-[11.5px] text-[#C67A4E] font-medium">{feature}</span>
        <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mx-1">-</span>
        <button
          onClick={() => navigate('/app/premium')}
          className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">
          Upgrade ?
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border overflow-hidden"
      style={{ background: 'rgba(18,26,43,0.85)', borderColor: 'rgba(198,122,78,0.22)' }}>
      {/* Gradient accent line */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(135deg, #7A4527, #C67A4E, #E8A878)' }} />
      <div className="px-5 py-5 text-center">
        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.22)' }}>
          <svg width="18" height="18" fill="none" stroke="#C67A4E" strokeWidth="1.75" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">Premium Feature</p>
        <p className="text-[12px] font-medium text-[#C67A4E] mb-1">{feature}</p>
        {description && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-4 leading-relaxed">{description}</p>}
        {!description && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-4">Upgrade to access this capability.</p>}
        <Button size="sm" onClick={() => navigate('/app/premium')}>Upgrade to Premium</Button>
      </div>
    </div>
  );
}

export function PremiumBadge({ onClick }: { onClick?: () => void }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={onClick ?? (() => navigate('/app/premium'))}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all hover:opacity-80"
      style={{ background: 'linear-gradient(90deg, rgba(198,122,78,0.15), rgba(198,122,78,0.15))', border: '1px solid rgba(198,122,78,0.28)', color: '#C67A4E' }}>
      <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      Premium
    </button>
  );
}