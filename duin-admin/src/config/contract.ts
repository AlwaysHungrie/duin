import type { ethers } from "ethers";
import { PrivateMarket__factory } from "../contractTypes/factories/PrivateMarket__factory.js";
import type { Commitment, BidEvent } from "../types/index.js";

export class ContractConfig {
  private factory: PrivateMarket__factory | null = null;
  private commitments: Commitment[] = [];
  private allBidEvents: BidEvent[] = [];
  public bids: { [key: string]: BidEvent } = {};
  private processedCommitmentIds: Set<string> = new Set();
  private processedBidIds: Set<string> = new Set();
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
    
    // Filter out already processed commitments
    const newCommitments = commitments.filter(commitment => 
      !this.processedCommitmentIds.has(commitment.id)
    );
    
    if (newCommitments.length === 0) return;
    
    // Add IDs to processed set
    newCommitments.forEach(commitment => {
      this.processedCommitmentIds.add(commitment.id);
    });
    
    this.commitments = [...this.commitments, ...newCommitments];
  }

  getBidEvents(): BidEvent[] {
    return this.allBidEvents;
  }

  updateBids(bidEvents: BidEvent[]) {
    if (!bidEvents.length) return;
    
    // Filter out already processed bid events
    const newBidEvents = bidEvents.filter(bidEvent => 
      !this.processedBidIds.has(bidEvent.id)
    );
    
    if (newBidEvents.length === 0) return;
    
    // Add IDs to processed set
    newBidEvents.forEach(bidEvent => {
      this.processedBidIds.add(bidEvent.id);
    });
    
    this.allBidEvents = [...this.allBidEvents, ...newBidEvents];

    newBidEvents.forEach((bidEvent) => {
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

  getLastProcessedCommitmentId(): string | null {
    if (this.commitments.length === 0) return null;
    return this.commitments[this.commitments.length - 1]?.id || null;
  }

  getLastProcessedBidId(): string | null {
    if (this.allBidEvents.length === 0) return null;
    return this.allBidEvents[this.allBidEvents.length - 1]?.id || null;
  }
}
