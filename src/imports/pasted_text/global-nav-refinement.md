VAULT VENTURES — GLOBAL NAVIGATION + ROLE SWITCHER FINAL REFINEMENT

IMPORTANT:

This is a CONSISTENCY REFINEMENT pass.

Do NOT redesign the individual approved pages.

Approved areas:

- Profile
- Discovery
- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Deal Room
- Admin Console
- Authentication
- Multi-role onboarding

ONLY refine the shared application shell, navigation, role switching and cross-page behavior.

==================================================
1. ACCOUNT MODEL
==================================================

One normal email = ONE Vault Ventures account.

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

The user has ONE identity and ONE unified Profile.

Do NOT create separate accounts.

==================================================
2. ROLE SWITCHER
==================================================

Create one consistent global Role Switcher.

Location:

Top application header.

Example:

Alex Morgan
Founder ▾

Dropdown:

✓ Founder
  Investor
  Professional

Only show roles selected by the user.

If the user only selected Founder:

Founder

If Founder + Investor:

Founder
Investor

If all three:

Founder
Investor
Professional

Never show unselected roles.

==================================================
3. ROLE SWITCHING BEHAVIOR
==================================================

When switching:

Founder → Investor

Change:

Dashboard
Navigation context
Role-specific opportunities
Role-specific actions
Role-specific workspace

Do NOT change:

Name
Email
Password
Avatar
Cover photo
Unified Profile
Account identity

The user remains logged into the SAME account.

==================================================
4. WORKSPACE LABEL
==================================================

The active role should always be visually clear.

Example:

Founder Workspace

Investor Workspace

Professional Workspace

Do not make users guess which workspace they are currently using.

Use a subtle role indicator in the header.

==================================================
5. GLOBAL NAVIGATION — FOUNDER
==================================================

Founder workspace navigation should focus on Founder activities.

Use the already-approved Founder navigation structure.

Possible structure:

Dashboard
Discovery
Businesses
Applications
Teams
Deal Rooms
Profile

Do NOT add unrelated Investor-only or Professional-only sections.

Preserve the existing approved navigation unless a role-context adjustment is required.

==================================================
6. GLOBAL NAVIGATION — INVESTOR
==================================================

Investor workspace navigation should focus on Investor activities.

Use the already-approved Investor navigation structure.

Possible structure:

Dashboard
Discovery
Saved Opportunities
Deal Rooms
Portfolio
Profile

Do NOT show Founder-only business management sections unless they are relevant to the selected multi-role context.

==================================================
7. GLOBAL NAVIGATION — PROFESSIONAL
==================================================

Professional workspace navigation should focus on Professional activities.

Possible structure:

Dashboard
Discovery
Applications
Deal Rooms
Opportunities
Profile

Keep it focused on professional collaboration.

==================================================
8. UNIFIED PROFILE
==================================================

IMPORTANT:

Profile is NOT role-specific.

Every workspace opens the SAME Profile.

Founder workspace:

Profile
→ Unified Profile

Investor workspace:

Profile
→ Same Unified Profile

Professional workspace:

Profile
→ Same Unified Profile

The unified profile contains all selected-role sections.

Example:

Alex Morgan
Founder · Investor · Professional

About

Founder Information

Investor Information

Professional Information

Verification

Preferences

==================================================
9. PROFILE ROLE SECTIONS
==================================================

If only Founder is selected:

Show Founder information.

If Founder + Investor:

Show:

Founder
Investor

If all three:

Show:

Founder
Investor
Professional

Do NOT show empty role sections for roles the user has not selected.

==================================================
10. ADD ROLE
==================================================

Inside Profile / Settings:

Provide:

[Add Role]

Example:

Current roles:

Founder
Investor

[Add Role]

Available:

Professional

After selecting:

Professional Setup

Then:

Founder + Investor + Professional

The existing account remains unchanged.

==================================================
11. REMOVE ROLE
==================================================

If supported:

Profile / Settings
→ Manage Roles
→ Remove Role

Before removal:

Show confirmation.

Example:

"Remove Investor role?"

Explain:

"You will lose access to the Investor workspace until this role is added again."

Do NOT delete:

Account
Profile
Founder information
Professional information

unless explicitly related to the removed role.

==================================================
12. NAVIGATION STATE
==================================================

When role changes:

The sidebar/navigation should update immediately.

Example:

Founder Workspace

Dashboard
Discovery
Businesses
Applications
Deal Rooms
Profile

Switch to Investor:

Dashboard
Discovery
Saved Opportunities
Deal Rooms
Portfolio
Profile

The user should never see a mixture of unrelated navigation items.

==================================================
13. ACTIVE NAVIGATION
==================================================

Clearly indicate the current page.

Use:

