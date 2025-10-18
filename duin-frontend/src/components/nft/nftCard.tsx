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

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  contractAddress: string;
  chain: string;
}

export default function NFTCard({ metadata }: { metadata: NFTMetadata }) {
  const [isNFTDialogOpen, setIsNFTDialogOpen] = useState(false);
  const [isViewBidsDialogOpen, setIsViewBidsDialogOpen] = useState(false);
  const [isPlaceBidDialogOpen, setIsPlaceBidDialogOpen] = useState(false);

  return (
    <Card className="w-80 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 p-0">
      <CardHeader className="p-0">
        <div className="relative w-full h-64">
          <Image
            src={metadata.image}
            alt={metadata.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <CardTitle className="text-lg font-bold mb-2 line-clamp-1">
          {metadata.name}
        </CardTitle>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {truncateText(metadata.description, 80)}
        </p>

        <div className="flex flex-col gap-y-2 mt-4">
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
        <ViewBids
          metadata={metadata}
          isDialogOpen={isViewBidsDialogOpen}
          setIsDialogOpen={setIsViewBidsDialogOpen}
        />
        <NFTDetails
          metadata={metadata}
          isDialogOpen={isNFTDialogOpen}
          setIsDialogOpen={setIsNFTDialogOpen}
        />
      </CardFooter>
    </Card>
  );
}
