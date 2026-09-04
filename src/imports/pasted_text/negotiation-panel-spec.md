VAULT VENTURES — PROFESSIONAL NEGOTIATION PANEL

IMPORTANT:

This is ADDITIVE ONLY.

Create the missing Professional Negotiation experience for collaboration/deal discussions.

DO NOT redesign or modify any existing approved screen.

Do NOT change:

- Existing Professional Dashboard
- Unified Profile
- Discovery
- Applications
- Business Profile
- Match Score
- Readiness Score
- Deal Room
- Milestone Tracking
- NDA
- Admin Console
- Navigation
- Role architecture
- Existing components
- Existing functions
- Existing visual system

ONLY add the missing Negotiation Panel and its required states.

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

Do NOT introduce another visual style.

==================================================
2. PURPOSE
==================================================

The Negotiation Panel allows relevant participants to discuss and propose collaboration terms before final agreement.

It should feel:

Professional
Structured
Transparent
Collaborative

NOT like a generic chat app.

==================================================
3. NEGOTIATION ENTRY
==================================================

Connect the existing relevant flow:

Application / Collaboration
→ Negotiation

or:

Deal Room
→ Negotiation

Do NOT redesign the Deal Room.

Use the existing Deal Room context.

==================================================
4. NEGOTIATION HEADER
==================================================

Show:

Business Name
Professional / Counterparty
Current Negotiation Status

Example:

NovaTech AI

Professional Collaboration

Negotiation

Also show:

Current version / round where supported.

==================================================
5. TERMS PANEL
==================================================

Create a structured terms section.

Only use terms already supported by the product specification.

Possible examples:

Role / Contribution
Scope of Work
Availability
Compensation
Equity where applicable
Timeline
Milestone Expectations

Do NOT invent additional legal or financial terms.

==================================================
6. COMPENSATION
==================================================

Where compensation is part of the approved workflow:

Allow structured proposal values.

Use:

BDT / ৳

where monetary values are displayed.

Clearly distinguish:

Proposed
Countered
Accepted

Do NOT imply actual payment processing.

==================================================
7. EQUITY
==================================================

If equity is supported by the existing specification:

Show equity as a structured negotiation term.

Clearly label:

Proposed
Counter Proposal
Accepted

Do NOT invent valuation or ownership calculations.

==================================================
8. VERSIONED PROPOSALS
==================================================

Negotiation should support clear proposal versions.

Example:

Proposal #1
Original Terms

Proposal #2
Counter Offer

Proposal #3
Current Proposal

Each version should show:

Created by
Date
Status

Do NOT allow users to become confused about which proposal is current.

==================================================
9. CURRENT PROPOSAL
==================================================

Clearly highlight:

Current Proposal

Show:

Term
Current Value
Proposed By
Last Updated

Primary actions:

Accept

Counter

Decline

Only show actions appropriate to the current user and state.

==================================================
10. COUNTER OFFER
==================================================

Create a focused Counter Offer interaction.

Allow editing only the relevant negotiable fields.

Show:

Original Value
Your Counter Value
Optional Note

Primary:

Send Counter Offer

Secondary:

Cancel

Do NOT require users to recreate the entire proposal.

==================================================
11. PROPOSAL HISTORY
==================================================

Create a compact history.

Example:

Proposal #1
Founder
10:32 AM

Proposal #2
Professional
11:04 AM

Proposal #3
Founder
12:15 PM

Clicking a version:

→ View Terms

Do NOT make history editable.

==================================================
12. STATUS STATES
==================================================

Use appropriate states:

Draft
Proposed
Countered
Accepted
Declined
Expired where supported

Do NOT invent additional negotiation states.

==================================================
13. ACCEPTED TERMS
==================================================

When both parties agree:

Show:

Terms Accepted

✓ Contribution
✓ Compensation
✓ Equity where applicable
✓ Timeline

Then:

Continue to Agreement

Connect to the existing approved Deal / Agreement flow.

Do NOT create a separate contract system.

==================================================
14. DECLINED PROPOSAL
==================================================

If a proposal is declined:

Show:

Proposal Declined

Keep the previous proposal visible in history.

Do NOT delete negotiation history.

==================================================
15. CHAT / COMMENTS
==================================================

If communication is already supported in the Deal Room:

Reuse the existing communication pattern.

Allow contextual notes/comments around negotiation terms where appropriate.

Do NOT create a completely separate messaging system.

==================================================
16. SECURITY / CONFIDENTIALITY
==================================================

Negotiation information must respect:

Staged Disclosure
NDA status
Deal permissions

Do NOT reveal protected terms to unauthorized users.

If NDA is required:

Show:

NDA Required

and connect to the existing NDA flow.

==================================================
17. ROLE-AWARE CONTROLS
==================================================

Professional:

Can create/counter proposals where permitted.

Founder / Counterparty:

Can review/counter/accept where permitted.

Investor:

Only sees negotiation controls relevant to their actual participation.

Admin:

Oversight only.

Do NOT expose participant-only controls to Admin.

==================================================
18. AUDIT / HISTORY
==================================================

Important negotiation actions should have visible timestamps.

Examples:

Proposal created
Counter offer sent
Proposal accepted
Proposal declined

Do NOT replace the Admin Audit Log.

This is participant-facing negotiation history.

==================================================
19. LOADING STATE
==================================================

Create loading states for:

Current proposal
Proposal history
Counter offer submission

Use subtle skeletons.

==================================================
20. ERROR STATE
==================================================

Example:

"Unable to load the current proposal."

[Try Again]

Submission failure:

"Your counter offer could not be sent."

[Try Again]

Do NOT expose technical errors.

==================================================
21. RESPONSIVE WEB
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

Terms + history / communication can use structured columns.

Tablet:

Reduce columns.

Mobile:

Stack:

Header
Current Proposal
Terms
Actions
Proposal History
Comments / Context

Counter Offer should open as a responsive modal / full-screen panel.

No page-level horizontal overflow.

==================================================
22. COMPONENT CONSISTENCY
==================================================

Reuse:

Existing Deal Room components
Existing glass cards
Existing buttons
Existing forms
Existing status indicators
Existing drawers
Existing modals
Existing typography
Existing spacing

Do NOT create unrelated UI.

==================================================
23. IMPORTANT PROTECTION RULE
==================================================

DO NOT:

- Redesign Deal Room
- Redesign Applications
- Redesign Professional Dashboard
- Change NDA
- Change Staged Disclosure
- Add payment processing
- Add unsupported legal features
- Add a separate chat application
- Change role architecture
- Change navigation
- Change existing workflows

ONLY add:

PROFESSIONAL NEGOTIATION PANEL

==================================================
FINAL OBJECTIVE
==================================================

Create a clear negotiation journey:

Application / Deal
↓
Negotiation
↓
Current Proposal
↓
Counter Offer
↓
Proposal History
↓
Accepted Terms
↓
Agreement / Next Deal Stage

The user should always know:

What is being proposed?
Who proposed it?
What is the current version?
What can I do?
What happens next?

Keep the experience premium, compact and professional while preserving the existing Vault Ventures design exactly.