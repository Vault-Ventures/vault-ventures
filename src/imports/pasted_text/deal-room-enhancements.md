VAULT VENTURES — COMPLETE DEAL ROOM EXPERIENCE

IMPORTANT:

This is ADDITIVE ONLY.

Extend the EXISTING approved Deal Room design to cover the missing detailed states, communication and document-access behavior.

DO NOT redesign the existing Deal Room.

Do NOT change:

- Existing Deal Room layout
- Existing Deal lifecycle
- Existing Dashboard
- Discovery
- Business Profile
- Profile
- Match Score
- Readiness Score
- Staged Disclosure
- NDA
- Milestone Tracking
- Negotiation
- Admin Console
- Navigation
- Role architecture
- Existing components
- Existing functionality
- Existing visual system

ONLY add the missing Deal Room states and interactions.

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
2. DEAL ROOM STATES
==================================================

Ensure the existing Deal Room can visually represent the complete approved lifecycle:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding Active
→ Completed

The current state must always be obvious.

Use:

Completed
Current
Upcoming

Do NOT redesign the existing lifecycle component.

==================================================
3. DEAL ROOM HEADER
==================================================

Preserve the existing Deal Room header.

Ensure it clearly communicates:

Business
Participants
Current Deal Stage
Confidentiality / NDA status where relevant

Do NOT add unnecessary information.

==================================================
4. DEAL ROOM CHAT / THREAD
==================================================

Add the missing participant communication area.

This is NOT a separate messaging application.

Create a contextual Deal Room conversation.

Show:

Participant avatar
Name
Message
Timestamp

Messages should remain connected to the specific Deal Room.

==================================================
5. MESSAGE STATES
==================================================

Support:

Sent
Received
Pending / Sending
Failed

For failed message:

"Message could not be sent."

[Retry]

Do NOT expose technical errors.

==================================================
6. MESSAGE COMPOSER
==================================================

Create a compact message composer.

Include:

Message input

Primary action:

Send

Optional attachment action only if already supported by the product.

Do NOT add unnecessary messaging features.

==================================================
7. SYSTEM EVENTS
==================================================

Deal Room communication may include contextual system events.

Examples:

NDA completed
Proposal updated
Milestone submitted
Milestone confirmed
Agreement finalized

Use a visually distinct but subtle system-event style.

Do NOT make system events look like normal user messages.

==================================================
8. NEGOTIATION CONNECTION
==================================================

Inside Deal Room:

Negotiation
→ Existing Negotiation Panel

Show the current negotiation state where appropriate.

Do NOT duplicate the entire Negotiation Panel.

==================================================
9. NDA CONNECTION
==================================================

If NDA is incomplete:

Deal Room should clearly show:

NDA Required

→ Review NDA

If completed:

✓ NDA Completed

Do NOT expose protected documents before NDA completion.

==================================================
10. DOCUMENT CENTER
==================================================

Add the missing Deal Room document area.

Show documents relevant to the current deal.

Each document:

Document Name
Type
Date
Access Status

Example:

Business Overview
Available

Financial Information
NDA Protected

Agreement
Pending

==================================================
11. DOCUMENT ACCESS STATES
==================================================

Support:

Available
Locked
NDA Required
Restricted
Pending
Finalized

Do NOT reveal protected previews when access is not permitted.

==================================================
12. DOCUMENT PREVIEW
==================================================

For accessible documents:

Document
→ Preview

Show:

Document title
Document type
Relevant metadata
Preview area

Primary action where appropriate:

View Full Document

Do NOT create an unrelated document-management application.

==================================================
13. LOCKED DOCUMENT
==================================================

For protected content:

Show:

🔒 Confidential Document

"NDA completion is required to access this information."

CTA:

Review NDA

Do NOT show sensitive previews.

==================================================
14. AGREEMENT STATE
==================================================

When the agreement is being finalized:

Show:

Agreement

Status:

Pending
or
Finalized

If finalized:

✓ Agreement Finalized

The finalized agreement should become read-only.

Do NOT allow casual editing after finalization.

==================================================
15. DEAL COMPLETION
==================================================

