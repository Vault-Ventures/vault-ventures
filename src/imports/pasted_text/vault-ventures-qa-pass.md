VAULT VENTURES — FINAL WEB PLATFORM UX / FLOW QA PASS

IMPORTANT:

This is the FINAL CONSISTENCY, UX, RESPONSIVENESS AND FLOW QA PASS.

DO NOT redesign the product from scratch.

DO NOT introduce new features.

DO NOT change approved information architecture.

DO NOT rename existing pages, roles, features or navigation items.

Only identify and fix inconsistencies, broken flows, layout problems and UX issues across the already-designed Vault Ventures web platform.

==================================================
1. PLATFORM TYPE
==================================================

Vault Ventures is a RESPONSIVE WEB PLATFORM.

This is NOT a mobile app.

Design must work as a premium desktop-first web platform while remaining fully usable on tablet and mobile web.

==================================================
2. APPROVED CORE AREAS
==================================================

Review the complete existing platform:

AUTHENTICATION

- Sign In
- Sign Up
- Forgot Password
- Reset Password
- Email Verification
- Role Selection
- Multi-role Onboarding
- Profile Setup

NORMAL USER WORKSPACES

- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Discovery
- Profile
- Deal Room
- Applications
- Teams
- Other already-approved workspace pages

ADMIN

- Admin Login
- Admin Dashboard
- Users
- Verification Queue
- Businesses
- Applications
- Teams
- Deals
- Reputation
- Reports & Disputes
- Audit Logs
- Analytics
- Settings

==================================================
3. ACCOUNT MODEL QA
==================================================

Verify:

ONE normal email
=
ONE normal Vault Ventures account.

A normal account may contain:

Founder
Investor
Professional

in any combination.

Examples:

Founder

Founder + Investor

Founder + Professional

Investor + Professional

Founder + Investor + Professional

Do NOT create duplicate accounts.

Do NOT create separate profiles for each role.

==================================================
4. UNIFIED PROFILE QA
==================================================

Every normal workspace must open the SAME unified Profile.

Example:

Founder
→ Profile
→ Unified Profile

Investor
→ Profile
→ Same Unified Profile

Professional
→ Profile
→ Same Unified Profile

Verify that selected role information appears correctly.

Do NOT show empty role sections for unselected roles.

==================================================
5. ROLE SWITCHER QA
==================================================

Verify the Role Switcher:

Only appears for normal users.

Shows only selected roles.

Example:

Founder + Investor

Role Switcher:

✓ Founder
  Investor

NOT:

Founder
Investor
Professional
Admin

Admin must NEVER appear in the normal Role Switcher.

==================================================
6. ROLE SWITCHING QA
==================================================

When switching:

Founder
→ Investor

Only the workspace context changes.

Change:

Dashboard
Navigation
Role-specific content
Role-specific actions

Do NOT change:

Account
Email
Password
Identity
Avatar
Cover Photo
Unified Profile

Verify that no Founder-only content accidentally appears inside Investor workspace.

Verify that no Investor-only content accidentally appears inside Founder workspace.

==================================================
7. ADMIN ISOLATION QA
==================================================

Admin is completely separate.

Normal user:

Sign In
→ Normal Workspace

Admin:

Admin Login
→ Admin Console

Verify:

No Admin option inside normal role selection.

No Admin option inside normal Role Switcher.

No Admin navigation inside normal user workspace.

No normal-user navigation inside Admin Console.

==================================================
8. AUTHENTICATION QA
==================================================

Verify every authentication screen has:

Clear primary action
Clear Back navigation
Correct error state
Loading state
Success state where applicable

Check:

Sign In
↓
Forgot Password

Sign In
↓
Sign Up

Sign Up
↓
Role Selection

Role Selection
↓
Role Setup

Role Setup
↓
Unified Profile

No user should become trapped in any authentication or onboarding screen.

==================================================
9. BACK NAVIGATION QA
==================================================

Every relevant flow must support:

← Back

Verify:

Sign In
Sign Up
Forgot Password
Reset Password
Email Verification
Role Selection
Founder Setup
Investor Setup
Professional Setup
Profile Setup

No broken loops.

No dead-end screens.

No missing navigation.

