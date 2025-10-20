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
