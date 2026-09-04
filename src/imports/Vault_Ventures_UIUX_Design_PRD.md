# VAULT VENTURES — UI/UX DESIGN PRD
### Design specification for the AI-powered Idea + Capital + Skills matching platform
**Status:** Pre-implementation design specification. No code exists yet. No screen, component, route, or API described here is assumed to already exist.
**Inputs:** Master Project Specification v1.0, Master Development Prompt, UI/UX methodology best practice.
**Out of scope for this document:** code, file/folder structure, phase-by-phase build plan, tech stack.

---

## 0. How to read this PRD

To avoid the "giant card, page-by-page styling" trap, this PRD is built around **reusable UX patterns**, not one bespoke spec per screen. Section 6 defines each pattern once (layout, components, states, responsive rules). Section 7 lists every screen with only what differs from its pattern: which pattern it uses, its unique content, and its unique rules. Screens with no reusable pattern (Landing, Deal Room stages, etc.) get a full spec. This keeps the document dense and consistent rather than repetitive — matching Vault Ventures' own "no unnecessary duplication" principle.

---

## 1. Brand Direction

Vault Ventures sits at the intersection of **fintech, venture capital, and B2B SaaS** — not social media, not crowdfunding, not admin tooling. The design should feel like it belongs in the same category as Carta, AngelList, Brex, or a private bank's client portal: quietly expensive, data-competent, unhurried.

**Brand attributes:** Trustworthy · Precise · Composed · Intelligent · Understated · Secure

**Design metaphor:** *the vault* — depth, weight, controlled access, layered doors (maps directly onto Staged Disclosure). Visual language should evoke controlled reveal (content unlocking, layered panels, subtle depth) rather than open social feeds.

**What to avoid:** rounded bubbly illustration, gradient mesh hero blobs, emoji as UI icons, playful mascot characters, infinite-scroll feed patterns, "like/heart" social mechanics, casino-style score reveals (spinning numbers, confetti) for financial scores.

---

## 2. Design System

### 2.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-base` | #0B1220 | App shell background (dark navy, not pure black) |
| `--color-bg-surface` | #121A2B | Card / panel surface |
| `--color-bg-surface-raised` | #182338 | Modals, dropdowns, elevated panels |
| `--color-bg-canvas-light` | #F7F9FC | Light-mode base background |
| `--color-bg-surface-light` | #FFFFFF | Light-mode card surface |
| `--color-border-subtle` | #24304A (dark) / #E4E8F0 (light) | Default borders, dividers |
| `--color-border-strong` | #35446A (dark) / #C9D2E3 (light) | Focused inputs, active tabs |
| `--color-text-primary` | #EAF0FA (dark) / #101828 (light) | Headings, primary content |
| `--color-text-secondary` | #93A1BF (dark) / #475467 (light) | Supporting text, labels |
| `--color-text-tertiary` | #5E6D8F (dark) / #667085 (light) | Metadata, timestamps |
| `--color-brand-cyan` | #22D3EE | Primary brand accent — AI, links, active states |
| `--color-brand-cyan-strong` | #06B6D4 | Primary buttons, key CTAs |
| `--color-navy-deep` | #0F2A4A | Secondary brand surface (used in marketing hero) |
| `--color-gold-trust` | #C9A24B | Reserved exclusively for verification/trust signals (Tier badges, "Verified" marks) — never used decoratively |
| `--color-success` | #22C55E | Positive states, completed milestones |
| `--color-warning` | #F59E0B | Pending review, expiring NDA, action needed |
| `--color-danger` | #F04438 | Errors, rejected verification, disputes |
| `--color-info` | #3B82F6 | Neutral informational states |

**Rules:**
- Cyan is the *only* AI-association color. If a UI element is cyan, it signals "AI-generated content" (scores, recommendations, insight text). This creates a learnable visual grammar — users should be able to tell "AI said this" vs "the platform/user said this" at a glance.
- Gold is reserved exclusively for trust/verification. Never use gold for anything decorative, or it dilutes its meaning as a trust signal.
- Dark navy is the default theme (financial-product convention — Bloomberg, Robinhood Pro, Carta). Light theme is a full parity option, not an afterthought, using the light-mode tokens above with identical semantic mapping.

### 2.2 Typography

| Role | Font | Notes |
|---|---|---|
| Display / Headings | **Söhne** or **General Sans** (fallback: Inter) | Geometric grotesk, confident, not decorative |
| Body / UI text | **Inter** | High legibility at small sizes, dense tables |
| Numeric / Data (scores, currency, %) | **IBM Plex Mono** or **Inter tabular figures** | Tabular lining figures required for all scores, currency, match %, so digits align in tables/columns |

**Scale (desktop base 16px):** Display 32/40 · H1 28/36 · H2 22/30 · H3 18/26 · Body 15/22 · Body Small 13/20 · Caption 12/16 · Overline 11/16 (uppercase, tracked +0.04em, used for section labels like "MATCH FACTORS").

Font weights: 600 for headings, 500 for emphasis/labels, 400 for body. Never use weights below 400 (readability), avoid weight 700+ (feels like marketing hype, undercuts "composed" attribute).

### 2.3 Spacing, Grid, Radius, Elevation

