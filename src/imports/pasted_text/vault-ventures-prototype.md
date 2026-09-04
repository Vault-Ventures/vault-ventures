VAULT VENTURES — FINAL PROTOTYPE CONNECTION & INTERACTION PASS

IMPORTANT:

This is the FINAL INTERACTION / PROTOTYPE CONNECTION PASS.

Do NOT redesign any approved screen.

Do NOT add new features.

Do NOT change:
- Product architecture
- Account model
- Role model
- Information architecture
- Approved visual design
- Page structure

ONLY connect and validate interactions between the existing screens.

==================================================
1. GLOBAL RULE
==================================================

Every visible interactive element must have a logical destination or interaction.

No:

- Dead buttons
- Dead tabs
- Dead links
- Dead navigation items
- Broken back buttons
- Broken close buttons
- Missing modal actions
- Missing drawer actions

If an element is intentionally non-functional in the prototype, make that clear rather than creating a fake destination.

==================================================
2. AUTHENTICATION FLOW
==================================================

Connect:

Sign In
→ Successful Login
→ Correct Workspace

Sign In
→ Forgot Password

Sign In
→ Sign Up

Sign Up
→ Role Selection

Role Selection
→ Role Setup

Role Setup
→ Unified Profile / Workspace

Email Verification
→ Verified State
→ Sign In / Workspace

Reset Password
→ Success
→ Sign In

Every authentication screen:

[Back]

must return to the logically previous screen.

==================================================
3. MULTI-ROLE FLOW
==================================================

Test:

Founder

Sign In
→ Founder Dashboard

Founder + Investor

Sign In
→ Default Workspace
→ Role Switcher
→ Investor Dashboard

Founder + Investor + Professional

Sign In
→ Default Workspace
→ Founder
→ Investor
→ Professional

Switching role must NOT log the user out.

Do NOT create a new account.

==================================================
4. ROLE SWITCHER
==================================================

Connect every Role Switcher option.

Example:

Founder Workspace
→ Role Switcher
→ Investor Workspace

Investor Workspace
→ Role Switcher
→ Professional Workspace

Professional Workspace
→ Role Switcher
→ Founder Workspace

Only selected roles should appear.

Admin must NEVER appear in this switcher.

==================================================
5. GLOBAL NAVIGATION
==================================================

Every sidebar item must navigate to the correct existing screen.

Founder:

Dashboard
Discovery
Applications
Teams
Deal Rooms
Profile

Investor:

Dashboard
Discovery
Saved Opportunities / existing approved section
Deal Rooms
Portfolio / existing approved section
Profile

Professional:

Dashboard
Discovery
Applications
Deal Rooms
Opportunities
Profile

Use the exact approved navigation labels already present in the design.

Do NOT invent new pages.

==================================================
6. PROFILE CONNECTION
==================================================

From every normal workspace:

Profile
→ SAME Unified Profile

Profile actions:

Edit Profile
→ Edit Profile

Manage Roles
→ Manage Roles

Add Role
→ Role Selection / Role Setup

Cover Photo
→ Edit Cover Photo interaction

Profile Photo
→ Edit Photo interaction

Do NOT create separate role-specific profile pages.

==================================================
7. DISCOVERY FLOW
==================================================

Connect:

Discovery
→ Opportunity / Business Details

Opportunity
→ Correct role-specific primary action

Back:

Opportunity
→ Discovery

Filters:

Filter
→ Updated Discovery Results

Search:

Search
→ Relevant Discovery Results

Do NOT create dead filter controls.

==================================================
8. APPLICATION FLOW
==================================================

Connect:

Opportunity
→ Apply

Apply
→ Application Form

Application Form
→ Review

Review
→ Submit

Submit
→ Application Success

Success:

[View Application]
→ Application Detail

[Back to Discovery]
→ Discovery

Application:

Submitted
→ Under Review
→ Accepted / Rejected / Withdrawn

Use the already-approved application states.

==================================================
9. DUPLICATE APPLICATION
==================================================

If the user already applied:

Opportunity
→ Application Status

Do NOT allow the prototype to show:

[Apply]

as if the user has never applied.

Show:

Applied
or
Application Under Review

→ View Application

==================================================
10. TEAM FLOW
==================================================

Where the approved workflow creates a team:

Application / Collaboration
→ Team

Team:

View Members
→ Member details / Profile context

Team:

View Business
→ Business Details

Team:

