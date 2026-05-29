import React from "react";
import { issueReasonLabels, issueTypeLabels, reviewStatusLabels, sourceLabels } from "../constants";

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function previewJson(value) {
  if (!value) return "-";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export function PaginationControls({ page, totalPages, onPageChange }) {
  return (
    <div className="pager">
      <button
        type="button"
        className="ghost-btn pager-btn"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span className="pager-label">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="ghost-btn pager-btn"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}

export function CompactQueueList({ reviewQueue, selectedRecord, setSelectedRecord, onSelect }) {
  return (
    <div className="compact-list">
      {reviewQueue.length === 0 ? (
        <div className="empty-state">No rows are waiting for review right now.</div>
      ) : (
        reviewQueue.map((activity) => (
          <button
            key={activity.id}
            className={`queue-item ${selectedRecord?.id === activity.id ? "selected" : ""}`}
            type="button"
            onClick={() => {
              if (setSelectedRecord) setSelectedRecord(activity);
              if (onSelect) onSelect(activity);
            }}
          >
            <div>
              <strong>{activity.activity_type}</strong>
              <span>{formatDate(activity.activity_date) || "No activity date"}</span>
            </div>
            <div className="queue-meta">
              <span>{sourceLabels[activity.source_type] || activity.source_type}</span>
              <span>
                {activity.quantity} {activity.unit}
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export function CompactIssueList({
  validationIssues,
  activities = [],
  selectedIssueId = null,
  onSelectIssue,
  sourceFiles = [],
  rawRecords = [],
}) {
  if (!validationIssues || validationIssues.length === 0) {
    return <div className="empty-state">No validation issues have been recorded yet.</div>;
  }

  return (
    <div className="compact-list">
      {validationIssues.slice(0, 8).map((issue) => {
        const activity = activities.find((item) => String(item.id) === String(issue.activity));
        const rawRecord = rawRecords.find((item) => String(item.id) === String(issue.raw_record));
        const sourceFile = rawRecord ? sourceFiles.find((file) => String(file.id) === String(rawRecord.source_file)) : null;
        const issueTypeLabel = getIssueTypeLabel(issue, activity);
        return (
          <button
            key={issue.id}
            type="button"
            className={`issue-card severity-${issue.severity} ${String(selectedIssueId) === String(issue.id) ? "selected" : ""}`}
            onClick={() => onSelectIssue && onSelectIssue(issue.id)}
          >
            <strong>{issueTypeLabel}</strong>
            {/* <span>{issue.message}</span> */}
            <span>
              {sourceFile
                ? `${sourceFile.filename} • row ${rawRecord?.row_number || issue.raw_record_row_number || "-"}`
                : issue.source_file_filename
                  ? `${issue.source_file_filename} • row ${issue.raw_record_row_number || "-"}`
                  : issue.raw_record_row_number
                    ? `Row ${issue.raw_record_row_number}`
                    : "Raw record only"}
            </span>
            <small>
              {activity
                ? `${activity.activity_type} • ${sourceLabels[activity.source_type] || activity.source_type}`
                : `Activity ${issue.activity || "raw record only"}`}
            </small>
          </button>
        );
      })}
    </div>
  );
}

export function ValidationIssueDetail({ issue, activities, rawRecords, sourceFiles, onApprove, onReject }) {
  const activity = activities.find((item) => String(item.id) === String(issue.activity)) || null;
  const rawRecord = rawRecords.find((item) => String(item.id) === String(issue.raw_record)) || null;
  const sourceFile = rawRecord ? sourceFiles.find((file) => String(file.id) === String(rawRecord.source_file)) || null : null;
  const issueTypeLabel = getIssueTypeLabel(issue, activity);
  const issueReasonLabel = getIssueReasonLabel(issue, activity);

  return (
    <div className="detail-stack">
      <div className="detail-row">
        <span>Issue type</span>
        <strong>{issueTypeLabel}</strong>
      </div>
      <div className="detail-row">
        <span>Severity</span>
        <strong>{issue.severity}</strong>
      </div>
      <div className="detail-row">
        <span>Reason</span>
        <strong>{issueReasonLabel}</strong>
      </div>
      <div className="detail-row">
        <span>Source file</span>
        <strong>{sourceFile ? sourceFile.filename : issue.source_file_filename || "Unknown"}</strong>
      </div>
      <div className="detail-row">
        <span>Row number</span>
        <strong>{rawRecord ? rawRecord.row_number : issue.raw_record_row_number || "-"}</strong>
      </div>

      {activity ? (
        <>
          <div className="panel-divider" />
          <p className="panel-title">Normalized activity</p>
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
            <span>Scope</span>
            <strong>{activity.scope?.replace("_", " ").toUpperCase()}</strong>
          </div>
          <div className="detail-row">
            <span>Status</span>
            <strong>{reviewStatusLabels[activity.status] || activity.status}</strong>
          </div>
          <div className="button-row">
            <button className="primary-btn" type="button" onClick={onApprove}>
              Mark approved & lock
            </button>
            <button className="danger-btn" type="button" onClick={onReject}>
              Mark rejected
            </button>
          </div>
        </>
      ) : null}

      {rawRecord ? (
        <>
          <div className="panel-divider" />
          <p className="panel-title">Raw payload</p>
          <pre className="raw-json">{JSON.stringify(rawRecord.raw_payload, null, 2)}</pre>
        </>
      ) : null}
    </div>
  );
}

export function buildAuditRows(auditLogs, sourceFiles, rawRecords, activities) {
  const sourceFileMap = new Map(sourceFiles.map((file) => [String(file.id), file]));
  const rawRecordMap = new Map(rawRecords.map((record) => [String(record.id), record]));
  const activityMap = new Map(activities.map((activity) => [String(activity.id), activity]));

  const uploadRows = sourceFiles.map((file) => ({
    key: `upload-${file.id}`,
    event_label: "Upload",
    source_file_name: file.filename,
    upload_time: formatDateTime(file.uploaded_at),
    review_time: "-",
    reviewer: "System",
    status_change: file.processing_status.replaceAll("_", " "),
    sortKey: new Date(file.uploaded_at).getTime(),
  }));

  const sourceFileAuditRows = auditLogs
    .filter((log) => log.entity_type === "SourceFile" && log.action_type !== "ingest")
    .map((log) => {
      const currentFile = sourceFileMap.get(String(log.entity_id));
      const filename = currentFile?.filename || log.new_values?.filename || log.old_values?.filename || `Source file ${log.entity_id}`;
      const actionLabel =
        log.action_type === "delete"
          ? "Delete"
          : log.action_type === "update"
            ? "Update"
            : log.action_type.replaceAll("_", " ");
      let statusChange = actionLabel;
      if (log.action_type === "update") {
        const oldName = log.old_values?.filename || filename;
        const newName = log.new_values?.filename || filename;
        statusChange = oldName === newName ? "Metadata updated" : `${oldName} → ${newName}`;
      }
      if (log.action_type === "delete") {
        statusChange = "Deleted";
      }
      return {
        key: `source-file-${log.id}`,
        event_label: `${actionLabel} source file`,
        source_file_name: filename,
        upload_time: currentFile ? formatDateTime(currentFile.uploaded_at) : "-",
        review_time: formatDateTime(log.changed_at),
        reviewer: log.changed_by_display || "System",
        status_change: statusChange,
        sortKey: new Date(log.changed_at).getTime(),
      };
    });

  const reviewRows = auditLogs
    .filter((log) => log.entity_type === "NormalizedActivity" && log.action_type === "review")
    .map((log) => {
      const activity = activityMap.get(String(log.entity_id));
      const rawRecord = activity ? rawRecordMap.get(String(activity.raw_record)) : null;
      const sourceFile = rawRecord ? sourceFileMap.get(String(rawRecord.source_file)) : null;
      const oldStatus = log.old_values?.status || "unknown";
      const newStatus = log.new_values?.status || "unknown";
      return {
        key: `review-${log.id}`,
        event_label: "Review",
        source_file_name: sourceFile ? sourceFile.filename : activity ? `Activity ${activity.id}` : `Activity ${log.entity_id}`,
        upload_time: sourceFile ? formatDateTime(sourceFile.uploaded_at) : "-",
        review_time: formatDateTime(log.changed_at),
        reviewer: log.changed_by_display || "System",
        status_change: `${oldStatus.replaceAll("_", " ")} → ${newStatus.replaceAll("_", " ")}`,
        sortKey: new Date(log.changed_at).getTime(),
      };
    });

  return [...reviewRows, ...sourceFileAuditRows, ...uploadRows].sort((a, b) => b.sortKey - a.sortKey);
}

function getIssueTypeLabel(issue, activity) {
  if (issue.issue_type === "non_positive_quantity" && activity?.quantity !== undefined && activity?.quantity !== null) {
    if (String(activity.quantity) === "0") return issueTypeLabels.quantity_is_zero;
    if (Number(activity.quantity) < 0) return issueTypeLabels.quantity_below_zero;
  }
  return issueTypeLabels[issue.issue_type] || issue.issue_type;
}

function getIssueReasonLabel(issue, activity) {
  if (issue.issue_type === "non_positive_quantity" && activity?.quantity !== undefined && activity?.quantity !== null) {
    if (String(activity.quantity) === "0") return issueReasonLabels.quantity_is_zero;
    if (Number(activity.quantity) < 0) return issueReasonLabels.quantity_below_zero;
  }
  return issueReasonLabels[issue.issue_type] || issue.message;
}
