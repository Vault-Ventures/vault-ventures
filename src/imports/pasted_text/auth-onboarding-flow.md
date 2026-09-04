VAULT VENTURES — AUTHENTICATION & MULTI-ROLE ONBOARDING

IMPORTANT:

Do NOT redesign the approved application screens.

The following are already approved:

- Profile
- Discovery
- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Deal Room
- Admin Dashboard
- Admin Users
- Admin Verification
- Admin Businesses
- Admin Applications
- Admin Teams
- Admin Deals
- Admin Reputation
- Admin Reports & Disputes
- Admin Audit Logs
- Admin Analytics
- Admin Settings

This task focuses ONLY on:

Authentication
Registration
Role Selection
Multi-role Onboarding
Profile Creation
Navigation / Back behavior

==================================================
1. ACCOUNT MODEL — CRITICAL
==================================================

Vault Ventures uses ONE normal user account.

One email creates ONE account.

That account may have one or multiple roles:

Founder
Investor
Professional

Examples:

Founder

Founder + Investor

Founder + Professional

Investor + Professional

Founder + Investor + Professional

Do NOT create separate accounts for each role.

Do NOT require different emails for different roles.

==================================================
2. ADMIN IS COMPLETELY SEPARATE
==================================================

Admin is NOT selectable during normal registration.

Do NOT show:

Founder
Investor
Professional
Admin

inside one role-selection screen.

Normal registration supports only:

Founder
Investor
Professional

Admin has a completely separate authentication experience.

==================================================
3. SIGN IN
==================================================

Create a premium Vault Ventures Sign In page.

Fields:

Email
Password

Actions:

[Sign In]

[Forgot Password?]

[Create Account]

Optional:

Show / Hide Password

Keep the design minimal and premium.

==================================================
4. SIGN UP
==================================================

Create:

Create your Vault Ventures account

Fields:

Full Name
Email
Password
Confirm Password

Then:

[Continue]

Do not ask for every profile field immediately.

Keep registration short.

==================================================
5. ROLE SELECTION
==================================================

After basic account registration:

Create:

How will you use Vault Ventures?

Allow MULTIPLE selections.

Options:

Founder
Investor
Professional

Each role should have:

Icon
Role name
Short description

Selection state must be obvious.

Example:

✓ Founder
✓ Investor
○ Professional

Important:

The user can select more than one role.

Primary:

[Continue]

Do NOT force the user to choose exactly one role.

==================================================
6. ROLE SELECTION EXAMPLES
==================================================

Example state:

Founder ✓
Investor ✓
Professional ○

The account now contains:

Founder + Investor

The user does NOT create a second account.

Another valid state:

Founder ✓
Investor ✓
Professional ✓

The account contains all three roles.

==================================================
7. ROLE-SPECIFIC PROFILE SETUP
==================================================

After selecting roles, guide the user through the relevant profile setup.

If Founder selected:

Founder setup

If Investor selected:

Investor setup

If Professional selected:

Professional setup

If multiple roles selected:

Complete each selected role's relevant information.

Do NOT create three separate profiles.

There is ONE unified profile containing role-specific sections.

==================================================
8. FOUNDER SETUP
==================================================

Founder-specific information:

Business / Company
Industry
Business Stage
Founder Experience
Skills
Interests

Only show fields relevant to Founder.

==================================================
9. INVESTOR SETUP
==================================================

Investor-specific information:

Investor Type
Investment Interests
Preferred Industries
Preferred Stage
Investment Range
Location
Involvement Preference

Only show fields relevant to Investor.

==================================================
10. PROFESSIONAL SETUP
==================================================

Professional-specific information:

Skills
Experience
Industry Experience
Availability
Work Preference
Location
Professional Interests

Only show fields relevant to Professional.

==================================================
11. UNIFIED PROFILE
==================================================

After onboarding, the user has ONE profile.

Example:

Alex Morgan

Founder · Investor · Professional

Founder Information
Investor Information
Professional Information

The approved Profile design should display all selected-role information in organized sections.

Do NOT create:

Founder Profile
Investor Profile
Professional Profile

as separate accounts.

==================================================
12. ROLE SWITCHER
==================================================

After login, the application shell contains a global Role Switcher.

Example:

Alex Morgan
Founder ▾

Options:

✓ Founder
  Investor
  Professional

Only show roles actually selected by the user.

If the user selected only Founder:

Founder

If:

Founder + Investor:

Founder
Investor

If all three:

Founder
Investor
Professional

Do NOT show unselected roles.

==================================================
13. ROLE SWITCHING
==================================================

When user switches:

Founder → Investor

Change:

Dashboard
Navigation
Workspace context
Role-specific opportunities
Role-specific actions

Do NOT change:

Account
Email
Password
Unified Profile
Verification identity

The user remains logged into the same account.

==================================================
14. PROFILE ACCESS
==================================================

