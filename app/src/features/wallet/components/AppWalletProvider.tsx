"use client";

import React, { useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import {
    WalletAdapterNetwork,
    WalletNotReadyError,
    type WalletAdapter,
} from "@solana/wallet-adapter-base";
import {
    Coin98WalletAdapter,
    CoinbaseWalletAdapter,
    LedgerWalletAdapter,
    MathWalletAdapter,
    NightlyWalletAdapter,
    PhantomWalletAdapter,
    SafePalWalletAdapter,
    SolflareWalletAdapter,
    SolongWalletAdapter,
    TorusWalletAdapter,
    TrustWalletAdapter,
    UnsafeBurnerWalletAdapter,
    XDEFIWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { clusterApiUrl } from "@solana/web3.js";
import { parseTxError } from "@/shared/utils/txError";

const WALLET_STORAGE_KEY = "vote-app-wallet";

function resolveNetwork(rawNetwork: string | undefined): WalletAdapterNetwork {
    switch (rawNetwork) {
        case "mainnet":
        case "mainnet-beta":
            return WalletAdapterNetwork.Mainnet;
        case "testnet":
            return WalletAdapterNetwork.Testnet;
        default:
            return WalletAdapterNetwork.Devnet;
    }
}

export default function AppWalletProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const network = resolveNetwork(
        process.env.NEXT_PUBLIC_SOLANA_NETWORK?.trim().toLowerCase()
    );
    const endpoint =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || clusterApiUrl(network);

    const wallets = useMemo(() => {
        const adapters: WalletAdapter[] = [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new CoinbaseWalletAdapter(),
            new TrustWalletAdapter(),
            new NightlyWalletAdapter(),
            new MathWalletAdapter(),
            new SolongWalletAdapter(),
            new XDEFIWalletAdapter(),
            new Coin98WalletAdapter(),
            new SafePalWalletAdapter(),
            new LedgerWalletAdapter(),
            new TorusWalletAdapter(),
        ];

        if (process.env.NEXT_PUBLIC_ENABLE_BURNER_WALLET === "true") {
            adapters.push(new UnsafeBurnerWalletAdapter());
        }

        return adapters;
    }, [network]);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider
                wallets={wallets}
                autoConnect
                localStorageKey={WALLET_STORAGE_KEY}
                onError={(error, adapter) => {
                    const walletName = adapter?.name ?? "unknown";

                    if (error instanceof WalletNotReadyError || error.name === "WalletNotReadyError") {
                        if (localStorage.getItem(WALLET_STORAGE_KEY) === walletName) {
                            localStorage.removeItem(WALLET_STORAGE_KEY);
                        }

                        console.warn(`[wallet:${walletName}] wallet is not available in this browser.`);
                        return;
                    }

                    const parsed = parseTxError(error, "Wallet operation failed.");
                    if (parsed.isUserRejected) {
                        console.info(`[wallet:${walletName}] request rejected by user.`);
                        return;
                    }

                    console.error(`[wallet:${walletName}] ${error.name}: ${error.message}`);
                }}
            >
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
