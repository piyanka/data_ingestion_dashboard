import React from "react";

function UploadPage({ organizations, uploadForm, setUploadForm, handleUpload, uploading }) {
  const sourceOptions = [
    { value: "sap", label: "SAP fuel / procurement", detail: "Mixed units, ERP codes, inconsistent dates." },
    { value: "utility", label: "Utility electricity", detail: "Billing periods, kWh / MWh, tariff data." },
    { value: "travel", label: "Corporate travel", detail: "Flights, hotels, taxis, trains, sparse rows." },
  ];

  return (
    <section className="panel upload-panel" >
      <div className="upload-title">
        <div>
          <p className="panel-title upload-font" style={{font: 27}}>Upload dashboard</p>
          {/* <h2>Bring in a source export</h2> */}
        </div>
        {/* <span className="badge">CSV / XLSX</span> */}
      </div>

      {/* <p className="section-copy">
        This screen is for analysts or data ops users who receive files from SAP, utility portals,
        or travel platforms and need to load them into the pipeline.
      </p> */}

      {/* <div className="helper-banner">
        <strong>Tip:</strong>
        <span>Create an organization in Django admin first. Then choose the source lane below so uploads stay tied to the correct ingestion path.</span>
      </div> */}

      <form className="form-grid" onSubmit={handleUpload}>
        <label>
          Organization
          <select
            value={uploadForm.organization_id}
            onChange={(event) =>
              setUploadForm((current) => ({ ...current, organization_id: event.target.value }))
            }
          >
            <option value="">Select organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>

        <div className="full-width">
          <div className="source-chooser-label">Source lane</div>
          <div className="source-chooser">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`source-chip ${uploadForm.source_type === option.value ? "active" : ""}`}
                onClick={() =>
                  setUploadForm((current) => ({
                    ...current,
                    source_type: option.value,
                    file: null,
                    filename: "",
                  }))
                }
              >
                <strong>{option.label}</strong>
                <span>{option.detail}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="full-width">
          Filename
          <input
            type="text"
            value={uploadForm.filename}
            onChange={(event) =>
              setUploadForm((current) => ({ ...current, filename: event.target.value }))
            }
            placeholder="upload files"
          />
        </label>

        <label className="full-width">
          Upload file
          <input
            type="file"
            accept=".csv,.xlsx,.xlsm"
            onChange={(event) =>
              setUploadForm((current) => ({
                ...current,
                file: event.target.files?.[0] || null,
                filename: current.filename || event.target.files?.[0]?.name || "",
              }))
            }
          />
        </label>

        <button className="primary-btn" type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload and process"}
        </button>
      </form>

      {/* <div className="upload-hint-grid">
        <div className="info-card">
          <strong>Raw rows preserved</strong>
          <span>Every upload creates raw records before normalization, so nothing gets lost.</span>
        </div>
        <div className="info-card">
          <strong>Validation first</strong>
          <span>Suspicious rows are flagged immediately so analysts can review them.</span>
        </div>
        <div className="info-card">
          <strong>Separate emissions</strong>
          <span>Emissions are derived records and stay separate from the operational facts.</span>
        </div>
      </div> */}

      {/* <div className="flow-steps">
        <div className="flow-step">
          <strong>1. Upload</strong>
          <span>Choose a lane, attach the file, and upload.</span>
        </div>
        <div className="flow-step">
          <strong>2. Normalize</strong>
          <span>Raw rows become canonical activities with scope and unit handling.</span>
        </div>
        <div className="flow-step">
          <strong>3. Review</strong>
          <span>Analysts inspect the raw row, validation issues, and approve or reject.</span>
        </div>
        <div className="flow-step">
          <strong>4. Audit</strong>
          <span>Locked rows and review actions appear in the audit trail.</span>
        </div>
      </div> */}
    </section>
  );
}

export default UploadPage;
