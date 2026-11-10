import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { InstallProvider } from "@/components/install-app";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/lib/store";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Student OS — a calmer way to run your school life",
    template: "%s · Student OS",
  },
  description:
    "Tasks, notes, flashcards, a focus timer and a whiteboard in one quiet workspace. Rebuilt with shadcn/ui and bklit charts.",
  applicationName: "Student OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Student OS", statusBarStyle: "default" },
  openGraph: {
    title: "Student OS",
    description:
      "One calm workspace for tasks, notes, flashcards, focus sessions and sketching.",
    type: "website",
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
        <ThemeProvider>
          <InstallProvider><StoreProvider>{children}</StoreProvider></InstallProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
