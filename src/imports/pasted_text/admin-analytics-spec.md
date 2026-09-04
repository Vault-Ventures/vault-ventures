VAULT VENTURES — ADMIN ANALYTICS

IMPORTANT:

The following screens are already approved and MUST NOT be redesigned:

- Profile
- Discovery
- Founder Dashboard
- Investor Dashboard
- Professional Dashboard
- Deal Room
- Admin Dashboard
- Admin Users
- Admin Verification Queue
- Admin Businesses
- Admin Applications
- Admin Teams
- Admin Deals
- Admin Reputation
- Admin Reports & Disputes
- Admin Audit Logs

Design/refine ONLY:

ADMIN → ANALYTICS

==================================================
1. PURPOSE
==================================================

Create a professional enterprise analytics workspace for Vault Ventures Admins.

Analytics should help Admins understand:

- User growth
- Role distribution
- Business growth
- Verification activity
- Application activity
- Team activity
- Deal activity
- Platform engagement
- Reports and disputes
- Operational trends

IMPORTANT:

Analytics must support decisions.

Do NOT create decorative charts simply to fill space.

==================================================
2. PAGE HEADER
==================================================

Title:

Analytics

Subtitle:

Platform performance, growth and operational insights.

Top-right:

Date Range

Examples:

Last 7 days
Last 30 days
Last 90 days
This Year
Custom

Optional:

[Export Report]

==================================================
3. OVERVIEW METRICS
==================================================

Create a compact metric row:

Total Users
Active Users
Active Businesses
Active Deals

Each metric should show:

Current value
Comparison with previous period where meaningful

Example:

12,482

+8.4%

Do not exaggerate changes.

==================================================
4. USER ANALYTICS
==================================================

Create:

User Growth

Show a clean time-series chart.

Metrics:

New Users
Active Users

Allow switching between:

Daily
Weekly
Monthly

Do NOT use unnecessary 3D charts.

==================================================
5. ROLE DISTRIBUTION
==================================================

Create:

User Role Distribution

Show:

Founder
Investor
Professional

IMPORTANT:

Because one account can have multiple roles, do NOT imply these are mutually exclusive user populations.

Clearly communicate:

"Users may have multiple roles."

Use a clean visualization.

Do NOT include Admin in normal-user role distribution.

==================================================
6. BUSINESS ANALYTICS
==================================================

Create:

Business Growth

Show:

New Businesses
Active Businesses
Verified Businesses

Use a clean trend chart.

Optional breakdown:

Industry

Only include industries actually represented in the product data.

==================================================
7. VERIFICATION ANALYTICS
==================================================

Create:

Verification Activity

Show:

Pending
Approved
Rejected
Needs Information

Use a compact chart or trend visualization.

Also show:

Average Review Volume

where meaningful.

Do not invent unsupported metrics.

==================================================
8. APPLICATION ANALYTICS
==================================================

Create:

Application Activity

Show:

Submitted
Under Review
Accepted
Rejected
Withdrawn

Show trends over time.

Optional:

Application conversion rate

Only if supported by available data.

==================================================
9. DEAL ANALYTICS
==================================================

Create:

Deal Activity

Show the deal lifecycle:

Matched
Interest Confirmed
Deal Room
NDA Signed
Negotiation
Agreement
Milestone Funding Active
Completed

Use a professional funnel or stage visualization.

Do NOT make it look gamified.

Clearly distinguish:

Current active deals
Completed deals

==================================================
10. TEAM ANALYTICS
==================================================

Create:

Team Activity

Show:

New Teams
Active Teams
Completed Teams

Where useful:

Average Team Size

Do not create arbitrary metrics.

==================================================
11. REPORTS & DISPUTES
==================================================

Create:

Trust & Safety Activity

Show:

Open Reports
Resolved Reports
Escalated Cases
High/Critical Cases

Use a trend view where useful.

Do not expose individual sensitive report details inside Analytics.

Analytics should link to:

Reports & Disputes

==================================================
12. PLATFORM ENGAGEMENT
==================================================

Create:

Platform Engagement

Possible supported metrics:

Profile Views
Discovery Activity
Saved Opportunities
Connections
Deal Room Activity

Only show metrics that actually exist in the product.

Do NOT fabricate analytics.

==================================================
13. DATE RANGE BEHAVIOR
==================================================

All charts should respond conceptually to the selected date range.

When:

Last 7 days

show 7-day data.

When:

Last 30 days

