import type { Erfahrungen, Vorgaenge, Beteiligte } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface ErfahrungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Erfahrungen;
  /** N:1-Ziel „Vorgaenge": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorgaengeList: Vorgaenge[];
  /** Klick auf die Vorgaenge-Relation → overlay.push auf dessen Detail. */
  onOpenVorgaenge?: (record: Vorgaenge) => void;
  /** N:1-Ziel „Beteiligte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  beteiligteList: Beteiligte[];
  /** Klick auf die Beteiligte-Relation → overlay.push auf dessen Detail. */
  onOpenBeteiligte?: (record: Beteiligte) => void;
}

export function ErfahrungenDetails({
  record,
  vorgaengeList,
  onOpenVorgaenge,
  beteiligteList,
  onOpenBeteiligte,
}: ErfahrungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const vorgangTarget = vorgaengeList.find(r => r.record_id === extractRecordId(record.fields.vorgang));
  const bestaetigt_vonTarget = beteiligteList.find(r => r.record_id === extractRecordId(record.fields.bestaetigt_von));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('erfahrungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'erfahrungsart')} value={record.fields.erfahrungsart} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'erkenntnisklasse')} value={record.fields.erkenntnisklasse} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'wiederverwendbar')} value={record.fields.wiederverwendbar} format="bool" />
        <RecordField label={fieldLabel('erfahrungen', 'verbesserungsvorschlag')} value={record.fields.verbesserungsvorschlag} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('erfahrungen', 'vorgang')}
          name={vorgangTarget?.fields.vorgangsnummer ?? '—'}
          meta={[vorgangTarget?.fields.titel, vorgangTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorgangTarget && onOpenVorgaenge ? () => onOpenVorgaenge!(vorgangTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'bestaetigt_von')}
          name={bestaetigt_vonTarget?.fields.vorname ?? '—'}
          meta={[bestaetigt_vonTarget?.fields.email, bestaetigt_vonTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={bestaetigt_vonTarget && onOpenBeteiligte ? () => onOpenBeteiligte!(bestaetigt_vonTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ERFAHRUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('erfahrungen')} />
    </>
  );
}
