import "./globals.css";
import { SessionProvider } from "@/components/session-provider";

export const metadata = {
  title: "SwipePay",
  description: "Tinder-like AP inbox triage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
