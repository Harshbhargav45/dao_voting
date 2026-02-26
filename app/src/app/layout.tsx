import type { Metadata } from "next";
import "./globals.css";
import AppWalletProvider from "../components/AppWalletProvider";
import WalletButton from "../components/WalletButton";

export const metadata: Metadata = {
  title: "DAO Voting - Decentralized Governance",
  description: "A premium DAO voting application on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppWalletProvider>
          <header style={{
            padding: '1rem 2rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 className="gradient-text" style={{ fontSize: '1.5rem', cursor: 'default' }}>DAOGov</h1>
            <WalletButton />
          </header>
          <main className="main-container">
            {children}
          </main>
        </AppWalletProvider>
      </body>
    </html>
  );
}
