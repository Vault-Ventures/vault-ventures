VAULT VENTURES — NDA / CONFIDENTIALITY FLOW

IMPORTANT:

This is ADDITIVE ONLY.

Create the missing NDA / Confidentiality experience required to unlock Stage 3 protected information.

DO NOT redesign any existing approved screen.

Do NOT change:

- Existing Dashboard
- Discovery
- Business Profile
- Profile
- Match Score
- Readiness Score
- Staged Disclosure
- Deal Room
- Admin Console
- Navigation
- Role system
- Existing functions
- Existing components
- Existing visual design

ONLY add the missing NDA flow and its required states.

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
2. NDA ENTRY
==================================================

The NDA flow can be entered from:

Staged Disclosure
or
Deal / Collaboration context

When Stage 3 requires NDA:

Show:

NDA Required

Supporting text:

"Complete the confidentiality agreement to access protected information."

Primary:

Review NDA

==================================================
3. NDA OVERVIEW
==================================================

Create a professional NDA overview screen / drawer.

Show:

NDA / Confidentiality Agreement

Parties
Business
Purpose
Status
Created / requested date

Explain briefly:

Why the NDA is required
What access it enables

Do NOT display unnecessary legal complexity.

==================================================
4. DOCUMENT PREVIEW
==================================================

Provide a clean document preview.

Show:

Agreement title
Parties
Key sections
Terms summary
Effective status

Allow:

View Full Agreement

Do NOT invent legal clauses.

Use placeholder/sample legal text only where necessary for visual design.

==================================================
5. KEY TERMS SUMMARY
==================================================

Before acceptance, show a concise summary of the agreement.

Example categories:

Confidential Information
Permitted Use
Disclosure Restrictions
Duration
Obligations

Keep this as a visual summary.

The full agreement remains accessible through:

View Full Agreement

==================================================
6. ACCEPTANCE
==================================================

Create the acceptance state.

Show:

☐ I have reviewed and agree to the NDA.

Primary:

Accept & Sign

Secondary:

Review Again

Do NOT make acceptance possible without the required acknowledgement.

==================================================
7. SIGNATURE / CONFIRMATION
==================================================

If the existing product specification supports a signature/confirmation step:

show an appropriate confirmation interaction.

Example:

Confirm Acceptance

Name
Role
Date

[Confirm & Sign]

Do NOT invent external e-signature integrations.

==================================================
8. TWO-PARTY ACCEPTANCE
==================================================

IMPORTANT:

NDA access requires the required parties to complete their acceptance.

Show a clear status:

Founder
✓ Accepted

Investor / Counterparty
○ Waiting

or the appropriate participant roles.

Do NOT assume the NDA is complete after only one party accepts.

==================================================
9. WAITING FOR COUNTERPARTY
==================================================

After the current user accepts:

Show:

NDA Accepted

Waiting for the other party to complete the agreement.

Status:

Your acceptance ✓
Counterparty acceptance ○

Provide:

[Back to Deal / Business]

Do NOT falsely unlock Stage 3 yet.

==================================================
10. BOTH PARTIES ACCEPTED
==================================================

When all required parties have accepted:

Show:

NDA Complete

✓ Founder Accepted
✓ Counterparty Accepted

Then:

Stage 3 Access Unlocked

Primary:

View Protected Information

Secondary:

Continue to Deal Room

Do NOT create a fake unlock if the required acceptance is incomplete.

==================================================
11. STAGE 3 CONNECTION
==================================================

Connect:

NDA Complete
→ Staged Disclosure
→ Stage 3 Unlocked

The previously locked information should now become available.

Examples:

Detailed Financial Information
Confidential Business Information
Protected Documents

Do NOT redesign the Staged Disclosure experience.

==================================================
12. NDA STATUS STATES
==================================================

Support the necessary states:

NDA Required
Under Review / Pending Acceptance
Waiting for Counterparty
Accepted by Current User
Fully Accepted
Declined
Expired where supported
Unavailable / Error

Do NOT invent additional lifecycle states.

==================================================
13. DECLINE FLOW
==================================================

If the user chooses to decline:

Show confirmation.

Example:

Decline NDA?

"Declining will prevent access to NDA-protected information."

Actions:

Cancel
Decline

After decline:

NDA Declined

Do NOT unlock Stage 3.

==================================================
14. EXPIRATION / INVALID STATE
==================================================

If an NDA is no longer valid:

Show:

NDA Unavailable / Expired

Explain the appropriate next step if defined by the product.

Do NOT expose protected information.

==================================================
15. ACCESS CONTROL
==================================================

Before full acceptance:

Stage 3 remains locked.

After full acceptance:

Stage 3 becomes available.

The UI must clearly communicate this permission boundary.

Do NOT expose protected document previews before access is granted.

==================================================
16. DOCUMENT ACCESS
==================================================

After NDA completion:

Protected documents may show:

Document Name
Document Type
Access Granted

Before completion:

Document Name
🔒 NDA Required

Do NOT reveal confidential previews before access is granted.

==================================================
17. SECURITY / TRUST INDICATOR
==================================================

Use a subtle trust indicator:

NDA Protected

or

Confidential Access

Do NOT overuse security badges.

The experience should feel professional, not alarming.

==================================================
18. RESPONSIVE WEB
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

Document + status / actions can use a structured layout.

Tablet:

Reduce columns.

Mobile:

Stack:

NDA Header
Parties
Terms Summary
Document
Acceptance
Status
Actions

No page-level horizontal overflow.

==================================================
19. LOADING STATE
==================================================

Create loading states for:

NDA document
NDA status
Acceptance submission
Access verification

Use subtle skeletons.

==================================================
20. ERROR STATE
==================================================

Example:

"Unable to load the NDA."

[Try Again]

For acceptance failure:

"Your acceptance could not be completed."

[Try Again]

Do NOT expose technical errors.

==================================================
21. SUCCESS STATE
==================================================

After successful acceptance:

Show clear confirmation.

Example:

"NDA accepted successfully."

Then show current status:

Waiting for Counterparty

or:

Stage 3 Access Unlocked

depending on the actual state.

==================================================
22. COMPONENT CONSISTENCY
==================================================

Reuse existing:

Glass cards
Buttons
Status indicators
Modals
Drawers
Typography
Progress / lifecycle components

Do NOT create an unrelated legal-document visual style.

==================================================
23. IMPORTANT PROTECTION RULE
==================================================

DO NOT:

- Redesign Staged Disclosure
- Redesign Deal Room
- Change Deal lifecycle
- Change role architecture
- Change navigation
- Invent legal terms
- Invent external e-signature systems
- Automatically unlock Stage 3 after one-party acceptance
- Expose confidential information early

ONLY add the complete NDA experience.

==================================================
FINAL OBJECTIVE
==================================================

Create a clear and trustworthy NDA flow:

Stage 3 Locked
↓
NDA Required
↓
Review Agreement
↓
Accept / Sign
↓
Waiting for Counterparty
↓
Both Parties Accepted
↓
NDA Complete
↓
Stage 3 Unlocked
↓
Protected Information Available

The experience must feel:

Secure
Professional
Transparent
Premium

while preserving the existing Vault Ventures design exactly.