"use client";

import { useState } from "react";
import { LayoutGrid, Plus, ShieldCheck } from "lucide-react";
import Dashboard from "../components/Dashboard";
import ProposalForm from "../components/ProposalForm";
import ProposalList from "../components/ProposalList";
import AdminPanel from "../components/AdminPanel";

export default function Home() {
  const [view, setView] = useState<"explorer" | "create" | "admin">("explorer");

  return (
    <div className="space-y-12 pb-24">
      <Dashboard />

      <div className="flex-center mt-12 mb-8">
        <div className="glass-card p-1.5 flex gap-2 border-slate-200/50">
          <button
            onClick={() => setView("explorer")}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black transition-all ${
              view === "explorer" ? "btn-primary" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <LayoutGrid size={18} /> Proposal Explorer
          </button>
          <button
            onClick={() => setView("create")}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black transition-all ${
              view === "create" ? "btn-primary" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Plus size={18} /> New Proposal
          </button>
          <button
            onClick={() => setView("admin")}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black transition-all ${
              view === "admin" ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldCheck size={18} /> Protocol Admin
          </button>
        </div>
      </div>

      <div className="animate-fade-in min-h-[600px]">
        {view === "explorer" && (
          <section>
            <ProposalList />
          </section>
        )}

        {view === "create" && (
          <section className="max-w-screen-md mx-auto">
            <ProposalForm />
          </section>
        )}

        {view === "admin" && (
          <section>
            <AdminPanel />
          </section>
        )}
      </div>

      <div className="pt-24 border-t border-slate-200/50 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Powered by <span className="text-teal-500">Solana</span> + <span className="text-teal-600">Anchor</span>
        </div>
        <div className="text-[9px] text-slate-400 opacity-50 text-center max-w-sm">
          On-chain governance protocol for treasury-backed voting.
        </div>
      </div>
    </div>
  );
}
