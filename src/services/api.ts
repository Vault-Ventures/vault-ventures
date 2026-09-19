/**
 * Centralized API client for Vault Ventures frontend.
 * Communicates with the Laravel backend using Sanctum SPA session authentication.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export interface ApiErrorPayload {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
  status?: number;
}

export interface BusinessNdaData {
  business_id: number;
  counterparty_role: string | null;
  status: 'pending' | 'active' | 'declined' | null;
  status_label: string;
  nda_version: string;
  agreement_hash: string;
  current_stage: string;
  current_stage_label: string;
  stage_3_unlocked: boolean;
  current_user_accepted: boolean;
  founder_accepted: boolean;
  counterparty_accepted: boolean;
  requested_at: string | null;
  activated_at: string | null;
  declined_at: string | null;
}

export interface NdaActionPayload {
  counterparty_user_id?: number | string;
  role?: 'investor' | 'professional';
}

export interface DealTermProposalData {
  id: number;
  deal_id: number;
  version: number;
  proposed_by_user_id: number;
  proposed_by_role: 'founder' | 'investor' | 'professional' | string;
  investment_type: 'micro_profit_sharing' | 'standard_equity' | 'professional_collaboration' | string;
  amount: number | null;
  currency: string;
  equity_percentage: number | null;
  profit_sharing_percentage: number | null;
  loss_sharing_terms: string | null;
  proposed_terms: string | null;
  note: string | null;
  status: 'proposed' | 'countered' | 'accepted' | 'declined' | string;
  responded_by_user_id: number | null;
  responded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NegotiationData {
  deal_id: number;
  active_proposal: DealTermProposalData | null;
  proposals: DealTermProposalData[];
}

export interface ProposeTermsPayload {
  investment_type: 'micro_profit_sharing' | 'standard_equity' | 'professional_collaboration';
  amount?: number | null;
  equity_percentage?: number | null;
  profit_sharing_percentage?: number | null;
  loss_sharing_terms?: string | null;
  proposed_terms?: string | null;
  note?: string | null;
  role?: 'investor' | 'professional';
}

export interface RespondProposalPayload {
  action: 'accept' | 'decline' | 'counter';
  counter_terms?: Partial<ProposeTermsPayload>;
  terms?: Partial<ProposeTermsPayload>;
  role?: 'investor' | 'professional';
}

export interface AgreementTermsSnapshot {
  investment_type?: string;
  amount?: number | null;
  currency?: string;
  equity_percentage?: number | null;
  profit_sharing_percentage?: number | null;
  loss_sharing_terms?: string | null;
  proposed_terms?: string | null;
  proposal_version?: number;
  [key: string]: any;
}

export interface DealAgreementData {
  id: number;
  deal_id: number;
  accepted_proposal_id: number;
  agreement_type: 'profit_sharing_agreement' | 'shareholders_agreement' | 'collaboration_agreement' | 'deal_agreement' | string;
  title: string;
  terms_snapshot: AgreementTermsSnapshot;
  agreement_text: string;
  status: 'pending_signatures' | 'accepted' | 'declined' | string;
  founder_signed_at: string | null;
  founder_signed_user_id: number | null;
  counterparty_signed_at: string | null;
  counterparty_signed_user_id: number | null;
  finalized_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DealMilestoneData {
  id: number;
  deal_id: number;
  agreement_id: number | null;
  sequence_order: number;
  title: string;
  description: string | null;
  target_amount: number;
  currency: 'BDT' | string;
  target_date: string | null;
  status: 'pending' | 'active' | 'submitted' | 'funded' | string;
  progress_percentage: number;
  evidence_notes: string | null;
  evidence_urls: string[] | null;
  submitted_at: string | null;
  submitted_by?: number | null;
  submitted_by_user_id?: number | null;
  confirmed_at: string | null;
  confirmed_by?: number | null;
  confirmed_by_user_id?: number | null;
  confirmation_notes: string | null;
  funded_at: string | null;
  dispute_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FundingSummaryData {
  currency: 'BDT' | string;
  total_committed_bdt: number;
  total_allocated_bdt: number;
  total_released_bdt: number;
  remaining_locked_bdt: number;
  funding_progress_percentage: number;
}

export interface DealMilestonesResponseData {
  deal_id: number;
  summary: FundingSummaryData;
  milestones: DealMilestoneData[];
}

export interface DealMessageItem {
  id: number;
  deal_id: number;
  sender_user_id: number;
  sender: {
    id: number;
    name: string;
    email?: string;
    avatar_url?: string | null;
  } | null;
  body: string;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateMilestonePayload {
  sequence_order?: number;
  title: string;
  description?: string;
  target_amount?: number | string;
  target_date?: string;
}

export interface UpdateMilestonePayload {
  sequence_order?: number;
  title?: string;
  description?: string;
  target_amount?: number | string;
  target_date?: string;
}

export interface MilestoneProgressPayload {
  progress_percentage: number;
  notes?: string;
  evidence_notes?: string;
  evidence_urls?: string[];
}

export interface MilestoneSubmitPayload {
  progress_percentage: 100;
  evidence_notes?: string;
  notes?: string;
  evidence_urls?: string[];
}

export interface MilestoneConfirmPayload {
  confirmation_notes?: string;
  notes?: string;
  role?: string;
}

export interface MilestoneDisputePayload {
  dispute_reason: string;
  role?: string;
}

export interface DealActivationResponseData {
  id: number;
  stage: string;
  stage_label: string;
}

export interface DealFeedbackItem {
  id: number;
  deal_id?: number;
  reviewer_user_id?: number;
  reviewer_role: string;
  reviewer_name?: string;
  recipient_user_id?: number;
  recipient_role: string;
  business_name?: string;
  rating: number;
  comment: string | null;
  submitted_at: string | null;
}

export interface DealFeedbackStatusData {
  deal_id: number;
  deal_stage: string;
  can_submit_feedback: boolean;
  has_submitted_feedback: boolean;
  founder_feedback_submitted: boolean;
  counterparty_feedback_submitted: boolean;
  reviews: DealFeedbackItem[];
}

export interface SubmitDealFeedbackPayload {
  rating: number;
  comment?: string | null;
  role?: string;
}

export interface DealListItem {
  id: number;
  connection_id: number;
  business_id: number;
  business?: {
    id: number;
    name: string;
    industry?: string;
    business_stage?: string;
    location?: string;
    logo_url?: string | null;
  } | null;
  founder_user_id: number;
  founder?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  counterparty_user_id: number;
  counterparty?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  counterparty_role: 'investor' | 'professional' | string;
  stage: string;
  stage_label: string;
  stage_order: number;
  agreement_status?: string | null;
  milestones_count?: number;
  funded_milestones_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface DealListResponse {
  items: DealListItem[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface ReputationSummaryData {
  user_id: number;
  role: string;
  verification: {
    tier: number;
    is_identity_verified: boolean;
    is_track_record_verified: boolean;
  };
  track_record: {
    completed_deals_count: number;
    completed_milestones_count: number;
    total_simulated_bdt: string;
  };
  feedback: {
    reviews_count: number;
    average_rating: number | null;
    reviews: DealFeedbackItem[];
  };
  profile_evidence: Record<string, any>;
  financial_transparency?: {
    submitted_reports_count: number;
    verified_reports_count: number;
    evidence_backed_reports_count: number;
    active_discrepancies_count: number;
  };
}

export interface FinancialReportItem {
  id: number;
  deal_id: number;
  business_id?: number;
  business_name?: string;
  submitted_by?: {
    id: number;
    name: string;
  };
  submitted_by_user_id?: number;
  reporting_period_start: string;
  reporting_period_end: string;
  revenue: number;
  expenses: number;
  net_profit_loss: number;
  cash_position: number | null;
  notes?: string | null;
  status: 'self_reported' | 'evidence_submitted' | 'under_review' | 'verified' | string;
  status_label: string;
  evidence_count?: number;
  discrepancy_count?: number;
  reviewed_at?: string | null;
  reviewed_by?: { id: number; name: string } | null;
  admin_review_notes?: string | null;
  created_at?: string | null;
}

export interface AdminFinancialGovernanceOverviewData {
  overview: {
    total_financial_reports_count: number;
    total_deals_with_reporting: number;
    total_discrepancies_count: number;
  };
  verification_pipeline: {
    self_reported_count: number;
    evidence_submitted_count: number;
    under_review_count: number;
    verified_count: number;
  };
  discrepancy_queue: {
    pending_under_review_count: number;
    resolved_count: number;
    disputed_count: number;
  };
  financial_totals_bdt: {
    currency: string;
    total_reported_revenue: number;
    total_reported_expenses: number;
    total_calculated_profit_loss: number;
  };
  disclaimer: string;
}

export interface AdminFinancialReportsListResponse {
  reports: FinancialReportItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BusinessApplicationItem {
  id: number;
  business_id: number;
  business: string;
  business_logo_url: string | null;
  business_initials: string;
  industry: string;
  opportunity: string;
  role: string;
  applied_date: string;
  last_updated: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  timeline: { action: string; ts: string }[];
  note: string | null;
  skills: string[];
  rejection_reason: string | null;
}

export interface FounderApplicationItem {
  id: number;
  business_id: number;
  business_name: string;
  business_logo_url: string | null;
  professional: {
    id: number;
    name: string;
    email: string | null;
    avatar_url: string | null;
    initials: string;
    verification_tier: number;
    headline: string;
    bio: string | null;
    location: string | null;
    experience_years: number;
    skills: string[];
    hourly_rate: number | null;
  };
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  role_title: string;
  note: string | null;
  applied_at: string;
  reviewed_at: string | null;
  responded_at: string | null;
  rejection_reason: string | null;
  timeline: { action: string; ts: string }[];
}

export interface ApplyPayload {
  role_title?: string;
  note?: string;
  skills?: string[];
}

export interface ApplicationStatusResponse {
  has_applied: boolean;
  status: string;
  application: {
    id: number;
    status: string;
    role_title: string;
    applied_at: string;
    reviewed_at: string | null;
    responded_at: string | null;
  } | null;
}

export interface DealFinancialOverviewData {
  deal_id: number;
  business_id: number;
  deal_stage: string;
  agreed_terms: {
    investment_type: string;
    committed_amount_bdt: number;
    equity_percentage: number | null;
    profit_sharing_percentage: number | null;
    loss_sharing_terms: string | null;
  };
  milestone_funding: {
    currency: string;
    total_committed_bdt: number;
    total_released_bdt: number;
    remaining_locked_bdt: number;
    funding_progress_percentage: number;
    funded_milestones_count: number;
    pending_tranches_count: number;
  };
  operational_performance: {
    currency: string;
    reports_count: number;
    cumulative_revenue_bdt: number;
    cumulative_expenses_bdt: number;
    cumulative_net_profit_loss_bdt: number;
    latest_cash_position_bdt: number | null;
    verification_breakdown: Record<string, number>;
    total_evidence_files_count: number;
    total_discrepancies_count: number;
  };
  historical_periods: Array<{
    id: number;
    reporting_period_start: string;
    reporting_period_end: string;
    revenue: number;
    expenses: number;
    net_profit_loss: number;
    cash_position: number | null;
    status: string;
    evidence_count: number;
    discrepancy_count: number;
    created_at: string;
  }>;
  simulation_disclaimer: string;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: Record<string, string[]>;

  constructor(status: number, message: string, code?: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Extracts the XSRF-TOKEN cookie value if present.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

let csrfPromise: Promise<void> | null = null;

/**
 * Ensures a valid CSRF cookie has been initialized from Laravel Sanctum.
 */
