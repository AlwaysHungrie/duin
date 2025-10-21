import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCallback, useState } from "react";
import { Input } from "../ui/input";
import {
  formatAmount,
  formatTimestamp,
  generateBidNullifier,
  checkWalletAddress,
} from "@/lib/format";
import { Bid, useCommitments } from "@/context/commitmentsContext";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import InfoTip from "../infoTip";

const decryptBids = (bidSecrets: string[], commitmentHash: string) => {
  return bidSecrets.map((bidSecret) => {
    return generateBidNullifier(bidSecret.trim(), commitmentHash);
  });
};

export default function ViewBids({
  commitmentHash,
  isDialogOpen,
  setIsDialogOpen,
}: {
  commitmentHash: string;
  isDialogOpen: boolean;
  setIsDialogOpen: (isDialogOpen: boolean) => void;
}) {
  const { bids, userSecret, commitments } = useCommitments();
  const { user } = usePrivy();
  const [bidSecretInput, setBidSecretInput] = useState<string>("");
  const [decryptedBids, setDecryptedBids] = useState<Bid[]>([]);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);
  const [showReceiverForm, setShowReceiverForm] = useState<string | null>(null);
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [noBidsFound, setNoBidsFound] = useState(false);

  const handleViewBids = useCallback(
    (bidSecrets: string[]) => {
      const bidNullifiers = new Set(decryptBids(bidSecrets, commitmentHash));
      setDecryptedBids(
        bids.filter((bid) => bidNullifiers.has(bid.bidNullifier))
      );
      if (decryptedBids.length === 0) {
        setNoBidsFound(true);
      } else {
        setNoBidsFound(false);
      }
    },
    [bids]
  );

  const handleAcceptBid = useCallback(
    async (bid: Bid, bidSecret: string) => {
      if (!user?.wallet?.address) {
        toast.error("Wallet not connected");
        return;
      }

      if (!receiverAddress || !checkWalletAddress(receiverAddress)) {
        toast.error("Please enter a valid receiver address");
        return;
      }

      if (receiverAddress === user.wallet.address) {
        toast.error(
          "Receiver address cannot be the same as your wallet address"
        );
        return;
      }

      // Find the commitment to get the tokenId
      const commitment = commitments.find(
        (c) => c.commitmentHash === commitmentHash
      );
      if (!commitment) {
        toast.error("Commitment not found");
        return;
      }

      setAcceptingBid(bid.bidNullifier);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transfer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              senderAddress: user.wallet.address,
              senderSecretPhrase: userSecret,
              tokenId: commitment.tokenId,
              receiverSecret: bidSecret,
              fundsReceiverAddress: receiverAddress,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          toast.success("Bid accepted successfully! NFT transferred.");
          // Remove the accepted bid from the list
          setDecryptedBids((prev) =>
            prev.filter((b) => b.bidNullifier !== bid.bidNullifier)
          );
          // Reset form
          setShowReceiverForm(null);
          setReceiverAddress("");
        } else {
          toast.error(
            data?.cause?.reason ||
              data?.cause?.message ||
              data.error ||
              "Failed to accept bid"
          );
        }
      } catch (error) {
        console.error("Error accepting bid:", error);
        toast.error("Failed to accept bid.");
      } finally {
        setAcceptingBid(null);
      }
    },
    [user, userSecret, commitments, commitmentHash, receiverAddress]
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          View Bids
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[50vh] overflow-y-auto p-6 gap-0">
        <DialogHeader>
          <DialogTitle>All bids are hidden</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              Please enter all the "Bid Secrets" shared with you separated by a
              space.
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="bidSecretInput"
                type="text"
                placeholder="Bid-Secret-1 Bid-Secret-2 Bid-Secret-3"
                value={bidSecretInput}
                onChange={(e) => setBidSecretInput(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => handleViewBids(bidSecretInput.split(" "))}
                disabled={bidSecretInput.trim() === ""}
              >
                View Bids
              </Button>
            </div>
          </div>
        </div>

        {decryptedBids.length > 0 ? (
          <div className="space-y-6 mt-6">
            {decryptedBids.map((bid) => {
              // Find the corresponding bid secret from the input
              const bidSecrets = bidSecretInput
                .split(" ")
                .filter((s) => s.trim() !== "");
              const bidSecret = bidSecrets.find(
                (secret) =>
                  generateBidNullifier(secret.trim(), commitmentHash) ===
                  bid.bidNullifier
              );

              const isShowingForm = showReceiverForm === bid.bidNullifier;

              return (
                <div key={bid.bidNullifier} className="space-y-4">
                  <div className="flex bg-gray-100 p-2 rounded-md">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {formatAmount(bid.amount)} ETH
                    </div>
                    <div className="ml-1 flex items-center gap-2 text-xs text-gray-500 font-medium">
                      ({formatTimestamp(bid.timestamp)})
                    </div>
                    <Button
                      className="ml-auto"
                      variant="outline"
                      onClick={() => {
                        if (isShowingForm) {
                          setShowReceiverForm(null);
                          setReceiverAddress("");
                        } else {
                          setShowReceiverForm(bid.bidNullifier);
                        }
                      }}
                      disabled={!bidSecret || acceptingBid === bid.bidNullifier}
                    >
                      {isShowingForm ? "Cancel" : "Accept"}
                    </Button>
                  </div>

                  {isShowingForm && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          Receive Funds To
                          <InfoTip text="Address cannot be the same as your current wallet address" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            id="receiverAddress"
                            type="text"
                            placeholder="0x..."
                            value={receiverAddress}
                            onChange={(e) => setReceiverAddress(e.target.value)}
                            disabled={acceptingBid === bid.bidNullifier}
                            className="flex-1"
                          />
                          {receiverAddress &&
                          user?.wallet?.address === receiverAddress ? (
                            <div className="text-xs text-red-500">
                              Cannot be same as your wallet address
                            </div>
                          ) : (
                            <></>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowReceiverForm(null);
                            setReceiverAddress("");
                          }}
                          variant="outline"
                          className="flex-1"
                          disabled={acceptingBid === bid.bidNullifier}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() =>
                            bidSecret && handleAcceptBid(bid, bidSecret)
                          }
                          disabled={
                            !bidSecret ||
                            acceptingBid === bid.bidNullifier ||
                            !receiverAddress ||
                            !checkWalletAddress(receiverAddress) ||
                            receiverAddress === user?.wallet?.address
                          }
                          className="flex-1"
                        >
                          {acceptingBid === bid.bidNullifier
                            ? "Accepting..."
                            : "Confirm Transfer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : noBidsFound ? (
          <div className="text-center text-gray-500 mt-6 text-sm">No bids found</div>
        ) : (
          <></>
        )}
      </DialogContent>
    </Dialog>
  );
}
