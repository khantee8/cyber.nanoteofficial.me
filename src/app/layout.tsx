import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Thai } from "next/font/google";
import { getLang } from "@/lib/lang";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cyber.nanoteofficial.me"),
  title: {
    default: "NaNote Cyber — threat intelligence and GRC platform",
    template: "%s — NaNote Cyber",
  },
  description:
    "Live threat intelligence from public feeds, an ISO 27001 workspace, and the next modules of a cybersecurity platform.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${GeistSans.variable} ${GeistMono.variable} ${notoThai.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
