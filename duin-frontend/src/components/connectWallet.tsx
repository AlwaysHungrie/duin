"use client";

import { formatAddress } from "@/lib/format";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export default function ConnectWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const address = user?.wallet?.address || user?.email?.address;

  const handleAddressClick = () => {
    if (address) {
      toast.success("Address copied to clipboard", {
        duration: 1000,
        dismissible: true,
      });
      navigator.clipboard.writeText(address);
    }
  };

  if (!ready) return null;

  if (authenticated && address) {
    return (
      <div className="flex items-center gap-4">
        <div
          className="text-sm text-gray-500 font-bold cursor-pointer hover:text-gray-700 transition-colors"
          onClick={handleAddressClick}
        >
          {formatAddress(address)}
        </div>
        <div className="flex items-center gap-2" onClick={logout}>
          <LogOut className="w-4 h-4 cursor-pointer" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand/80 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
