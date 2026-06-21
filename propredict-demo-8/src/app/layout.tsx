import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ProPredict 2.0", description: "Real-time sports intelligence platform" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
