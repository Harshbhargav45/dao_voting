"use client";

import { useMemo } from "react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";

type ReadonlyWallet = {
    publicKey: Keypair["publicKey"];
    signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
    signAllTransactions: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>;
};

export function useAnchorProvider() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const readonlyWallet = useMemo<ReadonlyWallet>(() => {
        const keypair = Keypair.generate();
        return {
            publicKey: keypair.publicKey,
            signTransaction: async <T extends Transaction | VersionedTransaction>(transaction: T) =>
                Promise.resolve(transaction),
            signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]) =>
                Promise.resolve(transactions),
        };
    }, []);

    const provider = useMemo(() => {
        if (!wallet) return null;
        return new AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });
    }, [connection, wallet]);

    const readProvider = useMemo(
        () =>
            new AnchorProvider(connection, readonlyWallet, {
                commitment: "confirmed",
            }),
        [connection, readonlyWallet]
    );

    return { provider, readProvider };
}
