'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Lock, Unlock, Volume2, Zap, Wind, Snowflake,
  ChevronLeft, CheckCircle, XCircle, Loader2,
  Shield, Key, Car, Battery, Thermometer, BellRing,
  ToggleLeft, ToggleRight, Settings, AlertTriangle,
  Activity, ClipboardList, ExternalLink, Copy,
} from 'lucide-react';

// ─── Bookings Panel ───────────────────────────────────────────────────────────
interface Booking {
  bookingId: string; startDate: string; endDate: string; days: string;
  firstName: string; lastName: string; email: string; phone: string;
  licenseNumber: string; licenseStatus: string;
  promoCode: string; amountTotal: string; status: string; createdAt: string;
}

function BookingsPanel() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [copied,   setCopied]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/admin/bookings', {
      headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? '' },
    });
    const json = await res.json();
    if (json.ok) setBookings(json.bookings);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (bookingId: string, licenseStatus: string) => {
    setUpdating(bookingId);
    await fetch('/api/admin/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? '',
      },
      body: JSON.stringify({ bookingId, licenseStatus }),
    });
    await load();
    setUpdating(null);
  };

  const copyAndOpenSAAQ = (licenseNum: string) => {
    navigator.clipboard.writeText(licenseNum).catch(() => {});
    setCopied(licenseNum);
    setTimeout(() => setCopied(null), 2000);
    window.open('https://saaqclic-entreprises.saaq.gouv.qc.ca/saaqstorefront/fr/login', '_blank');
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      pending:  { label: 'En attente',   color: 'var(--amber)',  bg: 'rgba(245,158,11,0.12)'   },
      approved: { label: '✓ Approuvé',   color: 'var(--green)',  bg: 'rgba(34,197,94,0.12)'    },
      rejected: { label: '✗ Refusé',     color: 'var(--red)',    bg: 'rgba(227,25,55,0.12)'    },
    };
    const { label, color, bg } = map[s] ?? map.pending;
    return (
      <span style={{ fontSize: '11px', fontWeight: 600, color, background: bg, padding: '3px 10px', borderRadius: '999px', border: `1px solid ${color}40` }}>
        {label}
      </span>
    );
  };

  if (loading) return <div style={{ color: 'var(--muted)', padding: '32px', textAlign: 'center' }}>Chargement…</div>;
  if (!bookings.length) return <div style={{ color: 'var(--muted)', padding: '32px', textAlign: 'center' }}>Aucune réservation pour l'instant.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bookings.map(b => (
        <div key={b.bookingId} className="card" style={{
          borderLeft: `3px solid ${b.licenseStatus === 'approved' ? 'var(--green)' : b.licenseStatus === 'rejected' ? 'var(--red)' : 'var(--amber)'}`,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Client */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>CLIENT</div>
              <div style={{ fontWeight: 700 }}>{b.firstName} {b.lastName}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{b.email}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{b.phone}</div>
            </div>
            {/* Dates */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>LOCATION</div>
              <div style={{ fontWeight: 700 }}>{b.startDate} → {b.endDate}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{b.days} jour{Number(b.days) > 1 ? 's' : ''}</div>
              <div style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>{Number(b.amountTotal).toFixed(2)} $</div>
            </div>
            {/* Statut */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>STATUT PERMIS</div>
              <div style={{ marginBottom: '8px' }}>{statusBadge(b.licenseStatus)}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Réservation: {new Date(b.createdAt).toLocaleDateString('fr-CA')}
              </div>
            </div>
          </div>

          {/* Permis de conduire */}
          <div style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>NUMÉRO DE PERMIS SAAQ</div>
              <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, letterSpacing: '2px', color: b.licenseNumber ? 'var(--text)' : 'var(--muted)' }}>
                {b.licenseNumber || 'Non fourni'}
              </div>
            </div>
            {b.licenseNumber && (
              <button
                onClick={() => copyAndOpenSAAQ(b.licenseNumber)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: copied === b.licenseNumber ? 'rgba(34,197,94,0.15)' : 'var(--red)',
                  color: 'white', border: 'none', padding: '10px 16px',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied === b.licenseNumber ? (
                  <><CheckCircle size={14} /> Copié! Vérifiez sur SAAQ</>
                ) : (
                  <><ExternalLink size={14} /> Vérifier sur SAAQ</>
                )}
              </button>
            )}
          </div>

          {/* Actions approbation */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', marginRight: '4px' }}>Après vérification :</span>
            <button
              onClick={() => updateStatus(b.bookingId, 'approved')}
              disabled={b.licenseStatus === 'approved' || updating === b.bookingId}
              style={{
                background: b.licenseStatus === 'approved' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${b.licenseStatus === 'approved' ? 'var(--green)' : 'rgba(34,197,94,0.3)'}`,
                color: 'var(--green)', padding: '6px 16px', borderRadius: '8px',
                cursor: b.licenseStatus === 'approved' ? 'default' : 'pointer',
                fontSize: '13px', fontWeight: 600,
              }}
            >
              {updating === b.bookingId ? '…' : '✓ Approuver'}
            </button>
            <button
              onClick={() => updateStatus(b.bookingId, 'rejected')}
              disabled={b.licenseStatus === 'rejected' || updating === b.bookingId}
              style={{
                background: b.licenseStatus === 'rejected' ? 'rgba(227,25,55,0.2)' : 'rgba(227,25,55,0.08)',
                border: `1px solid ${b.licenseStatus === 'rejected' ? 'var(--red)' : 'rgba(227,25,55,0.2)'}`,
                color: 'var(--red)', padding: '6px 16px', borderRadius: '8px',
                cursor: b.licenseStatus === 'rejected' ? 'default' : 'pointer',
                fontSize: '13px', fontWeight: 600,
              }}
            >
              {updating === b.bookingId ? '…' : '✗ Refuser'}
            </button>
            <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
              ↺ Rafraîchir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface CmdResult { ok: boolean; message: string; }
type CmdStatus = 'idle' | 'loading' | 'ok' | 'error';

interface CmdState {
  status: CmdStatus;
  message: string;
}

// ─── PIN Gate ────────────────────────────────────────────────────────────────
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const CORRECT = '7594124';

  const check = () => {
    if (pin === CORRECT) {
      onUnlock();
    } else {
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card glow-red" style={{ width: '340px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', background: 'rgba(227,25,55,0.1)', border: '1px solid rgba(227,25,55,0.3)', borderRadius: '16px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={28} color="var(--red)" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Accès Admin Tesla</h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '28px' }}>Entrez votre code PIN pour contrôler le véhicule</p>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="••••••••"
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            background: 'var(--surface2)', border: `1px solid ${shake ? 'var(--red)' : 'var(--border)'}`,
            color: 'white', fontSize: '20px', textAlign: 'center', letterSpacing: '6px',
            outline: 'none', marginBottom: '16px',
            animation: shake ? 'shake 0.4s ease' : 'none',
          }}
        />
        <button onClick={check} style={{ width: '100%', background: 'var(--red)', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
          Accéder au panneau de contrôle
        </button>
        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
      </div>
    </div>
  );
}

// ─── Command Button ───────────────────────────────────────────────────────────
function CmdBtn({
  icon: Icon, label, sublabel, command, body, color = 'default',
  active = false, onRun,
}: {
  icon: any; label: string; sublabel?: string; command: string; body?: object;
  color?: 'default' | 'green' | 'red' | 'blue' | 'amber';
  active?: boolean;
  onRun: (command: string, body?: object) => Promise<void>;
}) {
  const [status, setStatus] = useState<CmdStatus>('idle');

  const handle = async () => {
    setStatus('loading');
    try {
      await onRun(command, body);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  const borderColor = {
    default: active ? 'var(--green)' : 'var(--border)',
    green:   'var(--green)',
    red:     'var(--red)',
    blue:    'var(--blue)',
    amber:   'var(--amber)',
  }[color];

  const bgColor = {
    default: active ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
    green:   'rgba(34,197,94,0.1)',
    red:     'rgba(227,25,55,0.1)',
    blue:    'rgba(59,130,246,0.1)',
    amber:   'rgba(245,158,11,0.1)',
  }[color];

  return (
    <button
      onClick={handle}
      disabled={status === 'loading'}
      className="ctrl-btn"
      style={{ border: `1px solid ${borderColor}`, background: bgColor, minHeight: '90px', position: 'relative' }}
    >
      {status === 'loading' ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={22} />}
      <span>{label}</span>
      {sublabel && <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '-4px' }}>{sublabel}</span>}
      {status === 'ok'    && <CheckCircle size={14} color="var(--green)" style={{ position: 'absolute', top: '8px', right: '8px' }} />}
      {status === 'error' && <XCircle     size={14} color="var(--red)"   style={{ position: 'absolute', top: '8px', right: '8px' }} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'vehicle' | 'bookings'>('bookings');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [vehicleState, setVehicleState] = useState<any>(null);
  const [tempTarget, setTempTarget] = useState(20);
  const [chargeTarget, setChargeTarget] = useState(80);
  const [valetPin, setValetPin] = useState('');
  const [seatLevels, setSeatLevels] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  // Load state on mount
  useEffect(() => {
    if (!unlocked) return;
    fetch('/api/tesla/state')
      .then(r => r.json())
      .then(json => { if (json.ok) setVehicleState(json.data); });
  }, [unlocked]);

  const runCmd = useCallback(async (command: string, body?: object) => {
    const res = await fetch('/api/tesla/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? '',
      },
      body: JSON.stringify({ command, ...body }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    setToast({ msg: `✅ ${command} — succès`, ok: true });
    setTimeout(() => setToast(null), 3000);
    // Refresh state after command
    setTimeout(async () => {
      const sr = await fetch('/api/tesla/state');
      const sj = await sr.json();
      if (sj.ok) setVehicleState(sj.data);
    }, 4000);
  }, []);

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  const v = vehicleState;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: '80px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
          background: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(227,25,55,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.4)' : 'rgba(227,25,55,0.4)'}`,
          borderRadius: '12px', padding: '12px 20px', color: 'white', fontSize: '14px',
          backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <ChevronLeft size={16} /> Accueil
            </Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Panneau de contrôle Tesla</span>
          </div>
          <Link href="/live" style={{ background: 'var(--surface)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', border: '1px solid var(--border)' }}>
            ← Live
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>Panneau Admin</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'var(--surface)', borderRadius: '12px', padding: '6px', width: 'fit-content' }}>
          {[
            { id: 'bookings', label: '📋 Réservations & Permis', icon: ClipboardList },
            { id: 'vehicle',  label: '🚗 Contrôle véhicule',     icon: Car },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: activeTab === id ? 'var(--red)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--muted)',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bookings tab */}
        {activeTab === 'bookings' && (
          <section style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Réservations</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                  Vérifiez chaque permis sur SAAQ avant d'approuver. Le bouton copie le numéro et ouvre SAAQclic Entreprises.
                </p>
              </div>
              <a
                href="https://saaqclic-entreprises.saaq.gouv.qc.ca/saaqstorefront/fr/login"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
              >
                <ExternalLink size={13} /> SAAQclic Entreprises
              </a>
            </div>
            <BookingsPanel />
          </section>
        )}

        {/* Vehicle control tab */}
        {activeTab === 'vehicle' && (
          <>
          {v && (
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '32px' }}>
            {v.battery}% · {v.rangeKm} km · {v.locked ? '🔒 Verrouillé' : '🔓 Déverrouillé'} · {v.online ? '🟢 En ligne' : '🔴 Hors ligne'}
          </p>
          )}

        {/* ── SECTION: Accès & Alertes ───────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Accès & Alertes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: '12px' }}>
            <CmdBtn icon={Unlock}   label="Déverrouiller" command="unlock" color="green" onRun={runCmd} />
            <CmdBtn icon={Lock}     label="Verrouiller"   command="lock"   color="red"   onRun={runCmd} />
            <CmdBtn icon={Volume2}  label="Klaxon"        command="honk"                 onRun={runCmd} />
            <CmdBtn icon={Zap}      label="Flash lueurs"  command="flash"  color="amber" onRun={runCmd} />
            <CmdBtn icon={BellRing} label="Klaxon + Flash" command="honkAndFlash" color="amber" onRun={runCmd} />
          </div>
        </section>

        {/* ── SECTION: Ouvrants ─────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Ouvrants</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: '12px' }}>
            <CmdBtn icon={Car}  label="Coffre"        sublabel="Ouvrir" command="openTrunk"  onRun={runCmd} />
            <CmdBtn icon={Car}  label="Frunk"         sublabel="Ouvrir" command="openFrunk"  onRun={runCmd} />
            <CmdBtn icon={Wind} label="Fenêtres"      sublabel="Ventiler" command="ventWindows"  color="blue" onRun={runCmd} />
            <CmdBtn icon={Wind} label="Fenêtres"      sublabel="Fermer"   command="closeWindows" color="red"  onRun={runCmd} />
          </div>
        </section>

        {/* ── SECTION: Climatisation ────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Climatisation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <CmdBtn icon={Thermometer} label="Démarrer"  command="startClimate" color="blue"  onRun={runCmd} />
                <CmdBtn icon={Snowflake}   label="Arrêter"   command="stopClimate"  color="red"   onRun={runCmd} />
                <CmdBtn icon={Snowflake}   label="Dégivrage" command="defrostOn"    color="amber" onRun={runCmd} />
              </div>
              {/* Temp slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Température cible</span>
                  <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{tempTarget}°C</span>
                </div>
                <input
                  type="range" min={15} max={30} step={0.5}
                  value={tempTarget}
                  onChange={e => setTempTarget(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  <span>15°C</span><span>30°C</span>
                </div>
                <button
                  onClick={() => runCmd('setTemp', { driverTemp: tempTarget })}
                  style={{ width: '100%', marginTop: '12px', background: 'var(--blue)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                >
                  Appliquer {tempTarget}°C
                </button>
              </div>
            </div>

            {/* Seat heaters */}
            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Sièges chauffants</div>
              {['Conducteur', 'Passager', 'AR gauche', 'AR centre', 'AR droit'].map((label, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0, 1, 2, 3].map(level => (
                      <button
                        key={level}
                        onClick={() => {
                          const next = [...seatLevels];
                          next[i] = level;
                          setSeatLevels(next);
                          runCmd('seatHeater', { seat: i, level });
                        }}
                        style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          background: seatLevels[i] >= level && level > 0 ? 'rgba(227,25,55,0.3)' : 'var(--surface2)',
                          border: `1px solid ${seatLevels[i] === level ? 'var(--red)' : 'var(--border)'}`,
                          color: seatLevels[i] >= level && level > 0 ? 'var(--red)' : 'var(--muted)',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        }}
                      >
                        {level === 0 ? '○' : level}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION: Recharge ─────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Recharge</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <CmdBtn icon={Zap} label="Démarrer charge"  command="startCharge"    color="green" onRun={runCmd} />
              <CmdBtn icon={Zap} label="Arrêter charge"   command="stopCharge"     color="red"   onRun={runCmd} />
              <CmdBtn icon={Zap} label="Ouvrir port"      command="openChargePort" color="blue"  onRun={runCmd} />
              <CmdBtn icon={Zap} label="Fermer port"      command="closeChargePort"              onRun={runCmd} />
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Limite de charge</span>
                <span style={{ fontWeight: 700, color: 'var(--green)' }}>{chargeTarget}%</span>
              </div>
              <input
                type="range" min={50} max={100} step={5}
                value={chargeTarget}
                onChange={e => setChargeTarget(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--green)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                <span>50%</span><span>80% (recommandé)</span><span>100%</span>
              </div>
              <button
                onClick={() => runCmd('setChargeLimit', { percent: chargeTarget })}
                style={{ width: '100%', marginTop: '12px', background: 'var(--green)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                Appliquer {chargeTarget}%
              </button>
            </div>
          </div>
        </section>

        {/* ── SECTION: Sécurité ─────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Sécurité & Modes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Mode Sentry</div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.6 }}>
                Surveillance 24/7 par caméras. Enregistre automatiquement tout incident détecté autour du véhicule.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <CmdBtn icon={Shield} label="Sentry ON"  command="setSentry" body={{ on: true }}  color="green" active={v?.sentryMode} onRun={runCmd} />
                <CmdBtn icon={Shield} label="Sentry OFF" command="setSentry" body={{ on: false }} color="red"   onRun={runCmd} />
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Mode Valet</div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.6 }}>
                Limite l'accès aux paramètres et la vitesse max. Protège la Tesla lors des remises à des tiers.
              </p>
              <input
                type="text"
                placeholder="PIN valet (4 chiffres)"
                value={valetPin}
                onChange={e => setValetPin(e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'white', fontSize: '14px', outline: 'none' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <CmdBtn icon={Key} label="Valet ON"  command="setValet" body={{ on: true,  pin: valetPin }} color="amber" active={v?.valetMode} onRun={runCmd} />
                <CmdBtn icon={Key} label="Valet OFF" command="setValet" body={{ on: false }} color="red" onRun={runCmd} />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: Système ──────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Système</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '12px' }}>
            <CmdBtn icon={Activity}  label="Wake up"          sublabel="Réveiller"     command="wake"          color="blue" onRun={runCmd} />
            <CmdBtn icon={Settings}  label="Màj logiciel"     sublabel="Planifier"     command="scheduleUpdate" color="amber" onRun={runCmd} />
          </div>
        </section>
        </>
        )}
      </div>
    </div>
  );
}
