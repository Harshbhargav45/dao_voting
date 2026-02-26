"use client";

import { useState } from "react";
import { useVoteProgram } from "../hooks/useVoteProgram";
import { useAnchorProvider } from "../hooks/useAnchorProvider";
import {
    PROGRAM_ID,
    PROPOSAL_COUNTER_SEED,
    PROPOSAL_SEED,
    X_MINT_SEED,
    TREASURY_CONFIG_SEED
} from "../constants";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { PlusCircle } from "lucide-react";
import * as anchor from "@coral-xyz/anchor";

export default function ProposalForm({ onProposalCreated }: { onProposalCreated: () => void }) {
    const program = useVoteProgram();
    const provider = useAnchorProvider();
    const [info, setInfo] = useState("");
    const [deadline, setDeadline] = useState(24); // hours
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!program || !provider) return;

        setLoading(true);
        try {
            const [proposalCounterPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(PROPOSAL_COUNTER_SEED)],
                PROGRAM_ID
            );

            const counterData = await (program.account as any).proposalCounter.fetch(proposalCounterPda);
            const nextId = counterData.proposalCount;

            const [proposalPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(PROPOSAL_SEED), Buffer.from([nextId])],
                PROGRAM_ID
            );

            const [xMintPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(X_MINT_SEED)],
                PROGRAM_ID
            );

            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );

            const userTokenAccount = await getAssociatedTokenAddress(xMintPda, provider.publicKey);

            // In the program, register_proposal takes (proposal_info, deadline, token_amount)
            const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 3600;

            await (program.methods as any)
                .registerProposal(info, new anchor.BN(deadlineTimestamp), new anchor.BN(1))
                .accounts({
                    authority: provider.publicKey,
                    proposalAccount: proposalPda,
                    proposalCounterAccount: proposalCounterPda,
                    xMint: xMintPda,
                    proposalTokenAccount: userTokenAccount,
                    // Note: treasury_token_account usually needs to be passed if not inferred
                    // I'll check initialize_treasury for where the treasury token account is
                } as any)
                .rpc();

            setInfo("");
            onProposalCreated();
        } catch (error) {
            console.error("Error creating proposal:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card mt-2">
            <h3 className="mb-1 flex-between">
                Create Proposal
                <PlusCircle size={20} className="gradient-text" />
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Proposal objective (e.g., Expand Treasury)"
                    className="glass-card"
                    style={{ padding: '0.75rem', width: '100%', background: 'rgba(255,255,255,0.05)' }}
                    value={info}
                    onChange={(e) => setInfo(e.target.value)}
                    required
                />
                <div className="flex-between">
                    <div style={{ flex: 1 }}>
                        <label className="text-sm block mb-1">Duration (Hours)</label>
                        <input
                            type="number"
                            className="glass-card"
                            style={{ padding: '0.75rem', width: '80%', background: 'rgba(255,255,255,0.05)' }}
                            value={deadline}
                            onChange={(e) => setDeadline(parseInt(e.target.value))}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Creating..." : "Launch Proposal"}
                    </button>
                </div>
            </div>
        </form>
    );
}
