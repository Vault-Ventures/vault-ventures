VAULT VENTURES — STAGED DISCLOSURE EXPERIENCE

IMPORTANT:

This is ADDITIVE ONLY.

Create the missing Staged Disclosure experience for Business / Opportunity information.

DO NOT redesign or modify any existing approved screen.

Do NOT change:

- Existing Dashboards
- Discovery
- Profile
- Business Profile structure
- Match Score
- Readiness Score
- Applications
- Teams
- Deal Room
- Admin Console
- Authentication
- Navigation
- Existing functions
- Existing components
- Existing visual design

ONLY add the missing Staged Disclosure states and interactions.

==================================================
1. VISUAL SYSTEM — MANDATORY
==================================================

Use the CURRENT Vault Ventures visual system already established in Figma.

MUST preserve:

- Dark atmospheric background
- Cyan → warm rose-gold dichroic gradient
- Premium glassmorphism
- Transparent glass surfaces
- Backdrop blur
- Subtle translucent borders
- Soft inner highlights
- Atmospheric glow
- Existing typography
- Existing spacing
- Existing component language

Do NOT introduce a new visual style.

==================================================
2. PURPOSE
==================================================

Vault Ventures must NOT reveal all sensitive business information immediately.

Business information should become more detailed as trust and relationship progress.

The design must communicate:

WHAT IS VISIBLE NOW
WHAT IS LOCKED
WHY IT IS LOCKED
WHAT UNLOCKS IT

Do NOT make the experience feel restrictive or confusing.

==================================================
3. DISCLOSURE STAGES
==================================================

Use the existing approved staged-disclosure concept.

Stage 1:

Public / Discovery Information

Stage 2:

Connection / Interest-based Information

Stage 3:

Trusted / NDA-protected Information

Do NOT invent additional disclosure stages.

==================================================
4. STAGE 1 — PUBLIC VIEW
==================================================

Before meaningful connection:

Show appropriate high-level information such as:

Business Name
Industry
Short Description
Business Stage
General Location
High-level Problem
High-level Solution
Readiness / Match information where already permitted

Sensitive information should remain protected.

==================================================
5. LOCKED INFORMATION
==================================================

For information that is not yet available:

Show a premium locked glass section.

Example:

Detailed Financial Information

Locked

"Available after the required trust stage is completed."

CTA where appropriate:

View Requirements

Do NOT expose the hidden information behind the lock.

==================================================
6. STAGE 2 — AFTER INTEREST / CONNECTION
==================================================

After the appropriate connection/interest state:

Unlock the approved Stage 2 information.

Examples may include:

Additional Business Details
More Detailed Market Information
Additional Team Context
Relevant Opportunity Information

Only use information already defined by the product specification.

Do NOT reveal Stage 3 confidential information.

==================================================
7. STAGE 3 — NDA / TRUSTED ACCESS
==================================================

After the required NDA/trust condition is satisfied:

Unlock the approved Stage 3 information.

Examples:

Detailed Financial Information
Sensitive Business Information
Detailed Documents
Confidential Deal Information

Show a clear indicator:

NDA Protected

or equivalent approved terminology.

Do NOT expose confidential content before the required condition is met.

==================================================
8. DISCLOSURE PROGRESS
==================================================

Create a compact disclosure progress indicator.

Example:

Stage 1
✓ Available

Stage 2
✓ Unlocked

Stage 3
🔒 NDA Required

The indicator should be informative, not gamified.

==================================================
9. WHY IS THIS LOCKED?
==================================================

Every locked sensitive section should have an understandable explanation.

Example:

"Sensitive information becomes available after the required trust step."

Provide:

Why locked?

→ Small explanatory popover / drawer.

Do NOT use technical language.

==================================================
10. HOW TO UNLOCK
==================================================

For each locked stage, show the appropriate next requirement.

Examples:

Connect
→ Stage 2

NDA
→ Stage 3