Subtle background
Accent indicator
Clear typography

Do NOT use oversized navigation pills.

==================================================
14. MOBILE NAVIGATION
==================================================

On mobile:

Use a compact mobile navigation pattern.

Role Switcher remains accessible.

Navigation should not hide the active role.

Example:

Investor Workspace ▾

Then:

Dashboard
Discovery
Saved
Deals
Profile
More

Do NOT simply shrink the desktop sidebar.

==================================================
15. GLOBAL HEADER
==================================================

Header should contain:

Vault Ventures branding

Global Search where appropriate

Notifications

Role Switcher

Profile Avatar

Keep it compact.

Do not overcrowd the header.

==================================================
16. NOTIFICATION CONSISTENCY
==================================================

Notifications should be accessible from every normal workspace.

Examples:

New connection
Application update
Verification update
Deal Room activity
New recommendation

Do not create separate notification accounts for each role.

Notifications belong to the same user account.

==================================================
17. ACCOUNT MENU
==================================================

Profile avatar menu:

View Profile
Settings
Manage Roles
Help
Sign Out

Do NOT include Admin Console for normal users.

==================================================
18. ADMIN SEPARATION
==================================================

Admin is completely separate.

Normal Role Switcher:

Founder
Investor
Professional

NEVER:

Founder
Investor
Professional
Admin

Admin authentication leads directly to:

Admin Console

Admin has its own:

Navigation
Header
Permissions
Settings
Dashboard

Do NOT mix Admin navigation with normal-user navigation.

==================================================
19. AUTHENTICATION → WORKSPACE
==================================================

After normal user login:

If one role:

Go directly to that role's workspace.

Example:

Founder only
→ Founder Dashboard

If multiple roles:

Open the user's default workspace.

Example:

Founder + Investor
→ Founder Dashboard

Then allow:

Role Switcher
→ Investor Workspace

If all three:

Open configured/default workspace.

==================================================
20. FIRST-TIME USER
==================================================

If onboarding is incomplete:

Login
↓
Resume onboarding

Do NOT send the user directly to an empty dashboard.

After onboarding is complete:

Login
↓
Default Workspace

==================================================
21. BACK NAVIGATION
==================================================

Authentication and onboarding already have explicit Back controls.

For the main application:

Browser Back should work normally.

Do NOT create navigation loops.

Do NOT trap users inside:

Profile
Settings
Role Setup
Deal Room
Admin pages

==================================================
22. CROSS-PAGE CONSISTENCY
==================================================

Verify these elements remain visually consistent everywhere:

Header
Sidebar
Role Switcher
Avatar
Notifications
Buttons
Page titles
Breadcrumbs
Tabs
Drawers
Modals
Forms
Tables

Do not redesign them individually on each page.

Use one consistent shared design system.

==================================================
23. RESPONSIVE WEB
==================================================

Verify:

1440px
1280px
1024px
768px
390px

At every width:

✓ No content behind sidebar
✓ No page-level horizontal overflow
✓ Role Switcher remains usable
✓ Navigation remains accessible
✓ Header remains readable
✓ Profile remains accessible
✓ Tables reflow correctly
✓ Drawers remain usable

==================================================
24. VISUAL QUALITY
==================================================

The global shell should feel:

Premium
Professional
Consistent
Compact
Information-first

Avoid:

- Giant navigation
- Oversized headers
- Excessive whitespace
- Too many badges
- Unnecessary animations
- Duplicate controls
- Generic SaaS styling

==================================================
25. FINAL PROTOTYPE FLOW
==================================================

NORMAL USER:

Sign In
↓
Founder Workspace
↓
Role Switcher
↓
Investor Workspace
↓
Role Switcher
↓
Professional Workspace
↓
Profile
↓
Unified Profile
↓
Manage Roles
↓
Add Role

ADMIN:

Admin Login
↓
Admin Console
↓
Admin Navigation

There is NO transition from normal user Role Switcher to Admin.

==================================================
26. FINAL QUALITY CHECK
==================================================

✓ One account
✓ Multiple normal roles supported
✓ Unified Profile
✓ Role-specific workspaces
✓ Role-specific navigation
✓ Role Switcher consistent everywhere
✓ Only selected roles appear
✓ Add Role supported
✓ Remove Role safely handled
✓ Notifications belong to one account
✓ Admin completely isolated
✓ Authentication flows into correct workspace
✓ Back navigation works
✓ Mobile navigation works
✓ No horizontal overflow
✓ Shared design system is consistent
✓ No approved page is unnecessarily redesigned

ONLY refine:

GLOBAL NAVIGATION
ROLE SWITCHER
UNIFIED PROFILE BEHAVIOR
CROSS-PAGE CONSISTENCY