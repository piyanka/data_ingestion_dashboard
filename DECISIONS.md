# DECISIONS.md

# Purpose

This document explains the main decisions I made while building the prototype:

* ambiguities I had to resolve
* what I chose
* why I chose it
* what I intentionally ignored
* what I would ask the PM if more clarification was available

The assignment intentionally leaves many implementation details open-ended, so part of the work was deciding what level of realism and scope made sense within the timeline.

---

# 1. Choosing File Uploads Instead of Direct APIs

## Ambiguity

The assignment mentions several possible ingestion methods:

* APIs
* file uploads
* manual workflows

but does not require a specific one.

## What I Chose

I chose CSV/XLSX uploads for:

* SAP
* utility data
* travel data

## Why

While researching the sources, I found that ESG onboarding often begins with exported operational reports before deeper integrations are built.

I also felt APIs would shift too much focus toward:

* authentication
* connector engineering
* provider-specific integration logic

instead of the actual problem the assignment is centered around:

* normalization
* traceability
* analyst review

## What I Ignored

I did not implement:

* live synchronization
* OAuth flows
* scheduled ingestion pipelines
* webhook-based updates

## What I Would Ask The PM

* Are clients expected to onboard through manual uploads initially?
* Is the long-term goal API-first ingestion or hybrid ingestion?
* How frequently do source schemas change across clients?

---

# 2. Limiting The SAP Scope

## Ambiguity

SAP exports can contain an enormous amount of operational data, and the assignment does not specify how much SAP complexity should be modeled.

## What I Chose

I limited the prototype to a smaller subset focused mainly on:

* fuel-related records
* procurement activity
* quantities
* units
* dates
* plant/vendor identifiers

## Why

During research, I found SAP exports significantly more complex than the other sources.

Many fields:

* require lookup tables
* depend on ERP-specific terminology
* are not directly useful for ESG calculations

Trying to model the entire ERP structure would make the prototype unnecessarily large and difficult to explain.

## What I Ignored

I did not attempt to handle:

* full SAP schemas
* nested ERP structures
* organization-specific customizations
* dynamic field mapping
* complete procurement workflows

## What I Would Ask The PM

* Which SAP modules are most important for ESG reporting?
* Are lookup tables provided externally?
* Should the system support configurable SAP mappings per client?

---

# 3. Handling Utility Data As Structured Portal Exports

## Ambiguity

Utility data can come from:

* PDFs
* APIs
* spreadsheets
* portal exports

The assignment does not specify which approach to use.

## What I Chose

I modeled utility ingestion using CSV/XLSX portal exports.

## Why

This felt like the most realistic and practical format for:

* facilities teams
* operational reporting
* ESG onboarding workflows

It also allowed me to focus on:

* billing periods
* unit normalization
* validation logic

instead of document parsing.

## What I Ignored

I did not implement:

* PDF OCR extraction
* utility-specific APIs
* interval-level meter ingestion

## What I Would Ask The PM

* Are utility bills usually uploaded manually by clients?
* Should the system support multi-region utility providers?
* How important is interval-level consumption data?

---

# 4. Handling Travel Data With Simplified Categories

## Ambiguity

Travel platforms expose different schemas depending on:

* flights
* hotels
* taxis
* trains

The assignment does not define how detailed travel modeling should be.

## What I Chose

I created a simplified travel ingestion model that supports:

* flights
* hotels
* trains
* taxis

using structured exports.

## Why

While researching travel platforms like SAP Concur, I noticed that:

* different categories expose different fields
* some records only contain airport codes
* distance is not always available

I wanted the prototype to reflect this inconsistency without overcomplicating the data model.

## What I Ignored

I did not implement:

* live travel platform integrations
* route enrichment services
* currency conversion workflows
* detailed booking metadata

## What I Would Ask The PM

* Which travel categories matter most for reporting?
* Should missing distances be estimated automatically?
* Are external enrichment services allowed?

---

# 5. Keeping Emission Calculations Simple

## Ambiguity

The assignment does not specify how advanced the emissions engine should be.

## What I Chose

I used simple activity × emission factor calculations.

## Why

The assignment explicitly mentions that the difficult problem is not the carbon math, but handling messy operational data from multiple systems.

Because of this, I spent more time on:

* ingestion
* normalization
* validation
* review workflows

instead of advanced accounting logic.

## What I Ignored

I did not implement:

* region-specific methodologies
* advanced Scope 3 logic
* supplier-specific factors
* regulatory methodology updates

## What I Would Ask The PM

* Which methodology standards should be supported?
* Should recalculation/versioning be included?
* Are external factor databases expected?

---

# 6. Building An Analyst-Focused Workflow Instead Of A Metrics Dashboard

## Ambiguity

The assignment asks for review and signoff workflows, but does not define the frontend experience.

## What I Chose

I designed the frontend around:

* ingestion
* review
* validation
* auditability

instead of building a metrics-heavy analytics dashboard.

## Why

I wanted the application to feel usable for:

* analysts
* operations teams
* non-technical reviewers

The main workflow became:
Upload → Normalize → Validate → Review → Approve

## What I Ignored

I did not build:

* advanced analytics dashboards
* forecasting
* executive reporting views
* visualization-heavy UI

## What I Would Ask The PM

* Who is the primary daily user of the platform?
* Are analysts or executives the main audience?
* How detailed should approval workflows become?

---

# Final Note

Throughout the project, I tried to make decisions that kept the prototype:

* realistic
* understandable
* operationally focused

instead of trying to simulate every possible enterprise feature.

My goal was to build a smaller system that clearly demonstrates:

* messy data ingestion
* normalization
* source traceability
* analyst review workflows
* audit-oriented thinking



# Reflection On Scope And Time Constraints

One thing I realized while doing this assignment is that most of the effort was not just coding — it was understanding how these systems actually work in real companies.

A lot of time went into researching:

* how SAP exports look
* how utility teams manage electricity data
* how travel platforms like SAP Concur and Navan work
* what these reports actually contain
* what formats companies realistically use

I spent time watching videos, reading documentation, checking community discussions, and trying to understand what real operational data looks like before designing the system.

I also spent time understanding what kinds of export formats are actually available in these systems and which ones are realistically used by third parties during onboarding.

For example:

* some platforms support APIs, PDFs, CSVs, and Excel exports
* some platforms mainly expose reporting data through admin exports
* some APIs exist but are not commonly used during early onboarding because of security and integration overhead

I did not want to randomly choose file formats for the prototype. I wanted the ingestion choices to feel realistic based on how companies actually exchange operational data during ESG onboarding.

Because of this, I spent time researching:

* what export options different platforms provide
* what data those exports usually contain
* which formats are easier for operational teams to share
* which formats are more practical for third-party ESG platforms to ingest

Another challenge was understanding:

* which fields are actually useful for ESG reporting
* what data should be ingested
* what should be ignored
* what kinds of inconsistencies normally exist

For example:

* SAP exports contain huge amounts of operational data
* utility billing periods do not align properly
* travel records are often incomplete

A lot of time also went into data modeling because I wanted the system to properly support:

* normalization
* auditability
* source traceability
* analyst review workflows

On the frontend side, I intentionally tried to avoid building a heavy dashboard full of metrics. Instead, I focused on making the workflow simpler and easier for analysts or non-technical users to understand.

Since the assignment timeline was only 4 days, I had to continuously balance:

* realism vs scope
* depth vs simplicity
* research vs implementation time

In several places, I intentionally kept things simpler so I could spend more time making the workflows feel realistic and understandable instead of trying to build every possible enterprise feature.
