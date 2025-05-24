import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Providers } from './providers';
import PageLayout from './components/layout/PageLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jersey Club | Musik Social Tokens',
  description: 'Create, trade, and collect social tokens for Jersey Club musik artists',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <PageLayout>
            {children}
          </PageLayout>
        </Providers>
      </body>
    </html>
  );
} 