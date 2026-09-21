import React, { useEffect, useRef, useState } from 'react';
import { api, ApiError, ParticipantVerificationEvidenceData, ParticipantVerificationRequestData, VerificationAccountData, VerificationRequestStatus } from '../../services/api';
import { Button } from '../ui/Button';

const statusLabels: Record<VerificationRequestStatus, string> = {
  pending: 'Pending', under_review: 'Under Review', needs_information: 'Needs Information',
  rejected: 'Rejected', approved: 'Approved', cancelled: 'Cancelled',
};
const activeStatuses: VerificationRequestStatus[] = ['pending', 'under_review', 'needs_information'];
const card = 'rounded-[10px] border border-[color:var(--vv-border)] bg-[color:var(--vv-surface)] p-5 space-y-3';
const input = 'block w-full rounded-md border border-[color:var(--vv-border)] bg-transparent px-3 py-2 text-sm';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.details) {
    return Object.values(error.details).flat().join(' ') || error.message;
  }
  return error instanceof Error ? error.message : 'Unable to complete this action. Please try again.';
}

export default function ParticipantVerification() {
  const [data, setData] = useState<{
    account: VerificationAccountData;
    request: ParticipantVerificationRequestData | null;
    evidence: ParticipantVerificationEvidenceData[];
  } | null>(null);
  const [busy, setBusy] = useState<string | null>('load');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const mounted = useRef(false);
  const locked = useRef(false);
  const generation = useRef(0);

  // Load all facts together. A failed read must never enable a new request or upload.
  async function load(version = ++generation.current) {
    const [account, request] = await Promise.all([api.verification.account(), api.verification.latest()]);
    const evidence = request ? await api.verification.evidence(request.id) : [];
    if (mounted.current && version === generation.current) {
      setData({ account, request, evidence });
      setPhone(previous => previous || account.phone || '');
    }
  }

  async function run(action: string, work?: () => Promise<unknown>, success = '') {
    if (locked.current) return;
    locked.current = true;
    setBusy(action);
    setError('');
    setMessage('');
    let actionError = '';
    try {
      if (work) await work();
    } catch (err) {
      actionError = errorMessage(err);
    }
    try {
      // Refetch even after mutation failure: another tab may have created a request.
      await load();
      if (mounted.current && !actionError) setMessage(success);
    } catch (err) {
      if (mounted.current) setData(null);
      actionError = [actionError, 'Could not refresh verification status.', errorMessage(err)].filter(Boolean).join(' ');
    } finally {
      if (mounted.current) {
        setError(actionError);
        setBusy(null);
      }
      locked.current = false;
    }
  }

  useEffect(() => {
    mounted.current = true;
    const version = ++generation.current;
    locked.current = true;
    void load(version).catch(err => {
      if (mounted.current && version === generation.current) {
        setData(null);
        setError(`Could not refresh verification status. ${errorMessage(err)}`);
      }
    }).finally(() => {
      if (mounted.current && version === generation.current) {
        locked.current = false;
        setBusy(null);
      }
    });
    const refresh = () => { if (document.visibilityState === 'visible') void run('load'); };
    window.addEventListener('focus', refresh);
    return () => {
      mounted.current = false;
      generation.current++;
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const account = data?.account;
  const request = data?.request;
  const identityVerified = account != null && account.verification_tier >= 1;
  const active = request != null && activeStatuses.includes(request.status);
  const canCreate = !!data && !!account?.email_verified_at && !!account?.phone_verified_at &&
    !identityVerified && (!request || request.status === 'rejected' || request.status === 'cancelled');
  const canUpload = !!data && !!request && request.requested_tier === 1 && active && data.evidence.length < 5;

  function upload() {
    if (!file || !request || !canUpload) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a PDF, JPEG, or PNG file no larger than 5 MiB.');
      return;
    }
    void run('upload', async () => {
      await api.verification.uploadEvidence(request.id, file);
      if (mounted.current) {
        setFile(null);
        setFileKey(value => value + 1);
      }
    }, 'Evidence uploaded. The list below has been refreshed from the server.');
  }

  return (
    <div className="max-w-2xl space-y-4 text-[color:var(--vv-text)]" aria-busy={!!busy}>
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Identity Verification</h2>
        <p className="font-medium">Tier 1 — Identity Verified</p>
        <p className="text-sm text-[color:var(--vv-text-secondary)]">Tier 1 is required for protected deal actions such as NDA execution. Verification applies to your account across all workspaces.</p>
        {identityVerified && <p className="text-green-500">{account?.verification_tier === 2 ? 'Tier 2 — Track-record Verified (includes identity verification)' : 'Your identity is verified.'}</p>}
        <Button variant="secondary" disabled={!!busy} onClick={() => void run('load')}>Refresh Status</Button>
      </div>
      {busy && <p role="status">{busy === 'load' ? 'Loading verification status…' : 'Processing…'}</p>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {message && <p role="status" className="text-sm text-green-500">{message}</p>}
      {!data && !busy && <p>Verification status is unavailable. Refresh to retry before taking any action.</p>}
      {data && <>
        <section className={card} aria-labelledby="verification-email">
          <h3 id="verification-email" className="font-semibold">Email Verification</h3>
          <p>{account?.email_verified_at ? 'Verified' : 'Email verification required'}</p>
          <p className="text-sm">{account?.email}</p>
          {!account?.email_verified_at && <Button disabled={!!busy} onClick={() => void run('email', api.verification.sendEmail, 'Verification email requested. Follow the email link, then refresh status.')}>Send Verification Email</Button>}
          {import.meta.env.DEV && !account?.email_verified_at && <p className="text-xs text-[color:var(--vv-text-secondary)]">Development: if email delivery uses the log mailer, the message is recorded in server logs instead of delivered to your inbox. Requesting it does not verify your email.</p>}
        </section>
        <section className={card} aria-labelledby="verification-phone">
          <h3 id="verification-phone" className="font-semibold">Phone Verification</h3>
          <p>{account?.phone_verified_at ? 'Verified' : 'Phone verification required'}</p>
          {account?.phone_verified_at ? <p>{account.phone}</p> : <>
            <p className="text-sm text-[color:var(--vv-text-secondary)]">Request a code through the configured delivery service. Local development uses a private developer capture, not an SMS. Enter the delivered code to verify your phone.</p>
            <label className="block text-sm">International phone number<input className={input} type="tel" autoComplete="tel" value={phone} disabled={!!busy} onChange={e => setPhone(e.target.value)} placeholder="+880…" /></label>
            <Button disabled={!!busy || !/^\+?[1-9]\d{7,14}$/.test(phone.trim())} onClick={() => void run('phone-send', () => api.verification.sendPhoneCode(phone.trim()), 'Code delivery completed. In local development, ask the developer for the private captured code. Your phone is not verified until you enter it successfully.')}>Send Code</Button>
            <label className="block text-sm">Six-digit code<input className={input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} disabled={!!busy} onChange={e => setCode(e.target.value)} /></label>
            <Button disabled={!!busy || !/^\d{6}$/.test(code)} onClick={() => void run('phone-verify', () => api.verification.verifyPhone(code), 'Code accepted. Phone status reloaded from the server.')}>Verify Phone</Button>
          </>}
        </section>
        <section className={card} aria-labelledby="verification-request">
          <h3 id="verification-request" className="font-semibold">Identity Verification Request</h3>
          <p>{request ? statusLabels[request.status] : identityVerified ? 'Identity already verified' : 'No verification request'}</p>
          {request?.submitted_at && <p className="text-sm">Submitted: {new Date(request.submitted_at).toLocaleString()}</p>}
          {!identityVerified && <>
            {!account?.email_verified_at || !account?.phone_verified_at ? <p className="text-sm">Verify both your email and phone before requesting Tier 1.</p> : null}
            {active && <p className="text-sm">An active request already exists. Duplicate submission is unavailable.</p>}
            <Button disabled={!!busy || !canCreate} onClick={() => void run('create', api.verification.create, 'Request submitted. Upload your evidence below.')}>{request?.status === 'rejected' || request?.status === 'cancelled' ? 'Submit New Tier 1 Request' : 'Request Tier 1 Verification'}</Button>
          </>}
        </section>
        <section className={card} aria-labelledby="verification-evidence">
          <h3 id="verification-evidence" className="font-semibold">Evidence</h3>
          <p className="text-sm">PDF, JPEG, or PNG. Maximum 5 MiB per file and five files per request.</p>
          {!request ? <p>Create a verification request before uploading evidence.</p> : <>
            <p>{data.evidence.length} / 5 files uploaded</p>
            {data.evidence.length === 0 && <p>No evidence uploaded.</p>}
            <ul className="space-y-2">{data.evidence.map(item => <li key={item.id} className="text-sm break-words">{item.original_filename} — {item.mime_type} — {Math.ceil(item.file_size_bytes / 1024)} KiB</li>)}</ul>
            {canUpload && <>
              <label className="block text-sm">Evidence file<input key={fileKey} className={input} type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={!!busy} onChange={e => setFile(e.target.files?.[0] || null)} /></label>
              <Button disabled={!!busy || !file} onClick={upload}>Upload Evidence</Button>
            </>}
            {active && data.evidence.length >= 5 && <p>The five-file limit has been reached.</p>}
            {!active && <p>This request is closed. Evidence uploads are unavailable.</p>}
          </>}
        </section>
        <section className={card} aria-labelledby="verification-review">
          <h3 id="verification-review" className="font-semibold">Verification Review</h3>
          {!request && <p>{identityVerified ? 'Your account is identity verified.' : 'Review begins after you submit a request. Only an administrator can approve verification.'}</p>}
          {request?.status === 'pending' && <p>Your request is pending review. You can upload evidence above.</p>}
          {request?.status === 'under_review' && <p>An administrator is reviewing your request. You can still upload evidence.</p>}
          {request?.participant_message && ['needs_information', 'rejected'].includes(request.status) && <p className="whitespace-pre-wrap text-sm">{request.participant_message}</p>}
          {request?.status === 'needs_information' && <p>Additional information is required. Upload additional evidence above if space remains. {request.participant_message ? 'Follow the message above; contact platform support if you cannot provide the requested evidence.' : 'Specific review instructions are not available through this participant view; contact platform support for clarification.'}</p>}
          {request?.status === 'rejected' && <p>Your request was rejected. You may submit a new request after meeting the prerequisites. {request.participant_message ? 'Review the message above before resubmitting.' : 'Contact platform support for clarification; review details are not available here.'}</p>}
          {request?.status === 'cancelled' && <p>This request was cancelled. You may submit a new request after meeting the prerequisites.</p>}
          {request?.status === 'approved' && <p>{identityVerified ? 'Approved — Tier 1 Identity Verified.' : 'The request is approved, but your account does not currently show Tier 1. Refresh status or contact platform support.'}</p>}
        </section>
      </>}
    </div>
  );
}
