import { DUMMY_NFT } from "@/content/dummyNft";
import NFTCard from "@/components/nft/nftCard";

export default function Marketplace() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <div className="text-center mb-16">
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Buy, sell, and collect NFTs directly on-chain using your own wallet
        </p>
        <p className="text-base text-gray-400 max-w-xl mx-auto">
          Experience true privacy, ownership and transaction history of each NFT
          remain completely untraceable to its holders.
        </p>
      </div>

      <h1 className="text-5xl font-light tracking-tight mb-6">
        The NFT Collection
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 gap-y-16 my-16 justify-items-center">
        {DUMMY_NFT.map((nft) => (
          <NFTCard key={nft.contractAddress} metadata={nft} />
        ))}
      </div>
    </div>
  );
}
