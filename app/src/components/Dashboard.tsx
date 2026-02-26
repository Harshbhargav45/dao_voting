"use client";

import { useEffect, useState } from "react";
import { useAnchorProvider } from "../hooks/useAnchorProvider";
import { useVoteProgram } from "../hooks/useVoteProgram";
import { PublicKey } from "@solana/web3.js";
import {
    SOL_VAULT_SEED,
    TREASURY_CONFIG_SEED,
    X_MINT_SEED,
    PROGRAM_ID
} from "../constants";
import * as anchor from "@coral-xyz/anchor";
import { Coins, TrendingUp, Users, Wallet } from "lucide-react";

export default function Dashboard() {
    const provider = useAnchorProvider();
    const program = useVoteProgram();
    const [stats, setStats] = useState({
        solBalance: 0,
        tokenSupply: 0,
        proposalCount: 0,
        userBalance: 0
    });

    const fetchStats = async () => {
        if (!program || !provider) return;

        try {
            // Fetch SOL Vault balance
            const [solVaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(SOL_VAULT_SEED)],
                PROGRAM_ID
            );
            const solBalance = await provider.connection.getBalance(solVaultPda);

            // Fetch Treasury Config for counts
            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );
            const treasuryConfigAccount = await (program.account as any).treasuryConfig.fetch(treasuryConfigPda);

            setStats({
                solBalance: solBalance / 1e9,
                tokenSupply: 0, // Placeholder
                proposalCount: 0, // Placeholder
                userBalance: 0 // Placeholder
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [program, provider]);

    return (
        <div className="dashboard">
            <div className="flex-between mb-1">
                <h2 className="gradient-text">DAO Dashboard</h2>
                <button onClick={fetchStats} className="btn-secondary">Refresh Stats</button>
            </div>

            <div className="grid-cols-3">
                <div className="glass-card">
                    <div className="flex-between">
                        <span className="text-sm">Treasury SOL</span>
                        <Wallet size={20} className="gradient-text" />
                    </div>
                    <div className="mt-2">
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.solBalance.toFixed(2)}</span>
                        <span className="text-sm ml-1">SOL</span>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <span className="text-sm">Active Proposals</span>
                        <TrendingUp size={20} className="gradient-text" />
                    </div>
                    <div className="mt-2">
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.proposalCount}</span>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <span className="text-sm">Total Members</span>
                        <Users size={20} className="gradient-text" />
                    </div>
                    <div className="mt-2">
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>124</span>
                    </div>
                </div>
            </div>

            <div className="mt-2 glass-card" style={{ maxWidth: '500px' }}>
                <h3 className="mb-1">Acquire Governance Tokens</h3>
                <p className="text-sm mb-1">Exchange SOL for X-Tokens to participate in voting and proposal creation.</p>
                <div className="flex-between" style={{ gap: '1rem' }}>
                    <input
                        type="number"
                        placeholder="Amount in SOL"
                        className="glass-card"
                        style={{ padding: '0.75rem', flex: 1, background: 'rgba(255,255,255,0.05)' }}
                    />
                    <button className="btn-primary">
                        <Coins size={18} />
                        Buy Tokens
                    </button>
                </div>
            </div>
        </div>
    );
}