export async function ensureCsrf(): Promise<void> {
  if (getCsrfToken()) {
    return;
  }

  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new ApiError(res.status, 'Failed to initialize CSRF protection.');
        }
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Core fetch wrapper that automatically handles:
 * - Credentials (cookies)
 * - CSRF token injection
 * - JSON serialization
 * - Structured error handling
 */
export async function apiClient<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, method = 'GET', body, ...rest } = options;

  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  if (isStateChanging) {
    await ensureCsrf();
  }

  let url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
  }

  const csrfToken = getCsrfToken();
  if (csrfToken && isStateChanging) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers,
      body: body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)
        ? JSON.stringify(body)
        : (body as BodyInit | null | undefined),
      ...rest,
    });
  } catch (err: unknown) {
    throw new ApiError(0, 'Unable to connect to server. Please ensure the backend is running.', 'NETWORK_ERROR');
  }

  // Parse JSON response
  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.error?.message || (response.status === 422 ? 'Validation failed.' : `Request failed with status ${response.status}`);
    const code = data?.error?.code || data?.code || `HTTP_${response.status}`;
    const details = data?.errors || data?.error?.details;
    throw new ApiError(response.status, message, code, details);
  }

  // If response is formatted using ApiResponse::success ($data['data'])
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

export interface InvestorPreferencesData {
  available_investment: string | number | null;
  minimum_investment: string | number | null;
  maximum_investment: string | number | null;
  industry: string | null;
  risk_level: string | null;
  business_stage: string | null;
  location: string | null;
  involvement: string | null;
  investment_types: string[] | null;
}

