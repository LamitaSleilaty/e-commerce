import type { Metadata } from "next";
import { Poppins } from "next/font/google";
// @ts-ignore: allow side-effect import of global CSS
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FavoritesProvider } from "../context/FavoritesContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AssistantPanel from "../components/AssistantPanel";

// Single Poppins family for both display and body text, matching the
// reference "Anon" template's typography (project_2).
const display = Poppins({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700"] });
const body = Poppins({ subsets: ["latin"], variable: "--font-body", weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "MODA — everything, everyday",
  description: "AI-assisted shopping across fashion, beauty, home, tech and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <AssistantPanel />
            </FavoritesProvider>
          
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