==================================================
10. GLOBAL HEADER QA
==================================================

Verify consistency across normal user pages:

Vault Ventures branding
Global Search where applicable
Notifications
Role Switcher
Profile Avatar

Ensure:

Same height
Same spacing
Same typography
Same interaction style

Do not create multiple visually different headers unnecessarily.

==================================================
11. GLOBAL SIDEBAR QA
==================================================

Verify:

Consistent width
Consistent spacing
Consistent active state
Consistent icon treatment
Consistent typography

Founder navigation:

Founder-specific.

Investor navigation:

Investor-specific.

Professional navigation:

Professional-specific.

Admin navigation:

Completely separate.

==================================================
12. RESPONSIVE WEB QA
==================================================

Test conceptually at:

1440px
1280px
1024px
768px
390px

At every width:

✓ No page-level horizontal overflow
✓ No content hidden behind sidebar
✓ No clipped text
✓ No clipped buttons
✓ No broken cards
✓ No broken tables
✓ No overlapping headers
✓ No inaccessible controls
✓ No accidental fixed-width containers

==================================================
13. DESKTOP BEHAVIOR
==================================================

Desktop should prioritize:

Information density
Clear hierarchy
Efficient navigation
Professional workspace usage

Do NOT make everything oversized.

Avoid:

Huge cards
Huge headings
Excessive whitespace

==================================================
14. TABLET BEHAVIOR
==================================================

At tablet widths:

Sidebar may collapse.

Secondary panels may become:

Drawer
Collapsible panel
Stacked section

Tables may reduce secondary columns.

Do NOT squeeze every desktop element into the same horizontal layout.

==================================================
15. MOBILE WEB BEHAVIOR
==================================================

At mobile width:

Use:

Single-column layouts
Compact header
Mobile navigation
Drawers
Stacked cards
Full-width forms

Tables should transform into readable structured rows/cards.

Do NOT simply shrink desktop tables.

==================================================
16. DEAL ROOM QA
==================================================

Verify the previously fixed Deal Room.

Check:

Lifecycle
Business summary
Participants
NDA
Agreement
Milestones
Activity
Actions

Nothing should:

- Hide behind sidebar
- Become clipped
- Cause page-level horizontal scrolling

If a horizontal lifecycle cannot fit:

Use contained scrolling or responsive stacking.

Do NOT redesign the Deal Room.

==================================================
17. PROFILE QA
==================================================

Verify the approved Profile.

Profile should support:

Profile photo
Cover photo
Name
Headline
Bio
Location
Roles
Role-specific information
Verification
Skills
Experience
Relevant sections

If user has multiple roles:

Show all selected roles.

Do NOT duplicate profile information.

==================================================
18. DISCOVERY QA
==================================================

Verify Discovery remains focused on:

Finding opportunities
Businesses
Projects
Relevant matches

Do NOT accidentally mix Admin controls into Discovery.

Do NOT turn Discovery into an Admin interface.

==================================================
19. DASHBOARD QA
==================================================

Verify:

Founder Dashboard

Investor Dashboard

Professional Dashboard

Each should answer the needs of its active role.

Do NOT mix role-specific information unnecessarily.

All dashboards must use the same Vault Ventures design language.

==================================================
20. ADMIN QA
==================================================

Verify all Admin screens use the same Admin shell:

Dashboard
Users
Verification
Businesses
Applications
Teams
Deals
Reputation
Reports
Audit Logs
Analytics
Settings

Check:

Consistent sidebar
Consistent header
Consistent tables
Consistent drawers
Consistent filters
Consistent confirmation dialogs

==================================================
21. DATA CONSISTENCY
==================================================

Where the same entity appears across screens:

User
Business
Application
Team
Deal
Report

use consistent:

Name
Status
Role
Verification
Identifiers

Do NOT show contradictory states across different screens.

==================================================
22. STATUS CONSISTENCY
==================================================

Use consistent status terminology.

Applications:

Submitted
Under Review
Accepted
Rejected
Withdrawn

Deals:

Matched
Interest Confirmed
Deal Room
NDA Signed
Negotiation
Agreement
Milestone Funding Active
Completed

Verification:

Unverified
Tier 1
Tier 2

