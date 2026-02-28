# Solana DAO Voting Platform

A sophisticated, decentralized autonomous organization (DAO) governance and voting system built on the Solana blockchain. This project enables seamless community-driven decision-making through on-chain proposals and token-weighted voting.

## 🚀 Overview

This platform empowers communities to manage their treasury and make collective decisions transparently. It features a robust Anchor-based smart contract on the Solana blockchain and a modern, lightning-fast Next.js frontend.

### Core Features

- **Treasury Management**: Initializable treasury with configurable token pricing and liquidity control.
- **Token Acquisition**: Integrated mechanism for users to purchase governance tokens using SOL.
- **Voter Registration**: Permissionless registration for community members to participate in governance.
- **Proposal Lifecycle**: 
  - **Create**: Submit detailed proposals with specific goals and token requirements.
  - **Vote**: Token-weighted voting mechanism to ensure stakeholder influence.
  - **Resolve**: Automated winner selection and proposal closure based on community input.
- **Full Transparency**: Every action, from token purchase to voting, is recorded immutably on the Solana ledger.

## 🛠 Tech Stack

### Smart Contract (Solana)
- **Framework**: [Anchor](https://www.anchor-lang.com/)
- **Language**: Rust
- **Program ID**: `HDrF2dTrJp5SEvDFy8YEk6E5vivj3DgaBNpUPebdGH9F`

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Wallet Integration**: [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Project Structure

```text
├── app/                # Next.js Frontend
│   ├── src/
│   │   ├── app/        # Pages and routing
│   │   ├── features/   # Business logic components
│   │   ├── shared/     # Reusable UI components
│   │   └── types/      # TypeScript definitions
│   └── package.json    # Frontend dependencies
├── programs/           # Solana Programs (Anchor)
│   └── vote_app/
│       └── src/        # Rust source code
│           ├── contexts/   # Instruction context accounts
│           ├── instructions/# Implementation logic
│           ├── state/      # Account structures
│           └── lib.rs      # Program entry point
├── tests/              # Integration tests
├── migrations/         # Deployment scripts
├── Anchor.toml         # Anchor configuration
└── Cargo.toml          # Rust workspace configuration
```

## 🚦 Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) & [Yarn/NPM](https://yarnpkg.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install program dependencies**
   ```bash
   yarn install
   ```

3. **Install frontend dependencies**
   ```bash
   cd app && npm install
   ```

### Deployment & Testing

1. **Build the Solana program**
   ```bash
   anchor build
   ```

2. **Run tests**
   ```bash
   anchor test
   ```

3. **Deploy to Devnet**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

4. **Launch the frontend**
   ```bash
   cd app
   npm run dev
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
