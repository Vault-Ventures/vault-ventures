VAULT VENTURES — DISCOVERY TO DEAL ROOM COMPLETE FLOW QA

IMPORTANT:

This is a FLOW QA + UX REFINEMENT PASS.

Do NOT redesign the approved pages.

Do NOT add new features.

Do NOT change the product architecture.

ONLY fix broken transitions, missing states, incorrect context, navigation issues, responsive problems and inconsistent behavior across:

Discovery
→ Opportunity
→ Application / Interest
→ Team
→ Deal Room

==================================================
1. CORE JOURNEY
==================================================

The complete platform journey should conceptually support:

Discovery
↓
Opportunity / Business Details
↓
Application / Interest
↓
Application Status
↓
Team / Collaboration
↓
Deal Room
↓
Deal Lifecycle

The exact steps may vary by role.

Do NOT force identical actions for Founder, Investor and Professional.

==================================================
2. DISCOVERY
==================================================

Verify Discovery allows the user to:

- Browse opportunities
- Search
- Filter
- Open an opportunity
- Understand why it is relevant
- See the appropriate primary action

The page must clearly communicate:

What is this?
Who is involved?
Why does it matter?
What can I do next?

Do NOT overload Discovery with unnecessary information.

==================================================
3. OPPORTUNITY DETAILS
==================================================

When user selects an opportunity:

Discovery
→ Opportunity Details

The detail page must preserve:

Business
Industry
Stage
Relevant role/context
Readiness where applicable
Match information where applicable
Required skills / interests where applicable
Relevant participants

Primary CTA must be role-appropriate.

Founder:

Apply / Connect where applicable

Investor:

Express Interest / Connect where applicable

Professional:

Apply / Express Interest where applicable

Do NOT show contradictory actions.

==================================================
4. ROLE-AWARE CTA
==================================================

IMPORTANT:

The same opportunity may be viewed by different roles.

Founder view:

Founder-specific action

Investor view:

Investor-specific action

Professional view:

Professional-specific action

The CTA should reflect the CURRENT ACTIVE ROLE.

Do NOT show:

Investor actions inside Founder workspace.

Founder actions inside Professional workspace.

Admin actions inside normal user workspace.

==================================================
5. APPLICATION FLOW
==================================================

For roles using applications:

Opportunity
↓
Apply
↓
Application Form
↓
Review
↓
Submit
↓
Success

The application form should clearly show:

Applicant
Opportunity
Business
Relevant contribution
Relevant skills / experience
Message where applicable

Do NOT ask unnecessary information already available in the unified Profile unless confirmation is required.

==================================================
6. APPLICATION REVIEW
==================================================

Before submission:

Show a clear review state.

Example:

Application for:

NovaTech AI

Role / Contribution:

AI/ML Product Strategy

Applicant:

Alex Morgan

Then:

[Submit Application]

Secondary:

[Back]

The user must be able to return and edit.

==================================================
7. SUBMISSION SUCCESS
==================================================

After submission:

Show:

Application submitted.

Provide:

[View Application]

[Back to Discovery]

Do NOT leave the user on an ambiguous blank state.

==================================================
8. DUPLICATE APPLICATION PREVENTION
==================================================

If the user already applied:

Do NOT show:

[Apply]

again without context.

Instead show:

Applied

or:

Application Under Review

Provide:

[View Application]

Do NOT create duplicate applications accidentally.

==================================================
9. APPLICATION STATUS
==================================================

Use the approved states:

Submitted
Under Review
Accepted
Rejected
Withdrawn

Status must remain consistent across:

Dashboard
Applications
Opportunity
Business context
Admin

Do NOT use different names for the same state.

==================================================
10. APPLICATION → TEAM
==================================================

Where the product flow requires team formation:

Accepted / collaboration confirmed
↓
Team

Team must remain connected to:

Business
Opportunity
Members

Do NOT create an unrelated team record.

==================================================
11. TEAM CREATION
==================================================

If team creation occurs:

Show clearly:

Team Name
Business
Opportunity
Members
Roles / responsibilities

After creation:

Show confirmation.

Provide:

[View Team]

Do NOT force users to recreate information already available.

==================================================
12. TEAM → DEAL ROOM
==================================================

Where a deal is initiated:

Team / collaboration
↓
Deal Room

The Deal Room must preserve:

Business
Participants
Roles
Current stage
Relevant context

The user should immediately understand:

"What deal am I looking at?"

==================================================
13. DEAL ROOM ENTRY
==================================================

When entering Deal Room:

Show a clear header:

Business Name

Participants

Current Deal Stage

Example:

NovaTech AI

Alex Morgan × Sarah Chen

Negotiation

Do NOT make the user reconstruct the context.

==================================================
14. DEAL LIFECYCLE
==================================================

Use the approved lifecycle:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding Active
→ Completed

Clearly distinguish:

