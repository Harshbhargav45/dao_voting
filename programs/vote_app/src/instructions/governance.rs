use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer as TokenTransfer};

use crate::contexts::*;
use crate::errors::VoteError;
use crate::events::*;

pub fn initialize_proposal_counter(ctx: Context<InitializeProposalCounter>) -> Result<()> {
    let proposal_counter_account = &mut ctx.accounts.proposal_counter_account;
    require!(
        proposal_counter_account.proposal_count == 0,
        VoteError::ProposalCounterAlreadyInitialized
    );

    proposal_counter_account.proposal_count = 1;
    proposal_counter_account.authority = ctx.accounts.authority.key();

    emit!(ProposalCounterInitialized {
        authority: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn register_voter(ctx: Context<RegisterVoter>) -> Result<()> {
    let voter_account = &mut ctx.accounts.voter_account;
    voter_account.voter_id = ctx.accounts.authority.key();

    emit!(VoterRegistered {
        voter: ctx.accounts.authority.key(),
        voter_account: ctx.accounts.voter_account.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn register_proposal(
    ctx: Context<RegisterProposal>,
    proposal_info: String,
    deadline: i64,
    token_amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    require!(deadline > clock.unix_timestamp, VoteError::InvalidDeadline);

    let proposal_account = &mut ctx.accounts.proposal_account;

    let cpi_accounts = TokenTransfer {
        from: ctx.accounts.proposal_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, token_amount)?;

    proposal_account.proposal_info = proposal_info;
    proposal_account.deadline = deadline;
    proposal_account.authority = ctx.accounts.authority.key();

    let proposal_counter_account = &mut ctx.accounts.proposal_counter_account;
    proposal_account.proposal_id = proposal_counter_account.proposal_count;
    proposal_counter_account.proposal_count = proposal_counter_account
        .proposal_count
        .checked_add(1)
        .ok_or(VoteError::ProposalCounterOverflow)?;

    emit!(ProposalCreated {
        proposal_id: proposal_account.proposal_id,
        creator: proposal_account.authority,
        proposal_info: proposal_account.proposal_info.clone(),
        deadline: proposal_account.deadline,
        timestamp: Clock::get()?.unix_timestamp,
    });
    Ok(())
}

pub fn proposal_to_vote(ctx: Context<Vote>, proposal_id: u8, token_amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let proposal_account = &mut ctx.accounts.proposal_account;

    require!(
        proposal_account.deadline > clock.unix_timestamp,
        VoteError::ProposalEnded
    );

    let cpi_accounts = TokenTransfer {
        from: ctx.accounts.voter_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, token_amount)?;

    let voter_account = &mut ctx.accounts.voter_account;
    voter_account.proposal_voted = proposal_id;

    proposal_account.number_of_votes = proposal_account
        .number_of_votes
        .checked_add(1)
        .ok_or(VoteError::ProposalVotesOverflow)?;

    emit!(VoteCast {
        voter: ctx.accounts.authority.key(),
        proposal_id,
        total_votes: proposal_account.number_of_votes,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

pub fn pick_winner(ctx: Context<PickWinner>, proposal_id: u8) -> Result<()> {
    let clock = Clock::get()?;
    let proposal = &ctx.accounts.proposal_account;
    let winner = &mut ctx.accounts.winner_account;

    require!(
        clock.unix_timestamp >= proposal.deadline,
        VoteError::VotingStillActive
    );
    require!(proposal.number_of_votes > 0, VoteError::NoVotesCast);

    if proposal.number_of_votes > winner.winning_votes {
        winner.winning_proposal_id = proposal_id;
        winner.winning_votes = proposal.number_of_votes;
        winner.proposal_info = proposal.proposal_info.clone();
        winner.declared_at = clock.unix_timestamp;

        emit!(WinnerDeclared {
            winning_proposal_id: proposal_id,
            proposal_info: proposal.proposal_info.clone(),
            total_votes: proposal.number_of_votes,
            declared_by: ctx.accounts.authority.key(),
            timestamp: clock.unix_timestamp,
        });
    }

    Ok(())
}

pub fn close_proposal(ctx: Context<CloseProposal>, proposal_id: u8) -> Result<()> {
    let clock = Clock::get()?;
    let proposal = &ctx.accounts.proposal_account;

    require!(
        clock.unix_timestamp >= proposal.deadline,
        VoteError::VotingStillActive
    );

    emit!(ProposalClosed {
        proposal_id,
        rent_recovered: ctx.accounts.proposal_account.to_account_info().lamports(),
        recovered_to: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

pub fn close_voter(ctx: Context<CloseVoter>) -> Result<()> {
    emit!(VoterAccountClosed {
        voter: ctx.accounts.voter_account.voter_id,
        rent_recovered_to: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
