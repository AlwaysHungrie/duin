import type { ethers } from "ethers";
import { PrivateMarket__factory } from "../contractTypes/index.js";
import type { Commitment, BidEvent } from "../types/index.js";

export class ContractConfig {
  private factory: PrivateMarket__factory | null = null;
  private commitments: Commitment[] = [];
  private allBidEvents: BidEvent[] = [];
  public bids: { [key: string]: BidEvent } = {};
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

  getCommitments(): Commitment[] {
    return this.commitments;
  }

  addCommitments(commitments: Commitment[]) {
    if (!commitments.length) return;
    this.commitments = [...this.commitments, ...commitments];
  }

  getBidEvents(): BidEvent[] {
    return this.allBidEvents;
  }

  updateBids(bidEvents: BidEvent[]) {
    if (!bidEvents.length) return;
    this.allBidEvents = [...this.allBidEvents, ...bidEvents];

    bidEvents.forEach((bidEvent) => {
      if (bidEvent.type === "placed") {
        this.bids[bidEvent.bidNullifier] = bidEvent;
      } else {
        delete this.bids[bidEvent.bidNullifier];
      }
    });
  }

  getBids(): Omit<BidEvent, "type">[] {
    return Object.values(this.bids).sort((a, b) => a.timestamp - b.timestamp);
  }
}
