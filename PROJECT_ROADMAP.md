# Vault Ventures — Project Roadmap

**Version:** 1.0 | **Last Updated:** 2025-01-22 | **Managed By:** Project Owner

---

## Important Notice

**Roadmap order is controlled by the project owner and must not be changed automatically by an AI agent.**

This document reflects the intended development sequence. Any deviation requires explicit approval from the product/project lead.

---

## Frontend Phases

### Phase 01 — Audit & Baseline

**Status:** ✅ COMPLETED

**Objective:**
- Audit existing codebase
- Identify current implementation state
- Document architecture, components, routes, pages
- Inventory bug status
- Identify gaps vs. specifications

**Scope:**
- Full code inspection (28 audit areas)
- Bug assessment (5 known bugs)
- Specification gap analysis (A-F categories)
- Technical risk assessment
- Architecture recommendations

**Deliverables:**
- Phase 01 Audit Report (memory file)
- Current architecture documented
- Technical risks identified
- Implementation dependencies noted

**Owner:** AI Audit Session
**Dependencies:** None (initial phase)

---

### Phase 02 — Production Architecture + Documentation

**Status:** 🔄 IN PROGRESS

**Objective:**
- Establish persistent project documentation
- Define production architecture blueprint
- Record implementation decisions
- Create reference for future sessions

**Scope (Documentation Only):**
- Create PROJECT_CONTEXT.md (project identity, stack, architecture, business rules, design, bugs)
- Create PROJECT_ROADMAP.md (this file — phase-by-phase plan)
- Create IMPLEMENTATION_LOG.md (execution history per phase)

**NOT in scope (Phase 02):**
- No source code changes
- No refactoring
- No new features
- No bug fixes
- No dependency additions

**Deliverables:**
- Three markdown documentation files at repo root
- Current architecture clearly described
- Target architecture proposed (non-binding)
- Known bugs documented
- Phase sequence defined

**Owner:** AI Session 02
**Dependencies:** Phase 01 (Audit completed)
**Duration:** ~2 hours
**Estimated Completion:** 2025-01-22

---

### Phase 03 — Frontend Foundation + Design System

**Status:** ✅ COMPLETED

**Objective:**
- Establish a consistent, production-quality shared design foundation
- Apply Direction G — Charcoal + Copper across the reusable UI layer
- Preserve all existing product functionality and component APIs

**Scope:**
- Centralized dark/light theme tokens in `src/index.css`
- Shared semantic surfaces, controls, borders, typography, and focus states
- Normalized Button, Badge, Form, DataDisplay, and ScoreComponents styling
- Theme synchronization through the existing ThemeContext API
- Reduced-motion accessibility fallback

**NOT in scope:**
- No page-by-page redesign
- No routes, business logic, mock data, authentication, backend, or API work

**Deliverables:**
- Direction G token foundation for both themes
- Shared component visual normalization
- Accessibility-aware focus and reduced-motion behavior
- Diagnostics verification with no errors in modified source files

**Owner:** AI Developer Session
**Dependencies:** Phase 02 (documentation established)
**Duration:** Completed in current session
**Completed:** 2026-09-03

---

### Phase 04 — Authentication + Role-Based Workspaces

**Status:** ✅ COMPLETED

**Objective:**
- Establish frontend-only authentication state and workspace boundaries
- Separate normal user roles from the privileged Admin workspace
- Protect routes and preserve the existing prototype UX

**Scope:**
- Add a minimal typed frontend session context
- Wire demo normal login, registration, onboarding, Admin Login, and logout
- Add authenticated, normal-user, role-specific, and Admin route boundaries
- Drive AppShell active role and navigation from the shared session
- Preserve existing storage keys for prototype compatibility

**NOT in scope:**
- No real credential validation, backend APIs, secrets, database logic, or security claims
- No product page redesign or business-logic changes

**Deliverables:**
- Typed frontend-only normal/admin session model
- Normal role switching limited to Founder, Investor, and Professional
- Isolated Admin workspace and protected route boundary
- Wrong-role and unauthenticated redirects
- Demo logout clearing the appropriate session state

**Owner:** AI Developer Session
**Dependencies:** Phase 03 (shared design foundation complete)
**Duration:** Completed in current session
**Completed:** 2026-09-03

**Backend Dependency:** Real authentication and authorization remain future backend work.

---

### Phase 05 — AI / Intelligence Frontend

**Status:** ✅ COMPLETED

**Objective:**
- Establish the frontend AI/intelligence experience without inventing ML infrastructure
- Make Readiness and Match scores explainable and context-aware
- Keep deterministic Discovery separate from AI Suggestions

