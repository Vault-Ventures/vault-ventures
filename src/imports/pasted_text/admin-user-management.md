VAULT VENTURES — ADMIN USERS MANAGEMENT

IMPORTANT:

The Admin Console foundation is already established.

Do NOT redesign the Admin Dashboard.
Do NOT modify the approved normal-user screens.
Do NOT modify Profile, Discovery, Founder Dashboard, Investor Dashboard, Professional Dashboard, or Deal Room.

Design/refine ONLY:

ADMIN → USERS

==================================================
1. PURPOSE
==================================================

Create a professional enterprise User Management workspace.

The Admin should be able to:

- Find users
- Review users
- Understand their roles
- See verification status
- See account status
- Review flags
- Open user details
- Suspend users where appropriate
- Restore suspended users
- Review audit history

This is an operational Admin interface.

It must feel like a serious enterprise control console.

==================================================
2. PAGE HEADER
==================================================

Title:

Users

Subtitle:

Manage platform accounts, roles, verification and account status.

Top-right actions:

[Export CSV]

Keep actions compact.

==================================================
3. SEARCH + FILTER BAR
==================================================

Create a professional filter toolbar.

Search:

Search by name or email...

Filters:

Role
Verification
Account Status
Flags
Joined Date

Optional:

Last Active

Also include:

Clear filters

Do NOT make filters oversized.

==================================================
4. USER TABLE
==================================================

Create a dense professional table.

Columns:

User
Roles
Email
Verification
Account Status
Joined
Last Active
Flags
Actions

Example:

Alex Morgan
Founder · Investor · Professional
alex@novatech.ai
Tier 1
Active
Jan 5, 2024
1h ago
0

[View]

==================================================
5. MULTI-ROLE DISPLAY
==================================================

IMPORTANT:

A single user may have multiple roles.

Examples:

Founder

Investor

Founder · Investor

Investor · Professional

Founder · Investor · Professional

Display all roles clearly within ONE user row.

Do NOT create duplicate user rows for different roles.

Do NOT treat each role as a separate account.

Use compact role indicators.

The Admin should immediately understand:

"This is one account with multiple workspaces."

==================================================
6. VERIFICATION
==================================================

Show:

Unverified
Tier 1
Tier 2

Use the existing Vault Ventures verification visual language.

Gold is reserved for verification.

Do not make verification visually dominant over the user identity.

==================================================
7. ACCOUNT STATUS
==================================================

Use:

Active
Pending
Suspended
Restricted

Use restrained semantic indicators.

Do not rely only on color.

==================================================
8. FLAGS
==================================================

If a user has flags:

Show a compact indicator.

Example:

⚠ 2 flags

If no flags:

0

Clicking flags should open the user detail context.

Do not make flags look like decorative badges.

==================================================
9. USER ROW ACTIONS
==================================================

Primary:

View

Secondary actions may include:

Review
Suspend
Restore

Only show actions appropriate to the current account state.

Do NOT expose dangerous actions unnecessarily.

==================================================
10. USER DETAIL DRAWER
==================================================

Clicking a user should open a professional Admin Detail Drawer.

Do NOT immediately navigate away unless necessary.

Drawer should show:

PROFILE

Name
Profile photo
Headline
Location
Member since

ROLES

Founder
Investor
Professional

Show all selected roles.

VERIFICATION

Current tier
Verification status
Verification history

ACCOUNT

Email
Account status
Created date
Last active

ACTIVITY

Recent activity

FLAGS / REPORTS

Current flags
Related reports

REPUTATION

Current reputation
Relevant status

==================================================
11. ROLE-SPECIFIC INFORMATION
==================================================

If a user has multiple roles, show role-specific information in expandable sections.

Example:

FOUNDER
Business
Industry
Stage
Readiness

INVESTOR
Investment interests
Preferred stage
Investment range

PROFESSIONAL
Skills
Experience
Availability

Do NOT merge unrelated role data into one confusing block.

==================================================
12. ADMIN ACTIONS
==================================================

Available actions should depend on state.

Examples:

View Profile
Review Verification
Suspend Account
Restore Account
View Audit History

For high-impact actions:

Show confirmation dialog.

Example:

Suspend Account?

Explain:

- What will happen
- Which account is affected
- Whether the action can be reversed

Require explicit confirmation.

==================================================
13. AUDIT HISTORY
==================================================

Inside the detail drawer include:

Audit History

Examples:

Verification approved
Apr 20 · 15:42

Profile reviewed
Apr 19 · 12:30

Account status changed
Apr 18 · 09:15

Keep timestamps and actor information visible.

Provide:

[View full audit history]

==================================================
14. BULK SELECTION
==================================================

Support table row selection.

Provide:

Select all
Individual selection

Bulk actions should be conservative.

Possible:

Export selected
Review selected

Do NOT provide destructive bulk actions unless clearly required by the product specification.

==================================================
15. EMPTY STATE
==================================================

If no users match filters:

"No users found."

Supporting text:

"Try adjusting your search or filters."

[Clear filters]

==================================================
16. LOADING STATE
==================================================

Create table skeleton loading.

Do NOT use a large page spinner.

==================================================
17. RESPONSIVE WEB
==================================================

Desktop:

Dense full table.

Tablet:

Reduce non-critical columns.

Mobile:

Transform table rows into structured user cards.

Show:

User
Roles
Verification
Status
Flags
Primary action

Filters become a drawer.

User detail becomes a full-screen panel.

Do NOT create horizontal page overflow.

==================================================
18. SECURITY
==================================================

Do NOT display:

Passwords
Authentication secrets
Sensitive credentials

Never expose admin credentials.

Use only safe account metadata.

==================================================
19. VISUAL QUALITY
==================================================

Admin Users must feel:

Precise
Operational
Secure
Enterprise-grade
Information-dense

Avoid:

- Giant cards
- Excessive whitespace
- Decorative graphics
- Excessive badges
- Social-media-style profile cards
- Generic SaaS template appearance

Use tables, drawers, filters and structured information.

==================================================
20. PROTOTYPE FLOW
==================================================

Create:

Admin Dashboard
↓
Users
↓
Search / Filter
↓
Select User
↓
User Detail Drawer
↓
View Role Information
↓
View Verification
↓
View Audit History

Also:

User Detail
↓
Suspend
↓
Confirmation
↓
Suspended

and:

User Detail
↓
Restore
↓
Confirmation
↓
Active

==================================================
21. FINAL QUALITY CHECK
==================================================

✓ One user can have multiple roles
✓ Roles are shown together
✓ No duplicate accounts per role
✓ Verification is clear
✓ Account status is clear
✓ Flags are visible
✓ Search works conceptually
✓ Filters are usable
✓ Detail drawer is comprehensive
✓ Role-specific information is organized
✓ Dangerous actions have confirmation
✓ Audit history exists
✓ Responsive web works
✓ No page-level horizontal overflow
✓ Enterprise-grade Admin feel
✓ Existing Admin Dashboard remains unchanged

ONLY design/refine:

ADMIN → USERS

Do not modify any other screen.