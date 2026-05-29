import React from "react";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";

export default function MainLayout({
  routes,
  organizations,
  activeOrganizationId,
  activeOrganization,
  onOrganizationChange,
  routeLabel,
  onRefresh,
  refreshing,
  children,
}) {
  return (
    <main className="app-shell">
      <div className="page-accent" />
      <Navbar
        routes={routes}
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
        activeOrganization={activeOrganization}
        onOrganizationChange={onOrganizationChange}
      />

      {/* <section className="route-banner">
        <div>
          <p className="panel-title">{routeLabel}</p>
          <p className="hero-copy">
            Each screen is focused on one analyst task, so the workflow stays calm and easy to follow.
          </p>
        </div>
        <button className="ghost-btn" type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </section> */}

      <PageContainer>{children}</PageContainer>

      {/* <Footer /> */}
    </main>
  );
}
