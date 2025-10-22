import assert from "assert";
import { 
  TestHelpers,
  PrivateMarket_BidPlaced
} from "generated";
const { MockDb, PrivateMarket } = TestHelpers;

describe("PrivateMarket contract BidPlaced event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for PrivateMarket contract BidPlaced event
  const event = PrivateMarket.BidPlaced.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("PrivateMarket_BidPlaced is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await PrivateMarket.BidPlaced.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualPrivateMarketBidPlaced = mockDbUpdated.entities.PrivateMarket_BidPlaced.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedPrivateMarketBidPlaced: PrivateMarket_BidPlaced = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      bidder: event.params.bidder,
      bidNullifier: event.params.bidNullifier,
      amount: event.params.amount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualPrivateMarketBidPlaced, expectedPrivateMarketBidPlaced, "Actual PrivateMarketBidPlaced should be the same as the expectedPrivateMarketBidPlaced");
  });
});
