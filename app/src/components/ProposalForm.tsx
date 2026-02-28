"use client";

import { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Calendar, FileText, PlusCircle, Sparkles } from "lucide-react";
import { useVoteProgram } from "../hooks/useVoteProgram";
import { useAnchorProvider } from "../hooks/useAnchorProvider";
import {
    PROGRAM_ID,
    PROPOSAL_COUNTER_SEED,
    PROPOSAL_SEED,
    TREASURY_CONFIG_SEED,
    X_MINT_SEED,
} from "../constants";
import { ensureAssociatedTokenAccount } from "../utils/tokenAccounts";

interface ProposalCounterAccount {
    proposalCount: number;
}

interface TreasuryConfigAccount {
    treasuryTokenAccount: PublicKey;
}

interface VoteProgramAccountNamespace {
    proposalCounter: {
        fetch: (address: PublicKey) => Promise<unknown>;
    };
    treasuryConfig: {
        fetch: (address: PublicKey) => Promise<unknown>;
    };
}

export default function ProposalForm() {
    const program = useVoteProgram();
    const { provider } = useAnchorProvider();
    const [info, setInfo] = useState("");
    const [days, setDays] = useState(7);
    const [tokenStake, setTokenStake] = useState(1000);
    const [loading, setLoading] = useState(false);

    const handleCreateProposal = async () => {
        if (!program || !provider || !info) return;

        setLoading(true);
        try {
            const [proposalCounterPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(PROPOSAL_COUNTER_SEED)],
                PROGRAM_ID
            );
            const accounts = program.account as unknown as VoteProgramAccountNamespace;
            const proposalCounter = (await accounts.proposalCounter.fetch(
                proposalCounterPda
            )) as ProposalCounterAccount;
            const proposalId = proposalCounter.proposalCount;

            const [proposalPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(PROPOSAL_SEED), Buffer.from([proposalId])],
                PROGRAM_ID
            );
            const [xMintPda] = PublicKey.findProgramAddressSync([Buffer.from(X_MINT_SEED)], PROGRAM_ID);
            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );
            const treasuryConfig = (await accounts.treasuryConfig.fetch(
                treasuryConfigPda
            )) as TreasuryConfigAccount;

            const proposalTokenAccount = await ensureAssociatedTokenAccount(
                provider,
                xMintPda,
                provider.publicKey
            );
            const deadlineTs = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;

            await program.methods
                .registerProposal(
                    info,
                    new anchor.BN(deadlineTs),
                    new anchor.BN(tokenStake * 1_000_000)
                )
                .accountsPartial({
                    authority: provider.publicKey,
                    proposalAccount: proposalPda,
                    proposalCounterAccount: proposalCounterPda,
                    xMint: xMintPda,
                    proposalTokenAccount,
                    treasuryTokenAccount: treasuryConfig.treasuryTokenAccount,
                })
                .rpc();

            setInfo("");
        } catch (error: unknown) {
            console.error("Error creating proposal:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card bg-white/60 border-teal-100 shadow-xl max-w-2xl mx-auto animate-fade-in mt-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-teal-500 rounded-2xl text-white">
                    <PlusCircle size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">Create Governance Proposal</h3>
                    <p className="text-sm text-slate-400">Define an action the DAO can vote on</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-teal-600 tracking-widest mb-2">
                        <FileText size={12} /> Proposal Description
                    </label>
                    <textarea
                        value={info}
                        onChange={(e) => setInfo(e.target.value)}
                        placeholder="What decision should the DAO make?"
                        className="glass-card w-full min-h-[120px] bg-white border-slate-200 focus:border-teal-400 transition-all p-4 resize-none"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-teal-600 tracking-widest mb-2">
                        <Calendar size={12} /> Voting Duration (Days)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value, 10))}
                            className="flex-1 accent-teal-600"
                        />
                        <span className="w-12 text-center font-bold text-teal-700 bg-teal-50 py-1 rounded-lg border border-teal-100">
                            {days}d
                        </span>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-teal-600 tracking-widest mb-2">
                        Stake (X-Token units)
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={tokenStake}
                        onChange={(e) => setTokenStake(parseInt(e.target.value, 10) || 1)}
                        className="glass-card w-full bg-white border-slate-200 focus:border-teal-400 transition-all p-4"
                    />
                </div>

                <button
                    onClick={handleCreateProposal}
                    disabled={loading || !info}
                    className="btn-primary w-full py-5 text-lg justify-center group"
                >
                    <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                    {loading ? "Registering..." : "Submit Proposal"}
                </button>
            </div>
        </div>
    );
}
