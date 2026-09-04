Upgrade the existing Vault Ventures project with the complete Phase 9 Admin Governance and Platform Management experience.

IMPORTANT:
Use the existing Vault Ventures project as the baseline.
Build on the existing Phase 0–8 user-facing functionality.
Preserve the current Charcoal + Copper design system.
Do not rebuild existing user-facing features unnecessarily.
Admin is a separate privileged workspace.

GOAL:
Create a complete professional Admin Governance, Trust, Risk-Control, Analytics, and Platform Management workspace.

1. ADMIN IS A SEPARATE WORKSPACE

Admin must NOT be treated as a normal Founder, Investor, or Professional role.

Admin must:
- Have a separate Admin workspace
- Have a separate Admin navigation
- Have a separate Admin dashboard
- Require proper authorization
- Never appear in the normal-user role switcher

Do not expose an "Admin" toggle inside normal-user dashboards.

2. ADMIN DASHBOARD

Create a governance-focused overview showing platform health and oversight information.

Include appropriate high-level metrics such as:
- Total Users
- Active Users
- Pending Verification
- Published Businesses
- Active Applications
- Active Connections
- Active Deals
- Completed Deals
- Open Reports
- Reputation/Trust issues
- Investment activity overview

Keep metrics compact and information-focused.

3. USER MANAGEMENT

Provide Admin controls for:
- View users
- Search users
- Filter users
- View user profile
- View role
- View verification status
- View account status
- Review relevant activity
- Manage account status where authorized

Roles:
- Founder
- Investor
- Professional
- Admin

Do not allow Admin to casually change or impersonate users.

4. VERIFICATION MANAGEMENT

Create an Admin verification review area.

Show:
- Pending verification
- User
- Verification tier requested
- Submitted evidence/status
- Review status
- Review action
- Approval/rejection state

Support:
- Tier 1 Identity Verification
- Tier 2 Track-record Verification

Do not represent verification as full legal KYC.

5. BUSINESS MANAGEMENT

Admin should be able to oversee:
- Businesses
- Business status
- Founder
- Industry
- Funding requirement in BDT
- Publication status
- Relevant trust/risk indicators

Admin oversight should not recreate the Founder business-management workflow.

6. APPLICATION / INTEREST MANAGEMENT

Provide oversight of:
- Applications
- Interest signals
- Connections
- Status
- Relevant participants
- Related business/opportunity

Admin should be able to investigate platform activity where appropriate.

7. TEAM MANAGEMENT

Provide Admin visibility into platform teams/relationships where the existing system supports them.

Show:
- Team members
- Related business
- Roles
- Status
- Relevant activity

Do not create unrelated team functionality.

8. DEAL MANAGEMENT

Provide Admin oversight of deals.

Show:
- Deal
- Participants
- Business
- Current lifecycle stage
- Agreement status
- Investment model
- Milestone status
- Completion status

Deal lifecycle:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding Active
→ Completed

Admin should oversee this lifecycle rather than recreate the Deal Room.

9. INVESTMENT OVERSIGHT

Provide Admin visibility into simulated investment information.

For Micro Investment:
- Investment amount
- Profit/Loss Sharing model
- Relevant agreed terms
- Milestone status

For Large/Standard Investment:
- Investment amount
- Equity/Ownership model
- Relevant agreed terms
- Milestone status

All monetary values must use BDT.

IMPORTANT:
Admin must NOT execute or modify real financial transactions.

10. FINANCIAL REPORTING

Provide governance-level financial reporting/oversight.

Show appropriate:
- Revenue
- Expenses
- Net Profit/Loss
- Investment activity
- Milestone funding activity
- Discrepancy/exception indicators

Use:

Net Profit/Loss = Revenue − Expenses

Do not present guaranteed returns or profits.

Admin may review financial evidence/discrepancies where appropriate.

Do NOT allow Admin to arbitrarily edit financial calculations.

11. REPORTS & RISK

