VAULT VENTURES — AUTHENTICATION & ONBOARDING UX FIX

Refine the existing Vault Ventures web design/prototype.

DO NOT redesign the entire product.
DO NOT change the existing visual language.
DO NOT change the product concept.
DO NOT change existing dashboard or navigation design unnecessarily.

Focus ONLY on authentication navigation, onboarding, profile creation, and related user-flow gaps.

==================================================
1. SIGN IN — BACK NAVIGATION
==================================================

The Sign In page currently does not provide a clear way to return to the previous/public experience.

Add a clear but subtle:

"← Back"

navigation at the top-left of the Sign In page.

Behavior:

Sign In → Back → previous/public page

If a previous browser history state exists, preserve that behavior.

Also provide the normal navigation path:

Sign In → Register

Keep this visually secondary to the main Sign In action.

Do NOT make the back button visually dominant.

==================================================
2. SIGN UP / REGISTER — BACK NAVIGATION
==================================================

The Register flow must also provide a clear way to return.

Add:

"← Back"

at the top-left.

For the multi-step registration flow, distinguish between:

BACK TO PREVIOUS STEP

and

EXIT REGISTRATION

Rules:

Step 1:
Back → public landing page

Step 2+:
Back → previous registration step

If the user attempts to leave after entering information, show a lightweight confirmation only when there is meaningful unsaved information.

Do not create unnecessary confirmation modals.

==================================================
3. PROFILE CREATION — REQUIRED ONBOARDING
==================================================

The current experience does not provide a sufficiently complete profile creation flow.

After registration/email verification, users must be guided through profile creation before being treated as fully onboarded.

Create a dedicated onboarding/profile setup flow.

The flow must adapt to the selected role.

Roles:

Founder
Investor
Professional

==================================================
4. FOUNDER PROFILE SETUP
==================================================

Create a structured Founder onboarding flow.

Include appropriate profile information such as:

- Full Name
- Profile Photo
- Short Bio
- Location
- Professional Background
- Founder Experience
- Areas of Interest
- Industry Interests
- Skills
- Contact/profile visibility preferences

Keep the form structured and compact.

Do not turn this into a giant form on one screen.

Use a clear multi-step or section-based flow.

Show progress.

==================================================
5. INVESTOR PROFILE SETUP
==================================================

Create Investor onboarding.

Include:

- Full Name
- Profile Photo
- Bio
- Investor Type
- Investment Interests
- Preferred Industries
- Preferred Business Stage
- Investment Range
- Preferred Location
- Involvement Preference

Keep it structured and professional.

==================================================
6. PROFESSIONAL PROFILE SETUP
==================================================

Create Professional onboarding.

Include:

- Full Name
- Profile Photo
- Short Bio
- Skills
- Skill proficiency
- Experience
- Industry experience
- Availability
- Location
- Remote / On-site preference
- Compensation preference

Use structured fields rather than a giant free-text resume form.

==================================================
7. PROFILE COMPLETION
==================================================

After profile creation, show a concise completion state.

Example:

"Your profile is ready."

Show:

Profile completion
Verification status
Next recommended action

Primary CTA:

"Go to Dashboard"

Secondary CTA:

"View Profile"

Do not make this a celebratory/gamified screen.

Keep it professional.

==================================================
8. ONBOARDING PROGRESS
==================================================

Use a professional stepper/progress indicator.

Example:

Account
→
Profile
→
Verification
→
Complete

For role-specific profile setup, show the relevant sections.

The user must always understand:

- Where they are
- What has been completed
- What remains
- How to go back

==================================================
9. SKIP / COMPLETE LATER
==================================================

If the product rules allow incomplete profiles, provide:

"Complete later"

as a secondary action.

If the profile information is required for a specific feature, clearly explain why it is required.

Do not trap the user inside onboarding.

==================================================
10. PROFILE ACCESS AFTER ONBOARDING
==================================================

After onboarding, the user must be able to access their profile from:

- Avatar/profile menu
- Sidebar where applicable
- Dashboard profile-completion section

Ensure there is always a clear path:

Dashboard → Profile

and:

Profile → Dashboard

==================================================
11. AUTHENTICATION FLOW
==================================================

Make the complete web flow coherent:

Landing
↓
Sign Up
↓
Role Selection
↓
Account Information
↓
Profile Creation
↓
Email Verification
↓
Onboarding Completion
↓
Dashboard

Existing users:

Landing
↓
Sign In
↓
Dashboard

Forgot password:

Sign In
↓
Forgot Password
↓
Reset Password
↓
Sign In

Every screen must have an obvious path forward AND a reasonable way back.

==================================================
12. UX RULE
==================================================

Never leave the user at a dead-end screen.

Every authentication/onboarding screen must answer:

"Where am I?"

"What can I do next?"

"How do I go back?"

"Can I leave this flow safely?"

==================================================
13. DESIGN CONSISTENCY
==================================================

Use the existing Vault Ventures design system.

Do not introduce:

- New colors
- New typography
- New card styles
- New navigation styles
- New visual language

Back buttons should be subtle and consistent.

Forms should remain compact, premium and professional.

Avoid giant cards and excessive whitespace.

==================================================
14. PROTOTYPE
==================================================

Update the Figma prototype connections so these flows are actually clickable.

Test these flows:

Landing → Sign In → Back → Landing

Landing → Sign Up → Back → Landing

Sign Up → Step 1 → Step 2 → Step 3 → Back → Step 2

Sign Up → Profile Creation → Back

Profile Creation → Complete → Dashboard

Dashboard → Profile

Profile → Dashboard

Sign In → Forgot Password → Reset → Sign In

Ensure there are no dead-end screens.

==================================================
FINAL REQUIREMENT
==================================================

Do not regenerate the whole Vault Ventures product.

Fix and refine ONLY:

1. Authentication navigation
2. Back navigation
3. Registration flow
4. Profile creation
5. Onboarding
6. Profile completion
7. Prototype connections

Preserve the existing premium Vault Ventures design.