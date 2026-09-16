import React, { useState, useEffect } from 'react';
import { useNavigate, useBeforeUnload } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api, ProfessionalProfileData, ApiError } from '../../services/api';

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

interface ProfileFormState {
  headline: string;
  about: string;
  skills: string[];
  experienceLevel: string;
  location: string;
  experience: Experience[];
  portfolio: WorkItem[];
  availability: Availability;
  interests: string;
  compensationPreferences: string[];
}

const EMPTY_PROFILE: ProfileFormState = {
  headline: '',
  about: '',
  skills: [],
  experienceLevel: '',
  location: '',
  experience: [],
  portfolio: [],
  availability: 'available',
  interests: '',
  compensationPreferences: ['salary', 'equity'],
};

const AVAILABILITY_OPTIONS: { value: Availability; label: string; desc: string; color: string }[] = [
  { value: 'available', label: 'Available', desc: 'Open to new opportunities', color: '#22C55E' },
  { value: 'limited', label: 'Limited Availability', desc: 'May consider select opportunities', color: '#C67A4E' },
  { value: 'unavailable', label: 'Not Available', desc: 'Not taking on new work', color: '#5E6D8F' },
];

const SKILL_SUGGESTIONS = [
  'Financial Modeling', 'Market Research', 'Product Strategy', 'UX Design', 'Legal Advisory',
  'Tax & Compliance', 'HR & Talent', 'Operations', 'Data Analytics', 'Marketing', 'Engineering', 'Sales',
  'Go-to-Market Strategy', 'Investor Relations', 'Valuation & Deal Structuring',
];

const EXPERIENCE_LEVELS = [
  { value: 'Junior', label: 'Junior (1-2 years)' },
  { value: 'Mid-Level', label: 'Mid-Level (3-5 years)' },
  { value: 'Senior', label: 'Senior (6-9 years)' },
  { value: 'Lead / Executive', label: 'Lead / Executive (10+ years)' },
];

