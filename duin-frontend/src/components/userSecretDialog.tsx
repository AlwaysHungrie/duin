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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CopyIcon, KeyIcon, RefreshCcwIcon } from "lucide-react";
import { generateRandomMnemonic } from "@/lib/format";
import { useCommitments } from "@/context/commitmentsContext";

export default function UserSecretDialog() {
  const { userSecret, handleUserSecretChange } = useCommitments();
  const [allowChangeSecret, setAllowChangeSecret] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mnemonic, setMnemonic] = useState("");

  const handleGenerateMnemonic = () => {
    if (!allowChangeSecret) return;
    setMnemonic(generateRandomMnemonic());
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    toast.success("Mnemonic copied to clipboard");
  };

  useEffect(() => {
    setMnemonic(userSecret);
  }, [userSecret]);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default">
          <KeyIcon className="h-4 w-4" />
          <span className="hidden sm:block">My Secret</span>
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

        <div className="flex flex-col">
          <p className="text-2xl font-bold">Keep your secret safe and secure</p>
          <p className="text-sm mt-4">
            It is tied to the NFTs you own and the bids you have placed.
          </p>
          <p className="text-sm mt-1">
            Chaning your secret will lead to loss of ownership, bids and funds
            attached to those bids.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <CopyIcon
              className="size-4 cursor-pointer"
              onClick={handleCopyMnemonic}
            />
            <Input
              id="mnemonic"
              type="text"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              readOnly={allowChangeSecret}
              className="bg-gray-100"
              autoFocus={false}
            />
            <RefreshCcwIcon
              className={`size-4 ${
                allowChangeSecret ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              onClick={handleGenerateMnemonic}
            />
          </div>

          <p className="text-xs mt-8">
            If you understand the consequences of changing your secret, click
            the button below.
          </p>
          <Button
            onClick={() => {
              if (!mnemonic) return;
              if (!allowChangeSecret) {
                setAllowChangeSecret(true);
              } else {
                setAllowChangeSecret(false);
                handleUserSecretChange(mnemonic);
              }
            }}
            variant={allowChangeSecret ? "default" : "outline"}
            className="w-full mt-1"
          >
            {allowChangeSecret ? "Save Secret" : "Edit Secret"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
