import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ParticipantVerification from '../../components/verification/ParticipantVerification';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useRole } from '../../components/layout/AppShell';
import { useAuth, NormalRole } from '../../context/AuthContext';
import { api, ExperienceItem, PortfolioItem, UserProfileResponseData, resolveMediaUrl } from '../../services/api';
import { ScoreChip } from '../../components/ui/ScoreComponents';
import { ManageRolesModal } from '../../components/layout/ManageRolesModal';
import { useToast } from '../../components/ui/Feedback';

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

/* form atoms */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] focus:outline-none focus:border-[#C67A4E] transition-colors"
      />
    </Field>
  );
}

function Textarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[#5E6D8F] focus:outline-none focus:border-[#C67A4E] transition-colors resize-none leading-relaxed"
      />
    </Field>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value ?? options[0]}
        onChange={onChange}
        className="w-full h-9 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[13px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[#C67A4E] transition-colors"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

function TagPicker({
  label,
  options,
  selected = [],
  onChange,
}: {
  label: string;
  options: string[];
  selected?: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(active ? selected.filter((s) => s !== o) : [...selected, o])}
              className={`px-2.5 py-1 rounded text-[11.5px] font-medium border transition-all ${
                active
                  ? 'bg-[rgba(198,122,78,0.10)] border-[#C67A4E] text-[#C67A4E]'
                  : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:border-[#5E6D8F] hover:text-[color:var(--vv-text-secondary)]'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/* cover banner */
function CoverBanner({
  image,
  editable,
  onEdit,
  isUploading,
}: {
  image: string | null;
  editable: boolean;
  onEdit: () => void;
  isUploading?: boolean;
}) {
  const resolvedImage = resolveMediaUrl(image);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 148,
        backgroundImage: resolvedImage ? `url("${resolvedImage}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!resolvedImage && <div className="absolute inset-0 bg-gradient-to-br from-[#212324] via-[#1A1C1D] to-[#0B0C0E]" />}
      {!resolvedImage && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 960 148" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <pattern id="pg" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#C67A4E" strokeWidth="0.3" strokeOpacity="0.15" />
            </pattern>
            <radialGradient id="glow" cx="30%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#C67A4E" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#C67A4E" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111213" stopOpacity="0" />
              <stop offset="100%" stopColor="#1A1C1D" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <rect width="960" height="148" fill="url(#pg)" />
          <rect width="960" height="148" fill="url(#glow)" />
          {[[120, 36], [240, 88], [380, 28], [480, 72], [600, 40], [720, 96], [840, 52], [920, 80], [60, 110], [300, 118], [540, 108], [780, 120]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#C67A4E" fillOpacity="0.35" />
          ))}
          {[[120, 36, 240, 88], [240, 88, 380, 28], [380, 28, 480, 72], [480, 72, 600, 40], [600, 40, 720, 96], [720, 96, 840, 52], [840, 52, 920, 80], [120, 36, 60, 110], [240, 88, 300, 118], [480, 72, 540, 108], [720, 96, 780, 120]].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C67A4E" strokeWidth="0.6" strokeOpacity="0.18" />
          ))}
          <path d="M0 148 Q240 80 480 120 Q720 160 960 100" fill="none" stroke="#C67A4E" strokeWidth="0.8" strokeOpacity="0.1" />
          <rect x="0" y="90" width="960" height="58" fill="url(#bottomFade)" />
        </svg>
      )}
      {resolvedImage && <div className="absolute inset-0 bg-black/25" aria-hidden="true" />}
      {editable && (
        <button
          type="button"
          onClick={onEdit}
          disabled={isUploading}
          aria-label="Edit cover photo"
          title="Edit cover photo"
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          {isUploading ? 'Uploading...' : 'Edit cover'}
        </button>
      )}
    </div>
  );
}