export interface ProfessionalProfileData {
  id: number;
  user_id: number;
  industry_experience: string[] | string | null;
  experience_level: string | null;
  availability: string | null;
  location: string | null;
  compensation_preferences: string[] | null;
  skills: string[];
}

export interface ExperienceItem {
  id?: string | number;
  role: string;
  org: string;
  duration?: string;
  desc?: string;
}

export interface PortfolioItem {
  id?: string | number;
  title: string;
  year?: string;
  role?: string;
  desc?: string;
  skills?: string[];
  link?: string;
}

export interface UserProfileResponseData {
  user: {
    id: number;
    name: string;
    email: string;
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    avatar_url?: string | null;
    cover_photo_url?: string | null;
    experience?: ExperienceItem[];
    portfolio?: PortfolioItem[];
    preferences?: Record<string, any>;
  };
  roles: string[];
  profiles: {
    founder: any | null;
    investor: any | null;
    professional: ProfessionalProfileData | null;
  };
}

export interface ReadinessAssessmentData {
  id: number;
  version: number;
  readiness_input_version_id: number;
  input_version: number;
  input_schema_version: string;
  rubric_version: string;
  source_snapshot: any;
  source_fingerprint: string;
  factor_results: Record<string, {
    score: number;
    max_score: number;
    label?: string;
    percentage?: number;
    answers?: Record<string, any>;
  }>;
  overall_score: number;
  weak_areas: string[];
  suggestions: Array<{ code: string; text: string; factor?: string }>;
  is_incomplete: boolean;
  calculation?: any;
  evaluated_at: string;
  created_at: string;
  basis: string;
  freshness?: {
    is_current: boolean;
    stale_reasons: string[];
  };
}

export interface ReadinessInputData {
  id: number;
  business_id: number;
  version: number;
  schema_version: string;
  answers: Record<string, any>;
  created_at: string;
}

