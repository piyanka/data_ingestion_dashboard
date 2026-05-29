import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { apiBase, deleteSourceFile, requestJson, updateSourceFile, uploadSourceFile } from "../api";
import { blankUpload, reviewStatusLabels, routeLabels, routes } from "../constants";
import MainLayout from "../layouts/MainLayout";
import ActivitiesPageRoute from "../pages/activities";
import ActivityDetailPageRoute from "../pages/activity_details";
import AuditTrailPageRoute from "../pages/audit_trails";
import OverviewPageRoute from "../pages/overview";
import RawRecordsPageRoute from "../pages/raw_records";
import ReviewPageRoute from "../pages/review";
import SourceFilesPageRoute from "../pages/source_files";
import UploadPageRoute from "../pages/upload";
import ValidationPageRoute from "../pages/validation";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <DashboardApp />
    </BrowserRouter>
  );
}

function DashboardApp() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const route = location.pathname === "/index.html" ? "/" : location.pathname;
  const [uploadForm, setUploadForm] = useState(blankUpload);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState("");
  const [sourceFiles, setSourceFiles] = useState([]);
  const [selectedSourceFileId, setSelectedSourceFileId] = useState(null);
  const [sourceFileEditForm, setSourceFileEditForm] = useState({
    organization_id: "",
    source_type: "sap",
    filename: "",
  });
  const [sourceFileSaving, setSourceFileSaving] = useState(false);
  const [rawRecords, setRawRecords] = useState([]);
  const [activities, setActivities] = useState([]);
  const [validationIssues, setValidationIssues] = useState([]);
  const [selectedValidationIssueId, setSelectedValidationIssueId] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedRawRecordId, setSelectedRawRecordId] = useState(null);
  const [validationPage, setValidationPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [rawRecordsPage, setRawRecordsPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [activityFilters, setActivityFilters] = useState({
    sourceType: "all",
    scope: "all",
    status: "all",
    activityType: "",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedActivity = useMemo(
    () => activities.find((activity) => String(activity.id) === String(selectedActivityId)) || null,
    [activities, selectedActivityId]
  );

  const selectedValidationIssue = useMemo(
    () =>
      validationIssues.find((issue) => String(issue.id) === String(selectedValidationIssueId)) || null,
    [validationIssues, selectedValidationIssueId]
  );

  const selectedSourceFile = useMemo(
    () => sourceFiles.find((file) => String(file.id) === String(selectedSourceFileId)) || null,
    [sourceFiles, selectedSourceFileId]
  );

  const activeOrganization = useMemo(
    () => organizations.find((organization) => String(organization.id) === String(activeOrganizationId)) || null,
    [organizations, activeOrganizationId]
  );

  const summary = useMemo(() => {
    const pending = reviewQueue.length;
    const issues = validationIssues.length;
    const processed = sourceFiles.filter((file) =>
      ["processed", "processed_with_errors"].includes(file.processing_status)
    ).length;
    const locked = activities.filter((activity) => activity.status === "locked").length;

    return [
      {
        label: "Source files",
        value: sourceFiles.length,
        detail: "Uploaded batches from SAP, utility, and travel",
      },
      {
        label: "Pending review",
        value: pending,
        detail: "Rows waiting for analyst sign-off",
      },
      {
        label: "Validation issues",
        value: issues,
        detail: "Suspicious or incomplete records flagged",
      },
      {
        label: "Locked rows",
        value: locked,
        detail: "Activities finalized after analyst review",
      },
    ];
  }, [sourceFiles, reviewQueue, validationIssues, activities]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const match = route.match(/^\/activities\/(\d+)$/);
    if (match) {
      setSelectedActivityId(match[1]);
    }
  }, [route]);

  useEffect(() => {
    if (!uploadForm.organization_id && organizations.length === 1) {
      setUploadForm((current) => ({ ...current, organization_id: organizations[0].id }));
    }
  }, [organizations, uploadForm.organization_id]);

  useEffect(() => {
    if (activeOrganizationId) {
      setUploadForm((current) => ({
        ...current,
        organization_id: current.organization_id || activeOrganizationId,
      }));
    }
  }, [activeOrganizationId]);

  useEffect(() => {
    if (organizations.length === 0) {
      if (activeOrganizationId !== "") {
        setActiveOrganizationId("");
      }
      return;
    }

    if (!activeOrganization || !organizations.some((organization) => String(organization.id) === String(activeOrganizationId))) {
      const firstOrganization = organizations[0];
      setActiveOrganizationId(String(firstOrganization.id));
    }
  }, [organizations, activeOrganization, activeOrganizationId]);

  useEffect(() => {
    if (validationIssues.length === 0) {
      if (selectedValidationIssueId !== null) {
        setSelectedValidationIssueId(null);
      }
      return;
    }

    if (!selectedValidationIssue) {
      setSelectedValidationIssueId(validationIssues[0].id);
    }
  }, [validationIssues, selectedValidationIssue, selectedValidationIssueId]);

  async function loadDashboard(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const [organizationsRes, sourceFilesRes, rawRecordsRes, activitiesRes, reviewQueueRes, issuesRes, auditLogsRes] = await Promise.all([
        requestJson("/organizations/"),
        requestJson("/source-files/"),
        requestJson("/raw-records/"),
        requestJson("/activities/"),
        requestJson("/review-queue/"),
        requestJson("/validation-issues/"),
        requestJson("/audit-logs/"),
      ]);
      setOrganizations(organizationsRes);
      setSourceFiles(sourceFilesRes);
      setRawRecords(rawRecordsRes);
      setActivities(activitiesRes);
      setReviewQueue(reviewQueueRes);
      setValidationIssues(issuesRes);
      setAuditLogs(auditLogsRes);
      if (!selectedValidationIssueId && issuesRes.length > 0) {
        setSelectedValidationIssueId(issuesRes[0].id);
      }
      if (!selectedSourceFileId && sourceFilesRes.length > 0) {
        setSelectedSourceFileId(sourceFilesRes[0].id);
      }
      if (!selectedRecord && reviewQueueRes.length > 0) {
        setSelectedRecord(reviewQueueRes[0]);
        setReviewNotes(reviewQueueRes[0].review_notes || "");
      }
      if (!selectedRawRecordId && rawRecordsRes.length > 0) {
        setSelectedRawRecordId(rawRecordsRes[0].id);
      }
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (sourceFiles.length === 0) {
      if (selectedSourceFileId !== null) {
        setSelectedSourceFileId(null);
      }
      return;
    }

    if (!selectedSourceFile) {
      setSelectedSourceFileId(sourceFiles[0].id);
      return;
    }
    if (selectedSourceFile) {
      setSourceFileEditForm({
        organization_id: selectedSourceFile.organization,
        source_type: selectedSourceFile.source_type,
        filename: selectedSourceFile.filename,
      });
    }
  }, [selectedSourceFile, sourceFiles, selectedSourceFileId]);

  async function handleUpload(event) {
    event.preventDefault();
    setUploading(true);
    setMessage("");
    setError("");
    try {
      if (!uploadForm.organization_id) {
        throw new Error("Please enter an organization ID from Django admin.");
      }
      if (!uploadForm.file) {
        throw new Error("Please choose a CSV or XLSX file to upload.");
      }
      await uploadSourceFile(uploadForm);
      setUploadForm((current) => ({
        ...blankUpload,
        organization_id: current.organization_id,
      }));
      setMessage("File uploaded and processed successfully.");
      await loadDashboard(true);
      navigate("/review");
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleReview(activityId, status, notes = reviewNotes) {
    setError("");
    setMessage("");
    try {
      const finalStatus = status === "approved" ? "locked" : status;
      const updated = await requestJson(`/activities/${activityId}/review/`, {
        method: "POST",
        body: JSON.stringify({
          status: finalStatus,
          review_notes: notes,
        }),
      });
      setMessage(`Activity ${updated.id} marked as ${reviewStatusLabels[updated.status] || updated.status}.`);
      setReviewNotes("");
      setSelectedRecord(updated);
      await loadDashboard(true);
    } catch (err) {
      setError(err.message || "Unable to update review status.");
    }
  }

  async function handleSourceFileSave(sourceFileId) {
    setSourceFileSaving(true);
    setError("");
    setMessage("");
    try {
      await updateSourceFile(sourceFileId, {
        organization_id: sourceFileEditForm.organization_id,
        source_type: sourceFileEditForm.source_type,
        filename: sourceFileEditForm.filename,
      });
      setMessage("Source file updated.");
      await loadDashboard(true);
    } catch (err) {
      setError(err.message || "Unable to update source file.");
    } finally {
      setSourceFileSaving(false);
    }
  }

  async function handleSourceFileDelete(sourceFileId) {
    const confirmed = window.confirm(
      "Delete this source file? This will also remove its raw records, normalized activities, validation issues, and emissions."
    );
    if (!confirmed) return;
    setSourceFileSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteSourceFile(sourceFileId);
      setMessage("Source file deleted.");
      setSelectedSourceFileId(null);
      await loadDashboard(true);
    } catch (err) {
      setError(err.message || "Unable to delete source file.");
    } finally {
      setSourceFileSaving(false);
    }
  }

  function navigate(path) {
    routerNavigate(path);
  }

  function openActivity(activity) {
    setSelectedActivityId(activity.id);
    navigate(`/activities/${activity.id}`);
  }

  const selectedIssues = useMemo(() => {
    if (!selectedRecord) return [];
    return validationIssues.filter((issue) => String(issue.activity) === String(selectedRecord.id));
  }, [selectedRecord, validationIssues]);

  const routeLabel = routeLabels[route] || "Activity detail";

  return (
    <>
      <MainLayout
        routes={routes}
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
        activeOrganization={activeOrganization}
        onOrganizationChange={(organizationId) => {
          setActiveOrganizationId(organizationId);
          setUploadForm((current) => ({ ...current, organization_id: organizationId }));
        }}
        routeLabel={routeLabel}
        onRefresh={() => loadDashboard(true)}
        refreshing={refreshing}
      >
        {route === "/" ? (
          <OverviewPageRoute
            summary={summary}
            organizations={organizations}
            sourceFiles={sourceFiles}
            reviewQueue={reviewQueue}
            validationIssues={validationIssues}
            activities={activities}
            rawRecords={rawRecords}
            onUpload={() => navigate("/upload")}
            onUploadSap={() => {
              setUploadForm((current) => ({ ...current, source_type: "sap", file: null, filename: "" }));
              navigate("/upload");
            }}
            onUploadUtility={() => {
              setUploadForm((current) => ({ ...current, source_type: "utility", file: null, filename: "" }));
              navigate("/upload");
            }}
            onUploadTravel={() => {
              setUploadForm((current) => ({ ...current, source_type: "travel", file: null, filename: "" }));
              navigate("/upload");
            }}
            onRawRecords={() => navigate("/raw-records")}
            onReview={() => navigate("/review")}
            onIssues={() => navigate("/validation")}
            onActivities={() => navigate("/activities")}
            onAuditTrail={() => navigate("/audit-trail")}
          />
        ) : null}

        {route === "/upload" ? (
          <UploadPageRoute
            organizations={organizations}
            uploadForm={uploadForm}
            setUploadForm={setUploadForm}
            handleUpload={handleUpload}
            uploading={uploading}
          />
        ) : null}

        {route === "/raw-records" ? (
          <RawRecordsPageRoute
            rawRecords={rawRecords}
            sourceFiles={sourceFiles}
            page={rawRecordsPage}
            setPage={setRawRecordsPage}
            selectedRawRecordId={selectedRawRecordId}
            setSelectedRawRecordId={setSelectedRawRecordId}
          />
        ) : null}

        {route === "/review" ? (
          <ReviewPageRoute
            reviewQueue={reviewQueue}
            rawRecords={rawRecords}
            sourceFiles={sourceFiles}
            selectedRecord={selectedRecord}
            reviewNotes={reviewNotes}
            setReviewNotes={setReviewNotes}
            setSelectedRecord={setSelectedRecord}
            handleReview={handleReview}
            selectedIssues={selectedIssues}
            page={reviewPage}
            setPage={setReviewPage}
          />
        ) : null}

        {route === "/source-files" ? (
          <SourceFilesPageRoute
            sourceFiles={sourceFiles}
            organizations={organizations}
            selectedSourceFileId={selectedSourceFileId}
            setSelectedSourceFileId={setSelectedSourceFileId}
            selectedSourceFile={selectedSourceFile}
            sourceFileEditForm={sourceFileEditForm}
            setSourceFileEditForm={setSourceFileEditForm}
            handleSourceFileSave={handleSourceFileSave}
            handleSourceFileDelete={handleSourceFileDelete}
            saving={sourceFileSaving}
          />
        ) : null}

        {route === "/validation" ? (
          <ValidationPageRoute
            validationIssues={validationIssues}
            activities={activities}
            rawRecords={rawRecords}
            sourceFiles={sourceFiles}
            page={validationPage}
            setPage={setValidationPage}
            selectedValidationIssue={selectedValidationIssue}
            selectedValidationIssueId={selectedValidationIssueId}
            setSelectedValidationIssueId={setSelectedValidationIssueId}
            handleReview={handleReview}
          />
        ) : null}

        {route === "/activities" ? (
          <ActivitiesPageRoute
            activities={activities}
            onOpen={openActivity}
            page={activitiesPage}
            setPage={setActivitiesPage}
            filters={activityFilters}
            setFilters={setActivityFilters}
          />
        ) : null}

        {route === "/audit-trail" ? (
          <AuditTrailPageRoute
            auditLogs={auditLogs}
            sourceFiles={sourceFiles}
            rawRecords={rawRecords}
            activities={activities}
            page={auditPage}
            setPage={setAuditPage}
          />
        ) : null}

        {route.startsWith("/activities/") ? (
          <ActivityDetailPageRoute
            activity={selectedActivity}
            validationIssues={validationIssues}
            onBack={() => navigate("/activities")}
            onOpenReview={() => navigate("/review")}
          />
        ) : null}
      </MainLayout>

      {message ? <div className="toast success">{message}</div> : null}
      {error ? <div className="toast error">{error}</div> : null}
      {loading ? <div className="loading-overlay">Loading dashboard…</div> : null}
    </>
  );
}
















function ActionCard({ title, text, button, onClick }) {
  return (
    <div className="action-card">
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      <button className="ghost-btn" type="button" onClick={onClick}>
        {button}
      </button>
    </div>
  );
}

function CompactFileList({ sourceFiles }) {
  return (
    <div className="compact-list">
      {sourceFiles.length === 0 ? (
        <div className="empty-state">No source files have been uploaded yet.</div>
      ) : (
        sourceFiles.slice(0, 5).map((file) => (
          <div key={file.id} className="compact-row">
            <div>
              <strong>{file.filename}</strong>
              <span>{sourceLabels[file.source_type] || file.source_type}</span>
            </div>
            <span className={`status-pill status-${file.processing_status}`}>{file.processing_status.replaceAll("_", " ")}</span>
          </div>
        ))
      )}
    </div>
  );
}

function CompactQueueList({ reviewQueue, selectedRecord, setSelectedRecord, onSelect }) {
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

function CompactIssueList({
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
        const sourceFile = rawRecord
          ? sourceFiles.find((file) => String(file.id) === String(rawRecord.source_file))
          : null;
        const issueTypeLabel = getIssueTypeLabel(issue, activity);
        return (
          <button
            key={issue.id}
            type="button"
            className={`issue-card severity-${issue.severity} ${String(selectedIssueId) === String(issue.id) ? "selected" : ""}`}
            onClick={() => onSelectIssue && onSelectIssue(issue.id)}
          >
            <strong>{issueTypeLabel}</strong>
            <span>{issue.message}</span>
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
              {activity ? `${activity.activity_type} • ${sourceLabels[activity.source_type] || activity.source_type}` : `Activity ${issue.activity || "raw record only"}`}
            </small>
          </button>
        );
      })}
    </div>
  );
}

