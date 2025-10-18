import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Marketplace from "@/components/marketplace";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      <Marketplace />
      <Footer />
    </div>
  );
}
