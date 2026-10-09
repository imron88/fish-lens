import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Fish Lens | Phishing URL & Email Forensic Analyzer',
  description:
    'Heuristic threat detection engine for suspicious domains, typosquatting, email header spoofing, and redirect chains with SSRF protection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#06090e] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-cyan-950/70 bg-[#04060a] py-6 text-center text-xs font-mono text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p>
              Fish Lens Cybersecurity Scanner • Lightweight • Edge Compatible • SSRF Fortified
            </p>
            <p className="text-[11px] text-slate-600">
              Disclaimer: Provided for cybersecurity defense, analysis, and educational evaluation only.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
