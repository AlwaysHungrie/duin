import type { Metadata } from "next";
import { Reddit_Sans, Reddit_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

const redditSans = Reddit_Sans({
  variable: "--font-reddit-sans",
  subsets: ["latin"],
});

const redditMono = Reddit_Mono({
  variable: "--font-reddit-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Duin",
  description: "The anonymous NFT marketplace",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${redditSans.variable} ${redditMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
