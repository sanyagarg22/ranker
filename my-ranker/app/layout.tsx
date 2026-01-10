import type { Metadata } from "next";
import { Open_Sans, Source_Code_Pro } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ranking Tool",
  description: "Rank items by comparing them one at a time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} ${sourceCodePro.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
