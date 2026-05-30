# SOURCES.md

# Purpose

This document explains:

* what real-world source formats I researched
* what I learned from them
* why specific ingestion formats were chosen
* how sample datasets were designed
* limitations in a production system

The goal was to simulate the messy, real-world operational data typically encountered during ESG onboarding in enterprises.

---

# 1. SAP Fuel & Procurement Data

## What I Researched

I researched how SAP operational data is typically exposed in enterprise systems.

Common formats include:

* IDoc integrations
* OData APIs
* BAPI integrations
* flat-file ERP exports

Links: https://www.techtarget.com/searchsap/definition/IDoc, 
       https://ghgptechassistance.zendesk.com/hc/en-us/articles/47397108734740-Cross-sector-Emission-Factors, 
       https://help.sap.com/docs/SAP_LUMIRA/4f58d91f03e441b68d3187e94be27df2/596bceb9b50443ab945405328f8ed1c7.html?locale=en-US&q=csv+export

For this prototype, I modeled SAP ingestion using **CSV/XLSX exports**, since ESG onboarding often begins with manually exported ERP reports rather than direct system integrations.

---

## What I Learned

SAP exports are typically:

* operational and non-analyst friendly
* filled with abbreviations and ERP-specific codes
* inconsistent across teams and regions
* dependent on external lookup tables for meaning

Examples:

* `WERKS` → plant code
* `MEINS` → unit of measure
* `MENGE` → quantity

Many fields are not meaningful in isolation and require business context to interpret.

For example:

* plant codes map to facility metadata
* material codes require classification mapping
* vendor IDs depend on external reference datasets

This makes ESG normalization heavily dependent on **external business mappings**, not just raw data.

---

## Design Decisions

I intentionally limited SAP ingestion scope to:

* fuel-related operational records
* procurement activities relevant to emissions
* quantities, units, timestamps, plant/vendor identifiers

This was done because full ERP ingestion would:

* add unnecessary complexity for a prototype
* obscure ESG-specific transformation logic
* require large-scale schema handling systems

---

## Why CSV/Excel Uploads

I chose CSV/Excel because:

* they are commonly used in real ESG onboarding
* they preserve operational messiness
* they avoid integration complexity
* they allow focus on normalization + validation

---

## Why Other SAP Formats Were Not Used

### IDoc

Too SAP-specific and complex for prototype scope.

### OData APIs

Require authentication, setup, and enterprise configuration.

### BAPI

Integration-heavy and not necessary for ESG ingestion simulation.

---

## Dataset Design Rationale

The dataset intentionally includes:

* ERP-style column names
* vendor and plant codes
* mixed units (liters/gallons)
* inconsistent date formats

This reflects real-world ERP exports where data is:

* fragmented
* inconsistent
* context-dependent

The goal was to simulate **normalization and validation challenges**, not create clean analytical data.

---

## What Would Break in Production

In real deployments:

* schemas differ across SAP implementations
* exports vary by organization and region
* file sizes can be extremely large
* duplicate uploads may occur
* lookup mappings vary between clients

A production system would require:

* schema versioning
* configurable mapping layers
* async ingestion pipelines
* reconciliation workflows

---

# 2. Utility Electricity Data

## What I Researched

Utility data is typically sourced from:

* utility portal exports (CSV/Excel)
* billing dashboards
* PDF invoices
* APIs (varies by provider)

Links: https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=table_es1a

Most organizations still rely on exported reports rather than APIs.

---

## What I Learned

Utility data is often:

* not aligned with ESG reporting periods
* inconsistent in units (kWh vs MWh)
* dependent on provider-specific formats

Billing cycles may:

* overlap months
* include corrections
* vary by tariff structure

This makes normalization necessary before emissions calculation.

---

## Why CSV/Excel Uploads

I chose CSV/Excel because:

* they are the most common operational format
* easier to normalize than PDFs
* widely used in facilities reporting
* reduce integration complexity

---

## Why PDFs Were Not Used

PDF bills were excluded because:

* extraction is unreliable
* OCR introduces errors
* layouts vary widely across providers
* increases complexity unrelated to ESG logic

---

## Why APIs Were Not Used

APIs were excluded because:

* provider-specific authentication is required
* schemas vary across utilities
* integration overhead is high for prototype scope

---

## Dataset Design Rationale

The dataset includes:

* kWh and MWh values
* multiple billing periods
* tariff categories
* commercial + industrial usage

This reflects real-world utility data, which is:

* inconsistent across providers
* not standardized for ESG reporting

---

## What Would Break in Production

In real systems:

* provider formats differ significantly
* billing corrections may occur after reporting
* meter duplication can happen
* missing or partial data is common

A production system would require:

* provider-specific validation rules
* reconciliation pipelines
* mapping configuration layers

---

# 3. Corporate Travel Data

## What I Researched

I studied corporate travel systems such as:

* SAP Concur
* Navan
* enterprise expense platforms

Links: https://help.sap.com/docs/CONCUR_EXPENSE/1c6701a5b9ea4cc69eee62d00f2cf326/858113ec6f0c1014bf9d946242cf2f47.html,     
      https://www.youtube.com/watch?v=Hr94U2ORbM8&t=5s


Travel data is typically available through:

* spreadsheet exports
* reporting dashboards
* APIs
* expense systems

---

## What I Learned

Travel data is often:

* incomplete or sparse
* category-dependent (flight/hotel/taxi/train)
* inconsistent in metadata availability

Examples:

* flights → airport codes only
* hotels → nights + location
* taxis → pickup/drop but no distance

Different categories require different emission logic.

---

## Why CSV/Excel Uploads

I chose CSV/Excel because:

* they are standard export formats
* avoid OAuth and integration complexity
* are widely used in expense reporting
* allow focus on normalization logic

---

## Why PDFs Were Not Used

PDF expense reports were excluded because:

* structure varies widely
* extraction is unreliable
* increases noise in ingestion pipeline

---

## Why APIs Were Not Used

APIs were excluded because:

* require authentication flows
* schemas vary by provider
* integration time is high for prototype scope

---

## Dataset Design Rationale

The dataset intentionally includes:

* flights, hotels, trains, taxis
* sparse or missing fields
* airport-code-only records
* missing distance data

This reflects real-world travel exports where:

* data is fragmented
* completeness is inconsistent
* enrichment is required for ESG use cases

---

## What Would Break in Production

In real systems:

* schemas vary by travel provider
* duplicate expense entries occur
* currency inconsistencies exist
* route/distance data is often missing

A production system would require:

* enrichment pipelines (distance APIs, airport mapping)
* reconciliation systems
* standardized category mapping layers

---

# Final Notes

Across all three sources, I intentionally standardized ingestion on **CSV/Excel files** because:

* enterprise onboarding typically begins with exports
* APIs require heavy integration effort
* the focus is ESG normalization and auditability, not connectors

The prototype prioritizes:

* data traceability
* normalization logic
* analyst review workflows
* auditability

over:

* real-time integrations
* enterprise connector infrastructure
* large-scale distributed systems

---