import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import type { VoteApp } from "../target/types/vote_app";
import idl from "../target/idl/vote_app.json";

import { expect } from "chai";
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import NodeWallet from "@anchor-lang/core/dist/cjs/nodewallet";

const SEEDS = {
  SOL_VAULT: "sol_vault",
  TREASURY_CONFIG: "treasury_config",
  X_MINT: "x_mint",
  VOTER: "voter",
  PROPOSAL_COUNTER: "proposal_counter",
  PROPOSAL: "proposal",
  WINNER: "winner",
} as const;

const ONE_SOL = anchor.web3.LAMPORTS_PER_SOL;
const TOKEN_DECIMALS = 6;
const TOKENS_PER_PURCHASE_BASE = 1_000_000_000; // 1000 tokens with 6 decimals
const PROPOSAL_STAKE_BASE = 1_000;
const VOTE_STAKE_BASE = 1_000;

const findPda = (
  programId: anchor.web3.PublicKey,
  seeds: (Buffer | Uint8Array)[]
): anchor.web3.PublicKey => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId);
  return pda;
};

const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isUnknownActionError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("Unknown action 'undefined'");
};

const retryOnUnknownAction = async <T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> => {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (!isUnknownActionError(err) || attempt >= maxRetries) {
        throw err;
      }
      attempt += 1;
      await sleep(150 * attempt);
    }
  }
};

const waitForProgramReady = async (
  connection: anchor.web3.Connection,
  programId: anchor.web3.PublicKey,
  timeoutMs = 30_000
) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const info = await connection.getAccountInfo(programId, "confirmed");
    if (info?.executable) return;
    await sleep(500);
  }
  throw new Error(`Program ${programId.toBase58()} was not ready in time`);
};

const airDropSol = async (
  connection: anchor.web3.Connection,
  publicKey: anchor.web3.PublicKey,
  lamports: number
) => {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const signature = await connection.requestAirdrop(publicKey, lamports);
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );
};

const getBlockTime = async (
  connection: anchor.web3.Connection
): Promise<number> => {
  const slot = await connection.getSlot("confirmed");
  const blockTime = await connection.getBlockTime(slot);
  if (blockTime === null) throw new Error("Failed to fetch block time");
  return blockTime;
};

const extractAnchorErrorCode = (err: unknown): string | undefined => {
  const e = err as any;
  return (
    e?.error?.errorCode?.code ??
    e?.errorCode?.code ??
    e?.code ??
    e?.transactionError?.message
  );
};

const expectAnchorErrorCode = (err: unknown, expectedCode: string) => {
  const code = extractAnchorErrorCode(err);
  expect(code).to.equal(expectedCode);
};

const expectTxFailure = async (
  txAttempt: Promise<unknown> | (() => Promise<unknown>),
  expectedCode?: string
) => {
  try {
    const txPromise =
      typeof txAttempt === "function" ? txAttempt() : txAttempt;
    await txPromise;
    expect.fail("Expected transaction to fail");
  } catch (err) {
    if (expectedCode) {
      expectAnchorErrorCode(err, expectedCode);
    }
  }
};

