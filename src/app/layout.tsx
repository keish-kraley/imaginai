import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const outfitSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ImaginAI — crie com a Astra",
    template: "%s | ImaginAI",
  },
  description:
    "Descreva uma ideia de produto para casa ou construção e veja como ela ganha forma com a IA da Astra.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${outfitSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
