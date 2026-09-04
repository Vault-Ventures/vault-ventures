import React, { useState, useEffect } from 'react';
import { useNavigate, useBeforeUnload } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// --- Types --------------------------------------------------------------------

type Availability = 'available' | 'limited' | 'unavailable';

interface Experience {
  id: string;
  role: string;
  org: string;
  duration: string;
  description: string;
}

interface WorkItem {
  id: string;
  name: string;
  description: string;
  role: string;
  skills: string;
  link: string;
}

interface ProfileData {
  headline: string;
  about: string;
  skills: string[];
  experience: Experience[];
  portfolio: WorkItem[];
  availability: Availability;
  interests: string;
  workPref: string;
}

// --- Seed data ----------------------------------------------------------------

const DEFAULT: ProfileData = {
  headline: 'Growth Strategist & Venture Advisor',
  about: 'Experienced operator with 8+ years across early-stage FinTech and SaaS companies in South Asia. Specialize in go-to-market, investor relations, and scaling operations from Seed to Series B.',
  skills: ['Go-to-Market Strategy', 'Investor Relations', 'Financial Modeling', 'Product Marketing', 'Team Building', 'Market Research'],
  experience: [
    { id: 'e1', role: 'Head of Growth', org: 'Shajgoj', duration: '2022 - 2024', description: 'Led growth from 200k to 1.4M MAU. Managed BDT 4Cr marketing budget. Built and scaled a 12-person growth team.' },
    { id: 'e2', role: 'Strategy Associate', org: 'BCG Dhaka', duration: '2019 - 2022', description: 'Advised PE-backed portfolio companies on market entry strategy across SAARC region.' },
  ],
  portfolio: [
    { id: 'p1', name: 'Series A Fundraising Playbook', description: 'End-to-end documentation of a BDT 15Cr Series A raise - investor outreach, data room setup, term sheet negotiation.', role: 'Lead Advisor', skills: 'Investor Relations, Financial Modeling', link: '' },
  ],
  availability: 'available',
  interests: 'FinTech, HealthTech, B2B SaaS, EdTech',
  workPref: 'Advisory, fractional roles, board observation',
};

const AVAILABILITY_OPTIONS: { value: Availability; label: string; desc: string; color: string }[] = [
  { value: 'available', label: 'Available', desc: 'Open to new opportunities', color: '#22C55E' },
  { value: 'limited', label: 'Limited Availability', desc: 'May consider select opportunities', color: '#C67A4E' },
  { value: 'unavailable', label: 'Not Available', desc: 'Not taking on new work', color: '#5E6D8F' },
];

const SKILL_SUGGESTIONS = [
  'Financial Modeling', 'Market Research', 'Product Strategy', 'UX Design', 'Legal Advisory',
  'Tax & Compliance', 'HR & Talent', 'Operations', 'Data Analytics', 'Marketing', 'Engineering', 'Sales',
];

