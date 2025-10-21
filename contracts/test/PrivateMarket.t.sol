// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {PrivateMarket} from "../src/PrivateMarket.sol";

contract PrivateMarketTest is Test {
    PrivateMarket public marketplace;
    address public owner;
    address public alice;
    address public bob;
    address public charlie;

    function setUp() public {
        owner = address(this);
        marketplace = new PrivateMarket();
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        
        // Fund test accounts
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
    }

    function test_PlaceBid() public {
        bytes32 nullifier = keccak256("alice_bid_1");
        uint256 bidAmount = 1 ether;
        
        vm.prank(alice);
        marketplace.placeBid{value: bidAmount}(nullifier);
        
        // Check bid was placed correctly
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, nullifier);
        assertEq(amount, bidAmount);
        
        // Check nullifier mapping
        assertEq(marketplace.bidNullifiers(nullifier), alice);
    }

    function test_PlaceBidWithZeroAmount() public {
        bytes32 nullifier = keccak256("alice_bid_1");
        
        vm.prank(alice);
        marketplace.placeBid{value: 0}(nullifier);
        
        // Check bid was placed with zero amount
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, nullifier);
        assertEq(amount, 0);
    }

    function test_PlaceBidWithZeroNullifier() public {
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(bytes32(0));
        
        // Check bid was placed with zero nullifier
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, bytes32(0));
        assertEq(amount, 1 ether);
    }

    function test_PlaceBidFailsWhenNullifierExists() public {
        bytes32 nullifier = keccak256("shared_nullifier");
        
        // Alice places bid with nullifier
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(nullifier);
        
        // Bob tries to use same nullifier
        vm.prank(bob);
        vm.expectRevert("This bidNullifier is already in use");
        marketplace.placeBid{value: 2 ether}(nullifier);
    }

    function test_PlaceBidFailsWhenAddressHasExistingBid() public {
        bytes32 nullifier1 = keccak256("alice_bid_1");
        bytes32 nullifier2 = keccak256("alice_bid_2");
        
        // Alice places first bid
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(nullifier1);
        
        // Alice tries to place second bid
        vm.prank(alice);
        vm.expectRevert("Sender already has a bid");
        marketplace.placeBid{value: 2 ether}(nullifier2);
    }

    function test_WithdrawBid() public {
        bytes32 nullifier = keccak256("alice_bid_1");
        uint256 bidAmount = 1 ether;
        
        // Get initial balance
        uint256 aliceInitialBalance = alice.balance;
        
        // Place bid
        vm.prank(alice);
        marketplace.placeBid{value: bidAmount}(nullifier);
        
        // Check balance after placing bid
        assertEq(alice.balance, aliceInitialBalance - bidAmount);
        
        // Withdraw bid
        vm.prank(alice);
        marketplace.withdrawBid();
        
        // Check bid was removed
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, bytes32(0));
        assertEq(amount, 0);
        
        // Check nullifier mapping was cleared
        assertEq(marketplace.bidNullifiers(nullifier), address(0));
        
        // Check funds were returned (balance should be back to initial)
        assertEq(alice.balance, aliceInitialBalance);
    }

    function test_WithdrawBidFailsWhenNoBid() public {
        vm.prank(alice);
        vm.expectRevert("No bid found for this address");
        marketplace.withdrawBid();
    }

    function test_MultipleBidders() public {
        bytes32 aliceNullifier = keccak256("alice_bid");
        bytes32 bobNullifier = keccak256("bob_bid");
        bytes32 charlieNullifier = keccak256("charlie_bid");
        
        // Alice places bid
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(aliceNullifier);
        
        // Bob places bid
        vm.prank(bob);
        marketplace.placeBid{value: 2 ether}(bobNullifier);
        
        // Charlie places bid
        vm.prank(charlie);
        marketplace.placeBid{value: 3 ether}(charlieNullifier);
        
        // Check individual bid amounts
        (, uint256 aliceAmount) = marketplace.bids(alice);
        (, uint256 bobAmount) = marketplace.bids(bob);
        (, uint256 charlieAmount) = marketplace.bids(charlie);
        
        assertEq(aliceAmount, 1 ether);
        assertEq(bobAmount, 2 ether);
        assertEq(charlieAmount, 3 ether);
        
        // Check nullifier mappings
        assertEq(marketplace.bidNullifiers(aliceNullifier), alice);
        assertEq(marketplace.bidNullifiers(bobNullifier), bob);
        assertEq(marketplace.bidNullifiers(charlieNullifier), charlie);
    }

    function test_WithdrawAndPlaceNewBid() public {
        bytes32 nullifier1 = keccak256("alice_bid_1");
        bytes32 nullifier2 = keccak256("alice_bid_2");
        
        // Place first bid
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(nullifier1);
        
        // Withdraw first bid
        vm.prank(alice);
        marketplace.withdrawBid();
        
        // Place new bid
        vm.prank(alice);
        marketplace.placeBid{value: 2 ether}(nullifier2);
        
        // Check new bid
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, nullifier2);
        assertEq(amount, 2 ether);
        
        // Check nullifier mapping
        assertEq(marketplace.bidNullifiers(nullifier2), alice);
    }

    function test_AcceptBid() public {
        bytes32 nullifier = keccak256("alice_bid");
        uint256 bidAmount = 1 ether;
        address currentOwner = makeAddr("currentOwner");
        
        // Alice places bid
        vm.prank(alice);
        marketplace.placeBid{value: bidAmount}(nullifier);
        
        uint256 currentOwnerBalanceBefore = currentOwner.balance;
        
        // Owner accepts bid
        marketplace.acceptBid(nullifier, currentOwner);
        
        // Check bid was removed
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, bytes32(0));
        assertEq(amount, 0);
        
        // Check nullifier mapping was cleared
        assertEq(marketplace.bidNullifiers(nullifier), address(0));
        
        // Check funds were transferred to current owner
        assertEq(currentOwner.balance, currentOwnerBalanceBefore + bidAmount);
    }

    function test_AcceptBidFailsWhenBidNotFound() public {
        bytes32 nullifier = keccak256("nonexistent_bid");
        address currentOwner = makeAddr("currentOwner");
        
        vm.expectRevert("Bid not found for this nullifier");
        marketplace.acceptBid(nullifier, currentOwner);
    }

    function test_AcceptBidFailsWhenNotOwner() public {
        bytes32 nullifier = keccak256("alice_bid");
        address currentOwner = makeAddr("currentOwner");
        
        // Alice places bid
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(nullifier);
        
        // Non-owner tries to accept bid
        vm.prank(alice);
        vm.expectRevert();
        marketplace.acceptBid(nullifier, currentOwner);
    }

    function test_AcceptBidWithZeroAmount() public {
        bytes32 nullifier = keccak256("alice_bid");
        address currentOwner = makeAddr("currentOwner");
        
        // Alice places bid with zero amount
        vm.prank(alice);
        marketplace.placeBid{value: 0}(nullifier);
        
        uint256 currentOwnerBalanceBefore = currentOwner.balance;
        
        // Owner accepts bid
        marketplace.acceptBid(nullifier, currentOwner);
        
        // Check bid was removed
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, bytes32(0));
        assertEq(amount, 0);
        
        // Check no funds were transferred
        assertEq(currentOwner.balance, currentOwnerBalanceBefore);
    }

    function test_Events() public {
        bytes32 nullifier = keccak256("alice_bid");
        uint256 bidAmount = 1 ether;
        address currentOwner = makeAddr("currentOwner");
        
        // Test BidPlaced event
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit PrivateMarket.BidPlaced(alice, nullifier, bidAmount);
        marketplace.placeBid{value: bidAmount}(nullifier);
        
        // Test BidWithdrawn event
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit PrivateMarket.BidWithdrawn(alice, nullifier, bidAmount);
        marketplace.withdrawBid();
        
        // Place bid again for acceptBid test
        vm.prank(alice);
        marketplace.placeBid{value: bidAmount}(nullifier);
        
        // Test BidAccepted event
        vm.expectEmit(true, false, false, true);
        emit PrivateMarket.BidAccepted(alice, bidAmount);
        marketplace.acceptBid(nullifier, currentOwner);
    }

    // Reentrancy protection tests
    function test_ReentrancyProtectionPlaceBid() public {
        // Create a malicious contract that tries to reenter placeBid
        MaliciousContract malicious = new MaliciousContract(address(marketplace));
        
        bytes32 nullifier = keccak256("malicious_bid");
        
        // Fund the malicious contract
        vm.deal(address(malicious), 2 ether);
        
        // This should succeed initially, but fail on reentrancy
        malicious.placeBid{value: 1 ether}(nullifier);
        
        // The malicious contract should have placed a bid
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(address(malicious));
        assertEq(storedNullifier, nullifier);
        assertEq(amount, 1 ether);
    }

    function test_ReentrancyProtectionWithdrawBid() public {
        // Create a malicious contract that tries to reenter withdrawBid
        MaliciousContract malicious = new MaliciousContract(address(marketplace));
        
        bytes32 nullifier = keccak256("malicious_bid");
        
        // Fund the malicious contract
        vm.deal(address(malicious), 2 ether);
        
        // Place bid normally first
        malicious.placeBid{value: 1 ether}(nullifier);
        
        // This should fail due to reentrancy causing transfer failure
        vm.expectRevert("Transfer failed");
        malicious.withdrawBid();
    }

    // Owner functionality tests
    function test_OwnerCanAcceptBid() public {
        bytes32 nullifier = keccak256("alice_bid");
        address currentOwner = makeAddr("currentOwner");
        
        // Alice places bid
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(nullifier);
        
        // Owner (this contract) accepts bid
        marketplace.acceptBid(nullifier, currentOwner);
        
        // Check bid was removed
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, bytes32(0));
        assertEq(amount, 0);
    }

    function test_NonOwnerCannotAcceptBid() public {
        bytes32 nullifier = keccak256("alice_bid");
        address currentOwner = makeAddr("currentOwner");
        
        // Alice places bid
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(nullifier);
        
        // Non-owner tries to accept bid
        vm.prank(alice);
        vm.expectRevert();
        marketplace.acceptBid(nullifier, currentOwner);
    }

    // Edge cases and additional tests
    function test_WithdrawBidWithZeroAmount() public {
        bytes32 nullifier = keccak256("alice_bid");
        
        // Alice places bid with zero amount
        vm.prank(alice);
        marketplace.placeBid{value: 0}(nullifier);
        
        uint256 aliceBalanceBefore = alice.balance;
        
        // Withdraw bid
        vm.prank(alice);
        marketplace.withdrawBid();
        
        // Check bid was removed
        (bytes32 storedNullifier, uint256 amount) = marketplace.bids(alice);
        assertEq(storedNullifier, bytes32(0));
        assertEq(amount, 0);
        
        // Check balance unchanged (no funds to return)
        assertEq(alice.balance, aliceBalanceBefore);
    }

    function test_AcceptBidAfterWithdraw() public {
        bytes32 nullifier = keccak256("alice_bid");
        address currentOwner = makeAddr("currentOwner");
        
        // Alice places bid
        vm.prank(alice);
        marketplace.placeBid{value: 1 ether}(nullifier);
        
        // Alice withdraws bid
        vm.prank(alice);
        marketplace.withdrawBid();
        
        // Owner tries to accept already withdrawn bid
        vm.expectRevert("Bid not found for this nullifier");
        marketplace.acceptBid(nullifier, currentOwner);
    }
}

// Malicious contract for reentrancy testing
contract MaliciousContract {
    PrivateMarket public marketplace;
    bool public reentering = false;
    bytes32 public nullifier;
    
    constructor(address _marketplace) {
        marketplace = PrivateMarket(_marketplace);
    }
    
    function placeBid(bytes32 _nullifier) external payable {
        nullifier = _nullifier;
        marketplace.placeBid{value: msg.value}(_nullifier);
    }
    
    function withdrawBid() external {
        marketplace.withdrawBid();
    }
    
    receive() external payable {
        if (reentering) {
            // Try to reenter placeBid
            marketplace.placeBid{value: 0}(keccak256("reentrant_bid"));
        } else {
            // Try to reenter withdrawBid
            reentering = true;
            marketplace.withdrawBid();
        }
    }
}
