function MathNotation({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
      {children}
    </code>
  );
}

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-y-4 items-center">
        <p className="text-xl max-w-2xl mx-auto leading-relaxed">
          This is a brief overview of Duin.fun
        </p>
        <p className="text-base text-gray-500 max-w-xl mx-auto">
          Duin.fun is an anonymous NFT marketplace that allows you to own NFTs
          without revealing your identity or current bids on your NFT.
          <br />
          It does not create or manage any wallet, private data or secrets for
          you.
        </p>

        <div className="bg-white border-1 border-gray-200 rounded-sm p-4 w-full mt-12">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-3">
              1. Each NFT is represented by a commitment.
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  keccak256(ownerAddress || ownerSecret) = ownershipSecret
                </MathNotation>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  keccak256(ownershipSecret || tokenId) = commitment₁
                </MathNotation>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  hash(commitment₁, commitment₂, ..., commitmentₙ) = merkleRoot
                </MathNotation>
              </div>
            </div>

            <p className="mt-8">
              All the commitments together form the leaves of a Merkle tree
            </p>
            <div className="bg-gray-100 px-4 py-4 rounded-lg">
              <ul className="list-none list-inside space-y-2">
                <li>
                  {" "}
                  - Using only a valid commitment + path to the root, you can
                  prove ownership of an NFT
                </li>
                <li>
                  {" "}
                  - Revealing ownershipSecret can prove knowledge of an NFT
                  owner but does not prove ownership
                </li>
                <li>
                  {" "}
                  - Hence it is safe to share ownershipSecret{" "}
                  <span className="font-bold">anonymously</span>, your address
                  is not revealed
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white border-1 border-gray-200 rounded-sm p-4 w-full mt-12">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-3">
              2. In order to buy an NFT, you need to place a bid by depositing
              ETH.
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  keccak256(bidderAddress || bidderSecret) = bidSecret
                </MathNotation>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  keccak256(bidSecret || commitment) = bidNullifier
                </MathNotation>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  (bidNullifier, amount, addressSent) = bid
                </MathNotation>
              </div>
            </div>

            <p className="mt-8">
              Bids are stored on chain but the NFT for which the bid was placed
              is not revealed.
            </p>
            <div className="bg-gray-100 px-4 py-4 rounded-lg">
              <ul className="list-none list-inside space-y-2">
                <li>
                  {" "}
                  - If Bid txn is made from a different address, the original
                  bidderAddress is not revealed to anyone
                </li>
                <li>
                  {" "}
                  - A bid can made for any commitment, and can be withdrawn at
                  any time by the sender
                </li>
                <li>
                  {" "}
                  - One address is only allowed to have one active bid at a time
                </li>
                <li>
                  {" "}
                  - If a bid is made on a commitment that has already been
                  transferred, it cannot be accepted.
                </li>
              </ul>
            </div>

            <p className="mt-8">
              In order for the owner to accept your bid, you need to share the
              bidSecret with them.
            </p>
            <div className="bg-gray-100 px-4 py-4 rounded-lg">
              <ul className="list-none list-inside space-y-2">
                <li>
                  {" "}
                  - Bid secret does not reveal your address, but reveals the
                  amount bid on the NFT
                </li>
                <li>
                  {" "}
                  - Use a secure and anonymous channel to share the bid secret
                </li>
                <li>
                  {" "}
                  - Sharing bid secret offline is the best option, but you can
                  also use our discord server.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white border-1 border-gray-200 rounded-sm p-4 w-full mt-12">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-3">
              3. NFT transfers are done by an Admin account running inside a
              TEE.
            </h3>
            <p className="mt-8">
              If a bid is made on your NFT, you can transfer the NFT to the
              bidder and the bid amount to any address of your choice.
            </p>
            <div className="space-y-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  Private Inputs: ownerAddress, ownerSecret, tokenId, bidSecret,
                  receiverAddress
                </MathNotation>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <MathNotation>
                  Public Outputs: bidNullifier, bidSecret, tokenNullifier
                </MathNotation>
              </div>
              <div className="bg-gray-100 pl-4 pr-2 py-2 rounded-lg">
                <code className="bg-gray-100 rounded text-sm font-mono text-gray-800">
                  The admin will check the following: <br />
                  1. keccak256(ownerAddress || ownerSecret) = ownershipSecret{" "}
                  <br />
                  2. keccak256(ownerSecret || tokenId) = commitment <br />
                  3. commitment belongs to the merkle tree <br />
                  4. keccak256(bidSecret || commitment) = bidNullifier <br />
                  5. keccak256(ownerAddress || ownerSecret || commitment) =
                  tokenNullifier <br />
                  <br />
                  If tokenNullifier is not used before in a past transaction{" "}
                  <br />
                  and If bidNullifier has not been withdrawn or used before{" "}
                  <br />
                  <br />A new commitment is minted to the bidder&apos;s address, and
                  bid amount is transferred to the receiver address.
                </code>
              </div>
            </div>

            <p className="mt-8">
              The Admin runs inside a TEE and its integrity can be verified.
            </p>
            <div className="bg-gray-100 px-4 py-4 rounded-lg">
              <ul className="list-none list-inside space-y-2">
                <li>
                  {" "}
                  - If an Admin shuts down, or restarts. It can be replaced by
                  another machine running the same code. Admin does not need to
                  preserve its state.
                </li>
                <li>
                  - Admin cannot reveal the address of the new owner even if
                  compromised.
                </li>
                <li>
                  - Admin makes two different transactions so the bid amount is
                  not linked with the new commitment.
                </li>
                <li>
                  {" "}
                  - Roadmap: Allow multiple admins, check admins&apos; attestation on
                  chain and replace admin with zero-knowledge proofs.
                </li>
              </ul>
            </div>

            <p className="mt-8">
              In order for the owner to accept your bid, you need to share the
              bidSecret with them.
            </p>
            <div className="bg-gray-100 px-4 py-4 rounded-lg">
              <ul className="list-none list-inside space-y-2">
                <li>
                  {" "}
                  - Bid secret does not reveal your address, but reveals the
                  amount bid on the NFT
                </li>
                <li>
                  {" "}
                  - Use a secure and anonymous channel to share the bid secret
                </li>
                <li>
                  {" "}
                  - Sharing bid secret offline is the best option, but you can
                  also use our discord server.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white border-1 border-gray-200 rounded-sm p-4 w-full mt-12">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-3">
              4. A few things to keep in mind.
            </h3>
          </div>

          <p className="mt-8">
            Losing access to your secret means losing access to your NFT as well
            as potentially any bids you might have placed.
          </p>
          <div className="bg-gray-100 px-4 py-4 rounded-lg">
            <ul className="list-none list-inside space-y-2">
              <li>
                {" "}
                - We use a global secret for all your transactions, so keep
                changing it between trades.
              </li>
              <li>
                {" "}
                - If you share your ownershipSecret, the price of an NFT can be
                leaked.
              </li>
              <li>
                {" "}
                - However if you do not share your ownershipSecret, your bid
                will never be accepted.
              </li>
            </ul>
          </div>

          <p className="mt-8">Roadmap:</p>
          <div className="bg-gray-100 px-4 py-4 rounded-lg">
            <ul className="list-none list-inside space-y-2">
              <li>
                {" "}
                - Allow multiple admins to be used for transfers by checking
                admins&apos; attestation on chain.
              </li>
              <li>
                {" "}
                - Use indexer for tracking events so that admins do not run out
                of memory.
              </li>
              <li> - Replace Admin with zero-knowledge proofs.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
