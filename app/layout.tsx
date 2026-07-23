import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HADX LABS | Private System',
  description: 'HADX LABS Edge Commerce Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#050505', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}
