import React, { useEffect, useMemo, useState } from "react";
import { apiBase, requestJson, uploadSourceFile } from "./api";

const sourceLabels = {
  sap: "SAP fuel / procurement",
  utility: "Utility electricity",
  travel: "Corporate travel",
};

const reviewStatusLabels = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  locked: "Locked",
};

const routeLabels = {
  "/": "Overview",
  "/upload": "Upload",
  "/raw-records": "Raw records",
  "/review": "Review queue",
  "/source-files": "Source files",
  "/validation": "Validation issues",
  "/activities": "Activities",
  "/audit-trail": "Audit trail",
};

const blankUpload = {
  organization_id: "",
  source_type: "sap",
  filename: "",
  file: null,
};

const routes = [
  { path: "/", label: "Overview", description: "High-level status" },
  { path: "/upload", label: "Upload", description: "Add source files" },
  { path: "/raw-records", label: "Raw records", description: "Inspect original rows" },
  { path: "/review", label: "Review queue", description: "Approve or reject rows" },
  { path: "/source-files", label: "Source files", description: "See upload batches" },
  { path: "/validation", label: "Validation", description: "Inspect suspicious rows" },
  { path: "/activities", label: "Activities", description: "Normalized activity log" },
  { path: "/audit-trail", label: "Audit trail", description: "Trace changes over time" },
];