export interface AdminVerificationEvidenceData {
  id: number;
  evidence_type: string;
  evidence_type_label: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface AdminVerificationRequestData {
  id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  };
  requested_tier: string | number;
  requested_tier_label?: string;
  status: 'pending' | 'under_review' | 'needs_information' | 'approved' | 'rejected' | 'cancelled' | string;
  assigned_admin_id?: number | null;
  assigned_admin?: {
    id: number;
    name: string;
    email: string;
  } | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  evidence_count?: number;
  evidence?: AdminVerificationEvidenceData[];
  rejection_reason?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminUserReputationData {
  user: {
    id: number;
    name: string;
    email: string;
    verification_tier: number;
    roles: string[];
  };
  reputation_by_role: Record<string, ReputationSummaryData>;
}

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  location?: string | null;
  verification_tier: number;
  is_suspended: boolean;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  suspended_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  roles: string[];
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
  latest_verification_request?: {
    id: number;
    requested_tier: number;
    status: string;
    submitted_at?: string;
  } | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  bio?: string | null;
  cover_photo_url?: string | null;
  experience?: ExperienceItem[];
  portfolio?: PortfolioItem[];
  preferences?: Record<string, any>;
  profiles?: {
    founder?: { id: number; bio?: string | null } | null;
    investor?: { id: number; investment_capacity?: any } | null;
    professional?: { id: number; skills?: string[]; experience_level?: string | null; location?: string | null; availability?: string | null } | null;
  };
  verification_requests?: Array<{
    id: number;
    requested_tier: number;
    status: string;
    submitted_at?: string;
    reviewed_at?: string;
    rejection_reason?: string | null;
  }>;
}

