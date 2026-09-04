VAULT VENTURES — FINAL FULL PRODUCT DESIGN QA

IMPORTANT:

THIS IS THE FINAL DESIGN QA PASS.

Do NOT redesign the product.

Do NOT introduce a new visual style.

Do NOT add unrelated features.

Do NOT change approved layouts unnecessarily.

The goal is ONLY:

VERIFY
CONNECT
FIX
REFINE
POLISH

the complete Vault Ventures web design.

==================================================
1. SOURCE OF TRUTH
==================================================

Use:

1. Existing approved Figma design
2. Existing Vault Ventures visual system
3. Master Project Specification / PRD
4. All previously completed design prompts

The existing design is GOOD.

Preserve it.

Only fix genuine missing, broken or inconsistent elements.

==================================================
2. VISUAL CONSISTENCY
==================================================

Verify the ENTIRE product uses one consistent visual language.

MANDATORY:

- Dark atmospheric background
- Cyan → warm rose-gold dichroic gradient
- Premium glassmorphism
- Transparent glass surfaces
- Backdrop blur
- Subtle translucent borders
- Soft inner highlights
- Atmospheric glow
- Existing typography
- Existing spacing
- Existing component language

The reference visual system is mandatory.

Do NOT revert to the original Figma colors.

Do NOT introduce purple/default SaaS gradients.

==================================================
3. EXISTING DESIGN PROTECTION
==================================================

Do NOT unnecessarily change:

- Existing page layouts
- Existing navigation
- Existing dashboards
- Existing profiles
- Existing cards
- Existing tables
- Existing components
- Existing role structure
- Existing Admin structure

If something already works and looks good:

KEEP IT.

==================================================
4. PUBLIC EXPERIENCE
==================================================

Verify:

Landing Page
How It Works
Value Proposition
AI Capabilities
Trust & Security
Premium
FAQ
Public Navigation

Verify:

Public
→ Sign In
→ Sign Up
→ Authenticated Product

No broken public navigation.

==================================================
5. AUTHENTICATION
==================================================

Verify:

Sign In
Sign Up
Forgot Password
Role Selection
Back Navigation
Authentication States

Important:

Users must be able to return from authentication screens.

Do NOT allow dead-end pages.

==================================================
6. MULTI-ROLE SYSTEM
==================================================

Verify:

Founder
Investor
Professional

A single user may have multiple selected roles where supported.

All selected roles should appear appropriately in the user's Profile.

Role switching must NOT create separate unrelated accounts.

Admin remains completely separate.

==================================================
7. ADMIN ISOLATION
==================================================

Verify Admin is completely separate from normal user roles.

Admin Login
→ Admin Console

Normal users must NOT see Admin functionality.

Verify the existing Admin credentials/configuration remain represented only in the Admin context.

Do NOT expose Admin controls in normal user navigation.

==================================================
8. FOUNDER EXPERIENCE
==================================================

Verify:

Founder Dashboard
Business Creation
Business Profile
Business Management
Discovery
Match Score
Readiness Score
AI Improvements
Applications
Teams
Staged Disclosure
NDA
Milestones
Deal Room
Reputation

All required flows should connect logically.

==================================================
9. INVESTOR EXPERIENCE
==================================================

Verify:

Investor Dashboard
Investor Preferences
Reverse Discovery
Match Score
Business Profile
Saved Opportunities
Applications / Interest
Portfolio
Deal Room
Milestones
Reputation

Verify all major transitions.

==================================================
10. PROFESSIONAL EXPERIENCE
==================================================

Verify:

Professional Dashboard
Profile Editing
Skills
Experience
Discovery
Applications
Application Tracking
Negotiation
Deal Room
Milestones
Reputation

Verify all major transitions.

==================================================
11. AI MATCHING
==================================================

Verify:

Match Score
→ Explainability

User should understand:

Score
Why the score exists
Strong factors
Potential gaps

Do NOT create duplicate Match Score systems.

==================================================
12. READINESS
==================================================

Verify:

Readiness Score
→ Factor Breakdown
→ Areas to Improve
→ AI Suggestions

Do NOT invent a second Readiness Score methodology.

==================================================
13. STAGED DISCLOSURE
==================================================

Verify:

Stage 1
→ Public Information

Stage 2
→ Connection / Interest Information

Stage 3
→ NDA-Protected Information

Locked information must remain protected.

==================================================
14. NDA
==================================================

Verify:

NDA Required
→ Review
→ Accept
→ Waiting for Counterparty
→ Both Accepted
→ Stage 3 Unlocked

Do NOT unlock Stage 3 after only one-party acceptance.

==================================================
15. DEAL ROOM
==================================================

Verify the complete lifecycle:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding Active
→ Completed

Verify:

Chat
Documents
Negotiation
Milestones
Activity
Completion
Reputation

No broken transitions.

==================================================
16. NEGOTIATION
==================================================

Verify:

Current Proposal
→ Counter Offer
→ Proposal History
→ Accept / Decline
→ Accepted Terms
→ Agreement

Current proposal must always be obvious.

==================================================
17. MILESTONES
==================================================

Verify:

Upcoming
→ Active
→ Submitted
→ Awaiting Confirmation
→ Completed
→ Next Milestone

Where applicable:

Disputed

Founder submission must NOT automatically equal completion.

