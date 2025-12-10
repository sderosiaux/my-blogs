import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Publishing Engine",
  description: "Personal publishing engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
