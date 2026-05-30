import React from "react";
import Footer from "../components/layout/Footer";

function OverviewPage({
  summary,
  activeOrganization,
  onUpload,
  onReview,
  onIssues,
  onAuditTrail,
}) {
  const workflowSteps = [
    {
      id: "01",
      title: "Upload source files",
      text: "Bring in SAP, utility, or travel exports. The platform preserves the raw row before any normalization happens.",
      cta: "Upload",
      onClick: onUpload,
    },
    {
      id: "02",
      title: "Review parsed records",
      text: "Check the normalized activity beside the original source row so every number stays traceable.",
      cta: "Review queue",
      onClick: onReview,
    },
    {
      id: "03",
      title: "Validate suspicious activity",
      text: "Spot quantities that are 0, less than 0, or outliers compared with peer rows.",
      cta: "Validation",
      onClick: onIssues,
    },
    {
      id: "04",
      title: "Lock audit-ready data",
      text: "Finalized rows move into the locked state and remain linked to the source file and review history.",
      cta: "Audit trail",
      onClick: onAuditTrail,
    },
  ];

  const quickLinks = [
    {
      title: "Upload source files",
      text: "Start a new SAP, utility, or travel ingestion batch.",
      cta: "Go to upload",
      onClick: onUpload,
    },
    {
      title: "Review pending activities",
      text: "Inspect normalized rows and lock the ones ready for reporting.",
      cta: "Open review queue",
      onClick: onReview,
    },
    {
      title: "Inspect validation issues",
      text: "Focus on suspicious rows flagged by rule checks or outlier detection.",
      cta: "Open validation",
      onClick: onIssues,
    },
    {
      title: "Browse audit trail",
      text: "See upload and review history in one place for traceability.",
      cta: "Open audit trail",
      onClick: onAuditTrail,
    },
  ];

  const lightweightStats = [
    ...summary.slice(0, 3),
    {
      label: "Workspace",
      value: activeOrganization?.name || "No organization selected",
      detail: "Use the selector in the navbar to switch context",
    },
  ];

  return (
    <div className="overview-page">
      {/* HERO SECTION */}
      <section className="hero-panel modern-hero" style={{ height: "80vh" }}>
        {/* LEFT CONTENT */}
        <div className="hero-left">
          <div className="hero-badge">ESG Analytics Platform</div>

          <h1>
            Analyst-first <span>ESG Workspace</span>
          </h1>

          <p className="hero-copy">
            Ingest operational data from SAP, utility systems, and travel
            platforms, normalize it into audit-ready ESG activities, and review
            suspicious records before reporting.
          </p>

          <div className="button-row hero-actions">
            <button className="primary-btn" type="button" onClick={onUpload}>
              Upload Source File
            </button>

            <button className="ghost-btn" type="button" onClick={onReview}>
              View Review Queue
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="hero-right">
          {/* WORKFLOW FLOWCHART */}
          <div className="hero-workflow">
            <div className="workflow-heading">
              <p className="panel-title">Workflow</p>
              <h3>Platform Processing Flow</h3>
            </div>

            <div className="workflow-flow">
              <div className="flow-box">
                <div className="flow-icon">1</div>

                <h4>Upload</h4>

                <p>Upload ESG source files.</p>
              </div>

              <div className="flow-arrow">→</div>

              <div className="flow-box">
                <div className="flow-icon">2</div>

                <h4>Normalize</h4>

                <p>Standardize activity data.</p>
              </div>

              <div className="flow-arrow">→</div>

              <div className="flow-box">
                <div className="flow-icon">3</div>

                <h4>Validate</h4>

                <p>Detect anomalies & issues.</p>
              </div>

              <div className="flow-arrow">→</div>

              <div className="flow-box">
                <div className="flow-icon">4</div>

                <h4>Audit</h4>

                <p>Finalize traceable records.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;
