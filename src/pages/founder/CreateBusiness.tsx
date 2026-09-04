import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { IconCheck, IconArrowRight, IconChevronDown } from '../../components/layout/Icons';

// ── Types ─────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  name: string;
  shortDesc: string;
  industry: string;
  businessType: string;
  location: string;
  // Step 2
  problem: string;
  solution: string;
  targetMarket: string;
  businessModel: string;
  stage: string;
  teamSize: string;
  teamHighlight: string;
  requiredSkills: string[];
  // Step 3
  fundingAmount: string;
  fundingStage: string;
  useOfFunds: string;
  milestone1: string;
  milestone2: string;
  milestone3: string;
  revenueStatus: string;
  traction: string;
}

const EMPTY: FormData = {
  name: '', shortDesc: '', industry: '', businessType: '', location: '',
  problem: '', solution: '', targetMarket: '', businessModel: '', stage: '', teamSize: '', teamHighlight: '', requiredSkills: [],
  fundingAmount: '', fundingStage: '', useOfFunds: '', milestone1: '', milestone2: '', milestone3: '', revenueStatus: '', traction: '',
};

const SKILL_OPTIONS = [
  'Engineering', 'Product Management', 'Sales', 'Marketing', 'Finance', 'Operations',
  'Legal', 'Business Development', 'UI/UX Design', 'Data Science', 'AI / Machine Learning',
  'FinTech', 'HealthTech', 'Logistics', 'HR / Talent', 'Strategy', 'Investor Relations',
];

const INDUSTRIES = ['FinTech', 'HealthTech', 'EdTech', 'AgriTech', 'E-Commerce', 'Logistics', 'Manufacturing', 'SaaS', 'Media & Entertainment', 'Real Estate', 'Energy', 'Other'];
const BUSINESS_TYPES = ['Sole Proprietorship', 'Partnership', 'Private Limited (Pvt. Ltd.)', 'Public Limited', 'NGO / Non-Profit', 'Other'];
const STAGES = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth', 'Established'];
const FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Bridge', 'Grant'];
const REVENUE_STATUSES = ['Pre-revenue', 'Revenue generating (< ৳10L/mo)', 'Revenue generating (৳10L–50L/mo)', 'Revenue generating (> ৳50L/mo)'];
const TEAM_SIZES = ['Solo founder', '2–5', '6–15', '16–50', '50+'];

const STEPS = ['Basic Info', 'Business Details', 'Funding & Readiness', 'Review'];

// ── Field helpers ─────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5">
      {children}{required && <span className="text-[#F04438] ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-[11px] text-[#F04438]">{msg}</p>;
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[11px] text-[color:var(--vv-text-tertiary)]">{children}</p>;
}

const inputCls = (err?: string) =>
  `w-full h-9 px-3 rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border ${
    err ? 'border-[#F04438]/60 focus:border-[#F04438]' : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'
  }`;

const textareaCls = (err?: string) =>
  `w-full px-3 py-2.5 rounded-md text-[13px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none transition-colors resize-none bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border ${
    err ? 'border-[#F04438]/60 focus:border-[#F04438]' : 'border-[color:var(--vv-border-strong)] focus:border-[#C67A4E]'
  }`;

