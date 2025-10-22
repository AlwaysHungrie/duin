/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  PrivateMarket,
  PrivateMarket_BidPlaced,
  PrivateMarket_BidWithdrawn,
  PrivateMarket_NftMinted,
} from "generated";

PrivateMarket.BidPlaced.handler(async ({ event, context }) => {
  const entity: PrivateMarket_BidPlaced = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    bidder: event.params.bidder,
    bidNullifier: event.params.bidNullifier,
    amount: event.params.amount,
  };

  context.PrivateMarket_BidPlaced.set(entity);
});

PrivateMarket.BidWithdrawn.handler(async ({ event, context }) => {
  const entity: PrivateMarket_BidWithdrawn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    bidder: event.params.bidder,
    bidNullifier: event.params.bidNullifier,
    amount: event.params.amount,
  };

  context.PrivateMarket_BidWithdrawn.set(entity);
});

PrivateMarket.NftMinted.handler(async ({ event, context }) => {
  const entity: PrivateMarket_NftMinted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    tokenId: event.params.tokenId,
    commitment: event.params.commitment,
  };

  context.PrivateMarket_NftMinted.set(entity);
});
