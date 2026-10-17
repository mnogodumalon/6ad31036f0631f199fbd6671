import type { Beurteilungen, Vorgaenge, Beteiligte, Anforderungen, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface BeurteilungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Beurteilungen;
  /** N:1-Ziel „Vorgaenge": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorgaengeList: Vorgaenge[];
  /** Klick auf die Vorgaenge-Relation → overlay.push auf dessen Detail. */
  onOpenVorgaenge?: (record: Vorgaenge) => void;
  /** N:1-Ziel „Beteiligte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  beteiligteList: Beteiligte[];
  /** Klick auf die Beteiligte-Relation → overlay.push auf dessen Detail. */
  onOpenBeteiligte?: (record: Beteiligte) => void;
  /** N:1-Ziel „Anforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  anforderungenList: Anforderungen[];
  /** Klick auf die Anforderungen-Relation → overlay.push auf dessen Detail. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** 1:N „Entscheidungen" (beurteilung): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
}

export function BeurteilungenDetails({
  record,
  vorgaengeList,
  onOpenVorgaenge,
  beteiligteList,
  onOpenBeteiligte,
  anforderungenList,
  onOpenAnforderungen,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
}: BeurteilungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorgangTarget = vorgaengeList.find(r => r.record_id === extractRecordId(record.fields.vorgang));
  const beurteilerTarget = beteiligteList.find(r => r.record_id === extractRecordId(record.fields.beurteiler));
  const anforderungTarget = anforderungenList.find(r => r.record_id === extractRecordId(record.fields.anforderung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('beurteilungen', 'fachgebiet')} value={record.fields.fachgebiet} format="pill" />
        <RecordField label={fieldLabel('beurteilungen', 'sachverhalt')} value={record.fields.sachverhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'bewertung')} value={record.fields.bewertung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'moegliche_erklaerung')} value={record.fields.moegliche_erklaerung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'unsicherheiten')} value={record.fields.unsicherheiten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'fachlich_bestaetigt')} value={record.fields.fachlich_bestaetigt} format="bool" />
        <RecordField label={fieldLabel('beurteilungen', 'beurteilt_am')} value={record.fields.beurteilt_am} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('beurteilungen', 'vorgang')}
          name={vorgangTarget?.fields.vorgangsnummer ?? '—'}
          meta={[vorgangTarget?.fields.titel, vorgangTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorgangTarget && onOpenVorgaenge ? () => onOpenVorgaenge!(vorgangTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('beurteilungen', 'beurteiler')}
          name={beurteilerTarget?.fields.vorname ?? '—'}
          meta={[beurteilerTarget?.fields.email, beurteilerTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={beurteilerTarget && onOpenBeteiligte ? () => onOpenBeteiligte!(beurteilerTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('beurteilungen', 'anforderung')}
          name={anforderungTarget?.fields.bezeichnung ?? '—'}
          meta={[anforderungTarget?.fields.wert].filter(Boolean).join(' · ') || undefined}
          onClick={anforderungTarget && onOpenAnforderungen ? () => onOpenAnforderungen!(anforderungTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.beurteilung) === record.record_id)}
        map={r => ({ name: r.fields.gegenstand ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BEURTEILUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('beurteilungen')} />
    </>
  );
}
