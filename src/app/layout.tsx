import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Royal Flush – Premium Poker',
  description: 'Play Texas Hold\'em, Omaha, 7-Card Stud, 5-Card Draw, Razz and more. Play against smart bots or online with friends.',
  keywords: ['poker', 'texas holdem', 'omaha', '7 card stud', 'online poker', 'free poker'],
  openGraph: {
    title: 'Royal Flush – Premium Poker',
    description: 'Full-featured poker with 7 variants, bot AI, and online multiplayer.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
