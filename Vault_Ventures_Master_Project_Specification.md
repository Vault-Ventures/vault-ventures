# VAULT VENTURES — MASTER PROJECT SPECIFICATION
### AI-Powered Business Formation & Investment Matching Platform
**Version:** 1.1 (Master Specification — Single Source of Truth)
**Status:** Pre-Implementation Specification (Not a development/coding prompt)

---

## 1. Executive Summary

Vault Ventures is an AI-powered platform that unifies three resources that are usually scattered across different tools and platforms — **Idea, Capital, and Skills** — into a single ecosystem connecting **Founders, Investors (Large and Small/Micro), and Skilled Professionals**.

The platform combines **Search & Advanced Filtering**, an **explainable AI Matching Engine**, an **AI Investor Readiness Score**, **Staged Information Disclosure**, an **NDA workflow**, a **Deal Room**, a differentiated **Investment model** (Micro Investment / Profit-Loss Sharing and Large-Standard Investment / Equity), a **Financial Transparency & Reporting layer**, **milestone-based investment simulation**, a **multi-sided Reputation & Verification system**, and a **Premium tier** — all governed by a clear legal/compliance boundary establishing the MVP as an academic **prototype/simulation**, not a licensed financial platform.

This document consolidates the original Project Proposal with the six structural solution areas (Matching Engine, Readiness Score, Verification & Trust, Security & Confidentiality, Legal & Compliance, and Off-Platform Bypass Mitigation) into one internally consistent specification. It defines what the system is, why it exists, who uses it, what it does, how its core logic works, and precisely what is in-scope for the MVP versus Future Scope. It intentionally excludes code, file structures, and phase-by-phase build instructions — those belong in a later, separate implementation prompt derived from this document.

---

## 2. Project Vision

To become the trusted digital ecosystem where **ideas, capital, and skills meet** — allowing founders to raise funding and build teams, investors of any capital size to discover vetted opportunities, and skilled professionals to join promising startups, all within one platform that helps users **discover, evaluate, trust, negotiate, and manage** business relationships from first contact to completed deal.

---

## 3. Problem Statement

Starting and growing a business requires three resources — **Idea + Capital + Skills** — that are usually distributed across different people and different platforms:

- Founders struggle to find suitable investors and skilled team members.
- Investors struggle to identify promising, trustworthy founders.
- Skilled professionals struggle to find access to promising startups.
- Existing platforms (AngelList, Republic, Wellfound, crowdfunding tools, recruitment networks) each solve only part of the problem.
- Users cannot easily discover opportunities based on detailed, structured requirements.
- Founders fear disclosing confidential business information prematurely.
- Investors fear poor execution or misuse of funds, and cannot easily tell whether a founder's reported financial performance is trustworthy.
- Negotiations, documents, and progress tracking are scattered across email, chat apps, and spreadsheets, with no shared audit trail.
- Small/micro-investors are largely unserved by existing platforms, which are structured around large-check investors, and existing platforms rarely offer them a return model suited to small-ticket participation.

---

## 4. Proposed Solution

Vault Ventures combines discovery, evaluation, matching, disclosure, negotiation, and progress tracking into a single platform, structured around three core role flows:

**Founder:** Submit Business Idea → AI Readiness Analysis → Find Investors → Find Skilled Professionals → Build Team → Negotiate Investment

**Investor:** Set Investment Preferences → Discover Businesses → Search & Filter → Receive AI Suggestions → Connect with Founders

**Skilled Professional:** Create Skill Profile → Search Startups → Filter Opportunities → Receive AI Suggestions → Join Suitable Businesses

**AI (cross-cutting):** Analyze Business → Calculate Readiness → Recommend Investors → Recommend Professionals → Improve Matching Over Time

The platform explicitly supports both **Large Investors** and **Small/Micro-Investors**, allowing a business to be funded by one large investor, multiple small investors, or a combination — where legally permitted. Micro and Large/Standard Investments use different return/ownership models (Section 15) and are backed by a shared financial transparency and reporting layer.

---

## 5. Target Users

### 5.1 Founder
Has a business idea, startup, skills, or funding requirements. Can create a business profile, submit an idea, specify funding needs, search investors and professionals, apply filters, receive AI recommendations, open a Deal Room, submit periodic financial reports once funded, and track milestones.

### 5.2 Investor
An individual or organization providing capital.
- **Large Investors:** experienced investors, business owners, investment groups, organizations, high-capital individuals (e.g., BDT 5–50+ lakh). Typically use **Large / Standard Investment** (Equity/Ownership — Section 15.3).
- **Small/Micro-Investors:** university students, housepersons, young professionals, freelancers, small business owners, first-time investors, individuals with limited capital (e.g., BDT 10,000–50,000). Typically use **Micro Investment** (Profit/Loss Sharing — Section 15.2).

Investors specify available/min/max investment, industry, risk level, business stage, location, involvement, and investment type. They can search, filter, save opportunities, receive AI recommendations, express interest, enter Deal Rooms, agree investment terms (including the return/ownership structure — Section 15), review a business's financial reporting, and track investments. **Reverse Investment Discovery** lets investors publish preferences so founders can approach them.

### 5.3 Skilled Professional
Contributes expertise (e.g., developer, designer, marketer, accountant, consultant, operations). Creates a profile, searches/filters startups, receives AI recommendations, applies, and negotiates salary or equity.

### 5.4 Admin
Functions as the platform's governance, trust, verification, and risk-control layer: manages users, verification, businesses, applications, teams, reports, deals, investment records and financial reporting/verification, discrepancy flags and disputes, reputation, audit logs, platform analytics, and settings (Section 19).

---

## 6. Core Value Proposition

Vault Ventures does not simply connect users — it helps them **discover, evaluate, trust, negotiate, and manage** business relationships in one place, offering:

- A single ecosystem covering Founder + Investor + Talent (most competitors cover only two of the three).
- Explainable AI (matching and readiness scoring), not black-box percentages.
- First-class support for small/micro-investors, not just large-check investors — including a Micro Investment return model (profit/loss sharing) suited to small-ticket participation, distinct from the equity model used for larger investments.
- A structured trust pipeline (staged disclosure → NDA → verification → reputation) rather than ad hoc trust.
- A structured financial transparency layer (revenue/expense reporting, evidence, verification status, discrepancy flagging) that makes founder-reported performance more visible and reviewable, rather than a single trusted "profit" number.
- An integrated Deal Room + milestone tracking that removes the need for founders and investors to manage the relationship across scattered tools.

---

## 7. Functional Requirements

High-level functional areas (detailed in later sections):

1. User authentication and role-based profiles (Founder, Investor, Skilled Professional, Admin)
2. Business submission and management
3. Investor preference and opportunity profiles
4. Skilled professional profiles
5. Search and Advanced Filtering (role-specific filter sets)
6. AI Business Analysis and Investor Readiness Score
7. AI Matching Engine (Founder↔Investor, Founder↔Professional)
8. AI Suggestions (proactive recommendations, distinct from matching/search)
9. Staged Information Disclosure (4 stages)
10. NDA workflow
11. Deal Room (documents, chat, scheduling, negotiation, agreements, milestones)
12. Investment model — Micro (Profit/Loss Sharing) and Large/Standard (Equity/Ownership) — with terms recorded per deal
13. Financial transparency & reporting layer (revenue/expense/net profit reporting, supporting evidence, verification status, historical reports, investor discrepancy flagging, admin review)
14. Milestone-based investment simulation and progress tracking
15. Reputation & tiered Verification system
16. Premium subscription simulation (Founder, Investor, Professional tiers)
17. Admin dashboard, financial/investment oversight, and audit logging
18. Notifications

---

## 8. AI System Specification

Vault Ventures' AI layer consists of four distinct, cooperating components. They must remain conceptually distinct even though they interact:

| Component | Purpose | Output |
|---|---|---|
| **AI Business Analysis / Readiness Score** | Evaluates a submitted business against a rubric | Investor Readiness Score (0–100) + factor breakdown + improvement suggestions |
| **Matching Engine** | Computes explainable compatibility between two specific parties (e.g., one founder and one investor) | Weighted match score (0–100%) + factor-level explanation |
| **Search & Filtering** | User-driven, deterministic query against structured criteria | Filtered list of results, no scoring/ranking implied beyond relevance to filters |
| **AI Suggestions / Recommendation Engine** | Proactively surfaces opportunities to a user without an explicit query, using the Matching Engine's scores across the candidate pool | Ranked list of suggested matches (e.g., "Top 3 recommended investors") |

**Distinction rule:** Search & Filtering is reactive and user-controlled. The Matching Engine is a scoring function between two specific entities. AI Suggestions is the Matching Engine applied proactively/in bulk to rank a user's best candidates. These three must not be presented or implemented as the same feature.

For MVP, all AI scoring (Readiness Score and Matching Engine) is **deterministic, rule-based, and explainable** — not a trained ML/deep-learning model. This keeps behavior transparent, testable, and reproducible for an academic prototype. NLP/ML-based automatic analysis (e.g., parsing free-text pitch decks) is explicit **Future Scope**.

---

## 9. Matching Engine Specification

The Matching Engine is an **explainable weighted multi-criteria scoring engine**. It never outputs a bare percentage without a factor-level breakdown.

**Final Match Score formula:**

```
Final Match Score = Σ (Factor Score × Weight) × 100
```

Each Factor Score is normalized to a 0–1 scale before weighting; the final result is presented as 0–100%, always accompanied by a per-factor explanation (e.g., "Industry Match: 90% — both selected FinTech").

### 9.1 Founder ↔ Investor Matching

| Criterion | Weight |
|---|---|
| Industry Match | 25% |
| Investment Range Compatibility | 25% |
| Business Stage Match | 15% |
| Risk Level Compatibility | 15% |
| Location Preference | 10% |
| Expected Involvement | 10% |

### 9.2 Founder ↔ Skilled Professional Matching

Using the same explainable weighted approach, with criteria such as:

| Criterion | Suggested Weight |
|---|---|
| Required Skill Overlap | 35% |
| Industry Experience | 20% |
| Experience Level | 15% |
| Availability | 15% |
| Location | 10% |
| Compensation Preference Compatibility | 5% |

(Weights are configurable per deployment but must sum to 100% and remain visible/auditable.)

### 9.3 Explainability Requirement

Every match result must expose: overall score, per-factor score, and the weight applied to each factor, so a user can understand *why* a match was suggested — not just *that* it was suggested.

---

## 10. Investor Readiness Score Specification

An **explainable, rubric-based weighted scoring system** evaluating a submitted business, producing a score of **0–100**.

### 10.1 Factors (existing 8, from the original proposal)

- Market Potential
- Business Model Clarity
- Competition
- Scalability
- Founder Capability
- Funding Requirement Realism
- Risk
- Customer Validation

Each factor receives a sub-score (e.g., 0–10 or 0–100 normalized) based on structured founder-provided inputs (e.g., forms, checklists, structured fields — not free-text NLP analysis in MVP), combined with defined weights per factor (to be finalized during design but must be documented and sum to 100%).

### 10.2 Output Requirements

The system must always display:
- **Overall Score** (0–100)
- **Factor-level scores** for all 8 factors
- **Weak areas** (factors below a defined threshold)
- **Improvement suggestions** — rule-based, templated guidance tied to weak factors (e.g., "Customer validation is weak — consider adding pilot user data.")

### 10.3 MVP Constraint

Scoring is **structured-input + deterministic/rule-based**. No deep learning or NLP model is required or expected for MVP. This is explicitly documented as a **Known Limitation**, with ML/NLP-based automated analysis reserved for **Future Scope**.

---

## 11. Verification & Trust Specification

A practical, tiered verification system — not full legal KYC.