function ValidationIssueDetail({ issue, activities, rawRecords, sourceFiles, onApprove, onReject }) {
  const activity = activities.find((item) => String(item.id) === String(issue.activity)) || null;
  const rawRecord = rawRecords.find((item) => String(item.id) === String(issue.raw_record)) || null;
  const sourceFile = rawRecord
    ? sourceFiles.find((file) => String(file.id) === String(rawRecord.source_file)) || null
    : null;
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

function CompactRawList({ rawRecords, sourceFiles }) {
  if (!rawRecords || rawRecords.length === 0) {
    return <div className="empty-state">No raw rows have been uploaded yet.</div>;
  }

  return (
    <div className="compact-list">
      {rawRecords.slice(0, 6).map((record) => {
        const sourceFile = sourceFiles.find((file) => String(file.id) === String(record.source_file));
        return (
          <div key={record.id} className="compact-row">
            <div>
              <strong>Row {record.row_number}</strong>
              <span>{sourceFile ? sourceFile.filename : `Source file ${record.source_file}`}</span>
            </div>
            <span className={`status-pill status-${record.parse_status}`}>{record.parse_status}</span>
          </div>
        );
      })}
    </div>
  );
}

function buildAuditRows(auditLogs, sourceFiles, rawRecords, activities) {
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

function previewJson(value) {
  if (!value) return "-";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

function PaginationControls({ page, totalPages, onPageChange }) {
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

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
