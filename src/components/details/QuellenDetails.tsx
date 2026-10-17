import type { Quellen, Vorgaenge, Anforderungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface QuellenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Quellen;
  /** N:1-Ziel „Vorgaenge": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorgaengeList: Vorgaenge[];
  /** Klick auf die Vorgaenge-Relation → overlay.push auf dessen Detail. */
  onOpenVorgaenge?: (record: Vorgaenge) => void;
  /** 1:N „Anforderungen" (quelle): VOLLE Liste — der Block filtert auf diesen Record. */
  anforderungenList: Anforderungen[];
  /** Zeilen-Klick → overlay.push auf das Anforderungen-Detail (nie der Edit-Dialog). */
  onOpenAnforderungen: (record: Anforderungen) => void;
  /** Kontextuelles „+": öffnet den Anforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnforderungen?: () => void;
}

export function QuellenDetails({
  record,
  vorgaengeList,
  onOpenVorgaenge,
  anforderungenList,
  onOpenAnforderungen,
  onAddAnforderungen,
}: QuellenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorgangTarget = vorgaengeList.find(r => r.record_id === extractRecordId(record.fields.vorgang));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('quellen', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('quellen', 'quellenart')} value={record.fields.quellenart} format="pill" />
        <RecordField label={fieldLabel('quellen', 'fundort')} value={record.fields.fundort} format="url" />
        <RecordField label={fieldLabel('quellen', 'version')} value={record.fields.version} format="text" />
        <RecordField label={fieldLabel('quellen', 'verlaesslichkeit')} value={record.fields.verlaesslichkeit} format="pill" />
        <RecordField label={fieldLabel('quellen', 'datei')} className="md:col-span-2">
          {record.fields.datei ? (
            <MediaThumbnail src={record.fields.datei as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('quellen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('quellen', 'vorgang')}
          name={vorgangTarget?.fields.vorgangsnummer ?? '—'}
          meta={[vorgangTarget?.fields.titel, vorgangTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorgangTarget && onOpenVorgaenge ? () => onOpenVorgaenge!(vorgangTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anforderungen')}
        items={anforderungenList.filter(r => extractRecordId(r.fields.quelle) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('anforderungen'), meta: undefined })}
        onOpen={onOpenAnforderungen}
        onAdd={onAddAnforderungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.QUELLEN} recordId={record.record_id} readOnly={!perms.canWrite('quellen')} />
    </>
  );
}
