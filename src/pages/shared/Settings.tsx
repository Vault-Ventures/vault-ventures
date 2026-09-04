import React from 'react';
import { useTheme } from '../../context/ThemeContext';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden bg-[#121A2B]">
      <div className="px-5 py-3.5 border-b border-[color:var(--vv-border)]">
        <p className="text-[13px] font-semibold font-display text-[color:var(--vv-text)]">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 border-b border-[#1c2a3e] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-[color:var(--vv-text)]">{label}</p>
        {description && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: 'dark' | 'light'; setTheme: (t: 'dark' | 'light') => void }) {
  const isDark = theme === 'dark';
  return (
    <div className="flex items-center gap-1 p-1 rounded-[9px] border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]">
      <button
        onClick={() => setTheme('light')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all"
        style={!isDark ? {
          background: 'rgba(255,255,255,0.92)',
          color: '#0F1B2D',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        } : { color: '#5E6D8F' }}
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all"
        style={isDark ? {
          background: 'rgba(198,122,78,0.10)',
          color: '#C67A4E',
          border: '1px solid rgba(198,122,78,0.22)',
        } : { color: '#5E6D8F' }}
      >
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        Dark
      </button>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 md:p-6 max-w-[720px] mx-auto space-y-5">
      <div className="mb-6">
        <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Settings</h1>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Manage your account preferences and appearance.</p>
      </div>

      {/* Appearance */}
      <SectionCard title="Appearance">
        <Row
          label="Theme"
          description="Choose between Light and Dark mode. Your preference is saved automatically."
        >
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </Row>
        <Row label="Current theme">
          <span className="flex items-center gap-2 text-[12px] font-mono text-[color:var(--vv-text-tertiary)]">
            {theme === 'dark' ? (
              <>
                <svg width="11" height="11" fill="#C67A4E" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <span style={{ color: '#C67A4E' }}>Dark</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#C67A4E" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <span style={{ color: '#C67A4E' }}>Light</span>
              </>
            )}
          </span>
        </Row>
      </SectionCard>

      {/* Account */}
      <SectionCard title="Account">
        <Row label="Name" description="Your display name across the platform.">
          <span className="text-[12.5px] text-[color:var(--vv-text-secondary)]">Alex Morgan</span>
        </Row>
        <Row label="Email" description="Used for notifications and sign in.">
          <span className="text-[12.5px] font-mono text-[color:var(--vv-text-tertiary)]">alex@example.com</span>
        </Row>
        <Row label="Password">
          <button className="text-[12px] text-[#C67A4E] hover:underline transition-colors">Change password</button>
        </Row>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications">
        {[
          { label: 'New matches', description: 'When a high-confidence match is found for you.' },
          { label: 'Interest received', description: 'When someone expresses interest in your business.' },
          { label: 'Deal Room updates', description: 'Messages, documents, and stage changes.' },
          { label: 'Milestone updates', description: 'When milestones are submitted or confirmed.' },
        ].map(item => (
          <Row key={item.label} label={item.label} description={item.description}>
            <div className="relative w-9 h-5 rounded-full cursor-pointer transition-all duration-200 flex items-center"
              style={{ background: 'rgba(198,122,78,0.2)', border: '1px solid rgba(198,122,78,0.35)' }}>
              <span className="absolute w-3.5 h-3.5 rounded-full transition-all duration-200"
                style={{ right: '2px', background: '#C67A4E' }} />
            </div>
          </Row>
        ))}
      </SectionCard>

      {/* Privacy */}
      <SectionCard title="Privacy">
        <Row label="Profile visibility" description="Control who can discover your profile.">
          <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Verified users only</span>
        </Row>
        <Row label="Data usage" description="How Vault Ventures uses your data to improve matching.">
          <button className="text-[12px] text-[#C67A4E] hover:underline">View policy</button>
        </Row>
      </SectionCard>
    </div>
  );
}