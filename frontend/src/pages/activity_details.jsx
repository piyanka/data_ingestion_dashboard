import React from "react";
import { reviewStatusLabels, sourceLabels } from "../constants";
import { CompactIssueList, formatDate, formatDateTime } from "../utils/dashboardHelpers";

function ActivityDetailPage({ activity, validationIssues, onBack, onOpenReview }) {
  const linkedIssues = validationIssues.filter((issue) => String(issue.activity) === String(activity?.id));

  if (!activity) {
    return (
      <section className="panel">
        <h2>Activity detail</h2>
        <p className="empty-state">Choose a row from the activities dashboard first.</p>
        <button className="ghost-btn" type="button" onClick={onBack}>
          Back to activities
        </button>
      </section>
    );
  }

  return (
    <section className="detail-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Activity detail dashboard</p>
            <h2>Source-to-normalized lineage</h2>
          </div>
          <span className="badge">{reviewStatusLabels[activity.status]}</span>
        </div>

        <div className="detail-stack">
          <div className="detail-row">
            <span>Activity type</span>
            <strong>{activity.activity_type}</strong>
          </div>
          <div className="detail-row">
            <span>Source</span>
            <strong>{sourceLabels[activity.source_type] || activity.source_type}</strong>
          </div>
          <div className="detail-row">
            <span>Date</span>
            <strong>{formatDate(activity.activity_date) || "Missing"}</strong>
          </div>
          <div className="detail-row">
            <span>Quantity</span>
            <strong>
              {activity.quantity} {activity.unit}
            </strong>
          </div>
          <div className="detail-row">
            <span>Original value</span>
            <strong>
              {activity.original_quantity || "-"} {activity.original_unit || ""}
            </strong>
          </div>
          <div className="detail-row">
            <span>Reviewed at</span>
            <strong>{activity.reviewed_at ? formatDateTime(activity.reviewed_at) : "Not yet"}</strong>
          </div>
          <div className="button-row">
            <button className="ghost-btn" type="button" onClick={onBack}>
              Back to activities
            </button>
            <button className="primary-btn" type="button" onClick={onOpenReview}>
              Open review queue
            </button>
          </div>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Linked issues</p>
            <h2>What needs attention</h2>
          </div>
        </div>
        <CompactIssueList validationIssues={linkedIssues} />
      </article>
    </section>
  );
}

export default ActivityDetailPage;
