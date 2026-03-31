import { Libre_Baskerville, Inter, Cinzel_Decorative } from "next/font/google";

export const serif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const cinzel = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-cinzel",
});
