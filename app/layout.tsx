import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tesla GroupeB | Location premium & contrôle autonome',
  description: 'Louez une Tesla Model Y avec contrôle 100% autonome — déverrouillage automatique, climatisation à distance, suivi en temps réel. Rawdon, QC.',
  openGraph: {
    title: 'Tesla GroupeB — Location autonome',
    description: 'L\'expérience Tesla la plus avancée au Québec.',
    url: 'https://tesla.groupeb.ca',
  },
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
