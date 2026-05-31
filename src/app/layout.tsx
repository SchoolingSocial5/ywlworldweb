import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "You're Wearing Legacy | Premium Online Clothing",
  description: "Discover our exclusive collection of premium apparel. You're Wearing Legacy is your destination for modern, timeless fashion and legacy-defining online clothing.",
  keywords: ["online clothing", "premium apparel", "fashion", "You're Wearing Legacy", "clothing brand", "legacy clothing"],
  openGraph: {
    title: "You're Wearing Legacy | Premium Online Clothing",
    description: "Discover our exclusive collection of premium apparel.",
    type: "website",
    siteName: "You're Wearing Legacy",
  }
};

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from '@/context/AuthContext';
import ThemeProvider from "@/components/ThemeProvider";
import Footer from "@/components/Footer";
import { SettingsProvider } from "@/context/SettingsContext";
import DynamicBranding from "@/components/DynamicBranding";
import CurrencyInitializer from "@/components/common/CurrencyInitializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <body className="min-h-screen font-sans transition-colors duration-300 flex flex-col">
        <SettingsProvider>
          <CurrencyInitializer />
          <DynamicBranding />
          <AuthProvider>
            <CartProvider>
              <ThemeProvider>
                <div className="flex-1 flex flex-col">
                  {children}
                </div>
                <Footer />
              </ThemeProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
