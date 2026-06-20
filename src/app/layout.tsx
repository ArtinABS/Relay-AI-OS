import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppCopilotProvider } from "@/components/copilot/copilot-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relay AI Assistant",
  description:
    "An enterprise-grade personal AI assistant for chat, scheduling, files, memory, and workspace automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppCopilotProvider>{children}</AppCopilotProvider>
      </body>
    </html>
  );
}