export interface AdminUsersFilterParams {
  search?: string;
  q?: string;
  role?: string;
  verification_tier?: number | string;
  tier?: number | string;
  status?: 'active' | 'suspended' | 'all';
  sort_by?: 'name' | 'email' | 'verification_tier' | 'created_at' | 'suspended_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface AdminUsersListResponse {
  users: AdminUserListItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BusinessRecord {
  id: number;
  name: string;
  description: string | null;
  industry: string | null;
  business_stage: string | null;
  risk_level: string | null;
  expected_involvement: string | null;
  location: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  status: string;
  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  requirements?: {
    funding_amount?: number | null;
    skills?: string[];
    accepted_investment_types?: string[];
    [key: string]: any;
  } | null;
  [key: string]: any;
}
export interface PaginatedItems<T> {
  items: T[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
}
export interface ConnectionItem {
  connection_id: number | null;
  business: { id: number; name: string };
  founder: { id: number; name: string };
  counterparty: { id: number; name: string };
  counterparty_role: 'investor' | 'professional';
  has_founder_interest: boolean;
  has_counterparty_interest: boolean;
  is_mutual: boolean;
  is_connected: boolean;
  connected_at: string | null;
  deal: { id: number; stage: string } | null;
}

export interface BusinessRecord {
  id: number;
  name: string;
  description: string | null;
  industry: string | null;
  business_stage: string | null;
  risk_level: string | null;
  expected_involvement: string | null;
  location: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected' | 'submitted' | string;
  submitted_at: string | null;
  approved_at?: string | null;
  approved_by?: { id: number; name: string } | null;
  rejected_at?: string | null;
  rejected_by?: { id: number; name: string } | null;
  rejection_reason?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  requirements?: {
    funding_amount: number | null;
    skills: string[];
    accepted_investment_types?: string[];
    micro_proposed_terms?: string | null;
    large_standard_proposed_terms?: string | null;
    required_experience_level?: string | null;
    required_availability?: string | null;
    compensation_preferences?: string[];
  } | null;
  founder?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface DealListItem {
  id: number;
  connection_id: number;
  business_id: number;
  business: {
    id: number;
    name: string;
    industry?: string;
    business_stage?: string;
    location?: string;
    logo_url?: string | null;
  } | null;
  founder_user_id: number;
  founder: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  counterparty_user_id: number;
  counterparty: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  counterparty_role: string;
  stage: string;
  stage_label: string;
  stage_order: number;
  agreement_status?: string | null;
  milestones_count: number;
  funded_milestones_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DealListResponse {
  items: DealListItem[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export const api = {
  get: <T = unknown>(url: string, params?: Record<string, any>) => apiClient<T>(url, { params }),
  post: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) => apiClient<T>(url, { ...options, method: 'POST', body: body as any }),
  put: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) => apiClient<T>(url, { ...options, method: 'PUT', body: body as any }),
  patch: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) => apiClient<T>(url, { ...options, method: 'PATCH', body: body as any }),
  delete: <T = unknown>(url: string, options?: RequestOptions) => apiClient<T>(url, { ...options, method: 'DELETE' }),

  deals: {
    list: (params?: { role?: string; business_id?: number | string; page?: number; per_page?: number }) =>
      apiClient<DealListResponse>(`/api/me/deals`, { params }),
    get: (dealId: number | string, role?: string) =>
      apiClient<{
        id: number;
        connection_id: number;
        business_id: number;
        founder_user_id: number;
        counterparty_user_id: number;
        counterparty_role: string;
        stage: string;
        stage_label: string;
        stage_order: number;
        created_at: string | null;
        updated_at: string | null;
      }>(`/api/me/deals/${dealId}`, { params: role ? { role } : undefined }),
    getNegotiation: (dealId: number | string, role?: string) =>
      apiClient<NegotiationData>(`/api/me/deals/${dealId}/negotiation`, { params: role ? { role } : undefined }),
    proposeNegotiation: (dealId: number | string, payload: ProposeTermsPayload) =>
      apiClient<DealTermProposalData>(`/api/me/deals/${dealId}/negotiation/propose`, { method: 'POST', body: payload }),
    respondNegotiation: (dealId: number | string, proposalId: number | string, payload: RespondProposalPayload) =>
      apiClient<DealTermProposalData>(`/api/me/deals/${dealId}/negotiation/${proposalId}/respond`, { method: 'POST', body: payload }),
    getAgreement: (dealId: number | string, role?: string) =>
      apiClient<DealAgreementData | null>(`/api/me/deals/${dealId}/agreement`, { params: role ? { role } : undefined }),
    generateAgreement: (dealId: number | string, role?: string) =>
      apiClient<DealAgreementData>(`/api/me/deals/${dealId}/agreement/generate`, { method: 'POST', params: role ? { role } : undefined }),
    signAgreement: (dealId: number | string, role?: string) =>
      apiClient<DealAgreementData>(`/api/me/deals/${dealId}/agreement/sign`, { method: 'POST', params: role ? { role } : undefined }),
    activateMilestones: (dealId: number | string, role?: string) =>
      apiClient<DealActivationResponseData>(`/api/me/deals/${dealId}/activate-milestones`, { method: 'POST', params: role ? { role } : undefined }),
    complete: (dealId: number | string, role?: string) =>
      apiClient<DealActivationResponseData>(`/api/me/deals/${dealId}/complete`, { method: 'POST', params: role ? { role } : undefined }),
    financialOverview: (dealId: number | string, role?: string) =>
      apiClient<DealFinancialOverviewData>(`/api/me/deals/${dealId}/financial-overview`, { params: role ? { role } : undefined }),
    financialReports: {
      list: (dealId: number | string, role?: string) =>
        apiClient<{ deal_id: number; reports: FinancialReportItem[] }>(`/api/me/deals/${dealId}/financial-reports`, { params: role ? { role } : undefined }),
    },
    feedback: {
      getStatus: (dealId: number | string, role?: string) =>
        apiClient<DealFeedbackStatusData>(`/api/me/deals/${dealId}/feedback`, { params: role ? { role } : undefined }),
      submit: (dealId: number | string, payload: SubmitDealFeedbackPayload, role?: string) =>
        apiClient<DealFeedbackItem>(`/api/me/deals/${dealId}/feedback`, { method: 'POST', body: payload, params: role ? { role } : undefined }),
    },
    messages: {
      list: (dealId: number | string, role?: string) =>
        apiClient<{ messages: DealMessageItem[] }>(`/api/me/deals/${dealId}/messages`, { params: role ? { role } : undefined }),
      send: (dealId: number | string, body: string, role?: string) =>
        apiClient<DealMessageItem>(`/api/me/deals/${dealId}/messages`, { method: 'POST', body: { body }, params: role ? { role } : undefined }),
    },
    milestones: {
      list: (dealId: number | string, role?: string) =>
        apiClient<DealMilestonesResponseData>(`/api/me/deals/${dealId}/milestones`, { params: role ? { role } : undefined }),
      getFundingSummary: (dealId: number | string, role?: string) =>
        apiClient<FundingSummaryData>(`/api/me/deals/${dealId}/funding-summary`, { params: role ? { role } : undefined }),
      create: (dealId: number | string, payload: CreateMilestonePayload, role?: string) =>
        apiClient<DealMilestoneData>(`/api/me/deals/${dealId}/milestones`, { method: 'POST', body: payload, params: role ? { role } : undefined }),
      update: (dealId: number | string, milestoneId: number | string, payload: UpdateMilestonePayload, role?: string) =>
        apiClient<DealMilestoneData>(`/api/me/deals/${dealId}/milestones/${milestoneId}`, { method: 'PUT', body: payload, params: role ? { role } : undefined }),
      updateProgress: (dealId: number | string, milestoneId: number | string, payload: MilestoneProgressPayload, role?: string) =>
        apiClient<DealMilestoneData>(`/api/me/deals/${dealId}/milestones/${milestoneId}/progress`, { method: 'POST', body: payload, params: role ? { role } : undefined }),
      submit: (dealId: number | string, milestoneId: number | string, payload: MilestoneSubmitPayload, role?: string) =>
        apiClient<DealMilestoneData>(`/api/me/deals/${dealId}/milestones/${milestoneId}/submit`, { method: 'POST', body: payload, params: role ? { role } : undefined }),
      confirm: (dealId: number | string, milestoneId: number | string, payload?: MilestoneConfirmPayload, role?: string) =>
        apiClient<DealMilestoneData>(`/api/me/deals/${dealId}/milestones/${milestoneId}/confirm`, { method: 'POST', body: payload || {}, params: role ? { role } : undefined }),
      dispute: (dealId: number | string, milestoneId: number | string, payload: MilestoneDisputePayload, role?: string) =>
        apiClient<DealMilestoneData>(`/api/me/deals/${dealId}/milestones/${milestoneId}/dispute`, { method: 'POST', body: payload, params: role ? { role } : undefined }),
      activate: (dealId: number | string, role?: string) =>
        apiClient<DealActivationResponseData>(`/api/me/deals/${dealId}/activate-milestones`, { method: 'POST', params: role ? { role } : undefined }),
      complete: (dealId: number | string, role?: string) =>
        apiClient<DealActivationResponseData>(`/api/me/deals/${dealId}/complete`, { method: 'POST', params: role ? { role } : undefined }),
    },
  },

  admin: {
    users: {
      list: (params?: AdminUsersFilterParams) =>
        apiClient<AdminUsersListResponse>(`/api/admin/users`, { params }),
      get: (userId: number | string) =>
        apiClient<AdminUserDetail>(`/api/admin/users/${userId}`),
      suspend: (userId: number | string, reason?: string) =>
        apiClient<AdminUserDetail>(`/api/admin/users/${userId}/suspend`, {
          method: 'POST',
          body: { reason, suspension_reason: reason },
        }),
      restore: (userId: number | string) =>
        apiClient<AdminUserDetail>(`/api/admin/users/${userId}/restore`, { method: 'POST' }),
    },
    verificationRequests: {
      list: (params?: { status?: string }) =>
        apiClient<AdminVerificationRequestData[]>(`/api/admin/verification-requests`, { params }),
      get: (id: number | string) =>
        apiClient<AdminVerificationRequestData>(`/api/admin/verification-requests/${id}`),
      approve: (id: number | string, notes?: string) =>
        apiClient<AdminVerificationRequestData>(`/api/admin/verification-requests/${id}/approve`, {
          method: 'POST',
          body: { admin_notes: notes, notes },
        }),
      reject: (id: number | string, reason?: string, notes?: string) =>
        apiClient<AdminVerificationRequestData>(`/api/admin/verification-requests/${id}/reject`, {
          method: 'POST',
          body: { rejection_reason: reason, reason, admin_notes: notes, notes },
        }),
      requestInformation: (id: number | string, notes: string) =>
        apiClient<AdminVerificationRequestData>(`/api/admin/verification-requests/${id}/request-information`, {
          method: 'POST',
          body: { admin_notes: notes, notes },
        }),
    },
    reputation: {
      getUser: (userId: number | string) =>
        apiClient<AdminUserReputationData>(`/api/admin/reputation/users/${userId}`),
    },
    financialReports: {
      list: (params?: { status?: string; deal_id?: number | string; business_id?: number | string; per_page?: number }) =>
        apiClient<AdminFinancialReportsListResponse>(`/api/admin/financial-reports`, { params }),
      get: (reportId: number | string) =>
        apiClient<FinancialReportItem>(`/api/admin/financial-reports/${reportId}`),
      getGovernance: () =>
        apiClient<AdminFinancialGovernanceOverviewData>(`/api/admin/financial-governance`),
      review: (reportId: number | string, payload: { status: 'verified' | 'under_review'; notes?: string }) =>
        apiClient<any>(`/api/admin/financial-reports/${reportId}/review`, { method: 'POST', body: payload }),
      resolveDiscrepancy: (discrepancyId: number | string, payload: { status: 'resolved' | 'disputed' | 'under_review'; notes?: string }) =>
        apiClient<any>(`/api/admin/financial-discrepancies/${discrepancyId}/resolve`, { method: 'POST', body: payload }),
      getAuditLogs: (reportId: number | string) =>
        apiClient<{ financial_report_id: number; audit_logs: any[] }>(`/api/admin/financial-reports/${reportId}/audit-logs`),
      downloadEvidenceUrl: (reportId: number | string, evidenceId: number | string) =>
        `${API_BASE_URL}/api/admin/financial-reports/${reportId}/evidence/${evidenceId}/download`,
    },
    businesses: {
      list: (params?: { status?: string }) =>
        apiClient<{ businesses: BusinessRecord[] }>(`/api/admin/businesses`, { params }),
      get: (id: number | string) =>
        apiClient<BusinessRecord>(`/api/admin/businesses/${id}`),
      approve: (id: number | string) =>
        apiClient<BusinessRecord>(`/api/admin/businesses/${id}/approve`, { method: 'POST' }),
      reject: (id: number | string, reason: string) =>
        apiClient<BusinessRecord>(`/api/admin/businesses/${id}/reject`, { method: 'POST', body: { rejection_reason: reason } }),
    },
  },

  recommendations: {
    businesses: (role?: string) => apiClient<any[]>(`/api/me/recommendations/businesses`, { params: role ? { role } : undefined }),
    investors: (businessId: number | string) => apiClient<any[]>(`/api/me/businesses/${businessId}/recommendations/investors`),
    professionals: (businessId: number | string) => apiClient<any[]>(`/api/me/businesses/${businessId}/recommendations/professionals`),
  },

  reputation: {
    get: (role?: string) =>
      apiClient<ReputationSummaryData>(`/api/me/reputation`, { params: role ? { role } : undefined }),
    getUser: (userId: number | string, role: string) =>
      apiClient<ReputationSummaryData>(`/api/users/${userId}/reputation`, { params: { role } }),
  },

  connections: {
    list: (role: string, page = 1) => apiClient<PaginatedItems<ConnectionItem>>('/api/me/connections', { params: { role, page } }),
    withdrawInterest: (businessId: number | string, role?: string) =>
      apiClient<{ success: boolean; message?: string }>(`/api/me/businesses/${businessId}/withdraw-interest`, {
        method: 'POST',
        body: role ? { role } : {},
      }),
  },
  businesses: {
    listPage: async (page = 1): Promise<PaginatedItems<BusinessRecord>> => {
      const result = await apiClient<{ items: BusinessRecord[]; pagination: { current_page: number; per_page: number; total: number; last_page?: number } }>('/api/me/businesses', { params: { page } });
      return { ...result, pagination: { ...result.pagination, last_page: result.pagination.last_page ?? Math.max(1, Math.ceil(result.pagination.total / result.pagination.per_page)) } };
    },
    updateRecord: (id: number | string, payload: Partial<BusinessRecord>) => apiClient<BusinessRecord>(`/api/me/businesses/${id}`, { method: 'PATCH', body: payload }),
    submit: (businessId: number | string) =>
      apiClient<BusinessRecord>(`/api/me/businesses/${businessId}/submit`, { method: 'POST' }),
    publish: (businessId: number | string) =>
      apiClient<BusinessRecord>(`/api/me/businesses/${businessId}/publish`, { method: 'POST' }),
    uploadLogo: (businessId: number | string, file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return apiClient<{ logo_url: string; business: BusinessRecord }>(`/api/me/businesses/${businessId}/logo`, {
        method: 'POST',
        body: formData,
      });
    },
    uploadCoverPhoto: (businessId: number | string, file: File) => {
      const formData = new FormData();
      formData.append('cover_photo', file);
      return apiClient<{ cover_photo_url: string; business: BusinessRecord }>(`/api/me/businesses/${businessId}/cover-photo`, {
        method: 'POST',
        body: formData,
      });
    },
    list: () => apiClient<any[]>(`/api/me/businesses`),
    get: (businessId: number | string) =>
      apiClient<any>(`/api/me/businesses/${businessId}`),
    getDisclosure: (businessId: number | string) =>
      apiClient<any>(`/api/me/businesses/${businessId}/disclosure`),
    getDisclosureStatus: (businessId: number | string) =>
      apiClient<any>(`/api/me/businesses/${businessId}/disclosure-status`),
    expressInterest: (businessId: number | string, payload?: any) =>
      apiClient<any>(`/api/me/businesses/${businessId}/express-interest`, { method: 'POST', body: payload || {} }),
    withdrawInterest: (businessId: number | string, payload?: any) =>
      apiClient<any>(`/api/me/businesses/${businessId}/withdraw-interest`, { method: 'POST', body: payload || {} }),
    getLatestAnalysis: (businessId: number | string) =>
      apiClient<any>(`/api/me/businesses/${businessId}/business-analyses/latest`),
    getConnectionStatus: (businessId: number | string, counterparty_user_id?: number | string, role?: string) =>
      apiClient<any>(`/api/me/businesses/${businessId}/connection-status`, { params: { counterparty_user_id, role } }),
    nda: {
      get: (businessId: number | string, counterparty_user_id?: number | string) =>
        apiClient<BusinessNdaData>(`/api/me/businesses/${businessId}/nda`, {
          params: counterparty_user_id ? { counterparty_user_id } : undefined,
        }),
      request: (businessId: number | string, payload?: NdaActionPayload) =>
        apiClient<BusinessNdaData>(`/api/me/businesses/${businessId}/nda/request`, {
          method: 'POST',
          body: payload || {},
        }),
      accept: (businessId: number | string, payload?: NdaActionPayload) =>
        apiClient<BusinessNdaData>(`/api/me/businesses/${businessId}/nda/accept`, {
          method: 'POST',
          body: payload || {},
        }),
      decline: (businessId: number | string, payload?: NdaActionPayload) =>
        apiClient<BusinessNdaData>(`/api/me/businesses/${businessId}/nda/decline`, {
          method: 'POST',
          body: payload || {},
        }),
    },
  },

  investorPreferences: {
    get: () => apiClient<InvestorPreferencesData>(`/api/me/investor-preferences`),
    update: (payload: Partial<InvestorPreferencesData>) =>
      apiClient<InvestorPreferencesData>(`/api/me/investor-preferences`, { method: 'PATCH', body: payload }),
  },

  profile: {
    get: () => apiClient<UserProfileResponseData>(`/api/me/profile`),
    getUser: (userId: number | string) => apiClient<UserProfileResponseData>(`/api/users/${userId}/profile`),
    update: (payload: {
      name?: string;
      headline?: string | null;
      bio?: string | null;
      location?: string | null;
      experience?: ExperienceItem[] | null;
      portfolio?: PortfolioItem[] | null;
      preferences?: Record<string, any> | null;
    }) =>
      apiClient<UserProfileResponseData>(`/api/me/profile`, { method: 'PATCH', body: payload }),
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiClient<{ avatar_url: string }>(`/api/me/avatar`, { method: 'POST', body: formData });
    },
    uploadCoverPhoto: (file: File) => {
      const formData = new FormData();
      formData.append('cover_photo', file);
      return apiClient<{ cover_photo_url: string }>(`/api/me/cover-photo`, { method: 'POST', body: formData });
    },
    updateProfessional: (payload: {
      skills?: string[];
      experience_level?: string | null;
      availability?: string | null;
      industry_experience?: string[] | null;
      location?: string | null;
      compensation_preferences?: string[] | null;
    }) =>
      apiClient<ProfessionalProfileData>(`/api/me/profiles/professional`, { method: 'PATCH', body: payload }),
  },

