# Workday Auth Playbook

## Goal

Handle Workday authentication as a deterministic branch selection problem, not as freeform browser improvisation.

## Canonical Branches

- `guest`
  Use when a guest path is visibly available after clicking Apply.
- `existing_account_sign_in`
  Use when `Sign In` is available or the site redirects a create-account attempt to a sign-in form.
- `create_account`
  Use only when the site requires account creation and there is no viable guest path or existing-account sign-in shortcut.

## Branch Priority

1. Guest if it is explicitly available.
2. Existing account sign-in if a sign-in entry point is visible.
3. Create account only when sign-in is not the correct path.

## Required Observations

- visible auth buttons or links (`Guest`, `Sign In`, `Create Account`)
- password field count
- auth page headings
- whether submit transitions to `My Information` or bounces back to `Sign In`

## Runtime Rules

- If Workday shows both `Create Account` and `Sign In`, prefer `existing_account_sign_in`.
- If `Create Account` is submitted and the page transitions to `Sign In`, switch the checkpoint branch to `existing_account_sign_in` and continue.
- Do not classify auth password fields as generic unanswered questions once the auth branch is known.
- Persist the chosen branch and next action in the checkpoint for every attempt.

## Success Condition

The auth branch is complete once the page reaches `My Information`, `My Experience`, `Application Questions`, or another downstream application step.
