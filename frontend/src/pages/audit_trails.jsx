import React, { useEffect, useMemo } from "react";
import { PaginationControls, buildAuditRows } from "../utils/dashboardHelpers";

function AuditTrailPage({ auditLogs, sourceFiles, rawRecords, activities, page, setPage }) {
  const pageSize = 8;
  const auditRows = useMemo(() => buildAuditRows(auditLogs, sourceFiles, rawRecords, activities), [
    auditLogs,
    sourceFiles,
    rawRecords,
    activities,
  ]);
  const totalPages = Math.max(1, Math.ceil(auditRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentRows = auditRows.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
        
          <h1 style={{color: "#2f6d4a"}}>Audit Trail</h1>
        </div>
        <span className="badge">{auditRows.length} events</span>
      </div>

     

      <div className="list-summary">
        <span>
          Showing {auditRows.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, auditRows.length)} of {auditRows.length}
        </span>
        <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Source file</th>
              <th>Upload time</th>
              <th>Review time</th>
              <th>Reviewer</th>
              <th>Status change</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty">
                  No audit trail events yet.
                </td>
              </tr>
            ) : (
              currentRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.event_label}</td>
                  <td>{row.source_file_name || "-"}</td>
                  <td>{row.upload_time || "-"}</td>
                  <td>{row.review_time || "-"}</td>
                  <td>{row.reviewer || "-"}</td>
                  <td>{row.status_change || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AuditTrailPage;