- **Spacing scale:** 4px base unit — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Component internal padding defaults to 12–16px; section spacing defaults to 24–32px. This is intentionally tighter than typical consumer SaaS to preserve information density.
- **Grid:** 12-column, 24px gutter, max content width 1440px for dashboards, 1120px for marketing pages. Dashboard content areas use a persistent 2/3–1/3 split (primary content + contextual sidebar) rather than full-bleed single column, to keep related data adjacent.
- **Border radius:** 6px (inputs, buttons, badges), 10px (cards, panels), 14px (modals). No pill-shaped buttons except for filter chips and status badges — pill shapes read as "casual/social," reserved narrowly.
- **Elevation:** Flat design with 1px borders as the primary separation method (`--color-border-subtle`), not shadow-heavy. Shadows reserved for genuinely floating elements: dropdowns (`0 4px 12px rgba(0,0,0,0.24)`), modals (`0 12px 32px rgba(0,0,0,0.4)`), toasts. Cards on the base background do **not** get drop shadows — only a border and a very slightly lighter surface color. This directly serves the "no decorative UI" and density-first mandate.

### 2.4 Iconography

Single icon set throughout (Phosphor Icons or Lucide, "regular" weight, 20px default, 1.5px stroke). No mixed icon styles. Icons are functional, not decorative — every icon must map to a clear action or status, never used purely as visual filler next to headings.

### 2.5 Core Components

| Component | Spec |
|---|---|
| **Button** | Primary (solid cyan-strong, white text), Secondary (outline, border-strong), Tertiary (text-only, cyan), Destructive (danger outline, fills red on hover). Sizes: sm 32px / md 40px / lg 48px height. Icon-only buttons require `aria-label`. Loading state replaces label with spinner, button stays fixed width to prevent layout shift. |
| **Input** | Label above field (never placeholder-as-label). 40px height default. States: default, focus (2px cyan ring), error (red border + inline message below), disabled (reduced opacity, no interaction). Helper text in tertiary color below field. |
| **Card** | Surface color + 1px border + 10px radius. Header row (title + optional overline label + optional action), body, optional footer divider. Used for all discrete content blocks — never nested more than one level deep. |
| **Table** | Dense row height (44px default, 36px "compact" mode toggle for admin). Sticky header. Sortable columns show subtle caret. Row hover = subtle surface-raised tint. Row click opens detail (drawer or new screen, defined per-screen). Numeric columns right-aligned with tabular figures. Zebra striping is **not** used (adds visual noise); border-bottom per row instead. |
| **Tabs** | Underline style (2px cyan indicator), not pill/segmented — pill tabs reserved for short binary toggles (e.g., Monthly/Annual pricing). Max 6 visible tabs before overflow menu. |
| **Modal** | Centered, max-width 560px (forms) or 720px (content-heavy, e.g., NDA text). Always has explicit close (X) plus Cancel/Confirm footer buttons. Destructive confirms require typed confirmation only for irreversible platform-level actions (e.g., Admin permanently rejecting a Tier 2 application), not for routine actions. |
| **Drawer** | Right-side slide-in, 420px (detail view) or 640px (edit form) width, full height. Used for "peek without leaving context" patterns: table row detail, notification detail, document preview metadata. |
| **Dropdown / Select** | Standard combobox; searchable variant for lists >15 items (e.g., Industry, Country). Multi-select shows chips inside the field, collapsing to "+N" past 3. |
| **Badge** | Status badges use semantic color as a subtle background tint (12% opacity) with full-opacity text/icon of the same hue — never a solid loud fill. Verification badges are the one exception: solid gold fill, small shield/check icon, always paired with the tier label text (never icon-only, for accessibility and clarity). |
| **Status indicator (dot)** | 8px dot + label, used in tables for lightweight state (Active/Inactive/Pending) where a full badge would add too much visual weight. |
| **Alert (inline banner)** | Full-width or contained banner, left icon, semantic color, used for page-level or section-level notices (e.g., "Your NDA expires in 2 days"). Dismissible only if non-critical. |
| **Toast** | Bottom-right stack (desktop) / bottom-center (mobile), auto-dismiss 5s for confirmations, persistent until dismissed for errors requiring action. Max 3 stacked. |
| **Charts** | Recharts-style: score gauges (radial, see §8), horizontal bar for factor breakdowns, line chart for reputation-over-time and portfolio value (simulated), stacked bar for milestone funding progress. Charts always paired with a legend and, for AI-derived charts, an explanatory caption — never a bare chart. Chart colors pull from the semantic palette only, never a separate "chart rainbow" palette. |
| **Progress indicator** | Linear bar for milestone/funding progress (with milestone markers as ticks along the bar, not just a smooth fill). Circular/radial for scores (Readiness Score, Match Score) — see §8. Stepper (numbered, connected dots) for the Deal Room lifecycle and multi-step onboarding forms. |
| **Avatar** | Circle, 4 sizes (24/32/40/56px). Verified users show a small gold badge overlapping the bottom-right of the avatar. Org/company avatars use square-rounded (6px radius) to visually distinguish person vs. entity at a glance. |
| **Empty state** | Icon (outline, tertiary color) + 1-line headline + 1-line supporting text + primary action button. Never just blank space or a generic "No data" label. |
| **Loading state** | Skeleton screens matching the destination layout (not spinners) for initial page loads >300ms; inline spinners only for button/action-level waits. |
| **Error state** | Inline for field/form errors; full-block (icon + message + retry action) for failed data loads; dedicated 404/500 pages for routing/server failures, styled consistently with the empty-state pattern. |
| **Confirmation state** | Inline success banner or toast for lightweight actions; a dedicated confirmation screen (not modal) for irreversible, high-stakes actions with platform-wide consequence — e.g., NDA signed, Agreement finalized, milestone marked complete — showing what just happened and clear next steps. |

