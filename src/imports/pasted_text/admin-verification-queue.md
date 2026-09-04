VAULT VENTURES — ADMIN VERIFICATION QUEUE

IMPORTANT:

The following are already approved and MUST NOT be redesigned:

- Normal User Profile
- Discovery
- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Deal Room
- Admin Dashboard
- Admin Users Management

Design/refine ONLY:

ADMIN → VERIFICATION QUEUE

==================================================
1. PURPOSE
==================================================

Create a professional verification-review workspace.

The Admin should be able to:

- See pending verification requests
- Prioritize requests
- Review applicant information
- Inspect submitted verification evidence
- Understand the requested tier
- Approve verification
- Reject verification
- Request additional information
- View verification history

This must feel like a serious trust & safety / compliance workflow.

NOT a generic task list.

==================================================
2. PAGE HEADER
==================================================

Title:

Verification Queue

Subtitle:

Review and manage user verification requests.

Show a compact summary:

Pending
Under Review
Needs Information
Approved Today

Do not make these oversized dashboard cards.

==================================================
3. FILTER + SEARCH
==================================================

Create a compact toolbar.

Search:

Search by name or email...

Filters:

Verification Tier
Status
Role
Submitted Date
Flags

Statuses:

Pending
Under Review
Needs Information
Approved
Rejected

Include:

Clear Filters

==================================================
4. VERIFICATION TABLE
==================================================

Create a dense professional table.

Columns:

Applicant
Role(s)
Requested Tier
Submitted
Status
Flags
Assigned Admin
Action

Example:

Alex Morgan

Founder · Investor

Tier 1

Apr 20, 2026

Pending

0 flags

Unassigned

[Review]

==================================================
5. MULTI-ROLE USERS
==================================================

A single account may have:

Founder
Investor
Professional

or combinations.

Show all selected roles in ONE row.

Do NOT create separate verification accounts for each role.

Verification belongs to the user account.

Where role-specific verification information is relevant, show it clearly inside the review view.

==================================================
6. PRIORITY / FLAGS
==================================================

If the account has relevant flags:

Show:

⚠ 2 flags

Use semantic severity where appropriate.

Possible severity:

Low
Medium
High
Critical

Do not use color alone.

==================================================
7. REVIEW WORKSPACE
==================================================

Clicking Review should open a professional review workspace.

Prefer a large detail drawer or dedicated review panel without losing queue context.

Structure:

LEFT / MAIN:

Applicant identity

Profile photo
Name
Headline
Location
Member since
Roles

Verification request:

Requested Tier
Submission date
Current status

RIGHT / SECONDARY:

Verification checklist
Evidence
Flags
Previous verification history
Admin actions

==================================================
8. APPLICANT IDENTITY
==================================================

Show:

Name
Profile photo
Role(s)
Company / organization where relevant
Location
Profile completion
Current verification tier
Account status

Provide:

[View Full Profile]

This should open the already-approved Profile experience.

Do NOT redesign the Profile page.

==================================================
9. VERIFICATION EVIDENCE
==================================================

Create a structured evidence section.

Show submitted evidence as clearly separated items.

Example:

Identity Evidence
Business Evidence
Professional Evidence
Supporting Documents

Each item should show:

Document / evidence name
Submission date
Status
Preview / View action

Use:

[View]

where appropriate.

Do not expose unnecessary sensitive information.

==================================================
10. VERIFICATION CHECKLIST
==================================================

Create a clear review checklist.

Example:

✓ Account information
✓ Email verified
○ Identity evidence
○ Business information
○ Required supporting evidence

The checklist should make it obvious what remains to be reviewed.

Do NOT imply that an item is verified unless its state actually says so.

==================================================
11. VERIFICATION HISTORY
==================================================

Show previous verification events.

Example:

Tier 1 requested
Apr 20 · 14:32

Additional information requested
Apr 20 · 15:10

Evidence submitted
Apr 21 · 10:04

Keep:

Timestamp
Actor
Action
Result

visible.

==================================================
12. ADMIN DECISIONS
==================================================

Primary actions:

[Approve]

[Request Information]

[Reject]

Actions must be visually distinct but restrained.

Approve:
Positive semantic styling.

Request Information:
Neutral/attention styling.

