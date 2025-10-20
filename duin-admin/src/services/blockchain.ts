// Blockchain service for interacting with Anvil

import { ethers } from "ethers";
import type { WalletInfo, NftMintedEvent } from "../types/index.js";
import type { ContractConfig } from "../config/contract.js";
import type { PrivateMarket } from "../contractTypes/index.js";

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private rpcUrl: string;
  private contractConfig: ContractConfig;

  constructor(
    rpcUrl: string,
    privateKey: string,
    contractConfig: ContractConfig
  ) {
    this.rpcUrl = rpcUrl;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contractConfig = contractConfig;
  }

  getWalletAddress(): string {
    return this.wallet.address;
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

      const tx = await contract.mintNft(ownershipNullifier);
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
