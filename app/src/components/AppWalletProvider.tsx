"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
    ConnectionProvider,
    useWallet,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import {
    WalletAdapterNetwork,
    WalletNotReadyError,
    WalletReadyState,
    type WalletAdapter,
    type WalletName,
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

const WALLET_STORAGE_KEY = "vote-app-wallet";
const LAST_CONNECTED_WALLET_KEY = "vote-app-last-connected-wallet";

function WalletConnectionSync() {
    const { wallets, wallet, connected, connecting, disconnecting, select, connect } = useWallet();
    const attemptedWalletRef = useRef<string | null>(null);
    const wasConnectedRef = useRef(false);

    useEffect(() => {
        if (connected && wallet?.adapter.name) {
            localStorage.setItem(LAST_CONNECTED_WALLET_KEY, wallet.adapter.name);
            wasConnectedRef.current = true;
        }
    }, [connected, wallet?.adapter.name]);

    useEffect(() => {
        if (connected) return;
        if (!wasConnectedRef.current) return;
        if (connecting || disconnecting) return;

        wasConnectedRef.current = false;
        attemptedWalletRef.current = null;
        localStorage.removeItem(LAST_CONNECTED_WALLET_KEY);
    }, [connected, connecting, disconnecting]);

    useEffect(() => {
        if (wallet || connecting || connected) return;

        const walletNameFromStorage =
            localStorage.getItem(WALLET_STORAGE_KEY) ??
            localStorage.getItem(LAST_CONNECTED_WALLET_KEY);

        if (!walletNameFromStorage) return;

        const storedWallet = wallets.find(
            ({ adapter }) => adapter.name === walletNameFromStorage
        );
        if (!storedWallet || storedWallet.readyState !== WalletReadyState.Installed) {
            localStorage.removeItem(WALLET_STORAGE_KEY);
            localStorage.removeItem(LAST_CONNECTED_WALLET_KEY);
            return;
        }

        select(walletNameFromStorage as WalletName<string>);
    }, [wallets, wallet, connecting, connected, select]);

    useEffect(() => {
        if (!wallet || connected || connecting || disconnecting) return;
        if (wallet.readyState !== WalletReadyState.Installed) {
            return;
        }

        const adapterName = wallet.adapter.name;
        if (attemptedWalletRef.current === adapterName) return;

        attemptedWalletRef.current = adapterName;
        connect().catch(() => {
            attemptedWalletRef.current = null;
        });
    }, [wallet, connected, connecting, disconnecting, connect]);

    return null;
}

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
                        if (
                            localStorage.getItem(WALLET_STORAGE_KEY) === walletName ||
                            localStorage.getItem(LAST_CONNECTED_WALLET_KEY) === walletName
                        ) {
                            localStorage.removeItem(WALLET_STORAGE_KEY);
                            localStorage.removeItem(LAST_CONNECTED_WALLET_KEY);
                        }

                        console.warn(`[wallet:${walletName}] wallet is not available in this browser.`);
                        return;
                    }

                    console.error(`[wallet:${walletName}] ${error.name}: ${error.message}`);
                }}
            >
                <WalletConnectionSync />
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
