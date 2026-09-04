VAULT VENTURES — NORMAL USER END-TO-END JOURNEY QA

IMPORTANT:

This is a FLOW + UX QA PASS.

Do NOT redesign the approved screens.
Do NOT add new features.
Do NOT change the product architecture.
Do NOT change the multi-role account model.

ONLY identify and fix broken navigation, missing states, role confusion, inconsistent flows, and responsive problems across the Founder, Investor and Professional journeys.

==================================================
1. ACCOUNT MODEL — MUST REMAIN UNCHANGED
==================================================

ONE normal email = ONE Vault Ventures account.

A user may have:

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

There is ONE unified account and ONE unified Profile.

Admin is completely separate.

==================================================
2. FOUNDER JOURNEY
==================================================

Verify this complete flow:

Sign In
↓
Founder Workspace
↓
Founder Dashboard
↓
Discovery
↓
View Business / Opportunity
↓
Review Details
↓
Apply / Connect where applicable
↓
Application Status
↓
Team
↓
Deal Room
↓
Profile

Every transition must have a clear destination.

No dead ends.

==================================================
3. FOUNDER DASHBOARD
==================================================

Verify the Founder Dashboard clearly answers:

What needs my attention?

Check:

Active businesses
Applications
Teams
Opportunities
Deal Rooms
Tasks / activity where already designed

Do NOT add new dashboard features.

Only fix broken UX or inconsistent presentation.

==================================================
4. FOUNDER → DISCOVERY
==================================================

Verify:

Founder Dashboard
→ Discovery

Discovery should preserve the current Founder context.

The user should NOT accidentally enter:

Investor-only
Professional-only
Admin-only

content.

==================================================
5. FOUNDER → APPLICATION
==================================================

Verify:

Opportunity
→ Apply

The application flow should clearly show:

Opportunity
Business
Applicant
Relevant contribution
Application status

After submission:

Show confirmation / submitted state.

Do NOT make the user wonder whether the application was submitted.

==================================================
6. FOUNDER → TEAM
==================================================

Verify:

Application / Opportunity
→ Team

Team information should remain connected to the correct:

User
Business
Opportunity

Do NOT create duplicate team identities.

==================================================
7. FOUNDER → DEAL ROOM
==================================================

Verify:

Relevant opportunity / connection
→ Deal Room

Deal Room should retain context:

Business
Participants
Current Stage
NDA
Agreement
Milestones
Activity

Do NOT lose the user's role context.

==================================================
8. INVESTOR JOURNEY
==================================================

Verify this complete flow:

Sign In
↓
Investor Workspace
↓
Investor Dashboard
↓
Discovery
↓
View Opportunity
↓
Review Business
↓
Interest / Connect
↓
Deal Room
↓
Portfolio / Active Deals where already designed
↓
Profile

No Founder-only content should appear.

==================================================
9. INVESTOR DASHBOARD
==================================================

Verify the Investor Dashboard prioritizes the already-approved Investor experience.

Check:

Opportunities
Matches
Active Deals
Deal Rooms
Relevant activity

Do NOT redesign the dashboard.

Only fix:

Broken navigation
Missing states
Incorrect role context
Layout problems

==================================================
10. INVESTOR → DISCOVERY
==================================================

Verify:

Investor Dashboard
→ Discovery
→ Business / Opportunity
→ Relevant action

The user should remain in Investor context.

==================================================
11. INVESTOR → DEAL ROOM
==================================================

Verify:

Opportunity
→ Interest
→ Deal Room

Deal Room must show the correct:

Investor
Founder
Business
Deal stage

Do NOT mix another user's information.

==================================================
12. PROFESSIONAL JOURNEY
==================================================

Verify:

Sign In
↓
Professional Workspace
↓
Professional Dashboard
↓
Recommended Opportunities
↓
View Opportunity
↓
Application
↓
Application Status
↓
Deal Room where applicable
↓
Profile

The flow should feel professional/collaboration-focused.

It must NOT become a job-board experience.

==================================================
13. PROFESSIONAL DASHBOARD
==================================================

Verify:

Recommended Opportunities
Applications
Active Deal Rooms
Skill Matching
Profile Completion
Next Action

These elements should connect to their respective screens where already designed.

Do NOT add new functionality.

==================================================
14. PROFESSIONAL → APPLICATION
==================================================

Verify:

Recommended Opportunity
→ View
→ Apply

After submission:

Application status must be clear.

The user should be able to return to:

Professional Dashboard
or
Applications

without losing context.

==================================================
15. MULTI-ROLE USER JOURNEY
==================================================

Test:

Founder + Investor

Sign In
↓
Founder Workspace
↓
Role Switcher
↓
Investor Workspace
↓
Profile
↓
Unified Profile
↓
Role Switcher
↓
Founder Workspace

