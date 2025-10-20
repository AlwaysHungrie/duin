import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="flex flex-col items-center">
          <p className="text-2xl font-bold">Duin.fun</p>
          <div className="text-sm text-gray-500">
            The anonymous NFT marketplace
          </div>
          <div className="flex flex-col items-center mt-6">
            {[
              { link: "/learn", text: "Learn how Duin works (in 3 minutes)" },
              { link: "#", text: "Terms and Conditions" },
            ].map((item) => (
              <Link
                href={item.link}
                key={item.text}
                className="text-sm text-gray-900 hover:text-gray-500 transition-colors"
              >
                {item.text}
              </Link>
            ))}
          </div>

          <div className="text-sm text-gray-500 mt-12">
            Make web3 cypherpunk again.
          </div>
        </div>
      </div>
    </footer>
  );
}
