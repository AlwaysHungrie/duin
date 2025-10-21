// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleTree} from "@openzeppelin/contracts/utils/structs/MerkleTree.sol";

contract PrivateMarket is ReentrancyGuard, Ownable {
    int256 public nftIndex;

    // merkle tree
    using MerkleTree for MerkleTree.Bytes32PushTree;
    MerkleTree.Bytes32PushTree private merkleTree;
    bytes32 public merkleRoot;

    // bid nullifiers to track price
    struct Bid {
        bytes32 bidNullifier;
        uint256 amount;
    }
    mapping(address => Bid) public bids;
    mapping(bytes32 => address) public bidNullifiers;

    // token nullifier to prevent double spending
    mapping(bytes32 => bool) public tokenNullifiers;

    // Constructor to set the admin address
    // The TEE attestation of the admin also needs to be verified.
    constructor() Ownable(msg.sender) {
        // Initialize MerkleTree with depth 16 (supports up to 2^16 = 65,536 leaves)
        // Using bytes32(0) as the zero value for empty leaves
        // Reduced depth to save gas during deployment
        merkleRoot = merkleTree.setup(16, bytes32(0));
    }

    // Events
    event NftMinted(uint256 tokenId, bytes32 commitment);
    event BidPlaced(
        address indexed bidder,
        bytes32 bidNullifier,
        uint256 amount
    );
    event BidWithdrawn(
        address indexed bidder,
        bytes32 bidNullifier,
        uint256 amount
    );

    // Mint a new nft, can only be called by the owner
    function mintNft(bytes32 ownershipNullifier) public onlyOwner {
        // Create commitment by hashing ownershipNullifier and nftIndex using inline assembly
        int256 currentNftIndex = nftIndex;
        bytes32 commitment;
        assembly {
            mstore(0x00, ownershipNullifier)
            mstore(0x20, currentNftIndex)
            commitment := keccak256(0x00, 0x40)
        }

        // Push commitment to MerkleTree and get updated root
        (, bytes32 newRoot) = merkleTree.push(commitment);
        merkleRoot = newRoot;

        // Increment nftIndex after successful push
        nftIndex++;

        /// forge-lint: disable-next-line
        emit NftMinted(uint256(currentNftIndex), commitment);
    }

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
        emit BidWithdrawn(msg.sender, bid.bidNullifier, amount);
    }

    function transferToken(
        bytes32 bidNullifier,
        bytes32 tokenNullifier,
        address receiver
    ) public nonReentrant {
        // check if bidNullifier was placed
        if (bidNullifiers[bidNullifier] == address(0)) {
            revert("Bid not found for this nullifier");
        }

        // check if tokenNullifier was already spent
        if (tokenNullifiers[tokenNullifier]) {
            revert("Token already spent");
        }

        // add the tokenNullifier to the mapping
        tokenNullifiers[tokenNullifier] = true;

        Bid memory bid = bids[bidNullifiers[bidNullifier]];
        uint256 amount = bid.amount;

        // delete bid first to prevent reentrancy
        delete bids[bidNullifiers[bidNullifier]];
        delete bidNullifiers[bidNullifier];

        // transfer amount to receiver
        if (amount > 0) {
            (bool success, ) = payable(receiver).call{value: amount}("");
            if (!success) {
                revert("Transfer failed");
            }
        }
    }
}
