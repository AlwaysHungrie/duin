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

// Gas estimation utilities
const estimateGasForPlaceBid = async (contract: PrivateMarket, bidNullifier: string, amountInWei: bigint) => {
  try {
    const gasEstimate = await contract.placeBid.estimateGas(bidNullifier, { value: amountInWei });
    // Add 10% buffer for safety
    return (gasEstimate * BigInt(110)) / BigInt(100);
  } catch (error) {
    console.warn("Failed to estimate gas for placeBid, using fallback:", error);
    return BigInt(150000); // Fallback gas limit
  }
};

const estimateGasForWithdrawBid = async (contract: PrivateMarket) => {
  try {
    const gasEstimate = await contract.withdrawBid.estimateGas();
    // Add 10% buffer for safety
    return (gasEstimate * BigInt(110)) / BigInt(100);
  } catch (error) {
    console.warn("Failed to estimate gas for withdrawBid, using fallback:", error);
    return BigInt(100000); // Fallback gas limit
  }
};

const getGasPrice = async (provider: ethers.BrowserProvider) => {
  try {
    const feeData = await provider.getFeeData();
    // Use gasPrice if available, otherwise use maxFeePerGas
    return feeData.gasPrice || feeData.maxFeePerGas || BigInt(20000000000); // 20 gwei fallback
  } catch (error) {
    console.warn("Failed to fetch gas price, using fallback:", error);
    return BigInt(20000000000); // 20 gwei fallback
  }
};

// Gas information utility
const getGasInfo = async (provider: ethers.BrowserProvider, contract: PrivateMarket, amountInWei?: bigint) => {
  const gasPrice = await getGasPrice(provider);
  
  let estimatedGas: bigint;
  let operation: string;
  
  if (amountInWei !== undefined) {
    // For placeBid operation
    const bidNullifier = "0x0000000000000000000000000000000000000000000000000000000000000000"; // Dummy for estimation
    estimatedGas = await estimateGasForPlaceBid(contract, bidNullifier, amountInWei);
    operation = "placeBid";
  } else {
    // For withdrawBid operation
    estimatedGas = await estimateGasForWithdrawBid(contract);
    operation = "withdrawBid";
  }
  
  const totalCost = gasPrice * estimatedGas;
  
  return {
    operation,
    gasPrice: gasPrice.toString(),
    gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
    estimatedGas: estimatedGas.toString(),
    estimatedCost: ethers.formatEther(totalCost),
  };
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
      // Get the wallet provider
      const ethereumProvider = await wallets[0].getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      // Get the contract instance
      const contract = getPrivateMarketContract(signer);

      // Estimate gas and get gas price
      const gasLimit = await estimateGasForWithdrawBid(contract);
      const gasPrice = await getGasPrice(provider);
      
      console.log(`Withdrawing bid - Gas limit: ${gasLimit.toString()}, Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

      const tx = await contract.withdrawBid({
        gasLimit,
        gasPrice,
      });

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

        // Estimate gas and get gas price
        const gasLimit = await estimateGasForPlaceBid(contract, bidNullifier, amountInWei);
        const gasPrice = await getGasPrice(provider);
        
        console.log(`Placing bid - Gas limit: ${gasLimit.toString()}, Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

        // Call the placeBid function
        const tx = await contract.placeBid(bidNullifier, {
          value: amountInWei,
          gasLimit,
          gasPrice,
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

  const getGasEstimate = useCallback(async (amount?: string) => {
    if (!isAuthenticated(authenticated, user)) {
      toast.error("Wallet not connected");
      return null;
    }

    try {
      // Get the wallet provider
      const ethereumProvider = await wallets[0].getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      // Get the contract instance
      const contract = getPrivateMarketContract(signer);

      // Convert amount to wei if provided
      const amountInWei = amount ? ethers.parseEther(amount) : undefined;

      // Get gas information
      const gasInfo = await getGasInfo(provider, contract, amountInWei);
      
      console.log(`Gas estimate for ${gasInfo.operation}:`, gasInfo);
      return gasInfo;
    } catch (error: any) {
      console.error("Error getting gas estimate:", error);
      toast.error(error?.message || "Failed to get gas estimate");
      return null;
    }
  }, [authenticated, user, wallets]);

  return { checkIfBidExists, withdrawBid, placeBid, getGasEstimate };
};

// Utility function to get gas estimates for UI display
export const useGasEstimation = () => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const estimatePlaceBidGas = useCallback(async (amount: string) => {
    if (!isAuthenticated(authenticated, user) || !wallets.length) {
      return null;
    }

    try {
      const ethereumProvider = await wallets[0].getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      const contract = getPrivateMarketContract(signer);

      const amountInWei = ethers.parseEther(amount);
      const bidNullifier = "0x0000000000000000000000000000000000000000000000000000000000000000"; // Dummy for estimation
      
      const gasLimit = await estimateGasForPlaceBid(contract, bidNullifier, amountInWei);
      const gasPrice = await getGasPrice(provider);
      const totalCost = gasPrice * gasLimit;

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
        estimatedCost: ethers.formatEther(totalCost),
        operation: "placeBid",
      };
    } catch (error) {
      console.error("Error estimating placeBid gas:", error);
      return null;
    }
  }, [authenticated, user, wallets]);

  const estimateWithdrawBidGas = useCallback(async () => {
    if (!isAuthenticated(authenticated, user) || !wallets.length) {
      return null;
    }

    try {
      const ethereumProvider = await wallets[0].getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      const contract = getPrivateMarketContract(signer);

      const gasLimit = await estimateGasForWithdrawBid(contract);
      const gasPrice = await getGasPrice(provider);
      const totalCost = gasPrice * gasLimit;

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
        estimatedCost: ethers.formatEther(totalCost),
        operation: "withdrawBid",
      };
    } catch (error) {
      console.error("Error estimating withdrawBid gas:", error);
      return null;
    }
  }, [authenticated, user, wallets]);

  return { estimatePlaceBidGas, estimateWithdrawBidGas };
};
