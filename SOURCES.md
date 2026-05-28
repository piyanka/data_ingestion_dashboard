# Sources

## SAP

- Chosen shape: ERP export-style CSV/XLSX files.
- What matters: inconsistent units, abbreviated headers, plant/vendor codes, and date formats that need normalization.
- Current prototype assumption: each row can be stored raw and then mapped to a canonical activity.

## Utility

- Chosen shape: portal export or billing report CSV/XLSX.
- What matters: billing periods, tariff fields, and meter quantities that may appear in kWh or MWh.
- Current prototype assumption: electricity rows normalize to a Scope 2 activity.

## Travel

- Chosen shape: corporate travel export CSV/XLSX.
- What matters: flights, hotels, taxis, trains, sparse fields, and missing distance data.
- Current prototype assumption: travel rows normalize into a Scope 3 activity and may require fallback logic when distance is absent.

## Sample data verification

I have not yet been able to inspect the actual sample files in the workspace, so this document is the place I would update after reviewing them row by row.

