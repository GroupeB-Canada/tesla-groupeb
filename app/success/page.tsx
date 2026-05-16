import Link from 'next/link';
import { CheckCircle, Calendar, Car, MapPin } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card glow-green" style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={32} color="var(--green)" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Réservation confirmée !</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.7 }}>
          Votre Tesla Model 3 est réservée. Un courriel de confirmation a été envoyé avec tous les détails.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', textAlign: 'left' }}>
          {[
            { icon: Car,      label: 'Accès au véhicule',  desc: 'Déverrouillage automatique via le portail client 30 min avant votre départ.' },
            { icon: MapPin,   label: 'Localisation',       desc: 'Suivez la Tesla en temps réel depuis /portal ou /live.' },
            { icon: Calendar, label: 'Rappel',             desc: 'Vous recevrez un SMS de rappel 24h avant votre location.' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: '14px', padding: '14px', background: 'var(--surface2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Icon size={20} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link href="/portal" style={{ background: 'var(--green)', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
            Accéder au portail →
          </Link>
          <Link href="/" style={{ background: 'var(--surface2)', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '14px', border: '1px solid var(--border)' }}>
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
