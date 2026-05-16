import { NextRequest, NextResponse } from 'next/server';
import {
  unlock, lock,
  openTrunk, openFrunk,
  ventWindows, closeWindows,
  honk, flash, honkAndFlash,
  startClimate, stopClimate,
  setTemp, setPreconditioning,
  defrostOn, defrostOff,
  setSeatHeater,
  startCharge, stopCharge,
  openChargePort, closeChargePort,
  setChargeLimit, setChargingAmps,
  remoteStart,
  setSentryMode, setValetMode,
  scheduleUpdate,
  wake,
} from '@/lib/tesla';

const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN!;

// Map command name → handler
const COMMANDS: Record<string, (body: any) => Promise<any>> = {
  // Doors
  unlock:       ()    => unlock(),
  lock:         ()    => lock(),
  openTrunk:    ()    => openTrunk(),
  openFrunk:    ()    => openFrunk(),
  ventWindows:  ()    => ventWindows(),
  closeWindows: ()    => closeWindows(),

  // Alerts
  honk:         ()    => honk(),
  flash:        ()    => flash(),
  honkAndFlash: ()    => honkAndFlash(),

  // Climate
  startClimate: ()        => startClimate(),
  stopClimate:  ()        => stopClimate(),
  setTemp:      (b)       => setTemp(b.driverTemp ?? 20, b.passengerTemp ?? b.driverTemp ?? 20),
  precondition: (b)       => setPreconditioning(b.tempC ?? 20),
  defrostOn:    ()        => defrostOn(),
  defrostOff:   ()        => defrostOff(),
  seatHeater:   (b)       => setSeatHeater(b.seat ?? 0, b.level ?? 0),

  // Charging
  startCharge:    ()  => startCharge(),
  stopCharge:     ()  => stopCharge(),
  openChargePort: ()  => openChargePort(),
  closeChargePort:()  => closeChargePort(),
  setChargeLimit: (b) => setChargeLimit(b.percent ?? 80),
  setChargingAmps:(b) => setChargingAmps(b.amps ?? 16),

  // Security
  setSentry:   (b) => setSentryMode(b.on ?? true),
  setValet:    (b) => setValetMode(b.on ?? true, b.pin),
  remoteStart: (b) => remoteStart(b.password ?? ''),
  wake:        ()  => wake(),

  // Misc
  scheduleUpdate: () => scheduleUpdate(),
};

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('x-admin-token');
  if (authHeader !== ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { command: string } & Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const handler = COMMANDS[body.command];
  if (!handler) {
    return NextResponse.json({ ok: false, error: `Unknown command: ${body.command}` }, { status: 400 });
  }

  try {
    const result = await handler(body);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error(`[command:${body.command}]`, err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
