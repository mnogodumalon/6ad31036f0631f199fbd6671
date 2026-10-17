import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Beteiligte, Regelwerk, Vorgaenge, Quellen, Erfahrungen, Anforderungen, Beurteilungen, Rueckfragen, Entscheidungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'beteiligte' | 'regelwerk' | 'vorgaenge' | 'quellen' | 'erfahrungen' | 'anforderungen' | 'beurteilungen' | 'rueckfragen' | 'entscheidungen';

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [beteiligte, setBeteiligte] = useState<Beteiligte[]>([]);
  const [regelwerk, setRegelwerk] = useState<Regelwerk[]>([]);
  const [vorgaenge, setVorgaenge] = useState<Vorgaenge[]>([]);
  const [quellen, setQuellen] = useState<Quellen[]>([]);
  const [erfahrungen, setErfahrungen] = useState<Erfahrungen[]>([]);
  const [anforderungen, setAnforderungen] = useState<Anforderungen[]>([]);
  const [beurteilungen, setBeurteilungen] = useState<Beurteilungen[]>([]);
  const [rueckfragen, setRueckfragen] = useState<Rueckfragen[]>([]);
  const [entscheidungen, setEntscheidungen] = useState<Entscheidungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  /** Lists the signed-in user may not read (403 on the platform). They load as
   *  empty and the rest of the page loads normally — one forbidden list used to
   *  empty the whole dashboard (05.10.2026). Hide a block whose list is here. */
  const [forbidden, setForbidden] = useState<DashboardEntity[]>([]);

  // Every list on its own: a 403 is „not yours“, any other failure is an error.
  const settle = useCallback((settled: PromiseSettledResult<unknown>[]) => {
    const denied: DashboardEntity[] = [];
    let failure: unknown = null;
    // null = this list failed for another reason: its current data stays
    const pick = <T,>(i: number, key: DashboardEntity): T[] | null => {
      const s = settled[i];
      if (s.status === 'fulfilled') return s.value as T[];
      if ((s.reason as { status?: number } | null)?.status === 403) { denied.push(key); return []; }
      failure = failure ?? s.reason;
      return null;
    };
    { const rows = pick<Beteiligte>(0, 'beteiligte'); if (rows) setBeteiligte(rows); }
    { const rows = pick<Regelwerk>(1, 'regelwerk'); if (rows) setRegelwerk(rows); }
    { const rows = pick<Vorgaenge>(2, 'vorgaenge'); if (rows) setVorgaenge(rows); }
    { const rows = pick<Quellen>(3, 'quellen'); if (rows) setQuellen(rows); }
    { const rows = pick<Erfahrungen>(4, 'erfahrungen'); if (rows) setErfahrungen(rows); }
    { const rows = pick<Anforderungen>(5, 'anforderungen'); if (rows) setAnforderungen(rows); }
    { const rows = pick<Beurteilungen>(6, 'beurteilungen'); if (rows) setBeurteilungen(rows); }
    { const rows = pick<Rueckfragen>(7, 'rueckfragen'); if (rows) setRueckfragen(rows); }
    { const rows = pick<Entscheidungen>(8, 'entscheidungen'); if (rows) setEntscheidungen(rows); }
    setForbidden(prev => (prev.join('|') === denied.join('|') ? prev : denied));
    return failure;
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const failure = settle(await Promise.allSettled([
        omit.has('beteiligte') ? Promise.resolve([] as Beteiligte[]) : LivingAppsService.getBeteiligte(),
        omit.has('regelwerk') ? Promise.resolve([] as Regelwerk[]) : LivingAppsService.getRegelwerk(),
        omit.has('vorgaenge') ? Promise.resolve([] as Vorgaenge[]) : LivingAppsService.getVorgaenge(),
        omit.has('quellen') ? Promise.resolve([] as Quellen[]) : LivingAppsService.getQuellen(),
        omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
        omit.has('anforderungen') ? Promise.resolve([] as Anforderungen[]) : LivingAppsService.getAnforderungen(),
        omit.has('beurteilungen') ? Promise.resolve([] as Beurteilungen[]) : LivingAppsService.getBeurteilungen(),
        omit.has('rueckfragen') ? Promise.resolve([] as Rueckfragen[]) : LivingAppsService.getRueckfragen(),
        omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
      ]));
      if (failure) throw failure;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey, settle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        // a failed list keeps its stale data out of the way: settle() only
        // replaces what loaded or was refused
        settle(await Promise.allSettled([
          omit.has('beteiligte') ? Promise.resolve([] as Beteiligte[]) : LivingAppsService.getBeteiligte(),
          omit.has('regelwerk') ? Promise.resolve([] as Regelwerk[]) : LivingAppsService.getRegelwerk(),
          omit.has('vorgaenge') ? Promise.resolve([] as Vorgaenge[]) : LivingAppsService.getVorgaenge(),
          omit.has('quellen') ? Promise.resolve([] as Quellen[]) : LivingAppsService.getQuellen(),
          omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
          omit.has('anforderungen') ? Promise.resolve([] as Anforderungen[]) : LivingAppsService.getAnforderungen(),
          omit.has('beurteilungen') ? Promise.resolve([] as Beurteilungen[]) : LivingAppsService.getBeurteilungen(),
          omit.has('rueckfragen') ? Promise.resolve([] as Rueckfragen[]) : LivingAppsService.getRueckfragen(),
          omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, [omitKey, settle]);

  const beteiligteMap = useMemo(() => {
    const m = new Map<string, Beteiligte>();
    beteiligte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [beteiligte]);

  const regelwerkMap = useMemo(() => {
    const m = new Map<string, Regelwerk>();
    regelwerk.forEach(r => m.set(r.record_id, r));
    return m;
  }, [regelwerk]);

  const vorgaengeMap = useMemo(() => {
    const m = new Map<string, Vorgaenge>();
    vorgaenge.forEach(r => m.set(r.record_id, r));
    return m;
  }, [vorgaenge]);

  const quellenMap = useMemo(() => {
    const m = new Map<string, Quellen>();
    quellen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [quellen]);

  const anforderungenMap = useMemo(() => {
    const m = new Map<string, Anforderungen>();
    anforderungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [anforderungen]);

  const beurteilungenMap = useMemo(() => {
    const m = new Map<string, Beurteilungen>();
    beurteilungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [beurteilungen]);

  return { beteiligte, setBeteiligte, regelwerk, setRegelwerk, vorgaenge, setVorgaenge, quellen, setQuellen, erfahrungen, setErfahrungen, anforderungen, setAnforderungen, beurteilungen, setBeurteilungen, rueckfragen, setRueckfragen, entscheidungen, setEntscheidungen, loading, error, fetchAll, forbidden, beteiligteMap, regelwerkMap, vorgaengeMap, quellenMap, anforderungenMap, beurteilungenMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;