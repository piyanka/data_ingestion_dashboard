import React from "react";
import { sourceLabels } from "../constants";
import { formatDateTime } from "../utils/dashboardHelpers";

function SourceFilesPage({ sourceFiles, handleSourceFileReplace, saving }) {
  return (
    <section className="content-grid source-files-grid">
      <article className="panel">
        <div style={{textAlign: "center"}}>
          
            <h2 style={{color: "#2f6d4a"}}>Source Files</h2>
         
        </div>

        <br />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Source</th>
                <th>Status</th>
                <th>Rows</th>
                <th>Uploaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sourceFiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    No source files have been uploaded yet.
                  </td>
                </tr>
              ) : (
                sourceFiles.map((file) => (
                  <tr key={file.id}>
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
                    <td>{formatDateTime(file.uploaded_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-btn mini-btn"
                        disabled={saving}
                        onClick={() => handleSourceFileReplace(file)}
                      >
                        {saving ? "Replacing..." : "Re-upload"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default SourceFilesPage;
