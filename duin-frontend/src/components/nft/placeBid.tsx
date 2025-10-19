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
import {
  getPrivateMarketContract,
  generateBidNullifier,
  usePrivateMarketContract,
} from "@/lib/contract";
import { toast } from "sonner";
import { CopyIcon, InfoIcon, RefreshCcwIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InfoTip from "../infoTip";
import { generateRandomMnemonic } from "@/lib/format";

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
  const { checkIfBidExists, withdrawBid } = usePrivateMarketContract();
  const [amount, setAmount] = useState("0");
  const [bidNullifier, setBidNullifier] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingBid, setHasExistingBid] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [mnemonic, setMnemonic] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");

  const currentWalletAddress = user?.wallet?.address;

  const handleGenerateNullifier = () => {
    const newNullifier = generateBidNullifier();
    setBidNullifier(newNullifier);
  };

  const checkForExistingBid = async () => {
    try {
      const exists = await checkIfBidExists();
      setHasExistingBid(exists);
    } catch (error) {
      console.error("Error checking for existing bid:", error);
      setHasExistingBid(false);
    }
  };

  const handleWithdrawBid = async () => {
    try {
      setIsWithdrawing(true);
      const success = await withdrawBid();
      if (success) {
        setHasExistingBid(false);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error withdrawing bid:", error);
    } finally {
      setIsWithdrawing(false);
    }
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

    // Check if user already has a bid
    const hasBid = await checkIfBidExists();
    if (hasBid) {
      toast.error(
        "You already have an existing bid. Please withdraw it first."
      );
      setHasExistingBid(true);
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
        setHasExistingBid(true);
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

  const handleGenerateMnemonic = () => {
    setMnemonic(generateRandomMnemonic());
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    toast.success("Mnemonic copied to clipboard");
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (open) {
          checkForExistingBid();
          setMnemonic(generateRandomMnemonic());
        }
        setIsDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          {hasExistingBid ? "Manage Bid" : "Place Bid"}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg max-h-[50vh] overflow-y-auto p-6 gap-0"
      >
        <DialogHeader className="h-0">
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>

        {hasExistingBid ? (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium">
                You already have an active bid for this NFT.
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                To place a new bid, you must first withdraw your existing bid.
              </p>
            </div>

            <Button
              onClick={handleWithdrawBid}
              disabled={isWithdrawing}
              className="w-full"
              variant="destructive"
            >
              {isWithdrawing ? "Withdrawing Bid..." : "Withdraw Bid"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                Bid Amount (ETH)
                <InfoTip text="The bid amount is publicly visible but cannot be linked back to an nft" />
              </div>
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
              <div className="flex items-center gap-2 text-sm font-medium">
                Your secret
                <InfoTip text="Keep this safe. Losing it will result in permanent loss of nft ownership." />
              </div>
              <div className="flex items-center gap-2">
                <CopyIcon
                  className="size-4 cursor-pointer"
                  onClick={handleCopyMnemonic}
                />
                <Input
                  id="mnemonic"
                  type="text"
                  value={mnemonic}
                  readOnly
                  className="bg-gray-100"
                />
                <RefreshCcwIcon
                  className="size-4 cursor-pointer"
                  onClick={handleGenerateMnemonic}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                Your wallet address
                <InfoTip text="Use a wallet address different from the one currently connected but you still own" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Input
                  id="walletAddress"
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                {walletAddress && currentWalletAddress === walletAddress ? (
                  <div className="text-xs text-red-500">
                    Cannot be same as current wallet address
                  </div>
                ) : (
                  <></>
                )}
              </div>
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
                A unique identifier for your bid. Keep this private until you
                want to reveal it.
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
        )}
      </DialogContent>
    </Dialog>
  );
}
