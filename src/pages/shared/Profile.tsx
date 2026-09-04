import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useRole } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { ScoreChip } from '../../components/ui/ScoreComponents';

type NormalRole = 'founder' | 'investor' | 'professional';
const DEMO_USER_ROLES: NormalRole[] = ['founder', 'investor', 'professional'];
const ROLE_COLORS: Record<NormalRole, string> = {
  founder: '#C67A4E',
  investor: '#C9A24B',
  professional: '#22C55E',
};
const ROLE_LABELS: Record<NormalRole, string> = {
  founder: 'Founder',
  investor: 'Investor',
  professional: 'Professional',
};

const SECTIONS = ['Overview', 'Verification', 'Preferences'] as const;
type Section = typeof SECTIONS[number];

const MODAL_SECTIONS = [
  'Basic Information',
  'Founder Information',
  'Professional Information',
  'Investor Information',
  'Experience',
  'Preferences',
] as const;
type ModalSection = typeof MODAL_SECTIONS[number];

/* unified user data */
const USER = {
  name: 'Alex Morgan',
  initials: 'AM',
  headline: 'AI Product Strategist & Entrepreneur',
  location: 'Dhaka, Bangladesh',
  company: 'NovaTech AI',
  since: 'Jan 2025',
  tier: 1 as 0 | 1 | 2 | 3,
  bio: 'Serial entrepreneur and angel investor building at the intersection of AI, fintech, and emerging-market financial inclusion. Previously VP Product at Plaid and Senior PM at Stripe. Obsessed with making financial infrastructure accessible to underbanked businesses.',
  founder: {
    company: 'NovaTech AI',
    industry: 'AI / ML - FinTech',
    stage: 'Seed',
    readiness: 78,
    experience: 'Serial entrepreneur',
    skills: ['Product Strategy', 'AI / ML', 'FinTech', 'Sales', 'Business Development'],
    interests: ['Raising capital', 'Strategic partnerships', 'Market validation'],
  },
  investor: {
    type: 'Angel investor',
    industries: ['FinTech', 'AI / ML', 'B2B SaaS'],
    stages: ['Pre-seed', 'Seed'],
    rangeDisplay: 'BDT 50L - BDT 5Cr',
    involvement: 'Light-touch (board observer)',
    thesis: 'Backing emerging-market fintech and AI infrastructure at pre-seed and seed. Lead and co-invest.',
    portfolioCount: 12,
    activeSince: '2019',
    stageSplit: 'Pre-seed (8) - Seed (4)',
    sectorSplit: 'FinTech (5) - AI/ML (4) - SaaS (3)',
  },
  professional: {
    skills: ['Engineering', 'Go', 'React', 'Distributed Systems', 'Product', 'Data Analysis'],
    expertise: ['Technical Due Diligence', 'Go-to-Market Strategy', 'Investor Relations', 'Financial Modeling', 'Startup Scaling'],
    proficiency: 'Senior (7-12 yrs)',
    industries: ['FinTech', 'B2B SaaS', 'AI / ML'],
    availability: 'Part-time advisory',
    remote: 'Flexible',
    comp: 'Equity + advisory fee',
    interests: ['Founding engineer roles', 'CTO advisory', 'Technical co-founder search'],
  },
};

const EXPERIENCE = [
  { role: 'Founder & CEO', org: 'NovaTech AI', duration: '2023 - Present', desc: 'Building AI-powered credit risk infrastructure for underbanked SMBs in emerging markets using alternative data sources.' },
  { role: 'VP Product', org: 'Plaid', duration: '2020 - 2023', desc: 'Led product strategy for core data connectivity products across investments, identity, and payments. Grew revenue from ৳30M to ৳200M ARR.' },
  { role: 'Senior Product Manager', org: 'Stripe', duration: '2017 - 2020', desc: 'Built fraud detection and risk product suite serving 1M+ merchants globally. Launched Radar ML model reducing fraud by 28%.' },
  { role: 'Angel Investor', org: 'Independent', duration: '2019 - Present', desc: '12 investments across FinTech, B2B SaaS, and AI infrastructure at pre-seed and seed stage.' },
];

const PORTFOLIO = [
  { title: 'NovaTech AI - Credit Engine', desc: 'AI-powered alternative data credit scoring for SMBs. Live in 3 markets. 40% lower default rate vs. traditional scoring.', role: 'Founder & Technical Lead', skills: ['AI/ML', 'FinTech', 'Product'], year: '2023' },
  { title: 'Plaid Investments API', desc: 'End-to-end investment data connectivity for retail brokers and wealth management platforms. Used by 300+ fintech partners.', role: 'Product Lead', skills: ['API Design', 'FinTech', 'Partnerships'], year: '2022' },
];

