/**
 * The INTERNAL door of the journey port — authenticated, via LivingAppsService.
 * GENERATED: one lister and one creator per entity. Do not edit.
 *
 *   import { servicePort } from '@/services/journeyPort';
 *
 * Intent pages hand this to `useJourneySubmit` and to shared step blocks. It
 * exposes only list · create · ref — the public subset — so a step written
 * against it also runs on a public page. Undo, edit and delete stay on the
 * page itself (LivingAppsService), never inside a shared step.
 */
import { LivingAppsService, createRecordUrl, type RecordQuery } from '@/services/livingAppsService';
import { toWirePayload, type InternalJourneyPort, type JourneyRecord } from '@/lib/journey/port';
import { buildSearchFilter, byIdFilter, combineFilters } from '@/lib/journey/search';
import type { EntityKey } from '@/lib/journey/rules';

type RawRecord = { record_id: string; fields: Record<string, unknown>; createdat?: string | null };
type RawMutation = { record_id: string; fields?: Record<string, unknown>; created_at?: string | null };

const listers: Record<EntityKey, () => Promise<RawRecord[]>> = {
  'beteiligte': () => LivingAppsService.getBeteiligte() as Promise<RawRecord[]>,
  'regelwerk': () => LivingAppsService.getRegelwerk() as Promise<RawRecord[]>,
  'vorgaenge': () => LivingAppsService.getVorgaenge() as Promise<RawRecord[]>,
  'quellen': () => LivingAppsService.getQuellen() as Promise<RawRecord[]>,
  'erfahrungen': () => LivingAppsService.getErfahrungen() as Promise<RawRecord[]>,
  'anforderungen': () => LivingAppsService.getAnforderungen() as Promise<RawRecord[]>,
  'beurteilungen': () => LivingAppsService.getBeurteilungen() as Promise<RawRecord[]>,
  'rueckfragen': () => LivingAppsService.getRueckfragen() as Promise<RawRecord[]>,
  'entscheidungen': () => LivingAppsService.getEntscheidungen() as Promise<RawRecord[]>,
};

/** The query/count half — the REST parameters the plain listers never send. */
const queriers: Record<EntityKey, (q: RecordQuery) => Promise<RawRecord[]>> = {
  'beteiligte': q => LivingAppsService.queryBeteiligte(q) as Promise<RawRecord[]>,
  'regelwerk': q => LivingAppsService.queryRegelwerk(q) as Promise<RawRecord[]>,
  'vorgaenge': q => LivingAppsService.queryVorgaenge(q) as Promise<RawRecord[]>,
  'quellen': q => LivingAppsService.queryQuellen(q) as Promise<RawRecord[]>,
  'erfahrungen': q => LivingAppsService.queryErfahrungen(q) as Promise<RawRecord[]>,
  'anforderungen': q => LivingAppsService.queryAnforderungen(q) as Promise<RawRecord[]>,
  'beurteilungen': q => LivingAppsService.queryBeurteilungen(q) as Promise<RawRecord[]>,
  'rueckfragen': q => LivingAppsService.queryRueckfragen(q) as Promise<RawRecord[]>,
  'entscheidungen': q => LivingAppsService.queryEntscheidungen(q) as Promise<RawRecord[]>,
};

const counters: Record<EntityKey, (filter?: string, signal?: AbortSignal) => Promise<number>> = {
  'beteiligte': (filter, signal) => LivingAppsService.countBeteiligte(filter, signal),
  'regelwerk': (filter, signal) => LivingAppsService.countRegelwerk(filter, signal),
  'vorgaenge': (filter, signal) => LivingAppsService.countVorgaenge(filter, signal),
  'quellen': (filter, signal) => LivingAppsService.countQuellen(filter, signal),
  'erfahrungen': (filter, signal) => LivingAppsService.countErfahrungen(filter, signal),
  'anforderungen': (filter, signal) => LivingAppsService.countAnforderungen(filter, signal),
  'beurteilungen': (filter, signal) => LivingAppsService.countBeurteilungen(filter, signal),
  'rueckfragen': (filter, signal) => LivingAppsService.countRueckfragen(filter, signal),
  'entscheidungen': (filter, signal) => LivingAppsService.countEntscheidungen(filter, signal),
};

