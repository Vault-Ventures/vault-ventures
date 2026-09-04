Perform a FINAL QA, CONSISTENCY, AND REGRESSION AUDIT of the entire Vault Ventures prototype.

IMPORTANT:
This is NOT a new feature-development prompt.
Do not invent, redesign, refactor, rename, or add new product functionality.

Use the existing Vault Ventures prototype as the implementation baseline and verify it against the previously provided project specifications and all completed implementation prompts.

GOAL:
Make the existing prototype internally consistent, complete, and professionally polished after all previous phases.

AUDIT THE ENTIRE APPLICATION:

1. ROUTES & NAVIGATION
- Verify every existing route works and points to the correct workspace/page.
- Verify Founder, Investor, Professional, and Admin navigation are correctly separated.
- Admin must remain a completely separate privileged workspace.
- Remove any remaining normal-user Admin toggle, Admin switcher, or Admin navigation exposure.
- Check for broken, duplicate, placeholder, or incorrectly routed pages.
- Do not invent new routes.

2. ROLE & ACCESS CONSISTENCY
- Founder UI must only expose Founder-relevant functionality.
- Investor UI must only expose Investor-relevant functionality.
- Professional UI must only expose Professional-relevant functionality.
- Admin UI must remain separate.
- Verify unauthorized states where they already exist.
- Do not create a new authentication system.

3. VISUAL SYSTEM
Verify the entire application consistently follows Direction G — Charcoal + Copper.

Dark:
- Background: #111213
- Surface: #1A1C1D
- Raised surface: #212324
- Primary text: #F0EEEC
- Secondary text: #918D88
- Copper dark: #7A4527
- Copper: #C67A4E
- Warm copper: #E8A878
- Copper gradient: linear-gradient(135deg,#7A4527,#C67A4E,#E8A878)

Light:
- Canvas: #F7F4EC
- Surface: #FFFFFF
- Raised: #FAF9F7
- Primary text: #1B1A19
- Secondary text: #7B7773
- Copper light: #B06736
- Copper gradient: linear-gradient(135deg,#7A4527,#B06736)

Semantic colors remain:
- Trust/verification: #C9A24B
- Success: #22C55E
- Warning: #F59E0B
- Danger: #F04438
- Info: #3B82F6

Remove any accidental cyan/blue treatment being used as the primary Vault Ventures brand accent.

Do NOT remove semantic blue if it is genuinely being used for informational status.

4. TYPOGRAPHY & SIZING
- Verify typography is consistent across all pages.
- Ensure text is professionally readable at normal desktop viewing size.
- Avoid tiny dashboard text.
- Avoid oversized headings/cards.
- Maintain the previously established dense, professional SaaS information hierarchy.
- Keep spacing consistent.
- Preserve the existing professional layout.

5. COMPONENT CONSISTENCY
Audit:
- buttons
- inputs
- selects
- tabs
- cards
- tables
- badges
- modals
- dropdowns
- navigation
- empty states
- loading states
- error states
- confirmation states

Ensure equivalent components look and behave consistently throughout the application.

6. PRODUCT LOGIC CONSISTENCY
Verify the previously implemented flows remain consistent with the specifications:

- Profiles and verification
- Business creation and publishing
- Search/filter/discovery
- AI analysis/readiness/matching/recommendations
- Staged disclosure
- NDA gating
- Interest
- Applications
- Connections
- Deal Rooms
- Negotiation
- Agreement
- Simulated investment
- Milestones
- Profit/Loss
- Reputation
- Admin governance

Do NOT introduce new functionality.

7. SECURITY / ACCESS RULES
Verify that the UI does not visually imply that users can:
- bypass NDA requirements
- skip disclosure stages
- access Stage 4 documents without required conditions
- perform real financial transactions
- perform real equity settlement
- use brokerage/payment/escrow functionality
- bypass role permissions

Preserve the existing staged-access and document-permission model.

8. AI BOUNDARIES
Verify AI-related UI does not make unsupported claims.

AI should remain explainable/deterministic for the MVP.
Do not introduce fake/random AI scores.
Do not imply deep-learning or production ML functionality where it is not specified.

Copper may be used as the brand/interaction accent, but do not automatically treat every Copper element as AI-generated.

9. FINANCIAL LANGUAGE
Verify all investment/funding amounts use BDT where applicable.

Ensure the prototype does not imply real money movement.

Where Profit/Loss is shown:
Net Profit/Loss = Revenue − Expenses.

Do not invent guaranteed returns, guaranteed profits, payment processing, escrow, custody, or real equity settlement.

10. RESPONSIVE & LAYOUT QA
Check desktop, tablet, and mobile layouts.

Fix only genuine:
- overflow
- clipping
- broken alignment
- unreadable text
- overlapping components
- unusable controls
- inconsistent spacing

Do not redesign layouts simply for aesthetic preference.

11. PLACEHOLDER / INCOMPLETE UI AUDIT
Find obvious unfinished placeholders, broken empty areas, inconsistent dummy labels, accidental demo controls, or incomplete states.

Only fix items that are clearly inconsistent with the already-defined product.

Do not fabricate data or functionality to make a screen appear complete.

12. REGRESSION CHECK
Most importantly:
Do not break anything that was already working.

Do not:
- redesign existing pages
- change information architecture
- rename components/routes
- change business logic unnecessarily
- remove implemented features
- replace the established visual language
- introduce new dependencies without necessity

FINAL RULE:
This is a cleanup and verification pass only.

Make only changes required to:
1. correct inconsistencies,
2. remove regressions,
3. fix broken UI,
4. enforce the already-approved specifications,
5. ensure the entire Vault Ventures prototype feels like one coherent product.

After completing the audit, verify the final prototype page-by-page and ensure no unrelated changes were introduced.