import React, { useEffect } from "react";
import { reviewStatusLabels, sourceLabels } from "../constants";
import { PaginationControls, formatDate } from "../utils/dashboardHelpers";

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

export default ActivitiesPage;
