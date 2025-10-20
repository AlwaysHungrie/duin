import { cn } from "@/lib/utils";
import { PersonStanding } from "lucide-react";

function HighlightedText({
  bold = false,
  children,
}: {
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "bg-blue-200 text-sm px-1 rounded-sm font-mono",
        bold && "font-bold",
        !bold && "font-normal"
      )}
    >
      {children}
    </span>
  );
}

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white flex flex-col max-w-5xl mx-auto p-10 space-y-12">
        <div className="flex flex-col space-y-4">
          <div>1. Each NFT is represented by a token number.</div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-sm font-medium bg-gray-100 aspect-square p-4"
              >
                #{index + 1}
              </div>
            ))}
            <div>...</div>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div>
            2. The ownership of each of these tokens is represented by a
            commitment.
          </div>
          <div className="flex flex-col space-y-2 bg-gray-100 p-4 rounded-sm ml-4">
            <div className="flex items-center">
              <HighlightedText bold>Ownership nullifier</HighlightedText>
              &nbsp;= hash(
              <HighlightedText>0xaa...</HighlightedText>,
              <HighlightedText>"User generated secret"</HighlightedText>)
            </div>
            <div className="flex items-center">
              <HighlightedText bold>Commitment</HighlightedText>
              &nbsp;= hash(
              <HighlightedText bold>Ownership nullifier</HighlightedText>,
              <HighlightedText>"Token number #1"</HighlightedText>)
            </div>
          </div>
          <div className="text-sm">
            Even if ownership nullifier is shared with someone else, the address is not revealed.
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div>
            3. All the commitments form a Merkle tree with a single root.
          </div>
          <div className="flex flex-col space-y-2 bg-gray-100 p-4 rounded-sm ml-4">
            <div className="flex items-center">
              <HighlightedText bold>Merkle root</HighlightedText>
              &nbsp;= MerkleTree(
              <HighlightedText>Commitment 1</HighlightedText>,
              <HighlightedText>Commitment 2</HighlightedText>,
              <HighlightedText>Commitment 3</HighlightedText>,
              <HighlightedText>Commitment 4</HighlightedText>,
              <HighlightedText>Commitment 5</HighlightedText>)
            </div>
          </div>
          <div className="text-sm">
            Revealing ownership nullifier and a path to the root proves ownership of any one token from the list of all issued tokens.
          </div>
        </div>
      </div>
    </div>
  );
}