---

## 3. Navigation Architecture

**Structure:** persistent left sidebar (desktop/tablet) collapsing to a bottom tab bar + hamburger drawer (mobile), consistent across all three role experiences and Admin — only the item set changes per role. This keeps the platform's mental model consistent even though Founder/Investor/Professional are functionally different products.

**Sidebar (desktop, ≥1024px):** 240px expanded / 64px icon-only collapsed (user-toggleable, state persisted). Sections, top to bottom:
1. Logo + role switcher (if user holds multiple roles — see §3.1)
2. Primary nav (role-specific, see table below)
3. Divider
4. Notifications, Messages/Deal Rooms (with unread count)
5. Divider, pinned to bottom: Verification status chip, Premium upsell (if free tier), Profile/Settings, Logout

| Role | Primary nav items |
|---|---|
| Founder | Dashboard · My Businesses · Discover Investors · Discover Professionals · Connections · Deal Rooms · Milestones · Reputation |
| Investor | Dashboard · Discover Startups · Saved Opportunities · Connections · Deal Rooms · Portfolio · Reputation |
| Professional | Dashboard · Discover Startups · Applications · Connections · Deal Rooms · Reputation |
| Admin | Dashboard · Users · Verification Queue · Businesses · Applications · Teams · Deals · Reputation · Reports/Disputes · Audit Logs · Analytics · Settings |

**Top bar (all authenticated views):** global search (search across businesses/people the user has access to, respecting Stage/RBAC visibility — never a bypass), notification bell, avatar menu.

**3.1 Role switching:** A single Vault Ventures account can hold multiple roles (e.g., a Founder who is also a Professional). A role switcher lives beside the logo; switching swaps the entire sidebar item set and dashboard, and is treated as a distinct "workspace" — data/relationships from one role never bleed into another role's screens.

**Mobile (<768px):** Bottom tab bar with 4 primary destinations (Dashboard, Discover, Deal Rooms, Profile) + a "More" tab housing the remaining sidebar items. Notifications accessible via top bar bell icon.

---

## 4. Screen / Page Inventory

**Public / Marketing (unauthenticated):** Landing · How Vault Ventures Works · Value Proposition (Founder/Investor/Professional tabs) · AI Capabilities · Trust & Security · Pricing/Premium · FAQ · Login · Register (role selection) · 404/500.

**Shared authenticated (pattern-driven, one build per pattern, reused across roles):** Dashboard (×4 role variants) · Profile (×4 role variants) · Discovery/Search & Filter (×3 role variants: Investor↔Businesses, Professional↔Businesses, Founder↔Investors/Professionals) · Connections list · Notifications center · Settings.

**Founder-specific:** Business Creation (multi-step) · Business Profile (owner + public view) · Readiness Score detail · AI Improvement Suggestions.

**Investor-specific:** Investment Preferences setup · Saved Opportunities · Portfolio/Progress dashboard.

**Professional-specific:** Skills/Experience profile editor · Applications tracker · Negotiation panel.

**Shared cross-role:** Match Score detail (any pairing) · Staged Disclosure content view · NDA flow · Deal Room (8 lifecycle states, one screen with state-driven content) · Milestone tracking view · Reputation detail.

**Admin:** Admin Dashboard · Users (table + detail) · Verification Queue (review workspace) · Businesses (table + detail) · Applications (table + detail) · Teams (table + detail) · Deals (table + detail) · Reports/Disputes (queue + detail) · Reputation oversight · Audit Logs (searchable log table) · Platform Analytics · Settings.

Total unique screen templates: **~34**, covering ~60 role-contextualized views without duplicating layout logic — achieved via the pattern system in §6.

---

## 5. Role-Based User Journeys

**Founder:** Register → Verify (Tier 0→1) → Create Business Profile → AI Readiness Analysis → Act on improvement suggestions → Publish → Discover Investors/Professionals (search + AI Suggestions in parallel) → Express/receive interest → Staged Disclosure advances → NDA → Deal Room → Negotiation → Agreement → Milestone Funding (simulated) → Progress updates → Reputation grows.

**Investor:** Register → Verify → Set Investment Preferences (or use Reverse Discovery to publish preferences) → Discover Startups (search + filters + AI recommendations with Match Score) → Save/Express interest → Staged Disclosure unlocks as founder confirms → NDA → Deal Room → Negotiate terms → Agreement → Track milestone funding + business progress → Portfolio view aggregates all active/completed deals → Reputation grows.

**Professional:** Register → Verify → Build Skills/Experience profile → Discover Startups (filtered by skill/industry/availability) → AI Suggestions rank best-fit opportunities with Match Score → Apply → Negotiate (compensation/equity) → Join Deal Room-equivalent (team) → Track engagement → Reputation grows.

**Admin:** Login (elevated auth) → Dashboard (platform health at a glance) → Verification Queue (Tier 1/2 manual review) → ongoing oversight loops across Users/Businesses/Deals/Reports as issues surface → Audit Logs for investigation → Analytics for platform-level reporting → Settings for platform configuration (score weights visibility, feature flags, etc.).

Each journey is diagrammed in-product as a persistent **progress indicator** relevant to where the user is (e.g., Founder sees a "Readiness → Discovery → Disclosure → Deal Room → Milestones" mini-stepper on their dashboard), so users always know what stage of the overall workflow they're in — this directly supports the "information clarity over decoration" mandate by replacing generic dashboard clutter with one meaningful progress signal.

