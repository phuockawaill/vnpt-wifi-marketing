import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WiFi Marketing Admin CMS',
  description: 'Manage WiFi marketing campaigns, router gateways, and guest leads',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
