// API service for handling HTTP requests

import type { Request, Response } from "express";
import { BlockchainService } from "./blockchain.js";
import type { ApiResponse, WalletInfo, Config } from "../types/index.js";
import type { ContractConfig } from "../config/contract.js";
import { logger } from "../utils/logger.js";
import {
  generateBidNullifier,
  generateBidSecret,
  generateCommitment,
  generateTokenNullifier,
  hashWords,
} from "../utils/format.js";

export class ApiService {
  constructor(
    private blockchainService: BlockchainService,
    private config: Config,
    private contractConfig: ContractConfig
  ) {}

  async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = this.blockchainService.getWalletAddress();
      const connection = await this.blockchainService.testConnection();

      const response: ApiResponse = {
        success: true,
        data: {
          message: "Duin Admin API is running",
          wallet: walletAddress,
          connection: connection.success ? "Connected" : "Disconnected",
          network: connection.network,
          publishTimestamp: this.config.publishTimestamp,
          contractAddress:
            this.contractConfig.getContractAddress() || "Not deployed",
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: "Health check failed",
      };
      res.status(500).json(response);
    }
  }

  async handleWalletInfo(req: Request, res: Response): Promise<void> {
    try {
      const walletInfo = await this.blockchainService.getWalletInfo();
      const response: ApiResponse<WalletInfo> = {
        success: true,
        data: walletInfo,
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: "Failed to fetch wallet info",
      };
      res.status(500).json(response);
    }
  }

  // Method get contract address or deploy if not deployed
  async handleGetContractAddress(req: Request, res: Response): Promise<void> {
    try {
      const contractAddress = this.contractConfig.getContractAddress();
      if (contractAddress) {
        res.json({
          success: true,
          created: false,
          data: contractAddress,
        });
      } else {
        const newContractAddress =
          await this.blockchainService.deployContract();
        res.json({
          success: true,
          created: true,
          data: newContractAddress,
        });
      }
    } catch (error) {
      logger.error("Failed to get contract address:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get contract address",
      });
    }
  }

  // Mint a new nft, not meant to be called publicly
  async handleMintNft(req: Request, res: Response): Promise<void> {
    try {
      const mintSecret = this.config.mintSecret;

      const nft = await this.blockchainService.mintNft(mintSecret);
      res.json({
        success: true,
        data: nft,
      });
    } catch (error) {
      logger.error("Failed to mint nft:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mint nft",
      });
    }
  }

  async handleGetCommitments(req: Request, res: Response): Promise<void> {
    try {
      await this.blockchainService.updateCommitments();
      const response: ApiResponse = {
        success: true,
        data: {
          commitments: this.contractConfig.getCommitments(),
        },
      };

      res.json(response);
    } catch (error) {
      console.log("Failed to get commitments:", error);
      const response: ApiResponse = {
        success: false,
        error: "Fetching commitments failed",
      };
      res.status(500).json(response);
    }
  }

  async handleGetBids(req: Request, res: Response): Promise<void> {
    try {
      await this.blockchainService.updateBids();
      const response: ApiResponse = {
        success: true,
        data: {
          bids: this.contractConfig.getBids(),
        },
      };
      res.json(response);
    } catch (error) {
      console.log("Failed to get bids:", error);
      const response: ApiResponse = {
        success: false,
        error: "Fetching bids failed",
      };
      res.status(500).json(response);
    }
  }

  async handleTransferToken(req: Request, res: Response): Promise<void> {
    try {
      const {
        senderAddress,
        senderSecretPhrase,
        tokenId,
        receiverSecret,
        fundsReceiverAddress,
      } = req.body;

      await this.blockchainService.updateCommitments();
      await this.blockchainService.updateBids();

      // generate commitment
      const senderSecret = generateBidSecret(senderAddress, senderSecretPhrase);
      const commitment = generateCommitment(senderSecret, tokenId);

      // check if commitment is valid
      const commitments = this.contractConfig.getCommitments();
      const validCommitment = commitments.find(
        (c) => c.commitmentHash === commitment
      );
      if (!validCommitment) {
        throw new Error("Invalid commitment");
      }

      // generate bid nullifier
      const bidNullifier = generateBidNullifier(receiverSecret, commitment);

      // check if bid nullifier is valid
      const bids = this.contractConfig.getBids();
      const validBid = bids.find((b) => b.bidNullifier === bidNullifier);
      if (!validBid) {
        throw new Error("Bid not found");
      }

      // token nullifier
      const tokenNullifier = generateTokenNullifier(
        senderAddress,
        senderSecretPhrase,
        commitment
      );

      // call transferToken function
      const transactionHash = await this.blockchainService.transferToken(
        bidNullifier,
        tokenNullifier,
        fundsReceiverAddress
      );

      // finally mint a new nft to the receiver
      await this.blockchainService.mintNft(receiverSecret);

      res.json({
        success: true,
        data: {
          transactionHash,
        },
      });
    } catch (error) {
      console.log("Failed to transfer token:", error);
      res.status(500).json({
        success: false,
        error: "Failed to transfer token",
        cause:
          error instanceof Error
            ? error.cause ?? error.message
            : "Unknown error",
      });
    } finally {
      await this.blockchainService.resetNonce();
    }
  }
}
