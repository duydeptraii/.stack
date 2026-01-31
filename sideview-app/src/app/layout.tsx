import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: '.stack - AI Code Intelligence',
  description: 'Intelligent code explanation and generation interface.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Helvetica is usually a system font, but we ensure fallbacks in CSS */}
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
