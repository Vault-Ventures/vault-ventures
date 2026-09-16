import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { IconShield } from '../../components/layout/Icons';

interface MatchRuleInfo {
  domain: string;
  name: string;
  description: string;
  deterministicLogic: string;
}

const DETERMINISTIC_MATCH_RULES: MatchRuleInfo[] = [
  {
    domain: 'Investor Matching',
    name: 'Sector & Industry Alignment',
    description: 'Matches business industry classification with investor target sectors.',
    deterministicLogic: 'Direct overlap matching between business.industry and investor.preferred_sectors array.',
  },
  {
    domain: 'Investor Matching',
    name: 'Funding Stage Compatibility',
    description: 'Evaluates if the business round matches investor preference.',
    deterministicLogic: 'Evaluates business.stage against investor.preferred_stages (e.g. Pre-Seed, Seed, Series A).',
  },
  {
    domain: 'Investor Matching',
    name: 'Investment Ticket Fit',
    description: 'Verifies if business capital ask fits within the investor target ticket size.',
    deterministicLogic: 'Calculates range overlap between business target funding and min_investment_bdt / max_investment_bdt.',
  },
  {
    domain: 'Professional Matching',
    name: 'Skillset & Domain Expertise',
    description: 'Aligns business functional gaps with professional primary skills.',
    deterministicLogic: 'Keyword and domain token matching on professional.skills and business required role competencies.',
  },
  {
    domain: 'Professional Matching',
    name: 'Engagement Model & Availability',
    description: 'Checks hourly/fractional/equity availability against business opportunity specs.',
    deterministicLogic: 'Validates professional engagement types (advisory, fractional executive, project-based) with opportunity requirements.',
  },
];

export default function AdminMatchingEngine() {
  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--vv-text)]">Matching Engine Architecture</h1>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mt-0.5">Authoritative server-side deterministic matching rules and algorithms.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Deterministic Backend Service</Badge>
        </div>
      </div>

      {/* Info notice */}
      <div
        className="flex items-start gap-3 p-4 rounded-[10px]"
        style={{ background: 'rgba(198,122,78,0.06)', border: '1px solid rgba(198,122,78,0.18)' }}
      >
        <IconShield s={16} className="text-[#C67A4E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-[color:var(--vv-text)]">Backend-Authoritative Matching Engine</p>
          <p className="text-[color:var(--vv-text-tertiary)] leading-relaxed">
            The Vault Ventures matching engine is deterministic and executes server-side via <code className="text-[#C67A4E]">BusinessInvestorMatcher</code> and <code className="text-[#C67A4E]">BusinessProfessionalMatcher</code> services. Match scores are strictly calculated based on database preferences, verified business criteria, and mathematical overlap rather than arbitrary frontend presets.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-[12px] border border-[color:var(--vv-border)] overflow-hidden" style={{ background: '#0D1626' }}>
        <div className="px-5 py-4 border-b border-[color:var(--vv-border)]">
          <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Active Deterministic Scoring Rules</p>
          <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">Server-side algorithms executed during discovery and recommendation cycles.</p>
        </div>
        <div className="divide-y divide-[color:var(--vv-border)]">
          {DETERMINISTIC_MATCH_RULES.map((rule, idx) => (
            <div key={idx} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-[color:var(--vv-raised)]/20 transition-colors">
              <div className="space-y-1 md:max-w-md">
                <div className="flex items-center gap-2">
                  <Badge variant={rule.domain.includes('Investor') ? 'gold' : 'info'}>{rule.domain}</Badge>
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{rule.name}</p>
                </div>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{rule.description}</p>
              </div>
              <div className="bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-lg p-3 text-xs md:w-96">
                <p className="text-[10px] uppercase font-semibold text-[color:var(--vv-text-tertiary)] tracking-wider mb-1">Backend Logic</p>
                <p className="font-mono text-[11px] text-[color:var(--vv-text-secondary)]">{rule.deterministicLogic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Configuration note */}
      <div className="rounded-[10px] border border-[color:var(--vv-border)] p-4 text-xs text-[color:var(--vv-text-tertiary)] bg-[#121A2B]">
        <p className="font-medium text-[color:var(--vv-text)] mb-1">Dynamic Engine Configuration</p>
        <p>
          Matching parameters are synchronized with database indexing and scoring weights defined in application service providers. Client modification of scoring algorithms is disabled to preserve ecosystem integrity and deterministic recommendation audits.
        </p>
      </div>
    </div>
  );
}