VAULT VENTURES — FOUNDER DASHBOARD REFINEMENT
MULTI-ROLE ACCOUNT AWARE

The Profile page and Discovery page are already approved.
Do NOT redesign them.

Now refine ONLY the Founder Dashboard.

==================================================
1. IMPORTANT ACCOUNT / ROLE MODEL
==================================================

Vault Ventures uses ONE USER ACCOUNT that may have multiple selected roles:

- Founder
- Investor
- Professional

A user may have one, two, or all three roles.

These roles belong to ONE account and ONE overall profile.

The user's selected roles and all corresponding role-specific profile information must remain available in the same profile.

The Admin role is completely separate and must NOT appear in this role-switching system.

For example:

Alex Morgan
Roles:
Founder + Investor + Professional

The profile contains:

Founder Information
Investor Information
Professional Information

However, each role has its own workspace.

==================================================
2. ROLE SWITCHER
==================================================

The authenticated web application must support role switching.

Example:

Alex Morgan
Founder ▾

Dropdown:

✓ Founder
  Investor
  Professional

If all three roles are selected:

Founder
Investor
Professional

Switching roles changes the workspace/navigation/dashboard context.

It does NOT create another account.

It does NOT delete or replace profile information.

The Profile remains one unified profile containing all selected-role information.

==================================================
3. FOUNDER DASHBOARD PURPOSE
==================================================

The Founder Dashboard should immediately answer:

- What is my current Founder status?
- How complete is my overall profile?
- What businesses do I have?
- What opportunities should I look at?
- What connections/deals need attention?
- What should I do next?

It must feel like a professional venture workspace,
not a generic SaaS dashboard.

==================================================
4. PAGE HEADER
==================================================

Create a compact page header:

Good morning, Alex

Founder workspace

Do NOT use a huge hero section.

Do NOT waste vertical space.

The current active workspace must be visually clear.

==================================================
5. MULTI-ROLE CONTEXT
==================================================

If the user has multiple roles, the dashboard should make role context obvious.

Example:

Founder Workspace

with a subtle role switcher in the global application header.

Do NOT duplicate the entire profile or show unrelated Investor/Professional dashboard information inside the Founder Dashboard.

Founder Dashboard = Founder workspace only.

Investor information remains accessible by switching to Investor Workspace.

Professional information remains accessible by switching to Professional Workspace.

==================================================
6. PROFILE / VERIFICATION STATUS
==================================================

Show a compact profile status area.

Because the user may have multiple roles, distinguish:

Overall Profile Completion

from

Founder-specific completion requirements where applicable.

Example:

Profile
78% complete

Founder setup
92% complete

Verification
Tier 1 / Unverified

Primary action:

[Complete profile]

Do NOT duplicate the Profile page.

==================================================
7. KEY METRICS
==================================================

Use a compact metric row.

Founder metrics:

Active Businesses
Connections
Deal Rooms
Profile Views

Each metric should contain:

Label
Value
Small contextual status where meaningful

Do NOT make huge cards.

Keep all metrics visually balanced.

==================================================
8. MY BUSINESSES
==================================================

Create a compact "My Businesses" section.

Each business should show:

Business name
Industry
Stage
Verification
Readiness Score
Current status
Primary action

Example:

NovaTech AI
FinTech · Seed
Tier 2
Readiness 78
Active

[View business]

Allow multiple businesses without making each one a giant card.

==================================================
9. AI SUGGESTIONS
==================================================

Create a contextual AI Suggestions section.

This should show recommended:

Investors
Professionals

Each recommendation should contain:

Name
Role
Match Score
Reason for recommendation
Relevant skill/industry overlap
Primary action

Example:

Sarah Chen
Investor

86% Match

Why you're matched:
FinTech + Seed-stage + AI/ML interest

[View profile]

AI-originated information should use the existing cyan visual language.

Do NOT gamify the AI score.

==================================================
10. DEAL ROOMS
==================================================

Show active Deal Rooms in a compact list.

