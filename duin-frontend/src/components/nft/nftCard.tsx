"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { truncateText } from "@/lib/format";
import NFTDetails from "./nftDetails";
import ViewBids from "./viewBids";
import PlaceBid from "./placeBid";
import { Copy } from "lucide-react";

export interface NFTMetadata {
  tokenId: string;
  commitmentHash: string;
  chain: string;
}

export default function NFTCard({ metadata }: { metadata: NFTMetadata }) {
  const [isNFTDialogOpen, setIsNFTDialogOpen] = useState(false);
  const [isViewBidsDialogOpen, setIsViewBidsDialogOpen] = useState(false);
  const [isPlaceBidDialogOpen, setIsPlaceBidDialogOpen] = useState(false);

  return (
    <Card className="w-80 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 p-0">
      <CardHeader className="p-0">
        <div className="relative w-full h-64 bg-gray-100 flex items-center justify-center">NFT #{metadata.tokenId}</div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <CardTitle className="text-lg font-bold mb-2 line-clamp-1">
          #{metadata.tokenId}
        </CardTitle>

        <div className="flex flex-col gap-y-2 mt-4">
          <div className="flex text-xs">
            <span className="text-gray-500">Commitment Hash:</span>
            <span className="ml-auto font-medium">{truncateText(metadata.commitmentHash, 10)}</span>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => navigator.clipboard.writeText(metadata.commitmentHash)}
              title="Copy Commitment Hash"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Owner:</span>
            <span className="font-medium">Hidden</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Current Bids:</span>
            <span className="font-medium">Hidden</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Txn History:</span>
            <span className="font-medium">Unavailable</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-y-2">
        <PlaceBid
          metadata={metadata}
          isDialogOpen={isPlaceBidDialogOpen}
          setIsDialogOpen={setIsPlaceBidDialogOpen}
        />
        {/* <ViewBids
          metadata={metadata}
          isDialogOpen={isViewBidsDialogOpen}
          setIsDialogOpen={setIsViewBidsDialogOpen}
        /> */}
        <NFTDetails
          metadata={metadata}
          isDialogOpen={isNFTDialogOpen}
          setIsDialogOpen={setIsNFTDialogOpen}
        />
      </CardFooter>
    </Card>
  );
}
