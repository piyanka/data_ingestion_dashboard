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
  onDone,
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
            
            <h2 style={{color: "#2f6d4a"}}>Suspicious Rows</h2>
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
            <h2 style={{color: "#2f6d4a"}}>Issues</h2>
            
          </div>
        </div>

        {/* {validationIssues.filter((issue) => String(issue.activity) === String(selectedValidationIssue.activity)).length > 1 ? (
              <>
                <CompactIssueList
                  validationIssues={validationIssues.filter((issue) => String(issue.activity) === String(selectedValidationIssue.activity))}
                  activities={activities}
                  selectedIssueId={selectedValidationIssueId}
                  onSelectIssue={setSelectedValidationIssueId}
                  sourceFiles={sourceFiles}
                  rawRecords={rawRecords}
                  titleOnly
                  maxItems={validationIssues.filter((issue) => String(issue.activity) === String(selectedValidationIssue.activity)).length}
                />
              </>
            ) : null} */}

        <br />
        {selectedValidationIssue ? (
          <>
            <ValidationIssueDetail
              issue={selectedValidationIssue}
              activities={activities}
              rawRecords={rawRecords}
              sourceFiles={sourceFiles}
              onReject={async () => {
                if (!selectedValidationIssue.activity) return;
                await handleReview(selectedValidationIssue.activity, "rejected", "Rejected from validation screen");
                if (onDone) onDone();
              }}
              onApprove={async () => {
                if (!selectedValidationIssue.activity) return;
                await handleReview(selectedValidationIssue.activity, "approved", "Approved from validation screen");
                if (onDone) onDone();
              }}
            />
            
          </>
        ) : (
          <div className="empty-state">Select a suspicious row to inspect the normalized activity and raw source data.</div>
        )}
      </article>
    </section>
  );
}

export default ValidationPage;
