import React, { useEffect } from "react";
import { CompactIssueList, PaginationControls, ValidationIssueDetail } from "../utils/dashboardHelpers";

function ValidationPage({
  validationIssues,
  activities,
  rawRecords,
  sourceFiles,
  page,
  setPage,
  selectedValidationIssue,
  selectedValidationIssueId,
  setSelectedValidationIssueId,
  handleReview,
}) {
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(validationIssues.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentIssues = validationIssues.slice(startIndex, startIndex + pageSize);

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
            <p className="panel-title">Validation dashboard</p>
            <h2>What needs human attention</h2>
          </div>
        </div>
        <div className="list-summary">
          <span>
            Showing {validationIssues.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + pageSize, validationIssues.length)} of {validationIssues.length}
          </span>
          <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <CompactIssueList
          validationIssues={currentIssues}
          activities={activities}
          selectedIssueId={selectedValidationIssueId}
          onSelectIssue={setSelectedValidationIssueId}
          sourceFiles={sourceFiles}
          rawRecords={rawRecords}
        />
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Issue detail</p>
            <h2>Flag</h2>
          </div>
        </div>
        {selectedValidationIssue ? (
          <ValidationIssueDetail
            issue={selectedValidationIssue}
            activities={activities}
            rawRecords={rawRecords}
            sourceFiles={sourceFiles}
            onReject={() => selectedValidationIssue.activity && handleReview(selectedValidationIssue.activity, "rejected", "Rejected from validation screen")}
            onApprove={() => selectedValidationIssue.activity && handleReview(selectedValidationIssue.activity, "approved", "Approved from validation screen")}
          />
        ) : (
          <div className="empty-state">Select a suspicious row to inspect the normalized activity and raw source data.</div>
        )}
      </article>
    </section>
  );
}

export default ValidationPage;
