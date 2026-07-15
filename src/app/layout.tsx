import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kotek3d",
  description: "Płatna społeczność dla osób rzucających palenie.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
