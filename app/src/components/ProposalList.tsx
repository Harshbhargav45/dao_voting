"use client";

import { useEffect, useState } from "react";
import { useVoteProgram } from "../hooks/useVoteProgram";
import { useAnchorProvider } from "../hooks/useAnchorProvider";
import { PROGRAM_ID, X_MINT_SEED, TREASURY_CONFIG_SEED } from "../constants";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { CheckCircle, Clock } from "lucide-react";
import * as anchor from "@coral-xyz/anchor";

export default function ProposalList() {
    const program = useVoteProgram();
    const provider = useAnchorProvider();
    const [proposals, setProposals] = useState<any[]>([]);

    const fetchProposals = async () => {
        if (!program) return;
        try {
            const allProposals = await (program.account as any).proposal.all();
            setProposals(allProposals.map((p: any) => ({
                ...p.account,
                publicKey: p.publicKey
            })));
        } catch (error) {
            console.error("Error fetching proposals:", error);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, [program]);

    const handleVote = async (proposal: any) => {
        if (!program || !provider) return;
        try {
            const [voterPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("voter"), provider.publicKey.toBuffer()],
                PROGRAM_ID
            );

            const [xMintPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(X_MINT_SEED)],
                PROGRAM_ID
            );

            const userTokenAccount = await getAssociatedTokenAddress(xMintPda, provider.publicKey);

            // We need the treasury token account. Usually this is stored in a config or found via PDA.
            // In this draft, I'll use a placeholder or assume it's passed/found.
            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );
            const treasuryConfig: any = await (program.account as any).treasuryConfig.fetch(treasuryConfigPda);
            const treasuryTokenAccount = treasuryConfig.treasuryTokenAccount;

            await (program.methods as any)
                .proposalToVote(proposal.proposalId, new anchor.BN(1))
                .accounts({
                    authority: provider.publicKey,
                    voterAccount: voterPda,
                    xMint: xMintPda,
                    voterTokenAccount: userTokenAccount,
                    treasuryTokenAccount: treasuryTokenAccount,
                    proposalAccount: proposal.publicKey,
                } as any)
                .rpc();

            fetchProposals();
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    return (
        <div className="proposal-list mt-2">
            <div className="grid-cols-3">
                {proposals.map((proposal) => (
                    <div key={proposal.publicKey.toString()} className="glass-card">
                        <div className="flex-between mb-1">
                            <span className="text-sm">Proposal #{proposal.proposalId}</span>
                            {proposal.deadline.toNumber() * 1000 > Date.now() ? (
                                <div className="flex-between text-sm" style={{ color: '#10b981' }}>
                                    <Clock size={14} className="mr-1" /> Active
                                </div>
                            ) : (
                                <div className="text-sm" style={{ color: '#f43f5e' }}>Ended</div>
                            )}
                        </div>
                        <h4 className="mb-1">{proposal.proposalInfo}</h4>
                        <div className="mt-2 flex-between">
                            <div>
                                <span className="text-sm">Votes</span>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{proposal.numberOfVotes.toString()}</div>
                            </div>
                            <button
                                onClick={() => handleVote(proposal)}
                                className="btn-primary"
                                style={{ padding: '0.5rem 1rem' }}
                                disabled={proposal.deadline.toNumber() * 1000 < Date.now()}
                            >
                                <CheckCircle size={16} /> Vote
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {proposals.length === 0 && (
                <div className="glass-card text-center py-2">No proposals found.</div>
            )}
        </div>
    );
}
