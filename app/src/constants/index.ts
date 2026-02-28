import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_VOTE_APP_PROGRAM_ID?.trim() ||
    "HDrF2dTrJp5SEvDFy8YEk6E5vivj3DgaBNpUPebdGH9F"
);

export const TREASURY_CONFIG_SEED = "treasury_config";
export const X_MINT_SEED = "x_mint";
export const SOL_VAULT_SEED = "sol_vault";
export const PROPOSAL_COUNTER_SEED = "proposal_counter";
export const VOTER_SEED = "voter";
export const PROPOSAL_SEED = "proposal";