const creators: Record<EntityKey, (fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'beteiligte': fields => LivingAppsService.createBeteiligteEntry(fields as never),
  'regelwerk': fields => LivingAppsService.createRegelwerkEntry(fields as never),
  'vorgaenge': fields => LivingAppsService.createVorgaengeEntry(fields as never),
  'quellen': fields => LivingAppsService.createQuellenEntry(fields as never),
  'erfahrungen': fields => LivingAppsService.createErfahrungenEntry(fields as never),
  'anforderungen': fields => LivingAppsService.createAnforderungenEntry(fields as never),
  'beurteilungen': fields => LivingAppsService.createBeurteilungenEntry(fields as never),
  'rueckfragen': fields => LivingAppsService.createRueckfragenEntry(fields as never),
  'entscheidungen': fields => LivingAppsService.createEntscheidungenEntry(fields as never),
};

const updaters: Record<EntityKey, (id: string, fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'beteiligte': (id, fields) => LivingAppsService.updateBeteiligteEntry(id, fields as never),
  'regelwerk': (id, fields) => LivingAppsService.updateRegelwerkEntry(id, fields as never),
  'vorgaenge': (id, fields) => LivingAppsService.updateVorgaengeEntry(id, fields as never),
  'quellen': (id, fields) => LivingAppsService.updateQuellenEntry(id, fields as never),
  'erfahrungen': (id, fields) => LivingAppsService.updateErfahrungenEntry(id, fields as never),
  'anforderungen': (id, fields) => LivingAppsService.updateAnforderungenEntry(id, fields as never),
  'beurteilungen': (id, fields) => LivingAppsService.updateBeurteilungenEntry(id, fields as never),
  'rueckfragen': (id, fields) => LivingAppsService.updateRueckfragenEntry(id, fields as never),
  'entscheidungen': (id, fields) => LivingAppsService.updateEntscheidungenEntry(id, fields as never),
};

function toJourneyRecord(r: RawRecord): JourneyRecord {
  return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.createdat ?? null };
}

export const servicePort: InternalJourneyPort = {
  door: 'internal',
  async list(entity, opts) {
    // Only a bare list(entity) (or an empty options object) takes the historic
    // load-everything path. ANY explicit option — `limit` included — goes to the
    // server: useRecordSearch's first page of a big entity must not pull the
    // whole table (live 2026-09-02: all 263 employees travelled for a limit-50
    // first page because `limit` alone did not count as a query).
    const usesQuery = !!opts && (opts.search !== undefined || opts.offset !== undefined
      || opts.orderby !== undefined || opts.fields !== undefined || opts.signal !== undefined
      || opts.limit !== undefined || opts.filter !== undefined);
    if (!usesQuery) {
      const rows = await listers[entity]();
      const limited = opts?.limit ? rows.slice(0, opts.limit) : rows;
      return limited.map(toJourneyRecord);
    }
    const filter = combineFilters(opts.filter, opts.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    const rows = await queriers[entity]({
      filter, orderby: opts.orderby, limit: opts.limit, offset: opts.offset, fields: opts.fields, signal: opts.signal,
    });
    return rows.map(toJourneyRecord);
  },
  async count(entity, opts) {
    const filter = combineFilters(opts?.filter, opts?.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    return counters[entity](filter, opts?.signal);
  },
  async get(entity, id) {
    // One query on the server, not the whole table: `r.id` is the vSQL name
    // of the record id (a live page wrote `r.record_id` and got a 400).
    const rows = await queriers[entity]({ filter: byIdFilter(id), limit: 1 });
    return rows[0] ? toJourneyRecord(rows[0]) : null;
  },
  async create(entity, values) {
    const r = await creators[entity](toWirePayload(entity, values, servicePort));
    return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  // The same payload rules as create — plain ids in, references shaped here.
  async update(entity, id, values) {
    const r = await updaters[entity](id, toWirePayload(entity, values, servicePort));
    return { id: r.record_id || id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  ref: (appId, recordId) => createRecordUrl(appId, recordId),
};
