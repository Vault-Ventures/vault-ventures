VAULT VENTURES — FINAL RESPONSIVE & DEVICE QA PASS

IMPORTANT:

This is a RESPONSIVE QA + REFINEMENT PASS.

Do NOT redesign the product.

Do NOT add new features.

Do NOT change:

- Product concept
- Information architecture
- Role architecture
- Approved layouts
- Approved components
- Navigation meaning
- Existing workflows

ONLY fix responsive layout, spacing, overflow, clipping, stacking and interaction problems across the complete Vault Ventures WEB PLATFORM.

==================================================
1. PLATFORM TYPE
==================================================

Vault Ventures is a RESPONSIVE WEB PLATFORM.

It must feel premium and professional on:

Desktop
Laptop
Tablet
Mobile Web

This is NOT a native mobile app.

Do NOT convert the product into a mobile-app-style interface.

==================================================
2. TARGET VIEWPORTS
==================================================

QA the entire platform conceptually at:

Desktop:

1440 × 900
1280 × 800

Tablet:

1024 × 768
768 × 1024

Mobile:

430 × 932
390 × 844
375 × 812

==================================================
3. GLOBAL RESPONSIVE RULE
==================================================

At every viewport:

✓ No page-level horizontal scrolling
✓ No clipped content
✓ No overlapping components
✓ No text disappearing
✓ No buttons going outside containers
✓ No broken navigation
✓ No inaccessible actions
✓ No fixed-width element breaking the layout
✓ No content hidden behind sticky headers
✓ No modal extending outside viewport

==================================================
4. DESKTOP
==================================================

At 1280px and 1440px:

Use the full desktop experience.

Maintain:

Sidebar
Header
Main content
Secondary panels where appropriate

Prioritize:

Information density
Clear hierarchy
Efficient workspace usage

Do NOT make cards unnecessarily huge.

==================================================
5. TABLET
==================================================

At 1024px:

Allow:

Sidebar reduction
Reduced secondary content
Responsive columns

At 768px:

Sidebar may collapse into:

Menu / drawer

Multi-column sections should intelligently stack.

Do NOT simply shrink desktop elements until they become unreadable.

==================================================
6. MOBILE HEADER
==================================================

At mobile widths:

Header must remain compact.

Maintain access to:

Vault Ventures
Notifications
Role Switcher
Profile

If all elements cannot fit:

Move secondary controls into a menu.

Do NOT hide the Role Switcher completely.

==================================================
7. MOBILE NAVIGATION
==================================================

Use an appropriate mobile navigation pattern.

Primary destinations should remain easy to access.

Example:

Dashboard
Discovery
Deals
Profile
More

Role Switcher must remain accessible.

Do NOT simply squeeze the desktop sidebar into mobile.

==================================================
8. ROLE SWITCHER RESPONSIVENESS
==================================================

Test:

Founder
Founder + Investor
Founder + Investor + Professional

At mobile width:

Role Switcher must remain usable.

Dropdown must not:

- Extend outside viewport
- Become clipped
- Cover critical content permanently

Only selected roles should appear.

Admin must never appear.

==================================================
9. DASHBOARDS
==================================================

Check:

Founder Dashboard
Investor Dashboard
Professional Dashboard

Desktop:

Maintain intended information hierarchy.

Tablet:

Reduce columns.

Mobile:

Stack:

Metrics
Primary action
Activity
Opportunities
Other sections

Do NOT allow dashboard cards to create horizontal overflow.

==================================================
10. DISCOVERY
==================================================

Desktop:

Filters + results + supporting content where already approved.

Tablet:

Filters may collapse.

Mobile:

Use:

Search
Filter button
Results

Filters open inside a drawer / sheet.

Opportunity cards must stack naturally.

Do NOT create a tiny unreadable multi-column Discovery layout.

==================================================
11. PROFILE
==================================================

Desktop:

Cover
Profile photo
Identity
Role information
Main content

Tablet:

Reduce columns.

Mobile:

Stack:

Cover
Profile photo
Name
Headline
Roles
Actions
About
Role sections
Experience
Skills
Portfolio

Cover image must crop intelligently.

Profile photo must remain visible.

No horizontal scrolling.

==================================================
12. MULTI-ROLE PROFILE
==================================================

Test:

Founder

Founder + Investor

Founder + Investor + Professional

The profile must remain readable even when all three role sections exist.

Do NOT create three side-by-side columns on mobile.

Stack them vertically.

==================================================
13. APPLICATION FORMS
==================================================

Desktop:

Professional multi-column form where appropriate.

Tablet:

Reduce columns.

Mobile:

Single column.

All inputs:

Full usable width.

Buttons:

Accessible thumb-sized controls.

Do NOT make fields too narrow.

==================================================
14. TABLES
==================================================

Desktop:

Dense enterprise table.

Tablet:

Hide non-critical columns or provide expansion.

Mobile:

Transform rows into structured cards / stacked records.

Do NOT force users to horizontally scroll the entire page just to read a table.

If contained horizontal scrolling is absolutely necessary:

Keep it INSIDE the table container only.

==================================================
15. DEAL ROOM
==================================================

Desktop:

Maintain the approved Deal Room structure.

Tablet:

Reduce secondary panels.

Mobile:

Stack:

Business Header
Participants
Deal Stage
Primary Actions
Lifecycle
Main Content
Activity

Deal lifecycle must remain readable.

Do NOT squeeze all stages horizontally.

If necessary, use:

Contained horizontal scrolling

ONLY inside the lifecycle component.

Never allow page-level horizontal overflow.

==================================================
16. DRAWERS
==================================================