Each row:

Participant
Business
Current stage
Last activity
Next action

Example:

NovaTech AI × Meridian Capital

Negotiation

Last activity:
2h ago

[Open Deal Room]

Do not make this look like a chat inbox.

==================================================
11. RECENT ACTIVITY
==================================================

Add a compact activity timeline/list.

Examples:

Investor viewed NovaTech AI
2h ago

New connection request
5h ago

NDA signed
Yesterday

Milestone updated
2 days ago

Use subtle timestamps.

Avoid excessive icons.

==================================================
12. NEXT ACTION
==================================================

The dashboard should clearly surface the most important next action.

Example:

Complete your profile

"Add your skills and industry interests to improve AI matching."

[Complete profile]

Only one primary next action should dominate.

Do not create multiple competing CTA cards.

==================================================
13. LAYOUT
==================================================

Desktop:

Main content:
approximately 2/3 width

Contextual sidebar:
approximately 1/3 width

Main:

Metrics
My Businesses
Deal Rooms
Recent Activity

Sidebar:

Profile / Verification
AI Suggestions
Next Action

Maintain consistent alignment.

==================================================
14. INFORMATION DENSITY
==================================================

Reduce unnecessary empty space.

Do NOT use:

- giant cards
- oversized headings
- oversized metric numbers
- excessive rounded containers
- decorative dashboard graphics

Use compact professional sections.

Every section must provide useful information.

==================================================
15. VISUAL HIERARCHY
==================================================

Primary:

Next action
Business status
Deal activity

Secondary:

Metrics
AI suggestions

Tertiary:

Recent activity

Do not give every section equal visual weight.

==================================================
16. RESPONSIVE WEB
==================================================

Desktop:
2-column dashboard.

Tablet:
Main content + reduced contextual sidebar.

Mobile:

1-column order:

Header
Profile/verification
Next action
Metrics
Businesses
AI Suggestions
Deal Rooms
Recent Activity

Do NOT simply shrink desktop cards.

==================================================
17. STATES
==================================================

Design:

Normal dashboard
Loading skeleton
No businesses
No deal rooms
No AI suggestions
No recent activity

Empty states should provide useful next actions.

Example:

"No businesses yet"

"Create your first business profile to start discovering investors."

[Create business]

==================================================
18. ROLE-SWITCHING PROTOTYPE
==================================================

Make the prototype demonstrate:

Founder Workspace
↓
Role Switcher
↓
Investor Workspace
↓
Role Switcher
↓
Professional Workspace

The user remains logged into the SAME ACCOUNT.

Profile remains unified across all roles.

Example:

Founder Workspace
→ Profile
→ shows Founder + Investor + Professional information

Investor Workspace
→ Profile
→ same unified profile

Professional Workspace
→ Profile
→ same unified profile

Only the active workspace and role-specific navigation/dashboard change.

==================================================
19. ADMIN EXCLUSION
==================================================

Do NOT include Admin in the normal role switcher.

Admin has a completely separate application experience and separate authentication/provisioning.

Do not show:

Founder
Investor
Professional
Admin

inside one role selector.

Admin must remain isolated from normal user workspaces.

==================================================
20. FINAL QUALITY CHECK
==================================================

✓ Premium fintech/B2B SaaS feel
✓ Compact information density
✓ Clear Founder workspace
✓ Multi-role account model respected
✓ One unified profile
✓ Role-specific workspaces
✓ Role switcher works conceptually
✓ Admin remains completely separate
✓ Clear next action
✓ No oversized cards
✓ No unnecessary decoration
✓ AI suggestions clearly identified
✓ Business status easy to understand
✓ Deal Rooms clearly actionable
✓ Responsive web layout
✓ Loading and empty states included
✓ Consistent with approved Profile and Discovery

IMPORTANT:

Profile is already approved.
Discovery is already approved.

Do NOT modify those approved designs.

ONLY refine the Founder Dashboard and ensure it is consistent with the final multi-role account architecture.