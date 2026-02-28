"use client";

import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
} from "@solana/spl-token";

/**
 * Ensures the associated token account exists for the given owner/mint.
 * Creates the ATA using the connected wallet as fee payer when missing.
 */
export async function ensureAssociatedTokenAccount(
    provider: AnchorProvider,
    mint: PublicKey,
    owner: PublicKey
): Promise<PublicKey> {
    const ata = await getAssociatedTokenAddress(mint, owner);
    const existing = await provider.connection.getAccountInfo(ata);
    if (existing) return ata;

    const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            provider.publicKey,
            ata,
            owner,
            mint
        )
    );

    try {
        await provider.sendAndConfirm(tx, []);
    } catch {
        const recheck = await provider.connection.getAccountInfo(ata);
        if (!recheck) throw new Error("Failed to create associated token account");
    }

    return ata;
}
