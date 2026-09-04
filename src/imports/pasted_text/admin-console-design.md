VAULT VENTURES — ADMIN CONSOLE DESIGN

IMPORTANT:
Design/refine ONLY the Admin Console.

Do NOT modify:
- Profile
- Discovery
- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Deal Room
- Public Website

Admin is a completely separate experience from normal Founder / Investor / Professional workspaces.

==================================================
1. ADMIN ISOLATION
==================================================

Admin is NOT a normal user role.

Do NOT include Admin inside the normal Role Switcher.

Normal users can switch only between their selected:

Founder
Investor
Professional

Admin has:

- Separate authentication
- Separate Admin Console
- Separate navigation
- Separate permissions
- Separate dashboard
- Separate operational workflows

The Admin Console should feel like an enterprise operations platform.

==================================================
2. ADMIN DASHBOARD PURPOSE
==================================================

The Admin Dashboard should immediately answer:

- What requires attention?
- How many users are active?
- What verification requests are pending?
- What businesses need review?
- What applications/deals are active?
- Are there disputes or reports?
- What unusual activity needs investigation?

Prioritize actionable operational information.

Do NOT fill the dashboard with decorative charts.

==================================================
3. ADMIN APP SHELL
==================================================

Create a dedicated Admin shell.

Left sidebar:

Dashboard
Users
Verification Queue
Businesses
Applications
Teams
Deals
Reputation
Reports / Disputes
Audit Logs
Analytics
Settings

Top bar:

Global Search
Notifications
Admin Profile
System status where appropriate

Do NOT reuse the normal Founder/Investor/Professional role selector.

==================================================
4. ADMIN DASHBOARD HEADER
==================================================

Create:

Admin Overview

Subtitle:

Platform operations and activity

Keep the header compact.

Do NOT use a marketing-style hero.

==================================================
5. PRIORITY / ACTION AREA
==================================================

The first area should surface things requiring immediate attention.

Examples:

Pending Verification
12

Open Reports
4

Flagged Businesses
3

Pending Disputes
2

Use compact operational indicators.

Clicking an indicator should lead to the corresponding admin section.

==================================================
6. PLATFORM METRICS
==================================================

Create a compact metric row:

Total Users
Active Businesses
Active Deal Rooms
Pending Verifications

Optional:

New Users
This Week

Do not create huge metric cards.

==================================================
7. VERIFICATION QUEUE
==================================================

This is one of the most important Admin workflows.

Create a professional verification table.

Columns:

User
Role
Verification Tier
Submitted
Status
Risk / Flags
Action

Statuses:

Pending
Under Review
Approved
Rejected
Needs More Information

Primary action:

Review

Admin should be able to open a detailed review panel.

==================================================
8. USER MANAGEMENT
==================================================

Create a professional Users management screen.

Include:

Search
Role filter
Verification filter
Status filter
Date filter

Table:

User
Roles
Email
Verification
Status
Joined
Last Active
Actions

Actions should include where appropriate:

View
Review
Suspend
Restore

Do NOT expose sensitive information unnecessarily.

==================================================
9. BUSINESS MANAGEMENT
==================================================

Create:

Businesses

Table:

Business
Founder
Industry
Stage
Verification
Readiness
Status
Created
Actions

Admin can:

View
Review
Flag
Approve where applicable
Suspend where applicable

Use a detail drawer for deeper review.

==================================================
10. APPLICATION MANAGEMENT
==================================================

Create:

Applications

Show:

Applicant
Business
Role / Opportunity
Submitted
Status
Last Activity
Actions

Statuses:

Pending
Under Review
Accepted
Rejected
Withdrawn

Use compact table design.

==================================================
11. DEAL MANAGEMENT
==================================================

Create:

Deals

Show:

Business
Participants
Current Stage
NDA Status
Last Activity
Risk / Flags
Status
Actions

Admin should be able to inspect the deal lifecycle.

Do NOT make Admin a participant in the actual deal.

Admin is an oversight/control role.

==================================================
12. REPORTS / DISPUTES
==================================================

Create:

Reports & Disputes

Show:

Reporter
Reported Entity
Reason
Severity
Created
Status
Assigned Admin
Action

Severity:

Low
Medium
High
Critical

Use semantic status colors carefully.

Provide:

Review
Assign
Resolve
Escalate

where appropriate.

==================================================
13. REPUTATION MANAGEMENT
==================================================

Create a Reputation administration view.

Show:

User
Current Reputation
Verification Tier
Flags
Reports
Status
Last Updated

