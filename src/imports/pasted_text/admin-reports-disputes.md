VAULT VENTURES — ADMIN REPORTS & DISPUTES

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
- Admin Businesses
- Admin Applications
- Admin Teams
- Admin Deals
- Admin Reputation

Design/refine ONLY:

ADMIN → REPORTS & DISPUTES

==================================================
1. PURPOSE
==================================================

Create a professional Trust & Safety / Dispute Management workspace.

The Admin should be able to:

- Search reports
- Filter reports
- Review reported users, businesses, applications, teams or deals
- Understand the reason for a report
- See severity
- Assign reports to an Admin
- Investigate evidence
- Review related activity
- Resolve reports
- Escalate serious cases
- Track dispute status
- View complete history

This must feel like an enterprise trust-and-safety console.

NOT like a generic support-ticket system.

==================================================
2. PAGE HEADER
==================================================

Title:

Reports & Disputes

Subtitle:

Review reported activity, disputes and platform safety issues.

Show compact indicators:

Open Reports
Under Review
High Priority
Resolved

Do NOT use oversized dashboard cards.

==================================================
3. SEARCH + FILTERS
==================================================

Create a compact toolbar.

Search:

Search report, user, business or case...

Filters:

Status
Severity
Report Type
Assigned Admin
Created Date

Statuses:

Open
Under Review
Awaiting Information
Escalated
Resolved
Dismissed

Severity:

Low
Medium
High
Critical

Report types may include:

User
Business
Application
Team
Deal
Content / Activity

Include:

Clear Filters

==================================================
4. REPORT TABLE
==================================================

Create a dense professional table.

Columns:

Case
Reported Entity
Reporter
Type
Severity
Status
Assigned Admin
Created
Last Updated
Action

Example:

#R-1042

NovaTech AI

Sarah Chen

Business

High

Under Review

Unassigned

Apr 20

2h ago

[Review]

Keep rows compact.

==================================================
5. CASE ID
==================================================

Every report should have a clear case identifier.

Example:

R-1042

Use a compact monospace-style treatment where appropriate.

Case IDs must remain visually distinct from normal user IDs.

==================================================
6. REPORT DETAIL DRAWER
==================================================

Clicking [Review] opens a professional investigation workspace.

Structure:

CASE HEADER

Case ID
Report type
Severity
Status
Created
Assigned Admin

REPORTED ENTITY

User / Business / Application / Team / Deal

Show:

Name
Relevant identity
Status
Verification where applicable

REPORTER

Reporter name
Role
Submitted date

Do not expose unnecessary reporter information.

==================================================
7. REPORT REASON
==================================================

Show clearly:

Reason for Report

Example:

Misrepresentation

Then:

Report description

Keep the original report information visually distinct from Admin notes.

Do NOT rewrite or reinterpret the reporter's statement.

==================================================
8. EVIDENCE
==================================================

Create a structured evidence section.

Possible evidence:

Screenshots
Messages / activity references
Profile information
Business information
Application information
Deal activity
Related reports

Each evidence item:

Evidence type
Date
Source
View action

Use:

[View Evidence]

Do not expose sensitive information unnecessarily.

==================================================
9. RELATED RECORDS
==================================================

Show contextual links:

Reported User
Related Business
Related Application
Related Team
Related Deal

Only show records that actually exist.

Clicking a record should open the corresponding Admin detail screen.

Do NOT duplicate those screens.

==================================================
10. STATUS WORKFLOW
==================================================

Create a clear case lifecycle:

Open
→ Under Review
→ Awaiting Information
→ Escalated
→ Resolved / Dismissed

Not every case must use every stage.

Clearly show:

Current Status

Do not make the workflow look gamified.

==================================================
11. ASSIGNMENT
==================================================

Allow a report to be:

Unassigned
Assigned to an Admin

Show:

Assigned Admin

Provide a simple assignment control.

==================================================
12. INVESTIGATION NOTES
==================================================

Create an internal Admin Notes section.

Clearly label:

INTERNAL ADMIN NOTES

Notes are NOT visible to the reporter unless explicitly intended by the product flow.

Allow:

Add note

Show:

Admin
Timestamp
Note

Keep internal notes visually separate from the original report.

==================================================
13. REQUEST INFORMATION
==================================================

If additional information is required:

[Request Information]

Open a compact dialog.

Allow Admin to specify:

What information is needed
Additional instructions

Primary:

[Send Request]

Status:

Awaiting Information

==================================================
14. ESCALATE
==================================================

For serious cases:

[Escalate]

Require:

Escalation reason

Optional notes.

Severity may be raised where justified.

Show confirmation before escalation.

Do not allow accidental escalation.

==================================================
15. RESOLVE
==================================================

