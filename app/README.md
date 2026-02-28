# Vote App Frontend

## Devnet setup

1. Create env file:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start app:

```bash
npm run dev
```

The app defaults to Solana Devnet and supports wallet-adapter compatible wallets (Phantom, Solflare, Trust, Coinbase, Ledger, and more).

## Required env vars

- `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC endpoint (default: Devnet)
- `NEXT_PUBLIC_SOLANA_NETWORK`: `devnet`, `testnet`, or `mainnet-beta`
- `NEXT_PUBLIC_VOTE_APP_PROGRAM_ID`: deployed Vote App program id
- `NEXT_PUBLIC_ENABLE_BURNER_WALLET`: set `true` only for local testing