/* form atoms */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Input({ label, type = 'text', placeholder, defaultValue }: { label: string; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <Field label={label}>
      <input type={type} defaultValue={defaultValue} placeholder={placeholder}
        className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] focus:outline-none focus:border-[#C67A4E] transition-colors" />
    </Field>
  );
}
function Textarea({ label, placeholder, defaultValue, rows = 3 }: { label: string; placeholder?: string; defaultValue?: string; rows?: number }) {
  return (
    <Field label={label}>
      <textarea defaultValue={defaultValue} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none leading-relaxed" />
    </Field>
  );
}
function Select({ label, options, defaultValue }: { label: string; options: string[]; defaultValue?: string }) {
  return (
    <Field label={label}>
      <select defaultValue={defaultValue}
        className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[#C67A4E] transition-colors">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
}
function TagPicker({ label, options, initial }: { label: string; options: string[]; initial?: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial || []);
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {options.map(o => {
          const active = selected.includes(o);
          return (
            <button key={o} type="button"
              onClick={() => setSelected(active ? selected.filter(s => s !== o) : [...selected, o])}
              className={`px-2.5 py-1 rounded text-[11.5px] font-medium border transition-all ${active ? 'bg-[rgba(198,122,78,0.10)] border-[#C67A4E] text-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:border-[#5E6D8F] hover:text-[color:var(--vv-text-secondary)]'}`}>
              {o}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/* photo upload dropzone */
function PhotoUpload({ label, isRound = false, initials }: { label: string; isRound?: boolean; initials?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (f: File) => { if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f)); };
  return (
    <Field label={label}>
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 flex items-center justify-center bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] overflow-hidden ${isRound ? 'w-14 h-14 rounded-full' : 'w-24 h-14 rounded-lg'}`}
          style={preview ? { backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!preview && isRound && initials && <span className="text-[#C67A4E] font-semibold text-[18px]">{initials}</span>}
          {!preview && !isRound && (
            <svg width="16" height="16" fill="none" stroke="#5E6D8F" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input ref={inputRef} type="file" accept="image/*" aria-label={label} className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div
            className="border border-dashed border-[color:var(--vv-border-strong)] rounded-lg px-3 py-2.5 text-center hover:border-[#5E6D8F] hover:bg-[color:var(--vv-raised)]/30 cursor-pointer transition-all"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => inputRef.current?.click()}
          >
            <svg width="14" height="14" fill="none" stroke="#5E6D8F" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-snug">Drop image or <span className="text-[#C67A4E]">browse</span></p>
            <p className="text-[10px] text-[#35446A] mt-0.5">PNG, JPG, WEBP - Max 5 MB</p>
          </div>
          {preview && (
            <button type="button" onClick={() => setPreview(null)} className="text-[11px] text-[#F04438] hover:underline mt-1.5 block">
              Remove photo
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

/* cover banner */
function CoverBanner({ image, editable, onEdit }: { image: string | null; editable: boolean; onEdit: () => void }) {
  return (
    <div className="relative overflow-hidden" style={{ height: 148, backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#212324] via-[#1A1C1D] to-[#0B0C0E]" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 960 148" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <pattern id="pg" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#C67A4E" strokeWidth="0.3" strokeOpacity="0.15"/>
          </pattern>
          <radialGradient id="glow" cx="30%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#C67A4E" stopOpacity="0.06"/><stop offset="100%" stopColor="#C67A4E" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111213" stopOpacity="0"/><stop offset="100%" stopColor="#1A1C1D" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
        <rect width="960" height="148" fill="url(#pg)"/>
        <rect width="960" height="148" fill="url(#glow)"/>
        {[[120,36],[240,88],[380,28],[480,72],[600,40],[720,96],[840,52],[920,80],[60,110],[300,118],[540,108],[780,120]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#C67A4E" fillOpacity="0.35"/>
        ))}
        {[[120,36,240,88],[240,88,380,28],[380,28,480,72],[480,72,600,40],[600,40,720,96],[720,96,840,52],[840,52,920,80],[120,36,60,110],[240,88,300,118],[480,72,540,108],[720,96,780,120]].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C67A4E" strokeWidth="0.6" strokeOpacity="0.18"/>
        ))}
        {([[810,30,14],[160,120,10],[520,22,11],[680,110,9]] as number[][]).map(([cx,cy,r],i) => {
          const pts = Array.from({length:6},(_,k)=>{const a=Math.PI/180*(60*k-30);return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');
          return <polygon key={i} points={pts} fill="none" stroke="#C67A4E" strokeWidth="0.5" strokeOpacity="0.2"/>;
        })}
        <path d="M0 148 Q240 80 480 120 Q720 160 960 100" fill="none" stroke="#C67A4E" strokeWidth="0.8" strokeOpacity="0.1"/>
        <rect x="0" y="90" width="960" height="58" fill="url(#bottomFade)"/>
      </svg>
      {image && <div className="absolute inset-0 bg-black/10" aria-hidden="true" />}
      {editable && (
        <button type="button" onClick={onEdit} aria-label="Edit cover photo" title="Edit cover photo"
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-black/45 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z"/><circle cx="12" cy="13" r="3"/></svg>
          Edit cover
        </button>
      )}
    </div>
  );
}

/* avatar */
function Avatar({ initials, size = 96, image, editable, onEdit }: { initials: string; size?: number; image: string | null; editable: boolean; onEdit: () => void }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div style={{ width: size, height: size, borderWidth: 4, borderColor: '#121A2B' }}
        className="rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-solid flex items-center justify-center text-[#C67A4E] font-semibold ring-1 ring-[#35446A] overflow-hidden">
        {image ? <img src={image} alt="Profile" className="h-full w-full object-cover" /> : <span style={{ fontSize: size * 0.33 }}>{initials}</span>}
      </div>
      {editable && (
        <button type="button" onClick={onEdit} aria-label="Edit profile photo" title="Edit profile photo"
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--vv-surface)] bg-[color:var(--vv-copper)] text-[color:var(--vv-on-copper)] shadow-md transition-colors hover:bg-[color:var(--vv-copper-warm)] focus-visible:outline-none">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z"/><circle cx="12" cy="13" r="3"/></svg>
        </button>
      )}
    </div>
  );
}

/* three-dot action menu */
function DotsMenu({ onEditProfile }: { onEditProfile: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Profile actions"
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:border-[#5E6D8F] hover:bg-[color:var(--vv-raised)] transition-all"
      >
        <svg width="14" height="4" fill="currentColor" viewBox="0 0 20 4">
          <circle cx="2" cy="2" r="2"/><circle cx="10" cy="2" r="2"/><circle cx="18" cy="2" r="2"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] py-1.5 z-40 shadow-2xl">
          <button
            onClick={() => { setOpen(false); onEditProfile(); }}
            className="w-full text-left px-3.5 py-2 text-[12.5px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] flex items-center gap-2.5 transition-colors"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828A2 2 0 0110.414 16.414H9v-1.414z"/>
            </svg>
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}

/* bio */
function Bio({ text, onEdit }: { text: string; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 180;
  const long = text.length > LIMIT;
  const display = long && !expanded ? text.slice(0, LIMIT).trimEnd() + '-' : text;
  if (!text) return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[13px] text-[color:var(--vv-text-tertiary)] italic">Add a short introduction to help others understand your background.</p>
      <button onClick={onEdit} className="text-[12px] text-[#C67A4E] hover:underline shrink-0">Add bio ?</button>
    </div>
  );
  return (
    <div>
      <p className="text-[13px] text-[color:var(--vv-text-secondary)] leading-relaxed">{display}</p>
      {long && <button onClick={() => setExpanded(e => !e)} className="text-[12px] text-[#C67A4E] hover:underline mt-1.5">{expanded ? 'Show less' : 'Read more'}</button>}
    </div>
  );
}

/* section card */
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2a3e]">
        <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">{title}</p>
        {action}
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </div>
  );
}
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#1c2a3e] last:border-0 gap-4">
      <span className="text-[12px] text-[color:var(--vv-text-tertiary)] shrink-0 w-36">{label}</span>
      <span className="text-[12.5px] text-[color:var(--vv-text)] text-right">{value}</span>
    </div>
  );
}
function TagList({ items, accent = false }: { items: string[]; accent?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(s => (
        <span key={s} className={`px-2.5 py-1 rounded text-[11.5px] border ${accent ? 'bg-[rgba(198,122,78,0.08)] border-[rgba(198,122,78,0.20)] text-[#C67A4E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-secondary)]'}`}>{s}</span>
      ))}
    </div>
  );
}
function RoleSectionHeader({ role }: { role: NormalRole }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ROLE_COLORS[role] }} />
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ROLE_COLORS[role] }}>{ROLE_LABELS[role]}</p>
      <div className="flex-1 h-px bg-[#1c2a3e]" />
    </div>
  );
}
function FounderSection({ goEdit }: { goEdit: () => void }) {
  const f = USER.founder;
  return (
    <div className="space-y-3">
      <SectionCard title="Business" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">{f.company}</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{f.industry} - {f.stage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ScoreChip score={f.readiness} label="Readiness" topFactors={['Product', 'Market', 'Team']} />
            <button className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">View ?</button>
          </div>
        </div>
        <InfoRow label="Founder experience" value={f.experience} />
      </SectionCard>
      <SectionCard title="Founder Skills" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <TagList items={f.skills} />
      </SectionCard>
      <SectionCard title="Interests" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <TagList items={f.interests} accent />
      </SectionCard>
    </div>
  );
}
function InvestorSection({ goEdit }: { goEdit: () => void }) {
  const inv = USER.investor;
  return (
    <div className="space-y-3">
      <SectionCard title="Investment Thesis" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-3">{inv.thesis}</p>
        <InfoRow label="Investor type" value={inv.type} />
        <InfoRow label="Investment range" value={<span className="font-mono tabular-nums text-[color:var(--vv-text)]">{inv.rangeDisplay}</span>} />
        <InfoRow label="Involvement" value={inv.involvement} />
      </SectionCard>
      <SectionCard title="Preferred Industries"><TagList items={inv.industries} accent /></SectionCard>
      <SectionCard title="Preferred Stages"><TagList items={inv.stages} /></SectionCard>
      <SectionCard title="Investment Activity">
        <InfoRow label="Portfolio size" value={<span className="font-mono tabular-nums">{inv.portfolioCount} investments</span>} />
        <InfoRow label="Investing since" value={inv.activeSince} />
        <InfoRow label="Stage breakdown" value={inv.stageSplit} />
        <InfoRow label="Sector focus" value={inv.sectorSplit} />
      </SectionCard>
    </div>
  );
}
function ProfessionalSection({ goEdit }: { goEdit: () => void }) {
  const p = USER.professional;
  return (
    <div className="space-y-3">
      <SectionCard title="Professional Profile" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <InfoRow label="Proficiency" value={p.proficiency} />
        <InfoRow label="Availability" value={p.availability} />
        <InfoRow label="Work preference" value={p.remote} />
        <InfoRow label="Compensation" value={p.comp} />
      </SectionCard>
      <SectionCard title="Professional Skills"><TagList items={p.skills} /></SectionCard>
      <SectionCard title="Areas of Expertise"><TagList items={p.expertise} accent /></SectionCard>
      <SectionCard title="Industry Experience"><TagList items={p.industries} accent /></SectionCard>
      <SectionCard title="Professional Interests"><TagList items={p.interests} accent /></SectionCard>
    </div>
  );
}
function ExperienceSection({ goEdit }: { goEdit: () => void }) {
  return (
    <SectionCard title="Experience" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
      {EXPERIENCE.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-2">No experience added yet.</p>
          <button onClick={goEdit} className="text-[12px] text-[#C67A4E] hover:underline">Add experience ?</button>
        </div>
      ) : (
        <div className="space-y-0">
          {EXPERIENCE.map((e, i) => (
            <div key={i} className="flex gap-3.5 pb-4 last:pb-0">
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#35446A] shrink-0" />
                {i < EXPERIENCE.length - 1 && <div className="w-px flex-1 bg-[#1c2a3e] mt-1.5" />}
              </div>
              <div className="flex-1 min-w-0 pb-4 last:pb-0 border-b border-[#1c2a3e] last:border-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] leading-snug">{e.role}</p>
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono shrink-0">{e.duration}</span>
                </div>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-1.5">{e.org}</p>
                <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
function PortfolioSection({ goEdit }: { goEdit: () => void }) {
  return (
    <SectionCard title="Selected Work" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Add</button>}>
      {PORTFOLIO.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-2">No portfolio items yet.</p>
          <button onClick={goEdit} className="text-[12px] text-[#C67A4E] hover:underline">Add work ?</button>
        </div>
      ) : (
        <div className="space-y-4">
          {PORTFOLIO.map((item, i) => (
            <div key={i} className={`${i < PORTFOLIO.length - 1 ? 'pb-4 border-b border-[#1c2a3e]' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{item.title}</p>
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono shrink-0">{item.year}</span>
              </div>
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-1">{item.role}</p>
              <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-2">{item.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {item.skills.map(s => <span key={s} className="px-2 py-0.5 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[10.5px] text-[color:var(--vv-text-tertiary)]">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

const COMPLETION_ITEMS = [
  { label: 'Add a bio', done: true },
  { label: 'Set location', done: true },
  { label: 'Add founder business', done: true },
  { label: 'Add investor preferences', done: true },
  { label: 'Add professional skills', done: true },
  { label: 'Add portfolio', done: false },
  { label: 'Add availability', done: false },
  { label: 'Apply for Tier 2', done: false },
];

/* modal form panels - all stay mounted to preserve unsaved state */
function SectionHeading({ color, children }: { color?: string; children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: color || '#5E6D8F' }}>{children}</p>;
}

function BasicInfoPanel() {
  return (
    <div className="space-y-4">
      <SectionHeading>Basic Information</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="First name" defaultValue="Alex" />
        <Input label="Last name" defaultValue="Morgan" />
      </div>
      <Input label="Headline" defaultValue={USER.headline} />
      <Textarea label="Bio" defaultValue={USER.bio} rows={4} />
      <Input label="Location" defaultValue={USER.location} />
      <Input label="Company" defaultValue={USER.company} />
      <div className="border-t border-[#1c2a3e] pt-4 space-y-4">
        <SectionHeading>Photos</SectionHeading>
        <PhotoUpload label="Profile photo" isRound initials={USER.initials} />
        <PhotoUpload label="Cover photo" />
      </div>
    </div>
  );
}

function FounderInfoPanel() {
  return (
    <div className="space-y-4">
      <SectionHeading color={ROLE_COLORS.founder}>Founder Information</SectionHeading>
      <Input label="Company / startup name" defaultValue={USER.founder.company} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Industry" options={['FinTech', 'HealthTech', 'AI / ML', 'CleanTech', 'SaaS', 'Other']} defaultValue="FinTech" />
        <Select label="Funding stage" options={['Pre-seed', 'Seed', 'Series A', 'Series B+']} defaultValue="Seed" />
      </div>
      <Select label="Founder experience" options={['First-time founder', '1-2 previous startups', '3+ previous startups', 'Serial entrepreneur']} defaultValue="Serial entrepreneur" />
      <TagPicker label="Founder skills" options={['Product Strategy', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'AI / ML', 'FinTech']} initial={USER.founder.skills} />
      <TagPicker label="Interests" options={['Raising capital', 'Hiring talent', 'Strategic partnerships', 'Mentorship', 'Market validation']} initial={USER.founder.interests} />
    </div>
  );
}

function ProfessionalInfoPanel() {
  return (
    <div className="space-y-4">
      <SectionHeading color={ROLE_COLORS.professional}>Professional Information</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Proficiency" options={['Junior (1-3 yrs)', 'Mid-level (3-7 yrs)', 'Senior (7-12 yrs)', 'Principal (12+ yrs)']} defaultValue="Senior (7-12 yrs)" />
        <Select label="Availability" options={['Full-time', 'Part-time (10-20h/wk)', 'Advisory (5h/wk)', 'Project-based']} defaultValue="Part-time advisory" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Work preference" options={['Remote only', 'Hybrid', 'On-site preferred', 'Flexible']} defaultValue="Flexible" />
        <Select label="Compensation" options={['Salary', 'Equity + salary', 'Equity only', 'Advisory fee', 'Open to discuss']} defaultValue="Equity + advisory fee" />
      </div>
      <TagPicker label="Skills" options={['Engineering', 'Go', 'React', 'Product', 'Design', 'Data Analysis', 'Distributed Systems', 'DevOps']} initial={USER.professional.skills} />
      <TagPicker label="Industry experience" options={['FinTech', 'HealthTech', 'SaaS', 'AI / ML', 'E-commerce', 'Enterprise', 'Consumer']} initial={USER.professional.industries} />
      <TagPicker label="Areas of expertise" options={['Technical Due Diligence', 'Go-to-Market Strategy', 'Investor Relations', 'Financial Modeling', 'Startup Scaling', 'Product Strategy', 'Market Research', 'Strategic Planning', 'Board Advisory', 'Operations']} initial={USER.professional.expertise} />
      <TagPicker label="Professional interests" options={['Founding engineer roles', 'CTO advisory', 'Technical co-founder search', 'Fractional work', 'Board advisory']} initial={USER.professional.interests} />
    </div>
  );
}

function InvestorInfoPanel() {
  return (
    <div className="space-y-4">
      <SectionHeading color={ROLE_COLORS.investor}>Investor Information</SectionHeading>
      <Select label="Investor type" options={['Angel investor', 'VC fund', 'Family office', 'Corporate VC', 'Syndicate']} defaultValue="Angel investor" />
      <Textarea label="Investment thesis" defaultValue={USER.investor.thesis} rows={2} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Min ticket (?)" options={['BDT 1 lakh', 'BDT 5 lakh', 'BDT 10 lakh', 'BDT 25 lakh', 'BDT 50 lakh', 'BDT 1 crore+']} defaultValue="BDT 5 lakh" />
        <Select label="Max ticket (?)" options={['BDT 10 lakh', 'BDT 50 lakh', 'BDT 1 crore', 'BDT 5 crore', 'BDT 10 crore+']} defaultValue="BDT 50 lakh" />
      </div>
      <TagPicker label="Preferred industries" options={['FinTech', 'HealthTech', 'AI / ML', 'CleanTech', 'SaaS', 'EdTech', 'DeepTech', 'Consumer']} initial={USER.investor.industries} />
      <TagPicker label="Preferred stage" options={['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth']} initial={USER.investor.stages} />
      <Select label="Involvement" options={['Passive (capital only)', 'Light-touch (board observer)', 'Active (board seat)', 'Hands-on']} defaultValue="Light-touch (board observer)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Portfolio size (investments)" defaultValue={String(USER.investor.portfolioCount)} />
        <Input label="Investing since" defaultValue={USER.investor.activeSince} />
      </div>
    </div>
  );
}

function ExperiencePanel() {
  const [entries, setEntries] = useState(EXPERIENCE.map((e, i) => ({ ...e, id: i })));
  const [portfolio, setPortfolio] = useState(PORTFOLIO.map((p, i) => ({ ...p, id: i })));
  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>Experience</SectionHeading>
        <div className="space-y-5">
          {entries.map((e, i) => (
            <div key={e.id} className={`space-y-3 ${i < entries.length - 1 ? 'pb-5 border-b border-[color:var(--vv-border)]' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Entry {i + 1}</span>
                <button type="button" onClick={() => setEntries(entries.filter(x => x.id !== e.id))}
                  className="text-[11px] text-[#F04438] hover:underline">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Role / Title" defaultValue={e.role} />
                <Input label="Organization" defaultValue={e.org} />
              </div>
              <Input label="Duration" defaultValue={e.duration} />
              <Textarea label="Description" defaultValue={e.desc} rows={2} />
            </div>
          ))}
        </div>
        <button type="button"
          onClick={() => setEntries([...entries, { role: '', org: '', duration: '', desc: '', id: Date.now() }])}
          className="flex items-center gap-1.5 text-[12px] text-[#C67A4E] hover:underline mt-4">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Add experience
        </button>
      </div>

      <div className="border-t border-[color:var(--vv-border)] pt-5">
        <SectionHeading>Selected Work / Portfolio</SectionHeading>
        <div className="space-y-5">
          {portfolio.map((item, i) => (
            <div key={item.id} className={`space-y-3 ${i < portfolio.length - 1 ? 'pb-5 border-b border-[color:var(--vv-border)]' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">Work {i + 1}</span>
                <button type="button" onClick={() => setPortfolio(portfolio.filter(x => x.id !== item.id))}
                  className="text-[11px] text-[#F04438] hover:underline">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Project / Work title" defaultValue={item.title} />
                <Input label="Year" defaultValue={item.year} />
              </div>
              <Input label="Your role" defaultValue={item.role} />
              <Textarea label="Description" defaultValue={item.desc} rows={2} />
              <Input label="Link (optional)" placeholder="https://-" />
            </div>
          ))}
        </div>
        <button type="button"
          onClick={() => setPortfolio([...portfolio, { title: '', desc: '', role: '', skills: [], year: '', id: Date.now() }])}
          className="flex items-center gap-1.5 text-[12px] text-[#C67A4E] hover:underline mt-4">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Add work item
        </button>
      </div>
    </div>
  );
}

function PreferencesPanel() {
  return (
    <div className="space-y-5">
      <SectionHeading>Preferences</SectionHeading>
      <div className="space-y-4">
        <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Visibility & Contact</p>
        <Select label="Profile visibility" options={['Public (discoverable by all)', 'Verified only', 'Private (invitation only)']} />
        <Select label="Contact preference" options={['Platform messages only', 'Allow direct email', 'Public contact info']} />
      </div>
      <div className="border-t border-[color:var(--vv-border)] pt-4 space-y-3">
        <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-3">Notifications</p>
        {['Match Score updates', 'New connection requests', 'Deal Room activity', 'Verification status changes'].map(item => (
          <label key={item} className="flex items-center justify-between cursor-pointer">
            <span className="text-[12.5px] text-[color:var(--vv-text-secondary)]">{item}</span>
            <div className="relative w-8 rounded-full bg-[#C67A4E]/80 flex-shrink-0" style={{ height: 18 }}>
              <div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 rounded-full bg-white" />
            </div>
          </label>
        ))}
      </div>
      <div className="border-t border-[color:var(--vv-border)] pt-4">
        <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-3">Account</p>
        <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-3">Password and authentication settings are managed separately for security.</p>
        <Button variant="secondary" size="sm">Change password</Button>
      </div>
    </div>
  );
}

/* section icons for modal nav */
const NAV_ICONS: Record<ModalSection, React.ReactNode> = {
  'Basic Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  'Founder Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  'Professional Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  'Investor Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  'Experience': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  'Preferences': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
      <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
      <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none"/>
    </svg>
  ),
};

/* edit profile modal */
function EditProfileModal({
  open, onClose, onSave, initialSection = 'Basic Information',
}: {
  open: boolean; onClose: () => void; onSave: () => void; initialSection?: ModalSection;
}) {
  const [active, setActive] = useState<ModalSection>(initialSection);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (open) setActive(initialSection); }, [open, initialSection]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => { setSaved(true); setTimeout(() => { setSaved(false); onSave(); }, 1400); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[880px] max-h-[90vh] flex flex-col vv-glass-elevated border border-[color:var(--vv-border)] rounded-[14px] shadow-2xl overflow-hidden">

        {/* header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-[color:var(--vv-border)] flex-shrink-0">
          <div>
            <h2 id="edit-profile-title" className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Edit Profile</h2>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Update your profile information and preferences.</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="ml-4 w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-all flex-shrink-0">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* mobile section selector */}
        <div className="sm:hidden border-b border-[color:var(--vv-border)] px-4 py-2.5 flex-shrink-0">
          <select value={active} onChange={e => setActive(e.target.value as ModalSection)}
            className="w-full h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[#C67A4E]">
            {MODAL_SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* left nav - desktop */}
          <div className="hidden sm:flex flex-col w-[188px] border-r border-[color:var(--vv-border)] py-2 flex-shrink-0 overflow-y-auto">
            {MODAL_SECTIONS.map(sec => {
              const isActive = active === sec;
              return (
                <button key={sec} onClick={() => setActive(sec)}
                  style={isActive ? { boxShadow: 'inset 2px 0 0 #C5A059' } : {}}
                  className={`text-left px-3.5 py-2.5 text-[12px] font-medium transition-all flex items-center gap-2.5 ${
                    isActive ? 'text-[color:var(--vv-text)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]'
                  }`}>
                  <span style={isActive ? { color: '#C5A059' } : { color: '#5E6D8F' }}>{NAV_ICONS[sec]}</span>
                  {sec}
                </button>
              );
            })}
          </div>

          {/* right content - scrollable */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#35446A] [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="px-5 sm:px-6 py-5">
              {/* all panels stay mounted - CSS hidden preserves state */}
              <div className={active !== 'Basic Information' ? 'hidden' : ''}><BasicInfoPanel /></div>
              <div className={active !== 'Founder Information' ? 'hidden' : ''}><FounderInfoPanel /></div>
              <div className={active !== 'Professional Information' ? 'hidden' : ''}><ProfessionalInfoPanel /></div>
              <div className={active !== 'Investor Information' ? 'hidden' : ''}><InvestorInfoPanel /></div>
              <div className={active !== 'Experience' ? 'hidden' : ''}><ExperiencePanel /></div>
              <div className={active !== 'Preferences' ? 'hidden' : ''}><PreferencesPanel /></div>
            </div>
          </div>
        </div>

        {/* fixed footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-[color:var(--vv-border)] flex-shrink-0" style={{ background: 'rgba(9,10,15,0.55)', backdropFilter: 'blur(8px)' }}>
          <p className="text-[11px] text-[#35446A] hidden sm:block">Changes are saved to your profile.</p>
          <div className="flex items-center gap-2.5 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>
              {saved
                ? <span className="flex items-center gap-1.5"><svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>Saved</span>
                : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* manage roles modal */
function ManageRolesModal({ onClose, onEditProfile }: { onClose: () => void; onEditProfile: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="manage-profile-roles-title">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border)] rounded-[12px] w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
          <p id="manage-profile-roles-title" className="text-[14px] font-semibold text-[color:var(--vv-text)]">Manage Roles</p>
          <button onClick={onClose} aria-label="Close profile roles" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-2">
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3">Your active roles on Vault Ventures. Removing a role removes workspace access but does not delete your account or data.</p>
          {DEMO_USER_ROLES.map(r => (
            <div key={r} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[r] }} />
                <span className="text-[13px] font-medium text-[color:var(--vv-text)]">{ROLE_LABELS[r]}</span>
                <Badge variant="success" dot>Active</Badge>
              </div>
              <button className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[#F04438] transition-colors">Remove</button>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[color:var(--vv-border)]">
          <Button className="w-full" onClick={() => { onClose(); onEditProfile(); }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mr-1.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Role
          </Button>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="flex items-center gap-1 text-[12px] text-[color:var(--vv-text-tertiary)]">{icon}{children}</span>;
}
const IconPin = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>;
const IconBuilding = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M9 9V5h6v4"/></svg>;
const IconCal = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;

/* main */
export default function Profile() {
  const { role } = useRole();
  const { session, isAdmin } = useAuth();
  const [section, setSection] = useState<Section>('Overview');
  const [manageRoles, setManageRoles] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSection, setEditSection] = useState<ModalSection>('Basic Information');
  const [prefSaved, setPrefSaved] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [photoDraft, setPhotoDraft] = useState<{ kind: 'avatar' | 'cover'; url: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isOwnProfile = !isAdmin && session.user !== null;

  const completedCount = COMPLETION_ITEMS.filter(i => i.done).length;
  const completionPct = Math.round((completedCount / COMPLETION_ITEMS.length) * 100);

  const openEdit = (sec: ModalSection = 'Basic Information') => {
    setEditSection(sec);
    setEditOpen(true);
  };

  const currentTier = USER.tier;

  const openPhotoPicker = (kind: 'avatar' | 'cover') => {
    photoInputRef.current?.setAttribute('data-kind', kind);
    photoInputRef.current?.click();
  };

  const handlePhotoSelected = (file: File | undefined) => {
    if (!file || !file.type.match(/^image\/(jpeg|png|webp)$/i)) return;
    const kind = photoInputRef.current?.getAttribute('data-kind') as 'avatar' | 'cover' | null;
    if (!kind) return;
    if (photoDraft) URL.revokeObjectURL(photoDraft.url);
    setPhotoDraft({ kind, url: URL.createObjectURL(file) });
  };

  const cancelPhotoDraft = () => {
    if (photoDraft) URL.revokeObjectURL(photoDraft.url);
    setPhotoDraft(null);
  };

  const savePhotoDraft = () => {
    if (!photoDraft) return;
    if (photoDraft.kind === 'avatar') {
      if (avatarImage) URL.revokeObjectURL(avatarImage);
      setAvatarImage(photoDraft.url);
    } else {
      if (coverImage) URL.revokeObjectURL(coverImage);
      setCoverImage(photoDraft.url);
    }
    setPhotoDraft(null);
  };

  return (
    <div className="max-w-[960px] mx-auto pb-10">
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} onSave={() => setEditOpen(false)} initialSection={editSection} />
      {manageRoles && (
        <ManageRolesModal onClose={() => setManageRoles(false)} onEditProfile={() => { setManageRoles(false); openEdit(); }} />
      )}
      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
        aria-label="Choose a profile or cover photo" onChange={e => handlePhotoSelected(e.target.files?.[0])} />

      {/* breadcrumb */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Profile</span>
      </div>

      {/* profile card */}
      <div className="mx-5 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden mb-4">
        <CoverBanner image={photoDraft?.kind === 'cover' ? photoDraft.url : coverImage} editable={isOwnProfile} onEdit={() => openPhotoPicker('cover')} />
        <div className="px-5 -mt-12 pb-5">
          {/* avatar + actions */}
          <div className="flex items-start justify-between gap-4">
            <Avatar initials={USER.initials} size={96} image={photoDraft?.kind === 'avatar' ? photoDraft.url : avatarImage} editable={isOwnProfile} onEdit={() => openPhotoPicker('avatar')} />
            <div className="flex items-center gap-2 pt-14 flex-wrap justify-end">
              <Button variant="ghost" size="sm" onClick={() => setManageRoles(true)}>Manage Roles</Button>
              <DotsMenu onEditProfile={() => openEdit('Basic Information')} />
            </div>
          </div>
          {isOwnProfile && photoDraft && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-[color:var(--vv-border)] bg-[color:var(--vv-raised)] px-3 py-2">
              <span className="text-[11.5px] text-[color:var(--vv-text-secondary)]">Previewing {photoDraft.kind === 'avatar' ? 'profile' : 'cover'} photo</span>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={cancelPhotoDraft} className="text-[11.5px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)]">Cancel</button>
                <Button variant="primary" size="sm" onClick={savePhotoDraft}>Save photo</Button>
              </div>
            </div>
          )}

          {/* identity */}
          <div className="mt-3">
            <h1 className="font-display text-[22px] font-bold text-[color:var(--vv-text)] leading-tight tracking-tight">{USER.name}</h1>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {DEMO_USER_ROLES.map(r => (
                <span key={r} className="px-2 py-0.5 rounded border text-[10.5px] font-semibold uppercase tracking-wide"
                  style={{ borderColor: `${ROLE_COLORS[r]}40`, color: ROLE_COLORS[r], background: `${ROLE_COLORS[r]}0f` }}>
                  {ROLE_LABELS[r]}
                </span>
              ))}
              <VerificationBadge tier={currentTier} />
            </div>
            <p className="text-[13.5px] text-[color:var(--vv-text-secondary)] mt-1.5 leading-snug">{USER.headline}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
              <Meta icon={<IconPin />}>{USER.location}</Meta>
              <span className="text-[#35446A] text-[10px]">-</span>
              <Meta icon={<IconBuilding />}>{USER.company}</Meta>
              <span className="text-[#35446A] text-[10px]">-</span>
              <Meta icon={<IconCal />}>Member since {USER.since}</Meta>
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-24 h-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 70 ? '#22C55E' : '#F59E0B' }} />
              </div>
              <span className="text-[11px] font-mono tabular-nums" style={{ color: completionPct >= 70 ? '#22C55E' : '#F59E0B' }}>{completionPct}% complete</span>
              {completionPct < 100 && (
                <button onClick={() => openEdit('Basic Information')} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">
                  Complete profile ?
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="mx-5 flex border-b border-[color:var(--vv-border)] mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`flex-shrink-0 px-4 py-2.5 text-[12.5px] font-medium border-b-2 transition-colors ${
              section === s ? 'border-[#C67A4E] text-[color:var(--vv-text)]' : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="px-5">

        {/* overview */}
        {section === 'Overview' && (() => {
          const activeNormal = (['founder', 'investor', 'professional'] as NormalRole[]).includes(role as NormalRole)
            ? role as NormalRole
            : 'founder';
          const roleOrder = [activeNormal, ...(['founder', 'investor', 'professional'] as NormalRole[]).filter(r => r !== activeNormal)];
          const RoleSection = ({ r }: { r: NormalRole }) => {
            if (r === 'founder') return <FounderSection goEdit={() => openEdit('Founder Information')} />;
            if (r === 'investor') return <InvestorSection goEdit={() => openEdit('Investor Information')} />;
            return <ProfessionalSection goEdit={() => openEdit('Professional Information')} />;
          };
          const editSectionFor: Record<NormalRole, ModalSection> = { founder: 'Founder Information', investor: 'Investor Information', professional: 'Professional Information' };
          return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-6">
              <SectionCard title="About" action={<button onClick={() => openEdit('Basic Information')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
                <Bio text={USER.bio} onEdit={() => openEdit('Basic Information')} />
              </SectionCard>
              {roleOrder.map(r => (
                <div key={r}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ROLE_COLORS[r] }} />
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ROLE_COLORS[r] }}>{ROLE_LABELS[r]}</p>
                    {r === activeNormal && <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-medium">- active workspace</span>}
                    <div className="flex-1 h-px bg-[#1c2a3e]" />
                    <button onClick={() => openEdit(editSectionFor[r])} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">Edit</button>
                  </div>
                  <RoleSection r={r} />
                </div>
              ))}
              <ExperienceSection goEdit={() => openEdit('Experience')} />
              <PortfolioSection goEdit={() => openEdit('Experience')} />
            </div>

            {/* right rail */}
            <div className="space-y-3">
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2a3e]">
                  <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Profile Completion</p>
                  <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: completionPct >= 70 ? '#22C55E' : '#F59E0B' }}>{completionPct}%</span>
                </div>
                <div className="px-4 pt-3 pb-2">
                  <div className="h-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 70 ? '#22C55E' : '#F59E0B' }} />
                  </div>
                  <div className="space-y-1.5 pb-2">
                    {COMPLETION_ITEMS.map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${item.done ? 'bg-[#22C55E]/20 border-[#22C55E]/40' : 'border-[color:var(--vv-border-strong)]'}`}>
                          {item.done && <svg width="7" height="7" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>}
                        </div>
                        <span className={`text-[11.5px] leading-tight ${item.done ? 'text-[color:var(--vv-text-tertiary)] line-through' : 'text-[color:var(--vv-text-secondary)]'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  {completionPct < 100 && (
                    <button onClick={() => openEdit('Basic Information')} className="w-full text-center text-[11.5px] text-[#C67A4E] hover:underline py-1.5">
                      Complete Profile ?
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2a3e]">
                  <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Verification</p>
                  <button onClick={() => setSection('Verification')} className="text-[10.5px] text-[#C67A4E] hover:underline">Details ?</button>
                </div>
                <div className="px-4 py-3.5 space-y-2">
                  {/* Current status */}
                  <div className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-md" style={{ background: currentTier > 0 ? 'rgba(201,162,75,0.06)' : 'rgba(94,109,143,0.08)', border: `1px solid ${currentTier > 0 ? 'rgba(201,162,75,0.18)' : 'rgba(94,109,143,0.15)'}` }}>
                    {currentTier > 0
                      ? <svg width="12" height="12" fill="none" stroke="#C9A24B" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      : <svg width="12" height="12" fill="none" stroke="#5E6D8F" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] font-medium" style={{ color: currentTier > 0 ? '#C9A24B' : '#5E6D8F' }}>
                        {currentTier === 0 && 'Not Verified'}
                        {currentTier === 1 && 'Identity Verified'}
                        {currentTier >= 2 && 'Track-record Verified'}
                      </p>
                    </div>
                    {currentTier > 0 && <VerificationBadge tier={currentTier} />}
                  </div>

                  {/* Tier steps compact */}
                  <div className="space-y-1.5 pt-0.5">
                    {[
                      { n: 1, label: 'Tier 1 - Identity' },
                      { n: 2, label: 'Tier 2 - Track-record' },
                    ].map(t => (
                      <div key={t.n} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${currentTier >= t.n ? 'bg-[rgba(34,197,94,0.2)] border border-[rgba(34,197,94,0.4)]' : 'border border-[color:var(--vv-border-strong)]'}`}>
                          {currentTier >= t.n && <svg width="7" height="7" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 12l5 5L20 7"/></svg>}
                        </div>
                        <span className={`text-[11.5px] ${currentTier >= t.n ? 'text-[color:var(--vv-text-tertiary)] line-through' : 'text-[color:var(--vv-text-secondary)]'}`}>{t.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[#1c2a3e] my-1" />
                  <button onClick={() => setSection('Verification')} className="text-[11.5px] text-[#C67A4E] hover:underline">
                    {currentTier === 0 ? 'Apply for Tier 1 ?' : currentTier === 1 ? 'Apply for Tier 2 ?' : 'View verification ?'}
                  </button>
                </div>
              </div>

              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1c2a3e]">
                  <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Active Roles</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {DEMO_USER_ROLES.map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ROLE_COLORS[r] }} />
                      <span className="text-[12px] text-[color:var(--vv-text-secondary)] font-medium">{ROLE_LABELS[r]}</span>
                      {r === activeNormal && <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">- active</span>}
                    </div>
                  ))}
                  <button onClick={() => setManageRoles(true)} className="text-[11.5px] text-[#C67A4E] hover:underline pt-1 block">
                    Manage roles ?
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* verification */}
        {section === 'Verification' && (
          <div className="max-w-2xl space-y-4">

            {/* Status banner */}
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={currentTier > 0
                    ? { background: 'rgba(201,162,75,0.12)', border: '1px solid rgba(201,162,75,0.28)' }
                    : { background: 'rgba(94,109,143,0.12)', border: '1px solid rgba(94,109,143,0.2)' }}>
                  {currentTier > 0 ? (
                    <svg width="18" height="18" fill="none" stroke="#C9A24B" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="#5E6D8F" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-[14px] font-semibold text-[color:var(--vv-text)]">
                      {currentTier === 0 && 'Not Verified'}
                      {currentTier === 1 && 'Identity Verified'}
                      {currentTier >= 2 && 'Track-record Verified'}
                    </h3>
                    <VerificationBadge tier={currentTier} />
                  </div>
                  <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed">
                    {currentTier === 0 && 'Complete identity verification to unlock full platform access, investor discovery, and deal room participation.'}
                    {currentTier === 1 && 'Your identity has been confirmed. Apply for Tier 2 to verify your professional track record and unlock priority matching.'}
                    {currentTier >= 2 && 'Your identity and professional background are verified. You have full access to all platform features.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tier steps */}
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1c2a3e]">
                <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Verification Steps</p>
              </div>

              {/* Tier 1 */}
              <div className="px-5 py-4 border-b border-[#1c2a3e]">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={currentTier >= 1
                      ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }
                      : { background: 'rgba(198,122,78,0.10)', border: '1px solid rgba(198,122,78,0.28)' }}>
                    {currentTier >= 1
                      ? <svg width="13" height="13" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7"/></svg>
                      : <span className="text-[11px] font-bold text-[#C67A4E]">1</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Tier 1 - Identity Verified</p>
                      {currentTier >= 1
                        ? <Badge variant="success" dot>Complete</Badge>
                        : <Badge variant="warning">Action required</Badge>}
                    </div>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug mb-2.5">
                      Government-issued photo ID and a short liveness check. Confirms you are who you say you are.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Full investor discovery', 'Deal Room access', 'Verified member badge', 'Connection requests'].map(b => (
                        <span key={b} className={`px-2 py-0.5 rounded text-[10.5px] border ${currentTier >= 1 ? 'bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.2)] text-[#22C55E]' : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border)] text-[color:var(--vv-text-tertiary)]'}`}>{b}</span>
                      ))}
                    </div>
                  </div>
                  {currentTier < 1 && (
                    <Button size="sm" className="shrink-0 mt-0.5">Apply</Button>
                  )}
                </div>
              </div>

              {/* Tier 2 */}
              <div className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={currentTier >= 2
                      ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }
                      : currentTier === 1
                        ? { background: 'rgba(198,122,78,0.10)', border: '1px solid rgba(198,122,78,0.28)' }
                        : { background: 'rgba(26,28,29,0.8)', border: '1px solid rgba(94,109,143,0.18)' }}>
                    {currentTier >= 2
                      ? <svg width="13" height="13" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7"/></svg>
                      : <span className={`text-[11px] font-bold ${currentTier === 1 ? 'text-[#C67A4E]' : 'text-[#35446A]'}`}>2</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className={`text-[13px] font-semibold ${currentTier >= 1 ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)]'}`}>
                        Tier 2 - Track-record Verified
                      </p>
                      {currentTier >= 2
                        ? <Badge variant="success" dot>Complete</Badge>
                        : currentTier === 1
                          ? <Badge variant="accent">Available</Badge>
                          : <Badge variant="neutral">Requires Tier 1</Badge>}
                    </div>
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] leading-snug mb-2.5">
                      Business registration, employment record, or professional affiliation. Confirms your professional background and track record.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Priority matching', 'Featured in discovery', 'Expanded deal terms', 'Trust signal to counterparties'].map(b => (
                        <span key={b} className={`px-2 py-0.5 rounded text-[10.5px] border ${currentTier >= 2 ? 'bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.2)] text-[#22C55E]' : currentTier === 1 ? 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border)] text-[color:var(--vv-text-tertiary)]' : 'bg-[#111213] border-[#1c2a3e] text-[#35446A] opacity-60'}`}>{b}</span>
                      ))}
                    </div>
                  </div>
                  {currentTier === 1 && (
                    <Button size="sm" className="shrink-0 mt-0.5">Apply</Button>
                  )}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="space-y-1.5 px-1">
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">Verification is reviewed by the Vault Ventures compliance team. Processing typically takes 1-3 business days.</p>
              <p className="text-[11px] text-[#35446A] leading-snug">Verification confirms identity and professional background. It is not a financial certification, legal guarantee, or investment recommendation.</p>
            </div>
          </div>
        )}

        {/* preferences */}
        {section === 'Preferences' && (
          <div className="space-y-4 max-w-2xl">
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-5">
              <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-4">Visibility & Contact</p>
              <div className="space-y-3.5">
                <Select label="Profile visibility" options={['Public (discoverable by all)', 'Verified only', 'Private (invitation only)']} />
                <Select label="Contact preference" options={['Platform messages only', 'Allow direct email', 'Public contact info']} />
              </div>
            </div>
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-5">
              <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-4">Notifications</p>
              <div className="space-y-3">
                {['Match Score updates', 'New connection requests', 'Deal Room activity', 'Verification status changes'].map(item => (
                  <label key={item} className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] text-[color:var(--vv-text-secondary)]">{item}</span>
                    <div className="relative w-8 rounded-full bg-[#C67A4E]/80 flex-shrink-0" style={{ height: 18 }}>
                      <div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 rounded-full bg-white" />
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-5">
              <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest mb-3">Account</p>
              <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-3">Password and authentication settings are managed separately for security.</p>
              <Button variant="secondary" size="sm">Change password</Button>
            </div>
            <div className="flex justify-end">
              <Button size="md" onClick={() => { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 2000); }}>
                {prefSaved ? 'Saved' : 'Save preferences'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}