import { PrivateMarket__factory } from "@/contractTypes/factories/PrivateMarket__factory";
import { PrivateMarket } from "@/contractTypes/PrivateMarket";

// Contract address from deployment
export const PRIVATE_MARKET_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

// Contract factory function
export const getPrivateMarketContract = (signer: any): PrivateMarket => {
  return PrivateMarket__factory.connect(PRIVATE_MARKET_ADDRESS, signer);
};

// Utility function to generate random bid nullifier
export const generateBidNullifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return "0x" + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
