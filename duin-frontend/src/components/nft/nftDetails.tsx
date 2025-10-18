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
          <DialogTitle className="text-xl font-bold"></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name */}
          <div className="flex flex-col gap-y-1">
            <h3 className="font-medium text-xs">Name</h3>
            <p>{metadata.name}</p>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-y-1">
            <h3 className="font-medium text-xs">Description</h3>
            <p>{metadata.description}</p>
          </div>

          {/* Attributes */}
          {metadata.attributes.map((attribute) => (
            <div key={attribute.trait_type} className="flex flex-col gap-y-1">
              <span className="text-xs font-medium">
                {attribute.trait_type}:
              </span>
              <span className="text-sm font-bold">{attribute.value}</span>
            </div>
          ))}

          {/* Image */}
          <div className="flex flex-col gap-y-1">
            <h3 className="font-medium text-xs">Image</h3>
            <p className="break-all text-sm">{metadata.image}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
