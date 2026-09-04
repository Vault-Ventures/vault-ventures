VAULT VENTURES — ADMIN BUSINESSES MANAGEMENT

IMPORTANT:

The following screens are already approved and MUST NOT be redesigned:

- Profile
- Discovery
- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Deal Room
- Admin Dashboard
- Admin Users
- Admin Verification Queue

Design/refine ONLY:

ADMIN → BUSINESSES

==================================================
1. PURPOSE
==================================================

Create a professional enterprise workspace for Admins to monitor and manage all businesses registered on Vault Ventures.

The Admin should be able to:

- Search businesses
- Filter businesses
- Review business information
- Check verification
- Inspect readiness
- Review founders
- Review status
- Identify flags
- Open detailed business information
- Flag or suspend businesses where appropriate
- Review business history

This is an operational control interface.

It must NOT look like the public business-discovery page.

==================================================
2. PAGE HEADER
==================================================

Title:

Businesses

Subtitle:

Manage registered businesses, verification, readiness and platform status.

Show compact summary indicators:

Total Businesses
Active
Pending Review
Flagged

Do NOT use oversized cards.

==================================================
3. SEARCH + FILTERS
==================================================

Create a professional toolbar.

Search:

Search business name...

Filters:

Industry
Stage
Verification
Status
Readiness
Risk / Flags
Created Date

Sort:

Newest
Oldest
Readiness
Funding Ask

Include:

Clear Filters

Keep the toolbar compact.

==================================================
4. BUSINESS TABLE
==================================================

Create a dense professional table.

Columns:

Business
Founder
Industry
Stage
Funding Ask
Readiness
Verification
Status
Flags
Actions

Example:

NovaTech AI
Alex Morgan
FinTech
Seed
$600K
78
Tier 1
Active
0
[View]

Do NOT make rows excessively tall.

==================================================
5. BUSINESS IDENTITY
==================================================

Each business row should clearly show:

Business logo / mark
Business name
Short description where appropriate

Founder:

Alex Morgan

Do not overload the table with unnecessary description text.

Use the detail view for deeper information.

==================================================
6. VERIFICATION
==================================================

Show:

Unverified
Tier 1
Tier 2

Use the existing Vault Ventures verification system.

Gold = verification/trust only.

Do NOT use gold decoratively.

==================================================
7. READINESS
==================================================

Readiness should be displayed compactly.

Example:

78

with a subtle progress indicator.

Use cyan for AI-related readiness information.

Do NOT use oversized circular gauges inside the table.

Clicking the readiness value can open detailed readiness information.

==================================================
8. STATUS
==================================================

Use:

Active
Pending
Under Review
Suspended
Restricted

Use semantic indicators.

Never rely on color alone.

==================================================
9. FLAGS / RISK
==================================================

Show relevant flags.

Example:

⚠ 2 flags

If none:

0

If a serious issue exists, communicate severity clearly:

Low
Medium
High
Critical

Do not create arbitrary risk scores.

==================================================
10. BUSINESS DETAIL DRAWER
==================================================

Clicking [View] should open a professional Admin Business Detail Drawer.

The Admin should be able to understand the business without losing the table context.

Structure:

BUSINESS HEADER

Logo
Business name
Industry
Stage
Status
Verification

FOUNDER

Founder name
Founder role
Profile link

OVERVIEW

Description
Industry
Stage
Location
Founded date

FUNDING

Funding Ask
Current funding stage
Relevant funding information

READINESS

Overall Readiness
Relevant factors
Incomplete information

TEAM

Team members
Roles

ACTIVITY

Recent activity

FLAGS / REPORTS

Current flags
Related reports

AUDIT HISTORY

Recent administrative actions

==================================================
11. BUSINESS ACTIONS
==================================================

Available actions should depend on state.

Possible actions:

View Business
View Founder
Review Verification
Flag Business
Suspend Business
Restore Business
View Audit History

Do not show every action as a primary button.

Use an overflow menu for secondary actions.

==================================================
12. FLAG BUSINESS
==================================================

If Admin selects:

Flag Business

Open a compact dialog.

