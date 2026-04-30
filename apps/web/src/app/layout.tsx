import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MyLink",
    template: "%s | MyLink"
  },
  description: "Automação Instagram: comentário → Direct",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
