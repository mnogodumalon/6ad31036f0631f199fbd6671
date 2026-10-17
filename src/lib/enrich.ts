import type { EnrichedAnforderungen, EnrichedBeurteilungen, EnrichedEntscheidungen, EnrichedErfahrungen, EnrichedQuellen, EnrichedRueckfragen, EnrichedVorgaenge } from '@/types/enriched';
import type { Anforderungen, Beteiligte, Beurteilungen, Entscheidungen, Erfahrungen, Quellen, Regelwerk, Rueckfragen, Vorgaenge } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface VorgaengeMaps {
  beteiligteMap: Map<string, Beteiligte>;
}

export function enrichVorgaenge(
  vorgaenge: Vorgaenge[],
  maps: VorgaengeMaps
): EnrichedVorgaenge[] {
  return vorgaenge.map(r => ({
    ...r,
    zustaendige_personName: resolveDisplay(r.fields.zustaendige_person, maps.beteiligteMap, 'vorname', 'nachname'),
  }));
}

interface QuellenMaps {
  vorgaengeMap: Map<string, Vorgaenge>;
}

export function enrichQuellen(
  quellen: Quellen[],
  maps: QuellenMaps
): EnrichedQuellen[] {
  return quellen.map(r => ({
    ...r,
    vorgangName: resolveDisplay(r.fields.vorgang, maps.vorgaengeMap, 'vorgangsnummer'),
  }));
}

interface ErfahrungenMaps {
  vorgaengeMap: Map<string, Vorgaenge>;
  beteiligteMap: Map<string, Beteiligte>;
}

export function enrichErfahrungen(
  erfahrungen: Erfahrungen[],
  maps: ErfahrungenMaps
): EnrichedErfahrungen[] {
  return erfahrungen.map(r => ({
    ...r,
    vorgangName: resolveDisplay(r.fields.vorgang, maps.vorgaengeMap, 'vorgangsnummer'),
    bestaetigt_vonName: resolveDisplay(r.fields.bestaetigt_von, maps.beteiligteMap, 'vorname', 'nachname'),
  }));
}

interface AnforderungenMaps {
  anforderungenMap: Map<string, Anforderungen>;
  vorgaengeMap: Map<string, Vorgaenge>;
  quellenMap: Map<string, Quellen>;
}

export function enrichAnforderungen(
  anforderungen: Anforderungen[],
  maps: AnforderungenMaps
): EnrichedAnforderungen[] {
  return anforderungen.map(r => ({
    ...r,
    widerspruch_zuName: resolveDisplay(r.fields.widerspruch_zu, maps.anforderungenMap, 'bezeichnung'),
    vorgangName: resolveDisplay(r.fields.vorgang, maps.vorgaengeMap, 'vorgangsnummer'),
    quelleName: resolveDisplay(r.fields.quelle, maps.quellenMap, 'bezeichnung'),
  }));
}

interface BeurteilungenMaps {
  vorgaengeMap: Map<string, Vorgaenge>;
  beteiligteMap: Map<string, Beteiligte>;
  anforderungenMap: Map<string, Anforderungen>;
}

export function enrichBeurteilungen(
  beurteilungen: Beurteilungen[],
  maps: BeurteilungenMaps
): EnrichedBeurteilungen[] {
  return beurteilungen.map(r => ({
    ...r,
    vorgangName: resolveDisplay(r.fields.vorgang, maps.vorgaengeMap, 'vorgangsnummer'),
    beurteilerName: resolveDisplay(r.fields.beurteiler, maps.beteiligteMap, 'vorname', 'nachname'),
    anforderungName: resolveDisplay(r.fields.anforderung, maps.anforderungenMap, 'bezeichnung'),
  }));
}

interface RueckfragenMaps {
  vorgaengeMap: Map<string, Vorgaenge>;
  beteiligteMap: Map<string, Beteiligte>;
  anforderungenMap: Map<string, Anforderungen>;
}

export function enrichRueckfragen(
  rueckfragen: Rueckfragen[],
  maps: RueckfragenMaps
): EnrichedRueckfragen[] {
  return rueckfragen.map(r => ({
    ...r,
    vorgangName: resolveDisplay(r.fields.vorgang, maps.vorgaengeMap, 'vorgangsnummer'),
    adressatName: resolveDisplay(r.fields.adressat, maps.beteiligteMap, 'vorname', 'nachname'),
    anforderungName: resolveDisplay(r.fields.anforderung, maps.anforderungenMap, 'bezeichnung'),
  }));
}

interface EntscheidungenMaps {
  vorgaengeMap: Map<string, Vorgaenge>;
  regelwerkMap: Map<string, Regelwerk>;
  beteiligteMap: Map<string, Beteiligte>;
  anforderungenMap: Map<string, Anforderungen>;
  beurteilungenMap: Map<string, Beurteilungen>;
}

export function enrichEntscheidungen(
  entscheidungen: Entscheidungen[],
  maps: EntscheidungenMaps
): EnrichedEntscheidungen[] {
  return entscheidungen.map(r => ({
    ...r,
    vorgangName: resolveDisplay(r.fields.vorgang, maps.vorgaengeMap, 'vorgangsnummer'),
    regelName: resolveDisplay(r.fields.regel, maps.regelwerkMap, 'bezeichnung'),
    entscheiderName: resolveDisplay(r.fields.entscheider, maps.beteiligteMap, 'vorname', 'nachname'),
    anforderungName: resolveDisplay(r.fields.anforderung, maps.anforderungenMap, 'bezeichnung'),
    beurteilungName: resolveDisplay(r.fields.beurteilung, maps.beurteilungenMap, 'sachverhalt'),
  }));
}
