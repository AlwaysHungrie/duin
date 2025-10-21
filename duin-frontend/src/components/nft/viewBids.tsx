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
import { formatAmount, formatTimestamp, generateBidNullifier } from "@/lib/format";
import { Bid, useCommitments } from "@/context/commitmentsContext";

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
  const { bids } = useCommitments();
  const [bidSecretInput, setBidSecretInput] = useState<string>("");

  const [decryptedBids, setDecryptedBids] = useState<Bid[]>([]);

  const handleViewBids = useCallback(
    (bidSecrets: string[]) => {
      const bidNullifiers = new Set(decryptBids(bidSecrets, commitmentHash));
      setDecryptedBids(
        bids.filter((bid) => bidNullifiers.has(bid.bidNullifier))
      );
    },
    [bids]
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          View Bids
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[50vh] overflow-y-auto p-6 gap-0">
        <DialogHeader className="h-0">
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              Please enter all the Bid Secrets shared with you separated by a
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

        {decryptedBids.length > 0 && (
          <div className="space-y-6 mt-6">
            {decryptedBids.map((bid) => (
              <div key={bid.bidNullifier} className="flex bg-gray-100 p-2 rounded-md">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {formatAmount(bid.amount)} ETH
                </div>
                <div className="ml-1 flex items-center gap-2 text-xs text-gray-500 font-medium">
                  ({formatTimestamp(bid.timestamp)})
                </div>
                <Button className="ml-auto" variant="outline">Accept</Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
