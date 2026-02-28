use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::VoteError;
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