When the deal reaches:

Completed

Show a clear completion state.

Example:

Deal Completed

Show:

Completion Date
Final Status
Relevant milestone completion
Participant context

Provide:

View Summary

Do NOT invent financial outcomes.

==================================================
16. POST-DEAL REPUTATION
==================================================

After completion, where supported:

Show an appropriate prompt:

Leave Feedback / Reputation

Connect to the existing Reputation experience.

Do NOT create a new reputation system.

==================================================
17. MILESTONE CONNECTION
==================================================

Inside Deal Room:

Milestones
→ Existing Milestone Tracking

Show a compact current milestone summary.

Example:

Current Milestone
Market Validation

64%

Do NOT duplicate the full Milestone Tracking interface.

==================================================
18. STAGED DISCLOSURE CONNECTION
==================================================

Deal Room must respect the existing disclosure stage.

Before NDA:

Protected content remains locked.

After NDA:

Stage 3 content becomes available.

Do NOT create a separate disclosure system.

==================================================
19. ROLE-AWARE ACCESS
==================================================

Founder:

Founder-relevant actions.

Investor:

Investor-relevant actions.

Professional:

Professional-relevant actions.

Admin:

Oversight only.

Admin must NOT become a participant.

Do NOT expose participant-only actions to Admin.

==================================================
20. ACTIVITY / DEAL HISTORY
==================================================

Create a compact Deal Room activity history where appropriate.

Show:

NDA completed
Negotiation updated
Agreement finalized
Milestone submitted
Milestone confirmed
Documents added

Each:

Action
Actor
Timestamp

Do NOT replace Admin Audit Logs.

==================================================
21. EMPTY CHAT STATE
==================================================

If no messages exist:

"No messages yet."

Supporting text:

"Start the conversation with the deal participants."

Keep it compact.

==================================================
22. EMPTY DOCUMENT STATE
==================================================

If no accessible documents exist:

"No documents available yet."

Do NOT show locked documents as available.

==================================================
23. LOADING STATE
==================================================

Create loading states for:

Messages
Documents
Deal activity
Deal status

Use subtle skeletons.

==================================================
24. ERROR STATE
==================================================

Examples:

"Unable to load Deal Room."

[Try Again]

"Document couldn't be loaded."

[Try Again]

"Message couldn't be sent."

[Retry]

Do NOT expose technical errors.

==================================================
25. RESPONSIVE WEB
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

Maintain the existing Deal Room workspace.

Chat / documents / activity can use the existing structured layout.

Tablet:

Reduce secondary panels.

Mobile:

Stack:

Deal Header
Current Stage
Primary Action
Milestone Summary
Documents
Conversation
Activity

Documents and conversation should remain easy to access.

No page-level horizontal overflow.

==================================================
26. COMPONENT CONSISTENCY
==================================================

Reuse:

Existing Deal Room components
Existing glass cards
Existing lifecycle
Existing buttons
Existing drawers
Existing document treatment
Existing message components if available
Existing typography
Existing spacing

Do NOT create a completely different UI.

==================================================
27. IMPORTANT PROTECTION RULE
==================================================

DO NOT:

- Redesign Deal Room
- Change Deal lifecycle
- Change NDA
- Change Staged Disclosure
- Change Milestones
- Change Negotiation
- Add payment processing
- Add unsupported messaging features
- Add external document systems
- Change roles
- Change navigation

ONLY extend the existing Deal Room with:

CHAT
+
DOCUMENT ACCESS
+
COMPLETE DEAL STATES
+
ACTIVITY / COMPLETION STATES

==================================================
FINAL OBJECTIVE
==================================================

The existing Deal Room should feel complete from beginning to end:

Matched
↓
Interest Confirmed
↓
Deal Room
↓
NDA
↓
Protected Information
↓
Negotiation
↓
Agreement
↓
Milestones
↓
Completion
↓
Reputation

The user should always understand:

What stage is this deal in?
What can I access?
Who needs to act?
What happened?
What happens next?

Preserve the existing Deal Room design exactly and only add the missing functionality/state designs.