import { PrivateMarket__factory } from "@/contractTypes/factories/PrivateMarket__factory";
import { PrivateMarket } from "@/contractTypes/PrivateMarket";
import { ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Contract address from deployment
export const PRIVATE_MARKET_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// Contract factory function
export const getPrivateMarketContract = (signer: any): PrivateMarket => {
  return PrivateMarket__factory.connect(PRIVATE_MARKET_ADDRESS, signer);
};

// Utility function to generate random bid nullifier
export const generateBidNullifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return (
    "0x" +
    Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  );
};

// Utility functions for contract hook
const isAuthenticated = (authenticated: boolean, user: any) =>
  !(!authenticated || !user?.wallet);

const getContract = async (wallets: ConnectedWallet[]) => {
  const ethereumProvider = await wallets[0].getEthereumProvider();
  const provider = new ethers.BrowserProvider(ethereumProvider);
  const signer = await provider.getSigner();
  
  return PrivateMarket__factory.connect(PRIVATE_MARKET_ADDRESS, signer);
};

// usePrivateMarketContract hook
export const usePrivateMarketContract = () => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const checkIfBidExists = useCallback(async () => {
    if (!isAuthenticated(authenticated, user)) {
      toast.error("Wallet not connected");
      return false;
    }

    const address = user?.wallet?.address;
    if (!address) throw new Error("Wallet address not found");
    const contract = await getContract(wallets);
    const bid = await contract.bids(address);
    console.log(bid);
    
    // Check if bid exists (bidNullifier is not zero)
    return bid.bidNullifier !== "0x0000000000000000000000000000000000000000000000000000000000000000";
  }, [authenticated, user, wallets]);

  const withdrawBid = useCallback(async () => {
    if (!isAuthenticated(authenticated, user)) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const contract = await getContract(wallets);
      const tx = await contract.withdrawBid();
      
      toast.success("Transaction submitted! Waiting for confirmation...");
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        toast.success("Bid withdrawn successfully!");
        return true;
      } else {
        toast.error("Transaction failed");
        return false;
      }
    } catch (error: any) {
      console.error("Error withdrawing bid:", error);
      toast.error(error?.message || "Failed to withdraw bid");
      return false;
    }
  }, [authenticated, user, wallets]);

  return { checkIfBidExists, withdrawBid };
};
