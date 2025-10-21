// API service for handling HTTP requests

import type { Request, Response } from "express";
import { BlockchainService } from "./blockchain.js";
import type { ApiResponse, WalletInfo, Config } from "../types/index.js";
import type { ContractConfig } from "../config/contract.js";
import { logger } from "../utils/logger.js";
import { hashWords } from "../utils/format.js";

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
        this.contractConfig.setContractAddress(newContractAddress);
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
      const currentAddress = this.blockchainService.getWalletAddress();
      const ownerSecret = this.config.ownerSecret;

      const ownershipNullifier = hashWords([currentAddress, ownerSecret]);

      console.log("ownershipNullifier:", ownershipNullifier);

      const nft = await this.blockchainService.mintNft(ownershipNullifier);
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
}
