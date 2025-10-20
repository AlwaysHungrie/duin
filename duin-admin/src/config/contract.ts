export class ContractConfig {
  constructor(public contractAddress: string | null = null) {}

  getContractAddress(): string | null {
    return this.contractAddress;
  }

  setContractAddress(address: string): void {
    if (this.contractAddress) throw new Error("Contract already set");
    this.contractAddress = address;
  }
}