---

## 6. Reusable UX Patterns

### 6.1 Dashboard Pattern
**Layout:** 2/3 primary column + 1/3 contextual sidebar, both scrollable independently on desktop; single column stacked on mobile (primary content first, sidebar content collapses into an expandable "Quick Info" section below).

**Primary column (top to bottom):** Greeting/status strip (verification tier, profile completeness) → Key metric row (3–4 compact stat cards, role-specific) → Primary work list (role-specific: "My Businesses," "Recommended Startups," "Active Applications," "Pending Verifications") → Recent activity feed (deal status changes, new matches, messages — chronological, dense list not cards).

**Sidebar column:** AI Suggestions widget (top 3, with Match Score chips, "View all" link) → Deal Rooms in progress (compact list with stage badge) → Notifications preview.

**States:** Empty (new user, <20% profile complete) shows an onboarding checklist instead of the metric row. Loading uses skeleton matching this exact layout. 

| Role | Metric row | Primary work list |
|---|---|---|
| Founder | Readiness Score · Active Connections · Deal Rooms Open · Profile Views | My Businesses (with Readiness Score chip + stage) |
| Investor | Active Deal Rooms · Portfolio Value (simulated) · Saved Opportunities · Avg. Match Score of saved | Recommended Startups (Match Score + industry + stage) |
| Professional | Active Applications · Deal Rooms · Profile Views · Avg. Match Score | Recommended Startups + Application status list |
| Admin | Pending Verifications · Open Reports · New Users (7d) · Active Deals | Verification Queue preview + flagged items needing review |

**Primary actions:** role-specific (Founder: "Create Business" / Investor: "Set Preferences" or "Discover" / Professional: "Complete Profile" / Admin: "Go to Queue"). **Secondary:** "View all" on every list module.

### 6.2 Profile Pattern
**Layout:** Two-column — left rail (avatar, name, role, verification badge, reputation summary, quick stats) fixed-width 280px; right column (tabbed sections: Overview, Experience/History, Reputation Detail, Documents, Activity). Public view (as seen by another role, gated by Disclosure Stage where applicable) hides edit affordances and any Stage-gated sections show a **locked-section state** (blurred/greyed placeholder + lock icon + "Unlocks after NDA" copy) rather than being omitted entirely — this is important: showing *that* content exists but is locked reinforces trust-pipeline value, vs. silently hiding it.

**States:** Own profile = editable inline (pencil icons per section). Others' profile = read-only + Stage-gated locks + primary action (Express Interest / Save / Message, contextual to role pairing and current relationship stage).

### 6.3 Discovery / Search & Filter Pattern
**Layout:** Left filter rail (240px, collapsible on tablet into a "Filters" drawer) + main result area. Result area defaults to a dense card-grid (2–3 columns desktop) with a list-view toggle for higher density power users (investors comparing many opportunities). Top of result area: result count, sort control, active-filter chips (removable individually), and a toggle between **"Search Results"** and **"AI Suggestions"** — per the Master Spec's explicit rule that these must never be merged into one feature. AI Suggestions view replaces the sort control with a "Ranked by Match Score" label and shows Match Score chips on every card; Search view never shows a ranking implication.

**Card content (result card):** entity name/logo, 1-line summary, 3–4 key filter-relevant facts (industry, stage, funding ask / investment range, location), Match Score chip *only* in AI Suggestions view, primary action (Save / Express Interest / View), verification badge if applicable.

**Filters (role-specific facets):** Investor↔Businesses: industry, stage, funding range, risk level, location, involvement type. Professional↔Businesses: required skills, industry, compensation type, location, remote/on-site. Founder↔Investors/Professionals: investor type (large/micro), industry focus, investment range, or professional skill/availability.

**States:** Empty results shows relaxed-filter suggestions, not a dead end. Loading = skeleton cards. Saved-search affordance available on every filter rail (Should-Have feature).

### 6.4 Match Score / Explainability Card (AI UX core pattern)
This is the platform's single most important trust-critical component — see §8 for full detail. Referenced here as it appears embedded in Discovery, Connections, and Deal Room screens as a compact chip that expands to the full breakdown on click/tap.

### 6.5 Connections & Applications List Pattern
**Layout:** Single dense table/list, columns: counterpart name+avatar, role, Match Score, current stage (Disclosure stage or Application status), last activity date, primary action. Row click opens the relationship in a drawer (quick view: stage, next required action) or navigates to the full Deal Room if one exists. Filterable by stage/status via tabs at the top (All / Pending / Active / Completed).

### 6.6 Admin Management Table Pattern
Applies identically to Users, Businesses, Applications, Teams, Deals, Reports, Reputation entries. **Layout:** full-width dense table, left-aligned filter/search bar above, bulk-action checkbox column, row click opens a right-side detail drawer with entity summary + action buttons (Approve/Reject/Suspend/Escalate as applicable) + an embedded audit-trail mini-log for that entity. Differentiation per entity is **columns only**:

