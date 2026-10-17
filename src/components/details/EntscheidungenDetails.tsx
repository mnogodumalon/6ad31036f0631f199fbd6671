import type { Entscheidungen, Vorgaenge, Regelwerk, Beteiligte, Anforderungen, Beurteilungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface EntscheidungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Entscheidungen;
  /** N:1-Ziel „Vorgaenge": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorgaengeList: Vorgaenge[];
  /** Klick auf die Vorgaenge-Relation → overlay.push auf dessen Detail. */
  onOpenVorgaenge?: (record: Vorgaenge) => void;
  /** N:1-Ziel „Regelwerk": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  regelwerkList: Regelwerk[];
  /** Klick auf die Regelwerk-Relation → overlay.push auf dessen Detail. */
  onOpenRegelwerk?: (record: Regelwerk) => void;
  /** N:1-Ziel „Beteiligte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  beteiligteList: Beteiligte[];
  /** Klick auf die Beteiligte-Relation → overlay.push auf dessen Detail. */
  onOpenBeteiligte?: (record: Beteiligte) => void;
  /** N:1-Ziel „Anforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  anforderungenList: Anforderungen[];
  /** Klick auf die Anforderungen-Relation → overlay.push auf dessen Detail. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** N:1-Ziel „Beurteilungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  beurteilungenList: Beurteilungen[];
  /** Klick auf die Beurteilungen-Relation → overlay.push auf dessen Detail. */
  onOpenBeurteilungen?: (record: Beurteilungen) => void;
}

export function EntscheidungenDetails({
  record,
  vorgaengeList,
  onOpenVorgaenge,
  regelwerkList,
  onOpenRegelwerk,
  beteiligteList,
  onOpenBeteiligte,
  anforderungenList,
  onOpenAnforderungen,
  beurteilungenList,
  onOpenBeurteilungen,
}: EntscheidungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorgangTarget = vorgaengeList.find(r => r.record_id === extractRecordId(record.fields.vorgang));
  const regelTarget = regelwerkList.find(r => r.record_id === extractRecordId(record.fields.regel));
  const entscheiderTarget = beteiligteList.find(r => r.record_id === extractRecordId(record.fields.entscheider));
  const anforderungTarget = anforderungenList.find(r => r.record_id === extractRecordId(record.fields.anforderung));
  const beurteilungTarget = beurteilungenList.find(r => r.record_id === extractRecordId(record.fields.beurteilung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('entscheidungen', 'gegenstand')} value={record.fields.gegenstand} format="text" />
        <RecordField label={fieldLabel('entscheidungen', 'befugnis_geprueft')} value={record.fields.befugnis_geprueft} format="bool" />
        <RecordField label={fieldLabel('entscheidungen', 'unsicherheiten')} value={record.fields.unsicherheiten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'ki_vorschlag')} value={record.fields.ki_vorschlag} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'entscheidung')} value={record.fields.entscheidung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'folgen')} value={record.fields.folgen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('entscheidungen', 'entscheidungsdatum')} value={record.fields.entscheidungsdatum} format="date" />
        <RecordField label={fieldLabel('entscheidungen', 'freigabestatus')} value={record.fields.freigabestatus} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('entscheidungen', 'vorgang')}
          name={vorgangTarget?.fields.vorgangsnummer ?? '—'}
          meta={[vorgangTarget?.fields.titel, vorgangTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorgangTarget && onOpenVorgaenge ? () => onOpenVorgaenge!(vorgangTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'regel')}
          name={regelTarget?.fields.bezeichnung ?? '—'}
          meta={[regelTarget?.fields.geltungsbereich].filter(Boolean).join(' · ') || undefined}
          onClick={regelTarget && onOpenRegelwerk ? () => onOpenRegelwerk!(regelTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'entscheider')}
          name={entscheiderTarget?.fields.vorname ?? '—'}
          meta={[entscheiderTarget?.fields.email, entscheiderTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={entscheiderTarget && onOpenBeteiligte ? () => onOpenBeteiligte!(entscheiderTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'anforderung')}
          name={anforderungTarget?.fields.bezeichnung ?? '—'}
          meta={[anforderungTarget?.fields.wert].filter(Boolean).join(' · ') || undefined}
          onClick={anforderungTarget && onOpenAnforderungen ? () => onOpenAnforderungen!(anforderungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('entscheidungen', 'beurteilung')}
          name={beurteilungTarget?.fields.sachverhalt ?? '—'}
          meta={undefined}
          onClick={beurteilungTarget && onOpenBeurteilungen ? () => onOpenBeurteilungen!(beurteilungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ENTSCHEIDUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('entscheidungen')} />
    </>
  );
}