// --- Reusable sub-components --------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-[color:var(--vv-text-secondary)] mb-1.5">{children}</label>;
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-colors focus:border-[#C67A4E]/50"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none resize-none leading-relaxed focus:border-[#C67A4E]/50"
    />
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[14px] border border-[color:var(--vv-border)] p-5 sm:p-6 ${className}`}
      style={{ background: 'rgba(26,28,29,0.85)' }}
    >
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
                <div><FieldLabel>Role</FieldLabel><TextInput value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Lead Consultant" /></div>
                <div><FieldLabel>Organization</FieldLabel><TextInput value={draft.org ?? ''} onChange={v => setDraft(d => ({ ...d, org: v }))} placeholder="e.g. Enterprise Group" /></div>
              </div>
              <div><FieldLabel>Duration</FieldLabel><TextInput value={draft.duration ?? ''} onChange={v => setDraft(d => ({ ...d, duration: v }))} placeholder="e.g. 2022 - 2024" /></div>
              <div><FieldLabel>Description</FieldLabel><TextArea value={draft.description ?? ''} onChange={v => setDraft(d => ({ ...d, description: v }))} placeholder="Key outcomes and achievements..." rows={2} /></div>
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
                <button type="button" onClick={() => startEdit(item)} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">Edit</button>
                <button type="button" onClick={() => remove(item.id)} className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {editId && !items.find(i => i.id === editId) ? (
        <div className="rounded-[10px] border border-[#C67A4E]/20 p-4 space-y-3" style={{ background: 'rgba(198,122,78,0.03)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><FieldLabel>Role</FieldLabel><TextInput value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Lead Consultant" /></div>
            <div><FieldLabel>Organization</FieldLabel><TextInput value={draft.org ?? ''} onChange={v => setDraft(d => ({ ...d, org: v }))} placeholder="e.g. Enterprise Group" /></div>
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
        <button
          type="button"
          onClick={startAdd}
          className="flex items-center gap-2 text-[12px] text-[#C67A4E] hover:text-[#C67A4E] transition-colors py-1"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Add Experience
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
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
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
            <button
              type="button"
              onClick={() => remove(skill)}
              className="opacity-60 hover:opacity-100 transition-opacity leading-none"
            >
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </span>
        ))}
        {skills.length === 0 && <p className="text-[12px] text-[#35446A]">No skills added yet. Add at least one to improve matching.</p>}
      </div>
      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
          placeholder="Type a verified skill and press Enter..."
          className="flex-1 px-3.5 py-2 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none focus:border-[#C67A4E]/50"
        />
        <Button size="sm" variant="secondary" onClick={() => add(input)}>Add Skill</Button>
      </div>
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-[10.5px] text-[#35446A] mb-1.5">Recommended Platform Skills:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 8).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="px-2.5 py-1 rounded-md text-[11px] text-[color:var(--vv-text-tertiary)] border border-[color:var(--vv-border)] hover:border-[color:var(--vv-border-strong)] hover:text-[color:var(--vv-text-secondary)] transition-all"
                style={{ background: 'rgba(24,35,56,0.6)' }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Component -----------------------------------------------------------

export default function ProfessionalProfileEditor() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileFormState>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.profile.get();
        if (mounted && res?.profiles?.professional) {
          const prof = res.profiles.professional;
          const parseIndustry = (val: string[] | string | null | undefined): string => {
            if (!val) return '';
            if (Array.isArray(val)) return val.join(', ');
            return val;
          };

          setData({
            headline: '',
            about: '',
            skills: Array.isArray(prof.skills) ? prof.skills : [],
            experienceLevel: prof.experience_level || '',
            location: prof.location || '',
            experience: [],
            portfolio: [],
            availability: (prof.availability as Availability) || 'available',
            interests: parseIndustry(prof.industry_experience),
            compensationPreferences: Array.isArray(prof.compensation_preferences)
              ? prof.compensation_preferences
              : ['salary', 'equity'],
          });
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load professional profile from server.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  function update<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setData(d => ({ ...d, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function toggleCompensation(type: 'salary' | 'equity') {
    setData(d => {
      const exists = d.compensationPreferences.includes(type);
      const updated = exists
        ? d.compensationPreferences.filter(t => t !== type)
        : [...d.compensationPreferences, type];
      return { ...d, compensationPreferences: updated.length > 0 ? updated : [type] };
    });
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const industryArr = data.interests
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        skills: data.skills.map(s => s.trim()).filter(Boolean),
        experience_level: data.experienceLevel || null,
        availability: data.availability || null,
        location: data.location || null,
        industry_experience: industryArr.length > 0 ? industryArr : null,
        compensation_preferences: data.compensationPreferences.length > 0 ? data.compensationPreferences : ['salary', 'equity'],
      };

      const updated = await api.profile.updateProfessional(payload);
      if (updated) {
        setData(d => ({
          ...d,
          skills: Array.isArray(updated.skills) ? updated.skills : d.skills,
          experienceLevel: updated.experience_level || d.experienceLevel,
          availability: (updated.availability as Availability) || d.availability,
          location: updated.location || d.location,
          compensationPreferences: Array.isArray(updated.compensation_preferences)
            ? updated.compensation_preferences
            : d.compensationPreferences,
        }));
      }

      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      if (err instanceof ApiError && err.details) {
        const firstErr = Object.values(err.details).flat()[0];
        setError(firstErr || err.message);
      } else {
        setError(err.message || 'Failed to save professional profile.');
      }
    } finally {
      setSaving(false);
    }
  }

  function attemptNav(to: string) {
    if (dirty) {
      setPendingNav(to);
      setShowUnsaved(true);
    } else {
      navigate(to);
    }
  }

  useBeforeUnload(
    React.useCallback((e) => {
      if (dirty) e.preventDefault();
    }, [dirty])
  );

  if (loading) {
    return (
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#C67A4E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)]">Loading professional profile from server...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6">

      {showUnsaved && (
        <UnsavedModal
          onContinue={() => setShowUnsaved(false)}
          onDiscard={() => {
            setShowUnsaved(false);
            if (pendingNav) navigate(pendingNav);
          }}
        />
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => attemptNav('/app/professional/dashboard')}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors"
        >
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
            This information is part of your Unified Profile and visible to verified businesses and investors.
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

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[12.5px]">{error}</p>
        </div>
      )}

      {/* Saved banner */}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-5"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[12.5px] text-[#22C55E]">Profile saved to backend — changes are synced and active across matching.</p>
        </div>
      )}

      <div className="space-y-4">

        {/* Basic Information */}
        <Card>
          <SectionTitle>Experience & Location</SectionTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Experience Level</FieldLabel>
                <select
                  value={data.experienceLevel}
                  onChange={e => update('experienceLevel', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#141E33] border border-[color:var(--vv-border-strong)] text-[12.5px] text-[color:var(--vv-text)] outline-none"
                >
                  <option value="">Select experience level</option>
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Location / Base</FieldLabel>
                <TextInput
                  value={data.location}
                  onChange={v => update('location', v)}
                  placeholder="e.g. Dhaka, Bangladesh (or Remote)"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Industry Experience (comma-separated)</FieldLabel>
              <TextInput
                value={data.interests}
                onChange={v => update('interests', v)}
                placeholder="e.g. FinTech, SaaS, HealthTech, Logistics"
              />
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
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('availability', opt.value)}
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

        {/* Compensation Preferences */}
        <Card>
          <SectionTitle>Compensation Preferences</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => toggleCompensation('salary')}
              className="flex items-start gap-3 p-3.5 rounded-[10px] border text-left transition-all"
              style={data.compensationPreferences.includes('salary') ? {
                background: 'rgba(198,122,78,0.07)',
                borderColor: 'rgba(198,122,78,0.28)',
              } : {
                background: 'rgba(24,35,56,0.5)',
                borderColor: 'rgba(36,48,74,0.9)',
              }}
            >
              <div className={`w-4 h-4 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                data.compensationPreferences.includes('salary') ? 'border-[#C67A4E] bg-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
              }`}>
                {data.compensationPreferences.includes('salary') && <span className="text-[10px] text-white font-bold">✓</span>}
              </div>
              <div>
                <p className={`text-[12.5px] font-semibold ${data.compensationPreferences.includes('salary') ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text)]'}`}>
                  Fee / Retainer / Cash (৳ BDT)
                </p>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Direct project milestone or monthly advisory compensation</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => toggleCompensation('equity')}
              className="flex items-start gap-3 p-3.5 rounded-[10px] border text-left transition-all"
              style={data.compensationPreferences.includes('equity') ? {
                background: 'rgba(198,122,78,0.07)',
                borderColor: 'rgba(198,122,78,0.28)',
              } : {
                background: 'rgba(24,35,56,0.5)',
                borderColor: 'rgba(36,48,74,0.9)',
              }}
            >
              <div className={`w-4 h-4 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                data.compensationPreferences.includes('equity') ? 'border-[#C67A4E] bg-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
              }`}>
                {data.compensationPreferences.includes('equity') && <span className="text-[10px] text-white font-bold">✓</span>}
              </div>
              <div>
                <p className={`text-[12.5px] font-semibold ${data.compensationPreferences.includes('equity') ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text)]'}`}>
                  Equity / Profit Sharing
                </p>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Vested advisory equity or revenue participation shares</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <SectionTitle>Skills & Functional Expertise</SectionTitle>
          <SkillsManager skills={data.skills} onChange={v => update('skills', v)} />
        </Card>

        {/* Experience */}
        <Card>
          <SectionTitle>Experience Records</SectionTitle>
          <ExperienceEditor items={data.experience} onChange={v => update('experience', v)} />
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button className="flex-1 sm:flex-none sm:min-w-[160px]" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/professional/dashboard')}>
            View Dashboard
          </Button>
          <Button variant="ghost" onClick={() => attemptNav('/app/professional/dashboard')}>
            Cancel
          </Button>
        </div>

      </div>
    </div>
  );
}