| Entity | Key columns | Row actions |
|---|---|---|
| Users | Name, role(s), verification tier, status, joined date | View, Suspend, Impersonate-for-support (logged) |
| Verification Queue | Applicant, tier requested, submitted date, waiting time | Approve, Reject, Request more info |
| Businesses | Name, founder, industry, stage, Readiness Score, status | View, Flag, Suspend listing |
| Applications | Professional, business, status, submitted date | View |
| Teams | Business, member count, roles filled | View |
| Deals | Founder, counterpart, stage, value (simulated), last updated | View, Escalate |
| Reports/Disputes | Reporter, subject, category, severity, status | Investigate, Resolve, Escalate |
| Reputation | User, current score, recent change, flags | View history, Manual adjustment (logged) |
| Audit Logs | Actor, action, entity, timestamp, IP (if captured) | View detail (read-only, immutable) |

This single pattern, reused nine times, is what keeps the Admin experience learnable — an admin who understands the Users table already understands every other table.

---

## 7. Screen Specifications

### 7.1 Public / Marketing

**Landing Page**
- *Purpose:* Convert visitors into registered users across all three roles; establish trust immediately.
- *Layout:* Hero (headline + role-based CTA trio: "I'm a Founder / Investor / Professional" — not a single generic CTA) → How It Works (3-step visual, condensed version of the dedicated page) → Three value-prop blocks (one per role, tabbed or stacked) → AI explainability teaser (a real, small example Match Score breakdown, not a marketing mock) → Trust & Security band (verification tiers, staged disclosure icon-row) → Social proof / stats band (platform-honest numbers, or omitted if none exist yet — never fabricated stats) → Pricing teaser → Final CTA → Footer.
- *Primary actions:* Register (role-aware). *Secondary:* Login, "See how it works."
- *Rule:* No stock-photo people-shaking-hands imagery. Use abstract data/vault visual motifs and real UI screenshots of the actual Match Score / Readiness Score components once built — nothing communicates trust for a fintech-adjacent product like showing the real, explainable mechanism up front.

**How Vault Ventures Works**
- *Layout:* Three parallel swimlanes (Founder / Investor / Professional), each a vertical step sequence mirroring §5 journeys, converging visually at "Deal Room."

**AI Capabilities Page**
- *Layout:* One section per AI component (Readiness Score, Matching Engine, Search vs. Suggestions distinction) with a live/interactive demo widget where feasible, otherwise annotated screenshot. Must explicitly state the MVP is rule-based/deterministic, not ML — this is a documented Known Limitation and should be stated plainly, not obscured, reinforcing the "transparent" brand attribute.

**Trust & Security Page**
- *Layout:* Verification tier table (visual version of Master Spec §11), Staged Disclosure diagram (4 locked doors, visually reinforcing the vault metaphor), security practices list (RBAC, encryption, audit logging), explicit compliance boundary statement (prototype/simulation disclaimer) in plain, unhidden language.

**Pricing / Premium**
- *Layout:* Role-tabbed pricing (Founder/Investor/Professional), Free vs Premium comparison table per role, using the exact feature lists from Master Spec §17. Monthly/Annual toggle (pill component).

**FAQ**
- *Layout:* Categorized accordion (Account & Verification, AI & Matching, Deal Room & NDA, Payments/Simulation, Legal). Search-within-FAQ input at top.

**Login**
- *Layout:* Centered single-column form (email/password, SSO if applicable), "Forgot password" link, link to Register. No role selection needed (role is stored on the account).

