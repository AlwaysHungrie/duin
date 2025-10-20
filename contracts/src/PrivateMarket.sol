// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PrivateMarket is ReentrancyGuard, Ownable {
    int256 public nftIndex;
    // merkle tree
    bytes32[] public commitments;
    bytes32 public merkleRoot;
    
    struct Bid {
        bytes32 bidNullifier;
        uint256 amount;
    }
    mapping(address => Bid) public bids;
    mapping(bytes32 => address) public bidNullifiers;

    // Constructor to set the admin address
    // The TEE attestation of the admin also needs to be verified.
    constructor() Ownable(msg.sender) {}

    // Events
    event BidPlaced(
        address indexed bidder,
        bytes32 bidNullifier,
        uint256 amount
    );
    event BidWithdrawn(address indexed bidder, uint256 amount);
    event BidAccepted(address indexed bidder, uint256 amount);

    function placeBid(bytes32 bidNullifier) public payable nonReentrant {
        // check if bidNullifier was already placed
        if (bidNullifiers[bidNullifier] != address(0)) {
            revert("This bidNullifier is already in use");
        }

        // check if sender already has a bid
        if (bids[msg.sender].bidNullifier != bytes32(0)) {
            revert("Sender already has a bid");
        }

        bids[msg.sender] = Bid({bidNullifier: bidNullifier, amount: msg.value});
        bidNullifiers[bidNullifier] = msg.sender;
        emit BidPlaced(msg.sender, bidNullifier, msg.value);
    }

    function withdrawBid() public nonReentrant {
        // check if sender has a bid
        if (bids[msg.sender].bidNullifier == bytes32(0)) {
            revert("No bid found for this address");
        }

        Bid memory bid = bids[msg.sender];
        uint256 amount = bid.amount;

        // delete bid first to prevent reentrancy
        delete bids[msg.sender];
        delete bidNullifiers[bid.bidNullifier];

        // transfer amount to msg.sender
        if (amount > 0) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            if (!success) {
                revert("Transfer failed");
            }
        }
        emit BidWithdrawn(msg.sender, amount);
    }

    function acceptBid(
        bytes32 bidNullifier,
        address currentOwner
    ) public onlyOwner {
        // check if bidNullifier was placed
        if (bidNullifiers[bidNullifier] == address(0)) {
            revert("Bid not found for this nullifier");
        }

        address bidder = bidNullifiers[bidNullifier];
        Bid memory bid = bids[bidNullifiers[bidNullifier]];
        delete bids[bidder];
        delete bidNullifiers[bidNullifier];

        // transfer amount to currentOwner
        (bool success, ) = payable(currentOwner).call{value: bid.amount}("");
        if (!success) {
            revert("Transfer failed");
        }

        emit BidAccepted(bidder, bid.amount);
    }
}