function SelectField({ value, onChange, options, placeholder, err }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string; err?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputCls(err)} appearance-none pr-8 cursor-pointer`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <IconChevronDown s={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] pointer-events-none" />
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-semibold transition-all ${
              i < current
                ? 'border-[#22C55E] bg-[#22C55E] text-white'
                : i === current
                  ? 'border-[#C67A4E] text-[#C67A4E]'
                  : 'border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]'
            }`}
              style={i === current ? { background: 'rgba(198,122,78,0.08)' } : {}}>
              {i < current ? <IconCheck s={12} /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap hidden sm:block ${
              i === current ? 'text-[color:var(--vv-text)]' : i < current ? 'text-[#22C55E]' : 'text-[color:var(--vv-text-tertiary)]'
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-5 sm:mb-6 min-w-[16px] transition-colors ${i < current ? 'bg-[#22C55E]/50' : 'bg-[#35446A]/50'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Review row ────────────────────────────────────────────────────

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border-strong)]">
        <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{title}</p>
        <button onClick={onEdit} className="text-[11.5px] text-[#C67A4E] hover:underline transition-colors">Edit</button>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] w-32 flex-shrink-0">{label}</span>
      <span className="text-[12px] text-[color:var(--vv-text-secondary)] flex-1">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function CreateBusiness() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showExit, setShowExit] = useState(false);
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormData) => (val: string) => {
    setData(d => ({ ...d, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };
  const toggleSkill = (skill: string) => {
    setData(d => ({
      ...d,
      requiredSkills: d.requiredSkills.includes(skill)
        ? d.requiredSkills.filter(s => s !== skill)
        : [...d.requiredSkills, skill],
    }));
  };

  // ── Validation ────────────────────────────────────────────────

  const validateStep = (s: number): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 0) {
      if (!data.name.trim()) errs.name = 'Business name is required.';
      else if (data.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
      if (!data.shortDesc.trim()) errs.shortDesc = 'Short description is required.';
      else if (data.shortDesc.trim().length < 20) errs.shortDesc = 'Please write at least 20 characters.';
      if (!data.industry) errs.industry = 'Select an industry.';
      if (!data.businessType) errs.businessType = 'Select a business type.';
      if (!data.location.trim()) errs.location = 'Location is required.';
    }
    if (s === 1) {
      if (!data.problem.trim()) errs.problem = 'Describe the problem you solve.';
      if (!data.solution.trim()) errs.solution = 'Describe your solution.';
      if (!data.targetMarket.trim()) errs.targetMarket = 'Describe your target market.';
      if (!data.stage) errs.stage = 'Select your current stage.';
    }
    if (s === 2) {
      if (!data.fundingAmount.trim()) errs.fundingAmount = 'Enter a funding requirement.';
      else if (!/^\d[\d,]*$/.test(data.fundingAmount.replace(/[৳,\s]/g, ''))) errs.fundingAmount = 'Enter a valid amount (numbers only).';
      if (!data.fundingStage) errs.fundingStage = 'Select a funding stage.';
      if (!data.milestone1.trim()) errs.milestone1 = 'Add at least one milestone.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const back = () => setStep(s => s - 1);

  const handleCreate = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCreated(true);
    }, 900);
  };

  const hasData = Object.entries(data).some(([k, v]) => k === 'requiredSkills' ? (v as string[]).length > 0 : (v as string).trim().length > 0);

  const formatAmount = (raw: string) => {
    const n = raw.replace(/[^\d]/g, '');
    return n ? `৳${Number(n).toLocaleString('en-IN')}` : '';
  };

  // ── Success ───────────────────────────────────────────────────

  if (created) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-5">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(198,122,78,0.18), rgba(198,122,78,0.12))', border: '1.5px solid rgba(198,122,78,0.30)' }}>
            <IconCheck s={22} className="text-[#C67A4E]" />
          </div>
          <p className="text-[10px] text-[#22C55E] uppercase tracking-widest font-semibold mb-2">Business Created</p>
          <h1 className="font-display text-[24px] font-semibold text-[color:var(--vv-text)] mb-1">{data.name}</h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-6">{data.stage} · {data.industry}</p>

          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[12px] p-5 text-left mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Funding requirement</span>
              <span className="font-mono text-[13px] text-[#C67A4E]">{formatAmount(data.fundingAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Funding stage</span>
              <span className="text-[12.5px] text-[color:var(--vv-text)]">{data.fundingStage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[rgba(94,109,143,0.10)] border border-[rgba(94,109,143,0.22)] text-[11px] text-[color:var(--vv-text-tertiary)] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5E6D8F]" />Saved as Draft
              </span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" size="md" onClick={() => navigate('/app/founder/dashboard')}>
              Go to Dashboard
            </Button>
            <Button className="flex-1" size="md" onClick={() => navigate('/app/founder/businesses')}>
              My Businesses <IconArrowRight s={14} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exit confirmation modal ───────────────────────────────────

  const ExitModal = () => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="discard-business-title">
      <div className="vv-glass-elevated rounded-[12px] w-full max-w-sm p-6 border border-[color:var(--vv-border-strong)]">
        <h3 id="discard-business-title" className="font-display text-[16px] font-semibold text-[color:var(--vv-text)] mb-2">Discard business setup?</h3>
        <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mb-5">Your progress will be lost. This cannot be undone.</p>
        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1" size="md" onClick={() => setShowExit(false)}>Continue Editing</Button>
          <Button variant="destructive" className="flex-1" size="md" onClick={() => navigate('/app/founder/dashboard')}>Discard</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0B1220] p-4 sm:p-6 lg:p-8">
      {showExit && <ExitModal />}

      <div className="max-w-[640px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-[#C67A4E] uppercase tracking-[0.12em] font-semibold mb-0.5">New Business</p>
            <h1 className="font-display text-[20px] font-semibold text-[color:var(--vv-text)]">Create Business</h1>
          </div>
          <button
            onClick={() => hasData ? setShowExit(true) : navigate('/app/founder/dashboard')}
            className="text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors px-3 py-1.5 rounded-md border border-transparent hover:border-[color:var(--vv-border-strong)]">
            Cancel
          </button>
        </div>

        {/* Progress */}
        <StepBar current={step} />

        {/* Step card */}
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5 sm:p-6">

          {/* ── Step 1: Basic Info ──────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <p className="text-[15px] font-display font-semibold text-[color:var(--vv-text)] mb-0.5">Basic Information</p>
                <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Tell us about your business.</p>
              </div>

              <div>
                <Label required>Business Name</Label>
                <input className={inputCls(errors.name)} value={data.name}
                  onChange={e => set('name')(e.target.value)} placeholder="e.g. Nova Health" />
                <FieldError msg={errors.name} />
              </div>

              <div>
                <Label required>Short Description</Label>
                <textarea className={textareaCls(errors.shortDesc)} rows={3} value={data.shortDesc}
                  onChange={e => set('shortDesc')(e.target.value)}
                  placeholder="One or two sentences describing what your business does." />
                <div className="flex justify-between">
                  <FieldError msg={errors.shortDesc} />
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1 ml-auto">{data.shortDesc.length}/280</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Industry</Label>
                  <SelectField value={data.industry} onChange={set('industry')} options={INDUSTRIES} placeholder="Select industry" err={errors.industry} />
                  <FieldError msg={errors.industry} />
                </div>
                <div>
                  <Label required>Business Type</Label>
                  <SelectField value={data.businessType} onChange={set('businessType')} options={BUSINESS_TYPES} placeholder="Select type" err={errors.businessType} />
                  <FieldError msg={errors.businessType} />
                </div>
              </div>

              <div>
                <Label required>Location</Label>
                <input className={inputCls(errors.location)} value={data.location}
                  onChange={e => set('location')(e.target.value)} placeholder="e.g. Dhaka, Bangladesh" />
                <Helper>City and country where your business is headquartered.</Helper>
                <FieldError msg={errors.location} />
              </div>
            </div>
          )}

          {/* ── Step 2: Business Details ────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-[15px] font-display font-semibold text-[color:var(--vv-text)] mb-0.5">Business Details</p>
                <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Describe your business for investors and professionals.</p>
              </div>

              <div>
                <Label required>Problem</Label>
                <textarea className={textareaCls(errors.problem)} rows={3} value={data.problem}
                  onChange={e => set('problem')(e.target.value)}
                  placeholder="What problem does your business solve?" />
                <FieldError msg={errors.problem} />
              </div>

              <div>
                <Label required>Solution</Label>
                <textarea className={textareaCls(errors.solution)} rows={3} value={data.solution}
                  onChange={e => set('solution')(e.target.value)}
                  placeholder="How does your business solve this problem?" />
                <FieldError msg={errors.solution} />
              </div>

              <div>
                <Label required>Target Market</Label>
                <input className={inputCls(errors.targetMarket)} value={data.targetMarket}
                  onChange={e => set('targetMarket')(e.target.value)}
                  placeholder="e.g. SME healthcare providers in Bangladesh" />
                <FieldError msg={errors.targetMarket} />
              </div>

              <div>
                <Label>Business Model</Label>
                <input className={inputCls()} value={data.businessModel}
                  onChange={e => set('businessModel')(e.target.value)}
                  placeholder="e.g. SaaS subscription, marketplace commission, B2B licensing" />
                <Helper>How does your business generate revenue?</Helper>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Current Stage</Label>
                  <SelectField value={data.stage} onChange={set('stage')} options={STAGES} placeholder="Select stage" err={errors.stage} />
                  <FieldError msg={errors.stage} />
                </div>
                <div>
                  <Label>Team Size</Label>
                  <SelectField value={data.teamSize} onChange={set('teamSize')} options={TEAM_SIZES} placeholder="Select size" />
                </div>
              </div>

              <div>
                <Label>Team Highlight</Label>
                <input className={inputCls()} value={data.teamHighlight}
                  onChange={e => set('teamHighlight')(e.target.value)}
                  placeholder="e.g. Former Google engineers, 10+ years sector experience" />
                <Helper>Brief note on what makes your team credible.</Helper>
              </div>

              <div>
                <Label>Required Skills</Label>
                <Helper>Skills you are looking for from investors, advisors, or professionals.</Helper>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SKILL_OPTIONS.map(skill => {
                    const active = data.requiredSkills.includes(skill);
                    return (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className={`px-2.5 py-1 rounded text-[11.5px] font-medium border transition-all ${
                          active
                            ? 'bg-[rgba(198,122,78,0.10)] border-[#C67A4E] text-[#C67A4E]'
                            : 'bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)] hover:border-[#5E6D8F] hover:text-[color:var(--vv-text-secondary)]'
                        }`}>
                        {skill}
                      </button>
                    );
                  })}
                </div>
                {data.requiredSkills.length > 0 && (
                  <p className="mt-2 text-[11px] text-[color:var(--vv-text-tertiary)]">{data.requiredSkills.length} skill{data.requiredSkills.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Funding & Readiness ─────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-[15px] font-display font-semibold text-[color:var(--vv-text)] mb-0.5">Funding & Readiness</p>
                <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Define your funding requirements and business milestones.</p>
              </div>

              {/* Funding */}
              <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4 space-y-4">
                <p className="text-[12px] font-semibold text-[color:var(--vv-text-secondary)] uppercase tracking-widest">Funding</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label required>Funding Requirement (৳)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] text-[13px]">৳</span>
                      <input
                        className={`${inputCls(errors.fundingAmount)} pl-7`}
                        value={data.fundingAmount}
                        onChange={e => set('fundingAmount')(e.target.value.replace(/[^\d]/g, ''))}
                        placeholder="15,00,000"
                      />
                    </div>
                    <Helper>Total amount you are seeking to raise.</Helper>
                    <FieldError msg={errors.fundingAmount} />
                  </div>
                  <div>
                    <Label required>Funding Stage</Label>
                    <SelectField value={data.fundingStage} onChange={set('fundingStage')} options={FUNDING_STAGES} placeholder="Select stage" err={errors.fundingStage} />
                    <FieldError msg={errors.fundingStage} />
                  </div>
                </div>

                <div>
                  <Label>Use of Funds</Label>
                  <textarea className={textareaCls()} rows={2} value={data.useOfFunds}
                    onChange={e => set('useOfFunds')(e.target.value)}
                    placeholder="e.g. 60% product development, 30% marketing, 10% operations" />
                </div>
              </div>

              {/* Milestones */}
              <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4 space-y-3">
                <p className="text-[12px] font-semibold text-[color:var(--vv-text-secondary)] uppercase tracking-widest">Milestones</p>
                <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">Key targets you plan to hit with this funding round.</p>

                {(['milestone1', 'milestone2', 'milestone3'] as const).map((key, i) => (
                  <div key={key}>
                    <Label required={i === 0}>{`Milestone ${i + 1}${i === 0 ? '' : ' (optional)'}`}</Label>
                    <input className={inputCls(i === 0 ? errors.milestone1 : undefined)} value={data[key]}
                      onChange={e => set(key)(e.target.value)}
                      placeholder={[
                        'e.g. Reach 500 paying customers',
                        'e.g. Launch in 3 new cities',
                        'e.g. Achieve ৳10L monthly revenue',
                      ][i]} />
                    {i === 0 && <FieldError msg={errors.milestone1} />}
                  </div>
                ))}
              </div>

              {/* Readiness */}
              <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-[10px] p-4 space-y-4">
                <p className="text-[12px] font-semibold text-[color:var(--vv-text-secondary)] uppercase tracking-widest">Readiness Information</p>

                <div>
                  <Label>Revenue Status</Label>
                  <SelectField value={data.revenueStatus} onChange={set('revenueStatus')} options={REVENUE_STATUSES} placeholder="Select status" />
                </div>

                <div>
                  <Label>Key Traction</Label>
                  <textarea className={textareaCls()} rows={2} value={data.traction}
                    onChange={e => set('traction')(e.target.value)}
                    placeholder="e.g. 200 beta users, LOIs from 3 hospitals, 2 pilot contracts signed" />
                  <Helper>This information feeds into your AI Readiness Score after publishing.</Helper>
                </div>
              </div>

              <div className="px-4 py-3 rounded-[10px] border border-[#C67A4E]/15 bg-[#C67A4E]/4">
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                  <span className="text-[#C67A4E] font-medium">Readiness Score</span> — Your AI Readiness Score will be calculated after your business is published and verified. All financial figures are simulations.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ──────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-[15px] font-display font-semibold text-[color:var(--vv-text)] mb-0.5">Review & Publish</p>
                <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)]">Check everything before creating your business profile.</p>
              </div>

              <ReviewSection title="Basic Information" onEdit={() => setStep(0)}>
                <ReviewRow label="Business Name" value={data.name} />
                <ReviewRow label="Description" value={data.shortDesc} />
                <ReviewRow label="Industry" value={data.industry} />
                <ReviewRow label="Type" value={data.businessType} />
                <ReviewRow label="Location" value={data.location} />
              </ReviewSection>

              <ReviewSection title="Business Details" onEdit={() => setStep(1)}>
                <ReviewRow label="Problem" value={data.problem} />
                <ReviewRow label="Solution" value={data.solution} />
                <ReviewRow label="Target Market" value={data.targetMarket} />
                <ReviewRow label="Business Model" value={data.businessModel} />
                <ReviewRow label="Stage" value={data.stage} />
                <ReviewRow label="Team Size" value={data.teamSize} />
                <ReviewRow label="Team Highlight" value={data.teamHighlight} />
                {data.requiredSkills.length > 0 && (
                  <div className="flex gap-3 pt-1">
                    <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] w-32 flex-shrink-0">Required Skills</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {data.requiredSkills.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded text-[10.5px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-secondary)]">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </ReviewSection>

              <ReviewSection title="Funding" onEdit={() => setStep(2)}>
                <ReviewRow label="Amount" value={data.fundingAmount ? formatAmount(data.fundingAmount) : ''} />
                <ReviewRow label="Stage" value={data.fundingStage} />
                <ReviewRow label="Use of Funds" value={data.useOfFunds} />
              </ReviewSection>

              <ReviewSection title="Milestones" onEdit={() => setStep(2)}>
                <ReviewRow label="Milestone 1" value={data.milestone1} />
                <ReviewRow label="Milestone 2" value={data.milestone2} />
                <ReviewRow label="Milestone 3" value={data.milestone3} />
              </ReviewSection>

              <ReviewSection title="Readiness Information" onEdit={() => setStep(2)}>
                <ReviewRow label="Revenue Status" value={data.revenueStatus} />
                <ReviewRow label="Key Traction" value={data.traction} />
              </ReviewSection>

              <div className="px-4 py-3 rounded-[10px] border border-[#F59E0B]/20 bg-[#F59E0B]/5">
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                  <span className="text-[#F59E0B] font-medium">Draft status</span> — Your business will be saved as a draft. Tier 1 identity verification is required before it appears in Discovery.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className={`flex gap-2.5 mt-6 pt-5 border-t border-[color:var(--vv-border)] ${step === 0 ? 'justify-end' : 'justify-between'}`}>
            {step > 0 && (
              <Button variant="secondary" size="md" onClick={back}>← Back</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button size="md" onClick={next}>Continue <IconArrowRight s={14} /></Button>
            ) : (
              <Button size="md" loading={submitting} onClick={handleCreate}>
                Create Business <IconArrowRight s={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Step hint */}
        <p className="text-center text-[11px] text-[color:var(--vv-text-tertiary)] mt-4">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>
    </div>
  );
}