Reject:
Danger styling.

Do NOT make all three look equally primary.

==================================================
13. REQUEST INFORMATION
==================================================

If Admin selects:

Request Information

Open a compact dialog.

Allow Admin to specify:

What is missing
What needs clarification
Additional instructions

Primary:

[Send Request]

Secondary:

[Cancel]

The applicant should clearly understand what needs to be provided.

==================================================
14. REJECTION FLOW
==================================================

If Admin selects:

Reject

Show confirmation dialog.

Include:

Applicant
Requested tier
Reason for rejection

Require a rejection reason.

Example reasons:

Insufficient evidence
Information mismatch
Invalid submission
Policy issue
Other

Allow optional additional notes.

Do not allow accidental rejection.

==================================================
15. APPROVAL FLOW
==================================================

If Admin selects:

Approve

Show a concise confirmation.

Example:

Approve Tier 1 verification?

Applicant:
Alex Morgan

Requested Tier:
Tier 1

After confirmation:

Status → Approved
Verification tier → Tier 1
Reviewer → current Admin
Timestamp → current time

Do not create a large celebratory animation.

==================================================
16. ASSIGNMENT
==================================================

Allow verification requests to be:

Unassigned
Assigned to an Admin

Show:

Assigned Admin

Provide a simple assignment control.

Do not overcomplicate this workflow.

==================================================
17. QUEUE STATES
==================================================

Design:

Normal Pending Queue
Under Review
Needs Information
Approved
Rejected
Empty Queue
Loading
Error

Empty state:

"No pending verification requests."

Supporting text:

"New verification submissions will appear here."

==================================================
18. PRIORITIZATION
==================================================

Allow sorting by:

Newest
Oldest
Priority
Requested Tier
Flags

High-risk / flagged submissions should be easy to identify.

Do not create arbitrary priority scores unless already defined by the product.

==================================================
19. RESPONSIVE WEB
==================================================

Desktop:

Dense table + review drawer.

Tablet:

Reduced columns + expandable review panel.

Mobile:

Verification requests become structured cards.

Filters become a drawer.

Review becomes a full-screen panel.

Actions remain accessible.

Do NOT create page-level horizontal overflow.

==================================================
20. SECURITY / PRIVACY
==================================================

Do NOT display:

Passwords
Authentication secrets
Admin credentials

Sensitive evidence should be accessible only inside the appropriate review context.

Do not expose unnecessary personal information in the queue table.

==================================================
21. AUDITABILITY
==================================================

Every decision should visually communicate that it is auditable.

When an Admin approves/rejects/requests information:

Record:

Admin
Action
Timestamp
Decision
Reason where applicable

Provide:

[View Audit History]

Do NOT create a separate audit system here; connect conceptually to the existing Admin Audit Logs.

==================================================
22. PROTOTYPE FLOW
==================================================

Admin Dashboard
↓
Verification Queue
↓
Filter / Search
↓
Review
↓
Applicant Detail
↓
Review Evidence
↓
Approve

Also:

Review
↓
Request Information
↓
Enter Reason
↓
Send Request
↓
Status = Needs Information

And:

Review
↓
Reject
↓
Confirmation
↓
Enter Reason
↓
Status = Rejected

==================================================
23. VISUAL QUALITY
==================================================

The Verification Queue should feel:

Trustworthy
Precise
Controlled
Secure
Professional
Information-dense

Avoid:

- Giant cards
- Excessive whitespace
- Decorative illustrations
- Excessive badges
- Gamification
- Generic SaaS styling

Use tables, structured evidence, review panels and clear actions.

==================================================
FINAL QUALITY CHECK
==================================================

✓ Pending requests are easy to find
✓ Multi-role users are handled as one account
✓ Requested tier is clear
✓ Evidence is organized
✓ Checklist is understandable
✓ Verification history exists
✓ Approve flow exists
✓ Reject flow exists
✓ Request-information flow exists
✓ Assignment exists
✓ Flags are visible
✓ Actions are auditable
✓ Sensitive information is handled carefully
✓ Responsive web works
✓ No page-level horizontal overflow
✓ Existing Admin Users screen remains unchanged
✓ Existing normal-user screens remain unchanged

ONLY design/refine:

ADMIN → VERIFICATION QUEUE