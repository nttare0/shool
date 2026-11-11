import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { InstallProvider } from "@/components/install-app";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shool-nttare.vercel.app"),
  title: {
    default: "Student OS — a calmer way to run your school life",
    template: "%s · Student OS",
  },
  description:
    "Tasks, notes, flashcards, a focus timer and a whiteboard in one quiet workspace. Rebuilt with shadcn/ui and bklit charts.",
  applicationName: "Student OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Student OS", statusBarStyle: "default" },
  openGraph: {
    title: "Student OS",
    description:
      "One calm workspace for tasks, notes, flashcards, focus sessions and sketching.",
    type: "website",
    url: "/",
    siteName: "Student OS",
    images: [{ url: "/social-preview.jpg", width: 1200, height: 630, alt: "Student OS — a calmer way to study" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student OS — a calmer way to study",
    description: "Tasks, notes, flashcards, focus sessions and a whiteboard in one calm workspace.",
    images: ["/social-preview.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1b22" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <ClerkProvider>
        <ThemeProvider>
          <InstallProvider>{children}</InstallProvider>
        </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
