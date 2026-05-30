import React from "react";

function UploadPage({
  organizations,
  uploadForm,
  setUploadForm,
  handleUpload,
  uploading,
}) {
  const sourceOptions = [
    {
      value: "sap",
      label: "SAP fuel / procurement",
      detail: "Mixed units, ERP codes, inconsistent dates.",
    },
    {
      value: "utility",
      label: "Utility electricity",
      detail: "Billing periods, kWh / MWh, tariff data.",
    },
    {
      value: "travel",
      label: "Corporate travel",
      detail: "Flights, hotels, taxis, trains, sparse rows.",
    },
  ];

  return (
    <section className="panel upload-panel">
      <div style={{textAlign:  "center"}}>
          <p className="panel-title upload-font" >Upload dashboard</p>
      </div>
      
      <br/>
      <form className="form-grid" onSubmit={handleUpload}>
        <label className="full-width">
          Organization
          <select
            className="full-width-field"
            value={uploadForm.organization_id}
            onChange={(event) =>
              setUploadForm((current) => ({
                ...current,
                organization_id: event.target.value,
              }))
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
              setUploadForm((current) => ({
                ...current,
                filename: event.target.value,
              }))
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
                filename:
                  current.filename || event.target.files?.[0]?.name || "",
              }))
            }
          />
        </label>

        <div className="full-width">
          <button className="primary-btn upload-submit-btn" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload and process"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default UploadPage;
