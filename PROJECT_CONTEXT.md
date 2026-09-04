# Vault Ventures — Project Context

**Version:** 1.5 | **Last Updated:** 2026-09-03 | **Phase:** 08

---

## 1. Project Identity

**Project Name:** Vault Ventures

**Product Concept:**  
Vault Ventures is a web-based platform enabling coordinated matching between:
- **Founders** seeking capital and professional talent
- **Investors** seeking investment opportunities and due diligence collaboration
- **Professionals** seeking engagement opportunities with early-stage companies

The platform bridges the traditional venture capital workflow with staged, trust-based information disclosure and multi-party deal management.

**Tagline:** Idea + Capital + Skills

**Current Development Status:**
- Frontend: code QA complete for the current mock-data scope; final browser responsive sign-off remains pending because local headless rendering is unavailable
- Backend: Not yet started
- Demo/Simulation: All data currently mocked (hardcoded, no persistence)
- Production Ready: No (architecture phase underway)

**Current Strategy:**
- Frontend-first: Complete and document frontend architecture before backend
- Specification-first: All product rules finalized before implementation
- Safe migration: Modular design allows gradual backend integration without breaking changes

---

## 2. Current Technology Stack

**Exact Versions from package.json:**

| Technology | Version | Purpose |
|----------|---------|---------|
| React | 19.0.0 | UI rendering |
| React DOM | 19.0.0 | DOM manipulation |
| React Router DOM | 7.18.2 | Client-side routing |
| TypeScript | 5.7.0 | Type safety |
| Vite | 8.0.5 | Build tooling & dev server |
| @vitejs/plugin-react | 6.0.0 | React + Vite integration |
| Tailwind CSS | 4.0.0 | Utility-first styling |
| @tailwindcss/vite | 4.0.0 | Tailwind v4 Vite plugin |
| oxfmt | 0.2.0 | Code formatting |
| @types/react | 19.0.0 | React type definitions |
| @types/react-dom | 19.0.0 | React DOM type definitions |
| @types/node | 22.0.0 | Node type definitions |

**No Additional Dependencies:**
- No HTTP client library (fetch only)
- No form validation library
- No state management library (Context only)
- No chart/visualization library
- No icon library (custom Icon component)
- No UI component library (all custom)

**Build Target:**
- Figma Make (special Vite configuration)
- Default port: 8443
- Environment: Web-only (TypeScript, React 19)

---

## 3. Current Architecture

### High-Level Overview

```
Landing Page (Public)
    ↓
Authentication (Email/Password)
    ↓
Onboarding (Role Selection)
    ↓
AppShell (Sidebar + Main Content)
    ├── Role Context (Founder/Investor/Professional)
    ├── Theme Context (Dark/Light)
    └── Router (Role-Specific Pages)
        ├── Founder Workspace (8 pages)
        ├── Investor Workspace (5 pages)
        ├── Professional Workspace (3 pages)
        ├── Shared Pages (12 pages)
        └── Admin Workspace (18 pages, role-gated)
```

### Entry Points
- **index.html** — Vite HTML shell, loads src/main.tsx into #root
- **src/main.tsx** — React DOM render, imports App.tsx
- **src/App.tsx** — Route definitions, role guard, ThemeProvider

### Folder Structure (Current)

```
src/
├── App.tsx                      # Route definitions + role-based guard
├── main.tsx                     # React entry point
├── index.css                    # Design tokens + Tailwind theme
├── vite-env.d.ts               # Vite type declarations
├── context/
│   └── ThemeContext.tsx        # Dark/light toggle
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Main shell + sidebar + role switcher
│   │   └── Icons.tsx           # Icon component factory
│   └── ui/
│       ├── Button.tsx          # Button variants
│       ├── Badge.tsx           # Status badges + verification badges
│       ├── Form.tsx            # Form field components
│       ├── ScoreComponents.tsx # Score gauges
│       ├── AIInsights.tsx      # Match/readiness components
│       ├── StagedDisclosure.tsx # Disclosure progress
│       ├── MatchExplainDrawer.tsx
│       ├── PremiumGate.tsx
│       ├── DataDisplay.tsx
│       └── Feedback.tsx
├── pages/
│   ├── Landing.tsx             # Public landing page
│   ├── auth/                   # (7 pages: login, register, onboarding, etc.)
│   ├── founder/                # (7 pages: dashboard, businesses, readiness, etc.)
│   ├── investor/               # (5 pages: dashboard, discover, portfolio, etc.)
│   ├── professional/           # (3 pages: dashboard, discover, applications)
│   ├── shared/                 # (12 pages: profile, settings, deal-room, nda, etc.)
│   └── admin/                  # (18 pages: dashboard, users, verification, etc.)
└── imports/                    # Specification documents + design references
```

