'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, MapPin, Thermometer, Lock, Shield, Calendar,
  ChevronRight, CheckCircle, Star, Clock, Phone,
} from 'lucide-react';

// ── Pricing tiers ──────────────────────────────────────────────────────────
const TIERS = [
  { days: '1–2 jours',  price: 175, note: 'Tarif standard',         highlight: false },
  { days: '3–6 jours',  price: 160, note: 'Économisez 15$/jour',    highlight: true  },
  { days: '7+ jours',   price: 140, note: 'Économisez 35$/jour',    highlight: false },
];

// ── Mini calendar ──────────────────────────────────────────────────────────
function MiniCalendar({ blockedDates, monthOffset = 0 }: { blockedDates: string[]; monthOffset?: number }) {
  const today = new Date();
  const base  = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const [viewYear,  setViewYear]  = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const todayStr    = today.toISOString().split('T')[0];

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', borderRadius: '6px' }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: '15px', textTransform: 'capitalize' }}>{monthName}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', borderRadius: '6px' }}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {['D','L','M','M','J','V','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isPast    = dateStr < todayStr;
          const isBlocked = blockedDates.includes(dateStr);
          const isToday   = dateStr === todayStr;

          let bg     = 'transparent';
          let color  = 'var(--text)';
          let border = 'transparent';
          let title  = 'Disponible';

          if (isPast)    { bg = 'transparent'; color = '#333'; }
          else if (isBlocked) { bg = 'rgba(227,25,55,0.15)'; color = 'var(--red)'; border = 'rgba(227,25,55,0.3)'; title = 'Réservé'; }
          else           { bg = 'rgba(34,197,94,0.08)'; color = 'var(--green)'; border = 'rgba(34,197,94,0.2)'; }

          if (isToday) { border = 'rgba(255,255,255,0.4)'; }

          return (
            <div key={i} title={isPast ? '' : title} style={{
              textAlign: 'center', fontSize: '13px', fontWeight: 500,
              padding: '6px 2px', borderRadius: '6px',
              background: bg, color, border: `1px solid ${border}`,
              cursor: isPast ? 'default' : 'default',
            }}>
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(34,197,94,0.3)', border: '1px solid rgba(34,197,94,0.5)' }} />
          Disponible
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(227,25,55,0.3)', border: '1px solid rgba(227,25,55,0.5)' }} />
          Réservé
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/availability')
      .then(r => r.json())
      .then(data => setBlockedDates(data.blockedDates ?? []))
      .catch(() => {});
  }, []);

  const features = [
    { icon: Zap,         title: 'Batterie pleine à chaque départ',  desc: 'La Tesla est toujours chargée et prête. Vous partez sans vous soucier de rien.' },
    { icon: Lock,        title: 'Déverrouillage par téléphone',     desc: 'Votre téléphone est la clé. Aucune rencontre physique requise.' },
    { icon: Thermometer, title: 'Climatisation préconfigurée',      desc: 'La voiture est à la bonne température dès votre arrivée. Hiver comme été.' },
    { icon: MapPin,      title: 'Localisation en temps réel',       desc: 'La Tesla vous est livrée à votre position ou récupérée à Rawdon, QC.' },
    { icon: Shield,      title: 'Surveillance caméra 24/7',         desc: 'Mode Sentry actif pendant toute la durée de votre location.' },
    { icon: Zap,         title: '358 km d\'autonomie',              desc: 'Tesla Model 3 Dual Motor. Parfait pour Montréal, les Laurentides ou Québec.' },
  ];

  const steps = [
    { num: '01', title: 'Choisissez vos dates',        desc: 'Sélectionnez votre période sur le calendrier et vérifiez la disponibilité instantanément.' },
    { num: '02', title: 'Payez en ligne en toute sécurité', desc: 'Paiement sécurisé par Stripe. TPS + TVQ inclus. Annulation gratuite 48h avant.' },
    { num: '03', title: 'Déverrouillez depuis votre téléphone', desc: 'À l\'heure convenue, votre portail client s\'active. Départ sans contact humain.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--red)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>T</span>
            </div>
            <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>tesla.groupeb.ca</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href="#disponibilite" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>Disponibilité</a>
            <a href="#tarifs" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>Tarifs</a>
            <Link href="/book" style={{ background: 'var(--red)', color: 'white', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              Réserver →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ paddingTop: '100px', paddingBottom: '80px', maxWidth: '1100px', margin: '0 auto', padding: '100px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        <div>
          {/* Availability badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '999px', padding: '6px 16px', marginBottom: '28px' }}>
            <div className="pulse-dot" style={{ background: 'var(--green)' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--green)' }}>Disponible à la location</span>
          </div>

          <h1 style={{ fontSize: 'clamp(38px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '20px' }}>
            Louez une Tesla<br />
            <span style={{ color: 'var(--red)' }}>Model 3</span><br />
            à Rawdon, QC
          </h1>

          <p style={{ fontSize: '17px', color: 'var(--muted)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '32px' }}>
            Location journalière, sans rendez-vous. Votre téléphone est votre clé.
            Zéro paperasse, zéro contact humain.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px' }}>
            <Link href="/book" style={{ background: 'var(--red)', color: 'white', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Réserver maintenant <ChevronRight size={16} />
            </Link>
            <a href="#disponibilite" style={{ background: 'var(--surface)', color: 'white', padding: '14px 28px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', fontSize: '15px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} /> Voir les dates
            </a>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { val: '175$', label: 'par jour' },
              { val: '358 km', label: 'd\'autonomie' },
              { val: '24/7', label: 'déverrouillage' },
            ].map(({ val, label }) => (
              <div key={label}>
                <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: car card */}
        <div>
          <div className="card glow-red" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Car illustration placeholder — SVG silhouette */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)', borderRadius: '12px', padding: '32px', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '160px' }}>
              <svg viewBox="0 0 240 100" width="100%" height="auto" style={{ maxWidth: '220px', opacity: 0.9 }}>
                {/* Tesla Model 3 silhouette */}
                <defs>
                  <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#888" />
                    <stop offset="100%" stopColor="#444" />
                  </linearGradient>
                </defs>
                {/* Body */}
                <path d="M20,65 Q25,30 70,28 Q110,26 145,28 Q180,30 210,50 L215,65 Z" fill="url(#bodyGrad)" />
                {/* Roof */}
                <path d="M65,28 Q80,14 120,13 Q155,12 165,28" fill="#666" stroke="none" />
                {/* Underbody */}
                <rect x="18" y="64" width="202" height="10" rx="4" fill="#333" />
                {/* Wheels */}
                <circle cx="60" cy="75" r="13" fill="#222" stroke="#555" strokeWidth="2" />
                <circle cx="60" cy="75" r="7" fill="#333" />
                <circle cx="175" cy="75" r="13" fill="#222" stroke="#555" strokeWidth="2" />
                <circle cx="175" cy="75" r="7" fill="#333" />
                {/* Window */}
                <path d="M72,28 Q82,18 115,17 Q148,16 155,28" fill="rgba(59,130,246,0.4)" stroke="rgba(59,130,246,0.6)" strokeWidth="1" />
                {/* Red accent stripe */}
                <rect x="18" y="60" width="202" height="3" rx="1.5" fill="rgba(227,25,55,0.6)" />
              </svg>
            </div>

            <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>Tesla Model 3 Dual Motor</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>VIN · 5YJ3E1EB1JF106930 · Rawdon, QC</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Autonomie', val: '358 km' },
                { label: 'Accélération', val: '4.8s 0-100' },
                { label: 'Transmission', val: 'Double moteur' },
                { label: 'Clé', val: 'Application mobile' },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Comment ça fonctionne</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '15px', marginBottom: '48px' }}>3 étapes simples. Aucun déplacement nécessaire.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="card" style={{ position: 'relative' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(227,25,55,0.15)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '16px' }}>{num}</div>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{title}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="tarifs" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Tarifs transparents</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '15px', marginBottom: '48px' }}>TPS + TVQ (14.975%) en sus · Annulation gratuite 48h avant</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {TIERS.map(({ days, price, note, highlight }) => (
            <div key={days} className={`card${highlight ? ' glow-red' : ''}`} style={{ textAlign: 'center', border: highlight ? '1px solid rgba(227,25,55,0.4)' : undefined, position: 'relative' }}>
              {highlight && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--red)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                  LE PLUS POPULAIRE
                </div>
              )}
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px', marginTop: highlight ? '8px' : '0' }}>{days}</div>
              <div style={{ fontSize: '52px', fontWeight: 900, letterSpacing: '-0.04em', color: highlight ? 'var(--red)' : 'var(--text)', lineHeight: 1 }}>{price}<span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--muted)' }}>$</span></div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '20px', marginTop: '6px' }}>par jour</div>
              <div style={{ fontSize: '13px', color: highlight ? 'var(--green)' : 'var(--muted)', fontWeight: 500 }}>{note}</div>
            </div>
          ))}
        </div>

        {/* Extras */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '8px' }}>Assurance premium</div>
            <div style={{ fontWeight: 700, fontSize: '20px' }}>+30$<span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400 }}>/j</span></div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Franchise réduite à 0$</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '8px' }}>Livraison à domicile</div>
            <div style={{ fontWeight: 700, fontSize: '20px' }}>+50$</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Rayon 30 km de Rawdon</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '8px' }}>Portail GPS client</div>
            <div style={{ fontWeight: 700, fontSize: '20px' }}>+10$<span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400 }}>/j</span></div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Suivi temps réel</div>
          </div>
        </div>

        {/* Promo codes teaser */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
          Vous avez un code promotionnel ? Entrez-le lors de la réservation. <span style={{ color: 'var(--text)', fontStyle: 'italic' }}>Ex: COEURDUVILLAGE, GROUPEB10, SEMAINE</span>
        </div>
      </section>

      {/* ── Availability calendar ────────────────────────────────── */}
      <section id="disponibilite" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Disponibilité</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '15px', marginBottom: '48px' }}>Vérifiez les dates libres avant de réserver</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '700px', margin: '0 auto 36px' }}>
          <MiniCalendar blockedDates={blockedDates} monthOffset={0} />
          <MiniCalendar blockedDates={blockedDates} monthOffset={1} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/book" style={{ background: 'var(--red)', color: 'white', padding: '14px 32px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Réserver une date disponible <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Tout inclus dans votre location</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '15px', marginBottom: '48px' }}>Aucun frais caché. Tout est prêt à votre arrivée.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card" style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', background: 'rgba(227,25,55,0.1)', border: '1px solid rgba(227,25,55,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="var(--red)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust + CTA ─────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div className="card glow-red" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            Prêt à prendre la route ?
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
            Réservez en 2 minutes. Paiement sécurisé. Confirmation instantanée.
          </p>
          <Link href="/book" style={{ background: 'var(--red)', color: 'white', padding: '16px 40px', borderRadius: '14px', fontWeight: 700, textDecoration: 'none', fontSize: '17px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            Réserver la Tesla Model 3 <ChevronRight size={18} />
          </Link>
          <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
            {[
              { icon: CheckCircle, text: 'Paiement Stripe sécurisé' },
              { icon: Clock,       text: 'Annulation 48h avant' },
              { icon: Shield,      text: 'Zéro frais cachés' },
              { icon: Star,        text: 'Tesla officielle — Rawdon, QC' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)' }}>
                <Icon size={14} color="var(--green)" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
          © {new Date().getFullYear()} tesla.groupeb.ca — Service de location Tesla à Rawdon, QC
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="https://groupeb.ca" style={{ color: 'var(--muted)', fontSize: '13px', textDecoration: 'none' }}>GroupeB.ca</a>
          <Link href="/admin" style={{ color: 'var(--muted)', fontSize: '13px', textDecoration: 'none' }}>Admin</Link>
          <Link href="/book" style={{ background: 'var(--red)', color: 'white', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Réserver</Link>
        </div>
      </footer>

    </div>
  );
}
