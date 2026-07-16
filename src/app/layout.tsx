import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "TypeFlow | Premium Minimalist Typing Speed Test",
  description: "A gorgeous, minimalist typing speed test inspired by Monkeytype. Track WPM, raw speed, accuracy, and detailed charts with custom themes and mechanical sounds.",
  keywords: ["typing speed test", "monkeytype clone", "wpm calculator", "typing practice", "keyboard speed", "typeflow"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-mono`}
    >
      <body className="min-h-full flex flex-col theme-carbon bg-theme-bg text-theme-text font-mono selection:bg-theme-main selection:text-theme-bg">
        {children}
      </body>
    </html>
  );
}
