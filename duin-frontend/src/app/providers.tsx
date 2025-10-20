"use client";

import { CommitmentsProvider } from "@/context/commitmentsContext";
import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={""}
      config={{
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
        },
        defaultChain: {
          id: 31337,
          name: 'Anvil Local',
          network: 'anvil',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['http://127.0.0.1:8545'],
            },
            public: {
              http: ['http://127.0.0.1:8545'],
            },
          },
        },
        supportedChains: [
          {
            id: 31337,
            name: 'Anvil Local',
            network: 'anvil',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {  
              default: {
                http: ['http://127.0.0.1:8545'],
              },
              public: {
                http: ['http://127.0.0.1:8545'],
              },
            },
          },
        ],
      }}
    >
      <CommitmentsProvider>
        {children}
      </CommitmentsProvider>
    </PrivyProvider>
  );
}