Completed
Current
Upcoming

Do NOT gamify the lifecycle.

==================================================
15. ROLE BEHAVIOR INSIDE DEAL ROOM
==================================================

Founder:

Sees Founder-relevant actions.

Investor:

Sees Investor-relevant actions.

Professional:

Sees Professional-relevant actions where applicable.

Admin:

Oversight only.

Admin is NOT a participant.

Do NOT expose participant-only actions to Admin.

==================================================
16. BACK NAVIGATION
==================================================

Every transition must have a clear return path.

Opportunity:

← Back to Discovery

Application:

← Back to Opportunity

Team:

← Back to Application / Collaboration

Deal Room:

← Back to Team / Opportunity

Do NOT trap users inside full-screen workflows.

==================================================
17. DRAWER VS FULL PAGE
==================================================

Use:

Drawer

when the user needs quick contextual inspection.

Use:

Full page

when the user needs a focused workflow.

Do NOT randomly mix interaction patterns for equivalent actions.

==================================================
18. LOADING STATES
==================================================

Design loading states for:

Discovery results
Opportunity details
Application form
Application submission
Team details
Deal Room

Use skeletons where appropriate.

Do NOT use unnecessary page-level spinners.

==================================================
19. ERROR STATES
==================================================

Design clear errors.

Examples:

Opportunity unavailable
Application failed
Team could not load
Deal Room unavailable

Example:

"Unable to load this opportunity."

[Try Again]

Do NOT expose technical errors.

==================================================
20. EMPTY STATES
==================================================

Examples:

No opportunities found.

No applications yet.

No active teams.

No active Deal Rooms.

Each empty state should explain what the user can do next where appropriate.

==================================================
21. RESPONSIVE WEB
==================================================

Test:

1440px
1280px
1024px
768px
390px

Verify:

✓ Discovery remains usable
✓ Filters remain accessible
✓ Opportunity details do not clip
✓ Application form remains readable
✓ Team information stacks correctly
✓ Deal Room does not overflow
✓ Buttons remain accessible
✓ No page-level horizontal scrolling

==================================================
22. MOBILE FLOW
==================================================

At 390px:

Discovery
↓
Opportunity
↓
Apply
↓
Review
↓
Success

must remain a clear single-column journey.

For Deal Room:

Business
Participants
Lifecycle
Main content
Activity

should stack intelligently.

Do NOT shrink everything to fit horizontally.

==================================================
23. CONTEXT PRESERVATION
==================================================

At every transition preserve relevant context.

Example:

NovaTech AI

must remain:

NovaTech AI

through:

Discovery
→ Opportunity
→ Application
→ Team
→ Deal Room

Do NOT suddenly show a different business or generic placeholder.

==================================================
24. DATA CONSISTENCY
==================================================

The same entities must remain consistent:

User
Business
Opportunity
Application
Team
Deal

Names
Statuses
Roles
Verification
Identifiers

must not contradict each other across screens.

==================================================
25. MULTI-ROLE QA
==================================================

Test:

Founder + Investor

Founder:

Discovery
→ Founder action

Switch:

Investor

Investor:

Discovery
→ Investor action

The same account remains logged in.

Do NOT create duplicate applications or profiles because of role switching.

==================================================
26. FINAL PROTOTYPE TEST
==================================================

FOUNDER:

Discovery
↓
Business
↓
Opportunity
↓
Apply / Connect
↓
Application
↓
Team
↓
Deal Room

INVESTOR:

Discovery
↓
Business
↓
Opportunity
↓
Interest
↓
Deal Room

PROFESSIONAL:

Discovery
↓
Opportunity
↓
Apply
↓
Application
↓
Deal Room where applicable

MULTI-ROLE:

Founder
↓
Role Switcher
↓
Investor
↓
Same Account
↓
Same Unified Profile

==================================================
27. FINAL QUALITY CHECK
==================================================

✓ Discovery works
✓ Opportunity details work
✓ Role-specific CTA works
✓ Application flow works
✓ Duplicate application prevented
✓ Application status consistent
✓ Team context preserved
✓ Deal Room context preserved
✓ Deal lifecycle clear
✓ Admin remains oversight-only
✓ Back navigation works
✓ Loading states exist
✓ Error states exist
✓ Empty states exist
✓ Responsive web works
✓ No horizontal overflow
✓ No context loss
✓ No duplicate accounts
✓ No role confusion

==================================================
FINAL OBJECTIVE
==================================================

Make the most important Vault Ventures conversion journey feel completely connected:

DISCOVER
→ UNDERSTAND
→ APPLY / EXPRESS INTEREST
→ COLLABORATE
→ ENTER DEAL ROOM
→ PROGRESS THROUGH DEAL

The user should always understand:

Where they came from
What they are doing
What happened
What happens next
How to go back

ONLY perform this DISCOVERY → DEAL ROOM FLOW QA PASS.