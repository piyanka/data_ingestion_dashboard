# Tradeoffs

## 1. No background queue yet

The prototype processes uploads synchronously. A production version should move ingestion to a worker, but synchronous handling keeps the first version easier to inspect.

## 2. No source-specific parser plugins yet

I started with a shared ingestion pipeline and placeholder normalization helpers. That is enough to establish the architecture without overbuilding plugin abstractions before the real source shapes are finalized.

## 3. No complex emissions library

Emission calculation is intentionally simple. The assignment is about handling messy source data and auditability, not a full carbon accounting engine.

