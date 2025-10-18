// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {PrivateMarket} from "../src/PrivateMarket.sol";

contract PrivateMarketScript is Script {
    PrivateMarket public marketplace;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        marketplace = new PrivateMarket();

        vm.stopBroadcast();
    }
}

// forge script script/PrivateMarket.s.sol:PrivateMarketScript \
//   --rpc-url http://127.0.0.1:8545 \
//   --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
//   --broadcast