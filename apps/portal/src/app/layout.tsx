import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Free WiFi Marketing Portal',
  description: 'Connect to Free WiFi and enjoy high-speed internet',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased font-sans select-none">{children}</body>
    </html>
  );
}
