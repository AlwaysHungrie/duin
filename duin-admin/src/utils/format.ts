import type { TransactionData } from "../types";
import { ethers } from "ethers";

export const formatTransaction = (
  transaction: any,
  timestamp: number
): TransactionData => {
  return {
    hash: transaction.hash,
    blockNumber: transaction.blockNumber,
    from: transaction.from,
    to: transaction.to,
    value: ethers.formatEther(transaction.value || 0),
    gasPrice: transaction.gasPrice
      ? ethers.formatUnits(transaction.gasPrice, "gwei")
      : "N/A",
    gasLimit: transaction.gasLimit?.toString() || "N/A",
    nonce: transaction.nonce,
    data: transaction.data || "0x",
    timestamp: timestamp,
  };
};

export const hashWords = (words: string[]): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(words.join(""))).toString();
};

export const checkWalletAddress = (address: string) => {
  // checks if its a valid wallet address
  return ethers.isAddress(address);
};

export const generateBidSecret = (
  walletAddress: string,
  userSecret: string
) => {
  if (!walletAddress || !userSecret || !checkWalletAddress(walletAddress))
    return "";
  // keccak256(concat(walletAddress, userSecret))
  const hexString = ethers.toUtf8Bytes(walletAddress + userSecret);
  return ethers.keccak256(hexString);
};

export const generateBidNullifier = (
  bidSecret: string,
  commitmentHash: string
) => {
  if (!bidSecret || !commitmentHash) throw new Error("Invalid bid secret or commitment hash");
  // keccak256(concat(bidSecret, commitmentHash))
  const hexString = ethers.toUtf8Bytes(bidSecret + commitmentHash);
  return ethers.keccak256(hexString);
};

export const generateTokenNullifier = (
  address: string,
  secretPhrase: string,
  commitmentHash: string
) => {
  if (!address || !secretPhrase || !commitmentHash) throw new Error("Invalid address or secret phrase or commitment hash");
  // keccak256(concat(bidNullifier, commitmentHash))
  const hexString = ethers.toUtf8Bytes(address + secretPhrase + commitmentHash);
  return ethers.keccak256(hexString);
};

// Solidity code
// function mintNft(bytes32 ownershipNullifier) public onlyOwner {
//   // Create commitment by hashing ownershipNullifier and nftIndex using inline assembly
//   int256 currentNftIndex = nftIndex;
//   bytes32 commitment;
//   assembly {
//       mstore(0x00, ownershipNullifier)
//       mstore(0x20, currentNftIndex)
//       commitment := keccak256(0x00, 0x40)
//   }
// }
export const generateCommitment = (
  ownershipNullifier: string,
  tokenId: string
) => {
  if (!ownershipNullifier || !tokenId) {
    throw new Error("Invalid ownershipNullifier or tokenId");
  }
  
  // Convert ownershipNullifier to bytes32 (32 bytes)
  const nullifierBytes = ethers.getBytes(ownershipNullifier);
  
  // Convert tokenId to int256 and then to 32-byte array
  const tokenIdBigInt = BigInt(tokenId);
  const tokenIdBytes = ethers.toBeHex(tokenIdBigInt, 32);
  
  // Concatenate the two 32-byte values (total 64 bytes)
  const combinedBytes = ethers.concat([nullifierBytes, ethers.getBytes(tokenIdBytes)]);
  
  // Compute keccak256 hash
  return ethers.keccak256(combinedBytes);
}