Do NOT create fake unlock requirements.

Use only the actual Vault Ventures flow.

==================================================
11. ROLE-AWARE DISCLOSURE
==================================================

Disclosure must respect the current user's role.

Founder:

Controls their own business information according to the approved workflow.

Investor:

Sees investment-relevant information based on disclosure stage.

Professional:

Sees collaboration-relevant information based on disclosure stage.

Admin:

May have appropriate oversight access according to Admin permissions.

Do NOT treat Admin as a normal participant.

==================================================
12. CONNECTION TO MATCH / DISCOVERY
==================================================

From Discovery:

Opportunity
→ Business Details

Business Details should show the correct current disclosure stage.

Do NOT redesign Discovery.

Only add the disclosure behavior to the existing Business / Opportunity experience.

==================================================
13. CONNECTION TO NDA
==================================================

When Stage 3 requires NDA:

Locked Section
→ NDA Required
→ NDA Flow

After both required parties complete the NDA process:

Stage 3
→ Unlocked

Do NOT implement the complete NDA workflow here.

Only connect to the NDA experience.

==================================================
14. PARTIAL ACCESS
==================================================

Do NOT make the entire Business Profile either:

Fully visible
or
Fully hidden.

Use section-level disclosure.

Example:

Overview
✓ Visible

Market Details
✓ Visible

Financial Details
🔒 Locked

Confidential Documents
🔒 Locked

This makes the trust model clear.

==================================================
15. LOCKED DOCUMENTS
==================================================

For confidential documents:

Show:

Document Type
Access Status
Required Stage

Example:

Financial Overview

🔒 NDA Required

Do NOT show the document contents or sensitive preview.

==================================================
16. ACCESS GRANTED STATE
==================================================

When information becomes available:

Show a subtle confirmation.

Example:

"Stage 3 information is now available."

Then reveal the appropriate content.

Do NOT use intrusive celebration animations.

==================================================
17. ACCESS DENIED / RESTRICTED STATE
==================================================

If the user does not have permission:

"This information isn't available to you yet."

Explain the next valid step where applicable.

Do NOT expose sensitive metadata.

==================================================
18. LOADING STATE
==================================================

Create loading states for:

Disclosure status
Permission check
Protected content

Use subtle skeletons.

Do NOT use excessive animation.

==================================================
19. ERROR STATE
==================================================

If access status cannot be determined:

"Unable to verify access right now."

[Try Again]

Do NOT expose technical permission errors.

==================================================
20. RESPONSIVE WEB
==================================================

Design for:

1440px
1280px
1024px
768px
430px
390px
375px

Desktop:

Disclosure sections can use structured columns.

Tablet:

Reduce columns.

Mobile:

Stack:

Business information
Disclosure progress
Available sections
Locked sections
Next action

No page-level horizontal overflow.

==================================================
21. COMPONENT CONSISTENCY
==================================================

Reuse:

Existing glass cards
Existing locked/disabled treatment
Existing buttons
Existing status indicators
Existing typography
Existing modal/drawer patterns

Do NOT create unrelated visual components.

==================================================
22. IMPORTANT PROTECTION RULE
==================================================

DO NOT:

- Redesign Business Profile
- Redesign Discovery
- Redesign Deal Room
- Redesign Match Score
- Redesign Readiness Score
- Change NDA logic
- Change roles
- Change navigation
- Add new disclosure stages
- Reveal sensitive information

ONLY add the missing Staged Disclosure experience.

==================================================
FINAL OBJECTIVE
==================================================

Make Vault Ventures' information-sharing model immediately understandable:

STAGE 1
Public information

↓

STAGE 2
Connection-based information

↓

STAGE 3
NDA-protected information

The user should always understand:

What can I see?
What is locked?
Why is it locked?
What do I need to do next?

The experience must feel:

Secure
Professional
Transparent
Premium

while preserving the existing Vault Ventures design and functionality.