/* avatar */
function Avatar({
  initials,
  size = 96,
  image,
  editable,
  onEdit,
  isUploading,
}: {
  initials: string;
  size?: number;
  image: string | null;
  editable: boolean;
  onEdit: () => void;
  isUploading?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [prevImage, setPrevImage] = useState(image);
  const resolvedImage = resolveMediaUrl(image);

  if (image !== prevImage) {
    setPrevImage(image);
    setImgError(false);
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        style={{ width: size, height: size, borderWidth: 4, borderColor: '#121A2B' }}
        className="rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-solid flex items-center justify-center text-[#C67A4E] font-semibold ring-1 ring-[#35446A] overflow-hidden"
      >
        {resolvedImage && !imgError ? (
          <img
            src={resolvedImage}
            alt="Profile"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: size * 0.33 }}>{initials}</span>
        )}
      </div>
      {editable && (
        <button
          type="button"
          onClick={onEdit}
          disabled={isUploading}
          aria-label="Edit profile photo"
          title="Edit profile photo"
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--vv-surface)] bg-[color:var(--vv-copper)] text-[color:var(--vv-on-copper)] shadow-md transition-colors hover:bg-[color:var(--vv-copper-warm)] focus-visible:outline-none"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
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
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile actions"
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:border-[#5E6D8F] hover:bg-[color:var(--vv-raised)] transition-all"
      >
        <svg width="14" height="4" fill="currentColor" viewBox="0 0 20 4">
          <circle cx="2" cy="2" r="2" />
          <circle cx="10" cy="2" r="2" />
          <circle cx="18" cy="2" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] py-1.5 z-40 shadow-2xl">
          <button
            onClick={() => {
              setOpen(false);
              onEditProfile();
            }}
            className="w-full text-left px-3.5 py-2 text-[12.5px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] flex items-center gap-2.5 transition-colors"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828A2 2 0 0110.414 16.414H9v-1.414z" />
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
  const display = long && !expanded ? text.slice(0, LIMIT).trimEnd() + '…' : text;
  if (!text) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)] italic">
          Add a short introduction to help others understand your background.
        </p>
        <button onClick={onEdit} className="text-[12px] text-[#C67A4E] hover:underline shrink-0">
          Add bio →
        </button>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[13px] text-[color:var(--vv-text-secondary)] leading-relaxed">{display}</p>
      {long && (
        <button onClick={() => setExpanded((e) => !e)} className="text-[12px] text-[#C67A4E] hover:underline mt-1.5">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

/* section card */
function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
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
  if (!items || items.length === 0) return <span className="text-[12px] text-[color:var(--vv-text-tertiary)] italic">None specified</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span
          key={s}
          className={`px-2.5 py-1 rounded text-[11.5px] border ${
            accent
              ? 'bg-[rgba(198,122,78,0.08)] border-[rgba(198,122,78,0.20)] text-[#C67A4E]'
              : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-secondary)]'
          }`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function FounderSection({
  business,
  goEdit,
}: {
  business?: { company?: string; industry?: string; stage?: string; experience?: string; skills?: string[]; interests?: string[] } | null;
  goEdit: () => void;
}) {
  const company = business?.company || 'Founder Venture';
  const industry = business?.industry || 'Startup';
  const stage = business?.stage || 'Early Stage';
  const experience = business?.experience || 'Entrepreneur';
  const skills = business?.skills || ['Product Strategy', 'Business Development'];
  const interests = business?.interests || ['Raising Capital', 'Strategic Partnerships'];

  return (
    <div className="space-y-3">
      <SectionCard title="Business" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-0.5">{company}</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{industry} • {stage}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ScoreChip score={75} label="Readiness" topFactors={['Product', 'Market', 'Team']} />
          </div>
        </div>
        <InfoRow label="Founder experience" value={experience} />
      </SectionCard>
      <SectionCard title="Founder Skills" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <TagList items={skills} />
      </SectionCard>
      <SectionCard title="Interests" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <TagList items={interests} accent />
      </SectionCard>
    </div>
  );
}

function InvestorSection({
  investorData,
  goEdit,
  onManagePreferences,
}: {
  investorData?: {
    thesis?: string;
    type?: string;
    minimum_investment?: number | string;
    maximum_investment?: number | string;
    involvement?: string;
    industry?: string;
    business_stage?: string;
    investment_types?: string[];
    location?: string;
  } | null;
  goEdit: () => void;
  onManagePreferences?: () => void;
}) {
  const thesis = investorData?.thesis || 'Backing high-growth ventures and ambitious founders.';
  const type = investorData?.type || 'Angel Investor';
  const minTicket = investorData?.minimum_investment ? `BDT ${Number(investorData.minimum_investment).toLocaleString()}` : 'BDT 50,000';
  const maxTicket = investorData?.maximum_investment ? `BDT ${Number(investorData.maximum_investment).toLocaleString()}` : 'BDT 5,000,000';
  const rangeDisplay = `${minTicket} - ${maxTicket}`;
  const involvement = investorData?.involvement || 'Active / Advisory';
  const industries = investorData?.industry ? [investorData.industry] : ['FinTech', 'AI & Data'];
  const stages = investorData?.business_stage ? [investorData.business_stage] : ['Seed', 'Early Stage'];

  return (
    <div className="space-y-3">
      <SectionCard
        title="Investment Thesis"
        action={
          <div className="flex items-center gap-3">
            {onManagePreferences && (
              <button
                type="button"
                onClick={onManagePreferences}
                className="text-[11.5px] text-[#C67A4E] hover:underline font-medium"
              >
                Manage Investment Preferences →
              </button>
            )}
            <button type="button" onClick={goEdit} className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">
              Edit
            </button>
          </div>
        }
      >
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-3">{thesis}</p>
        <InfoRow label="Investor type" value={type} />
        <InfoRow label="Investment range" value={<span className="font-mono tabular-nums text-[color:var(--vv-text)]">{rangeDisplay}</span>} />
        <InfoRow label="Involvement" value={involvement} />
        {investorData?.location && <InfoRow label="Location mandate" value={investorData.location} />}
      </SectionCard>
      <SectionCard title="Preferred Industries">
        <TagList items={industries} accent />
      </SectionCard>
      <SectionCard title="Preferred Stages">
        <TagList items={stages} />
      </SectionCard>
      {onManagePreferences && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[10px] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] border border-[color:var(--vv-border)]">
          <div>
            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">Full Investment Preferences</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Configure risk appetite, available capital, target sectors, and matching criteria.</p>
          </div>
          <button
            type="button"
            onClick={onManagePreferences}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-[rgba(198,122,78,0.12)] border border-[rgba(198,122,78,0.25)] text-[#C67A4E] hover:bg-[rgba(198,122,78,0.2)] transition-colors shrink-0 self-start sm:self-auto"
          >
            Manage Investment Preferences →
          </button>
        </div>
      )}
    </div>
  );
}

function ProfessionalSection({
  professionalData,
  goEdit,
}: {
  professionalData?: {
    proficiency?: string;
    availability?: string;
    remote?: string;
    comp?: string;
    skills?: string[];
    expertise?: string[];
    industries?: string[];
    interests?: string[];
  } | null;
  goEdit: () => void;
}) {
  const proficiency = professionalData?.proficiency || 'Senior Professional';
  const availability = professionalData?.availability || 'Part-time / Advisory';
  const remote = professionalData?.remote || 'Flexible';
  const comp = professionalData?.comp || 'Equity + Advisory fee';
  const skills = professionalData?.skills || ['Engineering', 'Product Strategy', 'Technical Advisory'];
  const expertise = professionalData?.expertise || ['Technical Due Diligence', 'Architecture'];

  return (
    <div className="space-y-3">
      <SectionCard title="Professional Profile" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
        <InfoRow label="Proficiency" value={proficiency} />
        <InfoRow label="Availability" value={availability} />
        <InfoRow label="Work preference" value={remote} />
        <InfoRow label="Compensation" value={comp} />
      </SectionCard>
      <SectionCard title="Professional Skills">
        <TagList items={skills} />
      </SectionCard>
      <SectionCard title="Areas of Expertise">
        <TagList items={expertise} accent />
      </SectionCard>
    </div>
  );
}

function ExperienceSection({
  experience = [],
  goEdit,
}: {
  experience?: ExperienceItem[];
  goEdit: () => void;
}) {
  return (
    <SectionCard title="Experience" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}>
      {experience.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-2">No experience records added yet.</p>
          <button onClick={goEdit} className="text-[12px] text-[#C67A4E] hover:underline">Add experience →</button>
        </div>
      ) : (
        <div className="space-y-0">
          {experience.map((e, i) => (
            <div key={i} className="flex gap-3.5 pb-4 last:pb-0">
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#35446A] shrink-0" />
                {i < experience.length - 1 && <div className="w-px flex-1 bg-[#1c2a3e] mt-1.5" />}
              </div>
              <div className="flex-1 min-w-0 pb-4 last:pb-0 border-b border-[#1c2a3e] last:border-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] leading-snug">{e.role}</p>
                  <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono shrink-0">{e.duration}</span>
                </div>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-1.5">{e.org}</p>
                {e.desc && <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed">{e.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function PortfolioSection({
  portfolio = [],
  goEdit,
}: {
  portfolio?: PortfolioItem[];
  goEdit: () => void;
}) {
  return (
    <SectionCard title="Selected Work / Portfolio" action={<button onClick={goEdit} className="text-[11.5px] text-[#C67A4E] hover:underline">Add</button>}>
      {portfolio.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-2">No portfolio items added yet.</p>
          <button onClick={goEdit} className="text-[12px] text-[#C67A4E] hover:underline">Add portfolio item →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {portfolio.map((item, i) => (
            <div key={i} className={`${i < portfolio.length - 1 ? 'pb-4 border-b border-[#1c2a3e]' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{item.title}</p>
                {item.year && <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono shrink-0">{item.year}</span>}
              </div>
              {item.role && <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-1">{item.role}</p>}
              {item.desc && <p className="text-[12px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-2">{item.desc}</p>}
              {item.skills && item.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[10.5px] text-[color:var(--vv-text-tertiary)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* section icons for modal nav */
const NAV_ICONS: Record<ModalSection, React.ReactNode> = {
  'Basic Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  'Founder Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  'Professional Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  ),
  'Investor Information': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  'Experience': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  'Preferences': (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
};

/* edit profile modal */
function EditProfileModal({
  open,
  onClose,
  initialSection = 'Basic Information',
  profileData,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialSection?: ModalSection;
  profileData: UserProfileResponseData | null;
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const { session, refreshUser } = useAuth();

  const availableSections: ModalSection[] = React.useMemo(() => {
    const roles = (profileData?.roles && profileData.roles.length > 0)
      ? profileData.roles
      : (session?.roles && session.roles.length > 0 ? session.roles : []);

    const hasFounder = roles.includes('founder');
    const hasProfessional = roles.includes('professional');
    const hasInvestor = roles.includes('investor');

    const sections: ModalSection[] = ['Basic Information'];
    if (hasFounder) sections.push('Founder Information');
    if (hasProfessional) sections.push('Professional Information');
    if (hasInvestor) sections.push('Investor Information');
    sections.push('Experience', 'Preferences');

    return sections;
  }, [profileData?.roles, session?.roles]);

  const [active, setActive] = useState<ModalSection>(() => {
    return availableSections.includes(initialSection) ? initialSection : 'Basic Information';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controlled form state
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [visibility, setVisibility] = useState('Public (discoverable by all)');
  const [contactPref, setContactPref] = useState('Platform messages only');

  // Investor form state
  const [investorThesis, setInvestorThesis] = useState('');
  const [minInvestment, setMinInvestment] = useState('50000');
  const [maxInvestment, setMaxInvestment] = useState('500000');
  const [investorIndustry, setInvestorIndustry] = useState('FinTech');
  const [investorStage, setInvestorStage] = useState('Seed');
  const [investorInvolvement, setInvestorInvolvement] = useState('Light-touch (board observer)');

  // Initialize state when modal opens
  useEffect(() => {
    if (open) {
      const validInitial = availableSections.includes(initialSection)
        ? initialSection
        : 'Basic Information';
      setActive(validInitial);
      setError(null);
      setSavedSuccess(false);

      if (profileData?.user) {
        setHeadline(profileData.user.headline || '');
        setBio(profileData.user.bio || '');
        setLocation(profileData.user.location || '');
        setExperience(Array.isArray(profileData.user.experience) ? profileData.user.experience : []);
        setPortfolio(Array.isArray(profileData.user.portfolio) ? profileData.user.portfolio : []);
      }

      const invPref = profileData?.profiles?.investor?.preferences;
      if (invPref) {
        if (invPref.minimum_investment !== undefined) setMinInvestment(String(invPref.minimum_investment));
        if (invPref.maximum_investment !== undefined) setMaxInvestment(String(invPref.maximum_investment));
        if (invPref.industry) setInvestorIndustry(invPref.industry);
        if (invPref.business_stage) setInvestorStage(invPref.business_stage);
        if (invPref.involvement) setInvestorInvolvement(invPref.involvement);
      }
      if (profileData?.user?.bio) {
        setInvestorThesis(profileData.user.bio);
      }
    }
  }, [open, initialSection, profileData, availableSections]);

  useEffect(() => {
    if (open && !availableSections.includes(active)) {
      setActive('Basic Information');
    }
  }, [availableSections, active, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const minNum = parseFloat(minInvestment);
    const maxNum = parseFloat(maxInvestment);
    if (!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      setError('Minimum investment cannot exceed maximum investment.');
      setIsSaving(false);
      return;
    }

    try {
      // 1. Update Core Profile
      await api.profile.update({
        headline,
        bio,
        location,
        experience,
        portfolio,
        preferences: {
          visibility,
          contact: contactPref,
        },
      });

      // 2. Update Investor Preferences if enrolled
      if (profileData?.roles?.includes('investor')) {
        try {
          await api.investorPreferences.update({
            minimum_investment: parseFloat(minInvestment) || undefined,
            maximum_investment: parseFloat(maxInvestment) || undefined,
            industry: investorIndustry,
            business_stage: investorStage,
            involvement: investorInvolvement,
          });
        } catch {
          // Continue even if preference update encounters non-critical issue
        }
      }

      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[880px] max-h-[90vh] flex flex-col vv-glass-elevated border border-[color:var(--vv-border)] rounded-[14px] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-[color:var(--vv-border)] flex-shrink-0">
          <div>
            <h2 id="edit-profile-title" className="font-display text-[15px] font-semibold text-[color:var(--vv-text)]">Edit Profile</h2>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">Update your profile information and preferences.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:bg-[color:var(--vv-raised)] transition-all flex-shrink-0"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-5 py-2.5 bg-[#F04438]/10 border-b border-[#F04438]/25 text-[#F04438] text-[12px]">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left nav - desktop */}
          <div className="hidden sm:flex flex-col w-[190px] border-r border-[color:var(--vv-border)] py-2 flex-shrink-0 overflow-y-auto">
            {availableSections.map((sec) => {
              const isActive = active === sec;
              return (
                <button
                  key={sec}
                  onClick={() => setActive(sec)}
                  style={isActive ? { boxShadow: 'inset 2px 0 0 #C5A059' } : {}}
                  className={`text-left px-3.5 py-2.5 text-[12px] font-medium transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'text-[color:var(--vv-text)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]'
                      : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]'
                  }`}
                >
                  <span style={isActive ? { color: '#C5A059' } : { color: '#5E6D8F' }}>{NAV_ICONS[sec]}</span>
                  {sec}
                </button>
              );
            })}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {active === 'Basic Information' && (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5E6D8F] mb-3">Basic Information</p>
                <Input label="Headline" placeholder="e.g. AI Product Strategist & Entrepreneur" value={headline} onChange={(e) => setHeadline(e.target.value)} />
                <Textarea label="Bio / Summary" placeholder="Write a summary about yourself..." rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                <Input label="Location" placeholder="e.g. Dhaka, Bangladesh" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            )}

            {active === 'Founder Information' && availableSections.includes('Founder Information') && (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C67A4E] mb-3">Founder Information</p>
                <Input label="Company / Venture Name" placeholder="e.g. NovaTech AI" value={headline.split('·')[0]?.trim() || ''} onChange={(e) => setHeadline(e.target.value)} />
                <Select label="Funding Stage" options={['Pre-seed', 'Seed', 'Series A', 'Series B+', 'Bootstrapped']} />
                <Select label="Primary Industry" options={['FinTech', 'HealthTech', 'AI / ML', 'CleanTech', 'SaaS', 'Other']} />
              </div>
            )}

            {active === 'Investor Information' && availableSections.includes('Investor Information') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A24B]">Investor Information</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/app/investor/preferences');
                    }}
                    className="text-[11.5px] text-[#C67A4E] hover:underline font-medium"
                  >
                    Manage Investment Preferences →
                  </button>
                </div>
                <Textarea label="Investment Thesis" placeholder="Your thesis and mandate..." rows={3} value={investorThesis} onChange={(e) => setInvestorThesis(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Min Investment (BDT)" type="number" value={minInvestment} onChange={(e) => setMinInvestment(e.target.value)} />
                  <Input label="Max Investment (BDT)" type="number" value={maxInvestment} onChange={(e) => setMaxInvestment(e.target.value)} />
                </div>
                {parseFloat(minInvestment) > 0 && parseFloat(maxInvestment) > 0 && parseFloat(minInvestment) > parseFloat(maxInvestment) && (
                  <p className="text-[11.5px] text-[#F04438] -mt-2 font-medium">Minimum investment cannot exceed maximum investment.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Target Industry" options={['FinTech', 'HealthTech', 'AI & Data', 'SaaS', 'CleanTech', 'E-commerce']} value={investorIndustry} onChange={(e) => setInvestorIndustry(e.target.value)} />
                  <Select label="Preferred Stage" options={['Idea / Pre-Seed', 'Seed', 'Series A', 'Series B+', 'Growth']} value={investorStage} onChange={(e) => setInvestorStage(e.target.value)} />
                </div>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[color:var(--vv-border)]">
                  <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Configure risk appetite, available capital & target locations in full preferences.</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/app/investor/preferences');
                    }}
                    className="text-[11.5px] text-[#C67A4E] hover:underline font-medium self-start sm:self-auto"
                  >
                    Manage Investment Preferences →
                  </button>
                </div>
              </div>
            )}

            {active === 'Professional Information' && availableSections.includes('Professional Information') && (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#22C55E] mb-3">Professional Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Proficiency" options={['Junior (1-3 yrs)', 'Mid-level (3-7 yrs)', 'Senior (7-12 yrs)', 'Principal (12+ yrs)']} />
                  <Select label="Availability" options={['Full-time', 'Part-time (10-20h/wk)', 'Advisory (5h/wk)', 'Project-based']} />
                </div>
                <Select label="Work Preference" options={['Remote only', 'Hybrid', 'On-site preferred', 'Flexible']} />
              </div>
            )}

            {active === 'Experience' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5E6D8F]">Experience History</p>
                    <button
                      type="button"
                      onClick={() => setExperience([...experience, { role: '', org: '', duration: '', desc: '' }])}
                      className="text-[11.5px] text-[#C67A4E] hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>
                  {experience.length === 0 ? (
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] italic">No experience records added.</p>
                  ) : (
                    <div className="space-y-4">
                      {experience.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[color:var(--vv-text-tertiary)] font-mono">Entry #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                              className="text-[11px] text-[#F04438] hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Role / Title"
                              value={item.role}
                              onChange={(e) => {
                                const next = [...experience];
                                next[idx].role = e.target.value;
                                setExperience(next);
                              }}
                              className="h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[12px] text-[color:var(--vv-text)]"
                            />
                            <input
                              type="text"
                              placeholder="Organization"
                              value={item.org}
                              onChange={(e) => {
                                const next = [...experience];
                                next[idx].org = e.target.value;
                                setExperience(next);
                              }}
                              className="h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[12px] text-[color:var(--vv-text)]"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Duration (e.g. 2021 - Present)"
                            value={item.duration}
                            onChange={(e) => {
                              const next = [...experience];
                              next[idx].duration = e.target.value;
                              setExperience(next);
                            }}
                            className="w-full h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[12px] text-[color:var(--vv-text)]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[color:var(--vv-border)] pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5E6D8F]">Portfolio / Selected Work</p>
                    <button
                      type="button"
                      onClick={() => setPortfolio([...portfolio, { title: '', desc: '', role: '', skills: [], year: '' }])}
                      className="text-[11.5px] text-[#C67A4E] hover:underline"
                    >
                      + Add Work
                    </button>
                  </div>
                  {portfolio.length === 0 ? (
                    <p className="text-[12px] text-[color:var(--vv-text-tertiary)] italic">No portfolio items added.</p>
                  ) : (
                    <div className="space-y-4">
                      {portfolio.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[color:var(--vv-text-tertiary)] font-mono">Work #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setPortfolio(portfolio.filter((_, i) => i !== idx))}
                              className="text-[11px] text-[#F04438] hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Project Title"
                              value={item.title}
                              onChange={(e) => {
                                const next = [...portfolio];
                                next[idx].title = e.target.value;
                                setPortfolio(next);
                              }}
                              className="h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[12px] text-[color:var(--vv-text)]"
                            />
                            <input
                              type="text"
                              placeholder="Year (e.g. 2023)"
                              value={item.year}
                              onChange={(e) => {
                                const next = [...portfolio];
                                next[idx].year = e.target.value;
                                setPortfolio(next);
                              }}
                              className="h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[12px] text-[color:var(--vv-text)]"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.desc}
                            onChange={(e) => {
                              const next = [...portfolio];
                              next[idx].desc = e.target.value;
                              setPortfolio(next);
                            }}
                            className="w-full h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded text-[12px] text-[color:var(--vv-text)]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {active === 'Preferences' && (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5E6D8F] mb-3">Preferences</p>
                <Select
                  label="Profile Visibility"
                  options={['Public (discoverable by all)', 'Verified members only', 'Private']}
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                />
                <Select
                  label="Contact Preference"
                  options={['Platform messages only', 'Allow direct email', 'Public contact info']}
                  value={contactPref}
                  onChange={(e) => setContactPref(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_90%,transparent)] flex-shrink-0">
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] hidden sm:block">Changes persist directly to your account.</p>
          <div className="flex items-center gap-2.5 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {savedSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="flex items-center gap-1 text-[12px] text-[color:var(--vv-text-tertiary)]">{icon}{children}</span>;
}
const IconPin = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" /></svg>;
const IconBuilding = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="1" /><path d="M9 9V5h6v4" /></svg>;
const IconCal = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;

/* main Profile Component */
export default function Profile() {
  const { role } = useRole();
  const { session, isAdmin, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileResponseData | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const section: Section = SECTIONS.find(item => item.toLowerCase() === searchParams.get('tab')) || 'Overview';
  const setSection = (next: Section) => {
    setSearchParams(previous => {
      const params = new URLSearchParams(previous);
      params.set('tab', next.toLowerCase());
      return params;
    });
  };
  const [manageRoles, setManageRoles] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSection, setEditSection] = useState<ModalSection>('Basic Information');
  const [prefSaved, setPrefSaved] = useState(false);

  // Photo uploads
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadKind, setUploadKind] = useState<'avatar' | 'cover'>('avatar');

  const navigate = useNavigate();

  const loadProfile = () => {
    api.profile.get()
      .then((res) => {
        if (res) {
          setProfileData(res);
        }
      })
      .catch(() => {
        // Fallback to auth user
      });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const isOwnProfile = !isAdmin && session.user !== null;

  const displayName = user?.name || profileData?.user.name || 'Member';
  const displayEmail = user?.email || profileData?.user.email || '';
  const headline = profileData?.user.headline || user?.headline || 'Vault Ventures Member';
  const location = profileData?.user.location || user?.location || 'Dhaka, Bangladesh';
  const bio = profileData?.user.bio || user?.bio || '';
  const avatarUrl = profileData?.user.avatar_url || user?.avatar_url || null;
  const coverPhotoUrl = profileData?.user.cover_photo_url || user?.cover_photo_url || null;
  const experience = Array.isArray(profileData?.user.experience) ? profileData.user.experience : [];
  const portfolio = Array.isArray(profileData?.user.portfolio) ? profileData.user.portfolio : [];

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const displayRoles: NormalRole[] = session.roles.length > 0
    ? session.roles
    : (profileData?.roles && profileData.roles.length > 0 ? profileData.roles : ['founder']);

  const currentTier = (user?.verification_tier === 1 || user?.verification_tier === 2) ? user.verification_tier : 0;

  // Completion calculation
  const completionItems = [
    { label: 'Add a headline', done: Boolean(headline && headline !== 'Vault Ventures Member') },
    { label: 'Add a bio', done: Boolean(bio) },
    { label: 'Set location', done: Boolean(location) },
    { label: 'Upload profile photo', done: Boolean(avatarUrl) },
    { label: 'Add experience history', done: experience.length > 0 },
    { label: 'Add portfolio work', done: portfolio.length > 0 },
  ];
  const completedCount = completionItems.filter((i) => i.done).length;
  const completionPct = Math.round((completedCount / completionItems.length) * 100);

  const openEdit = (sec: ModalSection = 'Basic Information') => {
    setEditSection(sec);
    setEditOpen(true);
  };

  const triggerPhotoUpload = (kind: 'avatar' | 'cover') => {
    setUploadKind(kind);
    setPhotoError(null);
    photoInputRef.current?.click();
  };

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/i)) {
      const msg = 'Invalid image format. Supported formats: JPEG, PNG, WEBP.';
      setPhotoError(msg);
      toast('danger', 'Photo Upload Error', msg);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const msg = 'File exceeds maximum allowable size of 5 MB.';
      setPhotoError(msg);
      toast('danger', 'Photo Upload Error', msg);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError(null);

    try {
      if (uploadKind === 'avatar') {
        const res = await api.profile.uploadAvatar(file);
        if (res?.avatar_url) {
          setProfileData((prev) => prev ? { ...prev, user: { ...prev.user, avatar_url: res.avatar_url } } : null);
        }
      } else {
        const res = await api.profile.uploadCoverPhoto(file);
        if (res?.cover_photo_url) {
          setProfileData((prev) => prev ? { ...prev, user: { ...prev.user, cover_photo_url: res.cover_photo_url } } : null);
        }
      }
      await refreshUser();
      loadProfile();
      toast('success', 'Photo Updated', uploadKind === 'avatar' ? 'Profile picture updated successfully.' : 'Cover photo updated successfully.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload photo.';
      setPhotoError(msg);
      toast('danger', 'Photo Upload Error', msg);
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-[960px] mx-auto pb-10">
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialSection={editSection}
        profileData={profileData}
        onSaved={loadProfile}
      />
      {manageRoles && (
        <ManageRolesModal
          onClose={() => setManageRoles(false)}
          onEditProfile={() => {
            setManageRoles(false);
            openEdit();
          }}
        />
      )}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="sr-only"
        aria-label="Upload photo"
        onChange={handlePhotoFileSelected}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Profile</span>
      </div>

      {photoError && (
        <div className="mx-5 mb-3 px-4 py-2 bg-[#F04438]/10 border border-[#F04438]/30 text-[#F04438] text-[12px] rounded-lg flex items-center justify-between">
          <span>{photoError}</span>
          <button onClick={() => setPhotoError(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Profile Card */}
      <div className="mx-5 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden mb-4">
        <CoverBanner
          image={coverPhotoUrl}
          editable={isOwnProfile}
          onEdit={() => triggerPhotoUpload('cover')}
          isUploading={isUploadingPhoto && uploadKind === 'cover'}
        />
        <div className="px-5 -mt-12 pb-5">
          <div className="flex items-start justify-between gap-4">
            <Avatar
              initials={initials}
              size={96}
              image={avatarUrl}
              editable={isOwnProfile}
              onEdit={() => triggerPhotoUpload('avatar')}
              isUploading={isUploadingPhoto && uploadKind === 'avatar'}
            />
            <div className="flex items-center gap-2 pt-14 flex-wrap justify-end">
              <Button variant="ghost" size="sm" onClick={() => setManageRoles(true)}>
                Manage Roles
              </Button>
              <DotsMenu onEditProfile={() => openEdit('Basic Information')} />
            </div>
          </div>

          <div className="mt-3">
            <h1 className="font-display text-[22px] font-bold text-[color:var(--vv-text)] leading-tight tracking-tight">
              {displayName}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {displayRoles.map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 rounded border text-[10.5px] font-semibold uppercase tracking-wide"
                  style={{ borderColor: `${ROLE_COLORS[r]}40`, color: ROLE_COLORS[r], background: `${ROLE_COLORS[r]}0f` }}
                >
                  {ROLE_LABELS[r]}
                </span>
              ))}
              <VerificationBadge tier={currentTier} />
            </div>
            <p className="text-[13.5px] text-[color:var(--vv-text-secondary)] mt-1.5 leading-snug">
              {displayEmail ? `${displayEmail} · ` : ''}{headline}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
              <Meta icon={<IconPin />}>{location}</Meta>
              <span className="text-[#35446A] text-[10px]">•</span>
              <Meta icon={<IconBuilding />}>Vault Ventures</Meta>
              <span className="text-[#35446A] text-[10px]">•</span>
              <Meta icon={<IconCal />}>Member</Meta>
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-24 h-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 70 ? '#22C55E' : '#F59E0B' }}
                />
              </div>
              <span className="text-[11px] font-mono tabular-nums" style={{ color: completionPct >= 70 ? '#22C55E' : '#F59E0B' }}>
                {completionPct}% complete
              </span>
              {completionPct < 100 && (
                <button
                  onClick={() => openEdit('Basic Information')}
                  className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors"
                >
                  Complete profile →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-5 flex border-b border-[color:var(--vv-border)] mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`flex-shrink-0 px-4 py-2.5 text-[12.5px] font-medium border-b-2 transition-colors ${
              section === s
                ? 'border-[#C67A4E] text-[color:var(--vv-text)]'
                : 'border-transparent text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-5">
        {section === 'Overview' && (() => {
          const activeNormal = (['founder', 'investor', 'professional'] as NormalRole[]).includes(role as NormalRole)
            ? (role as NormalRole)
            : (displayRoles[0] || 'founder');
          const roleOrder = [activeNormal, ...displayRoles.filter((r) => r !== activeNormal)];

          const RoleSection = ({ r }: { r: NormalRole }) => {
            if (r === 'founder') {
              return (
                <FounderSection
                  business={profileData?.profiles?.founder ? { company: headline.split('·')[0]?.trim() || 'Founder Venture', industry: 'FinTech', stage: 'Early Stage' } : null}
                  goEdit={() => openEdit('Founder Information')}
                />
              );
            }
            if (r === 'investor') {
              return (
                <InvestorSection
                  investorData={profileData?.profiles?.investor?.preferences || null}
                  goEdit={() => openEdit('Investor Information')}
                  onManagePreferences={() => navigate('/app/investor/preferences')}
                />
              );
            }
            return (
              <ProfessionalSection
                professionalData={profileData?.profiles?.professional || null}
                goEdit={() => openEdit('Professional Information')}
              />
            );
          };

          const editSectionFor: Record<NormalRole, ModalSection> = {
            founder: 'Founder Information',
            investor: 'Investor Information',
            professional: 'Professional Information',
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-6">
                <SectionCard
                  title="About"
                  action={<button onClick={() => openEdit('Basic Information')} className="text-[11.5px] text-[#C67A4E] hover:underline">Edit</button>}
                >
                  <Bio text={bio} onEdit={() => openEdit('Basic Information')} />
                </SectionCard>

                {roleOrder.map((r) => (
                  <div key={r}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ROLE_COLORS[r] }} />
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ROLE_COLORS[r] }}>
                        {ROLE_LABELS[r]}
                      </p>
                      {r === activeNormal && <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-medium">• active workspace</span>}
                      <div className="flex-1 h-px bg-[#1c2a3e]" />
                      <button onClick={() => openEdit(editSectionFor[r])} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">
                        Edit
                      </button>
                    </div>
                    <RoleSection r={r} />
                  </div>
                ))}

                <ExperienceSection experience={experience} goEdit={() => openEdit('Experience')} />
                <PortfolioSection portfolio={portfolio} goEdit={() => openEdit('Experience')} />
              </div>

              {/* Right Rail */}
              <div className="space-y-3">
                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2a3e]">
                    <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Profile Completion</p>
                    <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: completionPct >= 70 ? '#22C55E' : '#F59E0B' }}>
                      {completionPct}%
                    </span>
                  </div>
                  <div className="px-4 pt-3 pb-2">
                    <div className="h-1 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 70 ? '#22C55E' : '#F59E0B' }} />
                    </div>
                    <div className="space-y-1.5 pb-2">
                      {completionItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${item.done ? 'bg-[#22C55E]/20 border-[#22C55E]/40' : 'border-[color:var(--vv-border-strong)]'}`}>
                            {item.done && <svg width="7" height="7" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>}
                          </div>
                          <span className={`text-[11.5px] leading-tight ${item.done ? 'text-[color:var(--vv-text-tertiary)] line-through' : 'text-[color:var(--vv-text-secondary)]'}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {completionPct < 100 && (
                      <button onClick={() => openEdit('Basic Information')} className="w-full text-center text-[11.5px] text-[#C67A4E] hover:underline py-1.5">
                        Complete Profile →
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2a3e]">
                    <p className="text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">Active Roles</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {displayRoles.map((r) => (
                      <div key={r} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ROLE_COLORS[r] }} />
                        <span className="text-[12px] text-[color:var(--vv-text-secondary)] font-medium">{ROLE_LABELS[r]}</span>
                        {r === activeNormal && <span className="text-[10px] text-[color:var(--vv-text-tertiary)]">• active</span>}
                      </div>
                    ))}
                    <button onClick={() => setManageRoles(true)} className="text-[11.5px] text-[#C67A4E] hover:underline pt-1 block">
                      Manage roles →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {section === 'Verification' && user && (
          <ParticipantVerification key={`${user.id}:${role}`} />
        )}

        {section === 'Preferences' && (
          <div className="space-y-4 max-w-2xl">
            {(displayRoles.includes('investor') || role === 'investor') && (
              <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-[#C9A24B] uppercase tracking-widest mb-1">Investor Mandate & Preferences</p>
                  <p className="text-[12.5px] text-[color:var(--vv-text-secondary)]">Manage your ticket sizes, risk tolerance, preferred stages, and match criteria.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/app/investor/preferences')}
                  className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-[rgba(198,122,78,0.12)] border border-[rgba(198,122,78,0.25)] text-[#C67A4E] hover:bg-[rgba(198,122,78,0.2)] transition-colors shrink-0 self-start sm:self-auto"
                >
                  Manage Investment Preferences →
                </button>
              </div>
            )}
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
                {['Match Score updates', 'New connection requests', 'Deal Room activity', 'Verification status changes'].map((item) => (
                  <label key={item} className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] text-[color:var(--vv-text-secondary)]">{item}</span>
                    <div className="relative w-8 rounded-full bg-[#C67A4E]/80 flex-shrink-0" style={{ height: 18 }}>
                      <div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 rounded-full bg-white" />
                    </div>
                  </label>
                ))}
              </div>
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