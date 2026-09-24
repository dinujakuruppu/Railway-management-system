import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "SriRail | Your journey, made simple",
    template: "%s | SriRail",
  },
  description:
    "SriRail Smart Ticketing — a frontend demonstration for planning railway journeys across Sri Lanka.",
  icons: { icon: "/favicon.svg" },
};
// Dates in the demo are relative to today's date in Sri Lanka.
export const dynamic = "force-dynamic";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="app-content">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
