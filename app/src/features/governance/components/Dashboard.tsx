"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Activity, AlertTriangle, Coins, RefreshCw, ShieldCheck, Wallet, Zap } from "lucide-react";
import { useAnchorProvider } from "@/features/wallet/hooks/useAnchorProvider";
import { useVoteProgram } from "@/features/governance/hooks/useVoteProgram";
import {
    PROGRAM_ID,
    SOL_VAULT_SEED,
    TREASURY_CONFIG_SEED,
    X_MINT_SEED,
} from "@/features/governance/constants";
import { ensureAssociatedTokenAccount } from "@/features/governance/utils/tokenAccounts";
import { parseTxError } from "@/shared/utils/txError";

interface TreasuryConfigAccount {
    treasuryTokenAccount: PublicKey;
    solPrice: unknown;
    tokensPerPurchase: unknown;
}

interface VoteProgramAccountNamespace {
    treasuryConfig: {
        fetch: (address: PublicKey) => Promise<unknown>;
    };
    proposal: {
        all: () => Promise<unknown[]>;
    };
}

function asNumber(value: unknown): number {
    if (typeof value === "number") return value;
    if (typeof value === "bigint") return Number(value);
    if (value && typeof value === "object") {
        const maybeToNumber = (value as { toNumber?: () => number }).toNumber;
        if (typeof maybeToNumber === "function") return maybeToNumber();
        const maybeToString = (value as { toString?: () => string }).toString;
        if (typeof maybeToString === "function") {
            const parsed = Number(maybeToString());
            if (Number.isFinite(parsed)) return parsed;
        }
    }
    return 0;
}

