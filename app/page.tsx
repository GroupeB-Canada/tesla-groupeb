import Link from 'next/link';
import { Zap, MapPin, Thermometer, Lock, Star, ChevronRight, Shield, Wifi } from 'lucide-react';

export default function HomePage() {
  const features = [
    { icon: Zap,         title: 'Charge en direct',       desc: 'Voir le niveau de batterie et l\'autonomie restante avant de partir.' },
    { icon: MapPin,      title: 'Localisation live',      desc: 'La Tesla vous est livrée à votre position. Suivez-la en temps réel.' },
    { icon: Thermometer, title: 'Climatisation à distance',desc: 'La voiture est à la bonne température à votre arrivée. Hiver comme été.' },
    { icon: Lock,        title: 'Déverrouillage auto',    desc: 'Votre téléphone devient la clé. Zéro paperasse, zéro interaction.' },
    { icon: Shield,      title: 'Mode sentry actif',       desc: 'Surveillance 24/7 avec caméras actives pendant toute la location.' },
    { icon: Wifi,        title: 'Accès Fleet API',        desc: 'Contrôle complet du véhicule depuis votre portail client personnel.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--red)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>T</span>
            </div>
            <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>tesla.groupeb.ca</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/live" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>Live</Link>
            <Link href="/book" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>Réserver</Link>
            <Link href="/admin" style={{ background: 'var(--red)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
              Admin →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center', maxWidth: '900px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(227,25,55,0.15)', border: '1px solid rgba(227,25,55,0.3)', borderRadius: '999px', padding: '6px 16px', marginBottom: '32px' }}>
          <div className="pulse-dot" style={{ background: 'var(--red)' }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--red)' }}>Tesla Fleet API — Actif</span>
        </div>

        <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '24px' }}>
          Location Tesla<br />
          <span style={{ color: 'var(--red)' }}>100% autonome.</span>
        </h1>

        <p style={{ fontSize: '18px', color: 'var(--muted)', maxWidth: '580px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          Réservez, payez, récupérez et retournez votre Tesla Model 3 sans contact humain. Contrôle complet depuis votre téléphone.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <Link href="/book" style={{ background: 'var(--red)', color: 'white', padding: '14px 32px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}>
            Réserver maintenant
          </Link>
          <Link href="/live" style={{ background: 'var(--surface)', color: 'white', padding: '14px 32px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', fontSize: '15px', border: '1px solid var(--border)' }}>
            Voir la Tesla en direct →
          </Link>
        </div>

        {/* Live mini-widget */}
        <div className="card glow-red" style={{ maxWidth: '500px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Batterie', value: '—', unit: '%', id: 'h-bat' },
            { label: 'Autonomie', value: '—', unit: 'km', id: 'h-range' },
            { label: 'Statut', value: 'En ligne', unit: '', id: 'h-status' },
          ].map(({ label, value, unit, id }) => (
            <div key={id} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
              <div id={id} style={{ fontSize: '24px', fontWeight: 700 }}>{value}<span style={{ fontSize: '13px', color: 'var(--muted)', marginLeft: '2px' }}>{unit}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 800, marginBottom: '48px', letterSpacing: '-0.02em' }}>
          Toutes les features Tesla Fleet API
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card" style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(227,25,55,0.1)', border: '1px solid rgba(227,25,55,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color="var(--red)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA portal */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div className="card glow-blue" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Portail client</div>
            <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Votre Tesla, sous contrôle total</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Déverrouillez, préconditionez, suivez la localisation, consultez les stats de votre trajet — tout en un clic.</p>
          </div>
          <Link href="/portal" style={{ background: 'var(--blue)', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Accéder au portail <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
        © {new Date().getFullYear()} tesla.groupeb.ca — Un service{' '}
        <a href="https://groupeb.ca" style={{ color: 'var(--red)', textDecoration: 'none' }}>GroupeB.ca</a>
      </footer>
    </div>
  );
}
