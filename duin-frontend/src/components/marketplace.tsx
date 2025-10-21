"use client";

import { DUMMY_NFT } from "@/content/dummyNft";
import NFTCard from "@/components/nft/nftCard";
import { useCommitments } from "@/context/commitmentsContext";
import { Loader2 } from "lucide-react";

export default function Marketplace() {
  const { commitments, loading } = useCommitments();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <div className="text-center mb-16">
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Buy, sell, and collect NFTs directly on-chain using your own wallet
        </p>
        <p className="text-base text-gray-400 max-w-xl mx-auto">
          Experience true privacy: Ownership and Txn History of each NFT remains
          completely untraceable to its holders.
        </p>
      </div>

      <h1 className="text-5xl font-light tracking-tight mb-6">
        The NFT Collection
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 gap-y-16 my-16 justify-items-center">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : (
          commitments
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((commitment) => (
              <NFTCard
                key={commitment.tokenId}
                metadata={{
                  tokenId: commitment.tokenId,
                  commitmentHash: commitment.commitmentHash,
                  chain: "anvil",
                }}
              />
            ))
        )}
      </div>

      <div className="text-center mb-16">
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          There can only be 10 total tickets at any given time.
        </p>
        <div className="flex flex-col gap-y-2 text-left mx-auto max-w-xl mt-4">
          <p className="text-base text-gray-400 max-w-xl">
             - Some of the tickets you see might have already been sold, but it's
            impossible to know for sure, or find the bids on a ticket.
          </p>
          <p className="text-base text-gray-400 max-w-xl">
            - You can place or withdraw a bid on any ticket at any time.
          </p>
          <p className="text-xs text-gray-400 max-w-x font-bold mt-4">
            PRO: Transfer an nft to yourself and keep rotating your secret to
            further protect your identity.
          </p>
        </div>
      </div>
    </div>
  );
}