### Layouts
- **AppShell** — Main authenticated layout with sidebar + top navigation
- **Sidebar** — Role-specific navigation (different items per Founder/Investor/Professional)
- **Role Switcher** — Dropdown to switch between active roles (demonstrates multi-role support)
- **Public Layout** — For Landing page (no sidebar)

### Shared UI Components
- **Button** — Primary (copper gradient), Secondary (glass), Tertiary, Destructive, Ghost, Success
- **Badge** — Status badges (cyan, warning, danger, success), Verification badges (gold)
- **Form** — TextInput, PasswordInput, FormField wrapper
- **Tables** — Basic table with sticky header, row hover, no sorting/pagination yet
- **Modal/Drawer** — Dialog components for forms and detail views
- **Score Gauges** — Circular progress for Match and Readiness scores
- **Loading/Empty States** — Skeleton screens, empty state patterns

### Role-Based Pages
| Role | Pages | Purpose |
|------|-------|---------|
| **Founder** | Dashboard, Businesses, Business Create, Business Detail, Readiness Score, Discover Investors, Discover Professionals | Business management + cap-seek workflow |
| **Investor** | Dashboard, Discover Businesses, Saved, Portfolio, Preferences | Deal sourcing + investment tracking |
| **Professional** | Dashboard, Discover, Applications, Profile | Opportunity discovery + engagement |
| **Admin** | 18 pages (Users, Verification, Businesses, Deals, Analytics, etc.) | Platform operations |
| **Shared** | Profile, Settings, Deal Room, NDA, Negotiation, Milestones, Feedback, Reputation, Connections | Cross-role features |

### Current Data Flow
1. Component renders
2. Component reads hardcoded mock data constant
3. Component displays data with event handlers
4. Event handlers update local component state only
5. **No persistence, no backend calls, no validation**