Continue to Deal
→ Deal Room

Do NOT create unrelated team pages.

==================================================
11. DEAL ROOM FLOW
==================================================

Connect all approved Deal Room entry points.

Opportunity
→ Deal Room

Application / Collaboration
→ Deal Room

Team
→ Deal Room

Deal Room must preserve:

Business
Participants
Current Stage

Lifecycle:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding Active
→ Completed

Use the approved Deal Room design.

Do NOT redesign it.

==================================================
12. DEAL ROOM BACK NAVIGATION
==================================================

Provide logical return paths.

If entered from:

Opportunity
→ Back to Opportunity

Team
→ Back to Team

Application
→ Back to Application

Do not force every entry point to return to the same page.

==================================================
13. DRAWERS
==================================================

Connect all existing detail drawers.

User
→ User Detail Drawer

Business
→ Business Detail Drawer

Application
→ Application Detail Drawer

Team
→ Team Detail Drawer

Deal
→ Deal Detail Drawer

Verification
→ Verification Review Drawer

Report
→ Report Detail Drawer

Audit Event
→ Audit Detail Drawer

Every drawer must have:

Close
X

and appropriate contextual actions.

==================================================
14. MODALS
==================================================

Connect confirmation flows.

Examples:

Suspend
→ Confirmation
→ Success / Updated State

Reject
→ Reason
→ Confirmation
→ Rejected

Approve
→ Confirmation
→ Approved

Restore
→ Confirmation
→ Active

Request Information
→ Form
→ Submitted
→ Updated Status

Do NOT create fake success states.

==================================================
15. ADMIN AUTHENTICATION
==================================================

Admin Login
→ Admin Dashboard

Admin Login must NEVER lead to:

Founder Dashboard
Investor Dashboard
Professional Dashboard

Admin must remain completely isolated.

==================================================
16. ADMIN NAVIGATION
==================================================

Connect the Admin sidebar:

Dashboard
→ Admin Dashboard

Users
→ Users

Verification
→ Verification Queue

Businesses
→ Businesses

Applications
→ Applications

Teams
→ Teams

Deals
→ Deals

Reputation
→ Reputation

Reports & Disputes
→ Reports

Audit Logs
→ Audit Logs

Analytics
→ Analytics

Settings
→ Settings

Notifications
→ Notifications

Use the exact approved page names already present.

==================================================
17. ADMIN USER FLOW
==================================================

Users
→ User Detail

User Detail:

View Profile
→ Unified Profile / appropriate profile context

View Verification
→ Verification

View Audit History
→ Audit Logs

Suspend
→ Confirmation
→ Suspended

Restore
→ Confirmation
→ Active

==================================================
18. ADMIN VERIFICATION FLOW
==================================================

Verification Queue
→ Review

Review:

View Profile
→ User Detail

View Evidence
→ Evidence Preview

Approve
→ Confirmation
→ Approved

Reject
→ Reason
→ Confirmation
→ Rejected

Request Information
→ Request Form
→ Needs Information

==================================================
19. ADMIN BUSINESS FLOW
==================================================

Businesses
→ Business Detail

Business Detail:

View Founder
→ User Detail

Review Verification
→ Verification

View Audit History
→ Audit Logs

Flag
→ Reason + Severity
→ Confirmation
→ Flagged

Suspend
→ Confirmation
→ Suspended

Restore
→ Confirmation
→ Active

==================================================
20. ADMIN APPLICATION FLOW
==================================================

Applications
→ Application Detail

Application:

Applicant
→ User Detail

Business
→ Business Detail

Accept
→ Confirmation
→ Accepted

Reject
→ Reason
→ Confirmation
→ Rejected

Audit History
→ Audit Logs

==================================================
21. ADMIN TEAM FLOW
==================================================

Teams
→ Team Detail

Team Member
→ User Detail

Business
→ Business Detail

Deal
→ Deal Detail

Suspend
→ Confirmation
→ Suspended

Restore
→ Confirmation
→ Active

==================================================
22. ADMIN DEAL FLOW
==================================================

Deals
→ Deal Detail

Participant
→ User Detail

Business
→ Business Detail

Flag
→ Reports / relevant case

Audit History
→ Audit Logs

Admin must remain an oversight role.

Do NOT connect Admin to participant-only actions.

==================================================
23. ADMIN REPUTATION FLOW
==================================================

Reputation
→ Reputation Detail

User
→ User Detail

Reports
→ Reports & Disputes

