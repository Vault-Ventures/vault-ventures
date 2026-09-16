import React, { useState } from 'react';
import { useAuth, NormalRole } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconX, IconCheck } from './Icons';

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

interface ManageRolesModalProps {
  onClose: () => void;
  onEditProfile?: () => void;
}

export function ManageRolesModal({ onClose, onEditProfile }: ManageRolesModalProps) {
  const { session, removeRole, enrollRole } = useAuth();
  const userRoles = session.roles.length > 0 ? session.roles : (['founder'] as NormalRole[]);
  const activeRole = session.activeRole;

  const [removingRole, setRemovingRole] = useState<NormalRole | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Investor questionnaire state
  const [showInvestorForm, setShowInvestorForm] = useState(false);
  const [investmentTypes, setInvestmentTypes] = useState<string[]>(['micro', 'large_standard']);
  const [minInvestment, setMinInvestment] = useState('50000');
  const [maxInvestment, setMaxInvestment] = useState('500000');
  const [industry, setIndustry] = useState('FinTech');
  const [businessStage, setBusinessStage] = useState('Seed');
  const [location, setLocation] = useState('Dhaka, Bangladesh');
  const [involvement, setInvolvement] = useState('Light-touch (board observer)');
  const [thesis, setThesis] = useState('');

  const allRoles: NormalRole[] = ['founder', 'investor', 'professional'];
  const availableRoles = allRoles.filter((r) => !userRoles.includes(r));

  const handleRemoveRole = async (role: NormalRole) => {
    setError(null);
    setIsProcessing(true);
    try {
      await removeRole(role);
      setRemovingRole(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to remove role.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRegularRole = async (role: NormalRole) => {
    setError(null);
    setIsProcessing(true);
    try {
      await enrollRole(role);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to enroll role.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInvestorEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const minNum = parseFloat(minInvestment);
    const maxNum = parseFloat(maxInvestment);
    if (!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      setError('Minimum investment must not exceed maximum investment.');
      return;
    }

    setIsProcessing(true);
    try {
      await enrollRole('investor', {
        role: 'investor',
        minimum_investment: minNum || 0,
        maximum_investment: maxNum || 0,
        investment_types: investmentTypes.length > 0 ? investmentTypes : ['micro'],
        industry,
        business_stage: businessStage,
        location,
        involvement,
        investment_thesis: thesis.trim() || undefined,
      });
      setShowInvestorForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to enroll investor role.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleInvestmentType = (type: string) => {
    if (investmentTypes.includes(type)) {
      if (investmentTypes.length > 1) {
        setInvestmentTypes(investmentTypes.filter((t) => t !== type));
      }
    } else {
      setInvestmentTypes([...investmentTypes, type]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="manage-roles-modal-title">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border)] rounded-[14px] w-full max-w-[440px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)] flex-shrink-0">
          <div>
            <h2 id="manage-roles-modal-title" className="font-display text-[14.5px] font-semibold text-[color:var(--vv-text)]">
              {showInvestorForm ? 'Investor Role Questionnaire' : 'Manage Roles'}
            </h2>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">
              {showInvestorForm ? 'Provide required investor preferences to activate this role.' : 'Configure your active workspace roles.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors p-1">
            <IconX s={14} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-5 py-2.5 bg-[#F04438]/10 border-b border-[#F04438]/25 text-[#F04438] text-[12px] flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-[11px] underline ml-2">Dismiss</button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {showInvestorForm ? (
            <form onSubmit={handleInvestorEnrollmentSubmit} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1.5">
                  Investment Focus / Types *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleInvestmentType('micro')}
                    className={`px-3 py-2 rounded-lg border text-left text-[11.5px] transition-all ${
                      investmentTypes.includes('micro')
                        ? 'border-[#C9A24B] bg-[#C9A24B]/10 text-[#C9A24B] font-medium'
                        : 'border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-tertiary)]'
                    }`}
                  >
                    <div className="font-semibold text-[12px]">Micro Deals</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Up to BDT 50,000</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleInvestmentType('large_standard')}
                    className={`px-3 py-2 rounded-lg border text-left text-[11.5px] transition-all ${
                      investmentTypes.includes('large_standard')
                        ? 'border-[#C9A24B] bg-[#C9A24B]/10 text-[#C9A24B] font-medium'
                        : 'border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] text-[color:var(--vv-text-tertiary)]'
                    }`}
                  >
                    <div className="font-semibold text-[12px]">Standard / Growth</div>
                    <div className="text-[10px] opacity-80 mt-0.5">BDT 50,000+</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                    Min Check (BDT) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minInvestment}
                    onChange={(e) => setMinInvestment(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                    Max Check (BDT) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={maxInvestment}
                    onChange={(e) => setMaxInvestment(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                    Target Industry *
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[#C9A24B]"
                  >
                    {['FinTech', 'HealthTech', 'AI & Data', 'SaaS', 'CleanTech', 'E-commerce', 'Consumer', 'Other'].map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                    Preferred Stage *
                  </label>
                  <select
                    value={businessStage}
                    onChange={(e) => setBusinessStage(e.target.value)}
                    className="w-full h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[#C9A24B]"
                  >
                    {['Idea / Pre-Seed', 'Seed', 'Series A', 'Series B+', 'Growth'].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                  Involvement Level *
                </label>
                <select
                  value={involvement}
                  onChange={(e) => setInvolvement(e.target.value)}
                  className="w-full h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[#C9A24B]"
                >
                  {['Passive (capital only)', 'Light-touch (board observer)', 'Active (board seat)', 'Hands-on advisory'].map((inv) => (
                    <option key={inv} value={inv}>{inv}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                  Geographic Location / Scope
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full h-8 px-2.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[color:var(--vv-text-secondary)] mb-1">
                  Investment Thesis / Bio
                </label>
                <textarea
                  rows={2}
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Briefly describe your investment thesis and criteria..."
                  className="w-full px-2.5 py-1.5 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] rounded-md text-[12.5px] text-[color:var(--vv-text)] focus:outline-none focus:border-[#C9A24B] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowInvestorForm(false)} disabled={isProcessing}>
                  Back
                </Button>
                <Button type="submit" size="sm" className="flex-1" disabled={isProcessing}>
                  {isProcessing ? 'Enrolling...' : 'Submit & Activate Investor Role'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              {/* Active roles list */}
              <div>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2.5">Active Roles</p>
                <div className="space-y-2">
                  {userRoles.map((r) => {
                    const isOnlyRole = userRoles.length <= 1;
                    const isBeingRemoved = removingRole === r;

                    return (
                      <div
                        key={r}
                        className="flex items-center justify-between p-3 rounded-lg bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: ROLE_COLORS[r] }}
                          />
                          <div>
                            <span className="text-[13px] font-medium text-[color:var(--vv-text)]">
                              {ROLE_LABELS[r]}
                            </span>
                            {activeRole === r && (
                              <span className="ml-2 text-[10.5px] text-[color:var(--vv-text-tertiary)]">
                                (Active Workspace)
                              </span>
                            )}
                          </div>
                        </div>

                        {isBeingRemoved ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#F59E0B]">Confirm?</span>
                            <button
                              disabled={isProcessing}
                              onClick={() => handleRemoveRole(r)}
                              className="text-[11px] text-[#F04438] font-semibold hover:underline"
                            >
                              Yes, Remove
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={() => setRemovingRole(null)}
                              className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : isOnlyRole ? (
                          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] italic" title="Cannot remove your only active role">
                            Primary Role
                          </span>
                        ) : (
                          <button
                            disabled={isProcessing}
                            onClick={() => setRemovingRole(r)}
                            className="text-[11.5px] text-[color:var(--vv-text-tertiary)] hover:text-[#F04438] transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add role list */}
              {availableRoles.length > 0 && (
                <div>
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2.5">Add a Role</p>
                  <div className="space-y-2">
                    {availableRoles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          if (r === 'investor') {
                            setShowInvestorForm(true);
                          } else {
                            handleAddRegularRole(r);
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] hover:border-[#C67A4E]/50 hover:bg-[color:var(--vv-raised)] transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: ROLE_COLORS[r] }}
                          />
                          <span className="text-[13px] font-medium text-[color:var(--vv-text-secondary)]">
                            Add {ROLE_LABELS[r]} Role
                          </span>
                        </div>
                        <span className="text-[11.5px] text-[#C67A4E] font-medium">
                          {r === 'investor' ? 'Complete Setup →' : '+ Add'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-relaxed">
                Removing a role removes workspace access. Your account, profile records, and historical role data remain safe.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-surface)_80%,transparent)] flex-shrink-0">
          {onEditProfile && !showInvestorForm ? (
            <button
              onClick={() => {
                onClose();
                onEditProfile();
              }}
              className="text-[11.5px] text-[#C67A4E] hover:underline"
            >
              Edit Full Profile Details →
            </button>
          ) : (
            <span />
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>

      </div>
    </div>
  );
}
export default ManageRolesModal;
