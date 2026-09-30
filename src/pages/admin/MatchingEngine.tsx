import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { IconCpu, IconFolder, IconShield, IconLock, IconSettings } from '../../components/layout/Icons';

// Source reference only. Scores remain authoritative in the backend matchers.
export const MATCHING_MODULES = [
  {
    name: 'Investor Matching', service: 'BusinessInvestorMatcher',
    rules: [
      { key: 'INDUSTRY', purpose: 'Industry alignment', weight: 25, logic: 'Case-insensitive industry equality; open preferences receive partial credit.' },
      { key: 'INVESTMENT_RANGE', purpose: 'Investment ticket fit', weight: 25, logic: 'Funding ask vs. min/max range or available investment. In range: full credit; outside: proportional credit.' },
      { key: 'BUSINESS_STAGE', purpose: 'Business stage', weight: 15, logic: 'Case-insensitive stage equality. Open investor preferences: partial credit.' },
      { key: 'RISK_LEVEL', purpose: 'Risk tolerance', weight: 15, logic: 'Risk at/below tolerance: full credit. One level above: half credit.' },
      { key: 'LOCATION', purpose: 'Location alignment', weight: 10, logic: 'Same location: 100%. Open preference: 75%. Different location: 25%.' },
      { key: 'INVOLVEMENT', purpose: 'Expected involvement', weight: 10, logic: 'Expected involvement vs. investor preference. Open or flexible: 75%.' },
    ],
  },
  {
    name: 'Professional Matching', service: 'BusinessProfessionalMatcher',
    rules: [
      { key: 'SKILL_OVERLAP', purpose: 'Required skill coverage', weight: 35, logic: 'Exact skill-name overlap / required skills, after trimming, lowercasing and deduplication.' },
      { key: 'INDUSTRY_EXPERIENCE', purpose: 'Industry experience', weight: 20, logic: 'Business industry in recorded experience: 100%. Other recorded industries: 25%.' },
      { key: 'EXPERIENCE_LEVEL', purpose: 'Experience level', weight: 15, logic: 'Meets/exceeds required rank: 100%. One rank below: 50%. Lower: 0%.' },
      { key: 'AVAILABILITY', purpose: 'Availability', weight: 15, logic: 'Exact commitment or full-time availability: 100%. Flexible/Any: 85%. Other mismatch: 0%.' },
      { key: 'LOCATION', purpose: 'Location alignment', weight: 10, logic: 'Same location: 100%. Remote/Any/unspecified professional location: 75%. Different: 25%.' },
      { key: 'COMPENSATION', purpose: 'Compensation compatibility', weight: 5, logic: 'Offered compensation overlaps preferences: 100%. Open preferences: 75%.' },
    ],
  },
];

const SUMMARY = [
  { title: 'Data Driven', text: 'Persisted profiles, preferences and business requirements.', Icon: IconFolder },
  { title: 'Deterministic Rules', text: 'Same inputs. Same weighted scores.', Icon: IconCpu },
  { title: 'Authoritative Backend', text: 'Scores calculated by backend matching services.', Icon: IconShield },
];

const CONFIGURATION = [
  { title: 'Algorithm Weights', Icon: IconSettings, label: 'Fixed in code', text: 'Weights are fixed in the two matcher classes. Each module totals 100%; scores are rounded and bounded to 0–100.' },
  { title: 'Database / Matching Inputs', Icon: IconFolder, label: 'Persisted inputs', text: 'Business requirements, investor preferences and professional profiles. Missing inputs use backend defaults.' },
  { title: 'Client Modification', Icon: IconLock, label: 'Read-only', text: 'The frontend cannot change weights or rules. No admin rule editor or matching configuration API is implemented.' },
];