From every workspace:

Profile

must open the SAME unified Profile.

Founder workspace:

Profile → unified profile

Investor workspace:

Profile → unified profile

Professional workspace:

Profile → unified profile

The profile contains all selected-role information.

==================================================
15. ADD ROLE LATER
==================================================

Allow an existing user to add another role later.

Example:

Current:

Founder

Action:

[Add Role]

Select:

Investor ✓

Then complete Investor-specific setup.

After completion:

Founder + Investor

The original Founder account remains unchanged.

==================================================
16. REMOVE ROLE
==================================================

If role removal is supported visually:

Allow the user to manage selected roles from Settings/Profile.

Before removing a role:

Show confirmation.

Explain that role-specific workspace access will be removed.

Do NOT delete the entire account.

Do NOT delete unrelated role information without explicit product behavior.

==================================================
17. BACK NAVIGATION — IMPORTANT
==================================================

Every authentication/onboarding step must provide a clear way to go back.

Example:

Sign Up
↓
Role Selection
↓
Founder Setup
↓
Investor Setup
↓
Profile Completion

At each step:

[← Back]

must return to the previous step.

The user must NEVER get trapped on:

Sign In
Sign Up
Role Selection
Profile Setup

Do NOT rely only on browser back.

==================================================
18. AUTHENTICATION STATES
==================================================

Design:

Sign In
Sign Up
Forgot Password
Reset Password
Email Verification
Invalid Credentials
Existing Email
Weak Password
Password Mismatch
Loading
Success
Error

Use inline validation where appropriate.

Do NOT use unnecessary modal errors.

==================================================
19. EMAIL VERIFICATION
==================================================

After registration where required:

Show:

Check your email

Supporting text:

"We sent a verification link to your email."

Actions:

[Resend Email]

[Change Email]

[Back to Sign In]

Do not trap the user on this screen.

==================================================
20. FORGOT PASSWORD
==================================================

Flow:

Sign In
↓
Forgot Password
↓
Enter Email
↓
Email Sent
↓
Reset Password
↓
Success
↓
Sign In

Provide clear Back navigation at every stage.

==================================================
21. ONBOARDING PROGRESS
==================================================

For multi-role onboarding, show compact progress.

Example:

Account
✓

Roles
✓

Founder
✓

Investor
2 / 3

Profile
○

Do not make this a huge progress component.

==================================================
22. SKIP / COMPLETE LATER
==================================================

Where fields are optional, allow:

[Complete Later]

Do NOT allow skipping required information.

If incomplete:

Clearly show what remains.

==================================================
23. RESPONSIVE WEB
==================================================

Desktop:

Centered authentication card.

Onboarding:

Focused workspace with compact progress indicator.

Mobile:

Single-column layout.

All fields full width.

Back button always accessible.

Do NOT create horizontal overflow.

==================================================
24. VISUAL QUALITY
==================================================

Authentication should feel:

Premium
Trustworthy
Minimal
Professional
Secure

Use the existing Vault Ventures visual system.

Avoid:

- Generic template login pages
- Huge illustrations
- Excessive gradients
- Excessive text
- Giant cards
- Unnecessary decoration

==================================================
25. PROTOTYPE FLOWS
==================================================

NORMAL USER:

Sign Up
↓
Basic Information
↓
Role Selection
↓
Founder Setup
↓
Investor Setup
↓
Professional Setup
↓
Unified Profile
↓
Founder Workspace

If only Founder selected:

Sign Up
↓
Role Selection
↓
Founder Setup
↓
Unified Profile
↓
Founder Workspace

If Founder + Investor:

Sign Up
↓
Role Selection
↓
Founder Setup
↓
Investor Setup
↓
Unified Profile
↓
Founder Workspace
↓
Role Switcher
↓
Investor Workspace

==================================================
26. ADMIN AUTHENTICATION
==================================================

Create a separate Admin Login entry.

Admin Login:

Email
Password

Do NOT provide:

"Create Admin Account"

Do NOT expose Admin credentials in the UI.

Do NOT include Admin in normal Sign Up.

After successful Admin authentication:

Admin Console

not Founder / Investor / Professional workspace.

==================================================
27. FINAL QUALITY CHECK
==================================================

✓ One email = one normal user account
✓ Multiple normal roles supported
✓ Founder supported
✓ Investor supported
✓ Professional supported
✓ Multiple roles can coexist
✓ One unified profile
✓ Role-specific profile sections
✓ Role-specific workspaces
✓ Global role switcher
✓ Only selected roles appear
✓ Add Role supported
✓ Admin completely separate
✓ Admin not selectable during normal signup
✓ Clear Back navigation
✓ No trapped authentication screens
✓ Email verification flow
✓ Forgot password flow
✓ Responsive web
✓ Premium authentication experience

ONLY design/refine:

AUTHENTICATION + MULTI-ROLE ONBOARDING.