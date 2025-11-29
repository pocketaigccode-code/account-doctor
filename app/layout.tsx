import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ['400', '700', '900'],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AccountDoctor - Instagram Account Analysis Tool",
  description: "AI-powered Instagram account diagnosis and optimization tool for businesses and creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${merriweather.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
