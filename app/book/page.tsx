'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, User, Mail, Phone, Tag, ChevronRight } from 'lucide-react';

const PRICE_PER_DAY = 175;
const TAX_RATE = 0.14975;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function DateInput({ label, value, onChange, min }: { label: string; value: string; onChange: (v: string) => void; min?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>{label}</label>
      <input
        type="date"
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'white', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
      />
    </div>
  );
}

export default function BookPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [promo,     setPromo]     = useState('');
  const [promoResult, setPromoResult] = useState<{ discount: number; label: string } | null>(null);
  const [promoError,  setPromoError]  = useState('');
  const [extras, setExtras] = useState({ insurance: false, delivery: false, gps: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculations
  const days = startDate && endDate
    ? Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;
  const subtotal = days * PRICE_PER_DAY;
  const extrasTotal = (extras.insurance ? 30 : 0) + (extras.delivery ? 50 : 0) + (extras.gps ? 10 : 0);
  const discount = promoResult?.discount ?? 0;
  const beforeTax = subtotal + extrasTotal - discount;
  const tax = beforeTax * TAX_RATE;
  const total = beforeTax + tax;

  const applyPromo = async () => {
    setPromoError('');
    setPromoResult(null);
    if (!promo.trim()) return;
    // Simple client-side validation for demo
    const CODES: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
      'COEURDUVILLAGE': { type: 'percent', value: 20, label: '20% — Partenaire Appartement au Cœur du Village' },
      'GROUPEB10':      { type: 'percent', value: 10, label: '10% — Code GroupeB.ca' },
      'SEMAINE':        { type: 'fixed',   value: 50, label: '-50$ — Offre semaine complète' },
    };
    const code = CODES[promo.toUpperCase()];
    if (!code) {
      setPromoError('Code promotionnel invalide');
      return;
    }
    if (code.type === 'percent') {
      setPromoResult({ discount: Math.round(subtotal * code.value / 100), label: code.label });
    } else {
      setPromoResult({ discount: code.value, label: code.label });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !firstName || !email) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (days < 1) {
      setError('Sélectionnez au moins 1 jour de location.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate, days,
          firstName, lastName, email, phone,
          promoCode: promo.toUpperCase() || undefined,
          extras,
          subtotal, discount, total,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      window.location.href = json.checkoutUrl;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: '80px' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <ChevronLeft size={16} /> Accueil
            </Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Réserver la Tesla</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {PRICE_PER_DAY}$/jour · TPS+TVQ incl.
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 0' }}>
        <div style={{ paddingTop: '32px', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>Réserver la Tesla Model Y</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Location autonome · Déverrouillage par téléphone · Rawdon, QC</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Left form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Dates */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Calendar size={16} color="var(--red)" />
                <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Dates de location</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <DateInput label="Départ" value={startDate} onChange={setStartDate} min={today} />
                <DateInput label="Retour" value={endDate} onChange={setEndDate} min={startDate || today} />
              </div>
              {days > 0 && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(227,25,55,0.08)', borderRadius: '8px', border: '1px solid rgba(227,25,55,0.2)', fontSize: '13px', color: 'var(--red)', fontWeight: 500 }}>
                  {days} jour{days > 1 ? 's' : ''} de location · {formatDate(new Date(startDate))} → {formatDate(new Date(endDate))}
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <User size={16} color="var(--red)" />
                <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Informations</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Prénom *',  val: firstName,  set: setFirstName,  type: 'text',  icon: User,  ph: 'Jean-Philippe' },
                  { label: 'Nom',       val: lastName,   set: setLastName,   type: 'text',  icon: User,  ph: 'Beaulieu' },
                  { label: 'Courriel *',val: email,      set: setEmail,      type: 'email', icon: Mail,  ph: 'vous@exemple.ca' },
                  { label: 'Téléphone', val: phone,      set: setPhone,      type: 'tel',   icon: Phone, ph: '(450) 555-0000' },
                ].map(({ label, val, set, type, ph }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>{label}</label>
                    <input
                      type={type}
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={ph}
                      required={label.includes('*')}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'white', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="card">
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Options supplémentaires</h2>
              {[
                { key: 'insurance', label: 'Assurance premium',    sublabel: 'Franchise réduite à 0$',  price: 30 },
                { key: 'delivery',  label: 'Livraison à domicile', sublabel: 'Rayon 30 km de Rawdon',   price: 50 },
                { key: 'gps',       label: 'Suivi GPS client',     sublabel: 'Portail temps réel',       price: 10 },
              ].map(({ key, label, sublabel, price }) => (
                <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{sublabel}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>+{price}$/j</span>
                    <input
                      type="checkbox"
                      checked={(extras as any)[key]}
                      onChange={e => setExtras(prev => ({ ...prev, [key]: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--red)', cursor: 'pointer' }}
                    />
                  </div>
                </label>
              ))}
            </div>

            {/* Promo */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Tag size={16} color="var(--red)" />
                <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Code promotionnel</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={promo}
                  onChange={e => setPromo(e.target.value.toUpperCase())}
                  placeholder="COEURDUVILLAGE"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'white', fontSize: '14px', outline: 'none', letterSpacing: '1px' }}
                />
                <button type="button" onClick={applyPromo} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'white', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  Appliquer
                </button>
              </div>
              {promoResult && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--green)', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  ✅ {promoResult.label} — Économisez {promoResult.discount.toFixed(2)}$
                </div>
              )}
              {promoError && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--red)' }}>{promoError}</div>
              )}
            </div>
          </div>

          {/* Right — Summary */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="card glow-red">
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Résumé</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>{days} jour{days !== 1 ? 's' : ''} × {PRICE_PER_DAY}$</span>
                  <span>{subtotal.toFixed(2)}$</span>
                </div>
                {extrasTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--muted)' }}>Options</span>
                    <span>{extrasTotal.toFixed(2)}$</span>
                  </div>
                )}
                {promoResult && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--green)' }}>
                    <span>Code promo</span>
                    <span>-{promoResult.discount.toFixed(2)}$</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>TPS + TVQ (14.975%)</span>
                  <span>{tax.toFixed(2)}$</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--red)' }}>{total > 0 ? total.toFixed(2) : '0.00'}$</span>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(227,25,55,0.08)', border: '1px solid rgba(227,25,55,0.3)', borderRadius: '8px', fontSize: '13px', color: 'var(--red)' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || days < 1}
                style={{
                  width: '100%', background: days < 1 ? '#333' : 'var(--red)', color: 'white',
                  border: 'none', padding: '16px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '15px', cursor: days < 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? 'Redirection…' : 'Procéder au paiement'}
                {!loading && <ChevronRight size={18} />}
              </button>

              <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Paiement sécurisé par Stripe. Annulation gratuite 48h avant.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
