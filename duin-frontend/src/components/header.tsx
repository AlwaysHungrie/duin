import Image from "next/image";
import ConnectWallet from "./connectWallet";

export default function Header() {
  return (
    <header className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2">
          <Image src="/favicon.svg" alt="Duin" width={24} height={24} />
          <h1 className="text-2xl font-bold text-gray-900">Duin.fun</h1>
          <div className="ml-auto" />
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
