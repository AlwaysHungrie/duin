import type { ethers } from "ethers";
import { PrivateMarket__factory } from "../contractTypes/index.js";

export class ContractConfig {
  private factory: PrivateMarket__factory | null = null;
  constructor(public contractAddress: string | null = null) {}

  getContractAddress(): string | null {
    return this.contractAddress;
  }

  setContractAddress(address: string): void {
    if (this.contractAddress) throw new Error("Contract already set");
    this.contractAddress = address;
  }

  getContractFactory(wallet: ethers.Wallet) {
    if (this.factory) return this.factory;
    this.factory = new PrivateMarket__factory(wallet);
    return this.factory;
  }
}
