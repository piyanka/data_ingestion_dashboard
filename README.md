# Breathe ESG Prototype

This repository is a scaffold for the Breathe ESG tech intern assignment.

The design centers on four things the brief explicitly cares about:

1. Raw source preservation.
2. Canonical normalized activity data.
3. Analyst review before locking rows for audit.
4. Simple, explainable emission calculations.

## Suggested Folder Layout

```text
backend/
  config/
  apps/
    core/
    ingestion/
    review/
frontend/
docs/
```

## Why this split exists

- `core` holds organization and audit primitives.
- `ingestion` owns uploads, raw rows, normalization, validation, and emissions.
- `review` owns analyst-facing review workflows.
- `frontend` stays separate so the React dashboard can evolve without touching backend logic.