export default function App() {
  const [route, setRoute] = useState(getCurrentPath());
  const [uploadForm, setUploadForm] = useState(blankUpload);
  const [organizations, setOrganizations] = useState([]);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [activities, setActivities] = useState([]);
  const [validationIssues, setValidationIssues] = useState([]);
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

  const summary = useMemo(() => {
    const pending = reviewQueue.length;
    const issues = validationIssues.length;
    const processed = sourceFiles.filter((file) =>
      ["processed", "processed_with_errors"].includes(file.processing_status)
    ).length;
    const approved = activities.filter((activity) => activity.status === "approved").length;

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
        label: "Approved rows",
        value: approved,
        detail: "Activities already cleared for audit",
      },
    ];
  }, [sourceFiles, reviewQueue, validationIssues, activities]);

  useEffect(() => {
    function onPopState() {
      setRoute(getCurrentPath());
    }

    window.addEventListener("popstate", onPopState);
    loadDashboard();

    return () => window.removeEventListener("popstate", onPopState);
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

  async function handleReview(activityId, status) {
    setError("");
    setMessage("");
    try {
      const updated = await requestJson(`/activities/${activityId}/review/`, {
        method: "POST",
        body: JSON.stringify({
          status,
          review_notes: reviewNotes,
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

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(path);
  }

  function openActivity(activity) {
    setSelectedActivityId(activity.id);
    navigate(`/activities/${activity.id}`);
  }

  const selectedIssues = useMemo(() => {
    if (!selectedRecord) return [];
    return validationIssues.filter((issue) => String(issue.activity) === String(selectedRecord.id));
  }, [selectedRecord, validationIssues]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Breathe ESG assignment prototype</p>
          <h1>Analyst-first ESG workspace</h1>
        </div>

        <nav className="topnav" aria-label="Primary">
          {routes.map((item) => (
            <button
              key={item.path}
              className={`topnav-link ${route === item.path || route.startsWith(`${item.path}/`) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              type="button"
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>
      </header>

      <section className="route-banner">
        <div>
          <p className="panel-title">{routeLabels[route] || "Activity detail"}</p>
          <p className="hero-copy">
            Each screen is focused on a single analyst task, so the workflow feels like a set of
            dashboards instead of one long technical form.
          </p>
        </div>
        <button className="ghost-btn" type="button" onClick={() => loadDashboard(true)} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </section>

      {route === "/" ? (
        <OverviewPage
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
        <UploadPage
          organizations={organizations}
          uploadForm={uploadForm}
          setUploadForm={setUploadForm}
          handleUpload={handleUpload}
          uploading={uploading}
        />
      ) : null}

      {route === "/raw-records" ? (
        <RawRecordsPage
          rawRecords={rawRecords}
          sourceFiles={sourceFiles}
          page={rawRecordsPage}
          setPage={setRawRecordsPage}
          selectedRawRecordId={selectedRawRecordId}
          setSelectedRawRecordId={setSelectedRawRecordId}
        />
      ) : null}

      {route === "/review" ? (
        <ReviewPage
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
        <SourceFilesPage sourceFiles={sourceFiles} />
      ) : null}

      {route === "/validation" ? (
        <ValidationPage
          validationIssues={validationIssues}
          activities={activities}
          page={validationPage}
          setPage={setValidationPage}
        />
      ) : null}

      {route === "/activities" ? (
        <ActivitiesPage
          activities={activities}
          onOpen={openActivity}
          page={activitiesPage}
          setPage={setActivitiesPage}
          filters={activityFilters}
          setFilters={setActivityFilters}
        />
      ) : null}

      {route === "/audit-trail" ? (
        <AuditTrailPage
          auditLogs={auditLogs}
          sourceFiles={sourceFiles}
          rawRecords={rawRecords}
          activities={activities}
          page={auditPage}
          setPage={setAuditPage}
        />
      ) : null}

      {route.startsWith("/activities/") ? (
        <ActivityDetailPage
          activity={selectedActivity}
          validationIssues={validationIssues}
          onBack={() => navigate("/activities")}
          onOpenReview={() => navigate("/review")}
        />
      ) : null}

      {message ? <div className="toast success">{message}</div> : null}
      {error ? <div className="toast error">{error}</div> : null}
      {loading ? <div className="loading-overlay">Loading dashboard…</div> : null}
    </main>
  );
}

function OverviewPage({
  summary,
  organizations,
  sourceFiles,
  reviewQueue,
  validationIssues,
  activities,
  rawRecords,
  onUpload,
  onUploadSap,
  onUploadUtility,
  onUploadTravel,
  onRawRecords,
  onReview,
  onIssues,
  onActivities,
  onAuditTrail,
}) {
  return (
    <>
      <section className="summary-grid">
        {summary.map((item) => (
          <article key={item.label} className="summary-card">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.detail}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Next actions</p>
              <h2>What the analyst should do first</h2>
            </div>
          </div>
          <div className="action-stack">
            <ActionCard title="Upload a source file" text="Bring in SAP, utility, or travel exports." button="Open upload page" onClick={onUpload} />
            <ActionCard title="Upload SAP file" text="Start an SAP fuel or procurement upload with the source already preselected." button="Upload SAP" onClick={onUploadSap} />
            <ActionCard title="Upload utility file" text="Start an electricity upload with the source already preselected." button="Upload utility" onClick={onUploadUtility} />
            <ActionCard title="Upload travel file" text="Start a travel export upload with the source already preselected." button="Upload travel" onClick={onUploadTravel} />
            <ActionCard title="Inspect raw rows" text="See exactly what was received from the source system." button="Open raw records" onClick={onRawRecords} />
            <ActionCard title="Review pending rows" text="Approve, reject, or lock normalized activities." button="Open review queue" onClick={onReview} />
            <ActionCard title="Inspect validation issues" text="Check suspicious rows that need manual attention." button="Open validation issues" onClick={onIssues} />
            <ActionCard title="Browse normalized activity" text="See the clean internal record used for reporting." button="Open activities" onClick={onActivities} />
            <ActionCard title="Inspect audit trail" text="Trace uploads and review actions over time." button="Open audit trail" onClick={onAuditTrail} />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Upload history</p>
              <h2>Latest source files</h2>
            </div>
            <span className="badge">{organizations.length} organizations</span>
          </div>
          <CompactFileList sourceFiles={sourceFiles} />
        </article>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Review queue</p>
              <h2>Rows waiting for sign-off</h2>
            </div>
          </div>
          <CompactQueueList reviewQueue={reviewQueue} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Validation</p>
              <h2>Suspicious records</h2>
            </div>
          </div>
          <CompactIssueList validationIssues={validationIssues} activities={activities} />
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Raw intake</p>
            <h2>Rows preserved exactly as received</h2>
          </div>
          <span className="badge">{rawRecords.length} raw rows</span>
        </div>
        <CompactRawList rawRecords={rawRecords} sourceFiles={sourceFiles} />
      </section>
    </>
  );
}

function UploadPage({ organizations, uploadForm, setUploadForm, handleUpload, uploading }) {
  const sourceOptions = [
    { value: "sap", label: "SAP fuel / procurement", detail: "Mixed units, ERP codes, inconsistent dates." },
    { value: "utility", label: "Utility electricity", detail: "Billing periods, kWh / MWh, tariff data." },
    { value: "travel", label: "Corporate travel", detail: "Flights, hotels, taxis, trains, sparse rows." },
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Upload dashboard</p>
          <h2>Bring in a source export</h2>
        </div>
        <span className="badge">CSV / XLSX</span>
      </div>

      <p className="section-copy">
        This screen is for analysts or data ops users who receive files from SAP, utility portals,
        or travel platforms and need to load them into the pipeline.
      </p>

      <div className="helper-banner">
        <strong>Tip:</strong>
        <span>Create an organization in Django admin first. Then choose the source lane below so uploads stay tied to the correct ingestion path.</span>
      </div>

      <form className="form-grid" onSubmit={handleUpload}>
        <label>
          Organization
          <select
            value={uploadForm.organization_id}
            onChange={(event) =>
              setUploadForm((current) => ({ ...current, organization_id: event.target.value }))
            }
          >
            <option value="">Select organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>

        <div className="full-width">
          <div className="source-chooser-label">Source lane</div>
          <div className="source-chooser">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`source-chip ${uploadForm.source_type === option.value ? "active" : ""}`}
                onClick={() =>
                  setUploadForm((current) => ({
                    ...current,
                    source_type: option.value,
                    file: null,
                    filename: "",
                  }))
                }
              >
                <strong>{option.label}</strong>
                <span>{option.detail}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="full-width">
          Filename
          <input
            type="text"
            value={uploadForm.filename}
            onChange={(event) =>
              setUploadForm((current) => ({ ...current, filename: event.target.value }))
            }
            placeholder="sap_fuel_procurement.csv"
          />
        </label>

        <label className="full-width">
          Upload file
          <input
            type="file"
            accept=".csv,.xlsx,.xlsm"
            onChange={(event) =>
              setUploadForm((current) => ({
                ...current,
                file: event.target.files?.[0] || null,
                filename: current.filename || event.target.files?.[0]?.name || "",
              }))
            }
          />
        </label>

        <button className="primary-btn" type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload and process"}
        </button>
      </form>

      <div className="upload-hint-grid">
        <div className="info-card">
          <strong>Raw rows preserved</strong>
          <span>Every upload creates raw records before normalization, so nothing gets lost.</span>
        </div>
        <div className="info-card">
          <strong>Validation first</strong>
          <span>Suspicious rows are flagged immediately so analysts can review them.</span>
        </div>
        <div className="info-card">
          <strong>Separate emissions</strong>
          <span>Emissions are derived records and stay separate from the operational facts.</span>
        </div>
      </div>

      <div className="flow-steps">
        <div className="flow-step">
          <strong>1. Upload</strong>
          <span>Choose a lane, attach the file, and upload.</span>
        </div>
        <div className="flow-step">
          <strong>2. Normalize</strong>
          <span>Raw rows become canonical activities with scope and unit handling.</span>
        </div>
        <div className="flow-step">
          <strong>3. Review</strong>
          <span>Analysts inspect the raw row, validation issues, and approve or reject.</span>
        </div>
        <div className="flow-step">
          <strong>4. Audit</strong>
          <span>Approved rows and review actions appear in the audit trail.</span>
        </div>
      </div>
    </section>
  );
}

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
            <h2>Approve, reject, or lock</h2>
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
              <textarea
                rows="4"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Add a short reason for approval or rejection."
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

function SourceFilesPage({ sourceFiles }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Source files dashboard</p>
          <h2>Upload history and processing status</h2>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Source</th>
              <th>Status</th>
              <th>Rows</th>
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {sourceFiles.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RawRecordsPage({
  rawRecords,
  sourceFiles,
  page,
  setPage,
  selectedRawRecordId,
  setSelectedRawRecordId,
}) {
  const pageSize = 8;
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
    if (currentRows.length > 0) {
      setSelectedRawRecordId(currentRows[0].id);
    }
  }, [safePage, currentRows, setSelectedRawRecordId]);

  return (
    <section className="content-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Raw records dashboard</p>
            <h2>Original rows exactly as uploaded</h2>
          </div>
        </div>

        <div className="list-summary">
          <span>
            Showing {rawRecords.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, rawRecords.length)} of {rawRecords.length}
          </span>
          <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Source file</th>
                <th>Status</th>
                <th>Payload preview</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="table-empty">
                    No raw records have been uploaded yet.
                  </td>
                </tr>
              ) : (
                currentRows.map((record) => (
                  <tr
                    key={record.id}
                    className={`clickable-row ${String(record.id) === String(selectedRawRecord?.id) ? "selected-row" : ""}`}
                    onClick={() => setSelectedRawRecordId(record.id)}
                  >
                    <td>{record.row_number}</td>
                    <td>{record.source_file_filename || `Source file ${record.source_file}`}</td>
                    <td>
                      <span className={`status-pill status-${record.parse_status}`}>{record.parse_status}</span>
                    </td>
                    <td>{previewJson(record.raw_payload)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Raw payload detail</p>
            <h2>What was actually received</h2>
          </div>
          {selectedRawRecord ? <span className="badge">{selectedRawRecord.parse_status}</span> : null}
        </div>

        {selectedRawRecord ? (
          <div className="detail-stack">
            <div className="detail-row">
              <span>Source file</span>
              <strong>{selectedRawRecord.source_file_filename || `Source file ${selectedRawRecord.source_file}`}</strong>
            </div>
            <div className="detail-row">
              <span>Row number</span>
              <strong>{selectedRawRecord.row_number}</strong>
            </div>
            <div className="detail-row">
              <span>Parse status</span>
              <strong>{selectedRawRecord.parse_status}</strong>
            </div>
            {selectedRawRecord.error_message ? (
              <div className="issue-card severity-high">
                <strong>Parse error</strong>
                <span>{selectedRawRecord.error_message}</span>
              </div>
            ) : null}
            <pre className="raw-json">{JSON.stringify(selectedRawRecord.raw_payload, null, 2)}</pre>
          </div>
        ) : (
          <div className="empty-state">Select a raw row to inspect the full uploaded payload.</div>
        )}
      </article>
    </section>
  );
}

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

  useEffect(() => {
    if (currentQueue.length > 0 && !currentQueue.find((activity) => String(activity.id) === String(selectedRecord?.id))) {
      setSelectedRecord(currentQueue[0]);
      setReviewNotes(currentQueue[0].review_notes || "");
    }
  }, [safePage, currentQueue, selectedRecord, setSelectedRecord, setReviewNotes]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Audit trail dashboard</p>
          <h2>What changed, when, and by whom</h2>
        </div>
        <span className="badge">{auditRows.length} events</span>
      </div>

      <p className="section-copy">
        This view ties upload events, review actions, reviewer identity, and status transitions together so an analyst can answer where a number came from.
      </p>

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

function ValidationPage({ validationIssues, activities, page, setPage }) {
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
        <CompactIssueList validationIssues={currentIssues} activities={activities} />
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Why this matters</p>
            <h2>Simple, honest review signals</h2>
          </div>
        </div>
        <div className="info-card-stack">
          <div className="info-card">
            <strong>Missing dates</strong>
            <span>Useful when a source file is incomplete or has a bad row.</span>
          </div>
          <div className="info-card">
            <strong>Non-positive quantities</strong>
            <span>Flags zero or negative rows before they reach reporting.</span>
          </div>
          <div className="info-card">
            <strong>Scope mismatches</strong>
            <span>Helps analysts catch rows that were mapped to the wrong category.</span>
          </div>
        </div>
      </article>
    </section>
  );
}

function ActivitiesPage({ activities, onOpen, page, setPage, filters, setFilters }) {
  const pageSize = 8;
  const filteredActivities = activities.filter((activity) => {
    const matchesSource = filters.sourceType === "all" || activity.source_type === filters.sourceType;
    const matchesScope = filters.scope === "all" || activity.scope === filters.scope;
    const matchesStatus = filters.status === "all" || activity.status === filters.status;
    const matchesType =
      !filters.activityType ||
      activity.activity_type.toLowerCase().includes(filters.activityType.toLowerCase());
    return matchesSource && matchesScope && matchesStatus && matchesType;
  });
  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentActivities = filteredActivities.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  useEffect(() => {
    setPage(1);
  }, [filters.sourceType, filters.scope, filters.status, filters.activityType, setPage]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Activities dashboard</p>
          <h2>Normalized ESG activity log</h2>
        </div>
      </div>

      <div className="filter-grid">
        <label>
          Source type
          <select
            value={filters.sourceType}
            onChange={(event) => setFilters((current) => ({ ...current, sourceType: event.target.value }))}
          >
            <option value="all">All sources</option>
            <option value="sap">SAP</option>
            <option value="utility">Utility</option>
            <option value="travel">Travel</option>
          </select>
        </label>
        <label>
          Scope
          <select
            value={filters.scope}
            onChange={(event) => setFilters((current) => ({ ...current, scope: event.target.value }))}
          >
            <option value="all">All scopes</option>
            <option value="scope_1">Scope 1</option>
            <option value="scope_2">Scope 2</option>
            <option value="scope_3">Scope 3</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="all">All statuses</option>
            <option value="pending_review">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="locked">Locked</option>
          </select>
        </label>
        <label>
          Activity type
          <input
            type="text"
            value={filters.activityType}
            onChange={(event) => setFilters((current) => ({ ...current, activityType: event.target.value }))}
            placeholder="Search activity type"
          />
        </label>
      </div>

      <div className="list-summary">
        <span>
          Showing {filteredActivities.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filteredActivities.length)} of {filteredActivities.length}
        </span>
        <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Source</th>
              <th>Date</th>
              <th>Quantity</th>
              <th>Scope</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentActivities.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty">
                  No normalized activities yet.
                </td>
              </tr>
            ) : (
              currentActivities.map((activity) => (
                <tr key={activity.id} className="clickable-row" onClick={() => onOpen(activity)}>
                  <td>{activity.activity_type}</td>
                  <td>{sourceLabels[activity.source_type] || activity.source_type}</td>
                  <td>{formatDate(activity.activity_date) || "Missing"}</td>
                  <td>
                    {activity.quantity} {activity.unit}
                  </td>
                  <td>{activity.scope?.replace("_", " ").toUpperCase()}</td>
                  <td>
                    <span className={`status-pill status-${activity.status}`}>{reviewStatusLabels[activity.status]}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

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

function CompactIssueList({ validationIssues, activities = [] }) {
  if (!validationIssues || validationIssues.length === 0) {
    return <div className="empty-state">No validation issues have been recorded yet.</div>;
  }

  return (
    <div className="compact-list">
      {validationIssues.slice(0, 8).map((issue) => {
        const activity = activities.find((item) => String(item.id) === String(issue.activity));
        return (
          <div key={issue.id} className={`issue-card severity-${issue.severity}`}>
            <strong>{issue.issue_type}</strong>
            <span>{issue.message}</span>
            <small>
              {activity ? `${activity.activity_type} • ${sourceLabels[activity.source_type] || activity.source_type}` : `Activity ${issue.activity || "raw record only"}`}
            </small>
          </div>
        );
      })}
    </div>
  );
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

  return [...reviewRows, ...uploadRows].sort((a, b) => b.sortKey - a.sortKey);
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

function getCurrentPath() {
  return window.location.pathname === "/index.html" ? "/" : window.location.pathname;
}
