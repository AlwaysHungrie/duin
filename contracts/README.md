```bash
forge build
forge test

anvil

forge script script/PrivateMarket.s.sol:PrivateMarketScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY> \
  --broadcast
```