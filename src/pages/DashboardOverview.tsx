import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconMessageQuestion, IconListCheck, IconGavel } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import type { EnrichedVorgaenge, EnrichedRueckfragen } from '@/types/enriched';
import { lookupOption } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { LOOKUP_OPTIONS } from '@/types/app';
import { tx } from '@/i18n';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';
import type { EnrichedErfahrungen } from '@/types/enriched';

type KpiFilter = 'rueckfragen' | 'luecken' | 'annahmen';

const STATUS_ORDER = ['neu', 'in_klaerung', 'wartet_auf_antwort', 'entscheidungsreif', 'abgeschlossen'];

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { setVorgaenge, setRueckfragen, fetchAll } = data;
  const clock = useClock();
  const [filter, setFilter] = useState<KpiFilter | null>(null);

  const crudRef = useEntityCrud(data, {
    footer: top => {
      if (top.type === 'vorgaenge') {
        const next = nextStatus(top.record);
        return next ? { label: tx('Weiter zum nächsten Status'), onClick: () => advanceVorgang(top.record) } : undefined;
      }
      if (top.type === 'rueckfragen') {
        const k = lookupKey(top.record.fields.status);
        if (k === 'vorbereitet') return { label: tx('Als gestellt markieren'), onClick: () => advanceRueckfrage(top.record) };
        if (k === 'beantwortet') return { label: tx('Als erledigt markieren'), onClick: () => advanceRueckfrage(top.record) };
      }
      return undefined;
    },
  });
  const crud = crudRef;
  const vorgaenge = crud.enriched.vorgaenge;
  const rueckfragen = crud.enriched.rueckfragen;
  const anforderungen = crud.enriched.anforderungen;
  const entscheidungen = crud.enriched.entscheidungen;
  const erfahrungen = crud.enriched.erfahrungen;

  const todayKey = format(clock, 'yyyy-MM-dd');

  // ── Ableitungen je Vorgang ──────────────────────────────────────────────
  const openQuestions = useMemo(
    () => rueckfragen.filter(r => { const k = lookupKey(r.fields.status); return k === 'vorbereitet' || k === 'gestellt'; }),
    [rueckfragen],
  );
  const gapReqs = useMemo(
    () => anforderungen.filter(a => { const k = lookupKey(a.fields.erfassungsstatus); return k === 'fehlt' || k === 'widerspruechlich'; }),
    [anforderungen],
  );
  const assumptionReqs = useMemo(
    () => anforderungen.filter(a => lookupKey(a.fields.art_der_angabe) === 'ungepruefte_annahme' || lookupKey(a.fields.erfassungsstatus) === 'ungeprueft'),
    [anforderungen],
  );
  const openDecisions = useMemo(
    () => entscheidungen.filter(e => { const k = lookupKey(e.fields.freigabestatus); return !k || k === 'offen' || k === 'unter_vorbehalt'; }),
    [entscheidungen],
  );

  const idsOf = (xs: { fields: { vorgang?: string } }[]) => {
    const s = new Set<string>();
    xs.forEach(x => { const id = extractRecordId(x.fields.vorgang); if (id) s.add(id); });
    return s;
  };
  const vQuestions = useMemo(() => idsOf(openQuestions), [openQuestions]);
  const vGaps = useMemo(() => idsOf(gapReqs), [gapReqs]);
  const vAssumptions = useMemo(() => idsOf(assumptionReqs), [assumptionReqs]);

  const activeVorgaenge = useMemo(() => vorgaenge.filter(v => lookupKey(v.fields.status) !== 'abgeschlossen'), [vorgaenge]);

  const readyUnreleased = useMemo(
    () => vorgaenge.filter(v => lookupKey(v.fields.status) === 'entscheidungsreif' && lookupKey(v.fields.freigabestatus) !== 'freigegeben'),
    [vorgaenge],
  );

  // ── Regeln: eine Prüfung für Drag, Hero-Fortschritt und Overlay-Footer ──
  function blockReason(v: EnrichedVorgaenge, newStatus: string): string | undefined {
    if (newStatus === 'entscheidungsreif' && vGaps.has(v.record_id)) {
      return tx('Noch offene Lücken oder Widersprüche bei den Anforderungen — erst klären.');
    }
    if (newStatus === 'abgeschlossen') {
      if (vQuestions.has(v.record_id)) return tx('Es gibt noch offene Rückfragen.');
      if (lookupKey(v.fields.freigabestatus) !== 'freigegeben') return tx('Abschluss erst nach Freigabe möglich.');
    }
    return undefined;
  }

  function nextStatus(v: EnrichedVorgaenge): string | undefined {
    const i = STATUS_ORDER.indexOf(lookupKey(v.fields.status) ?? 'neu');
    return i >= 0 && i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : undefined;
  }

  function writeStatus(v: EnrichedVorgaenge, newStatus: string) {
    const prev = v.fields.status;
    const prevKey = lookupKey(prev);
    setVorgaenge(list => list.map(x => x.record_id === v.record_id ? { ...x, fields: { ...x.fields, status: lookupOption('vorgaenge', 'status', newStatus) } } : x));
    LivingAppsService.updateVorgaengeEntry(v.record_id, { status: newStatus }).catch(() => { void fetchAll(); });
    const label = lookupOption('vorgaenge', 'status', newStatus).label;
    undoToast(tx`${v.fields.vorgangsnummer ?? v.fields.titel ?? ''} — ${label}`, () => {
      setVorgaenge(list => list.map(x => x.record_id === v.record_id ? { ...x, fields: { ...x.fields, status: prev } } : x));
      if (prevKey) LivingAppsService.updateVorgaengeEntry(v.record_id, { status: prevKey }).catch(() => { void fetchAll(); });
    });
  }

  function advanceVorgang(v: EnrichedVorgaenge) {
    const next = nextStatus(v);
    if (!next) return;
    const reason = blockReason(v, next);
    if (reason) { undoToast(reason); return; }
    writeStatus(v, next);
  }

  function advanceRueckfrage(r: EnrichedRueckfragen) {
    const k = lookupKey(r.fields.status);
    const next = k === 'vorbereitet' ? 'gestellt' : k === 'beantwortet' ? 'erledigt' : undefined;
    if (!next) return;
    const prev = r.fields.status;
    const prevDate = r.fields.gestellt_am;
    const patch: { status: string; gestellt_am?: string } = { status: next };
    if (next === 'gestellt') patch.gestellt_am = todayKey;
    setRueckfragen(list => list.map(x => x.record_id === r.record_id
      ? { ...x, fields: { ...x.fields, status: lookupOption('rueckfragen', 'status', next), ...(patch.gestellt_am ? { gestellt_am: patch.gestellt_am } : {}) } }
      : x));
    LivingAppsService.updateRueckfragenEntry(r.record_id, patch).catch(() => { void fetchAll(); });
    undoToast(next === 'gestellt' ? tx`Rückfrage an ${r.adressatName || tx('Beteiligte')} gestellt` : tx('Rückfrage erledigt'), () => {
      setRueckfragen(list => list.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, status: prev, gestellt_am: prevDate } } : x));
      if (k) LivingAppsService.updateRueckfragenEntry(r.record_id, { status: k }).catch(() => { void fetchAll(); });
    });
  }

  // ── Kanban ──────────────────────────────────────────────────────────────
  const columns = (LOOKUP_OPTIONS['vorgaenge']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })) as KanbanColumn[];

  const visibleVorgaenge = vorgaenge.filter(v => {
    if (!filter) return true;
    if (filter === 'rueckfragen') return vQuestions.has(v.record_id);
    if (filter === 'luecken') return vGaps.has(v.record_id);
    return vAssumptions.has(v.record_id);
  });

  const cards: KanbanCard[] = visibleVorgaenge
    .slice()
    .sort((a, b) => (a.fields.eingangsdatum ?? '').localeCompare(b.fields.eingangsdatum ?? ''))
    .map(v => {
      const freig = lookupKey(v.fields.freigabestatus);
      const status = lookupKey(v.fields.status) ?? 'neu';
      const flags: string[] = [];
      if (vQuestions.has(v.record_id)) flags.push(tx('Rückfragen offen'));
      if (vGaps.has(v.record_id)) flags.push(tx('Lücken'));
      if (vAssumptions.has(v.record_id)) flags.push(tx('Annahmen'));
      const tone: KanbanTone = status === 'abgeschlossen' ? 'default'
        : freig === 'freigegeben' ? 'success'
        : status === 'entscheidungsreif' || vGaps.has(v.record_id) ? 'warning'
        : 'default';
      return {
        id: `vorgang:${v.record_id}`,
        column: status,
        title: `${v.fields.vorgangsnummer ?? ''} ${v.fields.titel ?? ''}`.trim() || tx('Ohne Titel'),
        subtitle: (
          <span className="block min-w-0">
            <span className="block truncate">{v.fields.kunde ?? '—'} · {v.zustaendige_personName || tx('nicht zugewiesen')}</span>
            <span className="block truncate text-xs">
              {v.fields.freigabestatus?.label ?? tx('Nicht freigegeben')}{flags.length ? ` · ${flags.join(' · ')}` : ''}
            </span>
          </span>
        ),
        tone,
      };
    });

  const moveCard = (cardId: string, newColumn: string) => {
    const rid = cardId.split(':')[1];
    const v = vorgaenge.find(x => x.record_id === rid);
    if (!v) return;
    const reason = blockReason(v, newColumn);
    if (reason) return reason;
    writeStatus(v, newColumn);
  };

  // ── Kontextzeile ────────────────────────────────────────────────────────
  const waiting = vorgaenge.filter(v => lookupKey(v.fields.status) === 'wartet_auf_antwort');
  let context: string;
  if (vorgaenge.length === 0) {
    context = tx('Lege die erste Kundenanfrage an — alles Weitere hängt sich daran.');
  } else if (readyUnreleased.length > 0) {
    context = tx`${namen(readyUnreleased.map(v => v.fields.kunde ?? ''))} ist entscheidungsreif und wartet auf Freigabe.`;
  } else if (waiting.length > 0) {
    context = tx`Wir warten auf Antwort zu ${namen(waiting.map(v => v.fields.kunde ?? ''))}.`;
  } else if (activeVorgaenge.length > 0) {
    context = tx`Aktiv in Arbeit: ${namen(activeVorgaenge.map(v => v.fields.kunde ?? ''))}.`;
  } else {
    context = tx('Alle Vorgänge sind abgeschlossen.');
  }

  const newVorgang = () => crud.vorgaenge.openCreate({ status: 'neu', prozessschritt: 'anfrage_verstehen', freigabestatus: 'nicht_freigegeben' });

  const chartRows: ChartRow<EnrichedErfahrungen>[] = erfahrungen.map(e => ({ id: `erfahrung:${e.record_id}`, data: e }));

  const hero = vorgaenge.length === 0 ? (
    crud.vorgaenge.canWrite ? (
      <HeroBanner tone="primary" icon={<IconPlus size={18} />} action={{ label: tx('Erste Anfrage aufnehmen'), onClick: newVorgang }}>
        {tx('Noch kein Vorgang vorhanden — nimm die erste Kundenanfrage auf.')}
      </HeroBanner>
    ) : undefined
  ) : readyUnreleased.length > 0 ? (
    <HeroBanner
      tone="warning"
      icon={<IconAlertTriangle size={18} />}
      action={{ label: tx('Freigabe prüfen'), onClick: () => crud.vorgaenge.openDetail(readyUnreleased[0]) }}
    >
      <b>{namen(readyUnreleased.map(v => v.fields.vorgangsnummer ?? v.fields.titel ?? ''))}</b>{' '}
      {readyUnreleased.length === 1 ? tx('ist entscheidungsreif, aber noch nicht freigegeben.') : tx('sind entscheidungsreif, aber noch nicht freigegeben.')}
    </HeroBanner>
  ) : undefined;

  const toggle = (f: KpiFilter) => setFilter(cur => (cur === f ? null : f));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{tx('Anfragen & Angebote')}</h1>
          <p className="text-sm text-muted-foreground">{gruss(clock)} {context}</p>
        </div>
        {crud.vorgaenge.canWrite && (
          <Button onClick={newVorgang} className="shrink-0">
            <IconPlus size={16} className="shrink-0" /> {tx('Neue Anfrage')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={hero}
        kpis={vorgaenge.length > 0 ? (
          <StatStrip>
            <StatStripItem
              title={tx('Mit offenen Rückfragen')}
              value={vorgaenge.filter(v => vQuestions.has(v.record_id)).length}
              icon={<IconMessageQuestion size={16} />}
              onClick={() => toggle('rueckfragen')}
              active={filter === 'rueckfragen'}
            />
            <StatStripItem
              title={tx('Mit Lücke / Widerspruch')}
              value={vorgaenge.filter(v => vGaps.has(v.record_id)).length}
              icon={<IconAlertTriangle size={16} />}
              tone={vGaps.size > 0 ? 'warning' : 'default'}
              onClick={() => toggle('luecken')}
              active={filter === 'luecken'}
            />
            <StatStripItem
              title={tx('Mit ungeprüften Annahmen')}
              value={vorgaenge.filter(v => vAssumptions.has(v.record_id)).length}
              icon={<IconListCheck size={16} />}
              onClick={() => toggle('annahmen')}
              active={filter === 'annahmen'}
            />
          </StatStrip>
        ) : undefined}
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={['abgeschlossen']}
            onCardClick={card => {
              const v = vorgaenge.find(x => x.record_id === card.id.split(':')[1]);
              if (v) crud.vorgaenge.openDetail(v);
            }}
            onCardMove={moveCard}
            onAddCard={crud.vorgaenge.canWrite ? (column => crud.vorgaenge.openCreate({ status: column })) : undefined}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Offene Rückfragen')}
              icon={<IconMessageQuestion size={16} />}
              items={openQuestions.map(r => {
                const k = lookupKey(r.fields.status);
                return {
                  id: r.record_id,
                  title: r.fields.fragetext ?? tx('Rückfrage'),
                  secondLine: (
                    <>
                      <span className={k === 'gestellt' ? 'font-medium text-amber-600' : 'font-medium'}>{r.fields.status?.label}</span>
                      <span className="text-muted-foreground"> · {r.adressatName || tx('ohne Adressat')} · {r.vorgangName}{r.fields.gestellt_am ? ` · ${formatDate(r.fields.gestellt_am)}` : ''}</span>
                    </>
                  ),
                  action: k === 'vorbereitet'
                    ? { label: tx('Stellen'), onClick: () => advanceRueckfrage(r) }
                    : { label: tx('Antwort'), onClick: () => crud.rueckfragen.openEdit(r) },
                };
              })}
              onItemClick={id => { const r = rueckfragen.find(x => x.record_id === id); if (r) crud.rueckfragen.openDetail(r); }}
              empty={{ text: tx('Keine offenen Rückfragen.') }}
            />
            <WorkList
              title={tx('Lücken, Widersprüche & Annahmen')}
              icon={<IconListCheck size={16} />}
              items={[...gapReqs, ...assumptionReqs.filter(a => !gapReqs.includes(a))].map(a => {
                const gap = gapReqs.includes(a);
                return {
                  id: a.record_id,
                  title: a.fields.bezeichnung ?? tx('Anforderung'),
                  secondLine: (
                    <>
                      <span className={gap ? 'font-medium text-destructive' : 'font-medium text-amber-600'}>
                        {gap ? a.fields.erfassungsstatus?.label : tx('Ungeprüfte Annahme')}
                      </span>
                      <span className="text-muted-foreground"> · {a.vorgangName}</span>
                    </>
                  ),
                  action: {
                    label: tx('Rückfrage'),
                    onClick: () => crud.rueckfragen.openCreate({ vorgang: extractRecordId(a.fields.vorgang) ?? undefined, anforderung: a.record_id, status: 'vorbereitet' }),
                  },
                };
              })}
              onItemClick={id => { const a = anforderungen.find(x => x.record_id === id); if (a) crud.anforderungen.openDetail(a); }}
              empty={{ text: tx('Alle Angaben sind geklärt und bestätigt.') }}
            />
            <WorkList
              title={tx('Entscheidungen ohne Freigabe')}
              icon={<IconGavel size={16} />}
              items={openDecisions.map(e => ({
                id: e.record_id,
                title: e.fields.gegenstand ?? tx('Entscheidung'),
                secondLine: (
                  <>
                    <span className={e.fields.befugnis_geprueft ? 'font-medium' : 'font-medium text-amber-600'}>
                      {e.fields.befugnis_geprueft ? tx('Befugnis geprüft') : tx('Befugnis offen')}
                    </span>
                    <span className="text-muted-foreground">
                      {' · '}{tx('Regel')}: {e.regelName || '—'} · {tx('Entscheider')}: {e.entscheiderName || '—'} · {tx('Beurteilung')}: {e.beurteilungName || '—'}
                    </span>
                  </>
                ),
              }))}
              onItemClick={id => { const e = entscheidungen.find(x => x.record_id === id); if (e) crud.entscheidungen.openDetail(e); }}
              empty={{ text: tx('Keine offenen Entscheidungen.') }}
            />
            <ChartWidget<EnrichedErfahrungen>
              title={tx('Erfahrungen nach Erkenntnisklasse')}
              rows={chartRows}
              dimension={{ kind: 'category', accessor: r => r.data.fields.erkenntnisklasse, label: tx('Erkenntnisklasse') }}
              tone={seg => (seg.key === 'ungepruefte_annahme' ? 'warning' : 'default')}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