  roles: {
    enroll: (role: string) =>
      apiClient<{ role: string; profile: any }>(`/api/me/roles`, { method: 'POST', body: { role } }),
    remove: (role: string) =>
      apiClient<{ removed_role: string; roles: string[] }>(`/api/me/roles/${role}`, { method: 'DELETE' }),
  },

  readiness: {
    listAssessments: (businessId: number | string) =>
      apiClient<ReadinessAssessmentData[]>(`/api/me/businesses/${businessId}/readiness-assessments`),
    getLatestAssessment: (businessId: number | string) =>
      apiClient<ReadinessAssessmentData | null>(`/api/me/businesses/${businessId}/readiness-assessments/latest`),
    getAssessmentVersion: (businessId: number | string, version: number | string) =>
      apiClient<ReadinessAssessmentData>(`/api/me/businesses/${businessId}/readiness-assessments/${version}`),
    createAssessment: (businessId: number | string) =>
      apiClient<ReadinessAssessmentData>(`/api/me/businesses/${businessId}/readiness-assessments`, { method: 'POST' }),
    getLatestInputs: (businessId: number | string) =>
      apiClient<ReadinessInputData | null>(`/api/me/businesses/${businessId}/readiness-inputs`),
    saveInputs: (businessId: number | string, answers: Record<string, any>) =>
      apiClient<ReadinessInputData>(`/api/me/businesses/${businessId}/readiness-inputs`, { method: 'POST', body: { answers } }),
  },

