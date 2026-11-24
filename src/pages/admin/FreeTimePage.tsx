import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bike, Clock3, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { firebaseConfig, isFirebaseEmulatorEnabled } from '@/lib/firebase';
import { finishFreeTimeRental, listFreeTimeRentals, startFreeTimeRental, type FreeTimeSessionView } from '@/lib/backend';
import { isFreeTimeEmulatorUiEnabled } from '@/lib/freeTimeFeature';

const uiEnabled = isFreeTimeEmulatorUiEnabled({
  development: import.meta.env.DEV,
  emulatorEnabled: isFirebaseEmulatorEnabled,
  projectId: firebaseConfig.projectId,
  explicitFlag: import.meta.env.VITE_ENABLE_FREE_TIME_EMULATOR,
});

type PendingStart = { fingerprint: string; key: string; itemId: string; store: string; wheelSize?: string; customerId?: string };
type PendingFinish = { fingerprint: string; key: string };
const pendingStorageKey = 'briz_free_time_start_pending';

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const rest = seconds % 60;
  const parts = [days ? `${days} d` : '', `${String(hours).padStart(2, '0')} h`, `${String(minutes).padStart(2, '0')} min`, `${String(rest).padStart(2, '0')} s`].filter(Boolean);
  return parts.join(' ');
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'No se pudo completar la operación. Revisa la conexión y vuelve a intentarlo.';
}

function readPendingStart(): PendingStart | null {
  try { return JSON.parse(sessionStorage.getItem(pendingStorageKey) || 'null') as PendingStart | null; }
  catch { return null; }
}

