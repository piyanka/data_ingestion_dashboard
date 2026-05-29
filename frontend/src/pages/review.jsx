import React, { useEffect } from "react";
import { reviewStatusLabels, sourceLabels } from "../constants";
import { CompactIssueList, CompactQueueList, PaginationControls, formatDate } from "../utils/dashboardHelpers";

function ReviewPage({
  reviewQueue,
  rawRecords,
  sourceFiles,
  selectedRecord,
  reviewNotes,
  setReviewNotes,
  setSelectedRecord,
  handleReview,
  selectedIssues,
  page,
  setPage,
}) {
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(reviewQueue.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentQueue = reviewQueue.slice(startIndex, startIndex + pageSize);
  const selectedRawRecord = selectedRecord
    ? rawRecords.find((record) => String(record.id) === String(selectedRecord.raw_record))
    : null;
  const selectedSourceFile = selectedRawRecord
    ? sourceFiles.find((file) => String(file.id) === String(selectedRawRecord.source_file))
    : null;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  return (
    <section className="content-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Review queue dashboard</p>
            <h2>Rows waiting for analyst sign-off</h2>
          </div>
          <span className="badge">{reviewQueue.length} pending</span>
        </div>
        <div className="list-summary">
          <span>
            Showing {reviewQueue.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, reviewQueue.length)} of {reviewQueue.length}
          </span>
          <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <CompactQueueList
          reviewQueue={currentQueue}
          selectedRecord={selectedRecord}
          setSelectedRecord={setSelectedRecord}
          onSelect={(activity) => setReviewNotes(activity.review_notes || "")}
        />
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Review detail</p>
            <h2>Approve, Reject, or Lock</h2>
          </div>
          {selectedRecord ? <span className="badge">{reviewStatusLabels[selectedRecord.status]}</span> : null}
        </div>

        {selectedRecord ? (
          <div className="detail-stack">
            <div className="detail-row">
              <span>Activity</span>
              <strong>{selectedRecord.activity_type}</strong>
            </div>
            <div className="detail-row">
              <span>Source</span>
              <strong>{sourceLabels[selectedRecord.source_type] || selectedRecord.source_type}</strong>
            </div>
            <div className="detail-row">
              <span>Date</span>
              <strong>{formatDate(selectedRecord.activity_date) || "Missing"}</strong>
            </div>
            <div className="detail-row">
              <span>Quantity</span>
              <strong>
                {selectedRecord.quantity} {selectedRecord.unit}
              </strong>
            </div>
            <div className="detail-row">
              <span>Scope</span>
              <strong>{selectedRecord.scope?.replace("_", " ").toUpperCase()}</strong>
            </div>
            <div className="panel-divider" />
            <div>
              <p className="panel-title">Raw source row</p>
              {selectedRawRecord ? (
                <div className="detail-stack">
                  <div className="detail-row">
                    <span>Source file</span>
                    <strong>{selectedSourceFile ? selectedSourceFile.filename : `Source file ${selectedRawRecord.source_file}`}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Row number</span>
                    <strong>{selectedRawRecord.row_number}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Parse status</span>
                    <strong>{selectedRawRecord.parse_status}</strong>
                  </div>
                  <pre className="raw-json">{JSON.stringify(selectedRawRecord.raw_payload, null, 2)}</pre>
                </div>
              ) : (
                <div className="empty-state">The original raw row could not be located for this activity.</div>
              )}
            </div>
            <label className="full-width">
              Review notes
              <br/>
              <textarea
                rows="4"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Add a short reason for approval or rejection."
                style={{width: "100%"}}
              />
            </label>
            <div className="button-row">
              <button className="primary-btn" type="button" onClick={() => handleReview(selectedRecord.id, "approved")}>
                Approve
              </button>
              <button className="danger-btn" type="button" onClick={() => handleReview(selectedRecord.id, "rejected")}>
                Reject
              </button>
              <button className="ghost-btn" type="button" onClick={() => handleReview(selectedRecord.id, "locked")}>
                Lock
              </button>
            </div>
            <div className="panel-divider" />
            <div>
              <p className="panel-title">Issues linked to this row</p>
              <CompactIssueList validationIssues={selectedIssues} />
            </div>
          </div>
        ) : (
          <div className="empty-state">Pick a row from the list on the left to review it.</div>
        )}
      </article>
    </section>
  );
}

export default ReviewPage;
