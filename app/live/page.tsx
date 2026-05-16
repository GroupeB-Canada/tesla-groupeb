'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Battery, Zap, Thermometer, MapPin, Navigation,
  Lock, Unlock, Wind, Car, AlertTriangle, RefreshCw,
  ChevronLeft, Gauge, Clock, Activity
} from 'lucide-react';

interface VehicleState {
  online: boolean;
  battery: number;
  rangeKm: number;
  charging: string;
  chargeRate: number;
  minutesLeft: number;
  chargeLimit: number;
  locked: boolean;
  doorsOpen: boolean;
  trunkOpen: boolean;
  frunkOpen: boolean;
  windowsOpen: boolean;
  climateOn: boolean;
  insideTemp: number;
  outsideTemp: number;
  driverTemp: number;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  odometer: number;
  softwareVersion: string;
  updateAvailable: boolean;
  sentryMode: boolean;
  valetMode: boolean;
}

const REFRESH_INTERVAL = 30_000; // 30s

function BatteryGauge({ pct, rangeKm, charging }: { pct: number; rangeKm: number; charging: string }) {
  const color = pct > 50 ? 'var(--green)' : pct > 20 ? 'var(--amber)' : 'var(--red)';
  const isCharging = charging === 'Charging';
  return (
    <div style={{ textAlign: 'center' }}>
      {/* SVG arc gauge */}
      <svg width="180" height="110" viewBox="0 0 180 110" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="battGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#E31937" />
            <stop offset="50%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path d="M 15 95 A 75 75 0 0 1 165 95" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        {/* Fill — calculated based on pct */}
        <path
          d="M 15 95 A 75 75 0 0 1 165 95"
          fill="none"
          stroke="url(#battGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 188} 188`}
        />
        {/* Center text */}
        <text x="90" y="78" textAnchor="middle" fill="white" fontSize="32" fontWeight="800">{pct}%</text>
        <text x="90" y="98" textAnchor="middle" fill="#888" fontSize="12">{rangeKm} km</text>
        {isCharging && (
          <text x="90" y="112" textAnchor="middle" fill="#22c55e" fontSize="11">⚡ En charge</text>
        )}
      </svg>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(227,25,55,0.1)',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(227,25,55,0.3)'}`,
      borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500,
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ok ? 'var(--green)' : 'var(--red)' }} />
      {label}
    </div>
  );
}

export default function LivePage() {
  const [state, setState] = useState<VehicleState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const marker = useRef<any>(null);
  const scMarkers = useRef<any[]>([]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/tesla/state');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setState(json.data);
      setLastUpdate(new Date());
      setError('');
      setCountdown(30);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    (async () => {
      const L = (await import('leaflet')).default;
      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:#E31937;border-radius:50%;border:3px solid white;box-shadow:0 0 20px rgba(227,25,55,0.6);display:flex;align-items:center;justify-content:center;">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3m-8 7 1-4 9 2-9 2-1-4Z"/></svg>
               </div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      marker.current = L.marker([46.0, -73.7], { icon }).addTo(map);
      map.setView([46.0, -73.7], 14);
      leafletMap.current = map;
    })();
  }, []);

  // Update map when state changes
  useEffect(() => {
    if (!state || !leafletMap.current || !marker.current) return;
    if (state.lat && state.lng) {
      marker.current.setLatLng([state.lat, state.lng]);
      leafletMap.current.setView([state.lat, state.lng], 14);

      // Fetch nearby superchargers
      fetch(`/api/tesla/superchargers?lat=${state.lat}&lng=${state.lng}`)
        .then(r => r.json())
        .then(json => {
          if (!json.ok) return;
          const L = require('leaflet');
          scMarkers.current.forEach(m => m.remove());
          scMarkers.current = (json.data ?? []).map((sc: any) => {
            const icon = L.divIcon({
              html: `<div style="width:24px;height:24px;background:#3b82f6;border-radius:50%;border:2px solid rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:700">⚡</div>`,
              className: '',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });
            return L.marker([sc.lat, sc.lng], { icon })
              .bindPopup(`<b>${sc.name}</b><br>${sc.available}/${sc.stalls} stalls`)
              .addTo(leafletMap.current);
          });
        })
        .catch(() => {});
    }
  }, [state]);

  // Auto-refresh
  useEffect(() => {
    fetchState();
    const fetchTimer = setInterval(fetchState, REFRESH_INTERVAL);
    const countdownTimer = setInterval(() => {
      setCountdown(c => (c <= 1 ? 30 : c - 1));
    }, 1000);
    return () => { clearInterval(fetchTimer); clearInterval(countdownTimer); };
  }, [fetchState]);

  const chargingColor = (s: string) => {
    if (s === 'Charging') return 'var(--green)';
    if (s === 'Complete') return 'var(--blue)';
    return 'var(--muted)';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: '60px' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <ChevronLeft size={16} /> Accueil
            </Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot" style={{ background: state?.online ? 'var(--green)' : 'var(--muted)' }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Tesla Live</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Actualisation dans {countdown}s
            </span>
            <button onClick={fetchState} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <RefreshCw size={14} /> Rafraîchir
            </button>
            <Link href="/admin" style={{ background: 'var(--red)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
              Admin →
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 24px 0' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)' }}>
            <Activity size={32} style={{ margin: '0 auto 16px', color: 'var(--red)', animation: 'pulse-anim 1s infinite' }} />
            <p>Connexion à la Tesla Fleet API…</p>
          </div>
        )}

        {error && (
          <div className="card" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', borderColor: 'rgba(227,25,55,0.3)' }}>
            <AlertTriangle size={32} color="var(--red)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)' }}>{error}</p>
            <button onClick={fetchState} style={{ marginTop: '16px', background: 'var(--red)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>
        )}

        {state && !loading && (
          <>
            {/* Status bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusBadge ok={state.online} label={state.online ? 'En ligne' : 'Hors ligne'} />
              <StatusBadge ok={state.locked} label={state.locked ? 'Verrouillée' : 'Déverrouillée'} />
              {state.sentryMode && <StatusBadge ok={true} label="Sentry actif" />}
              {state.valetMode  && <StatusBadge ok={false} label="Mode valet" />}
              {state.updateAvailable && <StatusBadge ok={false} label="Mise à jour dispo" />}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted)' }}>
                Mis à jour: {lastUpdate?.toLocaleTimeString('fr-CA')}
              </span>
            </div>

            {/* Main 3-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: '16px', marginBottom: '16px' }}>

              {/* Left — Battery + charge */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card glow-red" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Batterie</div>
                  <BatteryGauge pct={state.battery} rangeKm={state.rangeKm} charging={state.charging} />
                  {/* Charge limit bar */}
                  <div style={{ marginTop: '16px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                      <span>Limite charge</span>
                      <span>{state.chargeLimit}%</span>
                    </div>
                    <div className="battery-bar">
                      <div className="battery-fill" style={{ width: `${state.chargeLimit}%`, background: 'var(--blue)' }} />
                    </div>
                  </div>
                </div>

                {/* Charging info */}
                <div className="card">
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Recharge</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { label: 'Statut',        value: state.charging,       color: chargingColor(state.charging) },
                      { label: 'Vitesse',        value: `${state.chargeRate} km/h`, color: 'white' },
                      { label: 'Temps restant',  value: state.minutesLeft > 0 ? `${state.minutesLeft} min` : '—', color: 'white' },
                      { label: 'Limite',         value: `${state.chargeLimit}%`, color: 'white' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Odometer + Speed */}
                <div className="card">
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Conduite</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>Vitesse</div>
                      <div style={{ fontSize: '22px', fontWeight: 700 }}>{state.speed}<span style={{ fontSize: '12px', color: 'var(--muted)' }}> km/h</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>Odomètre</div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>{state.odometer.toLocaleString('fr-CA')}<span style={{ fontSize: '11px', color: 'var(--muted)' }}> km</span></div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={14} color="var(--muted)" style={{ transform: `rotate(${state.heading}deg)` }} />
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{state.heading}°</span>
                  </div>
                </div>
              </div>

              {/* Center — Map */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: '500px' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />
                {/* Overlay: coords */}
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(10,10,10,0.85)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: 'var(--muted)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
                  <div><MapPin size={10} style={{ display: 'inline', marginRight: '4px' }} />{state.lat.toFixed(5)}, {state.lng.toFixed(5)}</div>
                </div>
              </div>

              {/* Right — Climate + doors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Climate */}
                <div className="card" style={{ borderColor: state.climateOn ? 'rgba(59,130,246,0.3)' : 'var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Climatisation</div>
                    <div style={{ fontSize: '11px', color: state.climateOn ? 'var(--blue)' : 'var(--muted)', fontWeight: 500 }}>
                      {state.climateOn ? 'ACTIVE' : 'OFF'}
                    </div>
                  </div>

                  {/* Temp display */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 800, color: state.climateOn ? 'var(--blue)' : 'white', letterSpacing: '-2px' }}>
                      {state.insideTemp.toFixed(1)}°
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Température intérieure</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>Extérieur</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{state.outsideTemp.toFixed(1)}°C</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>Consigne</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{state.driverTemp.toFixed(1)}°C</div>
                    </div>
                  </div>
                </div>

                {/* Doors & openings */}
                <div className="card">
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>État des ouvrants</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Portes',    ok: !state.doorsOpen,   okLabel: 'Fermées', badLabel: 'Ouvertes' },
                      { label: 'Coffre',    ok: !state.trunkOpen,   okLabel: 'Fermé',   badLabel: 'Ouvert' },
                      { label: 'Frunk',     ok: !state.frunkOpen,   okLabel: 'Fermé',   badLabel: 'Ouvert' },
                      { label: 'Fenêtres',  ok: !state.windowsOpen, okLabel: 'Fermées', badLabel: 'Ouvertes' },
                    ].map(({ label, ok, okLabel, badLabel }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: ok ? 'var(--green)' : 'var(--red)' }}>
                          {ok ? okLabel : badLabel}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Verrouillage</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: state.locked ? 'var(--green)' : 'var(--amber)' }}>
                        {state.locked ? '🔒 Verrouillé' : '🔓 Ouvert'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Software */}
                <div className="card">
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Logiciel</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{state.softwareVersion || '—'}</div>
                  {state.updateAvailable && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={12} /> Mise à jour disponible
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom info row */}
            <div className="card" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <Gauge size={20} color="var(--muted)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Version logiciel</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{state.softwareVersion || '—'}</div>
              </div>
              <div style={{ height: '30px', width: '1px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Mode sentry</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: state.sentryMode ? 'var(--green)' : 'var(--muted)' }}>
                  {state.sentryMode ? 'Actif' : 'Inactif'}
                </div>
              </div>
              <div style={{ height: '30px', width: '1px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Mode valet</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: state.valetMode ? 'var(--amber)' : 'var(--muted)' }}>
                  {state.valetMode ? 'Actif' : 'Inactif'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <Link href="/admin" style={{ background: 'var(--red)', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
                  Contrôler la Tesla →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
