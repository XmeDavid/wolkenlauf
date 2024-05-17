import "~/styles/globals.css";

import { Inter as InterSans } from "next/font/google";
import { cn } from "~/lib/utils";

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
    <html lang="en" className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}
    >
      <body>{children}</body>
    </html>
  );
}
