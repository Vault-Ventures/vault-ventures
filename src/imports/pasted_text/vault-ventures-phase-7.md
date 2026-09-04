Upgrade the existing Vault Ventures project with the complete Phase 7 Interest, Application, Connections, Deal Room, Negotiation, Agreement, and Investment Simulation experience.

IMPORTANT:
Use the existing Vault Ventures project as the baseline.
Build directly on the existing Phase 6 Staged Disclosure and NDA experience.
Preserve the current Charcoal + Copper design system.
Do not rebuild working screens unnecessarily.
Do not implement Phase 8 Reputation or Phase 9 Admin in this step.

GOAL:
Complete the collaboration and deal lifecycle after users discover an opportunity and progress through disclosure.

1. INTEREST

Create the appropriate interest flow for Investors and Professionals.

Investor:
- Express interest in a business
- View interest status
- See whether the Founder has responded

Professional:
- Apply to a business/opportunity
- View application status

Do not duplicate the Phase 6 disclosure relationship unnecessarily.

2. MUTUAL INTEREST

For Investor ↔ Founder relationships:

Show clear states:
- Interest Sent
- Waiting for Founder
- Founder Interested
- Mutual Interest
- Declined

A Connection should be created only when mutual interest is confirmed.

3. PROFESSIONAL APPLICATION STATUS

For Professional applications, provide the richer application progression:

Applied
→ Under Review
→ Interview / Negotiation
→ Offer
→ Joined
→ Declined

Show the current status clearly.

4. CONNECTIONS

Create the Connections experience.

Show:
- Connected user
- Role
- Business/opportunity context
- Connection status
- Relevant actions

Connections must represent genuine mutual interest/application outcomes.

Do not create connections merely because users viewed each other.

5. DEAL ROOM

When a valid connection progresses to a deal, provide a dedicated Deal Room.

The Deal Room should organize:
- Participants
- Business/opportunity information
- Shared documents
- Discussion/communication area
- Negotiation status
- Agreement status
- Investment status where applicable

Keep the workspace professional and information-dense.

6. DEAL LIFECYCLE

Represent the deal lifecycle clearly:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding Active
→ Completed

Do not allow the UI to imply that a later stage is active prematurely.

7. NDA CONTINUITY

Use the existing Phase 6 NDA as the same underlying NDA event.

DO NOT create a second separate Deal Room NDA.

If the NDA was already completed during the disclosure process, show it as completed inside the Deal Room.

8. NEGOTIATION

Provide a professional negotiation workspace.

Show:
- Current negotiation status
- Proposed terms
- Counter-proposal state
- Participants
- Relevant documents
- Activity/history

Do not create real legal contract execution.

9. AGREEMENT

Provide an Agreement stage after negotiation.

Show:
- Agreement status
- Key agreed terms
- Parties
- Date/status
- Agreement document where applicable

The UI should make clear that the agreement is part of the platform workflow.

10. INVESTMENT MODEL

Support the two defined simulated investment models:

MICRO INVESTMENT:
→ Profit/Loss Sharing

LARGE / STANDARD INVESTMENT:
→ Equity / Ownership

Clearly distinguish the two models in the Deal Room.

Do not replace this with a generic investment type.

11. MICRO INVESTMENT

For Micro Investment, show simulated:
- Investment amount
- Profit/Loss sharing terms
- Relevant agreed percentage/terms
- Milestone status
- Revenue/expense/profit-loss information where applicable

Do not imply guaranteed returns.

12. LARGE / STANDARD INVESTMENT

For Large/Standard Investment, show simulated:
- Investment amount
- Equity/ownership terms
- Ownership percentage where applicable
- Agreed terms
- Milestone status

Do not implement real equity settlement.

13. MILESTONE FUNDING

Provide milestone-based simulated funding tracking.

Show:
- Milestone name
- Target
- Status
- Funding amount
- Progress
- Evidence/status where applicable

Use clear states:
- Upcoming
- In Progress
- Submitted
- Approved
- Completed

14. PROFIT / LOSS

For Micro Investment reporting, use:

Net Profit/Loss = Revenue − Expenses

Clearly label:
- Revenue
- Expenses
- Net Profit/Loss

Never display guaranteed profit or guaranteed return language.

15. SIMULATION BOUNDARY — VERY IMPORTANT

All investment functionality is SIMULATED.

Do NOT implement:
- Real payments
- Payment gateway
- Bank integration
- Escrow
- Custody
- Real equity settlement
- Brokerage functionality
- Real financial transaction execution

Clearly communicate "Simulation" where appropriate.

16. DEAL STATUS UI

Every Deal Room should make the current state obvious.

Use a compact lifecycle/progress component.

Users should understand:
- Current stage
- Completed stages
- Next stage
- Required action

17. DOCUMENT ACCESS

Continue respecting the Phase 6 staged-disclosure permissions.

Do not expose Stage 3/4 documents simply because a Deal Room exists.

Maintain appropriate document permissions.

18. RESPONSIVE DESIGN

Ensure:
- Connections
- Applications
- Deal Rooms
- Negotiation
- Investment/Milestone views

remain usable on desktop, tablet, and mobile.

19. EMPTY / LOADING / ERROR STATES

Provide professional states for:
- No connections
- No applications
- No active deals
- Waiting for response
- Negotiation pending
- Agreement pending
- Investment simulation pending
- Milestone pending
- Access denied

20. STRICT PHASE BOUNDARY

DO NOT implement:
- Reputation scoring
- Reviews/feedback logic beyond what is necessary to complete the deal flow
- Admin governance
- Admin financial oversight
- New AI functionality

Those belong to later phases.

FINAL RESULT:

The complete user journey should feel coherent:

Discover
→ Interest/Application
→ Mutual Interest / Application Progress
→ Connection
→ Deal Room
→ NDA
→ Negotiation
→ Agreement
→ Simulated Investment
→ Milestones
→ Completed

Support both:

Micro Investment → Profit/Loss Sharing

Large/Standard Investment → Equity/Ownership

Keep everything simulated, transparent, professional, and consistent with the existing Vault Ventures product.