Require:

Reason
Severity

Severity:

Low
Medium
High
Critical

Optional:

Admin notes

Primary:

[Flag Business]

Secondary:

[Cancel]

==================================================
13. SUSPEND BUSINESS
==================================================

If Admin selects:

Suspend Business

Require confirmation.

Show:

Business name
Current status
Reason

Explain the effect:

"This business will no longer appear in normal discovery until restored."

Require explicit confirmation.

Do NOT allow accidental suspension.

==================================================
14. RESTORE BUSINESS
==================================================

For suspended businesses:

[Restore Business]

Show a concise confirmation.

After confirmation:

Status → Active

Record the action in audit history.

==================================================
15. FOUNDER RELATIONSHIP
==================================================

The business must clearly connect to its Founder account.

Clicking Founder should conceptually navigate to:

Admin → Users → User Detail

Do NOT duplicate the full user management interface inside Businesses.

==================================================
16. MULTI-ROLE FOUNDER
==================================================

A Founder may also have:

Investor
Professional

roles.

The Business should still belong to the same unified user account.

Do not create separate founder accounts.

Display:

Alex Morgan
Founder · Investor · Professional

only where role context is useful.

==================================================
17. SEARCH / FILTER STATES
==================================================

Design:

Normal results
Filtered results
No results
Loading
Error

Empty state:

"No businesses found."

Supporting text:

"Try adjusting your search or filters."

[Clear Filters]

==================================================
18. BULK SELECTION
==================================================

Allow selecting multiple businesses.

Safe bulk actions may include:

Export Selected
Review Selected

Do NOT introduce bulk suspension or destructive actions unless explicitly required.

==================================================
19. RESPONSIVE WEB
==================================================

Desktop:

Dense table + detail drawer.

Tablet:

Reduced columns + expandable details.

Mobile:

Businesses become structured cards/rows.

Show:

Business
Founder
Stage
Readiness
Verification
Status
Primary action

Filters become a drawer.

Business detail becomes a full-screen panel.

Do NOT create page-level horizontal overflow.

==================================================
20. SECURITY / PRIVACY
==================================================

Do NOT expose:

Passwords
Authentication secrets
Admin credentials

Only display information required for business administration.

==================================================
21. AUDITABILITY
==================================================

Administrative actions must be visibly auditable.

For:

Flag
Suspend
Restore
Verification actions

record:

Admin
Action
Timestamp
Reason where applicable

Provide:

[View Audit History]

Connect conceptually to the existing Admin Audit Logs.

==================================================
22. VISUAL QUALITY
==================================================

The Businesses workspace should feel:

Enterprise-grade
Precise
Operational
Information-dense
Trustworthy

Avoid:

- Giant cards
- Excessive whitespace
- Decorative graphics
- Social-media-style business cards
- Generic SaaS dashboard appearance

Use:

Tables
Filters
Detail drawers
Structured information
Compact controls

==================================================
23. PROTOTYPE FLOW
==================================================

Admin Dashboard
↓
Businesses
↓
Search / Filter
↓
Select Business
↓
Business Detail
↓
View Founder
↓
Review Verification
↓
View Audit History

Also:

Business Detail
↓
Flag Business
↓
Reason + Severity
↓
Confirm
↓
Flagged

And:

Business Detail
↓
Suspend
↓
Confirm
↓
Suspended

And:

Suspended Business
↓
Restore
↓
Confirm
↓
Active

==================================================
24. FINAL QUALITY CHECK
==================================================

✓ Businesses are easy to search
✓ Filters are usable
✓ Founder relationship is clear
✓ Multi-role accounts are handled correctly
✓ Funding Ask is readable
✓ Readiness is clear
✓ Verification is clear
✓ Status is clear
✓ Flags are visible
✓ Detail drawer is comprehensive
✓ Admin actions are controlled
✓ Dangerous actions require confirmation
✓ Auditability exists
✓ Responsive web works
✓ No page-level horizontal overflow
✓ Existing Admin screens remain unchanged
✓ Premium enterprise Admin feel

ONLY design/refine:

ADMIN → BUSINESSES