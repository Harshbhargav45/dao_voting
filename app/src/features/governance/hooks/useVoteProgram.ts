"use client";

import { useAnchorProvider } from "@/features/wallet/hooks/useAnchorProvider";
import { Program, Idl } from "@coral-xyz/anchor";
import { useMemo } from "react";
import voteAppIdl from "@/types/vote_app.json";
import { PROGRAM_ID } from "@/features/governance/constants";

export function useVoteProgram() {
    const { provider, readProvider } = useAnchorProvider();
    const idlWithAddress = useMemo(
        () =>
            ({
                ...voteAppIdl,
                address: PROGRAM_ID.toBase58(),
            }) as Idl,
        []
    );

    const program = useMemo(() => {
        return new Program(idlWithAddress, provider ?? readProvider);
    }, [idlWithAddress, provider, readProvider]);

    return program;
}
