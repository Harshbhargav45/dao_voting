use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer as SolTransfer};
use anchor_spl::token;

use crate::contexts::{BuyTokens, ConfigureTreasuryTokenAccount, InitializeTreasury, WithdrawSol};
use crate::events::*;

pub fn initialize_treasury(
    ctx: Context<InitializeTreasury>,
    sol_price: u64,
    tokens_per_purchase: u64,
) -> Result<()> {
    let treasury_config_account = &mut ctx.accounts.treasury_config_account;
    treasury_config_account.authority = ctx.accounts.authority.key();
    treasury_config_account.bump = ctx.bumps.sol_vault;
    treasury_config_account.sol_price = sol_price;
    treasury_config_account.x_mint = ctx.accounts.x_mint.key();
    treasury_config_account.treasury_token_account = Pubkey::default();
    treasury_config_account.tokens_per_purchase = tokens_per_purchase;

    emit!(TreasuryInitialized {
        authority: ctx.accounts.authority.key(),
        x_mint: ctx.accounts.x_mint.key(),
        sol_price,
        tokens_per_purchase,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn configure_treasury_token_account(ctx: Context<ConfigureTreasuryTokenAccount>) -> Result<()> {
    let treasury_config_account = &mut ctx.accounts.treasury_config_account;
    treasury_config_account.treasury_token_account = ctx.accounts.treasury_token_account.key();
    Ok(())
}

pub fn buy_tokens(ctx: Context<BuyTokens>) -> Result<()> {
    let treasury_config_account = &ctx.accounts.treasury_config_account;
    let sol = treasury_config_account.sol_price;
    let token_amount = treasury_config_account.tokens_per_purchase;

    let transfer_ix = SolTransfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.sol_vault.to_account_info(),
    };

    system_program::transfer(
        CpiContext::new(ctx.accounts.system_program.to_account_info(), transfer_ix),
        sol,
    )?;

    let mint_authority_seeds = &[b"mint_authority".as_ref(), &[ctx.bumps.mint_authority]];
    let signer_seeds = &[&mint_authority_seeds[..]];

    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.x_mint.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    token::mint_to(cpi_ctx, token_amount)?;

    emit!(TokensPurchased {
        buyer: ctx.accounts.buyer.key(),
        sol_paid: sol,
        tokens_received: token_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
    let treasury_config = &ctx.accounts.treasury_config;

    let sol_vault_seeds = &[b"sol_vault".as_ref(), &[treasury_config.bump]];
    let signer_seeds = &[&sol_vault_seeds[..]];

    let transfer_ix = SolTransfer {
        from: ctx.accounts.sol_vault.to_account_info(),
        to: ctx.accounts.authority.to_account_info(),
    };

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            transfer_ix,
            signer_seeds,
        ),
        amount,
    )?;

    emit!(SolWithdrawn {
        authority: ctx.accounts.authority.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