Desktop:

Use appropriate drawer width.

Tablet:

Reduce width where needed.

Mobile:

Drawer becomes full-screen or near full-screen panel.

Ensure:

Close button accessible
Header visible
Content scrollable
Footer actions reachable

==================================================
17. MODALS
==================================================

Desktop:

Centered modal.

Tablet:

Responsive width.

Mobile:

Use nearly full-width modal / bottom sheet where appropriate.

Ensure:

Title visible
Content readable
Buttons accessible
Close action available

Never let modal content go outside viewport.

==================================================
18. ADMIN CONSOLE
==================================================

Check:

Dashboard
Users
Verification
Businesses
Applications
Teams
Deals
Reputation
Reports
Audit Logs
Analytics
Settings
Notifications

Desktop:

Dense enterprise workspace.

Tablet:

Sidebar collapse + responsive tables.

Mobile:

Navigation drawer
Stacked content
Responsive tables
Full-screen detail drawers

Do NOT make Admin look like a mobile app.

==================================================
19. ADMIN TABLES
==================================================

At mobile width:

Convert major Admin tables into structured records.

Each record should prioritize:

Primary identity
Status
Important metadata
Primary action

Secondary metadata may move inside:

View Details

Do NOT make every column visible at once.

==================================================
20. ADMIN ANALYTICS
==================================================

Desktop:

Charts may use multiple columns where appropriate.

Tablet:

Reduce chart columns.

Mobile:

Stack charts vertically.

Chart labels must remain readable.

Do NOT shrink charts until labels become unusable.

==================================================
21. ADMIN SETTINGS
==================================================

Desktop:

Settings navigation + content.

Tablet:

Collapsible settings navigation.

Mobile:

Settings categories become a list.

Selecting a category opens the relevant settings panel.

Forms become single-column.

==================================================
22. NOTIFICATIONS
==================================================

Desktop:

Notification list + detail where appropriate.

Tablet:

List + drawer.

Mobile:

Single-column list.

Notification details:

Full-screen panel or bottom sheet.

No horizontal overflow.

==================================================
23. TYPOGRAPHY RESPONSIVENESS
==================================================

Do NOT simply use the same huge typography at every breakpoint.

Adjust:

Page headings
Section headings
Body text
Metadata

while preserving the same hierarchy.

Do NOT make mobile text unnecessarily tiny.

==================================================
24. SPACING RESPONSIVENESS
==================================================

Desktop:

Generous but controlled spacing.

Tablet:

Reduce spacing.

Mobile:

Compact but comfortable spacing.

Avoid:

Huge mobile gaps
Tiny touch targets
Crowded forms

==================================================
25. TOUCH TARGETS
==================================================

On mobile:

Buttons
Links
Tabs
Icon controls
Navigation items

must have comfortable touch areas.

Do NOT place critical actions too close together.

==================================================
26. IMAGE RESPONSIVENESS
==================================================

All images must:

Maintain aspect ratio
Crop intentionally
Avoid distortion

Especially:

Profile photo
Cover photo
Business images
Opportunity images
Portfolio images

==================================================
27. LONG TEXT
==================================================

Test long:

Names
Business names
Role combinations
Headlines
Descriptions
Case titles

Ensure:

No accidental overflow
No broken containers

Use:

Wrapping
Ellipsis
Expandable text

where appropriate.

==================================================
28. EMPTY / ERROR / LOADING STATES
==================================================

Every major responsive page must maintain readable:

Empty states
Loading states
Error states

Do not allow these states to become oversized or broken on mobile.

==================================================
29. RESPONSIVE INTERACTION QA
==================================================

Verify:

Dropdowns
Tabs
Drawers
Modals
Tooltips
Date pickers
Filters
Search
Role Switcher

All must remain usable at mobile width.

If a desktop hover interaction does not work on touch:

Provide an appropriate tap interaction.

==================================================
30. FINAL DEVICE JOURNEYS
==================================================

Test conceptually:

390px:

Sign In
→ Dashboard
→ Discovery
→ Opportunity
→ Application
→ Profile
→ Role Switcher
→ Deal Room

768px:

Dashboard
→ Discovery
→ Application
→ Team
→ Deal Room

1440px:

Full platform navigation
→ All major workflows

Admin:

390px
→ Admin Login
→ Admin Dashboard
→ Users
→ Verification
→ Reports
→ Audit Logs
→ Settings

==================================================
31. FINAL RESPONSIVE QUALITY CHECK
==================================================

✓ Desktop works
✓ Laptop works
✓ Tablet works
✓ Mobile web works
✓ No page-level horizontal overflow
✓ No clipped text
✓ No clipped images
✓ No broken cards
✓ No broken tables
✓ No broken drawers
✓ No broken modals
✓ Role Switcher works
✓ Navigation works
✓ Profile works
✓ Deal Room works
✓ Admin Console works
✓ Forms remain usable
✓ Touch targets are comfortable
✓ Typography remains readable
✓ Spacing remains intentional

==================================================
32. FINAL RULE
==================================================

DO NOT redesign.

DO NOT add features.

DO NOT create new pages.

DO NOT convert the website into a mobile app.

ONLY:

Fix
Reflow
Resize
Stack
Collapse
Adapt
Polish

==================================================
FINAL OBJECTIVE
==================================================

Vault Ventures must feel like a premium RESPONSIVE WEB PLATFORM at every major screen size.

Desktop should feel powerful.

Tablet should feel comfortable.

Mobile web should feel usable.

The product must never feel like a desktop website that was simply squeezed into a phone.

ONLY perform the FINAL RESPONSIVE & DEVICE QA PASS.