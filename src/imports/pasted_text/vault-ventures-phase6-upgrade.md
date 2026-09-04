Upgrade the existing Vault Ventures project with the Phase 6 Trust, Staged Disclosure, NDA, and Secure Document experience.

IMPORTANT:
Use the existing Vault Ventures project as the baseline.
Preserve the current Charcoal + Copper design system.
Preserve existing layouts, components, navigation, and working functionality.
Do not rebuild the application.
Do not implement Phase 7 features in this step.

GOAL:
Create a clear, secure, relationship-specific staged disclosure experience between users.

1. STAGED DISCLOSURE

Implement the four disclosure stages exactly:

Stage 1 — Teaser
Stage 2 — Extended Information
Stage 3 — NDA
Stage 4 — Full Proposal

The stages must be visually clear and sequential.

Never allow the UI to imply that a later stage is available before its requirements are satisfied.

2. STAGE 1 — TEASER

Show only publicly appropriate business information.

Typical content:
- Business name
- Industry
- Short description
- High-level opportunity information
- Public profile information

Keep sensitive business information hidden.

3. STAGE 2 — EXTENDED INFORMATION

Once Stage 2 is unlocked, show additional non-public business information appropriate to the relationship.

Clearly indicate:
- Current disclosure stage
- What information has been unlocked
- What remains protected

The disclosure relationship must be specific to the involved parties.

Do not make disclosure global for the business.

4. STAGE 3 — NDA

Stage 3 requires NDA acceptance.

Show:
- NDA status
- NDA version
- NDA document
- Acceptance status for each participating party
- Required action

Both parties must accept before Stage 3 becomes active.

Do not claim that the NDA provides legal guarantees beyond the platform's defined agreement.

5. STAGE 4 — FULL PROPOSAL

Stage 4 becomes available only when:
- NDA requirements are complete
- Required Founder confirmation is complete

Show the full proposal/document area only after the required conditions are satisfied.

Do not allow users to skip stages.

6. DISCLOSURE PROGRESS

Provide a clear stage indicator:

Stage 1
↓
Stage 2
↓
Stage 3 — NDA
↓
Stage 4 — Full Proposal

Use locked/unlocked/active/completed states.

Make it obvious why a stage is locked.

7. DOCUMENT SECURITY

Documents should visibly indicate their disclosure level:

- Public
- Stage 2
- Stage 3
- Stage 4

Sensitive documents must not appear accessible before their required stage.

Use appropriate locked states and permission messaging.

8. ACCESS CONTROL UI

Show clear messages such as:
- "Available at Stage 2"
- "NDA acceptance required"
- "Waiting for the other party"
- "Founder confirmation required"

Do not expose protected content behind disabled-looking buttons.

9. ONE-SIDED INTEREST SIGNAL

Where appropriate, support the Phase 6 one-sided interest signal that can unlock Stage 2.

This is ONLY a disclosure relationship signal.

Do NOT create the full Phase 7 Interest/Application/Connection entity here.

10. NDA EXPERIENCE

Create a professional NDA review/acceptance flow.

Include:
- NDA title
- Version
- Date
- Document preview/access
- Acceptance checkbox/action
- Accepted by status
- Pending party status

Do not create a second NDA system for future Deal Rooms.

The platform-provided NDA should remain the underlying NDA event.

11. TIER REQUIREMENT

Stage 3+ viewer access requires appropriate verification eligibility.

Clearly communicate when a user must reach Tier 1 verification before accessing NDA/full-proposal content.

Do not automatically change a user's verification tier.

12. AUDIT / SECURITY INDICATORS

Provide appropriate UI indicators for:
- Disclosure stage changes
- NDA acceptance
- Document access
- Security/access history where already supported

Do not expose unnecessary sensitive audit information to normal users.

13. STRICT PHASE BOUNDARY

DO NOT implement:
- Full Interest/Application system
- Mutual Connection creation
- Deal Room
- Negotiation
- Agreement
- Milestones
- Investment
- Reputation
- Admin governance
- New AI features

Those belong to later phases.

14. DESIGN

Use the existing Charcoal + Copper system.

Copper should communicate:
- Active stage
- Primary actions
- Progress
- Important security actions

Use restrained styling.
Avoid excessive glow or decorative security effects.

15. EMPTY / LOCKED / ERROR STATES

Include professional states for:
- Stage locked
- Waiting for other party
- NDA pending
- NDA accepted
- Verification required
- Document unavailable
- Access denied
- No additional information available

FINAL RESULT:

Users should clearly understand:

What information they can currently see
→ What the next disclosure stage is
→ Why it is locked/unlocked
→ What action is required
→ Which party has completed the requirement

The complete disclosure flow must be:

Stage 1 → Stage 2 → Stage 3 (NDA) → Stage 4 (Full Proposal)

No skipped stages.
No premature sensitive information.
No Deal Room or investment functionality in this prompt.