import type { Anforderungen, Beurteilungen, Entscheidungen, Erfahrungen, Quellen, Rueckfragen, Vorgaenge } from './app';

export type EnrichedVorgaenge = Vorgaenge & {
  zustaendige_personName: string;
};

export type EnrichedQuellen = Quellen & {
  vorgangName: string;
};

export type EnrichedErfahrungen = Erfahrungen & {
  vorgangName: string;
  bestaetigt_vonName: string;
};

export type EnrichedAnforderungen = Anforderungen & {
  widerspruch_zuName: string;
  vorgangName: string;
  quelleName: string;
};

export type EnrichedBeurteilungen = Beurteilungen & {
  vorgangName: string;
  beurteilerName: string;
  anforderungName: string;
};

export type EnrichedRueckfragen = Rueckfragen & {
  vorgangName: string;
  adressatName: string;
  anforderungName: string;
};

export type EnrichedEntscheidungen = Entscheidungen & {
  vorgangName: string;
  regelName: string;
  entscheiderName: string;
  anforderungName: string;
  beurteilungName: string;
};
