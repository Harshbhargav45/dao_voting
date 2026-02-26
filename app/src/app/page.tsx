"use client";

import Dashboard from "../components/Dashboard";
import ProposalForm from "../components/ProposalForm";
import ProposalList from "../components/ProposalList";

export default function Home() {
  return (
    <div className="home-page">
      <Dashboard />

      <div className="mt-2">
        <ProposalForm onProposalCreated={() => window.location.reload()} />
      </div>

      <section className="mt-2">
        <h2 className="gradient-text mb-1">Active Proposals</h2>
        <ProposalList />
      </section>
    </div>
  );
}
