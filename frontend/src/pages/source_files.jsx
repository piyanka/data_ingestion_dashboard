import React from "react";
import { sourceLabels } from "../constants";
import { formatDateTime } from "../utils/dashboardHelpers";

function SourceFilesPage({
  sourceFiles,
  organizations,
  selectedSourceFileId,
  setSelectedSourceFileId,
  selectedSourceFile,
  sourceFileEditForm,
  setSourceFileEditForm,
  handleSourceFileSave,
  handleSourceFileDelete,
  saving,
}) {
  const organizationLabel =
    organizations.find((organization) => String(organization.id) === String(sourceFileEditForm.organization_id))
      ?.name || "Select organization";

  return (
    <section className="content-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Source files dashboard</p>
            <h2>Upload History</h2>
          </div>
        </div>

        <p className="section-copy">
          Exact duplicate uploads are blocked by checksum. If an analyst needs to correct a batch,
          they can update the file metadata here or delete the whole batch before re-uploading the corrected file.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Source</th>
                <th>Status</th>
                <th>Rows</th>
                <th>Duplicate</th>
                <th>Uploaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sourceFiles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    No source files have been uploaded yet.
                  </td>
                </tr>
              ) : (
                sourceFiles.map((file) => (
                  <tr
                    key={file.id}
                    className={`clickable-row ${String(file.id) === String(selectedSourceFileId) ? "selected-row" : ""}`}
                    onClick={() => setSelectedSourceFileId(file.id)}
                  >
                    <td>{file.filename}</td>
                    <td>{sourceLabels[file.source_type] || file.source_type}</td>
                    <td>
                      <span className={`status-pill status-${file.processing_status}`}>
                        {file.processing_status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {file.successful_rows}/{file.total_rows} successful
                    </td>
                    <td>
                      {file.is_duplicate || file.duplicate_count > 1 ? (
                        <span className="status-pill status-rejected">Possible duplicate</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{formatDateTime(file.uploaded_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-btn mini-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedSourceFileId(file.id);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Batch detail</p>
            <h2>Files Metadata </h2>
          </div>
          {selectedSourceFile ? (
            <span className={`status-pill status-${selectedSourceFile.processing_status}`}>
              {selectedSourceFile.processing_status.replaceAll("_", " ")}
            </span>
          ) : null}
        </div>

        {selectedSourceFile ? (
          <div className="detail-stack">
            <div className="detail-row">
              <span>Filename</span>
              <strong>{selectedSourceFile.filename}</strong>
            </div>
            <div className="detail-row">
              <span>Source type</span>
              <strong>{sourceLabels[selectedSourceFile.source_type] || selectedSourceFile.source_type}</strong>
            </div>
            <div className="detail-row">
              <span>Organization</span>
              <strong>{selectedSourceFile.organization_name || organizationLabel}</strong>
            </div>
            <div className="detail-row">
              <span>Uploaded</span>
              <strong>{formatDateTime(selectedSourceFile.uploaded_at)}</strong>
            </div>
            <div className="detail-row">
              <span>Duplicate count</span>
              <strong>{selectedSourceFile.duplicate_count || 1}</strong>
            </div>
            <div className="helper-banner">
              <strong>Note:</strong>
              <span>
                The file contents are intentionally not edited in place. If the CSV/XLSX itself changed, delete this batch and upload the corrected file again.
              </span>
            </div>

            <label>
              Organization
              <select
                value={sourceFileEditForm.organization_id}
                onChange={(event) =>
                  setSourceFileEditForm((current) => ({ ...current, organization_id: event.target.value }))
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

            <label>
              Source type
              <select
                value={sourceFileEditForm.source_type}
                onChange={(event) =>
                  setSourceFileEditForm((current) => ({ ...current, source_type: event.target.value }))
                }
              >
                <option value="sap">SAP</option>
                <option value="utility">Utility</option>
                <option value="travel">Travel</option>
              </select>
            </label>

            <label>
              Filename
              <input
                type="text"
                value={sourceFileEditForm.filename}
                onChange={(event) =>
                  setSourceFileEditForm((current) => ({ ...current, filename: event.target.value }))
                }
              />
            </label>

            <div className="button-row">
              <button
                className="primary-btn"
                type="button"
                disabled={saving}
                onClick={() => handleSourceFileSave(selectedSourceFile.id)}
              >
                {saving ? "Saving..." : "Update batch"}
              </button>
              <button
                className="danger-btn"
                type="button"
                disabled={saving}
                onClick={() => handleSourceFileDelete(selectedSourceFile.id)}
              >
                Delete batch
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">Select a source file to update its metadata or delete it.</div>
        )}
      </article>
    </section>
  );
}

export default SourceFilesPage;
