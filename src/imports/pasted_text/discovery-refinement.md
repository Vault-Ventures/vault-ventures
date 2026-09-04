VAULT VENTURES — DISCOVERY PAGE FINAL REFINEMENT

The Profile page is now approved and should NOT be changed.

Now refine ONLY the Discovery experience.

Do NOT redesign the entire application.
Do NOT modify Profile, Dashboard, Authentication, Deal Room, or Admin.

==================================================
1. DISCOVERY PURPOSE
==================================================

This is a professional investment/opportunity discovery workspace.

It must NOT look like:

- Social media
- E-commerce filters
- Generic search page
- Generic AI dashboard

It should feel like a premium venture/investment research platform.

==================================================
2. PAGE STRUCTURE
==================================================

Desktop layout:

LEFT:
Filter sidebar

CENTER:
Discovery results

TOP:
Search
Search Results / AI Suggestions
Result count
Sort
View switcher

Maintain the existing Vault Ventures application shell.

==================================================
3. FILTER SIDEBAR
==================================================

Keep these filters:

Industry
Stage
Risk
Funding Ask

Each section must have:

- Clear label
- Expand/collapse control
- Selected state
- Reset behavior

Use compact spacing.

Do not make the sidebar unnecessarily wide.

==================================================
4. FUNDING ASK — FIX COMPLETELY
==================================================

The previous Funding Ask implementation was incomplete.

Replace the simple "$0" input treatment with a proper professional range filter.

Display:

FUNDING ASK

Minimum
$100K

Maximum
$5M

Add a dual-handle range slider:

$100K ───────────── $5M

The selected range should be visually obvious.

Allow both:

- Direct numeric input
- Slider interaction

Use proper currency formatting.

==================================================
5. FUNDING PRESETS
==================================================

Add compact preset options:

Under $100K
$100K – $500K
$500K – $1M
$1M – $5M
$5M+

Presets should be optional and visually secondary.

Do not overcrowd the sidebar.

==================================================
6. FUNDING STATES
==================================================

Design:

Default
Minimum only
Maximum only
Both selected
Invalid range
Reset

Invalid example:

"Minimum must be less than maximum."

Use inline validation.

No modal.

==================================================
7. ACTIVE FILTERS
==================================================

When filters are selected, show compact active-filter chips above results.

Example:

FinTech ×
Seed ×
$500K–$1M ×

Add:

Clear all

Do not create oversized chips.

==================================================
8. SEARCH / AI SUGGESTIONS
==================================================

Keep these clearly separated:

SEARCH RESULTS

and

AI SUGGESTIONS

Search Results:
Normal search/filter results.

AI Suggestions:
Ranked by Match Score.

When AI Suggestions is active, clearly communicate:

"Ranked by Match Score"

Do not imply that normal search results are AI-ranked.

==================================================
9. RESULT TABLE
==================================================

Keep the current professional table direction.

Columns:

Business
Industry
Stage
Ask
Readiness
Match
Risk

Improve:

- Column alignment
- Row height
- Typography hierarchy
- Metadata density
- Hover state
- Selected row state

Do not make rows excessively tall.

==================================================
10. BUSINESS ROW
==================================================

Each result should clearly communicate:

Business identity
Short description
Verification tier
Industry
Stage
Funding ask
Readiness
Match
Risk

Verification:

Gold

AI information:

Cyan

Risk:

Semantic status color

Do not use color excessively.

==================================================
11. READINESS
==================================================

Readiness should use a compact horizontal progress indicator.

Example:

78

with a subtle cyan progress bar.

Do not use giant circular gauges in the table.

==================================================
12. MATCH SCORE
==================================================

Match Score should be visually distinct.

Example:

86% Match

Use a compact ring or restrained indicator.

It must feel analytical, not gamified.

==================================================
13. RISK
==================================================

Use compact semantic labels:

Low
Moderate
High

Do not use oversized badges.

==================================================
14. RESULT CONTROLS
==================================================

Top-right:

List view
Grid view

Also include:

Sort by

Examples:

Best Match
Readiness
Newest
Funding Ask

Keep controls compact.

==================================================
15. EMPTY STATE
==================================================

Design a professional empty state:

"No opportunities match your current filters."

Supporting text:

"Try adjusting your filters or expanding your funding range."

Actions:

Clear filters
Adjust funding range

==================================================
16. LOADING STATE
==================================================

Create a skeleton state for:

- Filter results
- Table rows
- Readiness
- Match Score

Avoid a large page-level spinner.

==================================================
17. RESPONSIVE WEB
==================================================

Desktop:

Persistent filter sidebar.

Tablet:

Collapsible filter sidebar.

Mobile:

Filters open in a drawer.

Results become stacked cards or compact rows.

Funding Ask becomes a vertical range control.

Do NOT simply shrink the desktop table.

==================================================
18. SAVE SEARCH
==================================================

Keep:

"Save this search"

as a secondary action.

When clicked, show a compact success state:

"Search saved"

Do not use a large modal.

==================================================
19. FINAL QUALITY CHECK
==================================================

Before finishing:

✓ Funding Ask is fully functional visually
✓ Minimum/Maximum are clear
✓ Range slider is present
✓ Presets are available
✓ Active filters are visible
✓ Clear All exists
✓ Search and AI Suggestions remain distinct
✓ Table is information-dense
✓ Match Score is clear
✓ Readiness is clear
✓ Risk is clear
✓ Verification is clear
✓ Loading state exists
✓ Empty state exists
✓ Responsive web behavior exists
✓ Nothing looks like a generic AI dashboard

IMPORTANT:

Profile is already approved.

Do NOT modify the approved Profile design.

Only refine the Discovery page.