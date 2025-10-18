"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NFTMetadata } from "./nftCard";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { getPrivateMarketContract, generateBidNullifier } from "@/lib/contract";
import { toast } from "sonner";

export default function PlaceBid({
  metadata,
  isDialogOpen,
  setIsDialogOpen,
}: {
  metadata: NFTMetadata;
  isDialogOpen: boolean;
  setIsDialogOpen: (isDialogOpen: boolean) => void;
}) {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [amount, setAmount] = useState("");
  const [bidNullifier, setBidNullifier] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateNullifier = () => {
    const newNullifier = generateBidNullifier();
    setBidNullifier(newNullifier);
  };

  const handlePlaceBid = async () => {
    if (!authenticated || !user?.wallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || !bidNullifier) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Get the wallet provider
      const ethereumProvider = await wallets[0].getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      
      // Get the contract instance
      const contract = getPrivateMarketContract(signer);
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);
      
      // Call the placeBid function
      const tx = await contract.placeBid(bidNullifier, { value: amountInWei });
      
      toast.success("Transaction submitted! Waiting for confirmation...");
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        toast.success("Bid placed successfully!");
        setIsDialogOpen(false);
        // Reset form
        setAmount("");
        setBidNullifier("");
      } else {
        toast.error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Error placing bid:", error);
      toast.error(error?.message || "Failed to place bid");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          Place Bid
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[50vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Place a Bid</DialogTitle>
          <DialogDescription>
            Place a private bid for this NFT. The bid amount will be locked until accepted or withdrawn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Bid Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidNullifier">Bid Nullifier</Label>
            <div className="flex gap-2">
              <Input
                id="bidNullifier"
                type="text"
                placeholder="Click Generate to create a random nullifier"
                value={bidNullifier}
                onChange={(e) => setBidNullifier(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateNullifier}
                disabled={isLoading}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              A unique identifier for your bid. Keep this private until you want to reveal it.
            </p>
          </div>

          <Button 
            onClick={handlePlaceBid}
            disabled={isLoading || !amount || !bidNullifier}
            className="w-full"
          >
            {isLoading ? "Placing Bid..." : "Place Bid"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
