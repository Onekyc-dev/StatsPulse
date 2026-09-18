import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: { default: "StatPulse", template: "%s | StatPulse" },
  description: "StatPulse explains what is driving a match: form, availability, stability and model outlook."
};

export const viewport: Viewport = {
  themeColor: "#050b0d",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans">
        <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
          <Sidebar />
          <div className="min-w-0">
            <TopBar />
            <div className="flex items-center justify-center gap-2 border-b border-draw/20 bg-draw/[0.07] px-4 py-1.5 text-[11.5px] text-draw">
              <span className="h-1.5 w-1.5 rounded-full bg-draw" />
              Demo data. Real fixtures and predictions connect in the next build.
            </div>
            <main className="pb-28 lg:pb-12">{children}</main>
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