| Tier | Name | Requirements |
|---|---|---|
| **Tier 0** | Unverified | Email + phone verification only |
| **Tier 1** | Identity Verified | Government ID + selfie/document upload + Admin manual review |
| **Tier 2** | Track-Record Verified | Tier 1 + demonstrated history of completed verified activities/deals/projects on-platform |

### 11.1 Verification Elements
- Verification status (per user, visible on profile)
- Verification badge (visual indicator per tier)
- Admin verification workflow (review queue, approve/reject, request more info)
- **Relationship to reputation:** verification tier acts as an input/multiplier to reputation credibility, but is not itself the full reputation score (see Section 17).

Identity/user verification tiers (this section) are conceptually distinct from **Financial Verification Status** (Section 15.4), which applies to a specific financial report rather than to a user's identity.

### 11.2 Explicit Boundary
This system is **not** a substitute for legal KYC/AML required for real financial transactions. It is a trust signal appropriate for a simulated/prototype platform. Real regulatory-grade identity verification is **Future Scope**.

---

## 12. Security & Confidentiality Specification

Security is integrated directly into the Staged Disclosure and Deal Room flows rather than treated as a separate bolt-on system.

### 12.1 Access Control
- **Role-Based Access Control (RBAC):** Founder, Investor, Skilled Professional, Admin each have distinct permission sets.
- **Stage-Based Access Control:** A user's access to business information is gated by the current Disclosure Stage (see Section 13) between that specific founder and that specific investor/professional relationship — not global.
- **NDA Status Gate:** Stage 3+ content requires an active, mutually-agreed NDA record before access is granted.

### 12.2 Document Permissions & Audit
- Document-level permissions tied to Disclosure Stage and Deal Room membership. The same permission and audit approach applies to financial supporting evidence documents (Section 15.4).
- **Audit logging:** every view/download of a sensitive document generates an audit record (who, what, when) wherever practical in the MVP, including access to financial reports and supporting evidence.
- Sensitive data transmitted over HTTPS; sensitive fields (e.g., ID documents, financial evidence) encrypted at rest where appropriate.

### 12.3 Scope Boundary
The MVP intentionally avoids unnecessary enterprise-grade security infrastructure (e.g., SOC2-level tooling, dedicated SIEM). Security is scoped to what is realistic and demonstrable for an academic prototype while still protecting confidential business and personal data appropriately.

---

## 13. Staged Disclosure & NDA

A four-stage, trust-based information release model, applied per founder↔investor (or founder↔professional, where relevant) relationship:

| Stage | Name | Content Unlocked |
|---|---|---|
| **Stage 1** | Teaser | General/public business information |
| **Stage 2** | Extended Information | Additional detail, unlocked after investor/professional expresses interest |
| **Stage 3** | NDA | Access gated behind a signed/accepted NDA between both parties |
| **Stage 4** | Full Proposal | Full business plan, financials, and confidential documents |

**Progression rule:** A relationship can only advance to the next stage when the defined trigger for that stage is met (e.g., expressed interest → Stage 2; NDA acceptance → Stage 3). Progression is per-relationship, not global — a founder may be at Stage 4 with one investor and Stage 1 with another.

---

## 14. Deal Room & Deal Lifecycle

When mutual interest exists, founder and investor (or founder and professional) enter a private **Deal Room** containing: business plan, pitch deck, financial information, documents, chat, meeting scheduling, negotiation tools, agreement templates, milestones, and progress tracking. For an investor relationship, the Deal Room is also where the **investment type and terms** (Micro Investment/Profit-Loss Sharing or Large-Standard Investment/Equity — Section 15) are negotiated and recorded.

### 14.1 Deal Status Lifecycle

```
Matched
  → Interest Confirmed
    → Deal Room Opened
      → NDA Signed
        → Negotiation
          → Agreement
            → Milestone Funding Active
              → Completed
```

Each transition is logged (supports both the audit requirement in Section 12 and the reputation mechanics in Section 17).

### 14.2 Milestone-Based Investment Simulation

Investment is divided into predefined milestones rather than a single transaction, e.g.:

```
Total Investment: ৳15,00,000
  ৳5,00,000 → MVP Development
  ৳4,00,000 → First 100 Customers
  ৳3,00,000 → First Revenue
  ৳3,00,000 → Business Expansion
```

Milestone-based funding release applies to both Micro and Large/Standard Investments; it governs *when committed capital is released*, while the Investment Model (Section 15) separately governs *what the investor receives in return* (a profit/loss share or an ownership percentage). For the academic prototype, this is implemented as **investment and progress simulation only** — no real financial custody, escrow, or fund movement occurs.

---

## 15. Investment Model & Financial Transparency Specification

Vault Ventures supports two investment modes, differentiated by ticket size and by return/ownership model. Both are modes of a single **Investment** feature — not two separate systems — and both share the same discovery, Staged Disclosure, NDA, and Deal Room flow (Sections 13–14).

```
Investment
├── Micro Investment
│   └── Profit/Loss Sharing
└── Large / Standard Investment
    └── Equity / Ownership
```

| Type | Audience | Return Model | Ownership |
|---|---|---|---|
| **Micro Investment** | Small-ticket investors — e.g., students or individuals with a relatively small amount of capital (e.g., ৳5,000–৳10,000) | Profit/Loss Sharing | Normally no direct business ownership/equity |
| **Large / Standard Investment** | Larger business funding | Equity / Ownership | Agreed ownership percentage, subject to the final contractual/legal structure |

A business may accept Micro Investment, Large/Standard Investment, or both, where the founder's terms allow it.

### 15.1 Micro Investment — Profit/Loss Sharing

- The investor normally does **not** receive direct business ownership/equity.
- The exact profit/loss-sharing terms are deal-specific and must be agreed and recorded as part of the investment terms during Deal Room negotiation (Section 14) — never a fixed, platform-wide percentage.
- **Profit is not guaranteed.** If there is no distributable profit for a reporting period, there may be no payout for that period.
- Where the agreed structure includes loss sharing, the investor bears the agreed portion of the business/investment risk.

