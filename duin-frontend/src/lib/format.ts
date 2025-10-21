import { ethers, Mnemonic } from "ethers";

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const truncateText = (text: string, maxLength: number = 100) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export const generateRandomMnemonic = () => {
  // Generate a cryptographically secure mnemonic using ethers.js
  // This uses the full BIP39 wordlist and proper entropy
  return Mnemonic.entropyToPhrase(crypto.getRandomValues(new Uint8Array(16)));
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

export const formatAmount = (amount: string) => {
  return ethers.formatEther(amount);
};

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};