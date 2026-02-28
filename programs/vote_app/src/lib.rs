#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod contexts;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use contexts::*;

declare_id!("HDrF2dTrJp5SEvDFy8YEk6E5vivj3DgaBNpUPebdGH9F");

#[program]
pub mod vote_app {
    use super::*;

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        sol_price: u64,
        tokens_per_purchase: u64,
    ) -> Result<()> {
        instructions::initialize_treasury(ctx, sol_price, tokens_per_purchase)
    }

    pub fn configure_treasury_token_account(
        ctx: Context<ConfigureTreasuryTokenAccount>,
    ) -> Result<()> {
        instructions::configure_treasury_token_account(ctx)
    }

    pub fn initialize_proposal_counter(ctx: Context<InitializeProposalCounter>) -> Result<()> {
        instructions::initialize_proposal_counter(ctx)
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>) -> Result<()> {
        instructions::buy_tokens(ctx)
    }

    pub fn register_voter(ctx: Context<RegisterVoter>) -> Result<()> {
        instructions::register_voter(ctx)
    }

    pub fn register_proposal(
        ctx: Context<RegisterProposal>,
        proposal_info: String,
        deadline: i64,
        token_amount: u64,
    ) -> Result<()> {
        instructions::register_proposal(ctx, proposal_info, deadline, token_amount)
    }

    pub fn proposal_to_vote(ctx: Context<Vote>, proposal_id: u8, token_amount: u64) -> Result<()> {
        instructions::proposal_to_vote(ctx, proposal_id, token_amount)
    }

    pub fn pick_winner(ctx: Context<PickWinner>, proposal_id: u8) -> Result<()> {
        instructions::pick_winner(ctx, proposal_id)
    }

    pub fn close_proposal(ctx: Context<CloseProposal>, proposal_id: u8) -> Result<()> {
        instructions::close_proposal(ctx, proposal_id)
    }

    pub fn close_voter(ctx: Context<CloseVoter>) -> Result<()> {
        instructions::close_voter(ctx)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        instructions::withdraw_sol(ctx, amount)
    }
}
