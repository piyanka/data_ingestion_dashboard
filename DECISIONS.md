# Decisions

## 1. Structured uploads instead of APIs first

I chose file upload support as the primary ingestion path because the assignment brief describes exports from SAP, utility portals, and travel platforms. That is the realistic starting point for enterprise onboarding.

## 2. Raw JSON storage

`RawRecord.raw_payload` stores the row exactly as received. This avoids losing source-specific context and makes future debugging much easier.

## 3. Normalization is service-layer code

Normalization lives in plain functions instead of being embedded in serializers or models. That keeps the logic testable and easy to explain.

## 4. Emissions are derived data

I kept `EmissionRecord` separate from `NormalizedActivity` so methodology changes do not mutate the business fact row.

## 5. Analyst review is explicit

Activities have review status, reviewer, review time, and notes. That makes the approval workflow visible instead of implied.