Verification
→ Verification

Audit History
→ Audit Logs

Place Under Review
→ Confirmation
→ Under Review

Restrict
→ Confirmation
→ Restricted

Restore
→ Confirmation
→ Appropriate Active State

==================================================
24. ADMIN REPORTS FLOW
==================================================

Reports & Disputes
→ Case Detail

Reported User
→ User Detail

Business
→ Business Detail

Application
→ Application Detail

Team
→ Team Detail

Deal
→ Deal Detail

Assign
→ Assigned State

Request Information
→ Awaiting Information

Escalate
→ Confirmation
→ Escalated

Resolve
→ Resolution
→ Resolved

Dismiss
→ Reason
→ Dismissed

==================================================
25. AUDIT LOG FLOW
==================================================

Audit Logs
→ Audit Detail

Audit Detail:

User
→ User Detail

Business
→ Business Detail

Deal
→ Deal Detail

Report
→ Report Detail

Verification
→ Verification

Do NOT create duplicate detail screens.

==================================================
26. ANALYTICS FLOW
==================================================

Analytics:

User Growth
→ Relevant User Analytics context

Verification Activity
→ Verification Queue

Application Activity
→ Applications

Deal Activity
→ Deals

Trust & Safety
→ Reports & Disputes

Date Range:

Select Range
→ Apply
→ Updated Analytics State

Export:

Export
→ Export Dialog
→ Selected Format
→ Export State

==================================================
27. SETTINGS FLOW
==================================================

Settings navigation must connect:

General
User & Roles
Verification
Businesses
Applications
Deals
Reputation
Notifications
Security
System

Save:

Edit
→ Save
→ Changes Saved

Cancel:

Edit
→ Cancel
→ Previous State

Unsaved changes:

Edit
→ Navigate Away
→ Unsaved Changes Warning

High-impact setting:

Edit
→ Confirmation
→ Save
→ Audit Event

==================================================
28. NOTIFICATIONS
==================================================

Admin Notification Center:

Notification
→ Relevant Admin Context

Verification notification
→ Verification Queue

Report notification
→ Reports & Disputes

Deal notification
→ Deals

Security notification
→ Audit Logs / Security context

Mark as Read:

Unread
→ Read

Mark All as Read:

All unread
→ Read

Do NOT delete notifications when read.

==================================================
29. BACK BUTTONS
==================================================

Every page/drawer/modal must have a logical way to close or go back.

Verify:

Authentication
Onboarding
Opportunity
Application
Team
Deal Room
Profile
Admin Detail Views
Settings
Notifications

No dead ends.

==================================================
30. CLOSE BUTTONS
==================================================

Every drawer:

X
→ Close Drawer

Every modal:

Cancel / X
→ Close Modal

Do NOT accidentally navigate away from the parent page.

==================================================
31. RESPONSIVE PROTOTYPE QA
==================================================

Verify interactions at:

1440px
1280px
1024px
768px
390px

At every width:

✓ Navigation accessible
✓ Role Switcher accessible
✓ Buttons usable
✓ Drawers usable
✓ Modals usable
✓ Forms usable
✓ No clipped content
✓ No page-level horizontal overflow

==================================================
32. INTERACTION STATES
==================================================

For important interactive components provide:

Default
Hover
Active
Focus
Disabled
Loading
Success
Error

Do not create unnecessary animations.

==================================================
33. FINAL CLICK-THROUGH TEST
==================================================

Perform a conceptual click-through of:

NORMAL USER:

Sign In
→ Dashboard
→ Discovery
→ Opportunity
→ Application / Interest
→ Team
→ Deal Room
→ Profile
→ Role Switcher
→ Another Workspace

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

Every transition must have a logical destination.

==================================================
34. FINAL RULE
==================================================

Do NOT redesign.

Do NOT add pages.

Do NOT add features.

Do NOT rename existing components.

Do NOT change approved workflows.

ONLY:

Connect
Validate
Fix
Refine
Test

==================================================
FINAL OBJECTIVE
==================================================

Make the Vault Ventures Figma prototype feel like a COMPLETE WORKING WEB PRODUCT.

Every click should make sense.

Every action should have feedback.

Every page should have a way forward or back.

Every role should remain isolated.

Every Admin workflow should remain separate.

No dead ends.

No broken connections.

No missing interactions.

ONLY perform the FINAL PROTOTYPE CONNECTION & INTERACTION PASS.