### Mock Data Strategy (Current)
- All data defined as constants at top of component files
- BUSINESSES[], USERS[], METRICS[], DEAL_ROOMS[], etc.
- No relationships enforced (e.g., clicking a business doesn't load its detail from data)
- All financial figures are simulated in Bengali Taka (৳)
- Timestamps are hardcoded

### Authentication (Current — Demo Mode)
- Login accepts any email/password
- No JWT tokens or session validation
- No permission checking
- Frontend session state is stored in `sessionStorage` under `vv_demo_session`
- Normal session tracks user placeholder, available roles, active role, and onboarding state
- Logout clears the normal demo session and returns to `/login`
- Role selection is frontend workspace state only, not backend authorization
- Admin uses separate `vv_admin_session` storage and `/admin-login`; it is not switchable
- Frontend route guards provide navigation UX only; backend authorization does not exist yet

### Frontend Session Architecture (Phase 04)
- `src/context/AuthContext.tsx` owns the minimal typed session model
- Normal users may hold Founder, Investor, and Professional roles in one session
- Active normal role controls AppShell navigation and dashboard perspective
- Registration creates an onboarding-incomplete normal session; onboarding finalizes roles
- Admin sessions have no normal roles and cannot enter normal onboarding or workspaces
- `src/App.tsx` separates authenticated, normal-user, role-specific, and Admin route boundaries
- This is demo state, not secure authentication; no secrets or real credentials are stored

### API/Service Layer (Current)
- **None.** No HTTP client, no API abstraction, no backend connection point.
- **Future Requirement:** Will need API client layer to support backend integration.

---

## 4. User Roles

### Normal Roles (Switchable)
Users can have zero, one, two, or all three of these roles on a single account:

#### **Founder**
- **Purpose:** Founders seeking investment capital and professional advisory talent
- **Key Features:**
  - Create and manage business profiles
  - Get AI Readiness Score (8-factor assessment)
  - Discover and match with investors
  - Discover and match with professionals
  - Participate in Deal Rooms and NDA flows
  - Track milestone funding and reputation
- **Data Specific to Founder:** Business profiles, Readiness Scores, investment asks, team composition

#### **Investor**
- **Purpose:** Investors seeking deal-flow and capital deployment opportunities
- **Key Features:**
  - Discover and filter business opportunities
  - Save (bookmark) opportunities
  - Match scoring for each business
  - Set investment preferences (industry, stage, geography, etc.)
  - Reverse discovery ("who's interested in me?")
  - Simulated portfolio tracking
  - Participate in Deal Rooms
- **Data Specific to Investor:** Saved opportunities, portfolio, investment history, preferences

#### **Professional**
- **Purpose:** Professionals (advisors, consultants, operators) seeking engagement opportunities
- **Key Features:**
  - Discover business opportunities needing their skills
  - Apply to opportunities
  - Manage professional profile (skills, experience, availability)
  - Participate in Deal Rooms
  - Reputation based on completed engagements
- **Data Specific to Professional:** Applications, skills, experience, engagement history

### Privileged Role (Non-Switchable)
#### **Admin**
- **Purpose:** Platform operations and governance
- **Access Model:** Completely separate login (`/admin-login`)
- **Key Features:**
  - User management and verification
  - Business verification and flagging
  - Dispute resolution and reporting
  - Deal and application tracking
  - Financial and audit reporting
  - Matching engine configuration
  - Notification management
- **Critical Constraint:** Admin role must NOT appear in the normal role-switcher. It is a completely different account type/access level.

### Multi-Role Data Storage
A single user may have Founder, Investor, and Professional roles simultaneously. Their profile contains:
- **Common data:** Email, identity, verification tier, reputation
- **Founder profile:** Businesses, readiness scores, funding asks
- **Investor profile:** Portfolio, saved opportunities, preferences
- **Professional profile:** Skills, experience, applications

When switching roles, the UI shows role-specific pages and navigation items, but all profile data remains available in the unified profile view.

---

## 5. Core Product Concept

### Three-Way Match Engine

**Idea** (Founder with Business) + **Capital** (Investor with Funds) + **Skills** (Professional with Expertise)

| Participant | Input | Output | Benefit |
|-------------|-------|--------|---------|
| **Founder** | Business (idea, team, traction) | Raises capital + finds talent | Accelerates path to product-market fit |
| **Investor** | Capital + thesis | Qualified deal-flow + transparency | Reduces deal sourcing friction |
| **Professional** | Expertise + availability | High-impact work + compensation | Meaningful early-stage contribution |

### Admin Role
Platform governance enabling all three to operate within trust framework.

---

## 6. Core Business Rules

### Readiness Score
An 8-factor assessment of a founder's business preparedness for investment.

**8 Factors (Non-Negotiable):**
1. **Business Model Clarity** — Is the revenue model defined?
2. **Market Potential** — Is the TAM/SAM properly assessed?
3. **Traction & Validation** — Are customers validating the product?
4. **Team Completeness** — Are key roles filled?
5. **Financial Projections** — Are economics documented?
6. **Competitive Analysis** — Is differentiation clear?
7. **Legal & IP Status** — Are legal/IP risks understood?
8. **Funding Requirements** — Are use of funds clearly articulated?

**Scoring:**
- Each factor scored 0-100
- Each factor has a weight (total = 100%)
- Overall score = Σ(factor_score × factor_weight / 100)
- Result: 0-100 score with qualitative band (Early Stage / Developing / Investor-Ready)

**Status in MVP:**
- ✓ UI fully implemented
- ✓ Calculation logic in place (hardcoded factors)
- ✗ Backend calculation not implemented (future phase)
- ✗ No recalculation trigger (currently static per business)

**Important Constraints:**
- Readiness Score is NOT AI-generated; it is deterministic/rule-based
- Do NOT claim ML/deep-learning if only using deterministic logic
- Score must be recalculated on business profile updates (future)

---

### Verification Tiers
Identity and track-record verification levels (separate from reputation).

| Tier | Status | Requirements | Use Case |
|------|--------|--------------|----------|
| **0** | Unverified | Email only | Early access, limited platform features |
| **1** | Identity Verified | Government ID + proof of address | Full platform access, can create businesses, can invest |
| **2** | Track-record Verified | Background check + experience verification | Investor-ready status, can access Tier 2-protected deals |

**Rules:**
- Tier progression is administrative (verified by humans, not automatic)
- Tier 0 users can view public info only
- Tier 1+ can participate in deals
- Tier 2 can access Stage 3 (NDA-protected) information
- Reputation is separate and does NOT automatically promote tier

**Status in MVP:**
- ✓ Tier display and badges (gold badge for T1/T2)
- ✗ Verification process not implemented (admin UI present, no backend)
- ✗ No tier-based access enforcement (currently all users have access)

---

### Staged Disclosure
Progressive information reveal based on relationship and trust.

**4 Stages (Non-Negotiable):**

| Stage | Name | Content | Access | Unlock |
|-------|------|---------|--------|--------|
| **1** | Teaser | Business name, industry, stage, description | All verified users (Tier 1+) | Public |
| **2** | Extended Info | Team, market, business model details | After interest expressed | Founder must accept "Interest" action |
| **3** | NDA Protected | Financial projections, cap table, customer list | After mutual NDA signing | Dual-party NDA acceptance + Founder confirmation |
| **4** | Full Proposal | Complete data room, term sheet, agreements | After NDA complete + Founder approval | NDA signed + explicit founder unlock |

**Rules:**
- Stages are sequential; cannot skip (Stage 2 requires Stage 1, etc.)
- Stage 2 unlock initiated by viewer expressing interest
- Stage 3 requires mutual NDA (both parties must sign)
- Stage 4 requires founder explicit confirmation after NDA
- Once unlocked, information remains accessible

**Status in MVP:**
- ✓ UI/UX fully implemented (4-stage progress, lock/unlock buttons)
- ✓ Frontend stage tracking
- ✗ Backend enforcement: currently all stages accessible to all users
- ✗ Interest expression not persisted
- ✗ NDA not enforced (can bypass to access Stage 3)
- ✗ No stage retention across sessions

---

### Deal Lifecycle
Formalized stages from initial match through completion.

**8 Stages (Sequential):**
1. **Matched** — AI/algorithm identified viable pairing
2. **Interest Confirmed** — Both parties expressed interest
3. **Deal Room** — Formal deal-tracking workspace opened
4. **NDA Signed** — Mutual confidentiality agreement executed
5. **Negotiation** — Term sheet negotiation underway
6. **Agreement** — All parties signed final terms
7. **Milestone Funding Active** — Funding disbursed, milestones active
8. **Completed** — Final milestone reached or relationship concluded

**Important:**
- Stages are informational, not enforced (currently)
- Deal can progress or stall at any stage
- Multiple deals can involve same parties
- Each deal is independent

**Status in MVP:**
- ✓ UI showing deal stages in Deal Room
- ✗ Stage transitions not enforced
- ✗ Completion conditions not defined
- ✗ No milestone enforcement

---

### Investment Model
Vault Ventures simulates two investment types:

#### **Micro Investment** (Pre-Seed/Seed)
- Founder retains full control
- Investor provides capital + expertise
- Return = Profit/Loss Sharing (founder decides terms)
- **MVP Status:** Simulated only, no real capital

#### **Large/Standard Investment** (Series A+)
- Investor takes equity stake
- Governance rights / board seat potential
- Return = Ownership percentage
- **MVP Status:** Simulated only, no real equity

**Critical Constraints:**
- MVP is simulation only (no real money, no real equity)
- No payment processing
- No escrow
- No custody
- No brokerage registration
- No securities regulation compliance

**Important Messaging:**
- All financial figures clearly marked as simulated
- Never imply guaranteed returns
- Never imply real capital movement
- Never offer actual investment services

**Status in MVP:**
- ✓ Deal terms shown in Deal Room
- ✓ Portfolio value simulated
- ✗ No backend investment logic
- ✗ No financial calculations

---

### Profit & Loss
Financial outcome metric for completed investments.

**Formula:**
```
Net Outcome = Total Revenue - Total Expenses
```

**Rules:**
- Only calculated post-completion
- Never guaranteed
- Founder controls expense reporting
- Investor can view/dispute (future)

**Status in MVP:**
- ✓ Concept in portfolio view
- ✗ No calculation logic implemented

---

### Reputation System
Reputation is user trust built through verified on-platform activity.

**Reputation is NOT:**
- AI-generated
- Matching score
- Readiness score
- Automatic
- Social signals (follows, likes, views)

**Reputation IS:**
- Based on completed relationships/deals
- Strengthened by verified platform activity
- Separate from verification tier
- Built through feedback from counterparties
- Visible in user profiles

**Reputation Factors:**
- Completed deals (# and quality)
- Milestone completions (% on time)
- Verified experience (demonstrated in deal history)
- Feedback received (ratings from counterparties)
- Dispute history (low = good)

**Reputation Levels:**
- **Emerging** — New to platform, limited history
- **Established** — Some completed deals, positive feedback
- **Trusted** — Consistent track record, strong feedback
- **Proven** — Extensive activity, consistently excellent feedback

**Status in MVP:**
- ✓ UI showing reputation profiles + feedback
- ✓ Feedback form and rating system
- ✗ No backend reputation calculation
- ✗ Feedback not persisted
- ✗ Levels not computed from data

---

### AI & Scoring (MVP Constraints)

**Current Status:**
- Readiness Score uses deterministic 8-factor calculation (no ML)
- Match Score uses hardcoded per-user/business values (not dynamic)
- "AI Insights" UI component exists but contains no real AI
- Matching engine weights configurable in admin UI (not functional)

**Phase 05 Frontend Experience:**
- Readiness Score exposes all 8 documented factors, weighted breakdown, explanations, threshold warnings, and incomplete-data messaging.
- Match chips and explanation drawers identify the audience context, including Investor match and Professional match.
- Discovery keeps deterministic Search Results separate from AI Suggestions; AI mode communicates match-score ranking.
- AI indicators remain neutral and descriptive so Copper stays the brand accent rather than an AI signal.
- Recommendations and analyses remain mock/demo presentation data; no ML model or dynamic AI service exists.

**Phase 06 Core Frontend Experience:**
- Founder, Investor, Professional, and shared page inventories remain implemented under their role-specific routes.
- Existing dashboard, business, discovery, profile, connection, portfolio, application, reputation, settings, feedback, premium, and readiness flows were preserved.
- Page-to-page navigation uses the existing route conventions; Professional Applications now opens the relevant business detail destination.
- Readiness visibility remains available to the founder and in business-profile views; score data remains static/mock until backend recalculation and versioning exist.

**Phase 07 Frontend Permission Model:**
- `src/utils/permissions.ts` defines the frontend workspace/action matrix for Founder, Investor, Professional, and Admin.
- `src/App.tsx` uses workspace permissions alongside session role membership for role-specific route guards.
- AppShell navigation is derived from the active normal role; Admin remains a separate workspace and is never a normal role option.
- Business Profile owner/edit actions follow the active workspace role rather than a freely selectable demo perspective.
- Milestone controls are available to Founder and Investor workspaces; Professional users receive an access state.
- Negotiation controls are limited to the existing Founder/Professional context; unrelated Investor access receives an access state.
- These are frontend UX boundaries only. Backend authorization must remain the final security authority.

**Important Messaging:**
- Do NOT claim AI/ML for deterministic scoring
- Do NOT use "AI" badge unless score is actually ML-based
- Score visualization implies "generated" but not "intelligent"
- Users should understand scoring is rule-based until ML is added

**Scoring Terminology:**
- "Readiness Score" (explicit factor-based assessment)
- "Match Score" (algorithm-based compatibility, formula disclosed)
- "Reputation" (user activity-based, never called "AI")

**Future Decisions:**
- Whether to implement actual ML matching (Phase 08+)
- Whether to add contextual AI insights (Phase 08+)
- Whether to use LLM for business analysis (Phase 09+)

---

## 7. Design Direction

### Finalized Design Direction: **Charcoal + Copper**

#### Color Palette
| Token | Hex | Usage | Notes |
|-------|-----|-------|-------|
| **Background Base** | #111213 | App background (default dark) | Deep charcoal |
| **Surface** | #1A1C1D | Card/panel background | Slightly lighter charcoal |
| **Raised** | #212324 | Modals, elevated panels | Lighter still |
| **Primary Brand** | #C67A4E | Copper — all CTAs, buttons, active states | Vault Ventures signature |
| **Accent Warm** | #E8A878 | Copper warm variant (hover) | Lighter copper |
| **Accent Dark** | #7A4527 | Copper deep variant (pressed) | Darker copper |
| **Verification** | #C9A24B | Gold — verification badges ONLY | Never decorative |
| **Success** | #22C55E | Green — positive states | Milestones, completions |
| **Warning** | #F59E0B | Amber — alerts, pending | Action required |
| **Danger** | #F04438 | Red — errors, rejections | Caution |
| **Info** | #3B82F6 | Blue — neutral information | Semantic blue only |

#### Critical Design Rules
1. **Copper is NOT AI.** Copper is the Vault Ventures brand color. Do NOT use copper to imply "AI-generated."
2. **Blue is NOT brand.** Cyan/blue is reserved for semantic information. Do NOT use as primary brand accent.
3. **Gold is verification ONLY.** Gold badge = verified user or verified tier. Never use gold decoratively.
4. **Typography:** DM Sans (headings), Inter (body), IBM Plex Mono (numeric data)
5. **Spacing:** 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
6. **Radius:** 6px (inputs/buttons), 10px (cards), 14px (modals)
7. **Elevation:** Minimal shadows; 1px borders as primary separation
8. **No rounded pills** except badges and filter chips
9. **No decorative imagery** except data visualizations and real UI screenshots
10. **Glass effect** for sidebar and elevated surfaces (blur + opacity, not shadow)

#### Design Philosophy
- **Trustworthy:** Serious, professional, composed
- **Precise:** Data-forward, not emotional or decorative
- **Understated:** Quiet luxury, not flashy
- **Secure:** Evokes "vault" concept (layered, controlled access)
- **Intelligent:** Clear explanations, transparent mechanisms

**Direction G in effect:** Do NOT implement alternative visual redesigns without explicit approval.

---

## 8. Known Bugs

### BUG-01 — Investor Match Score Context Missing

**Status:** ✅ RESOLVED (frontend context labeling)

**Problem:**
- Match scores ARE differentiated per context (investor vs. professional)
- Explanation drawer IS context-aware
- Investor context is now shown directly on score chips and inside match analysis.

**Relevance:** Frontend (presentation polish)

**Current Implementation:** DiscoverBusinesses.tsx shows investorMatchScore, but card doesn't label "investor" vs. "professional"

**Remaining:** Backend-generated scores and persistence remain future work.

**Implementation Phase:** Phase 05 (completed)

---

### BUG-02 — Readiness Score Flow / Visibility Inconsistency

**Status:** ⚠️ Partially Addressed (UI complete, backend missing)

**Problem:**
- Readiness Score detail page exists and is functional
- Calculation logic is in place (8 factors hardcoded)
- **Missing:** When does score recalculate? (After business edit? Always latest?)
- **Missing:** Does it persist versions? (Score history implies yes)
- **Missing:** Is score visible to investors consistently? (Shown in some views, not others)

**Relevance:** Frontend + Backend

**Current Implementation:** ReadinessScore.tsx shows static factors with history UI. No backend trigger.

**Recommended Fix:** 
- Define recalculation rules (backend)
- Store score versions (backend)
- Ensure consistent investor visibility (frontend)

**Implementation Phase:** Phase 04+ (requires backend)

---

### BUG-03 — Professional Match Score Context Missing

**Status:** ✅ RESOLVED (frontend context labeling)

**Problem:**
- Match scores ARE context-aware for professionals
- Professional context is now shown directly on score chips and inside match analysis.

**Relevance:** Frontend (presentation)

**Remaining:** Backend-generated scores and persistence remain future work.

**Implementation Phase:** Phase 05 (completed)

---

### BUG-04 — Milestone Confirmation Responsibility Unclear

**Status:** ❌ Unresolved (product decision required)

**Problem:**
- Milestone UI shows "Confirm completion" button
- **Unclear:** Who clicks this? Founder only? Investor? Both?
- **Unclear:** What proof is required? (Text, file, link?)
- **Unclear:** Who approves? (founder unilateral, investor review, mutual?)
- **Unclear:** What happens on rejection?

**Relevance:** Frontend + Backend + Product

**Current Implementation:** MilestoneTracking.tsx shows static milestones with button (non-functional)

**Recommended Fix:** Product/PM must define:
1. Who initiates confirmation (Founder submits proof)
2. What evidence is required (description, file upload, link)
3. Approval workflow (founder submits, investor approves, or mutual?)
4. Rejection flow (request more info, timeline)

**Implementation Phase:** Phase 03 (requires spec clarification before frontend/backend work)

**NOT a bug:** This is a product design gap requiring PM/designer input.

---

### BUG-05 — Deal Room Role Differentiation Missing

**Status:** ⚠️ Partially Addressed (participants tracked, role-based perms missing)

**Problem:**
- Deal Room shows two participants (e.g., Founder + Investor)
- Terms display founder vs. investor positions
- **Missing:** Role-aware UI (each role sees "Your position" vs. "Their position")
- **Missing:** Role-based edit permissions (only founder can change founder position, etc.)
- **Missing:** Role-based state ("Awaiting founder response" vs. "Awaiting investor response")

**Relevance:** Frontend + Backend

**Current Implementation:** DealRoom.tsx shows static positions. No permission enforcement.

**Recommended Fix:**
- Perspective-aware UI (show "Your position" for current role)
- Edit permissions per role (backend enforces, frontend UI disables)
- State messaging per role ("Waiting for their approval")
- "Sign" vs. "Accept" terminology based on role

**Implementation Phase:** Phase 02-03 (frontend polish) + Phase 04+ (backend permissions)

---

### NOT A BUG — Matching Engine "Edit Weights / 28%-22%-18%"

**Intentional Design Decision, Not a Defect:**
- Admin UI allows weight configuration
- Actual matching algorithm not yet implemented
- This is a placeholder for future Phase 09 (Advanced Features)
- Do NOT add to bug tracker; is a known feature gap

---

## 9. Frontend vs Backend Responsibility Boundary

### Frontend Responsibility (Presentation & UX)
- Page navigation and routing
- Form input rendering and local validation
- Loading, error, and empty state display
- Role-aware UI rendering (show/hide elements per role)
- Score visualization and explanation
- Modal/drawer management
- User interaction flows (click, submit, toggle)
- Client-side filtering and sorting (client-side only data)
- Theme switching (dark/light)
- Accessibility (keyboard nav, screen readers, ARIA)

### Backend Responsibility (Truth & Enforcement)
- Authentication and session validation
- Authorization and permission checks
- Data persistence and retrieval
- Readiness score calculation (8-factor algorithm)
- Match score calculation (algorithm TBD)
- Reputation calculation (activity-based)
- Staged disclosure enforcement (cannot access Stage 3 without NDA)
- NDA state tracking (both parties must sign)
- Deal state transitions (enforce sequential stages)
- Investment/business rules (capital deployment, milestone validation)
- Verification tier promotion (human review only, no automation)
- Audit logging (all significant actions)
- Rate limiting and abuse prevention
- Data validation (server-side, always)
- Financial calculations (profit/loss, portfolio value)

### Critical Security Principle
**Frontend checks are UX only; backend checks are security.**

Never trust frontend role checks or permission checks. Backend must always validate:
- Is user authenticated?
- Does user have permission to view this data?
- Is user's role valid for this operation?
- Has staged disclosure been properly unlocked?

Example: Frontend hides "Edit" button if not Founder. Backend must still reject edit if user is not Founder.

---

## 10. Production Architecture Target

### Proposed Production Structure (Not Yet Implemented)

This is the target architecture to guide future migration. **Do NOT implement Phase 02.**

```
src/
├── config/                      # Application constants & configuration
│   ├── constants.ts            # Feature flags, defaults, limits
│   ├── routes.ts               # Centralized route definitions
│   └── features.ts             # Feature availability flags
├── types/                       # Global type definitions
│   ├── entities.ts             # User, Business, Deal, Readiness, etc.
│   ├── api.ts                  # API request/response contracts
│   ├── forms.ts                # Form data shapes
│   └── errors.ts               # Error types
├── api/                         # HTTP client & endpoints (abstraction layer)
│   ├── client.ts               # Fetch wrapper with auth/retry/errors
│   ├── endpoints/
│   │   ├── auth.ts             # Login, register, verify
│   │   ├── businesses.ts       # Business CRUD + readiness
│   │   ├── users.ts            # User management
│   │   ├── deals.ts            # Deal operations
│   │   ├── matches.ts          # Match scoring
│   │   ├── nda.ts              # NDA state
│   │   └── admin.ts            # Admin operations
│   └── hooks/
│       ├── useAuth.ts          # Login/logout/current user
│       ├── useBusinesses.ts    # Business queries
│       ├── useDeals.ts         # Deal queries
│       └── useFetch.ts         # Generic fetch hook
├── store/                       # Global state (minimal; feature-level state in hooks)
│   ├── index.ts                # Store initialization
│   ├── auth.ts                 # Auth user + token
│   ├── ui.ts                   # Theme, sidebar, modals
│   └── permissions.ts          # User permissions cache
├── hooks/                       # Reusable React hooks
│   ├── useUser.ts              # Current user + role
│   ├── useTheme.ts             # Theme state + toggle
│   ├── useAsync.ts             # Generic async wrapper
│   └── usePagination.ts        # Pagination state
├── utils/                       # Utilities & helpers
│   ├── validation.ts           # Form validation schemas
│   ├── formatting.ts           # Number, date, currency formatting
│   ├── scoring.ts              # Score calculation (eventually)
│   ├── permissions.ts          # Permission checking helpers
│   └── api.ts                  # API error parsing, retry logic
├── middleware/                  # Route guards & interceptors
│   ├── authGuard.tsx           # Redirect if not authenticated
│   ├── roleGuard.tsx           # Redirect if role not allowed
│   ├── adminGuard.tsx          # Admin-only access
│   └── verificationGuard.tsx   # Tier-based access
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Main layout container
│   │   ├── Sidebar.tsx         # Side navigation
│   │   ├── Header.tsx          # Top header
│   │   └── Navigation.ts       # Nav item definitions
│   ├── ui/                      # Reusable UI components (button, badge, form, etc.)
│   ├── features/                # Feature-specific components
│   │   ├── auth/               # Auth-related (login, register, onboarding)
│   │   ├── readiness-score/    # Readiness score display + breakdown
│   │   ├── match-score/        # Match score + explanation
│   │   ├── staged-disclosure/  # Disclosure progress + locks
│   │   ├── nda/                # NDA flow
│   │   ├── deal-room/          # Deal room tabs + chat
│   │   ├── reputation/         # Reputation + feedback
│   │   ├── discovery/          # Business/opportunity discovery
│   │   ├── premium/            # Premium features + gating
│   │   └── notifications/      # Notification UI
│   └── common/                  # Cross-feature components
├── pages/                       # Page-level components
│   ├── Landing.tsx
│   ├── auth/
│   ├── founder/
│   ├── investor/
│   ├── professional/
│   ├── shared/
│   └── admin/
├── App.tsx                      # Root router + providers
├── main.tsx                     # React DOM entry
└── index.css                    # Design system tokens
```

### Architecture Principles

1. **Separation of Concerns**
   - API client isolated from components
   - State logic separated from rendering
   - Business logic in utils/hooks, not components

2. **Feature-First Organization**
   - Related code grouped by feature (match-score, nda, etc.)
   - Easy to move/remove features
   - Team-friendly organization

3. **Reusable Shared UI**
   - Button, Badge, Form, etc. in components/ui/
   - No duplication
   - Consistent styling

4. **Typed Contracts**
   - API types in types/api.ts
   - Form types in types/forms.ts
   - Entity types in types/entities.ts
   - No "any" types

5. **API Abstraction**
   - Single api/client.ts for all HTTP
   - Centralized auth/error/retry logic
   - Can swap mock ↔ real backend easily

6. **Backend-Authoritative**
   - Frontend role checks are UX only
   - Backend enforces all permissions
   - No trust of frontend role flags

7. **Minimal Global State**
   - Only auth, theme, UI in global store
   - Feature-level state in custom hooks
   - Component-level state for forms

8. **Maintainability**
   - Code organized logically, not alphabetically
   - Clear naming conventions
   - Minimal duplication
   - Self-documenting through types

---

## 11. Architecture Principles

### Core Principles Guiding This Project

1. **Separation of Concerns**
   - Data fetching logic separate from rendering logic
   - API client separate from components
   - Business rules separate from UI

2. **DRY (Don't Repeat Yourself)**
   - Shared UI components in one place
   - Mock data extracted to constants or API layer
   - No copy-paste code

3. **Feature-First Organization**
   - Features (match-score, nda, etc.) are self-contained modules
   - Easy to test, move, or remove features
   - Related code lives together

4. **Type Safety**
   - All data structures typed (no `any`)
   - API types validate backend contracts
   - IDE autocomplete and compiler catches errors

5. **API Abstraction**
   - Single entry point for all HTTP
   - Auth token handling centralized
   - Error handling consistent
   - Can swap mock ↔ real backend without touching components

6. **Backend-Authoritative**
   - Frontend navigation checks are UX only
   - Frontend role checks are UX only
   - Backend ALWAYS validates permissions
   - Frontend never assumes user is authorized

7. **Minimal Global State**
   - Only auth, theme, critical UI state in global store
   - Feature state in custom hooks
   - Component state for forms/temporary UI
   - Reduces prop drilling, improves testability

8. **Scalability**
   - Structure supports 50+ pages and 100+ components
   - Clear guidelines prevent spaghetti code
   - Easy to add new features without breaking existing ones

9. **Maintainability**
   - Code organized logically, not by file type
   - Clear naming conventions
   - Self-documenting through types
   - Single responsibility per file

10. **Security**
    - No credentials in frontend
    - Session tokens in secure storage (httpOnly cookies preferred, localStorage fallback)
    - All sensitive operations validated server-side
    - Rate limiting on backend
    - CORS properly configured

---

## Appendix: Referenced Specifications

The following finalized specifications are referenced by this context:

- **Design:** `Vault_Ventures_UIUX_Design_PRD.md` (in src/imports/)
- **AI Features:** `phase-5-ai-features.md` (in src/imports/)
- **Match Score:** `ai-match-score.md` (in src/imports/)
- **Staged Disclosure:** `staged-disclosure.md` (in src/imports/)
- **NDA/Confidentiality:** `nda-confidentiality-flow.md` (in src/imports/)
- **Reputation/Trust:** `phase-8-reputation-trust.md` (in src/imports/)
- **Premium Upgrade:** `premium-upgrade-spec.md` (in src/imports/)
- **Milestone Tracking:** `milestone-tracking.md` (in src/imports/)
- **25+ additional specs** in `src/imports/pasted_text/`

All specifications are intentionally preserved in the repository for reference by future development sessions.

---

**End of PROJECT_CONTEXT.md**
