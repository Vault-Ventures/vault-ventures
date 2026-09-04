import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md';

const variantStyles: Record<ButtonVariant, string> = {
  /* Primary - copper gradient (dark: #7A4527?#E8A878, light: #7A4527?#B06736 via CSS) */
  primary:
    'vv-btn-primary bg-gradient-to-r from-[#7A4527] via-[#C67A4E] to-[#E8A878] text-[#1D0F06] ' +
    'border border-white/14 ' +
    'hover:brightness-110 ' +
    'focus-visible:ring-2 focus-visible:ring-offset-1 transition-all duration-200',

  /* Glass secondary */
  secondary:
    'vv-btn-secondary vv-control ' +
    'border border-[rgba(255,255,255,0.12)] ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.065)] ' +
    'hover:bg-[rgba(14,24,52,0.80)] hover:border-[rgba(255,255,255,0.20)] ' +
    'focus-visible:ring-2 transition-all duration-200',

  tertiary:
    'bg-transparent vv-copper hover:text-[#E8A878] border border-transparent ' +
    'focus-visible:ring-2 transition-colors duration-150',

  destructive:
    'bg-transparent text-[#F04438] hover:bg-red-500/8 border border-[#F04438]/30 ' +
    'hover:border-[#F04438]/60 focus-visible:ring-2 transition-colors duration-150',

  ghost:
    'bg-transparent vv-text-secondary hover:text-[color:var(--vv-text-secondary)] ' +
    'hover:bg-[rgba(11,20,44,0.65)] border border-transparent ' +
    'hover:border-[rgba(255,255,255,0.08)] ' +
    'focus-visible:ring-2 transition-all duration-150',

  success:
    'bg-transparent text-[#22C55E] hover:bg-green-500/8 border border-[#22C55E]/30 ' +
    'hover:border-[#22C55E]/60 focus-visible:ring-2 transition-colors duration-150',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs:        'h-6 px-2 text-[11px] gap-1 rounded',
  sm:        'h-7 px-2.5 text-[11.5px] gap-1.5 rounded',
  md:        'h-9 px-3.5 text-[12.5px] gap-1.5 rounded-md',
  lg:        'h-10 px-4 text-[13px] gap-2 rounded-md',
  'icon-sm': 'h-7 w-7 rounded',
  'icon-md': 'h-8 w-8 rounded-md',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'primary', size = 'md', children, icon, iconRight, loading, className = '', disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-offset-transparent ${variant === 'primary' ? 'vv-cta-glow' : ''} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
  variant?: ButtonVariant;
  children: React.ReactNode;
}
export function IconButton({ size = 'md', variant = 'ghost', className = '', ...props }: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size === 'sm' ? 'icon-sm' : 'icon-md'}
      className={`p-0 ${className}`}
      {...props}
    />
  );
}