**Scope:**
- Readiness Score and 8-factor breakdown with incomplete-data messaging
- Explainable improvement suggestions from existing readiness factors
- Investor and Professional match context on score chips and drawers
- Existing AI Recommendations and AI Suggestions presentation
- Search Results versus AI Suggestions separation and match-ranked state
- Neutral AI visual language consistent with Direction G

**NOT in scope:**
- No real ML, AI model, API, backend, database, or financial logic
- No authentication, role architecture, or unrelated product workflows

**Deliverables:**
- Explainable frontend readiness and matching surfaces
- Explicit Investor/Professional match labels resolving BUG-01 and BUG-03
- Existing recommendation and discovery modes normalized
- Honest demo/incomplete-data states

**Owner:** AI Developer Session
**Dependencies:** Phase 04 (authentication and workspace boundaries complete)
**Duration:** Completed in current session
**Completed:** 2026-09-03

---

### Phase 06 — Core Features & Pages

**Status:** ✅ COMPLETED

**Objective:**
- Establish consistent frontend flows across founder, investor, professional, and shared workspaces
- Preserve Phase 04 role awareness and Phase 05 intelligence surfaces
- Close concrete page-to-page navigation gaps without changing business rules

**Implemented Areas:**

- Founder dashboard, businesses, creation, profile, discovery, connections, reputation, and readiness
- Investor dashboard, discovery/filtering, saved opportunities, portfolio, preferences, and reputation
- Professional dashboard, discovery, applications, profile editing, connections, and reputation
- Shared profile, business details, notifications, settings, feedback, and premium surfaces
- Discover-to-business-profile, profile-to-interest/application, connection-to-workspace, and application-to-opportunity flows

**Flow Corrections:**
- Professional Applications now routes View Opportunity to the existing business-details destination.
- Founder Dashboard AI Suggestions keeps its All suggestions action linked to founder discovery.
- Existing loading, empty, modal, and error patterns remain intact.

**Files Modified in This Phase:**
- Existing core page owners only; no new feature architecture was introduced.

**NOT in scope:**
- No backend, API integration, database, real authentication, payments, settlement, or ML
- No implementation of BUG-04 milestone responsibility or BUG-05 Deal Room role differentiation

**Deliverables:**
- Core frontend page inventory reviewed and existing flows normalized
- Concrete no-op navigation actions connected
- BUG-02 frontend readiness visibility/flow preserved and documented
- Role-specific UI and existing mock/demo behavior preserved

**Owner:** AI Developer Session
**Dependencies:** Phase 05 (AI/intelligence frontend complete)
**Duration:** Completed in current session
**Completed:** 2026-09-03

**Backend Dependency:** Real persistence, API integration, and server-authoritative rules remain future work.

---

### Phase 07 — Role-Based Access Control & Permissions

**Status:** ✅ COMPLETED

**Objective:**
- Establish a centralized frontend role/action permission model
- Apply role-aware route, navigation, and action boundaries
- Preserve Admin isolation and existing session architecture

**Scope:**
- Create `src/utils/permissions.ts` with workspace/action permissions
- Use the permission matrix in role-specific route guards
- Bind Business Profile, Milestone, and Negotiation perspectives to active roles
- Provide explicit access states where a workflow is not available to a role
- Keep existing Admin isolation and normal-role switching behavior

**Important:** Frontend permission checks are UX only. Backend MUST still validate all access.

**Files Modified:**
- `src/App.tsx`
- `src/context/AuthContext.tsx`
- `src/pages/founder/BusinessProfile.tsx`
- `src/pages/shared/MilestoneTracking.tsx`
- `src/pages/shared/NegotiationPanel.tsx`
- `src/components/layout/AppShell.tsx`

**NOT in scope:**
- No backend implementation (backend does this separately)
- No new features
- No UI redesign

**Deliverables:**
- Typed frontend permission matrix
- Role-aware route protection and action visibility
- Active-role-bound business, milestone, and negotiation workflows
- Explicit frontend access states
- Backend authorization boundary documented

**Owner:** AI Developer Session
**Dependencies:** Phase 06 (core frontend pages complete)
**Duration:** Completed in current session
**Completed:** 2026-09-03

**Backend Dependency:** Server authorization and resource-level permissions remain future work.

---

### Phase 08 — Milestone & Reputation Confirmation Flows

**Status:** ✅ COMPLETED

**Objective:**
- Implement milestone completion confirmation
- Complete reputation feedback workflow
- Enable deal closure and agreement tracking
- Clarify role responsibilities in milestone confirmation

