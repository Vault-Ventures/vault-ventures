VAULT VENTURES — ADMIN DEALS MANAGEMENT

IMPORTANT:

The following are already approved and MUST NOT be redesigned:

- Profile
- Discovery
- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Deal Room
- Admin Dashboard
- Admin Users
- Admin Verification Queue
- Admin Businesses
- Admin Applications
- Admin Teams

Design/refine ONLY:

ADMIN → DEALS

==================================================
1. PURPOSE
==================================================

Create a professional enterprise workspace for Admins to monitor and oversee all active and completed deals on Vault Ventures.

The Admin should be able to:

- Search deals
- Filter deals
- Review deal lifecycle
- See participants
- See business
- Review NDA status
- Review negotiation status
- Monitor milestone funding status
- Identify flags/reports
- Open detailed deal information
- Review deal history
- Take appropriate administrative actions

IMPORTANT:

Admin is an oversight/control role.

Admin is NOT a participant in the deal.

==================================================
2. PAGE HEADER
==================================================

Title:

Deals

Subtitle:

Monitor deal lifecycle, participants, agreements and milestone activity.

Show compact summary indicators:

Active Deals
NDA Pending
Negotiating
Milestone Funding Active
Completed

Do NOT use oversized dashboard cards.

==================================================
3. SEARCH + FILTERS
==================================================

Create a compact professional toolbar.

Search:

Search business or participant...

Filters:

Deal Stage
NDA Status
Agreement Status
Milestone Status
Business
Created Date
Flags

Deal stages:

Matched
Interest Confirmed
Deal Room
NDA Signed
Negotiation
Agreement
Milestone Funding Active
Completed

Include:

Clear Filters

==================================================
4. DEAL TABLE
==================================================

Create a dense enterprise table.

Columns:

Business
Participants
Current Stage
NDA
Agreement
Milestones
Last Activity
Flags
Actions

Example:

NovaTech AI

Alex Morgan
Sarah Chen

Negotiation

Signed

Pending

2 / 4 milestones

2h ago

0

[View]

Keep rows compact.

==================================================
5. DEAL IDENTITY
==================================================

Each deal should clearly communicate:

Business
Main participants
Current lifecycle stage

Do NOT overload the table.

Use detail view for deeper information.

==================================================
6. DEAL LIFECYCLE
==================================================

Inside the detail view, show the full lifecycle:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding Active
→ Completed

Clearly identify:

Completed
Current
Upcoming

Use a persistent professional stepper.

Do NOT use gamified progress.

==================================================
7. DEAL DETAIL DRAWER
==================================================

Clicking [View] opens a professional Deal Detail Drawer.

Structure:

DEAL HEADER

Business
Participants
Current Stage
Created Date
Status

PARTICIPANTS

Founder
Investor
Professional where applicable

Show:

Name
Role
Verification
Connection status

BUSINESS

Business name
Industry
Stage
Readiness
Funding Ask

NDA

Status
Signed date where applicable

AGREEMENT

Status
Relevant date
Current state

MILESTONES

Total milestones
Completed
Active
Upcoming

ACTIVITY

Recent deal activity

FLAGS / REPORTS

Relevant flags
Related reports

AUDIT HISTORY

Administrative actions

==================================================
8. PARTICIPANT RELATIONSHIP
==================================================

Each participant should be clickable.

Clicking a participant should conceptually open:

Admin → Users → User Detail

Do NOT duplicate the entire Users Management interface.

The Admin must clearly understand:

who is involved
what role they have
their verification state

==================================================
9. BUSINESS RELATIONSHIP
==================================================

Business should link conceptually to:

Admin → Businesses → Business Detail

Do NOT duplicate the Business Management screen.

==================================================
10. NDA STATUS
==================================================

Show:

Not Started
Pending
Signed

Include date when applicable.

Do not expose sensitive NDA content unnecessarily.

==================================================
11. AGREEMENT STATUS
==================================================

Show:

Not Started
Draft
Under Review
Executed

Use restrained semantic status indicators.

==================================================
12. MILESTONE STATUS
==================================================

Show:

Completed
Active
Upcoming

Example:

2 / 4 milestones completed

Use a compact progress indicator.

Do not make milestone progress look like a game.

==================================================
13. FLAGS / REPORTS
==================================================

If a deal has issues:

Show:

⚠ 1 flag

or:

⚠ 2 flags

Use severity:

