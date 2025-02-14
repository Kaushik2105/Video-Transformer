import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignIn, UserButton } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video-Transformer",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="min-h-screen">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm p-4">
              <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold text-purple-800">Video Transformer</h1>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </nav>

            {/* Main Content */}
            <SignedIn>
              {children}
            </SignedIn>

            {/* Centered Sign In */}
            <SignedOut>
              <div className="flex items-center justify-center min-h-[calc(100vh-72px)]">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <SignIn />
                </div>
              </div>
            </SignedOut>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
