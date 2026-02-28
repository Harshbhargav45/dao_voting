use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + TreasuryConfig::INIT_SPACE,
        seeds = [b"treasury_config"],
        bump
    )]
    pub treasury_config_account: Box<Account<'info, TreasuryConfig>>,

    #[account(
        init,
        payer = authority,
        mint::authority = mint_authority,
        mint::decimals = 6,
        seeds = [b"x_mint"],
        bump
    )]
    pub x_mint: Box<Account<'info, Mint>>,

    /// CHECK: This PDA receives SOL from token purchases.
    #[account(mut, seeds = [b"sol_vault"], bump)]
    pub sol_vault: AccountInfo<'info>,

    /// CHECK: PDA used as mint authority for `x_mint`.
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfigureTreasuryTokenAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury_config"],
        bump,
        constraint = treasury_config_account.authority == authority.key() @ VoteError::UnauthorizedAccess
    )]
    pub treasury_config_account: Account<'info, TreasuryConfig>,

    pub x_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = treasury_token_account.mint == x_mint.key() @ VoteError::InvalidMint,
        constraint = treasury_token_account.owner == authority.key() @ VoteError::InvalidTokenAccountOwner
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct InitializeProposalCounter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProposalCounter::INIT_SPACE,
        seeds = [b"proposal_counter"],
        bump
    )]
    pub proposal_counter_account: Box<Account<'info, ProposalCounter>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(
        seeds = [b"treasury_config"],
        bump,
        constraint = treasury_config_account.x_mint == x_mint.key() @ VoteError::InvalidMint,
        constraint = treasury_config_account.treasury_token_account == treasury_token_account.key() @ VoteError::InvalidTokenAccountOwner
    )]
    pub treasury_config_account: Account<'info, TreasuryConfig>,

    /// CHECK: Treasury SOL vault PDA.
    #[account(mut, seeds = [b"sol_vault"], bump = treasury_config_account.bump)]
    pub sol_vault: AccountInfo<'info>,

    #[account(
        mut,
        constraint = treasury_token_account.key() == treasury_config_account.treasury_token_account @ VoteError::InvalidTokenAccountOwner
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub x_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key() @ VoteError::InvalidTokenAccountOwner,
        constraint = buyer_token_account.mint == x_mint.key() @ VoteError::InvalidMint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA mint authority.
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterVoter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Voter::INIT_SPACE,
        seeds = [b"voter", authority.key().as_ref()],
        bump
    )]
    pub voter_account: Account<'info, Voter>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterProposal<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", proposal_counter_account.proposal_count.to_be_bytes().as_ref()],
        bump
    )]
    pub proposal_account: Account<'info, Proposal>,

    #[account(mut)]
    pub proposal_counter_account: Account<'info, ProposalCounter>,

    pub x_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = proposal_token_account.mint == x_mint.key(),
        constraint = proposal_token_account.owner == authority.key()
    )]
    pub proposal_token_account: Account<'info, TokenAccount>,

    #[account(mut, constraint = treasury_token_account.mint == x_mint.key())]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u8)]
pub struct Vote<'info> {
    #[account(
        mut,
        seeds = [b"voter", authority.key().as_ref()],
        bump,
        constraint = voter_account.proposal_voted == 0 @ VoteError::VoterAlreadyVoted
    )]
    pub voter_account: Account<'info, Voter>,

    pub x_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = voter_token_account.mint == x_mint.key() @ VoteError::TokenMintMismatch,
        constraint = voter_token_account.owner == authority.key()
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    #[account(mut, constraint = treasury_token_account.mint == x_mint.key())]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"proposal", proposal_id.to_be_bytes().as_ref()], bump)]
    pub proposal_account: Account<'info, Proposal>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u8)]
pub struct PickWinner<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + Winner::INIT_SPACE,
        seeds = [b"winner"],
        bump
    )]
    pub winner_account: Account<'info, Winner>,

    #[account(seeds = [b"proposal", proposal_id.to_be_bytes().as_ref()], bump)]
    pub proposal_account: Account<'info, Proposal>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u8)]
pub struct CloseProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal_id.to_be_bytes().as_ref()],
        bump,
        close = destination,
        constraint = proposal_account.authority == authority.key() @ VoteError::UnauthorizedAccess
    )]
    pub proposal_account: Account<'info, Proposal>,

    /// CHECK: receives rent when proposal account is closed.
    #[account(mut)]
    pub destination: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseVoter<'info> {
    #[account(
        mut,
        seeds = [b"voter", authority.key().as_ref()],
        bump,
        close = authority
    )]
    pub voter_account: Account<'info, Voter>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        seeds = [b"treasury_config"],
        bump,
        constraint = treasury_config.authority == authority.key() @ VoteError::UnauthorizedAccess
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    /// CHECK: Treasury SOL vault PDA.
    #[account(mut, seeds = [b"sol_vault"], bump = treasury_config.bump)]
    pub sol_vault: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
