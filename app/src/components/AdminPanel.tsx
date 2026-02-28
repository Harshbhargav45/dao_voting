"use client";

import { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { AlertTriangle, BarChart3, Gavel, Settings2, ShieldCheck, Wallet } from "lucide-react";
import { useVoteProgram } from "../hooks/useVoteProgram";
import { useAnchorProvider } from "../hooks/useAnchorProvider";
import {
    PROGRAM_ID,
    PROPOSAL_COUNTER_SEED,
    PROPOSAL_SEED,
    TREASURY_CONFIG_SEED,
    VOTER_SEED,
    X_MINT_SEED,
} from "../constants";
import { ensureAssociatedTokenAccount } from "../utils/tokenAccounts";

export default function AdminPanel() {
    const program = useVoteProgram();
    const { provider } = useAnchorProvider();
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState(0.001);
    const [solPrice, setSolPrice] = useState(1);
    const [tokensPerPurchase, setTokensPerPurchase] = useState(1000);
    const [winnerProposalId, setWinnerProposalId] = useState(1);
    const [closeProposalId, setCloseProposalId] = useState(1);

    const requireAuth = () => {
        if (!program || !provider) {
            setMessage("Connect your wallet first");
            return false;
        }
        return true;
    };

    const handleInitializeTreasury = async () => {
        if (!requireAuth() || !program || !provider) return;

        setLoading("init");
        setMessage(null);

        try {
            const [xMint] = PublicKey.findProgramAddressSync([Buffer.from(X_MINT_SEED)], PROGRAM_ID);
            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );
            const treasuryConfigExists = await provider.connection.getAccountInfo(treasuryConfigPda);

            if (!treasuryConfigExists) {
                await program.methods
                    .initializeTreasury(
                        new anchor.BN(Math.round(solPrice * 1e9)),
                        new anchor.BN(Math.round(tokensPerPurchase * 1_000_000))
                    )
                    .accounts({ authority: provider.publicKey })
                    .rpc();
            }

            const treasuryTokenAccount = await ensureAssociatedTokenAccount(provider, xMint, provider.publicKey);

            await program.methods
                .configureTreasuryTokenAccount()
                .accountsPartial({
                    authority: provider.publicKey,
                    xMint,
                    treasuryTokenAccount,
                })
                .rpc();

            setMessage(
                treasuryConfigExists
                    ? "✓ Treasury token account configured successfully!"
                    : "✓ Treasury initialized successfully!"
            );
        } catch (error: unknown) {
            const nextMessage = error instanceof Error ? error.message : String(error);
            setMessage(`Error: ${nextMessage}`);
        } finally {
            setLoading(null);
        }
    };

    const handleInitializeProposalCounter = async () => {
        if (!requireAuth() || !program || !provider) return;

        setLoading("init_counter");
        setMessage(null);

        try {
            const [proposalCounterPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(PROPOSAL_COUNTER_SEED)],
                PROGRAM_ID
            );
            const counterExists = await provider.connection.getAccountInfo(proposalCounterPda);

            if (counterExists) {
                setMessage("✓ Proposal counter already initialized.");
                return;
            }

            await program.methods
                .initializeProposalCounter()
                .accounts({ authority: provider.publicKey })
                .rpc();

            setMessage("✓ Proposal counter initialized!");
        } catch (error: unknown) {
            const nextMessage = error instanceof Error ? error.message : String(error);
            setMessage(`Error: ${nextMessage}`);
        } finally {
            setLoading(null);
        }
    };

    const handlePickWinner = async () => {
        if (!requireAuth() || !program || !provider) return;

        setLoading("pick_winner");
        setMessage(null);

        try {
            await program.methods
                .pickWinner(winnerProposalId)
                .accounts({ authority: provider.publicKey })
                .rpc();

            setMessage("✓ Winner picked successfully!");
        } catch (error: unknown) {
            const nextMessage = error instanceof Error ? error.message : String(error);
            setMessage(`Error: ${nextMessage}`);
        } finally {
            setLoading(null);
        }
    };

    const handleCloseProposal = async () => {
        if (!requireAuth() || !program || !provider) return;

        setLoading("close_proposal");
        setMessage(null);

        try {
            const [proposalAccount] = PublicKey.findProgramAddressSync(
                [Buffer.from(PROPOSAL_SEED), Buffer.from([closeProposalId])],
                PROGRAM_ID
            );

            await program.methods
                .closeProposal(closeProposalId)
                .accountsPartial({
                    proposalAccount,
                    destination: provider.publicKey,
                    authority: provider.publicKey,
                })
                .rpc();

            setMessage("✓ Proposal account closed successfully!");
        } catch (error: unknown) {
            const nextMessage = error instanceof Error ? error.message : String(error);
            setMessage(`Error: ${nextMessage}`);
        } finally {
            setLoading(null);
        }
    };

    const handleCloseVoter = async () => {
        if (!requireAuth() || !program || !provider) return;

        setLoading("close_voter");
        setMessage(null);

        try {
            const [voterAccount] = PublicKey.findProgramAddressSync(
                [Buffer.from(VOTER_SEED), provider.publicKey.toBuffer()],
                PROGRAM_ID
            );

            await program.methods
                .closeVoter()
                .accountsPartial({
                    voterAccount,
                    authority: provider.publicKey,
                })
                .rpc();

            setMessage("✓ Voter account closed successfully!");
        } catch (error: unknown) {
            const nextMessage = error instanceof Error ? error.message : String(error);
            setMessage(`Error: ${nextMessage}`);
        } finally {
            setLoading(null);
        }
    };

    const handleWithdrawSol = async () => {
        if (!requireAuth() || !program || !provider) return;

        setLoading("withdraw");
        setMessage(null);

        try {
            await program.methods
                .withdrawSol(new anchor.BN(Math.round(withdrawAmount * 1e9)))
                .accounts({ authority: provider.publicKey })
                .rpc();

            setMessage(`✓ Withdrew ${withdrawAmount} SOL successfully!`);
        } catch (error: unknown) {
            const nextMessage = error instanceof Error ? error.message : String(error);
            setMessage(`Error: ${nextMessage}`);
        } finally {
            setLoading(null);
        }
    };

    const onSolPriceChange = (value: string) => {
        const parsed = parseFloat(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            setSolPrice(parsed);
        }
    };

    const onTokensPerPurchaseChange = (value: string) => {
        const parsed = parseInt(value, 10);
        setTokensPerPurchase(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
    };

    const onWithdrawAmountChange = (value: string) => {
        const parsed = parseFloat(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            setWithdrawAmount(parsed);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="flex-between glass-card border-none shadow-none bg-transparent p-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="text-teal-600" size={24} />
                        <h2 className="gradient-text text-3xl">Governance Admin Control</h2>
                    </div>
                    <p className="text-sm">Manage treasury configuration, proposal lifecycle, and protocol maintenance.</p>
                </div>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-xl flex items-center gap-3 border ${
                        message.startsWith("✓")
                            ? "bg-teal-50 border-teal-200 text-teal-700"
                            : "bg-red-50 border-red-200 text-red-700"
                    }`}
                >
                    {message.startsWith("✓") ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-semibold">{message}</span>
                </div>
            )}

            <div className="grid-cols-3 gap-6">
                <div className="glass-card flex flex-col justify-between">
                    <div>
                        <div className="p-3 bg-teal-50 w-fit rounded-xl mb-4">
                            <Settings2 className="text-teal-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Treasury Parameters</h3>
                        <p className="text-sm mb-6">Set SOL pricing and token emission for governance participation.</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-teal-600/60 block mb-1">X-Token Price (SOL)</label>
                                <input
                                    type="number"
                                    className="glass-card w-full p-2 bg-white/50"
                                    value={solPrice}
                                    onChange={(e) => onSolPriceChange(e.target.value)}
                                    step="0.1"
                                    min="0.001"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-teal-600/60 block mb-1">Mint Batch Size</label>
                                <input
                                    type="number"
                                    className="glass-card w-full p-2 bg-white/50"
                                    value={tokensPerPurchase}
                                    onChange={(e) => onTokensPerPurchaseChange(e.target.value)}
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>
                    <button className="btn-primary w-full" onClick={handleInitializeTreasury} disabled={loading === "init"}>
                        {loading === "init" ? "Configuring..." : "Init / Update Treasury"}
                    </button>
                </div>

                <div className="glass-card flex flex-col justify-between">
                    <div>
                        <div className="p-3 bg-amber-50 w-fit rounded-xl mb-4">
                            <BarChart3 className="text-amber-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Proposal Registry</h3>
                        <p className="text-sm mb-6">Initialize proposal counter before creating governance proposals.</p>
                    </div>
                    <button
                        className="btn-primary w-full bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                        onClick={handleInitializeProposalCounter}
                        disabled={loading === "init_counter"}
                    >
                        {loading === "init_counter" ? "Initializing..." : "Initialize Counter"}
                    </button>
                </div>

                <div className="glass-card flex flex-col justify-between">
                    <div>
                        <div className="p-3 bg-red-50 w-fit rounded-xl mb-4">
                            <Wallet className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Treasury Withdrawal</h3>
                        <p className="text-sm mb-6">Recover SOL from vault (authority only).</p>

                        <div className="mb-6">
                            <label className="text-[10px] uppercase font-bold text-red-600/60 block mb-1">Amount (SOL)</label>
                            <input
                                type="number"
                                className="glass-card w-full p-2 bg-white/50"
                                value={withdrawAmount}
                                onChange={(e) => onWithdrawAmountChange(e.target.value)}
                                step="0.001"
                                min="0.001"
                            />
                        </div>
                    </div>
                    <button
                        className="btn-secondary w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleWithdrawSol}
                        disabled={loading === "withdraw"}
                    >
                        {loading === "withdraw" ? "Processing..." : "Withdraw SOL"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Gavel size={18} className="text-amber-600" />
                        <h3 className="text-lg font-bold">Winner Selection</h3>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="number"
                            min="1"
                            className="glass-card w-full p-2 bg-white/50"
                            value={winnerProposalId}
                            onChange={(e) => setWinnerProposalId(parseInt(e.target.value, 10) || 1)}
                            placeholder="Proposal ID"
                        />
                        <button
                            className="btn-primary w-full bg-amber-500 hover:bg-amber-600"
                            onClick={handlePickWinner}
                            disabled={loading === "pick_winner"}
                        >
                            {loading === "pick_winner" ? "Picking..." : "Pick Winner"}
                        </button>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck size={18} className="text-teal-600" />
                        <h3 className="text-lg font-bold">Cleanup Controls</h3>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="number"
                            min="1"
                            className="glass-card w-full p-2 bg-white/50"
                            value={closeProposalId}
                            onChange={(e) => setCloseProposalId(parseInt(e.target.value, 10) || 1)}
                            placeholder="Proposal ID to close"
                        />
                        <button className="btn-secondary w-full" onClick={handleCloseProposal} disabled={loading === "close_proposal"}>
                            {loading === "close_proposal" ? "Closing..." : "Close Proposal Account"}
                        </button>
                        <button className="btn-secondary w-full" onClick={handleCloseVoter} disabled={loading === "close_voter"}>
                            {loading === "close_voter" ? "Closing..." : "Close My Voter Account"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
