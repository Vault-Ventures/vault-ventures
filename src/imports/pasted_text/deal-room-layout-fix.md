VAULT VENTURES — DEAL ROOM LAYOUT / OVERFLOW FIX

IMPORTANT:
Do NOT redesign the Deal Room.
Do NOT change its information architecture, functionality, colors, typography, or approved visual language.

Fix ONLY the current layout, sizing, overflow, and responsive behavior.

CURRENT PROBLEM:

The Deal Room content is being clipped behind/next to the left sidebar.

Important content such as:

- Deal lifecycle
- Business information
- Readiness
- Match Score
- Dates
- Funding amount
- NDA status
- Disclosure stages
- Main workspace content

is partially hidden or cut off.

There is also unwanted horizontal overflow.

==================================================
1. MAIN CONTENT MUST NEVER BE CLIPPED
==================================================

The authenticated application shell has a fixed left sidebar.

The Deal Room main content must begin AFTER the sidebar.

Never allow Deal Room content to render underneath the sidebar.

Desktop structure:

[ SIDEBAR ] [ MAIN DEAL ROOM CONTENT ]

The main content area must use:

width: remaining viewport width

not:

fixed width that exceeds the available viewport.

==================================================
2. RESPONSIVE WIDTH
==================================================

The Deal Room must adapt to the available viewport.

Use:

min-width: 0

for flexible content containers where necessary.

Prevent child components from forcing horizontal overflow.

Long text must wrap appropriately.

Tables and panels must remain inside the available content area.

==================================================
3. DEAL LIFECYCLE
==================================================

The lifecycle stepper currently gets clipped.

Make it responsive.

Desktop:

Matched
→ Interest Confirmed
→ Deal Room
→ NDA Signed
→ Negotiation
→ Agreement
→ Milestone Funding
→ Completed

If all steps cannot fit horizontally:

Allow the stepper to become horizontally scrollable INSIDE its own contained area.

Do NOT make the entire page horizontally scroll.

Alternative:

Collapse labels while preserving the step indicators.

The user must still be able to understand the current stage.

==================================================
4. DEAL ROOM MAIN CONTENT
==================================================

Use the existing Deal Room structure:

LEFT:
Participant / deal summary

CENTER:
Main workspace

RIGHT:
Activity / timeline

However, these columns must adapt.

Desktop:

3-column layout.

Tablet:

Left summary + main content
Right activity becomes collapsible/drawer.

Mobile:

Single column.

Order:

Deal summary
Lifecycle
Main workspace
Activity

Do NOT force the 3-column desktop layout onto small screens.

==================================================
5. DEAL SUMMARY
==================================================

The deal summary must remain completely visible.

Show:

Business
Participant
Industry
Stage
Funding Ask
Readiness
Match Score
Risk
Verification

Do not allow these values to be clipped.

If horizontal space becomes limited:

Stack metadata vertically.

Example:

Funding Ask
$600,000

Readiness
78

Match
86%

Risk
Moderate

Do NOT squeeze everything into one horizontal row.

==================================================
6. IMPORTANT NUMBERS
==================================================

Financial and score information must always remain readable.

Examples:

$600,000
78 Readiness
86% Match

Never truncate these into partial values.

Use responsive wrapping/stacking.

==================================================
7. DATES AND TIMELINE
==================================================

Dates must remain fully visible.

Example:

Mar 14, 2024
Mar 21, 2024

Do not force dates into narrow columns.

Use vertical timeline rows when necessary.

==================================================
8. DISCLOSURE STAGES
==================================================

The disclosure stages:

Teaser
Extended Information
NDA
Full Proposal

must remain visible.

On narrow layouts:

Stack them vertically.

Example:

✓ Teaser
✓ Extended Information
→ NDA
🔒 Full Proposal

Do NOT allow the last stages to be clipped off-screen.

==================================================
9. HORIZONTAL OVERFLOW RULE
==================================================

IMPORTANT:

The entire Deal Room page must NOT require horizontal browser scrolling.

Only individual components may use contained horizontal scrolling when absolutely necessary.

Never allow:

- page-level horizontal overflow
- content behind sidebar
- clipped buttons
- clipped tables
- clipped lifecycle labels
- clipped financial values

==================================================
10. SIDEBAR BEHAVIOR
==================================================

Desktop:

Full sidebar.

Tablet:

Collapsed sidebar.

Mobile:

Mobile navigation / drawer.

The Deal Room content must automatically expand into the space available after sidebar collapse.

==================================================
11. BROWSER WIDTH TEST
==================================================

Verify the Deal Room at:

1440px
1280px
1024px
768px
390px

At every width:

✓ No page-level horizontal overflow
✓ No content behind sidebar
✓ No clipped text
✓ No clipped buttons
✓ No clipped lifecycle
✓ No clipped financial information
✓ No broken grids

==================================================
12. VISUAL QUALITY
==================================================

Do NOT solve the problem by making everything tiny.

Do NOT reduce typography excessively.

Do NOT remove important information.

Instead:

Use intelligent responsive reflow.

Use vertical stacking where required.

Use collapsible panels where appropriate.

Use contained scrolling only where necessary.

Preserve the premium Vault Ventures visual quality.

==================================================
FINAL REQUIREMENT
==================================================

This is a RESPONSIVE WEB PLATFORM.

Fix the current Deal Room layout so that the complete interface is usable at different viewport widths.

Do NOT redesign the Deal Room.

Do NOT modify the approved Profile, Discovery, Founder Dashboard, Investor Dashboard, or Professional Dashboard.

ONLY fix:

- Deal Room overflow
- Sidebar/content interaction
- Lifecycle responsiveness
- Summary responsiveness
- Disclosure stage responsiveness
- Timeline responsiveness
- Desktop/tablet/mobile layout