Then test:

Founder + Investor + Professional

Sign In
↓
Default Workspace
↓
Founder
↓
Investor
↓
Professional
↓
Unified Profile

No logout should be required.

==================================================
16. ROLE DATA ISOLATION
==================================================

When switching roles:

The account remains the same.

But workspace content changes.

Example:

Founder Workspace:

Founder dashboard
Founder opportunities
Founder applications

Investor Workspace:

Investor dashboard
Investor opportunities
Investor activity

Professional Workspace:

Professional dashboard
Professional recommendations
Professional applications

Do NOT mix role-specific dashboard content.

==================================================
17. UNIFIED PROFILE
==================================================

From every role:

Profile
→ SAME unified Profile.

If:

Founder + Investor

show:

Founder Information
Investor Information

If:

Founder + Investor + Professional

show all three.

Do NOT duplicate:

Name
Email
Avatar
Cover photo
Core identity

==================================================
18. ROLE SWITCHER
==================================================

Verify:

Only selected roles appear.

Example:

Founder + Investor

Role Switcher:

Founder
Investor

NOT:

Founder
Investor
Professional
Admin

The active role must be obvious.

==================================================
19. ADD ROLE FLOW
==================================================

Verify:

Profile / Settings
→ Manage Roles
→ Add Role
→ Select Professional
→ Professional Setup
→ Complete
→ Professional Workspace available

Do NOT create a new account.

==================================================
20. APPLICATION STATE CONSISTENCY
==================================================

Verify application states remain consistent everywhere.

Use:

Submitted
Under Review
Accepted
Rejected
Withdrawn

If the same application appears in:

Dashboard
Applications
Business context
Admin

its status must remain consistent.

==================================================
21. DEAL STATE CONSISTENCY
==================================================

Use the approved lifecycle:

Matched
Interest Confirmed
Deal Room
NDA Signed
Negotiation
Agreement
Milestone Funding Active
Completed

The same deal must show the same stage everywhere.

==================================================
22. BACK NAVIGATION
==================================================

Verify users can return naturally from:

Opportunity
Application
Team
Deal Room
Profile
Settings

Do NOT trap users inside drawers or full-screen panels.

==================================================
23. MOBILE WEB QA
==================================================

Test:

390px

Verify:

✓ Header usable
✓ Role Switcher usable
✓ Navigation accessible
✓ Profile accessible
✓ Discovery usable
✓ Application usable
✓ Deal Room usable
✓ No clipped content
✓ No page-level horizontal overflow
✓ Buttons accessible

Do NOT simply shrink desktop layouts.

==================================================
24. TABLET QA
==================================================

Test:

768px
1024px

Verify:

✓ Sidebar behavior
✓ Dashboard layout
✓ Discovery layout
✓ Application layout
✓ Deal Room layout
✓ Drawers
✓ Tables
✓ No horizontal overflow

Use responsive reflow where necessary.

==================================================
25. EMPTY / LOADING / ERROR STATES
==================================================

Check all major user flows.

Examples:

No opportunities
No applications
No teams
No active deals
No recommendations

Also:

Loading
Error
Success
Submitted

Every state should clearly tell the user what is happening.

==================================================
26. VISUAL CONSISTENCY
==================================================

Founder, Investor and Professional experiences should feel like ONE product.

Standardize:

Header
Sidebar
Buttons
Inputs
Cards
Tables
Tabs
Drawers
Modals
Status indicators
Typography
Spacing

Role-specific content may differ.

The design language must not.

==================================================
27. FINAL JOURNEY TEST
==================================================

FOUNDER:

Login
→ Dashboard
→ Discovery
→ Opportunity
→ Application
→ Team
→ Deal Room
→ Profile

INVESTOR:

Login
→ Dashboard
→ Discovery
→ Opportunity
→ Interest
→ Deal Room
→ Profile

PROFESSIONAL:

Login
→ Dashboard
→ Recommendation
→ Opportunity
→ Application
→ Deal Room
→ Profile

MULTI-ROLE:

Login
→ Founder
→ Investor
→ Professional
→ Unified Profile

Verify every path is coherent.

==================================================
28. FINAL RULE
==================================================

DO NOT redesign working screens.

ONLY fix:

- Broken flows
- Missing navigation
- Role confusion
- Incorrect context
- Inconsistent statuses
- Missing states
- Responsive problems
- Duplicate information
- Dead ends
- Visual inconsistencies

==================================================
FINAL OBJECTIVE
==================================================

Make Founder, Investor and Professional journeys feel:

Complete
Connected
Predictable
Premium
Professional
Responsive

A user should always know:

Where am I?
What can I do here?
What happens next?
How do I go back?
Which role am I currently using?

ONLY perform the NORMAL USER END-TO-END JOURNEY QA PASS.