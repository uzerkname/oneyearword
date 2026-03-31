import type { Metadata } from "next";
import { serif, sans, cinzel } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bible in a Year",
  description:
    "Follow along with Fr. Mike Schmitz's Bible in a Year series with synchronized Bible text",
  other: {
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' https://img.youtube.com https://i.scdn.co data:; " +
      "frame-src https://open.spotify.com; " +
      "connect-src 'self'; " +
      "media-src 'none';",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${cinzel.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
