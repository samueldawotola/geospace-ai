import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import { auth0 } from "@/lib/auth0";
import { SITE_URL } from "@/lib/site";

const TITLE = "Geospace AI — See the world before it changes.";
const DESCRIPTION =
  "AI-generated, day-by-day travel itineraries grounded in real places. " +
  "Name a destination and get a researched plan with sources, packing list and budget.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Geospace AI",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Geospace AI",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Geospace AI — See the world before it changes.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#7FB3A9] text-black">
        <Nav signedIn={Boolean(session)} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