export default function FreeTimePage() {
  const { adminProfile } = useAuth();
  const { inventory, customers } = useStore();
  const [storedStartAttempt] = useState<PendingStart | null>(readPendingStart);
  const [sessions, setSessions] = useState<FreeTimeSessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedStore, setSelectedStore] = useState(storedStartAttempt?.store || (adminProfile?.store && adminProfile.store !== 'all' ? adminProfile.store : ''));
  const [selectedItem, setSelectedItem] = useState(storedStartAttempt?.itemId || '');
  const [wheelSize, setWheelSize] = useState(storedStartAttempt?.wheelSize || '');
  const [customerId, setCustomerId] = useState(storedStartAttempt?.customerId || '');
  const [pendingStart, setPendingStart] = useState<PendingStart | null>(storedStartAttempt);
  const [finishing, setFinishing] = useState('');
  const [finishTarget, setFinishTarget] = useState<FreeTimeSessionView | null>(null);
  const [damaged, setDamaged] = useState(false);
  const [conditionNotes, setConditionNotes] = useState('');
  const [serverClock, setServerClock] = useState({ now: Date.now(), performance: performance.now() });
  const [, setTick] = useState(0);

  const stores = useMemo(() => [...new Set(inventory
    .filter((item) => item.itemType === 'bike' && item.active && item.availableForRental)
    .map((item) => item.store || 'Cochabamba'))].sort(), [inventory]);
  const visibleInventory = useMemo(() => inventory.filter((item) => item.itemType === 'bike'
    && item.active && item.availableForRental
    && (item.store === undefined || item.store === 'all' || item.store === selectedStore)), [inventory, selectedStore]);
  const selectedBike = visibleInventory.find((item) => item.id === selectedItem);
  const availableStock = selectedBike
    ? selectedBike.hasWheelSizes
      ? Math.max(0, Number(selectedBike.wheelSizes?.find((wheel) => wheel.size === wheelSize)?.stock) || 0)
      : Math.max(0, Number(selectedBike.stock) || 0)
    : 0;
  const activeSessions = sessions.filter((session) => session.freeTimeState === 'active');
  const historySessions = sessions.filter((session) => session.freeTimeState === 'closed');

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    try {
      const response = await listFreeTimeRentals();
      setSessions(response.sessions);
      setServerClock({ now: response.serverNowMs, performance: performance.now() });
      setError('');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!uiEnabled) return;
    void refresh();
    const refreshTimer = window.setInterval(() => void refresh(true), 30_000);
    const tickTimer = window.setInterval(() => setTick((value) => value + 1), 1_000);
    return () => { window.clearInterval(refreshTimer); window.clearInterval(tickTimer); };
  }, [refresh]);

  useEffect(() => {
    if (adminProfile?.store && adminProfile.store !== 'all') setSelectedStore(adminProfile.store);
    else if (!selectedStore && stores.length) setSelectedStore(stores[0]);
  }, [adminProfile?.store, selectedStore, stores]);

  useEffect(() => {
    if (!selectedBike?.hasWheelSizes) setWheelSize('');
    else if (!selectedBike.wheelSizes?.some((wheel) => wheel.size === wheelSize && Number(wheel.stock) > 0)) {
      setWheelSize(selectedBike.wheelSizes?.find((wheel) => Number(wheel.stock) > 0)?.size || '');
    }
  }, [selectedBike, wheelSize]);

  const start = async () => {
    if (!selectedBike || !selectedStore) return;
    const draft = { itemId: selectedBike.id, store: selectedStore, ...(wheelSize ? { wheelSize } : {}), ...(customerId ? { customerId } : {}) };
    const fingerprint = JSON.stringify(draft);
    const attempt = pendingStart?.fingerprint === fingerprint
      ? pendingStart
      : { ...draft, fingerprint, key: `ft_${crypto.randomUUID().replaceAll('-', '')}` };
    setPendingStart(attempt);
    sessionStorage.setItem(pendingStorageKey, JSON.stringify(attempt));
    setNotice(''); setError('');
    try {
      const result = await startFreeTimeRental({ ...draft, idempotencyKey: attempt.key });
      setNotice(result.duplicate ? `Inicio recuperado: ${result.reservationCode}.` : `Sesión iniciada: ${result.reservationCode}.`);
      setPendingStart(null); sessionStorage.removeItem(pendingStorageKey);
      await refresh(true);
    } catch (cause) {
      setError(`${errorMessage(cause)} Si la respuesta fue ambigua, reintenta sin cambiar los datos; se conservará la misma clave idempotente.`);
    }
  };

  const finish = async () => {
    if (!finishTarget) return;
    setFinishing(finishTarget.id); setError(''); setNotice('');
    const fingerprint = JSON.stringify({ sessionId: finishTarget.id, damaged, conditionNotes: conditionNotes.trim() });
    const keyStorage = `briz_free_time_finish_${finishTarget.id}`;
    let attempt: PendingFinish | null = null;
    try { attempt = JSON.parse(sessionStorage.getItem(keyStorage) || 'null') as PendingFinish | null; } catch { /* use a new operation key */ }
    if (!attempt || attempt.fingerprint !== fingerprint) {
      attempt = { fingerprint, key: `ft_${crypto.randomUUID().replaceAll('-', '')}` };
      sessionStorage.setItem(keyStorage, JSON.stringify(attempt));
    }
    try {
      const result = await finishFreeTimeRental({
        sessionId: finishTarget.id, idempotencyKey: attempt.key, damaged,
        conditionNotes: conditionNotes.trim() || undefined,
      });
      setNotice(result.duplicate ? 'La devolución ya estaba registrada; no se modificó el stock de nuevo.' : `Sesión cerrada. Tiempo registrado por servidor: ${formatElapsed(result.elapsedMilliseconds)}.`);
      sessionStorage.removeItem(keyStorage);
      setFinishTarget(null); setDamaged(false); setConditionNotes('');
      await refresh(true);
    } catch (cause) {
      setError(`${errorMessage(cause)} Puedes reintentar sin duplicar la devolución.`);
    } finally { setFinishing(''); }
  };

  if (!uiEnabled) return (
    <main className="mx-auto max-w-2xl p-6 sm:p-10">
      <Card className="border-amber-300 bg-amber-50"><CardContent className="flex gap-3 p-6 text-amber-950">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div><h1 className="font-black">Tiempo Libre no está habilitado</h1><p className="mt-2 text-sm">Esta fase funciona únicamente en Vite development con Firebase Emulator y activación explícita.</p></div>
      </CardContent></Card>
    </main>
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 pb-12 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Modo Emulator — no Production</p><h1 className="mt-1 text-2xl font-black text-stone-950 sm:text-3xl">Tiempo Libre</h1><p className="mt-2 max-w-2xl text-sm text-stone-600">Control operativo de entrega y devolución. Esta fase no calcula importes ni registra pagos.</p></div>
        <Button variant="outline" onClick={() => void refresh(true)} disabled={refreshing} className="min-h-11 self-start sm:self-auto"><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Actualizar</Button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-900">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</div>}

      <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="border-stone-200"><CardContent className="space-y-4 p-4 sm:p-6">
          <div><h2 className="text-lg font-black text-stone-950">Iniciar sesión</h2><p className="mt-1 text-sm text-stone-500">El servidor valida stock, reservas y sucursal antes de entregar.</p></div>
          <label className="block text-sm font-bold text-stone-700">Sucursal
            <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)} disabled={!!adminProfile?.store && adminProfile.store !== 'all'} className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3">
              {stores.map((store) => <option key={store} value={store}>{store}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-stone-700">Bicicleta
            <select value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3">
              <option value="">Seleccionar bicicleta…</option>
              {visibleInventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          {selectedBike?.hasWheelSizes && <label className="block text-sm font-bold text-stone-700">Aro
            <select value={wheelSize} onChange={(event) => setWheelSize(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3">
              {(selectedBike.wheelSizes || []).map((wheel) => <option key={wheel.size} value={wheel.size} disabled={Number(wheel.stock) < 1}>{wheel.size} · {Math.max(0, Number(wheel.stock) || 0)} disponible(s)</option>)}
            </select>
          </label>}
          <label className="block text-sm font-bold text-stone-700">Cliente (opcional)
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3">
              <option value="">Cliente pendiente</option>
              {customers.filter((customer) => !customer.store || customer.store === selectedStore || customer.store === 'all').map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          {selectedBike && <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${availableStock > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>Stock visible: {availableStock}. Functions hará la comprobación definitiva.</p>}
          {pendingStart && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Hay un inicio con respuesta pendiente. Reintenta con los mismos datos para recuperar su resultado sin duplicarlo.</p>}
          <Button onClick={() => void start()} disabled={!selectedBike || !selectedStore || availableStock < 1 || loading} className="min-h-12 w-full bg-yellow-400 font-black text-stone-950 hover:bg-yellow-300">
            <Bike className="mr-2 h-4 w-4" />{pendingStart ? 'Reintentar inicio seguro' : 'Iniciar y entregar bicicleta'}
          </Button>
          {pendingStart && <button type="button" onClick={() => { setPendingStart(null); sessionStorage.removeItem(pendingStorageKey); }} className="w-full text-center text-xs font-bold text-stone-500 underline">Descartar reintento local</button>}
        </CardContent></Card>

        <Card className="border-stone-200"><CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-black text-stone-950">Sesiones activas</h2><p className="text-sm text-stone-500">{activeSessions.length} bicicleta(s) entregada(s)</p></div><Clock3 className="h-5 w-5 text-amber-700" /></div>
          {loading ? <p className="py-8 text-center text-sm text-stone-500">Cargando sesiones…</p> : activeSessions.length === 0 ? <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">No hay sesiones activas en la sucursal autorizada.</p> :
            <div className="space-y-3">{activeSessions.map((session) => {
              const nowMs = serverClock.now + Math.max(0, performance.now() - serverClock.performance);
              const elapsed = Math.max(0, nowMs - session.startedAtMs);
              return <article key={session.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-stone-950">{session.productName}</h3><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">En uso</span></div>
                    <p className="mt-1 text-xs text-stone-600">{session.reservationCode} · {session.store}{session.wheelSize ? ` · Aro ${session.wheelSize}` : ''}</p><p className="text-xs text-stone-500">{session.customerName} · Inició {new Date(session.startedAt).toLocaleString('es-BO')}</p>
                    <p className="mt-2 font-mono text-lg font-black tabular-nums text-stone-950">{formatElapsed(elapsed)}</p>
                  </div>
                  <Button onClick={() => { setFinishTarget(session); setDamaged(false); setConditionNotes(''); }} className="min-h-11 shrink-0 bg-stone-900 font-bold text-white hover:bg-stone-700"><RotateCcw className="mr-2 h-4 w-4" />Finalizar uso</Button>
                </div>
              </article>;
            })}</div>}
        </CardContent></Card>
      </section>

      {finishTarget && <Card className="border-amber-300 bg-amber-50"><CardContent className="space-y-4 p-4 sm:p-6">
        <div><h2 className="text-lg font-black text-stone-950">Devolución · {finishTarget.productName}</h2><p className="text-sm text-stone-600">La hora de cierre y el tiempo exacto serán calculados por Functions.</p></div>
        <label className="flex min-h-11 items-center gap-3 rounded-xl bg-white px-3 text-sm font-bold text-stone-800"><input type="checkbox" checked={damaged} onChange={(event) => setDamaged(event.target.checked)} className="h-5 w-5 accent-amber-600" />Bicicleta dañada: enviar a Mantenimiento</label>
        <label className="block text-sm font-bold text-stone-700">Notas de devolución (opcional)<textarea value={conditionNotes} onChange={(event) => setConditionNotes(event.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white p-3 font-normal" placeholder="Describe brevemente la condición o incidencia" /></label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setFinishTarget(null)} disabled={Boolean(finishing)}>Cancelar</Button><Button onClick={() => void finish()} disabled={Boolean(finishing)} className="min-h-11 bg-amber-500 font-black text-stone-950 hover:bg-amber-400">{finishing ? 'Registrando…' : 'Confirmar devolución'}</Button></div>
      </CardContent></Card>}

      <Card className="border-stone-200"><CardContent className="p-4 sm:p-6">
        <h2 className="text-lg font-black text-stone-950">Historial de Tiempo Libre</h2>
        {historySessions.length === 0 ? <p className="mt-3 text-sm text-stone-500">Las sesiones finalizadas aparecerán aquí.</p> : <div className="mt-3 space-y-2">{historySessions.map((session) => <details key={session.id} className="rounded-xl border border-stone-200 bg-white p-3"><summary className="cursor-pointer list-none"><span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className="font-bold text-stone-900">{session.productName} · {session.customerName}</span><span className="text-xs text-stone-600">{session.closedAt ? new Date(session.closedAt).toLocaleString('es-BO') : 'Cerrado'} · {formatElapsed(session.elapsedMilliseconds || 0)}{session.damagedOnReturn ? ' · Daño reportado' : ''}</span></span></summary>{session.returnConditionNotes && <p className="mt-2 text-sm text-stone-600">{session.returnConditionNotes}</p>}</details>)}</div>}
      </CardContent></Card>
      <p className="flex items-start gap-2 text-xs text-stone-500"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />No se generan tarifas, pagos, multas ni liquidaciones en Fase 1. Ante una pérdida de conexión, consulta/actualiza la sesión antes de iniciar otra operación.</p>
    </main>
  );
}
