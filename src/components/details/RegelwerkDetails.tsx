import type { Regelwerk, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface RegelwerkDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Regelwerk;
  /** 1:N „Entscheidungen" (regel): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
}

export function RegelwerkDetails({
  record,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
}: RegelwerkDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('regelwerk', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('regelwerk', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('regelwerk', 'geltungsbereich')} value={record.fields.geltungsbereich} format="text" />
        <RecordField label={fieldLabel('regelwerk', 'regeltyp')} value={record.fields.regeltyp} format="pill" />
        <RecordField label={fieldLabel('regelwerk', 'erforderliche_befugnis')} value={record.fields.erforderliche_befugnis} format="pill" />
        <RecordField label={fieldLabel('regelwerk', 'verbindlich')} value={record.fields.verbindlich} format="bool" />
        <RecordField label={fieldLabel('regelwerk', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('regelwerk', 'status')} value={record.fields.status} format="pill" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.regel) === record.record_id)}
        map={r => ({ name: r.fields.gegenstand ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.REGELWERK} recordId={record.record_id} readOnly={!perms.canWrite('regelwerk')} />
    </>
  );
}
