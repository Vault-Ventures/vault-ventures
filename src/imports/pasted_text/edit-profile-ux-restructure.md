VAULT VENTURES — EDIT PROFILE UX RESTRUCTURE

IMPORTANT:
THIS IS A CONTROLLED UX RESTRUCTURE OF THE EXISTING EDIT PROFILE EXPERIENCE ONLY.

The current Profile page, profile header, cover photo, avatar, navigation, fields, role-specific information, and existing functionality are already approved.

DO NOT redesign the Profile page.

DO NOT change the Profile page layout except for the specific Edit Profile interaction described below.

DO NOT remove ANY existing field.

DO NOT remove ANY existing profile information.

DO NOT remove ANY existing role-specific functionality.

DO NOT rename existing fields unless absolutely necessary for UI clarity.

DO NOT change unrelated pages or components.

============================================================
1. CURRENT PROBLEM
============================================================

The current Edit Profile experience is a very long form.

The user has to continuously scroll through multiple sections such as:

- Basic Information
- Founder Information
- Professional Information
- Investor Information
- Experience
- Preferences
- and other existing profile fields.

This makes profile editing feel long, repetitive and inefficient.

We need to improve ONLY the editing experience.

============================================================
2. PROFILE HEADER — EDIT ACTION
============================================================

On the Profile header, directly below/around the cover photo area, REMOVE the large visible:

"Edit Profile"

button.

Replace that visible action with a subtle:

⋯

three-dot action button.

The three-dot button must look premium and intentional.

Do NOT make it visually dominant.

Keep the existing:

- cover photo
- profile photo
- name
- roles
- headline
- location
- company
- membership information
- profile completion
- Manage Roles

exactly as they currently are.

ONLY replace the visible Edit Profile action with the three-dot action.

============================================================
3. THREE-DOT MENU
============================================================

When the user clicks:

⋯

open a compact premium action menu.

The menu should contain:

Edit Profile

and any OTHER existing actions that are already associated with this profile action area.

Do NOT invent unnecessary actions.

Do NOT duplicate existing actions.

The primary purpose of this menu is:

⋯ → Edit Profile

============================================================
4. EDIT PROFILE — OPEN AS MODAL / POPUP
============================================================

When the user clicks:

Edit Profile

DO NOT navigate to another full-page long scrolling form.

Instead, open a large premium:

EDIT PROFILE MODAL / DIALOG

The modal should feel like a professional production SaaS application.

Use:

- large but controlled modal
- rounded corners
- subtle border
- premium surface
- proper shadow/depth
- clear header
- close button
- internal section navigation
- fixed action area.

Do NOT make the modal unnecessarily huge.

Do NOT make it full-screen unless required responsively on mobile.

============================================================
5. MODAL HEADER
============================================================

At the top of the modal:

Edit Profile

Subtitle:

Update your profile information and preferences.

On the right:

X Close

Keep the header clean and compact.

============================================================
6. SECTION NAVIGATION
============================================================

Inside the modal, create a LEFT-SIDE VERTICAL SECTION NAVIGATION.

This is VERY IMPORTANT.

Do NOT put every section one after another in one giant scrolling form.

The left navigation should contain the existing profile sections:

1. Basic Information
2. Founder Information
3. Professional Information
4. Investor Information
5. Experience
6. Preferences

If additional existing profile sections are present in the current implementation, include them too.

DO NOT omit anything that already exists.

The section navigation should allow the user to click a section and immediately switch to that section's form.

============================================================
7. SELECTED SECTION
============================================================

On the RIGHT side of the modal:

Show ONLY the selected section's fields.

Example:

LEFT:

Basic Information
Founder Information
Professional Information
Investor Information
Experience
Preferences

RIGHT:

BASIC INFORMATION

First Name
Last Name
Headline
Bio
Location
Profile Photo
Cover Photo

The user should NOT need to scroll through unrelated sections.

============================================================
8. BASIC INFORMATION
============================================================

Preserve ALL existing Basic Information fields.

At minimum, based on the current implementation:

- First Name
- Last Name
- Headline
- Bio
- Location
- Profile Photo
- Cover Photo

If more Basic Information fields currently exist, KEEP THEM.

DO NOT delete anything.

============================================================
9. FOUNDER INFORMATION
============================================================

Preserve ALL existing Founder Information fields.

Do not simplify away existing data.

The user must be able to edit every existing Founder field from this section.

============================================================
10. PROFESSIONAL INFORMATION
============================================================

Preserve ALL existing Professional Information fields.

This includes existing fields such as:

- Proficiency
- Availability
- Work preference
- Compensation
- Skills
- Industry experience
- Experience

and any other existing fields.

Do NOT remove them.

============================================================
11. INVESTOR INFORMATION
============================================================

Preserve ALL existing Investor Information fields.

This includes existing fields such as:

- Investor type
- Investment thesis
- Minimum ticket
- Maximum ticket
- Preferred industries
- Preferred stage
- Involvement

and any other existing Investor fields.

Do NOT remove them.

============================================================
12. EXPERIENCE
============================================================

Preserve the existing Experience editor completely.

The user must still be able to:

