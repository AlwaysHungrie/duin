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
          id: 8453,
          name: 'Base',
          network: 'base',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['https://base.llamarpc.com'],
            },
            public: {
              http: ['https://base.llamarpc.com'],
            },
          },
        },
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {  
              default: {
                http: ['https://base.llamarpc.com'],
              },
              public: {
                http: ['https://base.llamarpc.com'],
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
