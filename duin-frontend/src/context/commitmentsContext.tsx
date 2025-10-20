"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface Commitment {
  tokenId: string;
  commitmentHash: string;
  timestamp: number;
}

export interface CommitmentsContextType {
  loading: boolean;
  commitments: Commitment[];
  setCommitments: (commitments: Commitment[]) => void;
}

export const CommitmentsContext = createContext<CommitmentsContextType>({
  loading: true,
  commitments: [],
  setCommitments: () => {},
});

export const CommitmentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(true);
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  const fetchCommitments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/commitments`);
      const data = await response.json();
      console.log(data);
      if (data?.success && data?.data?.commitments) {
        setCommitments(data.data.commitments);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching commitments:", error);
      toast.error("Error fetching commitments");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, []);
  
  return (
    <CommitmentsContext.Provider
      value={{ loading, commitments, setCommitments }}
    >
      {children}
    </CommitmentsContext.Provider>
  );
};

export const useCommitments = () => {
  const context = useContext(CommitmentsContext);
  if (!context) {
    throw new Error("useCommitments must be used within a CommitmentsProvider");
  }
  return context;
};
