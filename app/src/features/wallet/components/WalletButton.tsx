"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const WalletMultiButtonDynamic = dynamic(
    async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
);

const WalletModalButtonDynamic = dynamic(
    async () => (await import("@solana/wallet-adapter-react-ui")).WalletModalButton,
    { ssr: false }
);

export default function WalletButton() {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    if (!connected) {
        return <WalletModalButtonDynamic />;
    }

    return (
        <div className="flex items-center gap-2">
            <WalletMultiButtonDynamic />
            <button
                type="button"
                className="btn-secondary"
                onClick={() => setVisible(true)}
            >
                Change Wallet
            </button>
        </div>
    );
}
