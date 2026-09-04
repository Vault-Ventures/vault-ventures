Upgrade the existing Vault Ventures project with the complete Phase 8 Reputation and Trust experience.

IMPORTANT:
Use the existing Vault Ventures project as the baseline.
Build on the existing Phase 7 completed deal/relationship flow.
Preserve the current Charcoal + Copper design system.
Do not rebuild working screens unnecessarily.
Do not implement Phase 9 Admin features in this step.

GOAL:
Create an explainable, traceable, activity-based Reputation and Trust system for Founder, Investor, and Professional users.

1. REPUTATION PROFILE

Add/complete the Reputation section on user profiles.

Show appropriate reputation information for:

Founder:
- Verification status
- Experience
- Previous projects
- Milestone completion history
- Investor feedback
- Completed relationships/deals

Investor:
- Verification status
- Investment history
- Completed deals
- Founder feedback
- Relevant activity history

Professional:
- Skills
- Experience
- Previous projects
- Completed engagements
- Startup/business feedback

2. REPUTATION MUST NOT BE AI

Reputation is NOT:
- AI-generated
- Match Score
- Readiness Score
- AI ranking
- Recommendation score

Do not use AI terminology anywhere in the reputation system.

3. COMPLETED ACTIVITY BASIS

Reputation should be based on verified on-platform activity and completed relationships/deals.

Completed deals/relationships should contribute more strongly than incomplete activity.

Do not invent reputation based on:
- Profile views
- Random activity
- Follower counts
- Likes
- Unverified claims

4. VERIFICATION SEPARATION

Keep Verification Tier separate from Reputation.

Display them as two different concepts:

Verification:
Tier 0 — Unverified
Tier 1 — Identity Verified
Tier 2 — Track-record Verified

Reputation:
Based on completed, traceable platform activity.

IMPORTANT:
Do NOT automatically promote a user to Tier 2 because of reputation.

5. REPUTATION FACTORS

Show explainable reputation factors appropriate to the user's role.

Possible factors supported by the product:
- Completed deals
- Milestone completion
- Investment/deal completion
- Previous projects
- Verified experience
- Feedback from completed relationships

Only show factors supported by actual available data.

6. REPUTATION BREAKDOWN

Provide a clear breakdown so users can understand why their reputation appears the way it does.

Example structure:

Overall Reputation
↓
Completed Activity
↓
Milestone / Deal History
↓
Verified Experience
↓
Feedback

Do not expose unsupported mathematical formulas.

7. FEEDBACK

Reuse the existing Phase 7 persisted feedback mechanism.

DO NOT create a duplicate feedback/review system if one already exists.

Feedback should be associated with the completed relationship/deal.

8. ELIGIBILITY

Only users involved in completed eligible relationships/deals should be able to submit feedback.

Prevent:
- Self-review
- Duplicate review for the same relationship/deal
- Reviews for incomplete relationships

Do not invent penalties for cancelled deals unless the existing product specification explicitly supports them.

9. REVIEW EXPERIENCE

Provide a professional feedback flow.

Include:
- Relationship/deal context
- Review target
- Feedback input
- Rating/reputation contribution where supported
- Submission state
- Existing submitted feedback

Keep it compact and trustworthy.

10. REPUTATION HISTORY

Where appropriate, allow users to understand the activity behind their reputation.

Show traceable records such as:
- Completed deal
- Completed milestone
- Completed engagement
- Feedback received

Do not expose private/sensitive information unnecessarily.

11. TRUST INDICATORS

Use restrained trust indicators for:
- Verification
- Completed activity
- Reputation
- Feedback

Do not make the interface look like a social-media popularity system.

12. EMPTY STATES

Provide clear states for users with:
- No completed deals
- No feedback yet
- No reputation history
- No eligible reviews

Example messaging should make clear that reputation develops through completed, verified platform activity.

13. PRIVACY

Do not expose private deal information or sensitive financial details simply because reputation is visible.

Show only information appropriate for the user's visibility level.

14. STRICT PHASE BOUNDARY

DO NOT implement:
- AI scoring
- Match Score
- Readiness Score
- AI recommendations
- New investment logic
- New disclosure/NDA logic
- New Deal Room workflow
- Admin reputation management
- Premium features

15. DESIGN

Continue using the current Charcoal + Copper design system.

Use Copper for important interaction/brand accents where appropriate.

Use Verification/Trust Gold (#C9A24B) only for trust/verification-related indicators where useful.

Keep the interface:
- Professional
- Explainable
- Compact
- Trustworthy
- Information-focused

FINAL RESULT:

A user should be able to understand:

Who this person is
→ What has been verified
→ What they have successfully completed
→ What feedback they received
→ Why their reputation is represented that way

Reputation must remain deterministic, explainable, traceable, and based on completed platform activity—not AI.