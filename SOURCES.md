# SOURCES.md

# Purpose

This document explains:

* what real-world source formats I researched
* what I learned from researching them
* why I chose specific ingestion formats
* how I designed the sample datasets
* what limitations would exist in a real production system

The goal was to realistically simulate the messy operational data that ESG teams deal with during enterprise onboarding.

---

# 1. SAP Fuel & Procurement Data

## What I Researched

I researched how SAP operational data is usually shared in large companies.

I found that SAP data can come through:

* flat-file ERP reports
* IDoc integrations
* OData APIs
* BAPI integrations

For this prototype, I chose to model SAP ingestion using CSV/XLSX files that represent realistic flat-file ERP exports because this closely matches how ESG onboarding often begins in practice — through manually exported operational reports rather than direct system integrations.

While researching SAP exports, I observed that the data is often operationally messy and difficult to work with directly. Typical exports may contain:

* short ERP-style column names
* plant/vendor codes
* mixed date formats
* mixed units
* operational terminology that is not easy to understand immediately

Examples:

* `WERKS` → plant code
* `MEINS` → unit
* `MENGE` → quantity

I also learned that many SAP fields are not meaningful on their own and often require lookup tables or business context to interpret correctly.

For example:

a plant code like PLT1001 may require a lookup table to identify which facility or region it belongs to
a material code may require mapping to determine whether it represents diesel, gasoline, or another procurement category
vendor IDs may need separate reference data to understand supplier details

This was important for the prototype because ESG normalization often depends not only on the raw values themselves, but also on contextual business mappings that exist outside the exported file.

---

## What I Learned

One important thing I learned is that SAP data is usually not clean or analyst-friendly.

Different teams and regions may export data differently. Some exports may even contain German column names or company-specific abbreviations.

I also learned that ESG onboarding often starts with manually exported reports instead of direct ERP integrations because integrations take time and security approvals.

Another thing I observed during research is that SAP exports often contain a very large amount of operational information, much of which is not directly useful for ESG calculations.

Because of this, one important design decision was deciding:

* what subset of SAP data should actually be ingested
* which fields are relevant for emissions workflows
* which operational details should be ignored for the prototype

Instead of attempting to ingest entire ERP exports, I intentionally limited the prototype to a smaller subset focused on:

* fuel-related operational records
* procurement activities relevant to emissions tracking
* quantities, units, dates, plant identifiers, and vendor references

This decision helped keep the ingestion pipeline understandable while still preserving realistic SAP complexity. It also reflects how ESG systems commonly work in practice, where only certain ERP activities are mapped into sustainability reporting workflows.

I also found SAP exports significantly more complex and difficult to handle compared to the other sources. Unlike utility or travel data, SAP exports are heavily tied to ERP-specific business processes and often contain operational fields that are difficult to interpret without domain knowledge.

In many cases:

* column names are abbreviated
* business meaning depends on lookup tables
* units are inconsistent
* data structures vary across organizations
* important context exists outside the exported file itself

This complexity was one of the reasons I intentionally limited the prototype to a smaller, realistic subset of SAP fuel and procurement workflows instead of attempting full ERP coverage.


---

## Why I Chose CSV/Excel Uploads

I chose CSV/Excel uploads because:

* they are realistic for onboarding workflows
* easier to prototype within 4 days
* preserve operational messiness
* allow focus on normalization and auditability

The assignment is mainly about:

* handling messy data
* normalization
* analyst review workflows

not about building deep SAP integrations.

---

## Why I Did Not Choose Other SAP Formats

### IDoc

I did not choose IDoc because:

* it is very SAP-specific
* highly complex
* unnecessary for a prototype

### OData APIs

I did not choose OData because:

* requires authentication and SAP setup
* integration work would take too much time
* not central to the assignment goals

### BAPI

I did not choose BAPI because:

* it is more integration-heavy
* too enterprise-specific for this scope

---

## Why My Sample Data Looks Like This

The SAP sample dataset intentionally contains:

* ERP-style headers
* vendor codes
* plant codes
* mixed units (liters and gallons)
* inconsistent date formats

I designed the data this way because real operational exports are rarely perfectly clean.

The goal was to simulate:

* normalization problems
* validation issues
* analyst review needs

instead of creating unrealistic clean datasets.

---

## What Would Break In Real Deployment

In a real production system, several things would become more complicated:

* different clients would have different SAP schemas
* export formats could change
* files could become extremely large
* lookup tables might differ between companies
* duplicate uploads may happen(But I handled it)

A real system would likely need:

