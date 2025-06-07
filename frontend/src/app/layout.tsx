import "~/styles/globals.css";

import { Inter as InterSans } from "next/font/google";
import { cn } from "~/lib/utils";

import { ClerkProvider, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { CodeIcon } from "~/components/icons";

import { SignedIn, UserButton } from "@clerk/nextjs";
import { Providers } from "~/lib/providers";

const fontSans = InterSans({
  subsets: ["latin"],
  variable: "--font-sans",
});



export const metadata = {
  title: "Wolkenlauf",
  description: "Run your code in the cloud!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}
      >
        <body className="pt-16">
          <header className="fixed top-0 w-full h-16 flex items-center justify-between bg-gray-900 px-6 py-4 text-white shadow-lg">
            <SignedIn>
              <Link className="flex items-center gap-2" href="/dashboard">
                <CodeIcon className="h-6 w-6" />
                <span className="text-lg font-semibold">Wolkenlauf</span>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link className="flex items-center gap-2" href="/">
                <CodeIcon className="h-6 w-6" />
                <span className="text-lg font-semibold">Wolkenlauf</span>
              </Link>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard/profile"
                  className="text-white hover:text-gray-300 text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-10 h-10"
                    }
                  }} />
              </div>
            </SignedIn>
          </header>

          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
