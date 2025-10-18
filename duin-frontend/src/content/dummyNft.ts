import { NFTMetadata } from "@/components/nft/nftCard";

export const DUMMY_NFT: NFTMetadata[] = [
  {
    name: "Cosmic Truth #1",
    description:
      "A mesmerizing digital artwork featuring ethereal cosmic landscapes and vibrant color palettes that transport viewers to distant galaxies.",
    image:
      "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=671",
    attributes: [
      { trait_type: "Boost", value: "0.25" },
      { trait_type: "Trait", value: "Brings good luck" },
    ],
    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
    chain: "base",
  },
];