==================================================
18. BUSINESS PROFILE
==================================================

Verify Business Profile supports:

Overview
Team
Readiness
Funding
Milestones
Role-aware actions
Disclosure state

Owner and external viewer must see appropriate information.

==================================================
19. PREMIUM
==================================================

Verify:

Premium Overview
Feature Gating
Upgrade
Confirmation
Success
Already Premium state

Do NOT invent pricing or unsupported Premium functionality.

==================================================
20. ADMIN
==================================================

Verify existing Admin Console plus newly added:

Admin Team / Roles
Verification Review
Matching Oversight
Readiness Analytics
Match Analytics
Deal Analytics
Simulated Commission Analytics
Notification Templates

Admin actions must remain auditable.

==================================================
21. CROSS-ENTITY CONSISTENCY
==================================================

The same entity must remain consistent everywhere.

USER:

Name
Role(s)
Verification
Status

BUSINESS:

Name
Industry
Stage
Status

APPLICATION:

Applicant
Business
Status

DEAL:

Participants
Business
Stage

MILESTONE:

Name
Status
Progress

REPORT:

Entity
Severity
Status

Never show contradictory information.

==================================================
22. STATES
==================================================

Every major interaction should have appropriate:

Default
Hover
Active
Selected
Disabled
Loading
Empty
Error
Success
Locked
Restricted

Do NOT create excessive visual states.

==================================================
23. NAVIGATION
==================================================

Test:

Sidebar
Header
Breadcrumbs
Back
Close
Tabs
Drawers
Modals
CTAs

Every important action must lead somewhere logical.

No dead buttons.

No dead navigation.

No broken back navigation.

==================================================
24. RESPONSIVE WEB
==================================================

Verify:

1440px
1280px
1024px
768px
430px
390px
375px

Check:

Navigation
Cards
Tables
Forms
Charts
Drawers
Modals
Deal Room
Profiles
Business pages

No page-level horizontal overflow.

Do NOT redesign mobile independently.

Maintain the same product identity.

==================================================
25. INFORMATION DENSITY
==================================================

Maintain the project's design principles:

Density First
Information First
Professional First
Compact First
Whitespace First

Avoid:

Oversized cards
Huge headings
Unnecessary badges
Repeated information
Excessive empty space
Decorative UI without purpose

==================================================
26. ACCESSIBILITY / READABILITY
==================================================

Verify:

Text contrast
Button readability
Input readability
Status clarity
Focus states
Error readability

Do NOT sacrifice usability for glass effects.

==================================================
27. FINAL VISUAL POLISH
==================================================

Only make subtle refinements where needed:

Spacing
Alignment
Typography
Border consistency
Blur consistency
Gradient consistency
Glass opacity
Shadow depth
Icon alignment

Do NOT redesign anything.

==================================================
28. FINAL FLOW TEST
==================================================

Test these journeys:

PUBLIC:

Landing
→ Sign Up
→ Role Selection
→ Profile
→ Dashboard

FOUNDER:

Dashboard
→ Create Business
→ Business Profile
→ Discovery
→ Match
→ Connect
→ NDA
→ Deal Room
→ Milestone
→ Completion

INVESTOR:

Dashboard
→ Preferences
→ Discovery
→ Match
→ Save
→ Business
→ Interest
→ Deal Room
→ Portfolio

PROFESSIONAL:

Dashboard
→ Profile
→ Discovery
→ Apply
→ Application
→ Negotiation
→ Deal Room

ADMIN:

Admin Login
→ Dashboard
→ Users
→ Verification
→ Businesses
→ Applications
→ Teams
→ Deals
→ Reputation
→ Reports
→ Audit Logs
→ Analytics
→ Settings
→ Notifications

Every flow must remain logically connected.

==================================================
29. DO NOT ADD
==================================================

Do NOT add:

New roles
New business models
New AI systems
New financial systems
New payment gateways
New unsupported pages
New navigation
New visual styles
New lifecycle states

==================================================
30. FINAL COMPLETION CRITERIA
==================================================

The Figma project is considered COMPLETE only when:

✓ Public experience complete
✓ Authentication complete
✓ Multi-role experience complete
✓ Founder experience complete
✓ Investor experience complete
✓ Professional experience complete
✓ Admin experience complete
✓ Business Creation complete
✓ Business Profile complete
✓ Match Explainability complete
✓ Readiness + AI Suggestions complete
✓ Staged Disclosure complete
✓ NDA complete
✓ Milestone Tracking complete
✓ Negotiation complete
✓ Deal Room complete
✓ Saved Opportunities complete
✓ Investor Portfolio complete
✓ Professional Applications complete
✓ Premium experience complete
✓ Admin advanced controls complete
✓ Responsive web complete
✓ Empty/loading/error states complete
✓ Navigation connected
✓ No dead flows
✓ No contradictory states
✓ Visual system consistent everywhere

==================================================
FINAL RULE
==================================================

The existing Vault Ventures design is GOOD.

DO NOT redesign it.

DO NOT make it worse.

DO NOT change approved functionality.

Only fix what is genuinely missing, broken or inconsistent.

The final result must feel like ONE:

PREMIUM
PROFESSIONAL
DARK GLASS
DICHROIC
ENTERPRISE
WEB PLATFORM

with every required product flow represented in Figma.

THIS IS THE FINAL DESIGN QA PASS.