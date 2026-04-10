import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["300", "400", "500", "600", "700", "800"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "NexSeva — Intelligence Meets Compassion | AI-Powered Crisis Relief",
  description: "NexSeva connects AI intelligence with humanitarian compassion. Coordinate crisis relief operations, manage volunteers, allocate resources, and fund communities — all in one unified platform.",
  keywords: ["crisis relief", "AI platform", "humanitarian aid", "volunteer management", "disaster response"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
      </head>
      <body className={`${jakarta.variable} ${jetbrainsMono.variable} ${syne.variable} antialiased`}
        suppressHydrationWarning
        style={{ fontFamily: "var(--font-jakarta), -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