Create a Reports/Risk area for platform governance.

Support visibility into:
- User reports
- Business reports
- Deal-related reports
- Trust/safety issues
- Suspicious or inconsistent activity
- Resolution status

Provide clear states:
- Open
- Under Review
- Resolved
- Dismissed

Do not create intrusive surveillance or off-platform contact monitoring.

12. REPUTATION OVERSIGHT

Provide Admin visibility into reputation-related activity.

Show:
- Reputation records
- Feedback activity
- Completed relationships/deals
- Reported reputation issues
- Relevant verification context

Admin should oversee the reputation system rather than create a second reputation calculation system.

Do NOT automatically modify reputation scores without an authorized governance reason.

13. AUDIT LOGS

Create a professional Audit Logs area.

Show relevant:
- Actor
- Action
- Target
- Timestamp
- Category
- Status/result

Examples:
- Verification reviewed
- Business status changed
- Report resolved
- Deal status action
- Account status action
- Administrative setting change

Audit information should be clear and searchable.

14. ANALYTICS

Create an Admin analytics overview covering appropriate platform-level trends.

Possible areas:
- User growth
- User activity
- Business activity
- Applications
- Connections
- Deals
- Completed deals
- Investment simulation activity
- Verification activity
- Reports

Use professional charts and tables.

Avoid decorative charts that do not communicate useful information.

15. SETTINGS

Create the Admin platform settings area for governance-level configuration.

Keep settings organized and professional.

Do not expose dangerous system controls without appropriate confirmation.

16. SECURITY & RBAC

Admin functionality must visually and structurally communicate privileged access.

Do not:
- Put Admin controls in normal-user navigation
- Allow normal users to access Admin screens
- Expose sensitive documents unnecessarily
- Bypass staged disclosure permissions
- Bypass NDA/document access rules
- Expose private information without a legitimate governance context

Admin oversight does not automatically mean unrestricted access to every sensitive document.

17. STAGED DISCLOSURE OVERSIGHT

Admin should be able to see appropriate disclosure status:

Stage 1 — Teaser
Stage 2 — Extended Information
Stage 3 — NDA
Stage 4 — Full Proposal

Do not redesign or bypass the underlying disclosure system.

18. NDA OVERSIGHT

Admin may view appropriate NDA metadata/status such as:
- NDA version
- Acceptance status
- Parties
- Date/status

Do not create a second NDA system.

19. ADMIN UX

The Admin interface should feel like a governance/control center rather than a generic CRUD dashboard.

Prioritize:
- Trust
- Risk control
- Platform health
- Auditability
- Clear status
- Dense information
- Professional decision-support layout

20. DESIGN

Continue using the existing Charcoal + Copper system.

Use Copper for primary interactions and active states.

Use Trust Gold (#C9A24B) for verification/trust indicators where appropriate.

Keep the Admin UI visually consistent with Vault Ventures while making it clearly distinct as a privileged workspace.

21. EMPTY / LOADING / ERROR STATES

Provide professional states for:
- No pending verification
- No reports
- No active deals
- No audit activity
- No users
- No businesses
- No financial activity
- Data unavailable
- Unauthorized access

22. STRICT SCOPE

Do NOT implement Phase 10 or any future functionality.

Do NOT:
- Create real payment processing
- Create real financial settlement
- Create real equity settlement
- Add brokerage functionality
- Add intrusive off-platform surveillance
- Create new AI functionality
- Replace existing user-facing workflows
- Create duplicate business/deal/reputation systems

FINAL RESULT:

Vault Ventures should have a complete Admin Governance workspace covering:

Dashboard
Users
Verification
Businesses
Applications
Teams
Deals
Investment Oversight
Financial Reports
Reputation Oversight
Reports / Risk
Audit Logs
Analytics
Settings

Admin must remain completely separate from normal Founder, Investor, and Professional workspaces.

The Admin experience should feel like a professional governance and trust-control center, not a basic CRUD dashboard.