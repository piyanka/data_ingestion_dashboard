import React, { useEffect } from "react";
import { PaginationControls, previewJson } from "../utils/dashboardHelpers";

function RawRecordsPage({
  rawRecords,
  sourceFiles,
  page,
  setPage,
  selectedRawRecordId,
  setSelectedRawRecordId,
}) {
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(rawRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentRows = rawRecords.slice(startIndex, startIndex + pageSize);
  const selectedRawRecord =
    rawRecords.find((record) => String(record.id) === String(selectedRawRecordId)) || currentRows[0] || null;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  useEffect(() => {
    if (!selectedRawRecordId && currentRows.length > 0) {
      setSelectedRawRecordId(currentRows[0].id);
    }
  }, [currentRows, selectedRawRecordId, setSelectedRawRecordId]);

  useEffect(() => {
    if (
      currentRows.length > 0 &&
      !currentRows.some((record) => String(record.id) === String(selectedRawRecordId))
    ) {
      setSelectedRawRecordId(currentRows[0].id);
    }
  }, [safePage, currentRows, selectedRawRecordId, setSelectedRawRecordId]);

  // return (
  //   <section className="content-grid">
  //     <article className="panel">
  //       <div className="panel-header">
  //         <div>
  //           <p className="panel-title">Raw records dashboard</p>
  //           <h2>Original rows exactly as uploaded</h2>
  //         </div>
  //       </div>

  //       <div className="list-summary">
  //         <span>
  //           Showing {rawRecords.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, rawRecords.length)} of {rawRecords.length}
  //         </span>
  //         <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
  //       </div>

  //       <div className="table-wrap">
  //         <table>
  //           <thead>
  //             <tr>
  //               <th>Row</th>
  //               <th>Source file</th>
  //               <th>Status</th>
  //               <th>Payload preview</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {currentRows.length === 0 ? (
  //               <tr>
  //                 <td colSpan="4" className="table-empty">
  //                   No raw records have been uploaded yet.
  //                 </td>
  //               </tr>
  //             ) : (
  //               currentRows.map((record) => (
  //                 <tr
  //                   key={record.id}
  //                   className={`clickable-row ${String(record.id) === String(selectedRawRecord?.id) ? "selected-row" : ""}`}
  //                   onClick={() => setSelectedRawRecordId(record.id)}
  //                 >
  //                   <td>{record.row_number}</td>
  //                   <td>{record.source_file_filename || `Source file ${record.source_file}`}</td>
  //                   <td>
  //                     <span className={`status-pill status-${record.parse_status}`}>{record.parse_status}</span>
  //                   </td>
  //                   <td>{previewJson(record.raw_payload)}</td>
  //                 </tr>
  //               ))
  //             )}
  //           </tbody>
  //         </table>
  //       </div>
  //     </article>

  //     <article className="panel">
  //       <div className="panel-header">
  //         <div>
  //           <p className="panel-title">Raw payload detail</p>
  //           <h2>What was actually received</h2>
  //         </div>
  //         {selectedRawRecord ? <span className="badge">{selectedRawRecord.parse_status}</span> : null}
  //       </div>

  //       {selectedRawRecord ? (
  //         <div className="detail-stack">
  //           <div className="detail-row">
  //             <span>Source file</span>
  //             <strong>{selectedRawRecord.source_file_filename || `Source file ${selectedRawRecord.source_file}`}</strong>
  //           </div>
  //           <div className="detail-row">
  //             <span>Row number</span>
  //             <strong>{selectedRawRecord.row_number}</strong>
  //           </div>
  //           <div className="detail-row">
  //             <span>Parse status</span>
  //             <strong>{selectedRawRecord.parse_status}</strong>
  //           </div>
  //           {selectedRawRecord.error_message ? (
  //             <div className="issue-card severity-high">
  //               <strong>Parse error</strong>
  //               <span>{selectedRawRecord.error_message}</span>
  //             </div>
  //           ) : null}
  //           <pre className="raw-json">{JSON.stringify(selectedRawRecord.raw_payload, null, 2)}</pre>
  //         </div>
  //       ) : (
  //         <div className="empty-state">Select a raw row to inspect the full uploaded payload.</div>
  //       )}
  //     </article>
  //   </section>
  // );
  return (
  <section className="raw-records-layout">
    {/* LEFT SIDE */}
    <article className="panel raw-table-panel">
      <div className="modern-panel-header">
        <div>
          <p className="panel-title">
            Raw records dashboard
          </p>

          <h2>Uploaded source records</h2>

          {/* <p className="panel-subtitle">
            Original uploaded rows preserved before
            normalization and validation.
          </p> */}
        </div>

        <div className="records-count-card">
          <strong>{rawRecords.length}</strong>
          <span>Total Records</span>
        </div>
      </div>

      <div className="list-summary modern-summary">
        <span>
          Showing{" "}
          {rawRecords.length === 0
            ? 0
            : startIndex + 1}
          -
          {Math.min(
            startIndex + pageSize,
            rawRecords.length
          )}{" "}
          of {rawRecords.length}
        </span>

        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <div className="modern-table-wrap">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Source File</th>
              <th>Status</th>
              <th>Payload Preview</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="table-empty"
                >
                  No raw records uploaded yet.
                </td>
              </tr>
            ) : (
              currentRows.map((record) => (
                <tr
                  key={record.id}
                  className={`modern-row ${
                    String(record.id) ===
                    String(selectedRawRecord?.id)
                      ? "active-row"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedRawRecordId(record.id)
                  }
                >
                  <td>
                    <div className="row-id">
                      {record.row_number}
                    </div>
                  </td>

                  <td>
                    <div className="file-cell">
                      <strong>
                        {record.source_file_filename ||
                          `Source file ${record.source_file}`}
                      </strong>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`modern-status status-${record.parse_status}`}
                    >
                      {record.parse_status}
                    </span>
                  </td>

                  <td className="payload-preview">
                    {previewJson(record.raw_payload)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>

    {/* RIGHT SIDE */}
    <article className="panel payload-panel">
      <div className="modern-panel-header">
        <div>
          <p className="panel-title">
            Payload inspection
          </p>

          <h2>Raw payload details</h2>

          {/* <p className="panel-subtitle">
            Full uploaded JSON payload with parser
            status and errors.
          </p> */}
        </div>

        {selectedRawRecord ? (
          <span
            className={`modern-status status-${selectedRawRecord.parse_status}`}
          >
            {selectedRawRecord.parse_status}
          </span>
        ) : null}
      </div>

      {selectedRawRecord ? (
        <div className="payload-content">
          <div className="payload-meta-grid">
            <div className="payload-meta-card">
              <span>Source File</span>

              <strong>
                {selectedRawRecord.source_file_filename ||
                  `Source file ${selectedRawRecord.source_file}`}
              </strong>
            </div>

            <div className="payload-meta-card">
              <span>Row Number</span>

              <strong>
                {selectedRawRecord.row_number}
              </strong>
            </div>
          </div>

          {selectedRawRecord.error_message ? (
            <div className="error-alert">
              <strong>Parse Error</strong>

              <p>
                {selectedRawRecord.error_message}
              </p>
            </div>
          ) : null}

          <div className="json-viewer">
            <div className="json-header">
              RAW PAYLOAD JSON
            </div>

            <pre className="raw-json-raw_records">
              {JSON.stringify(
                selectedRawRecord.raw_payload,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      ) : (
        <div className="empty-state modern-empty">
          Select a record to inspect the uploaded
          payload.
        </div>
      )}
    </article>
  </section>
);
}

export default RawRecordsPage;
