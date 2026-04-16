import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KnifeCompanion Admin',
  description: 'Admin panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