*Illustrative example only, not a platform rule:* a founder needs ৳2,00,000; a Micro Investor contributes ৳10,000. If the agreed arrangement gives the investor a 5% share of a distributable profit pool, and the applicable distributable profit is ৳40,000 for that period, the investor receives ৳2,000. The 5% figure is an example only and must never be treated as a universal system rule.

### 15.2 Large / Standard Investment — Equity / Ownership

- The investor may receive an agreed ownership percentage in exchange for capital, subject to the final contractual/legal structure.
- The investor's economic outcome can benefit from business performance/value appreciation, and can also lose value if the business performs poorly. Equity does not mean guaranteed profit.

*Illustrative example only, not a platform rule:* an agreed business valuation of ৳5,00,000 and a ৳10,000 contribution gives a simple illustrative ownership of 2% (৳10,000 ÷ ৳5,00,000). The 2% figure is an example only; actual ownership always comes from the agreed investment terms.

### 15.3 Loss Handling by Investment Type

- **Micro Investment:** profit/loss treatment follows the agreed profit/loss-sharing terms. No distributable profit may mean no profit payout for a given period; if loss sharing is part of the agreed terms, the investor bears the agreed risk. The platform must display the agreed risk/return structure clearly.
- **Large / Standard Investment:** the investor holds agreed equity/ownership; business losses or a decline in business value can negatively affect the economic value of that ownership. Exact rights and outcomes depend on the agreed contractual/legal structure.
- In both cases, investment is never presented as guaranteeing profit or a specific return.

### 15.4 Financial Transparency & Reporting Layer

Investors cannot be expected to rely blindly on a founder's manually reported profit/loss figure. The platform supports structured financial transparency for funded businesses:

- **Periodic Financial Report** — revenue, expenses, net profit/loss, cash position (where applicable), and notes, for a defined reporting period.
- **Calculated result:** the platform calculates **Revenue − Expenses = Net Profit/Loss** from the structured inputs. A manually entered "profit" figure is not treated as authoritative when revenue and expense data are available.
- **Supporting Financial Evidence** — invoices, sales summaries, expense records, statements, or other suitable documents attached to a report.
- **Financial Verification Status**, one of:
  - *Self-Reported* — founder-entered figures with no evidence review.
  - *Evidence Submitted* — supporting documents attached, not yet reviewed.
  - *Under Review* — Admin is actively reviewing the report or a flagged discrepancy.
  - *Verified / Reviewed* — Admin has reviewed the report and its evidence.
  - "Self-Reported" status is never presented or implied as independently verified.
- **Historical Financial Reports** — prior reporting periods remain visible and traceable, so investors see performance over time rather than one isolated figure.
- **Investor Discrepancy Reporting** — an investor who believes supporting evidence does not match reported figures (e.g., reported Revenue ৳2,00,000, Expenses ৳1,20,000, Net Profit ৳80,000, but the attached evidence appears inconsistent) can flag a discrepancy. Flagged items are reviewable by Admin (Section 19) and can be marked resolved, disputed, or under review. This section defines the product/business requirement only; the technical review workflow is an implementation concern.
- **Audit Trail** — material changes to financial reports (actor, action, time) are recorded, consistent with the audit approach in Section 12.

Supporting evidence and verification status must be visible to the appropriate investor/admin users.

### 15.5 Purpose and Boundary of the Financial Transparency Layer

The financial transparency layer is designed to make financial misreporting **harder, more visible, traceable, and reviewable.** It does not claim, and Vault Ventures never presents itself as offering, fraud-proof financial reporting.

### 15.6 Deal / Investment Relationship Flow

The Investment model connects to, rather than replaces, the existing relationship flow:

```
Founder
→ creates business/opportunity
→ defines funding requirement and proposed investment terms

Investor
→ discovers opportunity
→ reviews business information
→ reviews financial transparency information
→ chooses appropriate investment type (Micro or Large/Standard)
→ expresses investment interest
→ proceeds through Staged Disclosure / NDA / Deal Room (Sections 13–14)
→ final investment terms (type, amount, return/ownership structure) are agreed and recorded
```

The terms recorded in the Deal Room subsequently drive what the Investor Dashboard (Section 15.7) displays for that investment.

### 15.7 Investor Dashboard — Investment & Financial Visibility

Where the platform's investor dashboard/portfolio functionality is implemented (Section 26, "Should-Have Scope"), it must let an investor understand, per investment:

- Investment type (Micro or Large/Standard)
- Amount invested
- Investment terms (as agreed in the Deal Room)
- Profit received where applicable
- Financial performance (current and historical reports)
- Profit/loss reporting
- Verification status of each report
- Supporting evidence availability
- Risk information (a clear statement that returns are not guaranteed and investment can lose value)
- Historical reports
- Ownership information for equity investments, where applicable

This is a product/requirements-level statement; it does not redesign the dashboard.

### 15.8 Admin Oversight of Investment & Financial Data

Admin oversight (Section 19) extends to Micro and Large/Standard investment records, investment terms visibility, financial reports and their verification status, supporting evidence, flagged discrepancies, founder financial-reporting activity, related risk indicators, dispute/review workflows, and audit logs.

### 15.9 Legal & Compliance Note

Real-money investment, equity issuance, profit distribution, securities treatment, taxation, payment custody, and investor eligibility for either investment type require appropriate legal/compliance review before real-world deployment (Section 30). For the MVP prototype, all Micro and Large/Standard investment activity, and all associated financial reporting, is part of the platform's simulated investment/milestone workflow (Section 14.2, Section 30).

---

## 16. Off-Platform Deal Risk & Retention Strategy

Founders and investors may be tempted to exchange contact details and complete deals off-platform, bypassing commission and trust mechanisms. Vault Ventures does **not** attempt to technically prevent communication or contact-sharing (which would be both intrusive and largely unenforceable). Instead, it makes **staying on-platform meaningfully more valuable** than leaving.

