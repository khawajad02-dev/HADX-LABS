import type { Metadata } from 'next';
import CyberOrb from '@/components/CyberOrb';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hadx-labs.com'),
  title: 'HADX LABS | Bootleg Vintage Graphics (Anime, Marvel, DC & Custom Assets)',
  description: 'High-quality bootleg vintage graphic assets featuring top Anime, Marvel, and DC characters. Have a custom idea? Upload your image to get a unique custom vintage graphic design.',
  keywords: 'vintage graphics, bootleg anime, marvel assets, dc characters, custom graphic design',
  authors: [{ name: 'HADX LABS' }],
  openGraph: {
    title: 'HADX LABS | Bootleg Vintage Graphics',
    description: 'High-quality bootleg vintage graphic assets featuring top Anime, Marvel, and DC characters.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://hadx-labs.com',
    siteName: 'HADX LABS',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HADX LABS - Bootleg Vintage Graphics',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HADX LABS | Bootleg Vintage Graphics',
    description: 'High-quality bootleg vintage graphic assets featuring top Anime, Marvel, and DC characters.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050505" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#050505', color: '#ffffff' }}>
        {children}
        <CyberOrb />
      </body>
    </html>
  );
}