// --- Reusable sub-components --------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-[color:var(--vv-text-secondary)] mb-1.5">{children}</label>;
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-colors focus:border-[#C67A4E]/50" />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none resize-none leading-relaxed focus:border-[#C67A4E]/50" />
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] border border-[color:var(--vv-border)] p-5 sm:p-6 ${className}`}
      style={{ background: 'rgba(26,28,29,0.85)' }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-display text-[14px] font-semibold text-[color:var(--vv-text)] mb-4">{children}</p>;
}

// --- Unsaved changes modal ----------------------------------------------------

function UnsavedModal({ onContinue, onDiscard }: { onContinue: () => void; onDiscard: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="unsaved-changes-title" style={{ background: 'rgba(4,8,15,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-[16px] border border-[color:var(--vv-border-strong)] p-6 w-full max-w-sm"
        style={{ background: 'rgba(26,28,29,0.97)' }}>
        <p id="unsaved-changes-title" className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">Unsaved Changes</p>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-5">You have unsaved changes. Are you sure you want to leave?</p>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={onContinue}>Continue Editing</Button>
          <Button variant="secondary" className="flex-1" onClick={onDiscard}>Discard Changes</Button>
        </div>
      </div>
    </div>
  );
}

// --- Experience editor --------------------------------------------------------

function ExperienceEditor({
  items, onChange,
}: { items: Experience[]; onChange: (items: Experience[]) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Experience>>({});

  function startAdd() {
    const id = `e${Date.now()}`;
    setDraft({ id, role: '', org: '', duration: '', description: '' });
    setEditId(id);
  }

  function startEdit(item: Experience) {
    setDraft({ ...item });
    setEditId(item.id);
  }

  function save() {
    if (!draft.id) return;
    const exists = items.find(i => i.id === draft.id);
    if (exists) {
      onChange(items.map(i => i.id === draft.id ? { ...i, ...draft } as Experience : i));
    } else {
      onChange([...items, draft as Experience]);
    }
    setEditId(null);
    setDraft({});
  }

  function remove(id: string) {
    onChange(items.filter(i => i.id !== id));
    if (editId === id) { setEditId(null); setDraft({}); }
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="rounded-[10px] border border-[color:var(--vv-border)] overflow-hidden">
          {editId === item.id ? (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><FieldLabel>Role</FieldLabel><TextInput value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Head of Growth" /></div>
                <div><FieldLabel>Organization</FieldLabel><TextInput value={draft.org ?? ''} onChange={v => setDraft(d => ({ ...d, org: v }))} placeholder="e.g. Shajgoj" /></div>
              </div>
              <div><FieldLabel>Duration</FieldLabel><TextInput value={draft.duration ?? ''} onChange={v => setDraft(d => ({ ...d, duration: v }))} placeholder="e.g. 2022 - 2024" /></div>
              <div><FieldLabel>Description</FieldLabel><TextArea value={draft.description ?? ''} onChange={v => setDraft(d => ({ ...d, description: v }))} placeholder="What you did and achieved..." rows={2} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setDraft({}); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{item.role}</p>
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{item.org}</span>
                  <span className="text-[10.5px] text-[#35446A]">{item.duration}</span>
                </div>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1 leading-relaxed">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">Edit</button>
                <button onClick={() => remove(item.id)} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {editId && !items.find(i => i.id === editId) ? (
        <div className="rounded-[10px] border border-[#C67A4E]/20 p-4 space-y-3" style={{ background: 'rgba(198,122,78,0.03)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><FieldLabel>Role</FieldLabel><TextInput value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Head of Growth" /></div>
            <div><FieldLabel>Organization</FieldLabel><TextInput value={draft.org ?? ''} onChange={v => setDraft(d => ({ ...d, org: v }))} placeholder="e.g. Shajgoj" /></div>
          </div>
          <div><FieldLabel>Duration</FieldLabel><TextInput value={draft.duration ?? ''} onChange={v => setDraft(d => ({ ...d, duration: v }))} placeholder="e.g. 2022 - 2024" /></div>
          <div><FieldLabel>Description</FieldLabel><TextArea value={draft.description ?? ''} onChange={v => setDraft(d => ({ ...d, description: v }))} rows={2} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Save Entry</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setDraft({}); }}>Cancel</Button>
          </div>
        </div>
      ) : null}
      {!editId && (
        <button onClick={startAdd}
          className="flex items-center gap-2 text-[12px] text-[#C67A4E] hover:text-[#C67A4E] transition-colors py-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Add Experience
        </button>
      )}
    </div>
  );
}

// --- Portfolio editor ---------------------------------------------------------

function PortfolioEditor({
  items, onChange,
}: { items: WorkItem[]; onChange: (items: WorkItem[]) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<WorkItem>>({});

  function startAdd() {
    const id = `p${Date.now()}`;
    setDraft({ id, name: '', description: '', role: '', skills: '', link: '' });
    setEditId(id);
  }

  function save() {
    if (!draft.id) return;
    const exists = items.find(i => i.id === draft.id);
    if (exists) {
      onChange(items.map(i => i.id === draft.id ? { ...i, ...draft } as WorkItem : i));
    } else {
      onChange([...items, draft as WorkItem]);
    }
    setEditId(null);
    setDraft({});
  }

  function remove(id: string) {
    onChange(items.filter(i => i.id !== id));
    if (editId === id) { setEditId(null); setDraft({}); }
  }

  const DraftForm = () => (
    <div className="rounded-[10px] border border-[#C67A4E]/20 p-4 space-y-3" style={{ background: 'rgba(198,122,78,0.03)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><FieldLabel>Project / Work Name</FieldLabel><TextInput value={draft.name ?? ''} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="e.g. Series A Playbook" /></div>
        <div><FieldLabel>Your Role</FieldLabel><TextInput value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Lead Advisor" /></div>
      </div>
      <div><FieldLabel>Description</FieldLabel><TextArea value={draft.description ?? ''} onChange={v => setDraft(d => ({ ...d, description: v }))} rows={2} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><FieldLabel>Relevant Skills</FieldLabel><TextInput value={draft.skills ?? ''} onChange={v => setDraft(d => ({ ...d, skills: v }))} placeholder="e.g. Financial Modeling" /></div>
        <div><FieldLabel>Link (optional)</FieldLabel><TextInput value={draft.link ?? ''} onChange={v => setDraft(d => ({ ...d, link: v }))} placeholder="https://..." /></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save}>Save Entry</Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setDraft({}); }}>Cancel</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="rounded-[10px] border border-[color:var(--vv-border)] overflow-hidden">
          {editId === item.id ? (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div><FieldLabel>Project / Work Name</FieldLabel><TextInput value={draft.name ?? ''} onChange={v => setDraft(d => ({ ...d, name: v }))} /></div>
                <div><FieldLabel>Your Role</FieldLabel><TextInput value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} /></div>
              </div>
              <div className="mb-3"><FieldLabel>Description</FieldLabel><TextArea value={draft.description ?? ''} onChange={v => setDraft(d => ({ ...d, description: v }))} rows={2} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div><FieldLabel>Skills</FieldLabel><TextInput value={draft.skills ?? ''} onChange={v => setDraft(d => ({ ...d, skills: v }))} /></div>
                <div><FieldLabel>Link</FieldLabel><TextInput value={draft.link ?? ''} onChange={v => setDraft(d => ({ ...d, link: v }))} /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setDraft({}); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{item.name}</p>
                  <span className="text-[11px] text-[color:var(--vv-text-tertiary)]">{item.role}</span>
                </div>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1 leading-relaxed">{item.description}</p>
                {item.skills && <p className="text-[10.5px] text-[#35446A] mt-1">Skills: {item.skills}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => { setDraft({ ...item }); setEditId(item.id); }} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">Edit</button>
                <button onClick={() => remove(item.id)} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {editId && !items.find(i => i.id === editId) && <DraftForm />}
      {!editId && (
        <button onClick={startAdd} className="flex items-center gap-2 text-[12px] text-[#C67A4E] hover:text-[#C67A4E] transition-colors py-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Add Work
        </button>
      )}
    </div>
  );
}

// --- Skills manager -----------------------------------------------------------

function SkillsManager({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState('');

  function add(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) onChange([...skills, trimmed]);
    setInput('');
  }

  function remove(skill: string) {
    onChange(skills.filter(s => s !== skill));
  }

  const suggestions = SKILL_SUGGESTIONS.filter(s => !skills.includes(s));

  return (
    <div>
      {/* Current skills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map(skill => (
          <span key={skill} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium"
            style={{ background: 'rgba(198,122,78,0.08)', border: '1px solid rgba(198,122,78,0.2)', color: '#C67A4E' }}>
            {skill}
            <button onClick={() => remove(skill)} className="opacity-60 hover:opacity-100 transition-opacity leading-none">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </span>
        ))}
        {skills.length === 0 && <p className="text-[12px] text-[#35446A]">No skills added yet.</p>}
      </div>
      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
          placeholder="Type a skill and press Enter..."
          className="flex-1 px-3.5 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none focus:border-[#C67A4E]/50" />
        <Button size="sm" variant="secondary" onClick={() => add(input)}>Add</Button>
      </div>
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-[10.5px] text-[#35446A] mb-1.5">Suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 8).map(s => (
              <button key={s} onClick={() => add(s)}
                className="px-2.5 py-1 rounded-md text-[11px] text-[color:var(--vv-text-tertiary)] border border-[color:var(--vv-border)] hover:border-[color:var(--vv-border-strong)] hover:text-[color:var(--vv-text-secondary)] transition-all"
                style={{ background: 'rgba(24,35,56,0.6)' }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function ProfessionalProfileEditor() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData>(DEFAULT);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setData(d => ({ ...d, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    }, 900);
  }

  function attemptNav(to: string) {
    if (dirty) { setPendingNav(to); setShowUnsaved(true); }
    else navigate(to);
  }

  useBeforeUnload(
    React.useCallback((e) => { if (dirty) e.preventDefault(); }, [dirty])
  );

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6">

      {showUnsaved && (
        <UnsavedModal
          onContinue={() => setShowUnsaved(false)}
          onDiscard={() => { setShowUnsaved(false); if (pendingNav) navigate(pendingNav); }}
        />
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => attemptNav('/app/professional/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Dashboard
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">Edit Professional Profile</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            Professional Profile
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">
            This information is part of your Unified Profile and visible to verified platform members.
          </p>
        </div>
        {dirty && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[11.5px] text-[#C67A4E]"
            style={{ background: 'rgba(198,122,78,0.07)', border: '1px solid rgba(198,122,78,0.2)' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
            Unsaved changes
          </div>
        )}
      </div>

      {/* Saved banner */}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[12.5px] text-[#22C55E]">Profile updated - your changes are now visible to other members.</p>
        </div>
      )}

      <div className="space-y-4">

        {/* Headline & About */}
        <Card>
          <SectionTitle>Basic Information</SectionTitle>
          <div className="space-y-4">
            <div>
              <FieldLabel>Professional Headline</FieldLabel>
              <TextInput value={data.headline} onChange={v => update('headline', v)} placeholder="e.g. Growth Strategist & Venture Advisor" />
            </div>
            <div>
              <FieldLabel>About / Introduction</FieldLabel>
              <TextArea value={data.about} onChange={v => update('about', v)} rows={4} placeholder="Tell businesses and investors about your background..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Professional Interests</FieldLabel>
                <TextInput value={data.interests} onChange={v => update('interests', v)} placeholder="e.g. FinTech, SaaS, HealthTech" />
              </div>
              <div>
                <FieldLabel>Work Preference</FieldLabel>
                <TextInput value={data.workPref} onChange={v => update('workPref', v)} placeholder="e.g. Advisory, fractional, board roles" />
              </div>
            </div>
          </div>
        </Card>

        {/* Availability */}
        <Card>
          <SectionTitle>Availability</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {AVAILABILITY_OPTIONS.map(opt => {
              const active = data.availability === opt.value;
              return (
                <button key={opt.value} onClick={() => update('availability', opt.value)}
                  className="flex items-start gap-3 p-3.5 rounded-[10px] border text-left transition-all"
                  style={active ? {
                    background: `rgba(${opt.value === 'available' ? '34,197,94' : opt.value === 'limited' ? '192,120,72' : '93,101,127'},0.07)`,
                    borderColor: opt.color + '44',
                  } : { background: 'rgba(24,35,56,0.5)', borderColor: '#24304A' }}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all`}
                    style={active ? { borderColor: opt.color, backgroundColor: opt.color } : { borderColor: '#35446A' }}>
                    {active && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold" style={{ color: active ? opt.color : '#EAF0FA' }}>{opt.label}</p>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <SectionTitle>Skills</SectionTitle>
          <SkillsManager skills={data.skills} onChange={v => update('skills', v)} />
        </Card>

        {/* Experience */}
        <Card>
          <SectionTitle>Experience</SectionTitle>
          <ExperienceEditor items={data.experience} onChange={v => update('experience', v)} />
        </Card>

        {/* Portfolio */}
        <Card>
          <SectionTitle>Selected Work</SectionTitle>
          <PortfolioEditor items={data.portfolio} onChange={v => update('portfolio', v)} />
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button className="flex-1 sm:flex-none sm:min-w-[160px]" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving-' : 'Save Changes'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/profile')}>
            Preview Profile
          </Button>
          <Button variant="ghost" onClick={() => attemptNav('/app/professional/dashboard')}>
            Cancel
          </Button>
        </div>

      </div>
    </div>
  );
}
