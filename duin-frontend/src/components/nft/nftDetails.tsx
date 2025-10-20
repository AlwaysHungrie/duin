import { Button } from "@/components/ui/button";
import { NFTMetadata } from "./nftCard";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function NFTDetails({
  metadata,
  isDialogOpen,
  setIsDialogOpen,
}: {
  metadata: NFTMetadata;
  isDialogOpen: boolean;
  setIsDialogOpen: (isDialogOpen: boolean) => void;
}) {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="ghost">
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[50vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">NFT #{metadata.tokenId}</DialogTitle>
          <DialogDescription>Additional on-chain details for this NFT</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-y-1">
            <h3 className="font-medium text-xs">Token ID</h3>
            <p className="text-sm font-medium">{metadata.tokenId}</p>
          </div>

          <div className="flex flex-col gap-y-1">
            <h3 className="font-medium text-xs">Commitment Hash</h3>
            <p className="break-all text-sm">{metadata.commitmentHash}</p>
          </div>

          <div className="flex flex-col gap-y-1">
            <h3 className="font-medium text-xs">Chain</h3>
            <p className="text-sm">{metadata.chain}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