* configurable mapping systems
* asynchronous processing
* schema versioning
* stronger reconciliation workflows

These were intentionally left out to keep the prototype focused and understandable.

---

# 2. Utility Electricity Data

## What I Researched

I researched how facilities and operations teams usually manage electricity usage data.

I found that utility data commonly comes from:

* utility portal CSV exports
* Excel reports
* PDF bills
* utility APIs

Most operational workflows still rely heavily on exported reports and spreadsheets.

I also noticed that utility data usually contains:

* billing periods
* meter IDs
* tariff structures
* energy units like kWh or MWh

---

## What I Learned

One important thing I learned is that utility reporting does not align neatly with ESG reporting periods.

For example:

* billing periods may overlap months
* some reports use kWh while others use MWh
* tariff structures vary between providers

I also learned that utility APIs are not standardized across providers, so onboarding often begins with exported reports.

---

## Why I Chose CSV/Excel Uploads

I chose CSV/Excel uploads because:

* they are commonly used operationally
* easy to normalize
* realistic for facilities teams
* avoid unnecessary API integration complexity

This allowed the prototype to focus more on:

* ingestion
* normalization
* validation
* audit workflows

---

## Why I Did Not Choose PDFs

I did not choose PDF bills because:

* extraction is unreliable
* OCR introduces errors
* layouts vary heavily
* parsing would take focus away from ESG workflows

---

## Why I Did Not Choose APIs

I did not choose utility APIs because:

* provider support varies
* authentication/setup takes time
* APIs are not central to the assignment goals

---

## Why My Sample Data Looks Like This

The utility dataset intentionally contains:

* kWh and MWh units
* different billing periods
* tariff categories
* commercial and industrial usage

I designed the data this way because real utility reporting is inconsistent and requires normalization.

The goal was to simulate realistic operational reporting challenges.

---

## What Would Break In Real Deployment

In a real deployment:

* utility providers may export data differently
* billing corrections may happen later
* duplicate meter records may appear
* some data may be incomplete

A production system would likely need:

* provider-specific validation
* configurable ingestion mappings
* reconciliation workflows

These were intentionally excluded from the prototype scope.

---

# 3. Corporate Travel Data

## What I Researched

I researched how platforms like:

* SAP Concur
* Navan
* corporate travel systems

expose travel and expense data.

I found that travel data is commonly available through:

* spreadsheet exports
* reporting dashboards
* APIs
* expense reports

Travel exports often contain different categories such as:

* flights
* hotels
* taxis
* trains

Each category exposes different kinds of data.

For example:

* flights may only contain airport codes
* hotels contain number of nights
* taxi records may contain pickup/drop locations

---

## What I Learned

One important thing I learned is that travel data is often incomplete or sparse.

Not every row contains distance information.

Different travel categories require different emission logic.

I also learned that ESG onboarding often starts from exported reports rather than live integrations.

---

## Why I Chose CSV/Excel Uploads

I chose CSV/Excel uploads because:

* they are realistic operational exports
* easier to normalize
* avoid OAuth/security complexity
* suitable for the assignment timeline

This allowed me to focus more on:

* normalization
* analyst review workflows
* auditability

instead of third-party integrations.

---

## Why I Did Not Choose PDFs

I did not choose PDFs because:

* structured extraction is difficult
* layouts vary
* parsing reliability is low

---

## Why I Did Not Choose APIs

I did not choose APIs because:

* OAuth/security setup takes time
* provider schemas vary
* integration complexity is high for a prototype

---

## Why My Sample Data Looks Like This

The travel dataset intentionally contains:

* flights
* hotels
* trains
* taxis
* sparse fields
* airport-code-only rows
* missing distances

I designed the dataset this way because real operational travel exports are rarely complete or perfectly structured.

The goal was to simulate:

* normalization challenges
* validation handling
* analyst review workflows

---

## What Would Break In Real Deployment

In a real deployment:

* travel schemas may vary by provider
* duplicate expense records may appear
* route information may be missing
* currencies may differ
* category mappings may change

A production system would likely require:

* enrichment pipelines
* airport-distance lookups
* stronger reconciliation workflows

These were intentionally excluded from the prototype scope.

---

# Final Notes

Across all three sources, I intentionally chose structured file uploads instead of APIs because:

* this is realistic during enterprise onboarding
* onboarding often starts with exported reports
* APIs require significant integration work
* the assignment focuses more on normalization and auditability

The prototype intentionally prioritizes:

* source traceability
* analyst review workflows
* normalization
* auditability

over:

* real-time integrations
* large-scale infrastructure
* enterprise connector engineering