  notifications: {
    list: () => apiClient<unknown[]>('/api/me/notifications'),
    unreadCount: () => apiClient<{ unread_count: number }>('/api/me/notifications/unread-count'),
    markRead: (id: string) => apiClient<unknown>(`/api/me/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => apiClient<null>('/api/me/notifications/mark-all-read', { method: 'POST' }),
  },

  notificationPreferences: {
    get: () => apiClient<Record<string, boolean>>('/api/me/notification-preferences'),
    update: (prefs: Record<string, boolean>) =>
      apiClient<Record<string, boolean>>('/api/me/notification-preferences', {
        method: 'PATCH',
        body: { preferences: prefs },
      }),
  },

  auth: {
    changePassword: (payload: {
      current_password: string;
      new_password: string;
      new_password_confirmation: string;
    }) => apiClient<null>('/api/me/password', { method: 'PUT', body: payload }),
  },

  applications: {
    apply: (businessId: number | string, payload?: ApplyPayload) =>
      apiClient<BusinessApplicationItem>(`/api/me/businesses/${businessId}/apply`, {
        method: 'POST',
        body: payload || {},
      }),
    getStatus: (businessId: number | string) =>
      apiClient<ApplicationStatusResponse>(`/api/me/businesses/${businessId}/application-status`),
    professional: {
      list: (params?: { status?: string; search?: string }) => {
        const q = new URLSearchParams();
        if (params?.status) q.append('status', params.status);
        if (params?.search) q.append('search', params.search);
        const qs = q.toString() ? `?${q.toString()}` : '';
        return apiClient<BusinessApplicationItem[]>(`/api/me/professional/applications${qs}`);
      },
      withdraw: (id: number | string) =>
        apiClient<{ id: number; status: string }>(`/api/me/professional/applications/${id}/withdraw`, {
          method: 'POST',
        }),
    },
    founder: {
      list: (params?: { business_id?: number | string; status?: string; search?: string }) => {
        const q = new URLSearchParams();
        if (params?.business_id) q.append('business_id', String(params.business_id));
        if (params?.status) q.append('status', params.status);
        if (params?.search) q.append('search', params.search);
        const qs = q.toString() ? `?${q.toString()}` : '';
        return apiClient<FounderApplicationItem[]>(`/api/me/founder/applications${qs}`);
      },
      get: (id: number | string) =>
        apiClient<FounderApplicationItem>(`/api/me/founder/applications/${id}`),
      markUnderReview: (id: number | string) =>
        apiClient<{ id: number; status: string; reviewed_at: string }>(`/api/me/founder/applications/${id}/review`, {
          method: 'POST',
        }),
      accept: (id: number | string) =>
        apiClient<{ id: number; status: string; responded_at: string }>(`/api/me/founder/applications/${id}/accept`, {
          method: 'POST',
        }),
      reject: (id: number | string, reason?: string) =>
        apiClient<{ id: number; status: string; responded_at: string; rejection_reason?: string | null }>(
          `/api/me/founder/applications/${id}/reject`,
          { method: 'POST', body: { reason } }
        ),
    },
  },
};





