import type { Metadata } from 'next';
import './globals.css';
import PortalSwitcher from '@/components/PortalSwitcher';

export const metadata: Metadata = {
  title: 'Debitinfo.GE — დებიტორთა რეესტრი და საკრედიტო რისკების მართვა',
  description: 'საქართველოს ეროვნული სადებიტო რეესტრი, რისკების შეფასება, საქმისწარმოება და ანალიტიკური პლატფორმა.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface-bg text-text-primary antialiased" suppressHydrationWarning>
        <PortalSwitcher />
        <div className="flex-1 flex flex-col" suppressHydrationWarning>{children}</div>
      </body>
    </html>
  );
}