Reports:

Open
Under Review
Awaiting Information
Escalated
Resolved
Dismissed

Do NOT randomly rename these states.

==================================================
23. BUTTON CONSISTENCY
==================================================

Primary actions should look consistent.

Examples:

View
Review
Continue
Save
Submit
Approve
Reject
Cancel
Back

Avoid multiple visual styles for the same action.

==================================================
24. MODAL / DRAWER QA
==================================================

Verify:

Drawers open from correct side.

Modals are centered.

Both have:

Clear title
Clear action
Cancel / close
Readable content

Do NOT stack unnecessary modals.

High-impact actions require confirmation.

==================================================
25. EMPTY STATES
==================================================

Every major data-driven page should have a useful empty state.

Examples:

No applications
No recommendations
No teams
No deals
No reports
No verification requests

Each should explain:

What is empty
Why it may be empty
What the user can do next where appropriate

==================================================
26. LOADING STATES
==================================================

Use skeleton loading for major content.

Avoid unnecessary full-page spinners.

Skeleton structure should resemble the actual content.

==================================================
27. ERROR STATES
==================================================

Create consistent error treatment.

Example:

"Something went wrong."

Supporting explanation.

Primary:

[Retry]

Do NOT expose technical stack traces.

==================================================
28. ACCESSIBILITY QA
==================================================

Verify:

Readable text
Clear contrast
Visible focus states
Keyboard-accessible controls
Meaningful button labels
No color-only status communication
Accessible form labels

Do not sacrifice usability for visual styling.

==================================================
29. VISUAL CONSISTENCY
==================================================

Across the entire platform verify:

Typography
Spacing
Border radius
Borders
Shadows
Icons
Buttons
Inputs
Tabs
Tables
Cards
Drawers
Modals
Status indicators

Everything should feel like ONE product.

==================================================
30. PREMIUM DESIGN STANDARD
==================================================

The final product should feel:

Premium
Professional
Modern
Trustworthy
Enterprise-grade
Information-first
Compact
Intelligent

Avoid:

- Generic AI dashboard appearance
- Generic SaaS templates
- Excessive glassmorphism
- Excessive gradients
- Giant cards
- Giant typography
- Excessive badges
- Unnecessary animations
- Decorative elements without purpose

==================================================
31. INFORMATION HIERARCHY
==================================================

Every page must have:

ONE clear primary objective.

Primary information:

Most visible.

Secondary information:

Supporting context.

Tertiary information:

Available without competing for attention.

Do NOT make every component visually equally important.

==================================================
32. FINAL USER JOURNEY QA
==================================================

Test these conceptual journeys:

NEW USER:

Sign Up
→ Role Selection
→ Profile Setup
→ Dashboard
→ Discovery
→ Profile

MULTI-ROLE USER:

Sign In
→ Founder Workspace
→ Role Switcher
→ Investor Workspace
→ Role Switcher
→ Professional Workspace
→ Unified Profile

FOUNDER:

Founder Dashboard
→ Discovery
→ Application / Opportunity
→ Team
→ Deal Room

INVESTOR:

Investor Dashboard
→ Discovery
→ Opportunity
→ Deal Room
→ Active Deal

PROFESSIONAL:

Professional Dashboard
→ Recommended Opportunity
→ Application
→ Deal Room

ADMIN:

Admin Login
→ Admin Dashboard
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

==================================================
33. FINAL RULE
==================================================

DO NOT redesign working screens simply because they can look different.

Only fix:

- Broken navigation
- Inconsistent behavior
- Responsive problems
- Overflow
- Missing states
- Role confusion
- Duplicate information
- Inconsistent components
- Broken flows
- Visual inconsistencies

Preserve all approved design decisions.

==================================================
FINAL OBJECTIVE
==================================================

Make Vault Ventures feel like ONE cohesive, production-quality, premium web platform.

Every page should feel connected.

Every role should feel intentional.

Every navigation path should make sense.

Every responsive breakpoint should remain usable.

Every important action should be discoverable.

Do NOT add new features.

Do NOT change the product concept.

ONLY perform the FINAL WEB UX / FLOW / RESPONSIVE / CONSISTENCY QA PASS.