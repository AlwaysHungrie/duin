// Type definitions for the Duin Admin application

export interface TransactionData {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data: string;
  timestamp: number;
}

export interface WalletInfo {
  address: string;
  balance: string;
  rpcUrl: string;
}

export interface TransactionResponse {
  address: string;
  transactionCount: number;
  transactions: TransactionData[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Config {
  port: number;
  anvilRpcUrl: string;
  privateKey: string;
  anvilChainId: number;
  publishTimestamp: number;
  contractAddress?: string;
  ownerSecret: string;
  corsOrigin: string;
}

export interface NftMintedEvent {
  tokenId: string;
  commitment: string;
  transactionHash: string;
}

export interface Commitment {
  tokenId: string;
  commitmentHash: string;
  timestamp: number;
}