**Scope:**
- Implement milestone proof submission (text/file/link)
- Implement founder vs. investor confirmation workflows
- Implement rejection flow (request more info)
- Implement reputation feedback collection (post-deal)
- Implement deal agreement signing/acceptance flow
- Clarify who confirms milestones (per BUG-04 specification)

**Files to Modify:**
- src/pages/shared/MilestoneTracking.tsx
- src/pages/shared/DealRoom.tsx
- src/components/features/reputation/* (new/enhanced)
- src/pages/shared/FeedbackFlow.tsx

**NOT in scope:**
- No backend implementation (will be added in backend phase)
- No new features beyond milestone/reputation
- No UI redesign

**Deliverables:**
- Milestone proof submission UI
- Founder vs. investor confirmation flows
- Rejection/revision flows
- Reputation feedback collection working end-to-end
- Deal agreement/signing tracking

**Owner:** AI Developer Session
**Dependencies:** Phase 07 (permissions implemented), approved product specifications

**Phase 08 QA Addendum — Code QA Completed 2026-09-03:** Code-level final frontend QA was completed under the owner-provided Phase 08 directive. The application remains frontend-only/mock-data based. Verification covered public and protected routes, role boundaries, Admin isolation, shared workflow navigation, core score/context surfaces, responsive shell behavior, and basic accessibility. Demo role management now persists additions/removals in the session; Admin account-menu destinations are isolated to Admin routes. Production build and TypeScript diagnostics pass. BUG-02 remains backend-dependent; BUG-04 was not decided or implemented; BUG-05 remains limited to frontend UX boundaries. The build reports a non-blocking generated-chunk-size advisory. Final completion remains contingent on browser-level desktop, tablet, and mobile visual sign-off.

**Browser QA Update — 2026-09-03:** The local Vite application responds successfully, but Chrome headless crashes in this environment before screenshot capture because its GPU process is unavailable. No callable Playwright runner is installed; only prior capture artifacts are present. Browser-level Desktop, Tablet, and Mobile sign-off therefore remains pending. No browser-observed layout issue was available to fix.
**Duration:** 2–3 weeks
**Estimated Start:** Once roles/permissions finalized

### Phase 08A — Remaining Frontend Fixes

**Status:** ✅ COMPLETED

**Session Date:** 2026-09-03

**Scope completed:** Fixed the responsive web workspace picker stacking issue, corrected the confirmed TypeScript issues, and completed Deal Room role differentiation using the existing permission model. Founder, Investor, and Admin perspectives now show distinct context and participant-action availability without changing the deal lifecycle or backend scope.

**Validation:** TypeScript and production build pass. Browser checks at 1280×800, 768×1024, 390×844, and 375×812 passed with no horizontal overflow. Normal mobile workspace switching and Admin isolation were verified. BUG-01 and BUG-03 context labeling remains intact.

**Next gate:** Phase 08B final frontend sign-off.

---

### Phase 08C — Final Remaining Frontend Fixes

**Status:** ✅ COMPLETED

**Session Date:** 2026-09-03

**Scope completed:** Fixed the registration-to-onboarding redirect loop, corrected unauthenticated Admin route redirection, named the two shell icon-only controls for accessibility, and aligned the Deal Room lifecycle label with `Milestone Funding Active`. Existing workflows, permissions, routes, and visual direction were preserved.

**Validation:** TypeScript and production build pass. Browser testing confirmed registration onboarding, Admin route separation, Admin access, mobile role switching, lifecycle terminology, and zero horizontal overflow at 1280×800, 768×1024, 390×844, and 375×812.

**Next gate:** Phase 08D final read-only frontend sign-off.

---

### Phase 08E — Final Frontend Fix + Verification

**Status:** ✅ COMPLETED

**Session Date:** 2026-09-03

**Scope completed:** Fixed the Phase 08D multi-role direct-route context mismatch by synchronizing the active workspace from valid role route prefixes in `AppShell.tsx`. Existing `RoleGuard` authorization remains authoritative for frontend access, so users cannot gain access to a role they do not hold.

**Validation:** TypeScript and production build pass. Browser checks confirmed correct workspace context for Founder, Investor, and Professional direct routes, protected unauthorized role access, normal mobile role switching, Admin isolation, existing core regressions, and zero horizontal overflow at 1280×800, 768×1024, 390×844, and 375×812.

**Final frontend status:** Implementation gates pass. Backend work remains separate and BUG-04 remains specification-dependent.

---

### Phase 09 — Advanced Features & Matching

**Status:** ✅ COMPLETED

**Phase 09-C completion:** Final CSS cleanup verification, English-only visible UI cleanup, UTF-8/mojibake cleanup, and BDT currency consistency are complete. TypeScript, production build, residual source scans, and representative landing-page browser validation pass. Phases 10, 11, and 12 remain outside this work.

**Objective:**
- Implement dynamic matching engine
- Enable two-party NDA signing
- Implement premium feature gating (enforced)
- Add notification system UI

**Scope:**
- Replace hardcoded match scores with dynamic algorithm
- Implement two-party NDA signing flow (e-signature integration)
- Implement premium feature gating (check tier, show paywall)
- Add real notification system (email/Slack backend)
- Improve match score explanations
- Enhance readiness score explanations

**Files to Modify:**
- src/utils/scoring.ts (matching algorithm)
- src/components/features/nda/* (two-party flow)
- src/components/features/premium/* (feature gating)
- src/components/features/notifications/* (new)

**NOT in scope:**
- No backend changes
- No payment processing (handled separately)
- No new features beyond matching/premium/notifications

**Deliverables:**
- Dynamic matching engine
- Two-party NDA signing
- Premium feature gating enforced
- Notification system (UI + backend integration)

**Owner:** AI Developer Session
**Dependencies:** Phase 08 (core features stable), Backend matching/NDA/premium APIs available
**Duration:** 3–4 weeks
**Estimated Start:** Once core features stable

---

### Phase 10 — Admin Enhancements & Compliance

**Status:** 📋 PLANNED

**Objective:**
- Complete admin functionality
- Add compliance features (GDPR, audit)
- Implement document review workflows
- Enable dispute resolution

**Scope:**
- Document review UI (image viewer, PDF preview)
- Dispute resolution workflow
- Audit log with full context
- GDPR data export/deletion features
- Compliance reporting
- Admin workflow enhancements (bulk actions, filters, exports)

**Files to Modify:**
- All src/pages/admin/* (backend integration + new features)
- src/components/features/admin/* (new specialized components)

**NOT in scope:**
- No backend implementation
- No new admin concepts
- No UI redesign

**Deliverables:**
- Admin workflow fully functional
- Document review system
- Dispute resolution tracking
- Compliance features (GDPR, audit)
- Admin reporting enhancements

**Owner:** AI Developer Session
**Dependencies:** Phase 09 (advanced features stable)
**Duration:** 2–3 weeks
**Estimated Start:** Once admin API endpoints available

---

### Phase 11 — Performance, Security, Polish

**Status:** 📋 PLANNED

**Objective:**
- Optimize performance for production
- Complete security implementation
- Polish UX across all pages
- Complete responsive design
- Finish light mode styling

**Scope:**
- Code splitting and lazy loading
- Performance optimization (bundle, FCP, LCP)
- Security audit and hardening
- Accessibility audit (WCAG 2.1 AA)
- Mobile responsiveness refinement
- Light mode complete implementation
- Final visual polish

**Not a scope change:** This is polish/optimization, not new features.

**Deliverables:**
- Optimized bundle size
- Performance metrics <3s FCP
- Security hardening complete
- WCAG 2.1 AA compliance
- Responsive design verified
- Light mode fully styled

**Owner:** AI Developer Session + QA
**Dependencies:** Phase 10 (core features complete)
**Duration:** 2–3 weeks
**Estimated Start:** Final phase before launch

---

## Backend Phases

### Backend Phase 01 — Architecture & Database

**Status:** 📋 PLANNED (Parallel with Frontend)

**Objective:**
- Design backend architecture
- Set up database schema
- Plan API structure

**Dependencies:** Phase 03 (frontend foundation complete), approved API specifications

---

### Backend Phase 02 — Authentication & Authorization

**Status:** 📋 PLANNED (Parallel with Frontend Phase 04–05)

**Objective:**
- Implement user authentication (JWT or sessions)
- Implement role-based access control
- Implement verification tier enforcement
- Set up permission matrix

**Dependencies:** Phase 03 (specs), Backend Phase 01 (architecture)

---

### Backend Phase 03 — Core APIs

**Status:** 📋 PLANNED (Parallel with Frontend Phase 06)

**Objective:**
- Implement all REST/GraphQL endpoints
- Implement business logic
- Implement data validation

**Dependencies:** Backend Phase 02 (auth ready)

---

### Backend Phase 04 — Advanced Features

**Status:** 📋 PLANNED (Parallel with Frontend Phase 09)

**Objective:**
- Implement matching algorithm
- Implement readiness scoring
- Implement reputation calculation
- Implement NDA/deal state machines

**Dependencies:** Backend Phase 03 (core APIs ready)

---

### Backend Phase 05 — Integration & Testing

**Status:** 📋 PLANNED (After Frontend Phase 11)

**Objective:**
- Full end-to-end testing
- Load testing
- Security testing
- Production deployment preparation

**Dependencies:** Frontend Phase 11 + Backend Phases 01–04

---

## Timeline Summary

### Conservative Estimate (Sequential)
- Phase 01: ✅ Complete (1 week)
- Phase 02: ✅ Complete (1 week)
- Phase 03: ✅ Complete (current session)
- Phase 04: ✅ Complete (current session)
- Phase 05: 1–2 weeks
- Phase 06: 4–6 weeks
- Phase 07: 1–2 weeks
- Phase 08: 2–3 weeks
- Phase 09: 3–4 weeks
- Phase 10: 2–3 weeks
- Phase 11: 2–3 weeks

**Total Sequential:** ~5–7 months

### Optimistic Estimate (With Parallel Backend)
- Phases 01–02: 2 weeks
- Phases 03–11: ~4–5 months (parallel backend + frontend)
- **Total Parallel:** ~4.5–5.5 months

---

## Key Dates & Milestones

| Milestone | Estimated Date | Depends On |
|-----------|---------------|-----------| 
| Phase 02 Complete | 2025-01-22 | Phase 01 ✅ |
| Phase 03 Foundation Done | 2026-09-03 | Phase 02 ✅ |
| Authentication and Workspaces Ready | 2026-09-03 | Phase 04 ✅ |
| All Pages Live (Backend) | 2025-04-07 | Phase 06 ✅ |
| Advanced Features (Match/NDA/Premium) | 2025-05-12 | Phase 09 ✅ |
| Admin Complete | 2025-06-02 | Phase 10 ✅ |
| Production Ready | 2025-06-30 | Phase 11 ✅ |

---

## Critical Path Dependencies

```
Phase 01 (Audit)
    ↓
Phase 02 (Docs)
    ↓
Phase 03 (Frontend Foundation) ✅
    ↓
Phase 04 (Auth + Workspaces) ✅
    ↓
Phase 05 (Error Handling) ← Blocks real API integration
    ↓
Phase 06 (API Integration) ← Requires Backend Phase 03
    ↓
Phase 07 (Permissions) ← Requires Backend Phase 02
    ↓
Phase 08 (Advanced Flows) ← Requires approved product specs + Backend support
    ↓
Phase 09 (Matching/Premium) ← Requires Backend Phase 04
    ↓
Phase 10 (Admin) ← Requires Backend Phase 03
    ↓
Phase 11 (Polish/Performance)
```

---

## Decision Gates

Before proceeding to each phase:

| Phase | Gate | Owner | Criteria |
|-------|------|-------|----------|
| 03 | Foundation Review | Tech Lead/Designer | Shared tokens and components verified |
| 04 | Auth/Workspace Review | Tech Lead | Session boundaries and role routes verified |
| 05 | Library Selection | Tech Lead | Form validation library chosen (React Hook Form recommended) |
| 06 | Backend Ready | Backend Lead | API endpoints implemented + documented |
| 07 | Permissions Matrix | PM/Tech Lead | Role/permission matrix finalized |
| 08 | Flow Approval | PM/Designer | Milestone/reputation/agreement flows approved |
| 09 | Algorithm Design | Tech Lead/PM | Matching algorithm defined + approved |
| 10 | Admin Requirements | Admin Lead | Admin workflows fully specified |
| 11 | Launch Criteria | PM/QA | Performance targets, accessibility score, security review |

---

## Rollback & Contingency

If a phase encounters a critical blocker:

1. **Pause the phase** — do not force-complete
2. **Escalate to project owner** — report blocker with evidence
3. **Decide:** Fix blocker, rescope phase, or reassign to later
4. **Document decision** in IMPLEMENTATION_LOG.md
5. **Resume or proceed** to next phase per owner's decision

Do NOT attempt to "work around" blockers by expanding scope outside phase boundaries.

---

## Success Criteria for Each Phase

### Phase Completion Definition

A phase is complete when:
- ✅ All deliverables exist and match specification
- ✅ No unrelated files were modified
- ✅ No new bugs were introduced
- ✅ Dependencies for next phase are satisfied
- ✅ Results are documented in IMPLEMENTATION_LOG.md

---

**End of PROJECT_ROADMAP.md**

*This roadmap may be updated by the project owner. Changes require explicit notice and must be documented with rationale in IMPLEMENTATION_LOG.md.*
