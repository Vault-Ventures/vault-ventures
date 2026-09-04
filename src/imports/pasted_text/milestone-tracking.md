VAULT VENTURES — MILESTONE TRACKING EXPERIENCE

IMPORTANT:

This is ADDITIVE ONLY.

Create the missing Milestone Tracking experience for Founder, Investor and relevant Deal/Business contexts.

DO NOT redesign or modify any existing approved screen.

Do NOT change:

- Existing Dashboards
- Discovery
- Business Profile
- Profile
- Match Score
- Readiness Score
- Staged Disclosure
- NDA
- Deal Room
- Admin Console
- Navigation
- Role architecture
- Existing functions
- Existing components
- Existing visual design

ONLY add the missing Milestone Tracking experience.

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

Milestone Tracking should allow participants to clearly understand:

What milestones exist
Which milestone is active
What has been completed
What is upcoming
What progress has been submitted
What requires confirmation
What happens next

This should feel like a professional progress-management system.

NOT a project-management software clone.

==================================================
3. MILESTONE OVERVIEW
==================================================

Create a dedicated Milestone Tracking view.

Header:

Business / Deal Name

Milestone Progress

Show:

Overall Progress
Current Milestone
Completed Milestones
Upcoming Milestones

Keep the overview compact.

==================================================
4. MILESTONE TIMELINE
==================================================

Create a clear milestone timeline.

Example:

Milestone 01
✓ Completed

Milestone 02
● Active

Milestone 03
○ Upcoming

Milestone 04
○ Upcoming

Use the existing premium glass visual language.

Do NOT make it overly gamified.

==================================================
5. MILESTONE CARD
==================================================

Each milestone should show:

Milestone Name
Description
Target
Status
Progress
Due Date where applicable

Optional:

Related Deliverable

Do NOT invent information that is not defined by the product.

==================================================
6. MILESTONE STATES
==================================================

Support the required states:

Upcoming
Active
Submitted
Awaiting Confirmation
Completed
Disputed where applicable

Use clear labels.

Do NOT rely only on color.

==================================================
7. FOUNDER VIEW
==================================================

Founder should be able to see:

Current milestone
Required target
Progress
Submission status
Next milestone

Where the approved flow allows milestone updates:

Show:

[Submit Progress]

Do NOT add unrelated project-management controls.

==================================================
8. PROGRESS SUBMISSION
==================================================

Create a focused progress submission interaction.

Show:

Milestone
Current Progress
Update / Evidence
Notes where applicable

Primary:

Submit Progress

Secondary:

Cancel

Keep the form compact.

==================================================
9. SUBMITTED STATE
==================================================

After Founder submits progress:

Show:

Progress Submitted

Status:

Awaiting Confirmation

Do NOT immediately mark the milestone as Completed.

==================================================
10. INVESTOR VIEW
==================================================

Investor should see:

Current Milestone
Progress
Submitted Evidence / Update
Status
Relevant notes

When confirmation is required:

Show:

[Confirm Progress]

or the existing approved action.

Do NOT expose Founder-only editing controls.

==================================================
11. CONFIRMATION FLOW
==================================================

Investor confirmation:

Submitted
↓
Review Progress
↓
Confirm
↓
Completed

After confirmation:

Show:

✓ Milestone Completed

Then:

Next Milestone
→ Upcoming / Active according to the approved flow.

==================================================
12. DISPUTED STATE
==================================================

If progress is disputed:

Show:

Milestone
Status: Disputed

Explain:

"Progress requires clarification before this milestone can be completed."

Provide only the appropriate existing action.

Do NOT invent an arbitration system.

==================================================
13. EVIDENCE
==================================================

If milestone evidence is supported:

Show:

Evidence
File / document name
Submission date
Submitted by

Before access is permitted:

respect existing Staged Disclosure / NDA permissions.

Do NOT expose protected information prematurely.

==================================================
14. MILESTONE DETAIL
==================================================

Clicking a milestone should open:

Milestone Detail

Show:

Objective
Target
Current Progress
Status
Evidence
Activity / updates
Relevant confirmation state

Use the existing drawer/detail interaction pattern where appropriate.

==================================================
15. ACTIVITY / HISTORY
==================================================

Show a compact milestone history.

Examples:

Progress submitted
Investor confirmed
Milestone completed
Clarification requested

Each entry:

Actor
Action
Timestamp

Do NOT turn this into a full Audit Log.

Admin Audit Logs remain separate.

==================================================
16. NEXT MILESTONE
==================================================

After completion:

Clearly show:

Next Milestone

with:

Name
Target
Status

This should help users understand what happens next.

==================================================
17. DEAL ROOM CONNECTION
==================================================

From Deal Room:

Milestones
→ Milestone Tracking

From Milestone Tracking:

Back to Deal Room

Do NOT redesign Deal Room.

Only connect the existing workflow.

==================================================
18. BUSINESS PROFILE CONNECTION
==================================================

From Business Profile:

Milestones
→ Milestone Tracking

Show a compact overview in Business Profile if the existing design already contains milestone information.

Do NOT duplicate the entire Milestone Tracking interface there.

==================================================
19. EMPTY STATE
==================================================

If no milestones exist:

"No milestones have been added yet."

For Founder where creation is already supported:

[Add Milestone]

Only show this action where appropriate.

==================================================
20. LOADING STATE
==================================================

Create skeleton loading for:

Milestone overview
Timeline
Milestone detail
Progress submission

Do NOT use unnecessary full-page spinners.

==================================================
21. ERROR STATE
==================================================

Example:

"Unable to load milestone progress."

[Try Again]

For submission:

"Progress could not be submitted."

[Try Again]

Do NOT expose technical errors.

==================================================
22. RESPONSIVE WEB
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

Timeline + details can use structured columns.

Tablet:

Reduce columns naturally.

Mobile:

Stack:

Progress Summary
Current Milestone
Timeline
Milestone Detail
Evidence
Actions
History

No page-level horizontal overflow.

==================================================
23. COMPONENT CONSISTENCY
==================================================

Reuse:

Existing glass cards
Existing progress indicators
Existing status indicators
Existing buttons
Existing drawers
Existing modals
Existing typography
Existing spacing

Do NOT create unrelated components.

==================================================
24. IMPORTANT PROTECTION RULE
==================================================

DO NOT:

- Redesign Deal Room
- Redesign Business Profile
- Change NDA
- Change Staged Disclosure
- Change role architecture
- Change navigation
- Add project-management features
- Add arbitrary milestone states
- Change existing workflows

ONLY add the missing Milestone Tracking experience.

==================================================
FINAL OBJECTIVE
==================================================

Create a clear progression:

Upcoming
↓
Active
↓
Progress Submitted
↓
Awaiting Confirmation
↓
Completed
↓
Next Milestone

The user should always understand:

What is the current milestone?
How much progress has been made?
Who needs to act?
What happens next?

Make it:

Professional
Clear
Information-first
Trustworthy
Premium

while preserving the existing Vault Ventures design exactly.