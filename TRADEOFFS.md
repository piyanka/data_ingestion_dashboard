# TRADEOFFS.md

# Purpose

This assignment covers a very broad problem in a short timeline. Instead of trying to build every possible enterprise feature, I focused mainly on the parts that felt most important:

* handling messy source data
* normalization
* analyst review
* auditability

I intentionally kept some areas simpler so the overall workflow would stay understandable and realistic.

---

# 1. I Did Not Build Direct API Integrations

I chose to use CSV/XLSX uploads for SAP, utility, and travel data instead of connecting directly with external APIs.

While researching the sources, I noticed that many companies initially share exported reports during ESG onboarding rather than giving direct system access immediately. APIs also require extra setup around:

* authentication
* permissions
* tenant-specific configuration
* provider-specific schemas

Since the assignment focuses more on data handling and review workflows, I felt file uploads were the better choice for the prototype.

### What this means

The current system does not support:

* automatic syncing
* real-time updates
* live integrations

A real production system would likely add those later.

---

# 2. I Kept Emission Calculations Simple

I intentionally did not spend too much time building a highly advanced emissions engine.

The assignment itself mentions that the difficult part is not calculating carbon, but handling messy operational data from different systems.

Because of this, I focused more on:

* ingestion
* normalization
* validation
* analyst approval workflows

The prototype uses simple emission calculations based on:

* electricity usage
* fuel quantity
* travel activity

### What this means

The current system does not include:

* region-specific methodologies
* advanced Scope 3 calculations
* supplier-specific emission factors
* regulatory edge cases

A production ESG platform would likely have a much more detailed calculation system.

---

# 3. I Limited The SAP Scope

SAP was the most difficult and complex source I researched.

One thing I noticed is that SAP exports contain a huge amount of operational information, much of which is not directly useful for ESG reporting. In many cases, the data also depends on:

* lookup tables
* internal business mappings
* ERP-specific terminology

Because of this, I intentionally limited the prototype to a smaller subset of SAP fuel and procurement data.

I mainly focused on fields related to:

* quantities
* units
* dates
* plant identifiers
* procurement/fuel activity

instead of trying to model the entire ERP system.

### What this means

The current prototype does not handle:

* full SAP coverage
* organization-specific SAP customizations
* deeply nested ERP structures
* dynamic schema mapping

A real production system would likely need much more configurable ingestion logic.

---

# Final Note

Throughout the assignment, I tried to avoid adding complexity only for the sake of making the system look more “enterprise.”

Instead, I focused on building a smaller but more realistic workflow that demonstrates:

* ingestion of messy operational data
* normalization into audit-ready records
* analyst review flows
* traceability back to source files

I felt this was more aligned with the actual problem the assignment is trying to evaluate.
