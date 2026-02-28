use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::VoteError;
use crate::state::*;

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