describe("vote_app protocol edge-case suite", () => {
  const connection = new anchor.web3.Connection(
    "http://127.0.0.1:8899",
    "confirmed"
  );
  const adminWallet = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        require("fs").readFileSync(
          require("os").homedir() + "/.config/solana/id.json",
          "utf-8"
        )
      )
    )
  );

  const provider = new anchor.AnchorProvider(
    connection,
    new NodeWallet(adminWallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);
  const program = new anchor.Program(idl as any, provider) as Program<VoteApp>;

  let creatorWallet: anchor.web3.Keypair;
  let voterWallet: anchor.web3.Keypair;
  let strangerWallet: anchor.web3.Keypair;

  let treasuryConfigPda: anchor.web3.PublicKey;
  let proposalCounterPda: anchor.web3.PublicKey;
  let winnerPda: anchor.web3.PublicKey;
  let xMintPda: anchor.web3.PublicKey;
  let solVaultPda: anchor.web3.PublicKey;
  let voterPda: anchor.web3.PublicKey;

  let treasuryTokenAccount: anchor.web3.PublicKey;
  let creatorTokenAccount: anchor.web3.PublicKey;
  let voterTokenAccount: anchor.web3.PublicKey;
  let strangerTokenAccount: anchor.web3.PublicKey;

  let votedProposalId = 0;
  let votedProposalPda: anchor.web3.PublicKey;

  const programAccounts = program.account as unknown as {
    proposalCounter: { fetch: (key: anchor.web3.PublicKey) => Promise<any> };
    proposal: { fetch: (key: anchor.web3.PublicKey) => Promise<any> };
    winner: { fetch: (key: anchor.web3.PublicKey) => Promise<any> };
  };

  const buyTokensFor = async (
    wallet: anchor.web3.Keypair,
    buyerTokenAccount: anchor.web3.PublicKey
  ) => {
    await retryOnUnknownAction(() =>
      program.methods
        .buyTokens()
        .accounts({
          buyer: wallet.publicKey,
          treasuryTokenAccount,
          buyerTokenAccount,
          xMint: xMintPda,
        })
        .signers([wallet])
        .rpc()
    );
  };

  const createProposal = async (
    creator: anchor.web3.Keypair,
    creatorAta: anchor.web3.PublicKey,
    deadlineOffsetSec: number,
    proposalInfo: string,
    tokenStakeBase = PROPOSAL_STAKE_BASE
  ) => {
    const counter = await programAccounts.proposalCounter.fetch(proposalCounterPda);
    const proposalId = Number(counter.proposalCount);
    const proposalPda = findPda(program.programId, [
      Buffer.from(SEEDS.PROPOSAL),
      Buffer.from([proposalId]),
    ]);
    const deadlineTs = (await getBlockTime(connection)) + deadlineOffsetSec;

    await retryOnUnknownAction(() =>
      program.methods
        .registerProposal(
          proposalInfo,
          new anchor.BN(deadlineTs),
          new anchor.BN(tokenStakeBase)
        )
        .accounts({
          authority: creator.publicKey,
          proposalAccount: proposalPda,
          proposalCounterAccount: proposalCounterPda,
          xMint: xMintPda,
          proposalTokenAccount: creatorAta,
          treasuryTokenAccount,
        })
        .signers([creator])
        .rpc()
    );

    return { proposalId, proposalPda, deadlineTs };
  };

  before(async () => {
    await waitForProgramReady(connection, program.programId);

    creatorWallet = anchor.web3.Keypair.generate();
    voterWallet = anchor.web3.Keypair.generate();
    strangerWallet = anchor.web3.Keypair.generate();

    treasuryConfigPda = findPda(program.programId, [
      anchor.utils.bytes.utf8.encode(SEEDS.TREASURY_CONFIG),
    ]);
    proposalCounterPda = findPda(program.programId, [
      anchor.utils.bytes.utf8.encode(SEEDS.PROPOSAL_COUNTER),
    ]);
    winnerPda = findPda(program.programId, [
      anchor.utils.bytes.utf8.encode(SEEDS.WINNER),
    ]);
    xMintPda = findPda(program.programId, [
      anchor.utils.bytes.utf8.encode(SEEDS.X_MINT),
    ]);
    solVaultPda = findPda(program.programId, [
      anchor.utils.bytes.utf8.encode(SEEDS.SOL_VAULT),
    ]);
    voterPda = findPda(program.programId, [
      anchor.utils.bytes.utf8.encode(SEEDS.VOTER),
      voterWallet.publicKey.toBuffer(),
    ]);

    await Promise.all([
      airDropSol(connection, adminWallet.publicKey, 5 * ONE_SOL),
      airDropSol(connection, creatorWallet.publicKey, 10 * ONE_SOL),
      airDropSol(connection, voterWallet.publicKey, 10 * ONE_SOL),
      airDropSol(connection, strangerWallet.publicKey, 10 * ONE_SOL),
    ]);

    await program.methods
      .initializeTreasury(
        new anchor.BN(ONE_SOL),
        new anchor.BN(TOKENS_PER_PURCHASE_BASE)
      )
      .accounts({
        authority: adminWallet.publicKey,
      })
      .rpc();

    treasuryTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        adminWallet,
        xMintPda,
        adminWallet.publicKey
      )
    ).address;
    creatorTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        creatorWallet,
        xMintPda,
        creatorWallet.publicKey
      )
    ).address;
    voterTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        voterWallet,
        xMintPda,
        voterWallet.publicKey
      )
    ).address;
    strangerTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        strangerWallet,
        xMintPda,
        strangerWallet.publicKey
      )
    ).address;

    await program.methods
      .configureTreasuryTokenAccount()
      .accounts({
        authority: adminWallet.publicKey,
        xMint: xMintPda,
        treasuryTokenAccount,
      })
      .rpc();

    await program.methods
      .initializeProposalCounter()
      .accounts({
        authority: adminWallet.publicKey,
      })
      .rpc();

    await buyTokensFor(creatorWallet, creatorTokenAccount);
    await buyTokensFor(voterWallet, voterTokenAccount);

    await program.methods
      .registerVoter()
      .accounts({
        authority: voterWallet.publicKey,
        voterAccount: voterPda,
      })
      .signers([voterWallet])
      .rpc();
  });

  describe("Treasury and Token Purchase", () => {
    it("rejects re-initializing treasury", async () => {
      await expectTxFailure(
        program.methods
          .initializeTreasury(
            new anchor.BN(ONE_SOL),
            new anchor.BN(TOKENS_PER_PURCHASE_BASE)
          )
          .accounts({
            authority: adminWallet.publicKey,
          })
          .rpc()
      );
    });

    it("rejects treasury token config from non-authority", async () => {
      await expectTxFailure(
        program.methods
          .configureTreasuryTokenAccount()
          .accounts({
            authority: creatorWallet.publicKey,
            xMint: xMintPda,
            treasuryTokenAccount: creatorTokenAccount,
          })
          .signers([creatorWallet])
          .rpc(),
        "UnauthorizedAccess"
      );
    });

    it("rejects treasury token config with wrong token account owner", async () => {
      await expectTxFailure(
        program.methods
          .configureTreasuryTokenAccount()
          .accounts({
            authority: adminWallet.publicKey,
            xMint: xMintPda,
            treasuryTokenAccount: creatorTokenAccount,
          })
          .rpc(),
        "InvalidTokenAccountOwner"
      );
    });

    it("mints configured amount on buyTokens", async () => {
      const before = (await getAccount(connection, creatorTokenAccount)).amount;
      await buyTokensFor(creatorWallet, creatorTokenAccount);
      const after = (await getAccount(connection, creatorTokenAccount)).amount;

      expect(after - before).to.equal(BigInt(TOKENS_PER_PURCHASE_BASE));
    });

    it("rejects buyTokens when buyer token owner mismatches signer", async () => {
      await expectTxFailure(
        program.methods
          .buyTokens()
          .accounts({
            buyer: creatorWallet.publicKey,
            treasuryTokenAccount,
            buyerTokenAccount: voterTokenAccount,
            xMint: xMintPda,
          })
          .signers([creatorWallet])
          .rpc(),
        "InvalidTokenAccountOwner"
      );
    });

    it("rejects buyTokens with invalid mint", async () => {
      const fakeMint = await createMint(
        connection,
        adminWallet,
        adminWallet.publicKey,
        null,
        TOKEN_DECIMALS
      );
      const fakeBuyerAta = (
        await getOrCreateAssociatedTokenAccount(
          connection,
          creatorWallet,
          fakeMint,
          creatorWallet.publicKey
        )
      ).address;

      await expectTxFailure(
        program.methods
          .buyTokens()
          .accounts({
            buyer: creatorWallet.publicKey,
            treasuryTokenAccount,
            buyerTokenAccount: fakeBuyerAta,
            xMint: fakeMint,
          })
          .signers([creatorWallet])
          .rpc(),
        "InvalidMint"
      );
    });
  });

  describe("Voter and Proposal Lifecycle", () => {
    it("rejects duplicate voter registration", async () => {
      await expectTxFailure(
        program.methods
          .registerVoter()
          .accounts({
            authority: voterWallet.publicKey,
            voterAccount: voterPda,
          })
          .signers([voterWallet])
          .rpc()
      );
    });

    it("rejects proposal registration with past deadline", async () => {
      const counter = await programAccounts.proposalCounter.fetch(proposalCounterPda);
      const proposalId = Number(counter.proposalCount);
      const proposalPda = findPda(program.programId, [
        Buffer.from(SEEDS.PROPOSAL),
        Buffer.from([proposalId]),
      ]);
      const deadlineTs = (await getBlockTime(connection)) - 1;

      await expectTxFailure(
        program.methods
          .registerProposal(
            "Past deadline proposal",
            new anchor.BN(deadlineTs),
            new anchor.BN(PROPOSAL_STAKE_BASE)
          )
          .accounts({
            authority: creatorWallet.publicKey,
            proposalAccount: proposalPda,
            proposalCounterAccount: proposalCounterPda,
            xMint: xMintPda,
            proposalTokenAccount: creatorTokenAccount,
            treasuryTokenAccount,
          })
          .signers([creatorWallet])
          .rpc(),
        "InvalidDeadline"
      );
    });

    it("registers proposal and increments proposal counter", async () => {
      const counterBefore = await programAccounts.proposalCounter.fetch(
        proposalCounterPda
      );
      const nextBefore = Number(counterBefore.proposalCount);

      const created = await createProposal(
        creatorWallet,
        creatorTokenAccount,
        6,
        "Primary governance proposal"
      );

      votedProposalId = created.proposalId;
      votedProposalPda = created.proposalPda;

      const proposal = await programAccounts.proposal.fetch(votedProposalPda);
      const counterAfter = await programAccounts.proposalCounter.fetch(
        proposalCounterPda
      );

      expect(Number(proposal.proposalId)).to.equal(votedProposalId);
      expect(Number(proposal.numberOfVotes)).to.equal(0);
      expect(proposal.proposalInfo).to.equal("Primary governance proposal");
      expect(Number(counterAfter.proposalCount)).to.equal(nextBefore + 1);
    });

    it("casts vote successfully", async () => {
      const before = (await getAccount(connection, voterTokenAccount)).amount;

      await program.methods
        .proposalToVote(votedProposalId, new anchor.BN(VOTE_STAKE_BASE))
        .accounts({
          authority: voterWallet.publicKey,
          voterAccount: voterPda,
          xMint: xMintPda,
          voterTokenAccount,
          treasuryTokenAccount,
          proposalAccount: votedProposalPda,
        })
        .signers([voterWallet])
        .rpc();

      const after = (await getAccount(connection, voterTokenAccount)).amount;
      const proposal = await programAccounts.proposal.fetch(votedProposalPda);

      expect(before - after).to.equal(BigInt(VOTE_STAKE_BASE));
      expect(Number(proposal.numberOfVotes)).to.equal(1);
    });

    it("rejects double voting from same voter", async () => {
      await expectTxFailure(
        program.methods
          .proposalToVote(votedProposalId, new anchor.BN(VOTE_STAKE_BASE))
          .accounts({
            authority: voterWallet.publicKey,
            voterAccount: voterPda,
            xMint: xMintPda,
            voterTokenAccount,
            treasuryTokenAccount,
            proposalAccount: votedProposalPda,
          })
          .signers([voterWallet])
          .rpc(),
        "VoterAlreadyVoted"
      );
    });

    it("rejects voting after proposal deadline", async () => {
      const fastProposal = await createProposal(
        creatorWallet,
        creatorTokenAccount,
        3,
        "Expires quickly"
      );

      const lateVoterPda = findPda(program.programId, [
        Buffer.from(SEEDS.VOTER),
        strangerWallet.publicKey.toBuffer(),
      ]);
      const lateVoterInfo = await connection.getAccountInfo(lateVoterPda);
      if (!lateVoterInfo) {
        await retryOnUnknownAction(() =>
          program.methods
            .registerVoter()
            .accounts({
              authority: strangerWallet.publicKey,
              voterAccount: lateVoterPda,
            })
            .signers([strangerWallet])
            .rpc()
        );
      }
      await buyTokensFor(strangerWallet, strangerTokenAccount);

      while ((await getBlockTime(connection)) <= fastProposal.deadlineTs) {
        await sleep(500);
      }

      const tx = await program.methods
        .proposalToVote(fastProposal.proposalId, new anchor.BN(VOTE_STAKE_BASE))
        .accounts({
          authority: strangerWallet.publicKey,
          voterAccount: lateVoterPda,
          xMint: xMintPda,
          voterTokenAccount: strangerTokenAccount,
          treasuryTokenAccount,
          proposalAccount: fastProposal.proposalPda,
        })
        .transaction();

      await expectTxFailure(provider.simulate(tx, [strangerWallet]));
    });
  });

  describe("Winner Selection, Closing, and Withdrawals", () => {
    it("rejects pickWinner while voting is still active", async () => {
      const activeProposal = await createProposal(
        creatorWallet,
        creatorTokenAccount,
        20,
        "Still active proposal"
      );

      const tx = await program.methods
        .pickWinner(activeProposal.proposalId)
        .accounts({
          authority: adminWallet.publicKey,
          proposalAccount: activeProposal.proposalPda,
          winnerAccount: winnerPda,
        })
        .transaction();

      await expectTxFailure(provider.simulate(tx));
    });

    it("rejects pickWinner when no votes were cast", async () => {
      const noVoteProposal = await createProposal(
        creatorWallet,
        creatorTokenAccount,
        3,
        "No-vote proposal"
      );

      while ((await getBlockTime(connection)) <= noVoteProposal.deadlineTs) {
        await sleep(500);
      }

      const tx = await program.methods
        .pickWinner(noVoteProposal.proposalId)
        .accounts({
          authority: adminWallet.publicKey,
          proposalAccount: noVoteProposal.proposalPda,
          winnerAccount: winnerPda,
        })
        .transaction();

      await expectTxFailure(provider.simulate(tx));
    });

    it("picks winner successfully after deadline for voted proposal", async () => {
      const proposal = await programAccounts.proposal.fetch(votedProposalPda);
      const deadline = Number(proposal.deadline);

      while ((await getBlockTime(connection)) < deadline + 1) {
        await sleep(500);
      }

      await program.methods
        .pickWinner(votedProposalId)
        .accounts({
          authority: adminWallet.publicKey,
          proposalAccount: votedProposalPda,
          winnerAccount: winnerPda,
        })
        .rpc();

      const winner = await programAccounts.winner.fetch(winnerPda);
      expect(Number(winner.winningProposalId)).to.equal(votedProposalId);
      expect(Number(winner.winningVotes)).to.equal(1);
    });

    it("rejects closing proposal by non-creator", async () => {
      await expectTxFailure(
        program.methods
          .closeProposal(votedProposalId)
          .accounts({
            proposalAccount: votedProposalPda,
            destination: voterWallet.publicKey,
            authority: voterWallet.publicKey,
          })
          .signers([voterWallet])
          .rpc(),
        "UnauthorizedAccess"
      );
    });

    it("rejects closing proposal before deadline", async () => {
      const openProposal = await createProposal(
        creatorWallet,
        creatorTokenAccount,
        20,
        "Cannot close yet"
      );

      await expectTxFailure(
        program.methods
          .closeProposal(openProposal.proposalId)
          .accounts({
            proposalAccount: openProposal.proposalPda,
            destination: creatorWallet.publicKey,
            authority: creatorWallet.publicKey,
          })
          .signers([creatorWallet])
          .rpc(),
        "VotingStillActive"
      );
    });

    it("closes ended proposal successfully", async () => {
      const before = await connection.getAccountInfo(votedProposalPda);
      expect(before).to.not.be.null;

      await program.methods
        .closeProposal(votedProposalId)
        .accounts({
          proposalAccount: votedProposalPda,
          destination: creatorWallet.publicKey,
          authority: creatorWallet.publicKey,
        })
        .signers([creatorWallet])
        .rpc();

      const after = await connection.getAccountInfo(votedProposalPda);
      expect(after).to.be.null;
    });

    it("rejects SOL withdraw by non-authority", async () => {
      await expectTxFailure(
        program.methods
          .withdrawSol(new anchor.BN(100_000))
          .accounts({
            authority: creatorWallet.publicKey,
          })
          .signers([creatorWallet])
          .rpc(),
        "UnauthorizedAccess"
      );
    });

    it("rejects SOL withdraw larger than vault balance", async () => {
      const vaultBalance = await connection.getBalance(solVaultPda);

      await expectTxFailure(
        program.methods
          .withdrawSol(new anchor.BN(vaultBalance + 1))
          .accounts({
            authority: adminWallet.publicKey,
          })
          .rpc()
      );
    });

    it("allows authorized SOL withdraw", async () => {
      const vaultBalance = await connection.getBalance(solVaultPda);
      const withdrawAmount = Math.max(1, Math.min(100_000, vaultBalance));
      const adminBalanceBefore = await connection.getBalance(adminWallet.publicKey);

      await program.methods
        .withdrawSol(new anchor.BN(withdrawAmount))
        .accounts({
          authority: adminWallet.publicKey,
        })
        .rpc();

      const adminBalanceAfter = await connection.getBalance(adminWallet.publicKey);
      expect(adminBalanceAfter).to.be.greaterThan(adminBalanceBefore - 100_000);
    });

    it("closes voter account and rejects second close", async () => {
      const before = await connection.getAccountInfo(voterPda);
      expect(before).to.not.be.null;

      await program.methods
        .closeVoter()
        .accounts({
          voterAccount: voterPda,
          authority: voterWallet.publicKey,
        })
        .signers([voterWallet])
        .rpc();

      const after = await connection.getAccountInfo(voterPda);
      expect(after).to.be.null;

      await expectTxFailure(
        program.methods
          .closeVoter()
          .accounts({
            voterAccount: voterPda,
            authority: voterWallet.publicKey,
          })
          .signers([voterWallet])
          .rpc()
      );
    });
  });
});
