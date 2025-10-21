"use client";
import { generateRandomMnemonic } from "@/lib/format";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

const USER_SECRET_KEY = "user_secret";

export interface Commitment {
  tokenId: string;
  commitmentHash: string;
  timestamp: number;
}

export interface Bid {
  bidNullifier: string;
  amount: string;
  timestamp: number;
}

export interface CommitmentsContextType {
  loading: boolean;
  commitments: Commitment[];
  setCommitments: (commitments: Commitment[]) => void;
  userSecret: string;
  handleUserSecretChange: (userSecret: string) => void;
  bids: Bid[];
}

export const CommitmentsContext = createContext<CommitmentsContextType>({
  loading: true,
  commitments: [],
  setCommitments: () => {},
  userSecret: "",
  handleUserSecretChange: () => {},
  bids: [],
});

export const CommitmentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(true);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [userSecret, setUserSecret] = useState<string>("");
  const [bids, setBids] = useState<Bid[]>([]);

  const fetchCommitments = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/commitments`
      );
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
  }, []);

  const fetchBids = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bids`
      );
      const data = await response.json();
      console.log(data);
      if (data?.success && data?.data?.bids) {
        setBids(data.data.bids);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bids:", error);
      toast.error("Error fetching bids");
      setLoading(false);
    }
  }, []);

  const handleUserSecretChange = useCallback((userSecret: string) => {
    setUserSecret(userSecret);
    localStorage.setItem(USER_SECRET_KEY, userSecret);
  }, []);

  const initUserSecret = useCallback(() => {
    const userSecret = localStorage.getItem(USER_SECRET_KEY);
    console.log("found", userSecret);
    if (userSecret) {
      setUserSecret(userSecret);
    } else {
      handleUserSecretChange(generateRandomMnemonic());
    }
  }, [handleUserSecretChange]);

  useEffect(() => {
    fetchCommitments();
    fetchBids();
    initUserSecret();
  }, [fetchCommitments, fetchBids, initUserSecret]);

  return (
    <CommitmentsContext.Provider
      value={{
        loading,
        commitments,
        setCommitments,
        userSecret,
        bids,
        handleUserSecretChange,
      }}
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