### 16.1 Retention Mechanisms (reusing existing features)
- **Deal Room** — organized, persistent negotiation history in one place
- **Staged Disclosure + NDA** — structured trust-building unavailable off-platform
- **Milestone Tracking** — protects investor funding and founder accountability
- **Financial Transparency Layer** — structured reporting, evidence, and verification status unavailable off-platform (Section 15.4)
- **Reputation** — strengthened specifically by **verified, completed on-platform deals**
- **Verification** — Tier 2 requires on-platform track record
- **Premium/visibility benefits** — better matching and visibility tied to on-platform activity

### 16.2 Soft Retention Nudges
A soft, non-aggressive in-app reminder (e.g., at Deal Room entry or NDA stage) explaining the benefits of completing the deal through Vault Ventures (verified deal history, protected milestones, dispute support, reputation growth).

### 16.3 Explicit Non-Goals
The MVP does **not** implement aggressive surveillance, message scanning to detect contact-sharing, or technical communication blocking. This is an explicit design boundary, not an oversight.

---

## 17. Reputation System

A multi-sided reputation system, per role:

- **Founder Reputation:** identity verification, experience, previous projects, milestone completion, investor feedback, and — where applicable — a track record of timely, evidence-backed financial reporting.
- **Investor Reputation:** identity verification, investment history, deal completion, founder feedback.
- **Professional Reputation:** skills, experience, previous projects, startup feedback.

**Core rule:** Reputation is strengthened specifically by **verified on-platform activity and completed deals** (tying directly into the retention strategy in Section 16), not merely by profile claims. Verification tier (Section 11) contributes to, but is not identical to, reputation.

---

## 18. Premium System

**Free tier (all roles):** profile creation, basic listings, basic search/filters, limited AI recommendations, basic messaging, basic Deal Room.

**Premium Founder:** advanced AI business analysis, detailed Readiness Score, AI improvement suggestions, advanced investor matching, priority visibility, AI pitch-deck assistance, financial projection assistance, advanced analytics, priority access to verified investors.

**Premium Investor:** advanced AI deal recommendations, early access to selected opportunities, advanced filters, detailed startup analytics, advanced founder reputation info, portfolio dashboard, opportunity comparison, AI-powered deal ranking, saved searches/alerts, priority access to verified founders.

**Premium Professional:** priority profile visibility, advanced search/filters, AI startup recommendations, profile analytics, more applications, verified skill badge, priority access to selected opportunities.

For MVP, Premium is implemented as a **subscription simulation** (feature-gating, no real payment processing required unless separately specified).

---

## 19. Admin System

Admin is not a simple CRUD management dashboard. It functions as Vault Ventures' **Platform Governance, Trust, Verification & Risk Control Center**, covering, where appropriate:

- User management and identity verification review/approval (Tier 1/Tier 2 — Section 11)
- Business oversight; application/team oversight
- Micro Investment and Large/Standard Investment records, status, and investment-terms visibility (Section 15)
- Financial reports, financial verification status, and supporting evidence review (Section 15.4)
- Financial discrepancies flagged by investors, and investor complaints/flags generally
- Founder financial-reporting activity and related risk indicators
- Dispute/review workflows (basic) and deal oversight
- Reputation oversight
- Audit log review, including financial and investment-related audit entries
- Relevant investment and financial analytics
- Platform analytics and platform settings

This is a product/business-level requirement; it does not prescribe specific screens, database structures, or APIs beyond what is already defined elsewhere in this Master Specification.

---

## 20. Business Model

**Primary revenue:** 3–5% commission on successfully processed investments through the platform, subject to applicable laws and each investment's legal structure. The commission mechanism applies to both Micro Investment (Profit/Loss Sharing) and Large/Standard Investment (Equity/Ownership) — the return model an investor receives does not change how platform commission is calculated.

- **Large investor example:** BDT 10,00,000 investment × 5% = BDT 50,000 revenue.
- **Small investor pooling example:** 20 investors × BDT 25,000 = BDT 5,00,000 total × 5% = BDT 25,000 revenue.
- **Milestone-based commission:** commission applied per successfully processed funding tranche (e.g., 3 tranches totaling BDT 10,00,000 at 5% = BDT 50,000 total).

The platform supports One Founder + One Large Investor, One Founder + Multiple Small Investors, or a combination — where legally permitted.

**Additional revenue sources:** Premium subscriptions; founder/investor verification services; premium AI services; advanced business analysis; future third-party verification services.

*(For the MVP prototype, all monetary flows — commission, subscriptions, milestone funding, and Micro/Large investment returns — are simulated, not processed as real transactions; see Section 30.)*

---

## 21. System Workflow (High-Level)

```
FOUNDER                                          SKILLED PROFESSIONAL
  ↓                                                 ↓
Submit Business Idea                            Search & Filtering
  ↓                                                 ↓
AI Business Analysis                            AI Skill Matching
  ↓                                                 ↓
Investor Readiness Score                        Startup Match
  ↓                                                 ↓
┌─────────────┴─────────────┐                   Join / Negotiate
↓                             ↓
SEARCH & FILTER          AI SUGGESTIONS
↓                             ↓
└─────────────┬─────────────┘
  ↓
LARGE / SMALL (MICRO) INVESTORS
  ↓
Mutual Interest
  ↓
Staged Information Disclosure
  ↓
NDA
  ↓
DEAL ROOM (investment type & terms agreed: Micro/Profit-Loss Sharing or Large-Standard/Equity)
  ↓
Negotiation / Agreement
  ↓
Milestone-Based Investment (Simulated)
  ↓
Periodic Financial Reporting & Discrepancy Review
  ↓
Progress Tracking
  ↓
Business Growth / Reputation Update
```

---

## 22. High-Level Architecture

### 22.1 User Layer
Founder · Investor · Skilled Professional · Admin

