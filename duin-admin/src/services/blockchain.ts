// Blockchain service for interacting with Anvil

import { ethers } from "ethers";
import { GraphQLClient } from "graphql-request";
import type {
  WalletInfo,
  NftMintedEvent,
  Config,
  Commitment,
  BidEvent,
} from "../types/index.js";
import type { ContractConfig } from "../config/contract.js";
import type { PrivateMarket } from "../contractTypes/index.js";
import { logger } from "../utils/logger.js";

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private rpcUrl: string;
  private config: Config;
  private contractConfig: ContractConfig;
  private nonce: number | null = null;
  private gasPrice: bigint | null = null;
  private graphqlClient: GraphQLClient;

  constructor(
    rpcUrl: string,
    privateKey: string,
    config: Config,
    contractConfig: ContractConfig
  ) {
    this.rpcUrl = rpcUrl;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.config = config;
    this.contractConfig = contractConfig;
    this.graphqlClient = new GraphQLClient(config.graphEndpoint);
  }

  getWalletAddress(): string {
    return this.wallet.address;
  }

  private async getNextNonce(): Promise<number> {
    if (this.nonce === null) {
      this.nonce = await this.provider.getTransactionCount(this.wallet.address, "pending");
    } else {
      this.nonce++;
    }
    return this.nonce;
  }

  async resetNonce(): Promise<void> {
    this.nonce = null;
  }

  private async getGasPrice(): Promise<bigint> {
    if (this.gasPrice === null) {
      await this.refreshGasPrice();
    }
    return this.gasPrice!;
  }

  async refreshGasPrice(): Promise<void> {
    try {
      const feeData = await this.provider.getFeeData();
      // Use gasPrice if available, otherwise use maxFeePerGas
      this.gasPrice = feeData.gasPrice || feeData.maxFeePerGas || BigInt(20000000000); // 20 gwei fallback
      console.log(`Updated gas price: ${ethers.formatUnits(this.gasPrice, "gwei")} gwei`);
    } catch (error) {
      console.warn("Failed to fetch gas price, using fallback:", error);
      this.gasPrice = BigInt(20000000000); // 20 gwei fallback
    }
  }

  async getGasInfo(): Promise<{
    gasPrice: string;
    gasPriceGwei: string;
    estimatedDeploymentGas: string;
    estimatedDeploymentCost: string;
  }> {
    const gasPrice = await this.getGasPrice();
    const deploymentGas = await this.estimateGasForDeployment();
    const totalCost = gasPrice * deploymentGas;
    
    return {
      gasPrice: gasPrice.toString(),
      gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
      estimatedDeploymentGas: deploymentGas.toString(),
      estimatedDeploymentCost: ethers.formatEther(totalCost),
    };
  }

  private async estimateGasForDeployment(): Promise<bigint> {
    try {
      const factory = this.contractConfig.getContractFactory(this.wallet);
      const deploymentData = await factory.getDeployTransaction();
      
      if (!deploymentData || !deploymentData.data) {
        throw new Error("Failed to get deployment data");
      }

      const gasEstimate = await this.provider.estimateGas({
        data: deploymentData.data,
        from: this.wallet.address,
      });

      // Add 20% buffer for safety
      return (gasEstimate * BigInt(120)) / BigInt(100);
    } catch (error) {
      console.warn("Failed to estimate gas for deployment, using fallback:", error);
      // Fallback gas limit for contract deployment
      return BigInt(3000000);
    }
  }

  private async estimateGasForMint(ownershipNullifier: string): Promise<bigint> {
    try {
      const contractAddress = this.contractConfig.getContractAddress();
      if (!contractAddress) {
        throw new Error("Contract not deployed");
      }

      const factory = this.contractConfig.getContractFactory(this.wallet);
      const contract = factory.attach(contractAddress) as PrivateMarket;

      const gasEstimate = await contract.mintNft.estimateGas(ownershipNullifier);
      
      // Add 10% buffer for safety
      return (gasEstimate * BigInt(110)) / BigInt(100);
    } catch (error) {
      console.warn("Failed to estimate gas for mint, using fallback:", error);
      // Fallback gas limit for minting
      return BigInt(200000);
    }
  }

  private async estimateGasForTransfer(
    bidNullifier: string,
    tokenNullifier: string,
    receiver: string
  ): Promise<bigint> {
    try {
      const contractAddress = this.contractConfig.getContractAddress();
      if (!contractAddress) {
        throw new Error("Contract not deployed");
      }

      const factory = this.contractConfig.getContractFactory(this.wallet);
      const contract = factory.attach(contractAddress) as PrivateMarket;

      const gasEstimate = await contract.transferToken.estimateGas(
        bidNullifier,
        tokenNullifier,
        receiver
      );
      
      // Add 10% buffer for safety
      return (gasEstimate * BigInt(110)) / BigInt(100);
    } catch (error) {
      console.warn("Failed to estimate gas for transfer, using fallback:", error);
      // Fallback gas limit for transfer
      return BigInt(150000);
    }
  }

  async getWalletInfo(): Promise<WalletInfo> {
    const balance = await this.getWalletBalance(this.wallet.address);
    return {
      address: this.wallet.address,
      balance: `${balance} ETH`,
      rpcUrl: this.rpcUrl,
    };
  }

  async getWalletBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw new Error("Failed to fetch wallet balance");
    }
  }

  async getLastDeployedContract(
    publishTimestamp: number = 0
  ): Promise<string | null> {
    const walletAddress = this.getWalletAddress();
    try {
      const currentBlock = await this.provider.getBlockNumber();

      for (let blockNumber = currentBlock; blockNumber >= 0; blockNumber--) {
        try {
          const block = await this.provider.getBlock(blockNumber, true);

          if (block && block.transactions) {
            // If we've reached the publish timestamp, stop scanning
            if (publishTimestamp >= 0 && block.timestamp <= publishTimestamp) {
              console.log(
                `Reached publish timestamp ${publishTimestamp} at block ${blockNumber}`
              );
              break;
            }

            // Fetch actual transaction objects for each hash
            const transactions = (
              await Promise.all(
                block.transactions.map(async (txHash: string) => {
                  try {
                    return await this.provider.getTransaction(txHash);
                  } catch (error) {
                    console.warn(
                      `Error fetching transaction ${txHash}:`,
                      error
                    );
                    return null;
                  }
                })
              )
            )
              .filter((tx) => tx !== null)
              .filter(
                (tx: any) =>
                  typeof tx === "object" &&
                  "from" in tx &&
                  tx.from && // sent from our wallet
                  tx.from.toLowerCase() === walletAddress.toLowerCase() &&
                  !tx.to && // to null
                  tx.data.length > 10 // data length > 10
              );

            for (const tx of transactions) {
              const receipt = await this.provider.getTransactionReceipt(
                tx.hash
              );
              if (receipt && receipt.status === 1 && receipt.contractAddress) {
                return receipt.contractAddress;
              }
            }
          }
        } catch (blockError) {
          console.warn(`Error fetching block ${blockNumber}:`, blockError);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error("Failed to fetch transactions");
    }
  }

  // deploy contract
  async deployContract(): Promise<string> {
    try {
      console.log("Estimating gas for contract deployment...");
      const gasInfo = await this.getGasInfo();
      
      console.log(`Estimated gas limit: ${gasInfo.estimatedDeploymentGas}`);
      console.log(`Gas price: ${gasInfo.gasPriceGwei} gwei`);
      console.log(`Estimated deployment cost: ${gasInfo.estimatedDeploymentCost} ETH`);
      
      const gasLimit = BigInt(gasInfo.estimatedDeploymentGas);
      const gasPrice = BigInt(gasInfo.gasPrice);
      
      const factory = this.contractConfig.getContractFactory(this.wallet);
      const contract = await factory.deploy({
        gasLimit,
        gasPrice,
      }); 

      // Wait for deployment to complete
      await contract.waitForDeployment();
      
      // Get the deployed contract address
      const contractAddress = await contract.getAddress();
      this.contractConfig.setContractAddress(contractAddress);

      // mint 10 nfts with proper nonce management
      for (let i = 0; i < 10; i++) {
        console.log(`Minting nft ${i + 1}`);
        try {
          await this.mintNft(this.config.mintSecret);
          // Add a small delay to ensure transaction is processed
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to mint NFT ${i + 1}:`, error);
          // Reset nonce on error to get fresh nonce
          this.resetNonce();
          throw error;
        }
      }
      this.resetNonce();

      return contractAddress;
    } catch (error) {
      console.error("Error deploying contract:", error);
      throw new Error(
        `Failed to deploy contract: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // mint a new nft
  async mintNft(ownershipNullifier: string): Promise<NftMintedEvent> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const contractAddress = this.contractConfig.getContractAddress();
        if (!contractAddress) {
          throw new Error(
            "Contract not deployed. Please deploy the contract first."
          );
        }

        const factory = this.contractConfig.getContractFactory(this.wallet);
        const contract = factory.attach(contractAddress) as PrivateMarket;

        const nonce = await this.getNextNonce();
        const gasLimit = await this.estimateGasForMint(ownershipNullifier);
        const gasPrice = await this.getGasPrice();
        
        console.log(`Minting NFT - Gas limit: ${gasLimit.toString()}, Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
        
        const tx = await contract.mintNft(ownershipNullifier, { 
          nonce,
          gasLimit,
          gasPrice,
        });
        const receipt = await tx.wait();
        console.log("receipt:", receipt);

        // Extract the NftMinted event from the receipt
        const nftMintedEvent = receipt?.logs?.find((log) => {
          try {
            const parsedLog = contract.interface.parseLog(log);
            return parsedLog?.name === "NftMinted";
          } catch {
            return false;
          }
        });

        if (!nftMintedEvent) {
          throw new Error("NftMinted event not found in transaction receipt");
        }

        const parsedEvent = contract.interface.parseLog(nftMintedEvent);
        if (!parsedEvent) {
          throw new Error("Failed to parse NftMinted event");
        }

        const [tokenId, commitment] = parsedEvent.args;

        return {
          tokenId: tokenId.toString(),
          commitment: commitment,
          transactionHash: receipt?.hash || tx.hash,
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Error minting nft (attempt ${attempt + 1}):`, error);
        
        // If it's a nonce error, reset nonce and retry
        if (error instanceof Error && error.message.includes("nonce")) {
          console.log("Nonce error detected, resetting nonce and retrying...");
          this.resetNonce();
          // Add a small delay before retry
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
        
        // For other errors, don't retry
        break;
      }
    }

    throw new Error(`Failed to mint nft after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
  }

  // Transfer nft
  async transferToken(
    bidNullifier: string,
    tokenNullifier: string,
    receiver: string
  ): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const contractAddress = this.contractConfig.getContractAddress();
        if (!contractAddress) {
          throw new Error(
            "Contract not deployed. Please deploy the contract first."
          );
        }

        const factory = this.contractConfig.getContractFactory(this.wallet);
        const contract = factory.attach(contractAddress) as PrivateMarket;

        const nonce = await this.getNextNonce();
        const gasLimit = await this.estimateGasForTransfer(bidNullifier, tokenNullifier, receiver);
        const gasPrice = await this.getGasPrice();
        
        console.log(`Transferring token - Gas limit: ${gasLimit.toString()}, Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
        
        const tx = await contract.transferToken(
          bidNullifier,
          tokenNullifier,
          receiver,
          { 
            nonce,
            gasLimit,
            gasPrice,
          }
        );
        const receipt = await tx.wait();

        if (!receipt?.hash) {
          throw new Error("Transaction failed");
        }

        if (receipt.status !== 1) {
          throw new Error("Transaction reverted");
        }

        console.log("receipt:", receipt, receipt.status);
        return receipt?.hash;
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to transfer token (attempt ${attempt + 1}):`, error);
        
        // If it's a nonce error, reset nonce and retry
        if (error instanceof Error && error.message.includes("nonce")) {
          console.log("Nonce error detected, resetting nonce and retrying...");
          this.resetNonce();
          // Add a small delay before retry
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
        
        // For other errors, don't retry
        break;
      }
    }

    throw new Error(`Failed to transfer token after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
  }

  // read all events BidPlaced, BidWithdrawn using HyperIndex GraphQL
  async updateBids() {
    try {
      // Get the last processed bid ID for pagination
      const lastProcessedId = this.contractConfig.getLastProcessedBidId();
      
      // GraphQL query to fetch both BidPlaced and BidWithdrawn events
      // Order by ID to ensure chronological order (ID format: chainId_blockNumber_logIndex)
      const query = `
        query GetBidEvents($orderBy: [PrivateMarket_BidPlaced_order_by!], $orderByWithdrawn: [PrivateMarket_BidWithdrawn_order_by!]) {
          bidPlaced: PrivateMarket_BidPlaced(order_by: $orderBy) {
            id
            bidNullifier
            amount
            bidder
          }
          bidWithdrawn: PrivateMarket_BidWithdrawn(order_by: $orderByWithdrawn) {
            id
            bidNullifier
            amount
            bidder
          }
        }
      `;

      const variables = {
        orderBy: [{ id: "asc" }],
        orderByWithdrawn: [{ id: "asc" }]
      };

      const response = await this.graphqlClient.request(query, variables);
      
      const bidEvents: BidEvent[] = [];

      // Process BidPlaced events
      if (response.bidPlaced) {
        response.bidPlaced.forEach((event: any) => {
          // Skip events that have already been processed
          if (lastProcessedId && event.id <= lastProcessedId) return;
          
          bidEvents.push({
            id: event.id,
            type: "placed",
            bidNullifier: event.bidNullifier,
            amount: event.amount,
            timestamp: Date.now(), // Using current time since HyperIndex doesn't provide timestamp
          });
        });
      }

      // Process BidWithdrawn events
      if (response.bidWithdrawn) {
        response.bidWithdrawn.forEach((event: any) => {
          // Skip events that have already been processed
          if (lastProcessedId && event.id <= lastProcessedId) return;
          
          bidEvents.push({
            id: event.id,
            type: "withdrawn",
            bidNullifier: event.bidNullifier,
            amount: event.amount,
            timestamp: Date.now(), // Using current time since HyperIndex doesn't provide timestamp
          });
        });
      }

      // Sort by ID to maintain chronological order
      bidEvents.sort((a, b) => a.id.localeCompare(b.id));

      this.contractConfig.updateBids(bidEvents);
    } catch (error) {
      logger.info("Error fetching bids from HyperIndex:", error);
      throw new Error("Failed to fetch bids from indexer");
    }
  }

  // read all events NftMinted using HyperIndex GraphQL
  async updateCommitments() {
    try {
      // Get the last processed commitment ID for pagination
      const lastProcessedId = this.contractConfig.getLastProcessedCommitmentId();
      
      // GraphQL query to fetch NftMinted events
      // Order by ID to ensure chronological order (ID format: chainId_blockNumber_logIndex)
      const query = `
        query GetCommitments($orderBy: [PrivateMarket_NftMinted_order_by!]) {
          PrivateMarket_NftMinted(order_by: $orderBy) {
            id
            tokenId
            commitment
          }
        }
      `;

      const variables = {
        orderBy: [{ id: "asc" }]
      };

      const response = await this.graphqlClient.request(query, variables);
      
      const commitments: Commitment[] = [];

      // Process NftMinted events
      if (response.PrivateMarket_NftMinted) {
        response.PrivateMarket_NftMinted.forEach((event: any) => {
          // Skip events that have already been processed
          if (lastProcessedId && event.id <= lastProcessedId) return;
          
          commitments.push({
            id: event.id,
            tokenId: event.tokenId,
            commitmentHash: event.commitment,
            timestamp: Date.now(), // Using current time since HyperIndex doesn't provide timestamp
          });
        });
      }

      // Sort by ID to maintain chronological order
      commitments.sort((a, b) => a.id.localeCompare(b.id));

      this.contractConfig.addCommitments(commitments);
    } catch (error) {
      logger.info("Error fetching commitments from HyperIndex:", error);
      throw new Error("Failed to fetch commitments from indexer");
    }
  }

  async testConnection(): Promise<{
    success: boolean;
    message: string;
    network?: any;
    balance?: string;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const balance = await this.getWalletBalance(this.wallet.address);

      return {
        success: true,
        message: `Connected to ${network.name} (Chain ID: ${network.chainId})`,
        network: {
          name: network.name,
          chainId: network.chainId.toString(),
        },
        balance,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}
