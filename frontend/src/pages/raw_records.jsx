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


  return (
  <section className="raw-records-layout">
    {/* LEFT SIDE */}
    <article className="panel raw-table-panel">
      <div className="modern-panel-header">
        <div>

          <h1 style={{color: "#2f6d4a"}}>Row Records</h1>


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
          
          <h2 style={{color: "#2f6d4a"}}>Raw payload </h2>

    
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