Low
Medium
High
Critical

Do not invent arbitrary risk scores.

If a related report exists, allow Admin to open it.

==================================================
14. ADMIN ACTIONS
==================================================

Possible actions:

View Deal
View Participants
View Business
View Activity
View Audit History
Review Flag
Suspend Deal where applicable

Use an overflow menu for secondary actions.

Do NOT provide actions that imply Admin is negotiating on behalf of participants.

==================================================
15. SUSPEND / RESTRICT DEAL
==================================================

If the platform rules require administrative intervention:

Show:

Restrict Deal

instead of pretending Admin is a deal participant.

Require:

Reason
Confirmation

Explain the consequence.

Do NOT allow accidental restriction.

Record the action in audit history.

==================================================
16. DEAL ACTIVITY
==================================================

Create a compact timeline.

Examples:

Interest confirmed
2h ago

NDA signed
Yesterday

Negotiation updated
Yesterday

Milestone completed
2 days ago

Keep:

Timestamp
Actor
Action

clearly visible.

==================================================
17. DEAL HISTORY
==================================================

Show the complete lifecycle history.

Example:

Matched
Apr 12

Interest Confirmed
Apr 13

Deal Room Created
Apr 14

NDA Signed
Apr 16

Negotiation Started
Apr 18

Keep the history chronological and easy to scan.

==================================================
18. BULK SELECTION
==================================================

Allow selecting multiple deals.

Safe bulk actions:

Export Selected
Review Selected

Do NOT introduce bulk destructive actions.

==================================================
19. EMPTY STATE
==================================================

If no deals match:

"No deals found."

Supporting text:

"Try adjusting your search or filters."

[Clear Filters]

==================================================
20. LOADING STATE
==================================================

Create skeleton loading for:

Deal rows
Lifecycle stage
Status
Participants
Activity

Avoid a large page-level spinner.

==================================================
21. RESPONSIVE WEB
==================================================

Desktop:

Dense table + detail drawer.

Tablet:

Reduced columns + expandable detail.

Mobile:

Deals become structured cards.

Show:

Business
Participants
Current Stage
NDA
Milestones
Last Activity
Primary Action

Filters become a drawer.

Detail becomes a full-screen panel.

Do NOT create page-level horizontal overflow.

==================================================
22. SECURITY / PRIVACY
==================================================

Do NOT expose:

Passwords
Authentication secrets
Admin credentials

Do not unnecessarily expose confidential deal documents or sensitive negotiation content in the list view.

Admin should see only information required for administrative oversight.

==================================================
23. AUDITABILITY
==================================================

Administrative actions must be auditable.

For:

Restriction
Flag review
Status intervention
Administrative decisions

record:

Admin
Action
Timestamp
Reason where applicable

Provide:

[View Audit History]

Connect conceptually to Admin → Audit Logs.

==================================================
24. PROTOTYPE FLOW
==================================================

Admin Dashboard
↓
Deals
↓
Search / Filter
↓
View Deal
↓
Deal Detail

Then:

Deal Detail
↓
Participant
↓
Admin User Detail

Deal Detail
↓
Business
↓
Admin Business Detail

Deal Detail
↓
Flag
↓
Review Flag

Deal Detail
↓
Audit History

Deal Detail
↓
Restrict Deal
↓
Reason
↓
Confirmation
↓
Restricted

==================================================
25. VISUAL QUALITY
==================================================

The Deals workspace should feel:

Professional
Controlled
Precise
Secure
Information-dense
Enterprise-grade

Avoid:

- Giant cards
- Excessive whitespace
- Decorative graphics
- Social-media styling
- Generic SaaS dashboard appearance
- Gamified deal progress

Use:

Tables
Lifecycle steppers
Detail drawers
Timelines
Compact status indicators

==================================================
26. FINAL QUALITY CHECK
==================================================

✓ Deal lifecycle is clear
✓ Participants are clear
✓ Business relationship is clear
✓ NDA status is clear
✓ Agreement status is clear
✓ Milestone status is clear
✓ Flags are visible
✓ Deal history is available
✓ Admin remains oversight-only
✓ No implication that Admin participates in negotiation
✓ Actions are controlled
✓ Auditability exists
✓ Responsive web works
✓ No page-level horizontal overflow
✓ Existing Admin screens remain unchanged
✓ Premium enterprise Admin feel

ONLY design/refine:

ADMIN → DEALS