export default function AdminMatchingEngine() {
  return (
    <div className="min-w-0 w-full p-4 md:p-6 max-w-[1100px] mx-auto space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-[color:var(--vv-text)]">Matching Engine</h1>
          <p className="text-xs text-[color:var(--vv-text-tertiary)] mt-1">Backend scoring for investor and professional recommendations.</p>
        </div>
        <Badge variant="neutral" className="self-start sm:self-auto shrink-0">Backend rules · Source reference</Badge>
      </header>

      <section aria-labelledby="architecture-heading" className="rounded-xl border border-[#2A3D5B] bg-[#14243C] p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="rounded-lg border border-[#C67A4E]/25 bg-[#C67A4E]/10 p-2.5 text-[#C67A4E]"><IconCpu s={22} /></span>
          <div className="min-w-0">
            <h2 id="architecture-heading" className="text-sm font-semibold text-[color:var(--vv-text)]">Deterministic Matching Engine</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">Stored inputs → recommendation service → two matchers, six weighted factors each.</p>
            <p className="mt-2 text-[11px] text-slate-400">Read-only source reference. No live health or activity monitoring.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUMMARY.map(({ title, text, Icon }) => (
          <section key={title} className="flex items-start gap-3 rounded-xl border border-[#263853] bg-[#111F35] p-4">
            <span aria-hidden="true" className="rounded-lg bg-[#1B304B] p-2 text-[#C67A4E]"><Icon s={17} /></span>
            <div><h2 className="text-xs font-semibold text-slate-100">{title}</h2><p className="mt-1 text-[11px] leading-relaxed text-slate-400">{text}</p></div>
          </section>
        ))}
      </div>

      <section aria-labelledby="rules-heading" className="min-w-0 rounded-xl border border-[#263853] overflow-hidden bg-[#101D31]">
        <div className="px-4 py-4 border-b border-[#263853] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="rules-heading" className="text-sm font-semibold text-slate-100">Active Deterministic Scoring Rules</h2>
            <p id="rules-description" className="mt-1 text-[11px] text-slate-400">Active means used in scoring, not live service status. Weights total 100% per module.</p>
          </div>
          <Badge variant="neutral">12 factors · 2 modules</Badge>
        </div>
        <div role="region" aria-label="Matching scoring rules" tabIndex={0} className="max-w-full overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C67A4E] focus-visible:outline-offset-[-2px]">
          <table aria-describedby="rules-description" className="w-full min-w-[640px] table-fixed text-left text-xs">
            <caption className="sr-only">Investor and professional scoring factors, fixed weights and implementation status</caption>
            <colgroup><col className="w-[19%]" /><col className="w-[22%]" /><col className="w-[42%]" /><col className="w-[17%]" /></colgroup>
            <thead className="bg-[#192A43] text-slate-300">
              <tr>{['Module', 'Purpose', 'Actual Criteria / Logic', 'Status'].map(label => <th key={label} scope="col" className="px-3 sm:px-4 py-3 text-[10px] tracking-wide uppercase font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263853]/70">
              {MATCHING_MODULES.flatMap((module, moduleIndex) => module.rules.map((rule, index) => (
                <tr key={`${module.service}-${rule.key}`} className={`align-top hover:bg-[#192A43]/60 transition-colors ${moduleIndex === 1 && index === 0 ? 'border-t-2 border-[#344966]' : ''}`}>
                  <td className="px-3 sm:px-4 py-3"><Badge variant={moduleIndex === 0 ? 'accent' : 'info'} className="leading-snug">{module.name}</Badge></td>
                  <th scope="row" className="px-3 sm:px-4 py-3 font-medium text-slate-100">{rule.purpose}<span className="block mt-1 text-[10px] text-[#D8956D] tabular-nums">{rule.weight}% weight</span></th>
                  <td className="px-3 sm:px-4 py-3 text-[11px] leading-relaxed text-slate-300">{rule.logic}</td>
                  <td className="px-3 sm:px-4 py-3"><Badge variant="success" className="leading-snug">Used in scoring</Badge></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="configuration-heading">
        <h2 id="configuration-heading" className="mb-3 text-sm font-semibold text-[color:var(--vv-text)]">Engine Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CONFIGURATION.map(({ title, Icon, label, text }) => (
            <section key={title} className="rounded-xl border border-[#263853] bg-[#111F35] p-4">
              <div className="flex items-center gap-2"><span aria-hidden="true" className="text-[#C67A4E]"><Icon s={16} /></span><h3 className="text-xs font-semibold text-slate-100">{title}</h3></div>
              <p className="mt-3 text-[10px] uppercase tracking-wide text-[#D8956D]">{label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{text}</p>
            </section>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--vv-text-tertiary)]">Scores do not certify verification or completeness. With no recorded compensation, the professional matcher defaults to salary and equity.</p>
      </section>
    </div>
  );
}
