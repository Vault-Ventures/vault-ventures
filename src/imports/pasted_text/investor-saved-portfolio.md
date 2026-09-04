VAULT VENTURES — INVESTOR SAVED OPPORTUNITIES & PORTFOLIO

IMPORTANT:

This is ADDITIVE ONLY.

Create the missing Investor Saved Opportunities and Portfolio / Investment Progress experience.

DO NOT redesign or modify any existing approved screen.

Do NOT change:

- Existing Investor Dashboard
- Discovery
- Investor Preferences
- Business Profile
- Match Score
- Readiness Score
- Applications
- Deal Room
- Unified Profile
- Admin Console
- Navigation
- Role architecture
- Existing functions
- Existing components
- Existing visual system

ONLY add the missing Investor Saved Opportunities and Portfolio experience.

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
2. SAVED OPPORTUNITIES
==================================================

Create an Investor Saved Opportunities experience.

Purpose:

Allow Investors to save promising businesses/opportunities and return to them later.

Use the EXISTING Discovery / Opportunity card design.

Do NOT create a new card style.

==================================================
3. SAVED OPPORTUNITY CARD
==================================================

Each saved item may show:

Business Name
Industry
Business Stage
Short Description
Match Score
Funding Requirement where already supported
Saved Date
Current Status

Primary action:

View Business

Secondary:

Remove from Saved

Do NOT overload the card.

==================================================
4. SAVE / UNSAVE INTERACTION
==================================================

Where the existing Discovery experience already has a save/bookmark capability:

Save
→ Saved

Unsave
→ Removed

The visual state must be immediately clear.

Do NOT create duplicate save systems.

==================================================
5. SAVED FILTERS
==================================================

Allow relevant filtering of saved opportunities.

Examples:

All
Active
Applied / Interested
In Deal
Closed

Only use statuses already supported by the existing product.

Do NOT invent new lifecycle states.

==================================================
6. EMPTY STATE
==================================================

If there are no saved opportunities:

"No saved opportunities yet."

Supporting text:

"Save promising businesses to review them later."

Primary:

Explore Opportunities

Connect to the existing Discovery screen.

==================================================
7. SAVED OPPORTUNITY STATUS
==================================================

If a saved business changes state:

Show the current state clearly.

Example:

Saved
Interest Sent
In Deal Room
Completed

Do NOT let an outdated saved status contradict the actual business/deal state.

==================================================
8. PORTFOLIO / INVESTMENT OVERVIEW
==================================================

Create the missing Investor Portfolio experience.

Purpose:

Give the Investor a clear view of their active and completed investment relationships / simulated investment progress as defined by the product.

IMPORTANT:

If the platform uses simulated investment values, clearly label them as:

Simulated

or

Demo / Simulated

Do NOT imply real financial transactions if the product specification does not support them.

==================================================
9. PORTFOLIO SUMMARY
==================================================

Show compact summary metrics such as:

Active Opportunities
Active Deals
Completed Deals
Portfolio Progress

Only use metrics supported by the product.

Do NOT invent financial performance numbers.

==================================================
10. PORTFOLIO ITEMS
==================================================

Each portfolio item should show:

Business Name
Industry
Stage
Relationship / Deal Status
Current Milestone
Progress
Relevant Match / Readiness information where appropriate

Primary:

View Deal

or:

View Business

depending on state.

==================================================
11. ACTIVE DEALS
==================================================

Show active relationships separately from completed ones.

Example:

Active Deals

Nova Health
Negotiation

Next Milestone:
Market Validation

Progress:
64%

Do NOT create a separate deal-management system.

Connect to the existing Deal Room.

==================================================
12. COMPLETED DEALS
==================================================

Show completed relationships in a compact section.

Each item:

Business
Completion Status
Completion Date where supported
Relevant outcome/progress information

Do NOT fabricate financial returns.

==================================================
13. PORTFOLIO → DEAL ROOM
==================================================

Clicking an active deal:

Portfolio
→ Deal Room

The Deal Room remains the source of truth for detailed deal activity.

Do NOT duplicate the full Deal Room.

==================================================
14. PORTFOLIO → BUSINESS
==================================================

Clicking the business:

Portfolio
→ Existing Business Profile

Preserve Investor context.

Do NOT create duplicate business pages.

==================================================
15. PORTFOLIO PROGRESS
==================================================

Where milestone progress exists:

Show a compact progress indicator.

Example:

Current Milestone
64%

Next Milestone
Market Validation

Connect:

View Progress
→ Existing Milestone Tracking

Do NOT redesign Milestone Tracking here.

==================================================
16. SIMULATED FINANCIAL INFORMATION
==================================================

If financial metrics are shown for demonstration:

Use:

৳ / BDT

and clearly label the information:

Simulated

Do NOT display fake values as real investment performance.

Do NOT imply:

Guaranteed returns
Actual transactions
Real profit
Real portfolio valuation

unless explicitly supported by the product specification.

==================================================
17. SEARCH
==================================================

If the portfolio becomes large:

Provide:

Search Portfolio...

Search by:

Business
Industry
Deal

Keep search compact.

==================================================
18. SORT / FILTER
==================================================

Use only useful existing filters.

Examples:

Active
Completed
Stage
Industry

Do NOT add excessive controls.

==================================================
19. LOADING STATE
==================================================

Create skeleton states for:

Saved Opportunities
Portfolio Summary
Portfolio Items

Do NOT use unnecessary full-page spinners.

==================================================
20. ERROR STATE
==================================================

Example:

"Unable to load your portfolio."

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

Use the existing Investor workspace density.

Tablet:

Reduce columns naturally.

Mobile:

Stack:

Summary
Filters
Saved Opportunities
Active Deals
Completed Deals

Cards become single-column.

No page-level horizontal overflow.

==================================================
22. COMPONENT CONSISTENCY
==================================================

Reuse:

Existing Discovery cards
Existing glass cards
Existing Match Score
Existing progress indicators
Existing Deal Room entry
Existing Business Profile entry
Existing buttons
Existing filters
Existing typography

Do NOT create unrelated components.

==================================================
23. IMPORTANT PROTECTION RULE
==================================================

DO NOT:

- Redesign Investor Dashboard
- Redesign Discovery
- Redesign Investor Preferences
- Redesign Business Profile
- Redesign Deal Room
- Redesign Milestone Tracking
- Change investment logic
- Add real payment functionality
- Add unsupported financial metrics
- Change role architecture
- Change navigation

ONLY add:

SAVED OPPORTUNITIES
+
INVESTOR PORTFOLIO / PROGRESS

==================================================
FINAL OBJECTIVE
==================================================

Create a seamless Investor workflow:

Discover
↓
Save Opportunity
↓
Review Later
↓
Express Interest
↓
Enter Deal Room
↓
Track Progress
↓
View Portfolio

The new screens must feel like a natural extension of the existing Vault Ventures Investor experience and use the exact same premium glassmorphism + dichroic visual language.