### 22.2 Core Platform Layer
Authentication · Profiles · Search & Filtering · Business Management · Opportunity Management · Application/Interest Management · Deal Room · Investment Terms & Type Management · Financial Reporting & Transparency · Messaging · Notifications · Milestone Tracking · Reputation · Premium Simulation · Admin Management

### 22.3 AI Layer
AI Business Analysis (Readiness Score Engine) · Matching Engine · Recommendation Engine (AI Suggestions)

### 22.4 Trust & Security Layer
Verification · RBAC · Stage-Based Access Control · NDA Management · Financial Verification Status & Discrepancy Review · Audit Logs

### 22.5 Data Layer
Persists the entities defined in Section 23 across all layers above.

*(No specific technology stack is prescribed here, as none was fixed in the original proposal; stack selection belongs in the later implementation prompt.)*

---

## 23. Conceptual Data Model

Core entities (conceptual, not a physical schema):

- **User** (base identity; role assignment)
- **Founder Profile**
- **Investor Profile**
- **Professional Profile**
- **Business**
- **Business Requirement** (funding needs, skill needs)
- **Investor Preference**
- **Skill**
- **Recommendation** (AI Suggestion output)
- **Match Score** (Matching Engine output, per pair)
- **Readiness Assessment** (Readiness Score output, per business, versioned)
- **Verification** (identity tier, status, evidence references)
- **Reputation** (per user, per role)
- **Interest / Application**
- **Connection** (Match → Connection transition)
- **Disclosure Stage** (per relationship)
- **NDA** (per relationship)
- **Deal Room**
- **Deal**
- **Deal Status** (lifecycle state)
- **Agreement**
- **Investment** (type: Micro or Large/Standard; agreed return/ownership terms; per Deal)
- **Milestone**
- **Progress Update**
- **Financial Report** (period, revenue, expenses, net profit/loss, cash position, notes)
- **Financial Evidence** (supporting documents attached to a Financial Report)
- **Financial Verification Status** (Self-Reported / Evidence Submitted / Under Review / Verified-Reviewed, per Financial Report)
- **Financial Discrepancy Report** (investor-raised flag on a Financial Report, with review status)
- **Document**
- **Audit Log**
- **Notification**
- **Subscription / Premium Status**
- **Admin Action**

Entities are kept to those with a clear functional purpose, avoiding unnecessary over-normalization.

---

## 24. Business Rules (Core Logic)

- **Visibility:** A user sees only content permitted by their role (RBAC) and, for business details, the current Disclosure Stage of their specific relationship with that business.
- **Stage 2 unlock:** Triggered when an investor/professional expresses interest and the founder does not decline.
- **Stage 3 unlock:** Triggered by both parties accepting the NDA.
- **Stage 4 unlock:** Triggered by NDA completion at Stage 3 plus founder confirmation to proceed.
- **Deal Room creation:** Created when mutual interest is confirmed (post-Stage 2, typically alongside or after NDA initiation).
- **Match → Connection:** A computed Match becomes a Connection when both sides express mutual interest (one-sided interest remains a pending Application/Interest record).
- **Investment type selection:** An Investor chooses Micro Investment or Large/Standard Investment per opportunity; the choice determines whether the return model is Profit/Loss Sharing or Equity/Ownership (Section 15). The two modes are not interchangeable mid-deal without renegotiating terms.
- **No guaranteed return:** Neither investment type may be presented, in any UI copy or generated content, as guaranteeing a profit, a fixed return, or a specific ownership outcome.
- **Financial report calculation:** Where revenue and expense data are available for a reporting period, Net Profit/Loss is calculated by the platform as Revenue − Expenses; a manually entered profit figure is not treated as authoritative on its own.
- **Financial verification status:** A Financial Report's status (Self-Reported, Evidence Submitted, Under Review, Verified/Reviewed) must be visible alongside the report; Self-Reported status is never displayed or implied as verified.
- **Discrepancy flagging:** An investor on a funded deal may flag a Financial Report as a discrepancy; flagged reports move to Under Review and are resolved through Admin review (resolved, disputed, or under review outcome).
- **Reputation updates:** Recalculated on verified milestone completions, deal completions, and feedback submissions — weighted toward verified, on-platform activity.
- **Verified deal effect on reputation:** Completed on-platform deals contribute more heavily to reputation than unverified claims or off-platform-reported activity.
- **Milestone progress:** Each milestone has a defined status (pending, in progress, completed, disputed) and moves the overall Deal Status forward only when marked completed (with basic admin oversight where practical).
- **AI score generation:** Readiness Score and Match Score are generated from structured inputs using documented, fixed weights (Sections 9–10); scores are recalculated when relevant inputs change.
- **Recommendation ranking:** AI Suggestions rank candidates by Match Score, applying any relevant Premium visibility boost, but never hide lower-ranked legitimate opportunities from Search & Filtering.
- **Missing information:** Where required structured inputs are missing, the affected factor score defaults to a documented neutral/low value and is flagged as "incomplete" rather than silently omitted.
- **Unverified ↔ Verified interaction:** Unverified (Tier 0) users can browse, search, and express interest, but higher-trust actions (e.g., entering Stage 3 NDA content, or being prioritized in recommendations) require at least Tier 1 verification.

---

## 25. MVP Scope

### 25.1 MUST HAVE
- User authentication and role-based profiles
- Founder business submission
- Investor opportunity/preference profiles
- Skilled professional profiles
- Search and Advanced Filtering (per role)
- AI Business Analysis / Investor Readiness Score (rule-based)
- AI Matching Engine (Founder↔Investor, Founder↔Professional)
- AI Suggestions (recommendation engine using Matching Engine)
- Staged Information Disclosure (4 stages)
- NDA workflow
- Deal Room (documents, chat, negotiation, agreement templates, milestones)
- Investment type selection (Micro Investment/Profit-Loss Sharing, Large-Standard Investment/Equity) with terms recorded per deal (Section 15)
- Financial transparency & reporting layer: periodic revenue/expense/net-profit reporting, supporting evidence, financial verification status, historical reports (Section 15.4)
- Investor discrepancy flagging on financial reports, with basic Admin review (Section 15.4)
- Milestone-based investment simulation and progress tracking
- Reputation system (basic, rule-based)
- Tiered Verification (Tier 0–2, manual Tier 1/2 review)
- Premium subscription simulation
- Admin dashboard (users, verification, businesses, deals, investment/financial oversight, audit logs)
- Basic audit logging for sensitive document access and financial report changes
- Notifications (basic)