**Register**
- *Layout:* Step 1: role selection (large tappable cards: Founder / Investor / Professional, with a 1-line description each — note a user can add roles later, this isn't irreversible). Step 2: account details. Step 3: role-specific minimum profile fields. Step 4: Terms of Service + simulation disclaimer explicit checkbox (required, cannot be pre-checked) → Email verification.

### 7.2 Founder Screens

**Dashboard** — uses §6.1 (Founder variant).
**Profile** — uses §6.2.
**Discover Investors / Discover Professionals** — uses §6.3, two instances differentiated by facet set.
**Connections** — uses §6.5.

**Business Creation (multi-step wizard)**
- *Purpose:* Structured intake feeding the Readiness Score engine — every field maps to a scoring factor, so the form itself must communicate that connection.
- *Layout:* Stepper (left rail on desktop, top progress bar on mobile) with steps: Basics (name, industry, one-line pitch) → Business Model → Market & Competition → Team/Founder Capability → Funding Requirement → Traction/Customer Validation → Review. Each step's fields are explicitly labeled with which Readiness Score factor they inform (small overline tag, e.g., "Feeds: Market Potential") — this transparency is core to the "explainable AI" brand promise and doubles as user education before they even see their score.
- *States:* Autosave draft at every step; a business can be left in "Draft" status and resumed. Final Review step shows a preview Readiness Score estimate before publish, with a clear "this will recalculate on any future edit" note.
- *Primary action:* Save & Continue / Publish (final step). *Secondary:* Save as Draft, Back.

**Business Profile (owner view)**
- *Layout:* Header (name, industry, stage, Readiness Score badge, status: Draft/Published/Under Review) → Tabs: Overview, Readiness Score Detail, Funding Ask, Team, Documents (Stage-gated visibility management — founder controls what's in Stage 2 vs Stage 4 here), Activity (who viewed/expressed interest).
- *Primary actions:* Edit, View Public Version, Manage Disclosure Content.

**Business Profile (investor/professional public view)**
- Reuses §6.2 profile pattern's locked-section behavior precisely: Stage 1 content always visible; Stage 2+ content shows locked-state cards with the unlock trigger stated plainly ("Unlocks when you express interest" / "Unlocks after NDA").

**Readiness Score Detail** (see §8 for the visualization pattern itself)
- *Layout:* Overall score (radial gauge, large) at top with a one-line qualitative label (e.g., "Developing"/"Investor-Ready" bands — defined thresholds, documented not arbitrary) → 8-factor horizontal bar breakdown, each bar clickable to expand its specific improvement suggestion → "Weak areas" summary card pinned above the fold if any factor is below threshold → version history (score is versioned per Master Spec §22 — a founder should be able to see score improve over time as a line chart).

**AI Improvement Suggestions**
- *Layout:* Card list, one per weak factor, each with: factor name, current score, the specific rule-based suggestion text, and a direct link to the relevant Business Profile edit section — closing the loop from insight to action in one click.

### 7.3 Investor Screens

**Dashboard, Profile, Discover Startups, Connections** — pattern-driven per §6.

**Investment Preferences**
- *Layout:* Form mirroring the Discovery filter facets exactly (industry, stage, funding range, risk, location, involvement) plus an explicit toggle for **Reverse Investment Discovery** ("Publish my preferences so founders can approach me") with a preview of how the published card will look to founders.

**Saved Opportunities**
- *Layout:* Same card-grid as Discovery, filtered to saved items only; supports the same list/grid toggle and Match Score chips.

**Portfolio / Progress Dashboard**
- *Layout:* Summary stat row (Total Simulated Committed, Active Deals, Completed Deals, Avg Match Score of portfolio) → table of all deals (business, stage, amount, milestone progress mini-bar, last update) → aggregate milestone funding chart (stacked bar across all active deals, simulated values clearly labeled "Simulated" in a persistent small tag, never presented as real capital).

### 7.4 Professional Screens

**Dashboard, Profile, Discover Startups, Connections** — pattern-driven per §6.

**Skills/Experience Editor**
- *Layout:* Structured multi-field editor (not free-text resume upload for MVP scoring purposes) — skill tags with proficiency level, experience entries (structured: role, duration, industry), availability (hours/week, start date), compensation preference (salary/equity/hybrid + range). Each field maps to a Matching Engine criterion, same transparency-tagging approach as Business Creation.

**Applications Tracker**
- *Layout:* Uses §6.5 pattern with Application-specific statuses (Applied, Under Review, Interview/Negotiation, Offer, Joined, Declined) shown as a horizontal status stepper per row.

**Negotiation Panel**
- *Layout:* Split view — left: structured terms being negotiated (compensation, equity %, start date, role scope) shown as an editable comparison table (current offer vs counter-offer, versioned), right: Deal Room chat/thread. Every counter-offer creates a new versioned row rather than overwriting, preserving negotiation history for the audit trail.

### 7.5 Cross-Role Shared Screens

**Match Score Detail** — full spec in §8.

**Staged Disclosure Content View** — the content pane within a Business Profile / Deal Room that renders whatever is unlocked for the current relationship. Not a separate route; a rendering mode applied wherever business content appears, driven by the relationship's current stage (server-determined, never client-side gated only).

**NDA Flow**
- *Layout:* Modal/full-screen step: NDA document preview (scrollable, must scroll-to-bottom before enabling accept per standard consent UX), explicit dual acceptance status shown ("Waiting on [Counterparty]" state if only one party has signed), timestamped confirmation screen on completion (uses the Confirmation State pattern from §2.5), which then triggers Stage 3 unlock and typically Deal Room creation.

**Deal Room** — full spec in §9.

**Milestone Tracking View**
- *Layout:* Embedded within Deal Room and also surfaced standalone (Founder: within Business Profile; Investor: within Portfolio). Horizontal milestone timeline (stepper with amounts, per Master Spec §14.2 example) — each milestone node shows status (Pending/In Progress/Completed/Disputed via status indicator dots), amount, and expands to show progress-update entries (founder-submitted notes/evidence + investor acknowledgment). "Mark Complete" action available to founder, requiring investor confirmation (two-step, both logged) before the node visually completes and unlocks the next milestone — never a single-party unilateral completion.

**Reputation Detail**
- *Layout:* Overall reputation summary (not a bare number — a qualitative tier + trend arrow) → contributing-factor breakdown (identity verification, completed deals, feedback, milestone history — role-specific per Master Spec §16) → chronological history of reputation-affecting events, each explicitly labeled with cause ("+ Completed milestone with [Investor]," "+ Verified Tier 1") — same explainability principle as AI scores, because reputation is a trust signal and must earn trust by being legible.

### 7.6 Admin Screens

**Admin Dashboard**
- *Layout:* Platform health stat row (New Users 7d, Pending Verifications, Open Reports, Active Deals, Businesses Published) → Verification Queue preview (oldest-waiting first) → Reports/Disputes preview (by severity) → Recent Audit Log tail.

**Users, Businesses, Applications, Teams, Deals, Reports, Reputation, Audit Logs** — all use §6.6 pattern with the differentiated columns/actions table already specified there. No further screen-by-screen spec needed (duplication avoided per the platform's own design principle).

**Verification Queue (review workspace)**
- *Layout:* Differs from the standard admin table in one way: the detail drawer becomes a full review workspace (side-by-side: submitted ID/document images with zoom, applicant's existing profile info, prior verification history) with explicit Approve / Reject / Request More Info actions, each requiring a short reason note that is stored and surfaced to the applicant.

**Platform Analytics**
- *Layout:* Dashboard-style grid of charts: user growth by role, deal funnel (Matched → Completed conversion at each stage, exposing where drop-off happens), Readiness Score distribution, Match Score distribution, simulated commission revenue over time. Every chart has a date-range control and CSV export.

**Settings**
- *Layout:* Tabbed: Platform (feature flags, simulation disclaimers text), Matching Engine Weights (read-only display of current documented weights per Master Spec §9 — editing, if permitted at all, requires an explicit "this changes live scoring platform-wide" warning modal, since weights must remain "visible/auditable" per spec), Notification templates, Admin team/roles.

---

## 8. AI Visualization Patterns (Explainable AI UX)

This is the platform's core differentiator and gets a dedicated, non-negotiable pattern used identically everywhere a score appears.

**The rule, restated as a UI law:** *No score is ever displayed without its breakdown being one interaction away.* A bare "94%" chip is not permitted anywhere in the product.

**Compact form (chip):** score number + radial ring (thin, semantic-cyan for AI scores) + label ("Match" or "Readiness"), always tappable/clickable, always shows a tooltip on hover with the top 1–2 contributing factors as a preview before the user even opens the full view.

**Full form (detail card/page), used identically for both Match Score and Readiness Score):**
1. Header: large radial gauge (0–100), qualitative band label, and — for Match Score — both parties' names/avatars either side of the gauge to make clear it's a pairwise score, not a unilateral rating.
2. Formula transparency line: a plain-language restatement of the weighting logic ("Calculated from 6 weighted factors"), with a small "How is this calculated?" link opening a static explainer (the actual formula from Master Spec §9, in accessible language, not raw math for average users but available for power users who want it).
3. Factor breakdown: horizontal bar chart, one bar per factor, each bar labeled with the factor name, its weight (%), its individual score, and a one-line plain-language explanation (e.g., "Industry Match — 90%: both selected FinTech as primary industry"). Factors sorted by weight (highest first), not alphabetically — surfaces what matters most.
4. For Readiness Score specifically: factors below threshold get a distinct visual treatment (warning-color left border on that bar) and link directly to the relevant Improvement Suggestion.
5. Never uses gamified reveal mechanics (no counting-up animation with suspense, no confetti, no "unlocking" sound-adjacent effects) — the score is information, presented immediately and fully, consistent with the platform's composed brand attribute.

**"Incomplete data" state:** per Master Spec §23 business rule, when inputs are missing a factor defaults to a documented neutral/low value — this must be visibly flagged in the breakdown (a small "Incomplete" tag on that specific factor bar, not silently baked into the number), so users never mistake a low score for entirely poor performance when it's actually missing data.

---

## 9. Trust & Security UX

**Verification badges:** solid gold, shield icon + tier label always shown together (never icon-only — accessibility and unambiguous meaning). Tier 0 shows *no* badge (absence is itself informative, not a "grey badge" that implies false parity with verified tiers). Tooltip on hover explains what that tier required.

**Staged Disclosure visualization:** a persistent 4-segment horizontal indicator (Teaser · Extended · NDA · Full Proposal) shown at the top of any gated content view, current stage highlighted, completed stages checked, future stages shown locked with a one-line trigger description ("Unlocks after NDA signed"). This same component appears in Business Profile (public view), Deal Room header, and Connection detail drawer — one component, reused, per the density/no-duplication mandate.

**Document access states:** every document row shows: name, an access-scope tag (Public / Stage 2 / Stage 3 (NDA) / Stage 4), and — if the current viewer lacks access — a locked row style (reduced opacity, lock icon, no click-through) rather than being hidden from the list, again reinforcing "there is more here once trust is established" rather than appearing incomplete.

**Audit information:** not a user-facing feature for Founders/Investors/Professionals beyond a lightweight "Viewed by [X] on [date]" line under sensitive documents they own (transparency without exposing full admin-grade logs); full audit trail detail is Admin-only (§7.6, §6.6).

**Privacy/security indicators:** a small persistent lock/HTTPS-style indicator plus "Simulation" tag wherever financial figures appear (milestone amounts, portfolio value, commission) — this dual-labeling (secure + simulated) is a direct UX implementation of Master Spec §29's legal boundary requirement and must never be visually de-emphasized or hidden in a tooltip only.

---

## 10. Deal Room UX (full lifecycle)

One screen, state-driven by the current Deal Status (Master Spec §14.1). A persistent **stepper header** shows all 8 states (Matched → Interest Confirmed → Deal Room Opened → NDA Signed → Negotiation → Agreement → Milestone Funding Active → Completed), current state highlighted, completed states checked — giving both parties constant shared orientation, which directly serves the "scattered across email/chat/spreadsheets" problem the Master Spec identifies as the core pain point being solved.

**Layout below the stepper:** three-pane — left: participant summary (both parties' profiles, verification badges, Match Score chip), center: primary workspace (tabbed: Overview, Documents, Chat, Negotiation Terms, Milestones — tab set adapts to current state, e.g., Milestones tab only appears once Agreement is reached), right: activity/audit-lite log (chronological, "NDA signed by [X]," "Milestone 2 marked complete").

**State-specific center content:**
- *Matched / Interest Confirmed:* lightweight — mostly the invitation to proceed, NDA CTA.
- *NDA Signed:* Documents tab unlocks Stage 3/4 content per §9.
- *Negotiation:* Negotiation Terms tab active by default (structured comparison table, per §7.4 negotiation pattern, generalized here for investment terms too — investment amount, equity %, milestone structure proposal).
- *Agreement:* read-only finalized terms + signed agreement document, both parties' confirmation timestamps.
- *Milestone Funding Active:* Milestones tab becomes primary (uses §7.5 Milestone Tracking View pattern embedded).
- *Completed:* Deal Room becomes read-only/archived, prominently shows final outcome summary and prompts both parties for reputation-affecting feedback if not already given.

**Retention nudge:** a small, non-intrusive banner at Deal Room entry and again at NDA stage (per Master Spec §15.2) stating the concrete value of staying on-platform (verified history, milestone protection, dispute support) — styled as an informational Alert component, never a modal interruption, and dismissible.

---

## 11. Responsive Strategy

| Breakpoint | Range | Key adaptations |
|---|---|---|
| Mobile | <768px | Bottom tab nav; single-column stacked layouts everywhere; Discovery filters move to a full-screen drawer; tables convert to stacked card rows (each row's columns become labeled key-value pairs) rather than horizontal scroll; Deal Room three-pane collapses to tabs (Overview/Documents/Chat/Terms/Milestones as a single tab bar, participant summary moves into an expandable header). |
| Tablet | 768–1023px | Sidebar collapses to icon-only by default (expandable); Discovery keeps 2-column card grid; Admin tables remain tables but drop lower-priority columns (defined per table, e.g., Users table drops "joined date" at this width, recoverable via a column-config control). |
| Desktop | ≥1024px | Full layout as specified throughout §6–§10. |
| Large desktop | ≥1440px | Content max-width caps (per §2.3); extra width becomes margin, never stretched components — data density stays constant rather than components ballooning. |

General rule: information hierarchy is preserved across breakpoints (nothing critical is ever hidden on mobile, only re-flowed), consistent with "Responsive design > desktop-only design" from the product principles.

---

## 12. Accessibility Requirements

- Target **WCAG 2.1 AA** across the product.
- Minimum contrast 4.5:1 for body text, 3:1 for large text/UI components against both dark and light theme backgrounds — the navy/cyan palette in §2.1 has been chosen to hold this ratio; any additional accent colors introduced later must be checked against both themes before use.
- All interactive elements keyboard-navigable in logical tab order; visible focus ring (2px cyan) on every focusable element, never removed via CSS.
- All icon-only controls require `aria-label`; all form inputs require associated `<label>` elements (never placeholder-only labeling, per §2.5).
- Charts and score gauges require a text-equivalent (the factor breakdown table/list *is* this equivalent, and must always render alongside — not only inside — the visual chart).
- Color is never the sole differentiator of meaning: status badges pair color with an icon and a text label (e.g., not a red dot alone for "Disputed" — always red dot + "Disputed" text).
- Motion: respect `prefers-reduced-motion`; no auto-playing animations on score reveals or dashboard widgets beyond subtle, disable-able transitions.
- Modals trap focus and are dismissible via Escape; drawers behave identically.
- Form validation errors are announced to screen readers (`aria-live` regions) in addition to visual inline messaging.

---

## 13. UX Anti-Patterns to Avoid

- Bare percentage/score displays without an explainability path (violates the core AI UX law in §8).
- Infinite-scroll social-feed patterns for Discovery — use paginated or "Load more" results so users retain a sense of a bounded, curated result set appropriate to a diligence tool, not a feed to scroll mindlessly.
- Gamified/confetti reveal of financial or trust scores.
- Hiding locked/gated content entirely rather than showing a locked state (undermines the value of the trust pipeline the whole product is built around).
- Mixing Search Results and AI Suggestions in a single undifferentiated list (explicit Master Spec §8 violation).
- Oversized hero cards and marketing-style whitespace inside authenticated, data-dense screens (Dashboard, Discovery, Admin tables) — reserve generous whitespace for the public marketing site only.
- Using the gold trust color decoratively anywhere outside verification badges.
- Presenting simulated financial figures without a persistent "Simulated" indicator.
- Overloading a single dashboard with every possible widget "to look complete" — each dashboard module must map to an action the user actually needs to take next.
- Redundant confirmation modals for low-stakes, reversible actions (adds friction without protecting anything meaningful) — reserve heavy confirmation UX for genuinely irreversible actions (NDA signing, milestone completion, permanent rejection).
- Inconsistent table/list patterns per screen — every list of entities must resolve to one of the patterns in §6, never a bespoke one-off layout.

---

## 14. Final Design Principles

1. **Explainability is a UI requirement, not a nice-to-have.** Every AI-derived number ships with its breakdown in the same interaction.
2. **Density before decoration.** Default to tables, dense lists, and compact cards; whitespace is earned, not default, on any authenticated screen.
3. **One pattern, many contexts.** New screens should default to reusing §6's patterns; a bespoke layout requires a specific reason it can't fit an existing pattern.
4. **Trust is visualized, not just described.** Verification, staged disclosure, and NDA state must always be visible in-context (headers, chips, locked-section states) — never buried in a settings page.
5. **Simulation is always labeled.** Any financial figure carries a persistent, unmissable "Simulated" indicator, protecting both users and the platform's legal boundary.
6. **Color carries meaning, not mood.** Cyan = AI-originated, Gold = verification/trust, semantic colors = status only. No decorative color use.
7. **Consistency across roles over role-specific novelty.** Founder, Investor, Professional, and Admin experiences share one navigation shell, one component system, and one visual language — differentiation happens in content and data, not in bespoke UI per role.
8. **Progressive disclosure mirrors the product's own trust model.** Just as business information unlocks in stages, UI complexity should reveal itself progressively (summary → detail → full breakdown) rather than front-loading everything at once.
