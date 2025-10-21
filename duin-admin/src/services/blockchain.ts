// Blockchain service for interacting with Anvil

import { ethers } from "ethers";
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
      const factory = this.contractConfig.getContractFactory(this.wallet);
      const contract = await factory.deploy();

      // Wait for deployment to complete
      const receipt = await contract.waitForDeployment();
      console.log("receipt:", receipt);

      // Get the deployed contract address
      const contractAddress = await contract.getAddress();

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
      const tx = await contract.mintNft(ownershipNullifier, { nonce });
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
      console.error("Error minting nft:", error);
      throw new Error("Failed to mint nft");
    }
  }

  // Transfer nft
  async transferToken(
    bidNullifier: string,
    tokenNullifier: string,
    receiver: string
  ): Promise<string> {
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
      const tx = await contract.transferToken(
        bidNullifier,
        tokenNullifier,
        receiver,
        { nonce }
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
      console.log("Failed to transfer token", error);
      throw new Error("Failed to transfer token", { cause: error });
    }
  }

  // read all events BidPlaced, BidWithdrawn, till the tillTimestamp
  async updateBids() {
    let lastTimestamp = this.config.publishTimestamp;
    let lastEventTimestamp = this.config.publishTimestamp;

    const bids = this.contractConfig.getBidEvents();
    if (bids?.length && bids[bids.length - 1]?.timestamp !== undefined) {
      lastEventTimestamp = bids[bids.length - 1]!.timestamp;
    }

    try {
      const contractAddress = this.contractConfig.getContractAddress();
      if (!contractAddress) {
        throw new Error(
          "Contract not deployed. Please deploy the contract first."
        );
      }

      const factory = this.contractConfig.getContractFactory(this.wallet);
      const contract = factory.attach(contractAddress) as PrivateMarket;

      const currentBlock = await this.provider.getBlockNumber();
      const blockTimestampCache = new Map<number, number>();
      const batchSize = 2000;

      const bidEvents: BidEvent[] = [];

      let toBlock = currentBlock;
      while (toBlock >= 0) {
        const fromBlock = Math.max(0, toBlock - batchSize + 1);

        // Query BidPlaced events in this block range
        const bidPlacedEvents = await contract.queryFilter(
          contract.filters.BidPlaced(),
          fromBlock,
          toBlock
        );
        const bidWithdrawnEvents = await contract.queryFilter(
          contract.filters.BidWithdrawn(),
          fromBlock,
          toBlock
        );

        const blockBidEvents = await Promise.all(
          [...bidPlacedEvents, ...bidWithdrawnEvents].map(async (ev, index) => {
            const blockNumber = ev.blockNumber;
            let ts = blockTimestampCache.get(blockNumber);
            if (ts === undefined) {
              const block = await this.provider.getBlock(blockNumber);
              ts = block?.timestamp ?? 0;
              blockTimestampCache.set(blockNumber, ts);
            }
            if (lastEventTimestamp <= 0 || ts > lastEventTimestamp) {
              console.log("ev:", ev);
              const bidNullifier = (ev.args?.[1] as string) ?? ""; // bytes32
              const amount = ev.args?.[2] ?? ""; // uint256
              if (bidNullifier) {
                return {
                  type:
                    index < bidPlacedEvents.length
                      ? ("placed" as const)
                      : ("withdrawn" as const),
                  bidNullifier,
                  amount: amount.toString(),
                  timestamp: ts,
                };
              }
            }
          })
        );

        bidEvents.push(
          ...blockBidEvents
            .filter((event) => event !== undefined)
            .sort((a, b) => a.timestamp - b.timestamp)
        );

        // If the oldest block in this batch is at or before the cutoff, we can stop.
        if (lastEventTimestamp > 0) {
          const oldestBlock = await this.provider.getBlock(fromBlock);
          if (oldestBlock && oldestBlock.timestamp <= lastEventTimestamp) {
            break;
          }
        }

        if (fromBlock === 0) break;
        toBlock = fromBlock - 1;
      }

      this.contractConfig.updateBids(bidEvents);
    } catch (error) {
      logger.info("Error fetching commitments:", error);
      throw new Error("Failed to fetch commitments");
    }
  }

  // read all events NftMinted till the tillTimestamp
  async updateCommitments() {
    let lastTimestamp = this.config.publishTimestamp;
    let lastEventTimestamp = this.config.publishTimestamp;
    const commitments = this.contractConfig.getCommitments();
    if (
      commitments?.length &&
      commitments[commitments.length - 1]?.timestamp !== undefined
    ) {
      lastTimestamp = commitments[commitments.length - 1]!.timestamp;
    }
    try {
      const contractAddress = this.contractConfig.getContractAddress();
      if (!contractAddress) {
        throw new Error(
          "Contract not deployed. Please deploy the contract first."
        );
      }

      const factory = this.contractConfig.getContractFactory(this.wallet);
      const contract = factory.attach(contractAddress) as PrivateMarket;

      const currentBlock = await this.provider.getBlockNumber();
      const blockTimestampCache = new Map<number, number>();
      const batchSize = 2000;

      const commitments: Commitment[] = [];

      let toBlock = currentBlock;
      while (toBlock >= 0) {
        const fromBlock = Math.max(0, toBlock - batchSize + 1);

        // Query NftMinted events in this block range
        const events = await contract.queryFilter(
          contract.filters.NftMinted(),
          fromBlock,
          toBlock
        );

        for (const ev of events) {
          const blockNumber = ev.blockNumber;
          let ts = blockTimestampCache.get(blockNumber);
          if (ts === undefined) {
            const block = await this.provider.getBlock(blockNumber);
            ts = block?.timestamp ?? 0;
            blockTimestampCache.set(blockNumber, ts);
          }
          if (lastTimestamp <= 0 || ts > lastTimestamp) {
            const commitment = (ev.args?.[1] as string) ?? ""; // bytes32
            const tokenId = (ev.args?.[0].toString() ?? "") as string;
            if (commitment) {
              commitments.push({
                tokenId,
                commitmentHash: commitment,
                timestamp: ts,
              });
            }
          }
        }

        // If the oldest block in this batch is at or before the cutoff, we can stop.
        if (lastTimestamp > 0) {
          const oldestBlock = await this.provider.getBlock(fromBlock);
          if (oldestBlock && oldestBlock.timestamp <= lastTimestamp) {
            break;
          }
        }

        if (fromBlock === 0) break;
        toBlock = fromBlock - 1;
      }

      // Return commitments in chronological order
      this.contractConfig.addCommitments(
        commitments.sort((a, b) => a.timestamp - b.timestamp)
      );
    } catch (error) {
      logger.info("Error fetching commitments:", error);
      throw new Error("Failed to fetch commitments");
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