### 25.2 SHOULD HAVE
- Reverse Investment Discovery (investor-published preferences)
- Portfolio dashboard for investors, including per-investment financial and verification visibility (Section 15.7)
- Saved searches / alerts
- Basic dispute reporting to Admin
- Deal Room meeting scheduling
- Profile/reputation analytics views

### 25.3 FUTURE SCOPE
See Section 27.

---

## 26. Should-Have Scope

(Consolidated from 25.2 for clarity) — features that strengthen the FYP prototype if time allows but are not required for a functioning demonstration: Reverse Investment Discovery, investor portfolio dashboard (with per-investment financial/verification visibility), saved searches/alerts, basic dispute reporting/admin handling, Deal Room meeting scheduling, and reputation/profile analytics.

---

## 27. Future Scope

Explicitly excluded from the MVP, to be considered only after the academic prototype:

- Real investment processing / real financial custody
- Financial institution integration
- Real escrow services
- Actual equity transactions and real profit distribution/payout processing
- Automated KYC/AML
- Government identity verification integration
- BSEC / regulatory registration and compliance
- ML-based learning-to-rank matching
- NLP-based automatic business/pitch-deck analysis
- Advanced fraud / duplicate-business / financial-misreporting detection (beyond the MVP's basic discrepancy-flag and Admin-review workflow)
- Advanced dispute resolution system
- Advanced recommendation fairness tooling
- Advanced data-leak detection
- Advanced retention analytics
- Third-party verification services (including third-party financial audit services)
- International investment marketplace

---

## 28. Non-Functional Requirements

- **Security:** RBAC, stage-based access control, encrypted sensitive fields, HTTPS, audit logging on sensitive actions — scoped to prototype-appropriate levels (not enterprise SLA).
- **Privacy:** Consent capture at registration; confidential Deal Room and financial reporting data restricted to relationship members and Admin; basic data retention/deletion consideration for confidential data (Section 29).
- **Performance:** Responsive interaction for demonstration-scale data (not production-scale load).
- **Scalability:** Architecture should not preclude future scaling, but MVP is not required to be load-tested at production scale.
- **Maintainability:** Clear separation between Core Platform, AI, and Trust/Security layers to support future extension.
- **Usability:** Role-appropriate, uncluttered flows for three distinct user types plus Admin.
- **Reliability:** Core flows (submission, matching, Deal Room, milestones, financial reporting) should behave predictably and consistently.
- **Auditability:** Sensitive actions (document access, verification decisions, deal status changes, financial report edits, discrepancy-flag resolutions) are logged.

---

## 29. Security & Privacy Considerations

- Confidential Deal Room, business, and financial reporting data access strictly gated by RBAC + Disclosure Stage + NDA status.
- Sensitive documents, including financial supporting evidence, encrypted at rest where appropriate; all traffic over HTTPS.
- Audit records for sensitive document view/download (including financial reports and evidence), wherever practical in MVP.
- Basic data retention/deletion policy consideration for confidential Deal Room and financial reporting data (e.g., defining that founders/admin can request removal of confidential materials after a deal concludes or is withdrawn) — full implementation may be limited in MVP but the policy stance must be documented.
- No enterprise-grade security infrastructure is required or expected.

---

## 30. Legal & Compliance Boundaries

Vault Ventures' MVP is explicitly a **Prototype / Simulation Platform** for academic purposes. It must **not**:

- Custody real funds
- Execute real equity transactions
- Operate as a real broker/dealer
- Provide real escrow services
- Guarantee any investment return, profit distribution, or ownership outcome, for either Micro or Large/Standard Investment
- Claim fraud-proof or fully verified financial reporting
- Claim full legal/regulatory compliance

All investment and milestone funding activity, for both Micro Investment (Profit/Loss Sharing) and Large/Standard Investment (Equity/Ownership), is **simulated**. The platform includes:
- An explicit simulation disclaimer, visible to users
- Terms of Service acceptance at registration
- Basic privacy/consent awareness at data collection points

Real KYC/AML, BSEC or equivalent regulatory registration, financial institution integration, real escrow, actual equity transactions, and real profit/loss distribution are explicit **Future Scope**, not implemented in the MVP. Real-money investment, equity, profit-sharing, securities, taxation, payment custody, investor eligibility, and related regulatory matters require appropriate legal/compliance review before real-world deployment. This document is a product/business specification, not legal or financial advice.

---

## 31. Known Limitations

Documented honestly rather than hidden:

- AI scoring (Readiness Score and Matching Engine) is initially rule-based, not machine-learned.
- Real-world funding/market data is unavailable in the prototype; scoring relies on structured user-provided inputs.
- Investment and milestone transactions, and all Micro/Large-Standard investment returns, are simulated, not real.
- Verification is manual (Admin review) in the MVP, not automated — this applies to both identity verification (Tier 1/2) and financial report verification status.
- Financial reporting relies on founder-submitted data and evidence; verification status and investor discrepancy flagging increase transparency and reviewability but do not guarantee the accuracy of reported figures or prevent fraud.
- Legal/regulatory compliance is not fully implemented.
- Cold-start limitation: recommendations are weaker for new users/businesses with little profile data.
- Reputation is bounded by available on-platform history — new users naturally start with limited reputation signal.
- The Matching Engine's weights are configured by design decisions, not learned from outcome data (a documented, not hidden, source of potential bias — see AI conflict-of-interest / fairness note below).
- Off-platform bypass cannot be technically prevented; the platform relies on value-based retention rather than enforcement (Section 16).

---

## 32. Success Metrics

Indicative metrics for evaluating the academic prototype (not production KPIs):

- Successful end-to-end completion of each of the three role workflows (Founder, Investor, Professional) without error.
- Correct, explainable output from the Readiness Score and Matching Engine across representative test cases.
- Correct stage-gating behavior in Staged Disclosure (no premature access to Stage 3/4 content).
- Functional Deal Room lifecycle from Matched → Completed with milestone simulation, correctly recording investment type and terms.
- Financial reporting layer correctly calculates Net Profit/Loss from submitted revenue/expense inputs, and the discrepancy-flag → Admin-review workflow functions end-to-end.
- Verification workflow functioning for Tier 0 → Tier 1 → Tier 2 progression.
- Audit log entries correctly generated for sensitive document access and key deal/verification/financial-reporting actions.
- Internal consistency: no feature in the built system contradicts this Master Specification.

---

## 33. Final End-to-End Workflow

```
1. Registration & Role Selection (Founder / Investor / Professional)
2. Profile Creation (role-specific)
3. Verification (Tier 0 by default → Tier 1 via Admin review)
4. FOUNDER: Submit Business → AI Readiness Analysis → Improve → Publish
5. INVESTOR / PROFESSIONAL: Set Preferences/Skills (Investor preferences include investment type interest) →
   Search & Filter / Receive AI Suggestions
6. AI Matching Engine computes explainable Match Scores across candidates
7. Mutual Interest → Match becomes a Connection
8. Staged Disclosure progresses (Teaser → Extended → NDA → Full Proposal)
9. Deal Room opens; NDA signed; negotiation occurs; investment type (Micro/Profit-Loss Sharing or
   Large-Standard/Equity) and terms are agreed; Agreement reached
10. Deal Status progresses: Matched → Interest Confirmed → Deal Room → NDA Signed →
    Negotiation → Agreement → Milestone Funding Active → Completed
11. Milestone-based investment simulation tracks progress and releases simulated tranches
12. Founder submits periodic financial reports (revenue, expenses, supporting evidence); platform
    calculates Net Profit/Loss and sets Financial Verification Status
13. Investor reviews financial performance and verification status; may flag a discrepancy for Admin review
14. Reputation updated based on verified, completed on-platform activity
15. Admin oversees verification, investment/financial records, discrepancies, disputes, and audit logs throughout
16. Platform earns simulated commission (3–5%) on processed investment amounts
```

---

*End of Master Project Specification. This document is the single source of truth for Vault Ventures' scope, logic, and boundaries. Implementation prompts, technical stack decisions, and phase-by-phase development instructions are to be generated separately, using this document as authoritative context.*

---

## DOCUMENT UPDATE NOTES

**Major sections updated:**
- Section 1 (Executive Summary), Section 4 (Proposed Solution), Section 5.2 (Investor), Section 6 (Core Value Proposition), and Section 7 (Functional Requirements) — updated to name the two investment modes and the financial transparency layer.
- Section 14.2 — clarified that milestone funding release (when capital is released) is separate from the investment return model (what the investor receives).
- **New Section 15 — Investment Model & Financial Transparency Specification** — added in full: Micro Investment (Profit/Loss Sharing), Large/Standard Investment (Equity/Ownership), loss handling, the financial reporting/verification/discrepancy layer, the deal/investment relationship flow, investor dashboard requirements, Admin oversight, and a legal/compliance note.
- Section 19 (Admin System) — rewritten so Admin is explicitly a governance/trust/verification/risk-control layer, not a CRUD dashboard, and now names investment and financial oversight responsibilities.
- Section 20 (Business Model) — clarified that commission applies identically regardless of investment type.
- Section 23 (Conceptual Data Model) — added Investment, Financial Report, Financial Evidence, Financial Verification Status, and Financial Discrepancy Report entities.
- Section 24 (Business Rules) — added rules for investment type selection, no-guaranteed-return, financial report calculation, verification status, and discrepancy flagging.
- Section 25/26 (MVP / Should-Have Scope) — added investment type selection, the financial transparency layer, and discrepancy flagging to Must-Have; added financial visibility to the investor portfolio dashboard under Should-Have.
- Sections 28–32 (Non-Functional Requirements, Security & Privacy, Legal & Compliance Boundaries, Known Limitations, Success Metrics) — extended to cover financial reporting, the no-guaranteed-return/no-fraud-proof-reporting boundary, and related audit/limitation/metric items.
- Section 33 (Final End-to-End Workflow) — added periodic financial reporting and discrepancy-flagging steps.

**Renumbering:** A new Section 15 was inserted after the Deal Room section, so all subsequent sections (former 15–32) shifted up by one (now 16–33). All in-document cross-references to those section numbers were updated accordingly (e.g., former "Section 16" → "Section 17" for Reputation; former "Section 28"/"Section 29" → "Section 29"/"Section 30" for Security & Privacy / Legal & Compliance; former "Section 15" → "Section 16" for Off-Platform Retention).

**Ambiguity not fully resolved:** The original document did not specify exact reporting-period cadence (e.g., monthly vs. quarterly) for financial reports, or the exact set of Admin resolution outcomes for a discrepancy beyond "resolved / disputed / under review" (taken from the reference PDF). These are left as open, deal/implementation-level details, consistent with keeping this document at the product/business level.

**Consistency issue found and resolved:** The original Master Specification described "Investment" and "investors" throughout without ever distinguishing a return/ownership model — Large and Small/Micro investors were differentiated only by ticket size, which would have conflicted with the reference PDF's requirement that Micro and Large/Standard Investment use different return structures (profit-sharing vs. equity). This has been resolved by introducing the Investment Model as a first-class concept (Section 15) and threading it consistently through Target Users, Functional Requirements, Deal Room, Data Model, Business Rules, MVP Scope, Admin, and Legal/Compliance.
