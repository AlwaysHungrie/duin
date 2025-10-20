// Main application entry point for Duin Admin

import express from "express";
import cors from "cors";
import { loadConfig, validateConfig } from "./config/index.js";
import { BlockchainService } from "./services/blockchain.js";
import { ApiService } from "./services/api.js";
import { logger } from "./utils/logger.js";
import { ContractConfig } from "./config/contract.js";
import {
  errorMiddleware,
  loggingMiddleware,
  notFoundMiddleware,
} from "./utils/middleware.js";

const contractConfig = new ContractConfig();

// Load and validate configuration
let config: ReturnType<typeof loadConfig>;
try {
  config = loadConfig();
  validateConfig(config);
} catch (error) {
  logger.error(
    "Configuration error:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exit(1);
}

// Initialize services
const blockchainService = new BlockchainService(
  config.anvilRpcUrl,
  config.privateKey,
  config,
  contractConfig
);
const apiService = new ApiService(blockchainService, config, contractConfig);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(loggingMiddleware);
app.use(cors());

// Routes
app.get("/", (req, res) => apiService.handleHealthCheck(req, res));
app.get("/wallet", (req, res) => apiService.handleWalletInfo(req, res));
app.get("/contract", (req, res) =>
  apiService.handleGetContractAddress(req, res)
);
app.post("/mint", (req, res) => apiService.handleMintNft(req, res));
app.get("/commitments", (req, res) =>
  apiService.handleGetCommitments(req, res)
);

// Error handling middleware
app.use(errorMiddleware);
app.use(notFoundMiddleware);

// Start server
async function startServer() {
  try {
    // Test blockchain connection
    const connection = await blockchainService.testConnection();
    if (!connection.success) {
      logger.error("Failed to connect to blockchain:", connection.message);
      process.exit(1);
    }

    // Get last deployed contract
    let lastDeployedContract = await blockchainService.getLastDeployedContract(
      config.publishTimestamp
    );
    if (lastDeployedContract) {
      contractConfig.setContractAddress(lastDeployedContract);
    }

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info("Blockchain connection successful:", connection.message);
      logger.info(`🚀 Duin Admin server running on port ${config.port}`);
      logger.info(`🔗 Anvil RPC URL: ${config.anvilRpcUrl}`);
      logger.info(`👛 Wallet address: ${blockchainService.getWalletAddress()}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down server...");
  process.exit(0);
});

// Start the application
startServer();
