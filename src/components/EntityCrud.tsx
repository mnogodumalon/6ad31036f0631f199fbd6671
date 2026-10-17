/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'beteiligte'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.beteiligte.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.beteiligte.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.beteiligte.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.beteiligte              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   beteiligte: email, telefon, stelle, zustaendigkeitsbereich, entscheidungsbefugnis, vorname, nachname, organisation, …  ·  ← vorgaenge (list + contextual +) · ← erfahrungen (list + contextual +) · ← beurteilungen (list + contextual +) · ← rueckfragen (list + contextual +) · ← entscheidungen (list + contextual +)
 *   regelwerk: bezeichnung, beschreibung, geltungsbereich, regeltyp, erforderliche_befugnis, verbindlich, gueltig_ab, status  ·  ← entscheidungen (list + contextual +)
 *   vorgaenge: vorgangsnummer, titel, kunde, eingangsdatum, kundenanfrage, zustaendige_person, prozessschritt, status, …  ·  → beteiligte · ← quellen (list + contextual +) · ← erfahrungen (list + contextual +) · ← anforderungen (list + contextual +) · ← beurteilungen (list + contextual +) · ← rueckfragen (list + contextual +) · ← entscheidungen (list + contextual +)
 *   quellen: vorgang, bezeichnung, quellenart, fundort, version, verlaesslichkeit, datei, bemerkung  ·  → vorgaenge · ← anforderungen (list + contextual +)
 *   erfahrungen: vorgang, titel, beschreibung, erfahrungsart, erkenntnisklasse, bestaetigt_von, wiederverwendbar, verbesserungsvorschlag  ·  → vorgaenge · → beteiligte
 *   anforderungen: widerspruch_zu, vorgang, bezeichnung, beschreibung, kategorie, wert, quelle, erfassungsstatus, …  ·  → anforderungen · → vorgaenge · → quellen · ← beurteilungen (list + contextual +) · ← rueckfragen (list + contextual +) · ← entscheidungen (list + contextual +)
 *   beurteilungen: vorgang, beurteiler, fachgebiet, sachverhalt, bewertung, moegliche_erklaerung, unsicherheiten, fachlich_bestaetigt, …  ·  → vorgaenge · → beteiligte · → anforderungen · ← entscheidungen (list + contextual +)
 *   rueckfragen: vorgang, adressat, fragetext, buendelungsgruppe, status, gestellt_am, antwort, antwort_am, …  ·  → vorgaenge · → beteiligte · → anforderungen
 *   entscheidungen: vorgang, gegenstand, regel, entscheider, befugnis_geprueft, unsicherheiten, ki_vorschlag, entscheidung, …  ·  → vorgaenge · → regelwerk · → beteiligte · → anforderungen · → beurteilungen
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Beteiligte, Regelwerk, Vorgaenge, Quellen, Erfahrungen, Anforderungen, Beurteilungen, Rueckfragen, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichVorgaenge, enrichQuellen, enrichErfahrungen, enrichAnforderungen, enrichBeurteilungen, enrichRueckfragen, enrichEntscheidungen } from '@/lib/enrich';
import type { EnrichedVorgaenge, EnrichedQuellen, EnrichedErfahrungen, EnrichedAnforderungen, EnrichedBeurteilungen, EnrichedRueckfragen, EnrichedEntscheidungen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { BeteiligteDialog, type BeteiligteDialogDefaults } from '@/components/dialogs/BeteiligteDialog';
import { BeteiligteDetails } from '@/components/details/BeteiligteDetails';
import { RegelwerkDialog, type RegelwerkDialogDefaults } from '@/components/dialogs/RegelwerkDialog';
import { RegelwerkDetails } from '@/components/details/RegelwerkDetails';
import { VorgaengeDialog, type VorgaengeDialogDefaults } from '@/components/dialogs/VorgaengeDialog';
import { VorgaengeDetails } from '@/components/details/VorgaengeDetails';
import { QuellenDialog, type QuellenDialogDefaults } from '@/components/dialogs/QuellenDialog';
import { QuellenDetails } from '@/components/details/QuellenDetails';
import { ErfahrungenDialog, type ErfahrungenDialogDefaults } from '@/components/dialogs/ErfahrungenDialog';
import { ErfahrungenDetails } from '@/components/details/ErfahrungenDetails';
import { AnforderungenDialog, type AnforderungenDialogDefaults } from '@/components/dialogs/AnforderungenDialog';
import { AnforderungenDetails } from '@/components/details/AnforderungenDetails';
import { BeurteilungenDialog, type BeurteilungenDialogDefaults } from '@/components/dialogs/BeurteilungenDialog';
import { BeurteilungenDetails } from '@/components/details/BeurteilungenDetails';
import { RueckfragenDialog, type RueckfragenDialogDefaults } from '@/components/dialogs/RueckfragenDialog';
import { RueckfragenDetails } from '@/components/details/RueckfragenDetails';
import { EntscheidungenDialog, type EntscheidungenDialogDefaults } from '@/components/dialogs/EntscheidungenDialog';
import { EntscheidungenDetails } from '@/components/details/EntscheidungenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'beteiligte'; record: Beteiligte }
  | { type: 'regelwerk'; record: Regelwerk }
  | { type: 'vorgaenge'; record: EnrichedVorgaenge }
  | { type: 'quellen'; record: EnrichedQuellen }
  | { type: 'erfahrungen'; record: EnrichedErfahrungen }
  | { type: 'anforderungen'; record: EnrichedAnforderungen }
  | { type: 'beurteilungen'; record: EnrichedBeurteilungen }
  | { type: 'rueckfragen'; record: EnrichedRueckfragen }
  | { type: 'entscheidungen'; record: EnrichedEntscheidungen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  beteiligte: EntityCrudApi<Beteiligte, BeteiligteDialogDefaults>;
  regelwerk: EntityCrudApi<Regelwerk, RegelwerkDialogDefaults>;
  vorgaenge: EntityCrudApi<Vorgaenge, VorgaengeDialogDefaults>;
  quellen: EntityCrudApi<Quellen, QuellenDialogDefaults>;
  erfahrungen: EntityCrudApi<Erfahrungen, ErfahrungenDialogDefaults>;
  anforderungen: EntityCrudApi<Anforderungen, AnforderungenDialogDefaults>;
  beurteilungen: EntityCrudApi<Beurteilungen, BeurteilungenDialogDefaults>;
  rueckfragen: EntityCrudApi<Rueckfragen, RueckfragenDialogDefaults>;
  entscheidungen: EntityCrudApi<Entscheidungen, EntscheidungenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { beteiligte: Beteiligte[]; regelwerk: Regelwerk[]; vorgaenge: EnrichedVorgaenge[]; quellen: EnrichedQuellen[]; erfahrungen: EnrichedErfahrungen[]; anforderungen: EnrichedAnforderungen[]; beurteilungen: EnrichedBeurteilungen[]; rueckfragen: EnrichedRueckfragen[]; entscheidungen: EnrichedEntscheidungen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [beteiligteDialog, setBeteiligteDialog] = useState<{ defaults?: BeteiligteDialogDefaults; editing?: Beteiligte } | null>(null);
  const [regelwerkDialog, setRegelwerkDialog] = useState<{ defaults?: RegelwerkDialogDefaults; editing?: Regelwerk } | null>(null);
  const [vorgaengeDialog, setVorgaengeDialog] = useState<{ defaults?: VorgaengeDialogDefaults; editing?: Vorgaenge } | null>(null);
  const [quellenDialog, setQuellenDialog] = useState<{ defaults?: QuellenDialogDefaults; editing?: Quellen } | null>(null);
  const [erfahrungenDialog, setErfahrungenDialog] = useState<{ defaults?: ErfahrungenDialogDefaults; editing?: Erfahrungen } | null>(null);
  const [anforderungenDialog, setAnforderungenDialog] = useState<{ defaults?: AnforderungenDialogDefaults; editing?: Anforderungen } | null>(null);
  const [beurteilungenDialog, setBeurteilungenDialog] = useState<{ defaults?: BeurteilungenDialogDefaults; editing?: Beurteilungen } | null>(null);
  const [rueckfragenDialog, setRueckfragenDialog] = useState<{ defaults?: RueckfragenDialogDefaults; editing?: Rueckfragen } | null>(null);
  const [entscheidungenDialog, setEntscheidungenDialog] = useState<{ defaults?: EntscheidungenDialogDefaults; editing?: Entscheidungen } | null>(null);
  const enrichedVorgaenge = useMemo(() => enrichVorgaenge(data.vorgaenge, { beteiligteMap: data.beteiligteMap }), [data.vorgaenge, data.beteiligteMap]);
  const enrichedQuellen = useMemo(() => enrichQuellen(data.quellen, { vorgaengeMap: data.vorgaengeMap }), [data.quellen, data.vorgaengeMap]);
  const enrichedErfahrungen = useMemo(() => enrichErfahrungen(data.erfahrungen, { vorgaengeMap: data.vorgaengeMap, beteiligteMap: data.beteiligteMap }), [data.erfahrungen, data.vorgaengeMap, data.beteiligteMap]);
  const enrichedAnforderungen = useMemo(() => enrichAnforderungen(data.anforderungen, { anforderungenMap: data.anforderungenMap, vorgaengeMap: data.vorgaengeMap, quellenMap: data.quellenMap }), [data.anforderungen, data.anforderungenMap, data.vorgaengeMap, data.quellenMap]);
  const enrichedBeurteilungen = useMemo(() => enrichBeurteilungen(data.beurteilungen, { vorgaengeMap: data.vorgaengeMap, beteiligteMap: data.beteiligteMap, anforderungenMap: data.anforderungenMap }), [data.beurteilungen, data.vorgaengeMap, data.beteiligteMap, data.anforderungenMap]);
  const enrichedRueckfragen = useMemo(() => enrichRueckfragen(data.rueckfragen, { vorgaengeMap: data.vorgaengeMap, beteiligteMap: data.beteiligteMap, anforderungenMap: data.anforderungenMap }), [data.rueckfragen, data.vorgaengeMap, data.beteiligteMap, data.anforderungenMap]);
  const enrichedEntscheidungen = useMemo(() => enrichEntscheidungen(data.entscheidungen, { vorgaengeMap: data.vorgaengeMap, regelwerkMap: data.regelwerkMap, beteiligteMap: data.beteiligteMap, anforderungenMap: data.anforderungenMap, beurteilungenMap: data.beurteilungenMap }), [data.entscheidungen, data.vorgaengeMap, data.regelwerkMap, data.beteiligteMap, data.anforderungenMap, data.beurteilungenMap]);

  function detailBeteiligte(record: Beteiligte, push = false) {
    const item: OverlayItem = { type: 'beteiligte', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBeteiligte(fields: Beteiligte['fields']) {
    const editing = beteiligteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBeteiligte(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBeteiligteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('beteiligte')} — ${t('crud_updated')}`, async () => {
        data.setBeteiligte(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBeteiligteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBeteiligteEntry(fields);
      undoToast(`${appLabel('beteiligte')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailRegelwerk(record: Regelwerk, push = false) {
    const item: OverlayItem = { type: 'regelwerk', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRegelwerk(fields: Regelwerk['fields']) {
    const editing = regelwerkDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRegelwerk(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRegelwerkEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('regelwerk')} — ${t('crud_updated')}`, async () => {
        data.setRegelwerk(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRegelwerkEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRegelwerkEntry(fields);
      undoToast(`${appLabel('regelwerk')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailVorgaenge(record: Vorgaenge, push = false) {
    const rec = enrichedVorgaenge.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'vorgaenge', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVorgaenge(fields: Vorgaenge['fields']) {
    const editing = vorgaengeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVorgaenge(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVorgaengeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('vorgaenge')} — ${t('crud_updated')}`, async () => {
        data.setVorgaenge(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVorgaengeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVorgaengeEntry(fields);
      undoToast(`${appLabel('vorgaenge')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailQuellen(record: Quellen, push = false) {
    const rec = enrichedQuellen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'quellen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitQuellen(fields: Quellen['fields']) {
    const editing = quellenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setQuellen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateQuellenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('quellen')} — ${t('crud_updated')}`, async () => {
        data.setQuellen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateQuellenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createQuellenEntry(fields);
      undoToast(`${appLabel('quellen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailErfahrungen(record: Erfahrungen, push = false) {
    const rec = enrichedErfahrungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'erfahrungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitErfahrungen(fields: Erfahrungen['fields']) {
    const editing = erfahrungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setErfahrungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateErfahrungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_updated')}`, async () => {
        data.setErfahrungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateErfahrungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createErfahrungenEntry(fields);
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAnforderungen(record: Anforderungen, push = false) {
    const rec = enrichedAnforderungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'anforderungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAnforderungen(fields: Anforderungen['fields']) {
    const editing = anforderungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAnforderungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAnforderungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('anforderungen')} — ${t('crud_updated')}`, async () => {
        data.setAnforderungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAnforderungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAnforderungenEntry(fields);
      undoToast(`${appLabel('anforderungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailBeurteilungen(record: Beurteilungen, push = false) {
    const rec = enrichedBeurteilungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'beurteilungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBeurteilungen(fields: Beurteilungen['fields']) {
    const editing = beurteilungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBeurteilungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBeurteilungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('beurteilungen')} — ${t('crud_updated')}`, async () => {
        data.setBeurteilungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBeurteilungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBeurteilungenEntry(fields);
      undoToast(`${appLabel('beurteilungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailRueckfragen(record: Rueckfragen, push = false) {
    const rec = enrichedRueckfragen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'rueckfragen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRueckfragen(fields: Rueckfragen['fields']) {
    const editing = rueckfragenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRueckfragen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRueckfragenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('rueckfragen')} — ${t('crud_updated')}`, async () => {
        data.setRueckfragen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRueckfragenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRueckfragenEntry(fields);
      undoToast(`${appLabel('rueckfragen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEntscheidungen(record: Entscheidungen, push = false) {
    const rec = enrichedEntscheidungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'entscheidungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEntscheidungen(fields: Entscheidungen['fields']) {
    const editing = entscheidungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEntscheidungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEntscheidungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_updated')}`, async () => {
        data.setEntscheidungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEntscheidungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEntscheidungenEntry(fields);
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <BeteiligteDialog
        open={beteiligteDialog !== null}
        onClose={() => setBeteiligteDialog(null)}
        onSubmit={submitBeteiligte}
        defaultValues={beteiligteDialog?.defaults}
        recordId={beteiligteDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Beteiligte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Beteiligte']}
      />
      <RegelwerkDialog
        open={regelwerkDialog !== null}
        onClose={() => setRegelwerkDialog(null)}
        onSubmit={submitRegelwerk}
        defaultValues={regelwerkDialog?.defaults}
        recordId={regelwerkDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Regelwerk']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Regelwerk']}
      />
      <VorgaengeDialog
        open={vorgaengeDialog !== null}
        onClose={() => setVorgaengeDialog(null)}
        onSubmit={submitVorgaenge}
        defaultValues={vorgaengeDialog?.defaults}
        recordId={vorgaengeDialog?.editing?.record_id}
        beteiligteList={data.beteiligte}
        enablePhotoScan={AI_PHOTO_SCAN['Vorgaenge']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vorgaenge']}
      />
      <QuellenDialog
        open={quellenDialog !== null}
        onClose={() => setQuellenDialog(null)}
        onSubmit={submitQuellen}
        defaultValues={quellenDialog?.defaults}
        recordId={quellenDialog?.editing?.record_id}
        vorgaengeList={data.vorgaenge}
        enablePhotoScan={AI_PHOTO_SCAN['Quellen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Quellen']}
      />
      <ErfahrungenDialog
        open={erfahrungenDialog !== null}
        onClose={() => setErfahrungenDialog(null)}
        onSubmit={submitErfahrungen}
        defaultValues={erfahrungenDialog?.defaults}
        recordId={erfahrungenDialog?.editing?.record_id}
        vorgaengeList={data.vorgaenge}
        beteiligteList={data.beteiligte}
        enablePhotoScan={AI_PHOTO_SCAN['Erfahrungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Erfahrungen']}
      />
      <AnforderungenDialog
        open={anforderungenDialog !== null}
        onClose={() => setAnforderungenDialog(null)}
        onSubmit={submitAnforderungen}
        defaultValues={anforderungenDialog?.defaults}
        recordId={anforderungenDialog?.editing?.record_id}
        anforderungenList={data.anforderungen}
        vorgaengeList={data.vorgaenge}
        quellenList={data.quellen}
        enablePhotoScan={AI_PHOTO_SCAN['Anforderungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anforderungen']}
      />
      <BeurteilungenDialog
        open={beurteilungenDialog !== null}
        onClose={() => setBeurteilungenDialog(null)}
        onSubmit={submitBeurteilungen}
        defaultValues={beurteilungenDialog?.defaults}
        recordId={beurteilungenDialog?.editing?.record_id}
        vorgaengeList={data.vorgaenge}
        beteiligteList={data.beteiligte}
        anforderungenList={data.anforderungen}
        enablePhotoScan={AI_PHOTO_SCAN['Beurteilungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Beurteilungen']}
      />
      <RueckfragenDialog
        open={rueckfragenDialog !== null}
        onClose={() => setRueckfragenDialog(null)}
        onSubmit={submitRueckfragen}
        defaultValues={rueckfragenDialog?.defaults}
        recordId={rueckfragenDialog?.editing?.record_id}
        vorgaengeList={data.vorgaenge}
        beteiligteList={data.beteiligte}
        anforderungenList={data.anforderungen}
        enablePhotoScan={AI_PHOTO_SCAN['Rueckfragen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Rueckfragen']}
      />
      <EntscheidungenDialog
        open={entscheidungenDialog !== null}
        onClose={() => setEntscheidungenDialog(null)}
        onSubmit={submitEntscheidungen}
        defaultValues={entscheidungenDialog?.defaults}
        recordId={entscheidungenDialog?.editing?.record_id}
        vorgaengeList={data.vorgaenge}
        regelwerkList={data.regelwerk}
        beteiligteList={data.beteiligte}
        anforderungenList={data.anforderungen}
        beurteilungenList={data.beurteilungen}
        enablePhotoScan={AI_PHOTO_SCAN['Entscheidungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Entscheidungen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'beteiligte') {
            return (
              <>
                <RecordHeader title={top.record.fields.email ?? appLabel('beteiligte')} subtitle={undefined} />
                <BeteiligteDetails
                  record={top.record}
                  vorgaengeList={data.vorgaenge}
                  onOpenVorgaenge={(r) => detailVorgaenge(r, true)}
                  onAddVorgaenge={perms.canWrite('vorgaenge') ? () => setVorgaengeDialog({ defaults: { zustaendige_person: createRecordUrl(APP_IDS.BETEILIGTE, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { bestaetigt_von: createRecordUrl(APP_IDS.BETEILIGTE, top.record.record_id) } }) : undefined}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                  onAddBeurteilungen={perms.canWrite('beurteilungen') ? () => setBeurteilungenDialog({ defaults: { beurteiler: createRecordUrl(APP_IDS.BETEILIGTE, top.record.record_id) } }) : undefined}
                  rueckfragenList={data.rueckfragen}
                  onOpenRueckfragen={(r) => detailRueckfragen(r, true)}
                  onAddRueckfragen={perms.canWrite('rueckfragen') ? () => setRueckfragenDialog({ defaults: { adressat: createRecordUrl(APP_IDS.BETEILIGTE, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { entscheider: createRecordUrl(APP_IDS.BETEILIGTE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'regelwerk') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('regelwerk')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <RegelwerkDetails
                  record={top.record}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { regel: createRecordUrl(APP_IDS.REGELWERK, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'vorgaenge') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorgangsnummer ?? appLabel('vorgaenge')} subtitle={top.record.fields.eingangsdatum ? formatDate(top.record.fields.eingangsdatum) : undefined} />
                <VorgaengeDetails
                  record={top.record}
                  beteiligteList={data.beteiligte}
                  onOpenBeteiligte={(r) => detailBeteiligte(r, true)}
                  quellenList={data.quellen}
                  onOpenQuellen={(r) => detailQuellen(r, true)}
                  onAddQuellen={perms.canWrite('quellen') ? () => setQuellenDialog({ defaults: { vorgang: createRecordUrl(APP_IDS.VORGAENGE, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { vorgang: createRecordUrl(APP_IDS.VORGAENGE, top.record.record_id) } }) : undefined}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  onAddAnforderungen={perms.canWrite('anforderungen') ? () => setAnforderungenDialog({ defaults: { vorgang: createRecordUrl(APP_IDS.VORGAENGE, top.record.record_id) } }) : undefined}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                  onAddBeurteilungen={perms.canWrite('beurteilungen') ? () => setBeurteilungenDialog({ defaults: { vorgang: createRecordUrl(APP_IDS.VORGAENGE, top.record.record_id) } }) : undefined}
                  rueckfragenList={data.rueckfragen}
                  onOpenRueckfragen={(r) => detailRueckfragen(r, true)}
                  onAddRueckfragen={perms.canWrite('rueckfragen') ? () => setRueckfragenDialog({ defaults: { vorgang: createRecordUrl(APP_IDS.VORGAENGE, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { vorgang: createRecordUrl(APP_IDS.VORGAENGE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'quellen') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('quellen')} subtitle={undefined} />
                <QuellenDetails
                  record={top.record}
                  vorgaengeList={data.vorgaenge}
                  onOpenVorgaenge={(r) => detailVorgaenge(r, true)}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  onAddAnforderungen={perms.canWrite('anforderungen') ? () => setAnforderungenDialog({ defaults: { quelle: createRecordUrl(APP_IDS.QUELLEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'erfahrungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('erfahrungen')} subtitle={undefined} />
                <ErfahrungenDetails
                  record={top.record}
                  vorgaengeList={data.vorgaenge}
                  onOpenVorgaenge={(r) => detailVorgaenge(r, true)}
                  beteiligteList={data.beteiligte}
                  onOpenBeteiligte={(r) => detailBeteiligte(r, true)}
                />
              </>
            );
          }
          if (top.type === 'anforderungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('anforderungen')} subtitle={undefined} />
                <AnforderungenDetails
                  record={top.record}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  vorgaengeList={data.vorgaenge}
                  onOpenVorgaenge={(r) => detailVorgaenge(r, true)}
                  quellenList={data.quellen}
                  onOpenQuellen={(r) => detailQuellen(r, true)}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                  onAddBeurteilungen={perms.canWrite('beurteilungen') ? () => setBeurteilungenDialog({ defaults: { anforderung: createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id) } }) : undefined}
                  rueckfragenList={data.rueckfragen}
                  onOpenRueckfragen={(r) => detailRueckfragen(r, true)}
                  onAddRueckfragen={perms.canWrite('rueckfragen') ? () => setRueckfragenDialog({ defaults: { anforderung: createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { anforderung: createRecordUrl(APP_IDS.ANFORDERUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'beurteilungen') {
            return (
              <>
                <RecordHeader title={appLabel('beurteilungen')} subtitle={top.record.fields.beurteilt_am ? formatDate(top.record.fields.beurteilt_am) : undefined} />
                <BeurteilungenDetails
                  record={top.record}
                  vorgaengeList={data.vorgaenge}
                  onOpenVorgaenge={(r) => detailVorgaenge(r, true)}
                  beteiligteList={data.beteiligte}
                  onOpenBeteiligte={(r) => detailBeteiligte(r, true)}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { beurteilung: createRecordUrl(APP_IDS.BEURTEILUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'rueckfragen') {
            return (
              <>
                <RecordHeader title={top.record.fields.buendelungsgruppe ?? appLabel('rueckfragen')} subtitle={top.record.fields.gestellt_am ? formatDate(top.record.fields.gestellt_am) : undefined} />
                <RueckfragenDetails
                  record={top.record}
                  vorgaengeList={data.vorgaenge}
                  onOpenVorgaenge={(r) => detailVorgaenge(r, true)}
                  beteiligteList={data.beteiligte}
                  onOpenBeteiligte={(r) => detailBeteiligte(r, true)}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'entscheidungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.gegenstand ?? appLabel('entscheidungen')} subtitle={top.record.fields.entscheidungsdatum ? formatDate(top.record.fields.entscheidungsdatum) : undefined} />
                <EntscheidungenDetails
                  record={top.record}
                  vorgaengeList={data.vorgaenge}
                  onOpenVorgaenge={(r) => detailVorgaenge(r, true)}
                  regelwerkList={data.regelwerk}
                  onOpenRegelwerk={(r) => detailRegelwerk(r, true)}
                  beteiligteList={data.beteiligte}
                  onOpenBeteiligte={(r) => detailBeteiligte(r, true)}
                  anforderungenList={data.anforderungen}
                  onOpenAnforderungen={(r) => detailAnforderungen(r, true)}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'beteiligte') return perms.canWrite('beteiligte');
          if (top.type === 'regelwerk') return perms.canWrite('regelwerk');
          if (top.type === 'vorgaenge') return perms.canWrite('vorgaenge');
          if (top.type === 'quellen') return perms.canWrite('quellen');
          if (top.type === 'erfahrungen') return perms.canWrite('erfahrungen');
          if (top.type === 'anforderungen') return perms.canWrite('anforderungen');
          if (top.type === 'beurteilungen') return perms.canWrite('beurteilungen');
          if (top.type === 'rueckfragen') return perms.canWrite('rueckfragen');
          if (top.type === 'entscheidungen') return perms.canWrite('entscheidungen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'beteiligte') setBeteiligteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'regelwerk') setRegelwerkDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'vorgaenge') setVorgaengeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'quellen') setQuellenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'erfahrungen') setErfahrungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'anforderungen') setAnforderungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'beurteilungen') setBeurteilungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'rueckfragen') setRueckfragenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'entscheidungen') setEntscheidungenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    beteiligte: {
      openCreate: (defaults?: BeteiligteDialogDefaults) => (perms.canWrite('beteiligte') ? setBeteiligteDialog({ defaults }) : refuse()),
      openEdit: (record: Beteiligte) => (perms.canWrite('beteiligte') ? setBeteiligteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Beteiligte) => detailBeteiligte(record, false),
      canWrite: perms.canWrite('beteiligte'),
    },
    regelwerk: {
      openCreate: (defaults?: RegelwerkDialogDefaults) => (perms.canWrite('regelwerk') ? setRegelwerkDialog({ defaults }) : refuse()),
      openEdit: (record: Regelwerk) => (perms.canWrite('regelwerk') ? setRegelwerkDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Regelwerk) => detailRegelwerk(record, false),
      canWrite: perms.canWrite('regelwerk'),
    },
    vorgaenge: {
      openCreate: (defaults?: VorgaengeDialogDefaults) => (perms.canWrite('vorgaenge') ? setVorgaengeDialog({ defaults }) : refuse()),
      openEdit: (record: Vorgaenge) => (perms.canWrite('vorgaenge') ? setVorgaengeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Vorgaenge) => detailVorgaenge(record, false),
      canWrite: perms.canWrite('vorgaenge'),
    },
    quellen: {
      openCreate: (defaults?: QuellenDialogDefaults) => (perms.canWrite('quellen') ? setQuellenDialog({ defaults }) : refuse()),
      openEdit: (record: Quellen) => (perms.canWrite('quellen') ? setQuellenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Quellen) => detailQuellen(record, false),
      canWrite: perms.canWrite('quellen'),
    },
    erfahrungen: {
      openCreate: (defaults?: ErfahrungenDialogDefaults) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ defaults }) : refuse()),
      openEdit: (record: Erfahrungen) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Erfahrungen) => detailErfahrungen(record, false),
      canWrite: perms.canWrite('erfahrungen'),
    },
    anforderungen: {
      openCreate: (defaults?: AnforderungenDialogDefaults) => (perms.canWrite('anforderungen') ? setAnforderungenDialog({ defaults }) : refuse()),
      openEdit: (record: Anforderungen) => (perms.canWrite('anforderungen') ? setAnforderungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Anforderungen) => detailAnforderungen(record, false),
      canWrite: perms.canWrite('anforderungen'),
    },
    beurteilungen: {
      openCreate: (defaults?: BeurteilungenDialogDefaults) => (perms.canWrite('beurteilungen') ? setBeurteilungenDialog({ defaults }) : refuse()),
      openEdit: (record: Beurteilungen) => (perms.canWrite('beurteilungen') ? setBeurteilungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Beurteilungen) => detailBeurteilungen(record, false),
      canWrite: perms.canWrite('beurteilungen'),
    },
    rueckfragen: {
      openCreate: (defaults?: RueckfragenDialogDefaults) => (perms.canWrite('rueckfragen') ? setRueckfragenDialog({ defaults }) : refuse()),
      openEdit: (record: Rueckfragen) => (perms.canWrite('rueckfragen') ? setRueckfragenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Rueckfragen) => detailRueckfragen(record, false),
      canWrite: perms.canWrite('rueckfragen'),
    },
    entscheidungen: {
      openCreate: (defaults?: EntscheidungenDialogDefaults) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ defaults }) : refuse()),
      openEdit: (record: Entscheidungen) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Entscheidungen) => detailEntscheidungen(record, false),
      canWrite: perms.canWrite('entscheidungen'),
    },
    enriched: { beteiligte: data.beteiligte, regelwerk: data.regelwerk, vorgaenge: enrichedVorgaenge, quellen: enrichedQuellen, erfahrungen: enrichedErfahrungen, anforderungen: enrichedAnforderungen, beurteilungen: enrichedBeurteilungen, rueckfragen: enrichedRueckfragen, entscheidungen: enrichedEntscheidungen },
  };
}
