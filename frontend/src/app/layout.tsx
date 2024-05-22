import "~/styles/globals.css";

import { Inter as InterSans } from "next/font/google";
import { cn } from "~/lib/utils";

import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { CodeIcon } from "~/components/icons";

import { SignedIn, UserButton } from "@clerk/nextjs";

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
          <section className="fixed top-0 w-full h-16 flex items-center justify-between bg-gray-900 px-6 py-4 text-white shadow-lg">
            <Link className="flex items-center gap-2" href="#">
              <CodeIcon className="h-6 w-6" />
              <span className="text-lg font-semibold">Wolkenlauf</span>
            </Link>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10"
                  }
                }} />
            </SignedIn>
          </section>
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