Provide:

[Resolve]

Require a resolution outcome.

Examples:

No violation found
Issue resolved
Action taken
Duplicate report
Insufficient evidence
Other

Allow optional Admin notes.

After confirmation:

Status → Resolved

Record:

Admin
Timestamp
Outcome
Notes

==================================================
16. DISMISS
==================================================

Provide:

[Dismiss]

Require a reason.

Examples:

Duplicate
Invalid report
Insufficient evidence
No policy violation
Other

Show confirmation.

After confirmation:

Status → Dismissed

==================================================
17. DISPUTES
==================================================

Support dispute cases separately from ordinary reports.

A dispute may involve:

User ↔ User
Founder ↔ Investor
Professional ↔ Business
Business ↔ Participant

Show:

Parties
Related entity
Dispute reason
Current status
Submitted date
Assigned Admin
Last activity

Possible statuses:

Open
Under Review
Awaiting Information
Escalated
Resolved
Dismissed

==================================================
18. DISPUTE DETAIL
==================================================

For disputes show:

Parties

Issue Summary

Submitted Evidence

Communication / Activity History

Admin Notes

Decision / Resolution

Audit History

Keep both parties clearly identified.

Do not imply that Admin is taking a participant role.

==================================================
19. SEVERITY
==================================================

Use:

Low
Medium
High
Critical

Critical cases should be visually prominent but not visually overwhelming.

Do not use color alone.

Include the written severity label.

==================================================
20. PRIORITIZATION
==================================================

Allow sorting by:

Newest
Oldest
Severity
Last Updated
Assigned Admin

Provide a clear priority workflow without inventing unsupported numerical risk scores.

==================================================
21. AUDIT HISTORY
==================================================

Every administrative action should be traceable.

Show:

Case Created
Assigned
Status Changed
Information Requested
Escalated
Resolved
Dismissed

Each event:

Timestamp
Admin
Action
Reason where applicable

Provide:

[View Full Audit History]

==================================================
22. EMPTY STATE
==================================================

No reports:

"No reports found."

Supporting text:

"Try adjusting your search or filters."

[Clear Filters]

No open cases:

"No open cases require attention."

==================================================
23. LOADING STATE
==================================================

Create skeleton states for:

Report rows
Severity
Status
Entity
Assigned Admin

Do not use a large page-level spinner.

==================================================
24. RESPONSIVE WEB
==================================================

Desktop:

Dense table + investigation drawer.

Tablet:

Reduced columns + expandable details.

Mobile:

Cases become structured cards.

Show:

Case ID
Entity
Severity
Status
Last Updated
Primary action

Filters become a drawer.

Investigation becomes a full-screen panel.

Do NOT create page-level horizontal overflow.

==================================================
25. SECURITY / PRIVACY
==================================================

Do NOT expose:

Passwords
Authentication secrets
Admin credentials

Do not expose unnecessary private information.

Sensitive evidence should only appear in the appropriate investigation context.

==================================================
26. VISUAL QUALITY
==================================================

The Reports & Disputes workspace should feel:

Secure
Controlled
Neutral
Precise
Professional
Enterprise-grade

Avoid:

- Social-media moderation aesthetics
- Giant cards
- Excessive whitespace
- Decorative illustrations
- Gamification
- Generic support-ticket appearance

Use:

Tables
Case IDs
Severity indicators
Investigation drawers
Timelines
Evidence sections
Clear decision controls

==================================================
27. PROTOTYPE FLOW
==================================================

Admin Dashboard
↓
Reports & Disputes
↓
Search / Filter
↓
Open Case
↓
Review Evidence
↓
Review Related Records
↓
Assign Admin
↓
Investigate

Then:

Case
↓
Request Information
↓
Awaiting Information

Case
↓
Escalate
↓
Confirmation
↓
Escalated

Case
↓
Resolve
↓
Resolution
↓
Resolved

Case
↓
Dismiss
↓
Reason
↓
Dismissed

==================================================
28. FINAL QUALITY CHECK
==================================================

✓ Reports and disputes clearly separated by context
✓ Case IDs visible
✓ Reporter and reported entity clear
✓ Severity clear
✓ Status workflow clear
✓ Assignment available
✓ Evidence organized
✓ Related records accessible
✓ Internal notes separated
✓ Request-information flow exists
✓ Escalation flow exists
✓ Resolution flow exists
✓ Dismissal flow exists
✓ Audit history exists
✓ Sensitive information handled carefully
✓ Responsive web
✓ No page-level horizontal overflow
✓ Existing Admin screens unchanged
✓ Premium enterprise Trust & Safety feel

ONLY design/refine:

ADMIN → REPORTS & DISPUTES