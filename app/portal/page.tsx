'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Unlock, Lock, MapPin, Thermometer, Volume2, Zap,
  Car, ChevronLeft, AlertTriangle, CheckCircle, Loader2,
  Battery, Clock, Navigation
} from 'lucide-react';

interface VehicleState {
  online: boolean;
  battery: number;
  rangeKm: number;
  charging: string;
  locked: boolean;
  climateOn: boolean;
  insideTemp: number;
  outsideTemp: number;
  driverTemp: number;
  lat: number;
  lng: number;
  speed: number;
  sentryMode: boolean;
}

function PortalBtn({
  icon: Icon, label, sublabel, onClick, color = 'default', active = false, disabled = false,
}: {
  icon: any; label: string; sublabel?: string;
  onClick: () => void; color?: 'green' | 'red' | 'blue' | 'amber' | 'default';
  active?: boolean; disabled?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  const handle = async () => {
    if (disabled || status === 'loading') return;
    setStatus('loading');
    try {
      await onClick();
      setStatus('ok');
    } catch {
      setStatus('err');
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  const colors: Record<string, string> = {
    green: 'rgba(34,197,94,0.15)',
    red:   'rgba(227,25,55,0.15)',
    blue:  'rgba(59,130,246,0.15)',
    amber: 'rgba(245,158,11,0.15)',
    default: 'var(--surface2)',
  };
  const borders: Record<string, string> = {
    green: 'rgba(34,197,94,0.4)',
    red:   'rgba(227,25,55,0.4)',
    blue:  'rgba(59,130,246,0.4)',
    amber: 'rgba(245,158,11,0.4)',
    default: 'var(--border)',
  };

  return (
    <button
      onClick={handle}
      disabled={disabled || status === 'loading'}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        background: active ? colors[color] : 'var(--surface2)',
        border: `1px solid ${active ? borders[color] : 'var(--border)'}`,
        borderRadius: '16px', padding: '1.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', color: 'white',
        opacity: disabled ? 0.5 : 1,
        position: 'relative', minHeight: '110px',
      }}
    >
      {status === 'loading'
        ? <Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} />
        : <Icon size={26} color={active ? ({
            green: 'var(--green)', red: 'var(--red)', blue: 'var(--blue)',
            amber: 'var(--amber)', default: 'white',
          })[color] : 'var(--muted)'} />
      }
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>{label}</div>
        {sublabel && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{sublabel}</div>}
      </div>
      {status === 'ok'  && <CheckCircle size={14} color="var(--green)" style={{ position: 'absolute', top: '10px', right: '10px' }} />}
      {status === 'err' && <AlertTriangle size={14} color="var(--red)"  style={{ position: 'absolute', top: '10px', right: '10px' }} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

async function sendCmd(command: string, body?: object) {
  const res = await fetch('/api/tesla/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': '' },
    body: JSON.stringify({ command, ...body }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
}

export default function PortalPage() {
  const [state, setState] = useState<VehicleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempSet, setTempSet] = useState(20);
  const mapRef  = useRef<HTMLDivElement>(null);
  const leafMap = useRef<any>(null);
  const pin     = useRef<any>(null);

  const load = async () => {
    try {
      const r = await fetch('/api/tesla/state');
      const j = await r.json();
      if (j.ok) {
        setState(j.data);
        setTempSet(j.data.driverTemp ?? 20);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!state || !mapRef.current || leafMap.current) return;
    (async () => {
      const L = (await import('leaflet')).default;
      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const icon = L.divIcon({
        html: `<div style="width:44px;height:44px;background:#E31937;border-radius:50%;border:3px solid white;box-shadow:0 0 30px rgba(227,25,55,0.7);display:flex;align-items:center;justify-content:center;">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3m-8 7 1-4 9 2-9 2-1-4Z"/></svg>
               </div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      pin.current = L.marker([state.lat || 46.05, state.lng || -73.71], { icon })
        .bindPopup('<b>Tesla Model 3</b><br>Votre véhicule')
        .addTo(map);
      map.setView([state.lat || 46.05, state.lng || -73.71], 15);
      leafMap.current = map;
    })();
  }, [state]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={40} color="var(--red)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const s = state;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: '60px' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <ChevronLeft size={16} /> Accueil
            </Link>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Portail client</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pulse-dot" style={{ background: s?.online ? 'var(--green)' : 'var(--muted)' }} />
            <span style={{ fontSize: '12px', color: s?.online ? 'var(--green)' : 'var(--muted)', fontWeight: 500 }}>
              {s?.online ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px 0' }}>
        <div style={{ paddingTop: '32px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Ma Tesla Model 3</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Contrôlez votre véhicule pendant votre location</p>
        </div>

        {/* Status bar */}
        {s && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { icon: Battery,     label: 'Batterie',   value: `${s.battery}%`, sub: `${s.rangeKm} km`, color: s.battery < 20 ? 'var(--red)' : s.battery < 50 ? 'var(--amber)' : 'var(--green)' },
              { icon: Lock,        label: 'Accès',      value: s.locked ? 'Verrouillé' : 'Ouvert', sub: '', color: s.locked ? 'var(--green)' : 'var(--amber)' },
              { icon: Thermometer, label: 'Intérieur',  value: `${s.insideTemp.toFixed(1)}°C`, sub: `Extérieur ${s.outsideTemp.toFixed(1)}°C`, color: 'white' },
              { icon: Zap,         label: 'Recharge',   value: s.charging, sub: '', color: s.charging === 'Charging' ? 'var(--green)' : 'var(--muted)' },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                <Icon size={18} color={color} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color }}>{value}</div>
                {sub && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px', borderRadius: '16px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--red)" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Localisation en temps réel</span>
            {s && <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: 'auto' }}>{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</span>}
          </div>
          <div ref={mapRef} style={{ height: '300px' }} />
        </div>

        {/* Primary actions */}
        <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Accès au véhicule</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <PortalBtn icon={Unlock}  label="Déverrouiller"  sublabel="Ouvrir les portes"    color="green" active={!s?.locked}  onClick={() => sendCmd('unlock')} />
          <PortalBtn icon={Lock}    label="Verrouiller"    sublabel="Sécuriser la Tesla"   color="red"   active={!!s?.locked} onClick={() => sendCmd('lock')} />
          <PortalBtn icon={Volume2} label="Klaxon + Flash" sublabel="Repérer la voiture"   color="amber"  onClick={() => sendCmd('honkAndFlash')} />
          <PortalBtn icon={Car}     label="Ouvrir coffre"  sublabel="Déverrouiller"         onClick={() => sendCmd('openTrunk')} />
        </div>

        {/* Climate */}
        <h2 style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Climatisation</h2>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '16px', alignItems: 'center' }}>
            <PortalBtn icon={Thermometer} label="Démarrer clim"  sublabel="Préconditionner" color="blue" active={!!s?.climateOn} onClick={() => sendCmd('startClimate')} />
            <PortalBtn icon={Thermometer} label="Arrêter clim"   sublabel="Éteindre"        color="red"  onClick={() => sendCmd('stopClimate')} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Température cible</span>
                <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{tempSet}°C</span>
              </div>
              <input
                type="range" min={16} max={28} step={0.5}
                value={tempSet}
                onChange={e => setTempSet(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }}
              />
              <button
                onClick={() => sendCmd('setTemp', { driverTemp: tempSet })}
                style={{ width: '100%', marginTop: '10px', background: 'var(--blue)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
              >
                Appliquer {tempSet}°C
              </button>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'white' }}>Besoin d'aide ?</strong><br />
            Contactez-nous à <a href="mailto:info@groupeb.ca" style={{ color: 'var(--red)', textDecoration: 'none' }}>info@groupeb.ca</a> ou consultez notre{' '}
            <Link href="/" style={{ color: 'var(--red)', textDecoration: 'none' }}>page d'accueil</Link>.
          </div>
          <div style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            <Link href="/live" style={{ background: 'var(--surface2)', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '13px', border: '1px solid var(--border)' }}>
              Vue Live →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
