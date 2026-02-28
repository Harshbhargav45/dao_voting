"use client";

import { useCallback, useEffect, useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BarChart3, CheckCircle, Clock, Hash, MessageSquare } from "lucide-react";
import { useVoteProgram } from "../hooks/useVoteProgram";
import { useAnchorProvider } from "../hooks/useAnchorProvider";
import { PROGRAM_ID, TREASURY_CONFIG_SEED, X_MINT_SEED } from "../constants";
import { ensureAssociatedTokenAccount } from "../utils/tokenAccounts";

interface ProposalUi {
    proposalId: number;
    proposalInfo: string;
    deadline: BN;
    numberOfVotes: BN;
    publicKey: PublicKey;
}

interface TreasuryConfigAccount {
    treasuryTokenAccount: PublicKey;
}

interface VoteProgramAccountNamespace {
    proposal: {
        all: () => Promise<Array<{ account: unknown; publicKey: PublicKey }>>;
    };
    treasuryConfig: {
        fetch: (address: PublicKey) => Promise<unknown>;
    };
}

export default function ProposalList() {
    const program = useVoteProgram();
    const { provider } = useAnchorProvider();
    const [proposals, setProposals] = useState<ProposalUi[]>([]);
    const [nowMs, setNowMs] = useState(() => Date.now());

    const fetchProposals = useCallback(async () => {
        if (!program) return;

        try {
            const accounts = program.account as unknown as VoteProgramAccountNamespace;
            const allProposals = await accounts.proposal.all();
            const normalized = allProposals.map((proposalAccount) => {
                const account = proposalAccount.account as Omit<ProposalUi, "publicKey">;
                return {
                    ...account,
                    publicKey: proposalAccount.publicKey,
                };
            });
            setProposals(normalized);
        } catch (error) {
            console.error("Error fetching proposals:", error);
        }
    }, [program]);

    useEffect(() => {
        const firstLoad = setTimeout(() => {
            void fetchProposals();
        }, 0);

        const interval = setInterval(() => {
            void fetchProposals();
        }, 5000);

        return () => {
            clearTimeout(firstLoad);
            clearInterval(interval);
        };
    }, [fetchProposals]);

    useEffect(() => {
        const timer = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleVote = async (proposal: ProposalUi) => {
        if (!program || !provider) return;

        try {
            const [voterPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("voter"), provider.publicKey.toBuffer()],
                PROGRAM_ID
            );
            const existingVoter = await provider.connection.getAccountInfo(voterPda);
            if (!existingVoter) {
                await program.methods
                    .registerVoter()
                    .accountsPartial({
                        authority: provider.publicKey,
                        voterAccount: voterPda,
                    })
                    .rpc();
            }

            const [xMintPda] = PublicKey.findProgramAddressSync([Buffer.from(X_MINT_SEED)], PROGRAM_ID);
            const userTokenAccount = await ensureAssociatedTokenAccount(
                provider,
                xMintPda,
                provider.publicKey
            );

            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );
            const accounts = program.account as unknown as VoteProgramAccountNamespace;
            const treasuryConfig = (await accounts.treasuryConfig.fetch(
                treasuryConfigPda
            )) as TreasuryConfigAccount;

            await program.methods
                .proposalToVote(proposal.proposalId, new anchor.BN(1_000_000))
                .accountsPartial({
                    authority: provider.publicKey,
                    voterAccount: voterPda,
                    xMint: xMintPda,
                    voterTokenAccount: userTokenAccount,
                    treasuryTokenAccount: treasuryConfig.treasuryTokenAccount,
                    proposalAccount: proposal.publicKey,
                })
                .rpc();

            await fetchProposals();
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    return (
        <div className="proposal-list space-y-12">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-teal-600 rounded-2xl text-white shadow-lg">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800">Active Proposals</h2>
                    <p className="text-sm text-slate-400">Cast on-chain votes using governance tokens</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {proposals.map((proposal) => (
                    <div key={proposal.publicKey.toString()} className="animate-fade-in">
                        <div className="glass-card flex flex-col justify-between">
                            <div>
                                <div className="flex-between mb-6">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase">
                                        <Hash size={10} />
                                        Proposal #{proposal.proposalId}
                                    </div>
                                    {proposal.deadline.toNumber() * 1000 > nowMs ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">
                                            <Clock size={10} /> ACTIVE
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black">ENDED</div>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold mb-4 text-slate-800 leading-tight">
                                    {proposal.proposalInfo}
                                </h3>

                                <div className="flex items-center gap-2 mb-8 text-slate-400">
                                    <MessageSquare size={16} />
                                    <span className="text-sm">Governance discussion in progress</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Votes</span>
                                        <span className="text-3xl font-black text-teal-600">{proposal.numberOfVotes.toString()}</span>
                                    </div>
                                    <button
                                        onClick={() => void handleVote(proposal)}
                                        className="btn-primary py-4 px-8 rounded-xl"
                                        disabled={proposal.deadline.toNumber() * 1000 < nowMs}
                                    >
                                        <CheckCircle size={18} /> Cast Vote
                                    </button>
                                </div>
                                <p className="text-[10px] text-center text-slate-400 italic">
                                    Each vote transfer uses 1 X token unit (1_000_000 base units).
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {proposals.length === 0 && (
                <div className="glass-card text-center py-20 bg-slate-50 border-dashed border-2 border-slate-200">
                    <div className="flex-center flex-col gap-4 text-slate-400">
                        <Hash size={48} className="opacity-20" />
                        <p className="font-bold text-lg">No proposals found in the registry.</p>
                        <p className="text-sm max-w-md">Initialize the proposal counter in the Admin Panel or create the first proposal to get started.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
