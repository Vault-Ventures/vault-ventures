VAULT VENTURES — ADMIN TEAMS MANAGEMENT

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

Design/refine ONLY:

ADMIN → TEAMS

==================================================
1. PURPOSE
==================================================

Create a professional enterprise workspace for Admins to monitor and manage teams formed through Vault Ventures.

The Admin should be able to:

- Search teams
- Filter teams
- Review team composition
- See related business
- See members and roles
- Monitor team status
- Identify flagged teams
- Review team activity
- Open detailed team information
- Take appropriate administrative actions

This is an operational control interface.

It must NOT look like a social group page.

==================================================
2. PAGE HEADER
==================================================

Title:

Teams

Subtitle:

Manage collaboration teams, members and team activity.

Show compact summary indicators:

Total Teams
Active Teams
Pending Teams
Flagged Teams

Do NOT use oversized cards.

==================================================
3. SEARCH + FILTERS
==================================================

Create a compact toolbar.

Search:

Search team or business...

Filters:

Team Status
Business
Team Size
Created Date
Flags

Statuses:

Active
Pending
Completed
Suspended

Include:

Clear Filters

==================================================
4. TEAM TABLE
==================================================

Create a dense professional table.

Columns:

Team
Business
Members
Team Lead / Founder
Status
Created
Last Activity
Flags
Actions

Example:

NovaTech AI Team
NovaTech AI
5 members
Alex Morgan
Active
Apr 20, 2026
2h ago
0
[View]

Keep rows compact.

==================================================
5. TEAM IDENTITY
==================================================

Each team should clearly show:

Team name
Related business
Team size

Do NOT use giant team cards.

Use compact identity presentation.

==================================================
6. MEMBERS
==================================================

Show team member count.

Example:

5 members

Inside detail view show:

Member
Role
Account status
Verification
Joined
Contribution / responsibility where applicable

Roles may include:

Founder
Investor
Professional

A single member may have multiple roles in the overall Vault Ventures account, but the team should show the role relevant to their participation.

==================================================
7. TEAM DETAIL DRAWER
==================================================

Clicking [View] opens a professional Team Detail Drawer.

Structure:

TEAM HEADER

Team name
Business
Status
Created date

BUSINESS

Business name
Industry
Stage
Founder

MEMBERS

Member list
Roles
Verification
Status
Joined date

TEAM STATUS

Current status
Relevant milestones / progress where applicable

ACTIVITY

Recent team activity

FLAGS / REPORTS

Current flags
Related reports

AUDIT HISTORY

Administrative actions

==================================================
8. TEAM MEMBERS
==================================================

Make each member clickable.

Clicking a member should conceptually open:

Admin → Users → User Detail

Do NOT duplicate the entire Users interface.

Show enough context inside the team detail to understand team composition.

==================================================
9. TEAM STATUS
==================================================

Use:

Active
Pending
Completed
Suspended

Use restrained semantic indicators.

Do not rely only on color.

==================================================
10. FLAGS
==================================================

If a team has issues:

Show:

⚠ 1 flag

or:

⚠ 2 flags

Use severity:

Low
Medium
High
Critical

Do not invent arbitrary team risk scores.

==================================================
11. TEAM ACTIONS
==================================================

Possible actions:

View Team
View Business
View Member
Review Flags
Suspend Team
Restore Team
View Audit History

Use an overflow menu for secondary actions.

Do not show every action as a primary button.

==================================================
12. SUSPEND TEAM
==================================================

If Admin selects:

Suspend Team

Show confirmation.

Include:

Team
Business
Current status
Reason

Explain the consequence.

Require explicit confirmation.

Record the action in audit history.

==================================================
13. RESTORE TEAM
==================================================

For suspended teams:

[Restore Team]

Show concise confirmation.

After confirmation:

Status → Active

Record:

Admin
Action
Timestamp

==================================================
14. TEAM ACTIVITY
==================================================

Show a compact timeline.

Examples:

New member joined
2h ago

Role updated
5h ago

Milestone completed
Yesterday

Team status changed
2 days ago

Keep timestamps subtle.

==================================================
15. BUSINESS RELATIONSHIP
==================================================

Clearly connect each team to its Business.

Clicking Business should conceptually open:

Admin → Businesses → Business Detail

Do NOT duplicate the Business Management screen.

==================================================
16. BULK SELECTION
==================================================

Allow selecting multiple teams.

Safe actions:

Export Selected
Review Selected

Do NOT introduce bulk suspension unless explicitly required.

==================================================
17. EMPTY STATE
==================================================

If no teams match:

"No teams found."

Supporting text:

"Try adjusting your search or filters."

[Clear Filters]

==================================================
18. LOADING STATE
==================================================

Create skeleton loading for:

Team rows
Members
Status
Activity

Avoid large page-level spinners.

==================================================
19. RESPONSIVE WEB
==================================================

Desktop:

Dense table + detail drawer.

Tablet:

Reduced columns + expandable detail.

Mobile:

Teams become structured cards.

Show:

Team
Business
Members
Status
Last activity
Primary action

Filters become a drawer.

Detail becomes a full-screen panel.

Do NOT create page-level horizontal overflow.

==================================================
20. SECURITY / PRIVACY
==================================================

Do NOT expose:

Passwords
Authentication secrets
Admin credentials

Only display information required for team administration.

==================================================
21. AUDITABILITY
==================================================

Administrative actions must be auditable.

For:

Suspend
Restore
Status changes
Flag-related actions

record:

Admin
Action
Timestamp
Reason where applicable

Provide:

[View Audit History]

==================================================
22. VISUAL QUALITY
==================================================

The Teams workspace should feel:

Enterprise-grade
Operational
Precise
Information-dense
Professional

Avoid:

- Giant cards
- Excessive whitespace
- Social-media group-page styling
- Decorative graphics
- Excessive badges
- Generic SaaS appearance

Use:

Tables
Filters
Detail drawers
Member lists
Activity timelines

==================================================
23. PROTOTYPE FLOW
==================================================

Admin Dashboard
↓
Teams
↓
Search / Filter
↓
View Team
↓
Team Detail

Then:

Team Detail
↓
Member
↓
Admin User Detail

Team Detail
↓
Business
↓
Admin Business Detail

Team Detail
↓
Suspend
↓
Confirmation
↓
Suspended

Suspended Team
↓
Restore
↓
Confirmation
↓
Active

==================================================
24. FINAL QUALITY CHECK
==================================================

✓ Teams are easy to search
✓ Business relationship is clear
✓ Members are clearly represented
✓ Member roles are contextual
✓ Status is clear
✓ Flags are visible
✓ Detail drawer is comprehensive
✓ Admin actions are controlled
✓ Suspension requires confirmation
✓ Auditability exists
✓ Responsive web works
✓ No page-level horizontal overflow
✓ Existing Admin screens remain unchanged
✓ Premium enterprise Admin feel

ONLY design/refine:

ADMIN → TEAMS