- view existing experience
- edit experience
- add experience
- edit role/title
- edit organization
- edit duration
- edit description
- add additional experience items.

Do NOT remove the existing "Add experience" functionality.

Do NOT flatten the experience data.

============================================================
13. PREFERENCES
============================================================

Preserve ALL existing Preferences fields and controls.

The user should be able to edit them from the Preferences section without leaving the modal.

============================================================
14. PHOTO UPLOAD — IMPORTANT
============================================================

The current Basic Information section asks the user for:

"Upload or paste URL"

for Profile Photo and Cover Photo.

THIS MUST BE IMPROVED.

Do NOT ask a normal end user to paste an image URL.

Instead, create a professional upload interaction.

PROFILE PHOTO:

Show:

Current profile photo preview

[ Change photo ]

When clicked:

Allow the user to:

- Upload image
- Replace image
- Remove image

COVER PHOTO:

Show:

Current cover photo preview

[ Change cover ]

When clicked:

Allow the user to:

- Upload image
- Replace image
- Remove image

Use a professional upload/dropzone style interaction where appropriate.

Do NOT show a raw URL input as the primary user experience.

IMPORTANT:

Do not break the existing data structure or backend assumptions if one already exists.

This task is primarily a UX/UI improvement.

============================================================
15. SAVE / CANCEL
============================================================

The modal should have a fixed bottom action area.

Actions:

Cancel
Save changes

The user should always be able to access these actions without scrolling all the way to the bottom.

Do NOT remove the existing Save Changes functionality.

Do NOT change its purpose.

============================================================
16. SECTION SWITCHING
============================================================

When switching:

Basic Information
→ Founder Information

or:

Founder Information
→ Professional Information

the modal should switch the displayed content without closing.

The user should remain inside:

Edit Profile

============================================================
17. FORM STATE
============================================================

Do NOT reset user-entered information when switching sections.

If the user edits Basic Information and then opens Founder Information, their Basic Information changes must remain in the current editing state.

Do NOT unexpectedly discard unsaved changes.

============================================================
18. PREMIUM DESIGN
============================================================

The Edit Profile modal must match the existing Vault Ventures premium visual identity.

Use the application's current theme system.

It must work with:

LIGHT MODE
and
DARK MODE.

Do NOT introduce a separate visual style.

For Dark Mode:

- premium dark surface
- refined glass
- subtle borders
- controlled bronze/gold accents.

For Light Mode:

- premium white surface
- soft #F8FAFC surrounding background
- subtle borders
- refined teal accents
- sophisticated depth.

Do NOT overuse gradients.

Do NOT overuse glow.

============================================================
19. RESPONSIVE BEHAVIOR
============================================================

Desktop:

LEFT section navigation
+
RIGHT content area.

Tablet:

Adapt the layout intelligently.

Mobile:

Convert the section navigation into a compact selector/tabs or stacked navigation.

The modal should remain usable.

Do NOT allow horizontal overflow.

============================================================
20. STRICT PRESERVATION RULE
============================================================

DO NOT CHANGE:

- Profile page structure
- Profile header
- Cover photo placement
- Profile photo placement
- Name
- Roles
- Headline
- Location
- Company
- Membership information
- Profile completion
- Manage Roles
- Sidebar
- Top navigation
- Other pages
- Existing profile fields
- Existing role-specific fields
- Existing data
- Existing save functionality.

ONLY CHANGE:

1. Edit Profile trigger → three-dot menu.
2. Edit Profile → premium modal.
3. Long scrolling form → section-based navigation.
4. Profile/Cover photo URL input → professional upload interaction.

============================================================
21. NOTHING MAY BE LOST
============================================================

Before completing, compare the NEW Edit Profile modal against the CURRENT Edit Profile page.

Every existing field must still be accessible.

Every existing editing capability must still exist.

Every existing section must still exist.

Every existing Add functionality must still exist.

The new UX is a REORGANIZATION, NOT A REDUCTION.

============================================================
22. FINAL USER FLOW
============================================================

The final experience should be:

Profile Page

        ↓

        ⋯

        ↓

Action Menu

        ↓

Edit Profile

        ↓

Premium Edit Profile Modal

        ┌─────────────────────────────────────┐
        │ Edit Profile                    X    │
        │                                     │
        │ Basic Information │                 │
        │ Founder Information│ Selected Form  │
        │ Professional Info │                 │
        │ Investor Information│               │
        │ Experience        │                 │
        │ Preferences       │                 │
        │                                     │
        │             Cancel  Save changes    │
        └─────────────────────────────────────┘

This should feel significantly more professional and efficient than the current long scrolling form.

============================================================
23. FINAL ABSOLUTE RULE
============================================================

DO NOT redesign anything outside this Edit Profile interaction.

DO NOT remove any existing functionality.

DO NOT remove any existing field.

DO NOT change unrelated components.

DO NOT change the Profile page design.

DO NOT invent unnecessary features.

ONLY improve the Edit Profile interaction exactly as specified above.

The goal is:

SAME PROFILE
+
SAME DATA
+
SAME FEATURES
+
BETTER EDITING UX.

Nothing else.