export default function Dashboard() {
    const { provider } = useAnchorProvider();
    const program = useVoteProgram();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [stats, setStats] = useState({
        solBalance: 0,
        tokenSupply: 0,
        proposalCount: 0,
        userBalance: 0,
    });
    const [treasuryQuote, setTreasuryQuote] = useState({
        solPerPurchase: 1,
        tokensPerPurchase: 1000,
        tokensPerSol: 1000,
    });

    const fetchStats = useCallback(async () => {
        if (!program || !provider) return;

        setRefreshing(true);
        try {
            const [solVaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(SOL_VAULT_SEED)],
                PROGRAM_ID
            );
            const solBalance = await provider.connection.getBalance(solVaultPda);

            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );
            const [xMintPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(X_MINT_SEED)],
                PROGRAM_ID
            );

            const accounts = program.account as unknown as VoteProgramAccountNamespace;
            let pCount = 0;

            try {
                const treasuryConfig = (await accounts.treasuryConfig.fetch(
                    treasuryConfigPda
                )) as TreasuryConfigAccount;

                const solPriceLamports = asNumber(treasuryConfig.solPrice);
                const tokensPerPurchaseBaseUnits = asNumber(treasuryConfig.tokensPerPurchase);
                const solPerPurchase = solPriceLamports / 1e9;
                const tokensPerPurchase = tokensPerPurchaseBaseUnits / 1e6;
                const tokensPerSol = solPerPurchase > 0 ? tokensPerPurchase / solPerPurchase : 0;

                if (tokensPerPurchase > 0 && solPerPurchase > 0) {
                    setTreasuryQuote({
                        solPerPurchase,
                        tokensPerPurchase,
                        tokensPerSol,
                    });
                }

                const proposals = await accounts.proposal.all();
                pCount = proposals.length;
            } catch {
                // Treasury/proposals may not be initialized yet.
            }

            let userTokens = 0;
            try {
                const userAta = await getAssociatedTokenAddress(xMintPda, provider.publicKey);
                const tokenAccountInfo = await provider.connection.getTokenAccountBalance(userAta);
                userTokens = tokenAccountInfo.value.uiAmount || 0;
            } catch {
                // Wallet ATA may not exist yet.
            }

            let tokenSupply = 0;
            try {
                const supplyInfo = await provider.connection.getTokenSupply(xMintPda);
                tokenSupply = supplyInfo.value.uiAmount || 0;
            } catch {
                // Mint may not be initialized yet.
            }

            setStats({
                solBalance: solBalance / 1e9,
                tokenSupply,
                proposalCount: pCount,
                userBalance: userTokens,
            });
        } catch (error) {
            console.error("Error fetching governance stats:", error);
        } finally {
            setRefreshing(false);
        }
    }, [program, provider]);

    const handleBuyTokens = async () => {
        if (!program || !provider) return;
        setLoading(true);
        setActionMessage(null);

        try {
            const [xMintPda] = PublicKey.findProgramAddressSync([Buffer.from(X_MINT_SEED)], PROGRAM_ID);
            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(TREASURY_CONFIG_SEED)],
                PROGRAM_ID
            );
            const accounts = program.account as unknown as VoteProgramAccountNamespace;
            const treasuryConfig = (await accounts.treasuryConfig.fetch(
                treasuryConfigPda
            )) as TreasuryConfigAccount;

            const buyerTokenAccount = await ensureAssociatedTokenAccount(
                provider,
                xMintPda,
                provider.publicKey
            );

            await program.methods
                .buyTokens()
                .accountsPartial({
                    buyer: provider.publicKey,
                    treasuryTokenAccount: treasuryConfig.treasuryTokenAccount,
                    buyerTokenAccount,
                    xMint: xMintPda,
                })
                .rpc();

            await fetchStats();
            setActionMessage("✓ Governance tokens purchased successfully.");
        } catch (error: unknown) {
            const parsed = parseTxError(error, "Failed to buy governance tokens.");
            setActionMessage(`Error: ${parsed.userMessage}`);
            if (parsed.shouldLog) {
                console.error("Buy tokens failed", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const firstLoad = setTimeout(() => {
            void fetchStats();
        }, 0);

        const interval = setInterval(() => {
            void fetchStats();
        }, 15_000);

        return () => {
            clearTimeout(firstLoad);
            clearInterval(interval);
        };
    }, [fetchStats]);

    return (
        <div className="dashboard animate-fade-in">
            <div className="flex-between mb-8">
                <div>
                    <h2 className="gradient-text text-4xl mb-1">Governance Overview</h2>
                    <p className="text-sm text-slate-500">Real-time metrics for your DAO treasury and voting state</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => void fetchStats()}
                        className="glass-card flex items-center gap-2 py-3 px-5 border-teal-200/50"
                        disabled={refreshing}
                    >
                        <RefreshCw className={refreshing ? "animate-spin text-teal-500" : "text-teal-500"} size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Refresh</span>
                    </button>
                    <div className="glass-card flex items-center gap-2 py-3 px-5 border-teal-200/50">
                        <Activity className="text-teal-500" size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Live Network</span>
                    </div>
                </div>
            </div>

            {actionMessage && (
                <div
                    className={`mb-6 p-3 rounded-xl border flex items-center gap-2 ${
                        actionMessage.startsWith("✓")
                            ? "bg-teal-50 border-teal-200 text-teal-700"
                            : "bg-red-50 border-red-200 text-red-700"
                    }`}
                >
                    {actionMessage.startsWith("✓") ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                    <span className="text-sm font-semibold">{actionMessage}</span>
                </div>
            )}

            <div className="grid-cols-3 gap-8 mb-12">
                <div className="glass-card bg-teal-600 border-none text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet size={80} />
                    </div>
                    <div className="relative z-10">
                        <span className="text-teal-100 text-xs font-bold uppercase tracking-widest block mb-2">Treasury Vault</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black">{stats.solBalance.toFixed(2)}</span>
                            <span className="text-xl font-bold opacity-70">SOL</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-emerald-100 group-hover:scale-110 transition-transform">
                        <Coins size={80} />
                    </div>
                    <div className="relative z-10">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Active Proposals</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-800">{stats.proposalCount}</span>
                            <span className="text-slate-400 font-bold uppercase text-xs">Open Items</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                            Token Supply: {stats.tokenSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} X
                        </div>
                    </div>
                </div>

                <div className="glass-card border-amber-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-amber-100 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={80} />
                    </div>
                    <div className="relative z-10">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Your Voting Power</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-amber-600">
                                {stats.userBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400 font-bold uppercase text-xs">X-Tokens</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card bg-white/40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Zap size={20} />
                        </div>
                        <h3 className="text-xl font-bold">Acquire Governance Tokens</h3>
                    </div>

                    <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                        Buy governance tokens directly from protocol treasury parameters.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-teal-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <Coins className="text-slate-400 group-hover:text-teal-500 transition-colors" size={24} />
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Input Amount</div>
                                    <div className="text-lg font-bold">{treasuryQuote.solPerPurchase.toFixed(4)} SOL</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-teal-600 uppercase">Expected Output</div>
                                <div className="text-lg font-bold text-teal-700">
                                    {treasuryQuote.tokensPerPurchase.toLocaleString(undefined, { maximumFractionDigits: 2 })} X
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                Treasury Conversion
                            </div>
                            <div className="text-2xl font-black text-slate-800">
                                1 SOL ~= {treasuryQuote.tokensPerSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} X
                            </div>
                        </div>

                        <button
                            onClick={handleBuyTokens}
                            disabled={loading}
                            className="btn-primary w-full py-5 text-lg justify-center gap-3 bg-teal-600 shadow-teal-600/20"
                        >
                            <Zap size={20} className={loading ? "animate-pulse" : ""} />
                            {loading ? "Transacting..." : "Buy Governance Tokens"}
                        </button>
                    </div>
                </div>

                <div className="glass-card bg-white/40 border-slate-200">
                    <h3 className="text-xl font-bold mb-6">Protocol Snapshot</h3>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Treasury Reserve</div>
                            <div className="text-2xl font-black text-slate-800">{stats.solBalance.toFixed(2)} SOL</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registered Proposals</div>
                            <div className="text-2xl font-black text-slate-800">{stats.proposalCount}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total X Supply</div>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.tokenSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