Admin should be able to inspect reputation-related activity and relevant history.

Do not make reputation feel like a game.

==================================================
14. AUDIT LOGS
==================================================

Create a dense, professional Audit Log interface.

Columns:

Timestamp
Admin / Actor
Action
Entity
Entity ID
Previous State
New State
IP / Context where appropriate
Details

Use filters:

Date
Actor
Action
Entity
Severity

The audit log should feel like a real enterprise compliance system.

==================================================
15. ANALYTICS
==================================================

Create a professional Analytics workspace.

Possible sections:

User Growth
Business Growth
Verification Activity
Application Activity
Deal Activity
Platform Engagement

Use restrained charts.

Do NOT use decorative dashboards.

Charts must have:

Clear labels
Useful legends
Readable values
Meaningful time periods

==================================================
16. ADMIN DETAIL DRAWER
==================================================

Create a reusable Admin Detail Drawer.

When an Admin selects a user/business/application/report:

Show:

Summary
Status
Relevant metadata
Verification
Activity
Related records
Actions
Audit history

The drawer should allow review without losing the current table context.

==================================================
17. CONFIRMATION / DANGEROUS ACTIONS
==================================================

For destructive or high-impact actions:

Suspend
Reject
Resolve
Escalate
Restore

Use confirmation dialogs.

Clearly explain:

What will happen
What entity is affected
Whether the action can be reversed

Do NOT use confirmation dialogs for ordinary navigation.

==================================================
18. INFORMATION DENSITY
==================================================

Admin screens should be denser than normal user dashboards.

Prefer:

Tables
Rows
Filters
Drawers
Tabs
Compact summaries

Avoid:

Huge cards
Large empty spaces
Decorative illustrations
Unnecessary gradients
Excessive rounded containers

This should feel like a serious operations console.

==================================================
19. ADMIN VISUAL LANGUAGE
==================================================

Keep the Vault Ventures design system:

Deep navy
Clean surfaces
Subtle borders
Professional typography
Cyan for AI-related information
Gold for verification
Semantic colors for operational states

But make the Admin Console slightly more restrained and operational.

It should feel:

Precise
Controlled
Secure
Authoritative
Information-dense

==================================================
20. RESPONSIVE WEB
==================================================

Desktop:

Full Admin sidebar
Dense tables
Detail drawers

Tablet:

Collapsed sidebar
Reduced table columns
Drawer-based details

Mobile Web:

Bottom navigation / More menu
Tables transform into structured rows/cards
Filters become drawers
Detail views become full-screen panels

Do NOT simply shrink desktop tables.

Critical admin information must remain accessible.

==================================================
21. ADMIN STATES
==================================================

Design:

Loading
Empty
Error
Pending
Approved
Rejected
Suspended
Flagged
Critical

Example empty state:

"No pending verification requests."

Supporting text:

"New verification submissions will appear here."

==================================================
22. ADMIN PROTOTYPE FLOW
==================================================

Create clickable prototype flows:

Admin Login
↓
Admin Dashboard
↓
Verification Queue
↓
Review User
↓
Approve / Reject

Admin Dashboard
↓
Users
↓
User Detail
↓
Audit History

Admin Dashboard
↓
Reports
↓
Review Report
↓
Resolve / Escalate

Admin Dashboard
↓
Businesses
↓
Business Detail
↓
Review / Flag

Admin Dashboard
↓
Audit Logs
↓
Filter
↓
Detail

==================================================
23. SECURITY / TRUST
==================================================

The Admin Console must visually communicate that this is a privileged environment.

Use subtle indicators for:

Verification
Security
Auditability
High-impact actions

Do NOT expose passwords or authentication secrets in the UI.

Do NOT place admin credentials in the design.

==================================================
24. FINAL QUALITY CHECK
==================================================

✓ Completely separate from normal user workspace
✓ No Admin in normal Role Switcher
✓ Enterprise operations feel
✓ Dense and information-first
✓ Verification workflow is clear
✓ User management is clear
✓ Business management is clear
✓ Applications are manageable
✓ Deals are manageable
✓ Reports/Disputes are manageable
✓ Reputation is manageable
✓ Audit Logs are professional
✓ Analytics are useful
✓ Detail drawers are reusable
✓ Dangerous actions have confirmations
✓ Responsive web
✓ Loading/empty/error states
✓ No generic SaaS dashboard feel
✓ No unnecessary decoration

Do NOT modify any approved normal-user screens.

ONLY design/refine the separate Admin Console.