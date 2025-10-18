export default function Hero() {
  return (
    <div
      className=" my-4 aspect-video mx-auto h-48 max-w-3xl bg-cover bg-center bg-no-repeat flex items-center justify-center rounded-lg shadow-lg"
      style={{
        backgroundImage: "url('/hero-card.svg')",
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">
          Duin.fun
        </h1>
        <p className="text-white mt-2 font-semibold">The anonymous NFT marketplace</p>
      </div>
    </div>
  );
}
