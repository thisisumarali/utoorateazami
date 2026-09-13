import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Utoor Ateazami | Pure Artisanal Attars & Luxury Fragrances",
  description: "Explore Utoor Ateazami's exclusive collection of pure non-alcoholic concentrated perfume oils, authentic Hindi ouds, and signature gift sets.",
  keywords: "utoorateazami, attar, pure perfume oil, oud, pakistani perfumes, non-alcoholic fragrance, oriental attar",
  openGraph: {
    title: "Utoor Ateazami | Artisanal Attar & Luxury Fragrance",
    description: "Timeless Collections For Essence Enthusiasts. 100% Pure Non-Alcoholic Attars.",
    url: "https://utoorateazami.com",
    siteName: "Utoor Ateazami",
    images: [
      {
        url: "https://utoorateazami.com/wp-content/uploads/2025/01/5.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col bg-white text-stone-900 antialiased selection:bg-[#f3dfc6] selection:text-[#744512]">
        {children}
      </body>
    </html>
  );
}
