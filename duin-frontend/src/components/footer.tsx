export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <p className="text-lg font-bold">Make Web3 Cypherpunk Again</p>
          <div className="flex flex-col items-center mt-4">
            {[
              { link: "#", text: "How does Duin work? (in under 3 minutes)" },
              { link: "#", text: "Connect on Twitter" },
              { link: "#", text: "Privacy Policy (not required)" },
            ].map((item) => (
              <a href={item.link} key={item.text} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                {item.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
