/**
 * Tesla Fleet API — tesla.groupeb.ca
 * Client ID: 4f772719-6fac-4cd1-9e34-eb476886bc60
 * All features: telemetry, commands, charging, navigation, climate
 */

const CLIENT_ID   = process.env.TESLA_CLIENT_ID!;
const CLIENT_SEC  = process.env.TESLA_CLIENT_SECRET!;
const AUDIENCE    = process.env.TESLA_AUDIENCE || 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const VIN         = process.env.TESLA_VEHICLE_VIN!;

// ─── TOKEN ──────────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string> {
  const res = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SEC,
      refresh_token: process.env.TESLA_REFRESH_TOKEN!,
    }),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

// ─── CORE CALL ───────────────────────────────────────────────────────────────

async function api<T = any>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${AUDIENCE}/api/1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Tesla API error (${path}): ${await res.text()}`);
  return res.json();
}

async function cmd(command: string, body?: object) {
  await wake();
  return api(`vehicles/${VIN}/command/${command}`, 'POST', body);
}

// ─── VEHICLE STATE ────────────────────────────────────────────────────────────

export interface VehicleState {
  online:         boolean;
  battery:        number;       // %
  rangeKm:        number;
  charging:       string;       // 'Charging' | 'Stopped' | 'Disconnected' | 'Complete'
  chargeRate:     number;       // km/h added
  minutesLeft:    number;
  chargeLimit:    number;       // %
  locked:         boolean;
  doorsOpen:      boolean;
  trunkOpen:      boolean;
  frunkOpen:      boolean;
  windowsOpen:    boolean;
  climateOn:      boolean;
  insideTemp:     number;       // °C
  outsideTemp:    number;
  driverTemp:     number;       // target
  lat:            number;
  lng:            number;
  heading:        number;       // degrees
  speed:          number;       // km/h
  odometer:       number;       // km
  softwareVersion:string;
  updateAvailable:boolean;
  sentryMode:     boolean;
  valetMode:      boolean;
}

export async function getVehicleState(): Promise<VehicleState> {
  const data = await api<any>(`vehicles/${VIN}/vehicle_data?endpoints=charge_state%3Bclimate_state%3Bdrive_state%3Bvehicle_state%3Bvehicle_config`);
  const r = data.response;
  const c = r.charge_state;
  const cl = r.climate_state;
  const d = r.drive_state;
  const v = r.vehicle_state;

  return {
    online:          r.state === 'online',
    battery:         c.battery_level ?? 0,
    rangeKm:         Math.round((c.battery_range ?? 0) * 1.60934),
    charging:        c.charging_state ?? 'Disconnected',
    chargeRate:      Math.round((c.charge_rate ?? 0) * 1.60934),
    minutesLeft:     c.minutes_to_full_charge ?? 0,
    chargeLimit:     c.charge_limit_soc ?? 80,
    locked:          v.locked ?? true,
    doorsOpen:       (v.df || v.dr || v.pf || v.pr) ? true : false,
    trunkOpen:       v.rt > 0,
    frunkOpen:       v.ft > 0,
    windowsOpen:     (v.fd_window || v.rd_window || v.fp_window || v.rp_window) ? true : false,
    climateOn:       cl.is_climate_on ?? false,
    insideTemp:      cl.inside_temp ?? 0,
    outsideTemp:     cl.outside_temp ?? 0,
    driverTemp:      cl.driver_temp_setting ?? 20,
    lat:             d.latitude ?? 0,
    lng:             d.longitude ?? 0,
    heading:         d.heading ?? 0,
    speed:           Math.round((d.speed ?? 0) * 1.60934),
    odometer:        Math.round((v.odometer ?? 0) * 1.60934),
    softwareVersion: v.car_version ?? '',
    updateAvailable: v.software_update?.status === 'available',
    sentryMode:      v.sentry_mode ?? false,
    valetMode:       v.valet_mode ?? false,
  };
}

// ─── WAKE ─────────────────────────────────────────────────────────────────────

export async function wake(): Promise<void> {
  await api(`vehicles/${VIN}/wake_up`, 'POST');
  await new Promise(r => setTimeout(r, 6000));
}

// ─── DOOR CONTROL ────────────────────────────────────────────────────────────

export const unlock      = () => cmd('door_unlock');
export const lock        = () => cmd('door_lock');
export const openTrunk   = () => cmd('actuate_trunk',  { which_trunk: 'rear' });
export const openFrunk   = () => cmd('actuate_trunk',  { which_trunk: 'front' });
export const ventWindows = () => cmd('window_control', { command: 'vent',  lat: 0, lon: 0 });
export const closeWindows= () => cmd('window_control', { command: 'close', lat: 0, lon: 0 });

// ─── ALERTS ──────────────────────────────────────────────────────────────────

export const honk        = () => cmd('honk_horn');
export const flash       = () => cmd('flash_lights');
export const honkAndFlash= async () => { await honk(); await flash(); };

// ─── CLIMATE ─────────────────────────────────────────────────────────────────

export const startClimate = () => cmd('auto_conditioning_start');
export const stopClimate  = () => cmd('auto_conditioning_stop');
export const setTemp      = (driverC: number, passengerC = driverC) =>
  cmd('set_temps', { driver_temp: driverC, passenger_temp: passengerC });
export const setPreconditioning = async (tempC: number) => {
  await setTemp(tempC);
  await startClimate();
};
export const defrostOn    = () => cmd('set_preconditioning_max', { on: true });
export const defrostOff   = () => cmd('set_preconditioning_max', { on: false });
export const setSeatHeater= (seat: 0|1|2|3|4|5, level: 0|1|2|3) =>
  cmd('remote_seat_heater_request', { heater: seat, level });

// ─── CHARGING ────────────────────────────────────────────────────────────────

export const startCharge     = () => cmd('charge_start');
export const stopCharge      = () => cmd('charge_stop');
export const openChargePort  = () => cmd('charge_port_door_open');
export const closeChargePort = () => cmd('charge_port_door_close');
export const setChargeLimit  = (pct: number) => cmd('set_charge_limit', { percent: pct });
export const setChargingAmps = (amps: number) => cmd('set_charging_amps', { charging_amps: amps });

// ─── MEDIA & CONTROLS ────────────────────────────────────────────────────────

export const remoteStart     = (pass: string) => cmd('remote_start_drive', { password: pass });
export const setSentryMode   = (on: boolean)  => cmd('set_sentry_mode',    { on });
export const setValetMode    = (on: boolean, pin?: string) =>
  cmd('set_valet_mode', { on, password: pin });
export const scheduleUpdate  = () => cmd('schedule_software_update', { offset_sec: 0 });

// ─── SUPERCHARGERS NEARBY ────────────────────────────────────────────────────

export interface Supercharger {
  name:        string;
  lat:         number;
  lng:         number;
  distanceKm:  number;
  stalls:      number;
  available:   number;
  fastCharger: boolean;
}

export async function getNearbySuperchargers(lat: number, lng: number): Promise<Supercharger[]> {
  // Tesla Fleet API returns nearby charging sites
  const token = await getAccessToken();
  const res = await fetch(
    `${AUDIENCE}/api/1/charging-sites/near?latitude=${lat}&longitude=${lng}&count=10`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.response?.superchargers ?? []).map((sc: any) => ({
    name:        sc.name,
    lat:         sc.location?.lat ?? 0,
    lng:         sc.location?.long ?? 0,
    distanceKm:  Math.round(sc.distance_miles * 1.60934 * 10) / 10,
    stalls:      sc.total_stalls ?? 0,
    available:   sc.available_stalls ?? 0,
    fastCharger: sc.site_type === 'supercharger',
  }));
}

// ─── TRIP STATS ──────────────────────────────────────────────────────────────

export interface TripStats {
  startOdometer: number;
  endOdometer:   number;
  distanceKm:    number;
  energyKwh:     number;
  avgConsumption:number; // Wh/km
  duration:      number; // minutes
}

export function calcTripStats(
  startOdo: number, startBattery: number, startTime: Date,
  endOdo: number,   endBattery: number,   endTime: Date,
  batteryKwh = 82   // Model 3 Long Range
): TripStats {
  const distanceKm   = endOdo - startOdo;
  const energyKwh    = ((startBattery - endBattery) / 100) * batteryKwh;
  const duration     = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  const avgConsumption = distanceKm > 0 ? Math.round((energyKwh * 1000) / distanceKm) : 0;
  return { startOdometer: startOdo, endOdometer: endOdo, distanceKm, energyKwh: Math.round(energyKwh * 10)/10, avgConsumption, duration };
}
