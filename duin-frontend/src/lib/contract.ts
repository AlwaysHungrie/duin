import { PrivateMarket__factory } from "@/contractTypes/factories/PrivateMarket__factory";
import { PrivateMarket } from "@/contractTypes/PrivateMarket";
import { ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { generateBidNullifier } from "./format";

// Contract address from deployment
export const PRIVATE_MARKET_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// Contract factory function
export const getPrivateMarketContract = (signer: any): PrivateMarket => {
  return PrivateMarket__factory.connect(PRIVATE_MARKET_ADDRESS, signer);
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
    return (
      bid.bidNullifier !==
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
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

  const placeBid = useCallback(
    async (amount: string, bidSecret: string, commitmentHash: string) => {
      if (!authenticated || !user?.wallet) {
        toast.error("Please connect your wallet first");
        return;
      }

      if (!amount || !bidSecret) {
        toast.error("Please fill in all fields");
        return;
      }

      const bidNullifier = generateBidNullifier(bidSecret, commitmentHash);

      try {
        // Get the wallet provider
        const ethereumProvider = await wallets[0].getEthereumProvider();
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const signer = await provider.getSigner();

        // Get the contract instance
        const contract = getPrivateMarketContract(signer);

        // Convert amount to wei
        const amountInWei = ethers.parseEther(amount);

        // Call the placeBid function
        const tx = await contract.placeBid(bidNullifier, {
          value: amountInWei,
        });

        toast.success("Transaction submitted! Waiting for confirmation...");

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          toast.success("Bid placed successfully!");
          return true;
        } else {
          toast.error("Transaction failed");
          return false;
        }
      } catch (error: any) {
        console.error("Error placing bid:", error);
        toast.error(error?.message || "Failed to place bid");
        return false;
      }
    },
    [authenticated, user, wallets]
  );

  return { checkIfBidExists, withdrawBid, placeBid };
};
