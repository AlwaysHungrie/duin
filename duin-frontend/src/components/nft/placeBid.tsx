"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivateMarketContract } from "@/lib/contract";
import { toast } from "sonner";
import { CopyIcon } from "lucide-react";
import InfoTip from "../infoTip";
import { checkWalletAddress, generateBidSecret } from "@/lib/format";
import { useCommitments } from "@/context/commitmentsContext";
import Link from "next/link";

export default function PlaceBid({
  commitmentHash,
  isDialogOpen,
  setIsDialogOpen,
}: {
  commitmentHash: string;
  isDialogOpen: boolean;
  setIsDialogOpen: (isDialogOpen: boolean) => void;
}) {
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { userSecret } = useCommitments();
  const { checkIfBidExists, withdrawBid, placeBid } =
    usePrivateMarketContract();

  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingBid, setHasExistingBid] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [amount, setAmount] = useState("0");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [checkPlaceBid, setCheckPlaceBid] = useState(false);

  const currentWalletAddress = user?.wallet?.address;
  const bidSecret = useMemo(
    () => generateBidSecret(walletAddress, userSecret),
    [walletAddress, userSecret]
  );

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
      }
    } catch (error) {
      console.error("Error withdrawing bid:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handlePlaceBid = async () => {
    try {
      setIsLoading(true);
      // Check if user already has a bid
      const hasBid = await checkIfBidExists();
      if (hasBid) {
        toast.error(
          "You already have an existing bid. Please withdraw it first."
        );
        setHasExistingBid(true);
        return;
      }

      const success = await placeBid(amount, bidSecret, commitmentHash);
      if (success) {
        setTimeout(() => {
          setIsDialogOpen(false);
        }, 1000);
        setTimeout(() => {
          setHasExistingBid(true);
        }, 1200);
        // Reset form
        setAmount("");
        setWalletAddress("");
        setCheckPlaceBid(false);
      }
    } catch (error) {
      console.error("Error placing bid:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(userSecret);
    toast.success("Mnemonic copied to clipboard");
  };

  const handleCopyBidSecret = () => {
    navigator.clipboard.writeText(bidSecret);
    toast.success("Bid secret copied to clipboard");
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (open) {
          checkForExistingBid();
        }
        setIsDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full bg-brand hover:bg-brand/90" variant="default">
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
          <div className="space-y-0">
            <div className="flex items-center gap-2 font-medium">
              You are only allowed to place one active bid per address
            </div>

            <p className="text-sm text-gray-500">
              Switch to another address or Withdraw your current bid
            </p>

            <Button
              onClick={() => {
                logout();
                setIsDialogOpen(false);
              }}
              className="w-full mt-8"
              variant="secondary"
            >
              Log out
            </Button>

            <Button
              onClick={handleWithdrawBid}
              disabled={isWithdrawing}
              className="w-full mt-2"
              variant="outline"
            >
              {isWithdrawing ? "Withdrawing Bid..." : "Withdraw Bid"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                Bid Amount (ETH)
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
              <p className="text-xs text-gray-500">
                The bid amount is visible publicly but cannot be traced back to
                an address. Sharing the Bid Nullifier with anyone will reveal a
                bid was placed for this NFT.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                Your secret (hidden)
                <InfoTip text="Losing it will result in losing your NFT and bid" />
              </div>
              <div className="flex items-center gap-2">
                <CopyIcon
                  className="size-4 cursor-pointer"
                  onClick={handleCopyMnemonic}
                />
                <Input
                  id="mnemonic"
                  type="text"
                  value={userSecret}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                Your wallet address (hidden)
                <InfoTip text="Cannot be same as current wallet address" />
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
              <Label htmlFor="bidSecret">Bid Secret</Label>
              <div className="flex gap-2 items-center">
                <CopyIcon
                  className="size-4 cursor-pointer"
                  onClick={handleCopyBidSecret}
                />
                <Input
                  id="bidNullifier"
                  type="text"
                  placeholder="Wallet address is required"
                  value={bidSecret}
                  readOnly
                  className="flex-1 bg-gray-100"
                />
              </div>
              <p className="text-xs text-gray-500">
                The bid secret keeps your identity private. You need to share
                it with the current NFT owner so they can approve your
                bid.&nbsp;
                <Link
                  href={process.env.NEXT_PUBLIC_DISCORD_LINK!}
                  target="_blank"
                  className="text-blue-500 hover:text-blue-600 font-bold"
                >
                  Discord
                </Link>
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="checkPlaceBid"
                checked={checkPlaceBid}
                onChange={(e) => setCheckPlaceBid(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label
                htmlFor="checkPlaceBid"
                className="text-sm text-gray-700 cursor-pointer leading-5 font-medium gap-0"
              >
                I have saved my&nbsp;<span className="font-bold">Secret</span>
                &nbsp;and&nbsp;
                <span className="font-bold">Bid Secret</span>&nbsp;in a safe
                place.
              </Label>
            </div>

            <Button
              onClick={handlePlaceBid}
              disabled={
                isLoading ||
                !amount ||
                !bidSecret ||
                !walletAddress ||
                !checkWalletAddress(walletAddress) ||
                currentWalletAddress === walletAddress ||
                !checkPlaceBid
              }
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
