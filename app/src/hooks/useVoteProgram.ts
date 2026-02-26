"use client";

import { useAnchorProvider } from "@/hooks/useAnchorProvider";
import { Program } from "@coral-xyz/anchor";
import { useMemo } from "react";
import idl from "../constants/vote_app.json";
import { PROGRAM_ID } from "../constants";

export function useVoteProgram() {
    const provider = useAnchorProvider();

    const program = useMemo(() => {
        if (!provider) return null;
        return new Program(idl as any, provider);
    }, [provider]);

    return program;
}