show 30-day trend.

When:

Custom

allow:

Start Date
End Date

Provide:

Apply
Cancel

==================================================
14. CHART DESIGN
==================================================

Charts must be:

Clean
Readable
Minimal
Professional

Use:

Line charts
Bar charts
Donut / segmented visualization where appropriate
Funnel where appropriate

Avoid:

3D charts
Excessive gradients
Decorative illustrations
Huge chart containers

Every chart must have:

Clear title
Clear units
Readable labels
Useful legend where required

==================================================
15. TOOLTIP / DETAIL
==================================================

Hovering or selecting a chart data point should show:

Date / period
Metric
Exact value

Example:

Apr 20

New Users
184

Do not overload tooltips.

==================================================
16. COMPARISON
==================================================

Where meaningful, show:

Current Period
Previous Period

Example:

Active Users
12,482
+8.4% vs previous period

Use semantic indicators carefully.

Do not imply causation from correlation.

==================================================
17. TOP INSIGHTS
==================================================

Create a compact:

Key Insights

section.

Examples:

"User growth increased 8.4% compared with the previous period."

"Verification requests increased this week."

"Most active opportunities are currently in Seed stage."

Only display insights when supported by the underlying analytics.

Do NOT invent insights.

==================================================
18. EXPORT
==================================================

Provide:

[Export Report]

Allow export of the currently selected analytics range.

Possible formats:

CSV
PDF

Keep the export interaction compact.

==================================================
19. EMPTY STATE
==================================================

If insufficient data exists:

"Not enough data yet."

Supporting text:

"Analytics will become available as platform activity grows."

Do not show fake charts with fake values.

==================================================
20. LOADING STATE
==================================================

Create skeleton states for:

Metrics
Charts
Insights

Avoid large page-level spinners.

==================================================
21. ERROR STATE
==================================================

Create:

"Analytics couldn't be loaded."

Supporting text:

"Please try again."

[Retry]

Do not expose technical errors.

==================================================
22. RESPONSIVE WEB
==================================================

Desktop:

Multi-section analytics dashboard.

Tablet:

Charts reorganize into fewer columns.

Mobile:

Charts stack vertically.

Metrics become compact horizontal/vertical blocks.

Date range becomes a drawer/popover.

Do NOT create page-level horizontal overflow.

Charts must remain readable on mobile.

==================================================
23. INFORMATION HIERARCHY
==================================================

Primary:

User growth
Business growth
Deal activity
Verification

Secondary:

Applications
Teams
Engagement

Trust & Safety:

Reports
Disputes

Do not give every chart equal visual weight.

==================================================
24. ADMIN CONTEXT
==================================================

This Analytics screen belongs ONLY to Admin.

Do NOT show normal user role switching here.

Do NOT include:

Founder Dashboard
Investor Dashboard
Professional Dashboard

Admin Analytics is platform-level analytics.

==================================================
25. VISUAL QUALITY
==================================================

The Analytics workspace should feel:

Data-driven
Precise
Professional
Enterprise-grade
Information-rich
Easy to scan

Avoid:

- Generic BI dashboard appearance
- Excessive charts
- Decorative graphics
- Giant cards
- Excessive whitespace
- 3D visualizations
- Fake statistics

==================================================
26. PROTOTYPE FLOW
==================================================

Admin Dashboard
↓
Analytics
↓
Select Date Range
↓
View Analytics

Analytics
↓
User Growth
↓
View Detailed Trend

Analytics
↓
Verification Activity
↓
Verification Queue

Analytics
↓
Deal Activity
↓
Deals

Analytics
↓
Trust & Safety
↓
Reports & Disputes

Analytics
↓
Export Report
↓
Select Format
↓
Export

==================================================
27. FINAL QUALITY CHECK
==================================================

✓ Platform-level analytics
✓ Useful operational metrics
✓ Multi-role account model respected
✓ Admin excluded from normal-user role distribution
✓ User growth visible
✓ Business growth visible
✓ Verification analytics visible
✓ Application analytics visible
✓ Deal lifecycle analytics visible
✓ Team analytics visible
✓ Trust & Safety analytics visible
✓ Date range works conceptually
✓ Charts are readable
✓ No fake data presented as real analytics
✓ Empty/loading/error states
✓ Export available
✓ Responsive web
✓ No page-level horizontal overflow
✓ Premium enterprise Admin feel

ONLY design/refine:

ADMIN → ANALYTICS