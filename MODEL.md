# Data Model

## Design goals

- Preserve the original source row exactly as received.
- Normalize only the parts needed for internal ESG accounting.
- Keep emission calculations separate so methodology changes do not rewrite operational activity.
- Support multi-tenancy through `Organization` on every business row that matters.

## Model chain

`SourceFile -> RawRecord -> NormalizedActivity -> EmissionRecord`

Supporting tables:

- `Organization`
- `ValidationIssue`
- `AuditLog`

## Why each model exists

- `Organization` scopes data to the client company.
- `SourceFile` records who uploaded what, from which source, and with how many rows.
- `RawRecord` preserves each original row as JSON so the audit trail never depends on a lossy transform.
- `NormalizedActivity` is the canonical internal record used by review and emissions logic.
- `EmissionRecord` stays separate because emission factors and methodology can change over time.
- `ValidationIssue` captures suspicious or incomplete rows without deleting them.
- `AuditLog` records what changed, when, and by whom.

## Field philosophy

- Raw payloads stay source-shaped.
- Normalized fields stay source-agnostic where possible.
- Review metadata is stored on the activity itself so analysts can approve and lock rows.
- Emission outputs are derived, not edited in place.

