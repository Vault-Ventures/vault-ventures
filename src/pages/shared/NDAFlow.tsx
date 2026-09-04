import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// --- Types --------------------------------------------------------------------

type NDAStep = 'overview' | 'document' | 'sign' | 'waiting' | 'complete' | 'declined' | 'expired' | 'error';
type NDAStatus = 'required' | 'pending' | 'waiting' | 'accepted' | 'declined' | 'expired' | 'error';

interface NDAParty {
  name: string;
  role: string;
  accepted: boolean;
  acceptedAt?: string;
}

interface NDAData {
  id: string;
  title: string;
  business: string;
  purpose: string;
  status: NDAStatus;
  createdAt: string;
  expiresAt: string;
  parties: [NDAParty, NDAParty]; // [initiator, counterparty]
}

// --- Demo data ----------------------------------------------------------------

const NDA_DATA: NDAData = {
  id: 'nda-nova-health-001',
  title: 'Mutual Non-Disclosure Agreement',
  business: 'Nova Health',
  purpose: 'To enable secure sharing of confidential financial, strategic, and deal-related information between the parties for the purpose of evaluating a potential investment or collaboration.',
  status: 'required',
  createdAt: 'Aug 26, 2026',
  expiresAt: 'Aug 26, 2028',
  parties: [
    { name: 'Rifat Ahsan', role: 'Founder - Nova Health', accepted: true, acceptedAt: 'Aug 26, 2026' },
    { name: 'You', role: 'Investor', accepted: false },
  ],
};

const KEY_TERMS = [
  {
    label: 'Confidential Information',
    desc: 'All non-public business, financial, strategic, and technical information shared between the parties under this agreement.',
  },
  {
    label: 'Permitted Use',
    desc: 'Confidential information may only be used to evaluate the potential investment or collaboration described in this agreement.',
  },
  {
    label: 'Disclosure Restrictions',
    desc: 'Neither party may share, publish, or disclose confidential information to any third party without prior written consent.',
  },
  {
    label: 'Duration',
    desc: 'This agreement remains in effect for 24 months from the date of signing, unless terminated earlier by mutual written consent.',
  },
  {
    label: 'Obligations',
    desc: 'Both parties agree to take reasonable precautions to protect confidential information with the same care used for their own proprietary information.',
  },
];

const AGREEMENT_TEXT = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date of acceptance by both parties, by and between the parties identified in the Vault Ventures platform.

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any data or information that is proprietary to a party and not generally known to the public, including but not limited to: business plans, financial projections, customer information, product roadmaps, technical specifications, trade secrets, and any other information designated as confidential.

2. OBLIGATIONS OF RECEIVING PARTY
Each party agrees to: (a) hold the other party's Confidential Information in strict confidence; (b) not disclose Confidential Information to any third party without prior written consent; (c) use Confidential Information solely for the purpose of evaluating a potential business relationship; (d) take reasonable precautions to protect the confidentiality of such information.

3. EXCLUSIONS
This Agreement does not apply to information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was rightfully known to the receiving party before disclosure; (c) is independently developed by the receiving party without use of Confidential Information; (d) is required to be disclosed by law or court order.

4. TERM
This Agreement shall remain in effect for a period of twenty-four (24) months from the date of last signature and may be extended by mutual written agreement.

5. NO LICENSE
Nothing in this Agreement grants either party any rights, licenses, or interests in the other party's Confidential Information except as expressly set forth herein.

6. GOVERNING LAW
This Agreement shall be governed by applicable law in the jurisdiction of the disclosing party's principal place of business.

7. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties concerning its subject matter and supersedes all prior discussions and agreements.`;

// --- Sub-components -----------------------------------------------------------

function StepIndicator({ step }: { step: NDAStep }) {
  const steps: { key: NDAStep; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'document', label: 'Review' },
    { key: 'sign', label: 'Sign' },
    { key: 'waiting', label: 'Pending' },
    { key: 'complete', label: 'Complete' },
  ];
  const mainSteps = steps.filter(s => !['declined', 'expired', 'error'].includes(s.key));
  const currentIdx = mainSteps.findIndex(s => s.key === step);

  if (['declined', 'expired', 'error'].includes(step)) return null;

  return (
    <div className="flex items-center gap-0">
      {mainSteps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                done ? 'bg-[#22C55E] border-[#22C55E] text-white'
                  : active ? 'border-[#C67A4E] bg-[rgba(198,122,78,0.10)] text-[#C67A4E]'
                  : 'border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]'
              }`}>
                {done ? (
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-[color:var(--vv-text)]' : done ? 'text-[#22C55E]' : 'text-[color:var(--vv-text-tertiary)]'}`}>
                {s.label}
              </span>
            </div>
            {i < mainSteps.length - 1 && (
              <div className={`flex-1 h-px mb-5 mx-1 ${done ? 'bg-[#22C55E]/40' : 'bg-[#35446A]/50'}`}
                style={{ minWidth: '24px' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PartyStatus({ party, label }: { party: NDAParty; label: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-[10px] border ${
      party.accepted ? 'border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.05)]' : 'border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)]'
    }`}>
      <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${
        party.accepted ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[color:var(--vv-border-strong)] bg-transparent'
      }`}>
        {party.accepted ? (
          <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-[#35446A]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{party.name}</p>
        <p className="text-[11px] text-[color:var(--vv-text-tertiary)]">{party.role}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {party.accepted ? (
          <>
            <p className="text-[11px] font-semibold text-[#22C55E]">Accepted</p>
            {party.acceptedAt && <p className="text-[10px] text-[color:var(--vv-text-tertiary)]">{party.acceptedAt}</p>}
          </>
        ) : (
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Awaiting</p>
        )}
      </div>
    </div>
  );
}

// --- Main ---------------------------------------------------------------------

export default function NDAFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') ?? '/app/founder/businesses/nova-health';
  const skipToComplete = searchParams.get('demo') === 'complete';

  const [step, setStep] = useState<NDAStep>(skipToComplete ? 'complete' : 'overview');
  const [agreed, setAgreed] = useState(false);
  const [showFullDoc, setShowFullDoc] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [sigName, setSigName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ndaData, setNdaData] = useState(NDA_DATA);
  const [loadError, setLoadError] = useState(false);

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => {
      if (Math.random() < 0.05) setLoadError(true); // 5% error rate for demo realism
    }, 300);
    return () => clearTimeout(t);
  }, []);

  function handleSign() {
    if (!sigName.trim() || !agreed) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setNdaData(d => ({
        ...d,
        status: 'waiting',
        parties: [d.parties[0], { ...d.parties[1], accepted: true, acceptedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }],
      }));
      setStep('waiting');
    }, 1200);
  }

  function handleSimulateComplete() {
    setNdaData(d => ({ ...d, status: 'accepted' }));
    setStep('complete');
  }

  function handleDecline() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setNdaData(d => ({ ...d, status: 'declined' }));
      setShowDeclineConfirm(false);
      setStep('declined');
    }, 800);
  }

  const accentViolet = 'rgba(167,139,250,0.14)';
  const violetText = '#A78BFA';

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Decline confirm modal */}
      {showDeclineConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeclineConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="decline-nda-title">
            <div className="w-full max-w-sm rounded-[16px] overflow-hidden vv-glass-elevated p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#F04438]/10 border border-[#F04438]/22 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" fill="none" stroke="#F04438" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <path d="M12 9v4M12 17h.01"/>
                  </svg>
                </div>
                <p id="decline-nda-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">Decline NDA?</p>
              </div>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] mb-5 leading-relaxed">
                Declining will prevent access to NDA-protected Stage 3 information for this business. You can request a new NDA at any time.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowDeclineConfirm(false)}>Cancel</Button>
                <button
                  onClick={handleDecline}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white bg-[#F04438] hover:bg-[#E03428] disabled:opacity-50 transition-colors">
                  {loading ? 'Declining-' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Full document modal */}
      {showFullDoc && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowFullDoc(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="full-nda-title">
            <div className="w-full max-w-2xl max-h-[80vh] rounded-[16px] overflow-hidden vv-glass-elevated flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vv-border)] flex-shrink-0">
                <p id="full-nda-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display">{NDA_DATA.title}</p>
                <button onClick={() => setShowFullDoc(false)} aria-label="Close full NDA document" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <pre className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-relaxed font-sans whitespace-pre-wrap">{AGREEMENT_TEXT}</pre>
              </div>
              <div className="px-6 py-4 border-t border-[color:var(--vv-border)] flex-shrink-0">
                <Button className="w-full" onClick={() => setShowFullDoc(false)}>Close</Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* -- Page header ----------------------------------- */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(returnTo)}
          className="flex items-center gap-1.5 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">{NDA_DATA.business}</span>
        <span className="text-[#35446A]">/</span>
        <span className="text-[12px] text-[color:var(--vv-text-secondary)]">NDA</span>
      </div>

      {/* Trust badge + title */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: violetText, borderColor: accentViolet, background: 'rgba(167,139,250,0.06)' }}>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              NDA Protected
            </div>
          </div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-[color:var(--vv-text)] leading-tight">
            {NDA_DATA.title}
          </h1>
          <p className="text-[13px] text-[color:var(--vv-text-tertiary)] mt-1">{NDA_DATA.business} - Requested {NDA_DATA.createdAt}</p>
        </div>
        {/* Step indicator */}
        {!['declined', 'expired', 'error'].includes(step) && (
          <div className="flex-shrink-0 hidden sm:flex">
            <StepIndicator step={step} />
          </div>
        )}
      </div>

      {/* Mobile step indicator */}
      {!['declined', 'expired', 'error'].includes(step) && (
        <div className="sm:hidden mb-5">
          <StepIndicator step={step} />
        </div>
      )}

      {/* -- STEP: OVERVIEW -------------------------------- */}
      {step === 'overview' && (
        <div className="space-y-4">
          {/* Why required */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-3">Why this NDA is required</p>
            <p className="text-[13px] text-[color:var(--vv-text-secondary)] leading-relaxed mb-4">{NDA_DATA.purpose}</p>
            <div className="flex flex-wrap gap-2">
              {['Detailed Financial Projections', 'Cap Table & Equity', 'Confidential Documents', 'Full Deal Terms'].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[11.5px] text-[color:var(--vv-text-secondary)] px-2.5 py-1 rounded-md"
                  style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.14)' }}>
                  <svg width="10" height="10" fill="none" stroke="#A78BFA" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Agreement details */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-3">Agreement Details</p>
            <div className="space-y-0 divide-y divide-[#1c2a3e]">
              {[
                { label: 'Agreement Type', value: 'Mutual NDA' },
                { label: 'Business', value: NDA_DATA.business },
                { label: 'Created', value: NDA_DATA.createdAt },
                { label: 'Expires', value: NDA_DATA.expiresAt },
                { label: 'Stage Unlocked', value: 'Stage 3 - NDA Protected' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 gap-4">
                  <span className="text-[12px] text-[color:var(--vv-text-tertiary)]">{label}</span>
                  <span className="text-[12.5px] text-[color:var(--vv-text)] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Party status */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-3">Parties</p>
            <div className="space-y-2">
              <PartyStatus party={ndaData.parties[0]} label="Founder" />
              <PartyStatus party={ndaData.parties[1]} label="Counterparty" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={() => setStep('document')}>
              Review NDA
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="ml-1">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Button>
            <Button variant="secondary" onClick={() => navigate(returnTo)}>Maybe Later</Button>
          </div>
        </div>
      )}

      {/* -- STEP: DOCUMENT -------------------------------- */}
      {step === 'document' && (
        <div className="space-y-4">
          {/* Key terms */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold">Key Terms Summary</p>
              <button onClick={() => setShowFullDoc(true)}
                className="text-[11.5px] text-[#C67A4E] hover:underline">
                View Full Agreement
              </button>
            </div>
            <div className="space-y-3">
              {KEY_TERMS.map((term, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C67A4E] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)] mb-0.5">{term.label}</p>
                    <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] leading-snug">{term.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document card */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(167,139,250,0.09)', border: '1px solid rgba(167,139,250,0.20)' }}>
                <svg width="18" height="18" fill="none" stroke="#A78BFA" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">{NDA_DATA.title}</p>
                <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">Between {ndaData.parties[0].name} and {ndaData.parties[1].name}</p>
              </div>
            </div>

            {/* Agreement preview */}
            <div className="rounded-[10px] border border-[color:var(--vv-border)] bg-[#0D1626] p-4 mb-4 max-h-40 overflow-hidden relative">
              <pre className="text-[10.5px] text-[color:var(--vv-text-tertiary)] leading-relaxed font-sans whitespace-pre-wrap">
                {AGREEMENT_TEXT.slice(0, 600)}-
              </pre>
              <div className="absolute bottom-0 left-0 right-0 h-12"
                style={{ background: 'linear-gradient(to top, rgba(13,22,38,0.95), transparent)' }} />
            </div>

            <button onClick={() => setShowFullDoc(true)}
              className="w-full py-2 rounded-[8px] text-[12.5px] text-[#C67A4E] border border-[color:var(--vv-border)] hover:border-[color:var(--vv-border-strong)] hover:bg-[color:var(--vv-raised)] transition-colors">
              View Full Agreement
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={() => setStep('sign')}>Continue to Sign</Button>
            <Button variant="secondary" onClick={() => setStep('overview')}>? Back</Button>
            <button onClick={() => setShowDeclineConfirm(true)}
              className="text-[12.5px] text-[color:var(--vv-text-tertiary)] hover:text-[#F04438] transition-colors px-4 py-2">
              Decline
            </button>
          </div>
        </div>
      )}

      {/* -- STEP: SIGN ------------------------------------ */}
      {step === 'sign' && (
        <div className="space-y-4">
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-4">Confirm Your Acceptance</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={sigName}
                  onChange={e => setSigName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] text-[13px] text-[color:var(--vv-text)] placeholder-[#35446A] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">Role</label>
                <input
                  type="text"
                  value="Investor"
                  readOnly
                  className="w-full px-3 py-2.5 rounded-[8px] bg-[#0D1626] border border-[color:var(--vv-border)] text-[13px] text-[color:var(--vv-text-tertiary)] outline-none cursor-default"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[color:var(--vv-text-tertiary)] mb-1.5">Date</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-[8px] bg-[#0D1626] border border-[color:var(--vv-border)] text-[13px] text-[color:var(--vv-text-tertiary)] outline-none cursor-default"
                />
              </div>
            </div>

            {/* Acceptance checkbox */}
            <label className={`flex items-start gap-3 p-4 rounded-[10px] border cursor-pointer transition-all ${
              agreed
                ? 'border-[rgba(198,122,78,0.30)] bg-[rgba(198,122,78,0.04)]'
                : 'border-[color:var(--vv-border-strong)] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] hover:border-[#5E6D8F]'
            }`}>
              <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border flex items-center justify-center transition-all ${
                agreed ? 'bg-[#C67A4E] border-[#C67A4E]' : 'border-[color:var(--vv-border-strong)]'
              }`}>
                {agreed && (
                  <svg width="9" height="9" fill="none" stroke="#0B1220" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug">
                I have read and understand the Mutual Non-Disclosure Agreement. I agree to be bound by its terms and confirm that I am authorised to accept on behalf of my represented party.
              </p>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              onClick={handleSign}
              disabled={!agreed || !sigName.trim() || loading}>
              {loading ? 'Submitting-' : 'Confirm & Sign'}
            </Button>
            <Button variant="secondary" onClick={() => setStep('document')}>Review Again</Button>
            <button onClick={() => setShowDeclineConfirm(true)}
              className="text-[12.5px] text-[color:var(--vv-text-tertiary)] hover:text-[#F04438] transition-colors px-4 py-2">
              Decline
            </button>
          </div>
        </div>
      )}

      {/* -- STEP: WAITING ---------------------------------- */}
      {step === 'waiting' && (
        <div className="space-y-4">
          {/* Success banner */}
          <div className="flex items-center gap-3 px-5 py-4 rounded-[12px]"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
            <div className="w-8 h-8 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#22C55E]">NDA accepted successfully</p>
              <p className="text-[11.5px] text-[#22C55E]/70">Waiting for the counterparty to complete their acceptance.</p>
            </div>
          </div>

          {/* Party status */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-5">
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--vv-text-tertiary)] font-semibold mb-3">Acceptance Status</p>
            <div className="space-y-2 mb-4">
              <PartyStatus party={ndaData.parties[0]} label="Founder" />
              <PartyStatus party={ndaData.parties[1]} label="You" />
            </div>

            {/* Waiting indicator */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[8px] bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse flex-shrink-0" />
              <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">
                Stage 3 access will unlock automatically once both parties have signed.
              </p>
            </div>
          </div>

          {/* Demo: simulate counterparty */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border-strong)]/40 border-dashed rounded-[14px] p-4">
            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1.5">Demo only</p>
            <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-3">Simulate the founder signing to see the complete flow.</p>
            <Button variant="secondary" size="sm" onClick={handleSimulateComplete}>
              Simulate Counterparty Acceptance
            </Button>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate(returnTo)}>Back to Business Profile</Button>
          </div>
        </div>
      )}

      {/* -- STEP: COMPLETE --------------------------------- */}
      {step === 'complete' && (
        <div className="space-y-4">
          {/* Complete state */}
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] overflow-hidden">
            <div className="px-5 pt-6 pb-5 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(167,139,250,0.10)', border: '2px solid rgba(167,139,250,0.30)' }}>
                  <svg width="28" height="28" fill="none" stroke="#A78BFA" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#22C55E] border-2 border-[#121A2B] flex items-center justify-center">
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <p className="font-display text-[18px] font-semibold text-[color:var(--vv-text)] mb-1">NDA Complete</p>
              <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-xs">
                Both parties have accepted. Stage 3 protected information is now accessible.
              </p>
            </div>

            <div className="border-t border-[#1c2a3e] px-5 py-4 space-y-2">
              <PartyStatus party={{ name: 'Rifat Ahsan', role: 'Founder - Nova Health', accepted: true, acceptedAt: 'Aug 26, 2026' }} label="Founder" />
              <PartyStatus party={{ name: 'You', role: 'Investor', accepted: true, acceptedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }} label="You" />
            </div>

            <div className="border-t border-[#1c2a3e] px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <svg width="13" height="13" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                <p className="text-[11.5px] font-semibold text-[#22C55E]">Stage 3 Access Unlocked</p>
              </div>
              <p className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-5">
                Detailed financials, cap table, confidential documents, and deal terms are now available.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1"
              onClick={() => navigate(`${returnTo}?stage=3`)}>
              View Protected Information
            </Button>
            <Button variant="secondary" onClick={() => navigate('/app/deal-room')}>
              Continue to Deal Room
            </Button>
          </div>
        </div>
      )}

      {/* -- STEP: DECLINED --------------------------------- */}
      {step === 'declined' && (
        <div className="space-y-4">
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-6 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(240,68,56,0.09)', border: '1px solid rgba(240,68,56,0.22)' }}>
              <svg width="22" height="22" fill="none" stroke="#F04438" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <p className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1.5">NDA Declined</p>
            <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-xs mx-auto leading-relaxed">
              Stage 3 information remains protected. You can request a new NDA at any time from the Business Profile.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate(returnTo)}>Back to Business Profile</Button>
        </div>
      )}

      {/* -- STEP: EXPIRED ---------------------------------- */}
      {step === 'expired' && (
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-6 text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.22)' }}>
            <svg width="22" height="22" fill="none" stroke="#F59E0B" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <p className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1.5">NDA Expired</p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-xs mx-auto leading-relaxed mb-5">
            This NDA is no longer valid. Contact the business to request a renewed agreement.
          </p>
          <Button className="w-full" onClick={() => navigate(returnTo)}>Back to Business Profile</Button>
        </div>
      )}

      {/* -- STEP: ERROR ------------------------------------ */}
      {(step === 'error' || loadError) && (
        <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[14px] p-6 text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(240,68,56,0.09)', border: '1px solid rgba(240,68,56,0.22)' }}>
            <svg width="22" height="22" fill="none" stroke="#F04438" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <p className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] mb-1.5">Unable to load the NDA</p>
          <p className="text-[12.5px] text-[color:var(--vv-text-tertiary)] max-w-xs mx-auto leading-relaxed mb-5">
            Something went wrong. Please try again or contact support if the issue persists.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setLoadError(false); setStep('overview'); }}>Try Again</Button>
            <Button variant="secondary" onClick={() => navigate(returnTo)}>Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}