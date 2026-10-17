import type { Rueckfragen, Vorgaenge, Beteiligte, Anforderungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface RueckfragenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Rueckfragen;
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
}

export function RueckfragenDetails({
  record,
  vorgaengeList,
  onOpenVorgaenge,
  beteiligteList,
  onOpenBeteiligte,
  anforderungenList,
  onOpenAnforderungen,
}: RueckfragenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorgangTarget = vorgaengeList.find(r => r.record_id === extractRecordId(record.fields.vorgang));
  const adressatTarget = beteiligteList.find(r => r.record_id === extractRecordId(record.fields.adressat));
  const anforderungTarget = anforderungenList.find(r => r.record_id === extractRecordId(record.fields.anforderung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('rueckfragen', 'fragetext')} value={record.fields.fragetext} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('rueckfragen', 'buendelungsgruppe')} value={record.fields.buendelungsgruppe} format="text" />
        <RecordField label={fieldLabel('rueckfragen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('rueckfragen', 'gestellt_am')} value={record.fields.gestellt_am} format="date" />
        <RecordField label={fieldLabel('rueckfragen', 'antwort')} value={record.fields.antwort} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('rueckfragen', 'antwort_am')} value={record.fields.antwort_am} format="date" />
        <RecordField label={fieldLabel('rueckfragen', 'aenderung_angabe')} value={record.fields.aenderung_angabe} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('rueckfragen', 'vorgang')}
          name={vorgangTarget?.fields.vorgangsnummer ?? '—'}
          meta={[vorgangTarget?.fields.titel, vorgangTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorgangTarget && onOpenVorgaenge ? () => onOpenVorgaenge!(vorgangTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('rueckfragen', 'adressat')}
          name={adressatTarget?.fields.vorname ?? '—'}
          meta={[adressatTarget?.fields.email, adressatTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={adressatTarget && onOpenBeteiligte ? () => onOpenBeteiligte!(adressatTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('rueckfragen', 'anforderung')}
          name={anforderungTarget?.fields.bezeichnung ?? '—'}
          meta={[anforderungTarget?.fields.wert].filter(Boolean).join(' · ') || undefined}
          onClick={anforderungTarget && onOpenAnforderungen ? () => onOpenAnforderungen!(anforderungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.RUECKFRAGEN} recordId={record.record_id} readOnly={!perms.canWrite('rueckfragen')} />
    </>
  );
}
