# MODEL.md

# Purpose

The goal of the data model was not just to store uploaded files.

The main challenge of this assignment is handling messy operational data coming from different systems while still preserving:

* source traceability
* normalization
* analyst review workflows
* auditability

Because of this, I designed the system in layers instead of storing everything in a single table.

The overall workflow is:

Source File
→ Raw Records
→ Normalized Activities
→ Emission Records
→ Analyst Review & Audit Logs

This separation allows the system to:

* preserve original uploaded data
* normalize inconsistent formats
* support analyst review
* maintain audit history

without losing the original source-of-truth records.

---

# 1. Organization

Represents a client company using the platform.

### Why This Model Exists

The assignment requires multi-tenancy, meaning multiple companies should be able to use the same system while keeping their data isolated.

Every major entity in the system belongs to an organization.

### Important Fields

* `name`
* `created_at`

---

# 2. SourceFile

Represents one uploaded source file.

Examples:

* SAP procurement export
* utility electricity report
* travel activity export

### Why This Model Exists

I wanted every ingestion workflow to begin from a tracked uploaded file.

This model stores:

* where the data came from
* when it was uploaded
* which source produced it
* whether processing succeeded or failed

### Important Fields

* `organization`
* `source_type`
* `filename`
* `uploaded_file`
* `processing_status`
* `uploaded_at`
* `checksum_sha256`

### Why `checksum_sha256` Exists

This helps identify duplicate uploads and improves traceability.

### Why Processing Counters Exist

Fields like:

* `total_rows`
* `successful_rows`
* `failed_rows`

help analysts quickly understand ingestion quality without opening the entire dataset.

---

# 3. RawRecord

Stores rows exactly as they appeared in the uploaded source file.

### Why This Model Exists

One important design decision was preserving raw uploaded data separately from normalized ESG activities.

This allows the system to:

* preserve original source rows
* debug ingestion issues
* reprocess data later if mappings change
* maintain source-of-truth history

The raw layer is intentionally untouched operational data.

### Important Fields

* `source_file`
* `row_number`
* `raw_payload`
* `parse_status`
* `error_message`

### Why `raw_payload` Uses JSON

Each source has a very different schema:

* SAP exports
* utility records
* travel activity rows

Using JSON allows flexible ingestion without forcing all sources into one rigid structure too early.

### Why `row_number` Exists

This helps analysts trace validation or parsing problems back to the exact row inside the uploaded file.

---

# 4. NormalizedActivity

This is the core operational model of the system.

Every successfully parsed source row becomes a normalized activity.

### Why This Model Exists

Different sources contain:

* different field names
* different units
* different formats

The purpose of normalization is to convert them into one consistent operational structure.

For example:

* electricity usage
* diesel consumption
* flights
* hotel stays

all become standardized ESG activities that analysts can review consistently.

---

## Important Fields

### `organization`

Supports multi-tenancy.

### `raw_record`

Preserves traceability back to the original uploaded row.

### `source_type`

Tracks which source system produced the activity.

### `activity_type`

Examples:

* electricity
* diesel
* flight
* hotel

### `quantity` and `unit`

Stores normalized operational values.

### `original_quantity` and `original_unit`

Preserves the original uploaded values before normalization.

This was important because operational systems frequently use inconsistent units.

Examples:

* gallons vs liters
* kWh vs MWh

Keeping both versions improves:

* traceability
* auditability
* debugging

### `scope`

Supports:

* Scope 1
* Scope 2
* Scope 3 categorization

Examples:

* diesel fuel → Scope 1
* purchased electricity → Scope 2
* business travel → Scope 3

### `status`

Supports analyst review workflows.

Examples:

* pending review
* approved
* rejected
* locked

### `reviewed_by` and `reviewed_at`

Tracks analyst signoff activity.

### Why Locked Records Matter

Once records are approved and locked, they should not change silently because ESG reporting workflows require audit integrity.

---

# 5. EmissionRecord

Stores emissions calculations for normalized activities.

### Why This Model Exists

I intentionally separated emissions calculations from operational activities.

This makes it easier to:

* support recalculation later
* change methodologies
* preserve historical calculation versions

instead of mixing operational activity data directly with emissions logic.

### Important Fields

* `emission_factor`
* `emission_factor_source`
* `co2e_amount`
* `methodology_version`

### Why `methodology_version` Exists

Emission methodologies change over time.

Storing methodology versioning helps preserve:

* reproducibility
* auditability
* historical calculation consistency

---

# 6. ValidationIssue

Represents suspicious or problematic records detected during ingestion or normalization.

Examples:

* missing unit
* invalid quantity
* unknown plant code
* suspicious travel data

### Why This Model Exists

The assignment specifically mentions analyst review workflows.

I wanted analysts to clearly see:

* what failed
* what looks suspicious
* what requires manual review

instead of silently accepting all uploaded records.

### Important Fields

* `issue_type`
* `severity`
* `message`

---

# 7. AuditLog

Tracks important system changes.

Examples:

* analyst approval
* analyst edits
* validation overrides
* workflow changes

### Why This Model Exists

Auditability is a major requirement in ESG workflows.

The system should preserve:

* who changed something
* what changed
* when it changed

instead of losing historical context.

### Important Fields

* `entity_type`
* `entity_id`
* `action_type`
* `changed_by`
* `old_values`
* `new_values`

---

# Why I Avoided One Giant Table

I intentionally avoided storing everything in one large emissions table.

That approach becomes difficult because:

* every source has different schemas
* operational data is inconsistent
* audit history becomes unclear
* normalization becomes harder to reason about

Separating the workflow into stages made the system:

* easier to understand
* easier to debug
* more auditable
* closer to realistic ESG onboarding workflows

---

# Final Thoughts

While building the model, I tried to focus less on “perfect carbon accounting” and more on the operational problems the assignment is centered around:

* ingesting inconsistent source data
* preserving traceability
* normalization
* analyst review
* auditability

The structure was designed to keep the workflow:

* understandable
* extensible
* audit-friendly
* realistic within the assignment scope.
