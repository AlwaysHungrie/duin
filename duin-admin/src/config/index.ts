// Configuration management for the Duin Admin application

import * as dotenv from 'dotenv';
import type { Config } from '../types/index.js';

// Load environment variables
dotenv.config();

export function loadConfig(): Config {
  const port = parseInt(process.env.PORT || '3001', 10);
  const anvilRpcUrl = process.env.ANVIL_RPC_URL || 'http://localhost:8545';
  const privateKey = process.env.PRIVATE_KEY;
  const anvilChainId = parseInt(process.env.ANVIL_CHAIN_ID || '31337', 10);
  const publishTimestamp = parseInt(process.env.PUBLISH_TIMESTAMP || '0', 10);
  const mintSecret = process.env.MINT_SECRET || '';
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const contractAddress = process.env.CONTRACT_ADDRESS || '';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY is required in environment variables');
  }

  return {
    port,
    anvilRpcUrl,
    privateKey,
    anvilChainId,
    publishTimestamp,
    mintSecret,
    corsOrigin,
    contractAddress
  };
}

export function validateConfig(config: Config): void {
  if (!config.privateKey) {
    throw new Error('PRIVATE_KEY is required');
  }
  
  if (!config.anvilRpcUrl) {
    throw new Error('ANVIL_RPC_URL is required');
  }
  
  if (isNaN(config.port) || config.port <= 0) {
    throw new Error('PORT must be a positive number');
  }
  
  if (isNaN(config.anvilChainId) || config.anvilChainId <= 0) {
    throw new Error('ANVIL_CHAIN_ID must be a positive number');
  }
  
  if (isNaN(config.publishTimestamp) || config.publishTimestamp < 0) {
    throw new Error('PUBLISH_TIMESTAMP must be a non-negative number');
  }

  if (!config.mintSecret) {
    throw new Error('MINT_SECRET is required');
  }
}
