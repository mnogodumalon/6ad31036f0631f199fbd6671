import type { Beteiligte, Vorgaenge, Erfahrungen, Beurteilungen, Rueckfragen, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface BeteiligteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Beteiligte;
  /** 1:N „Vorgänge" (zustaendige_person): VOLLE Liste — der Block filtert auf diesen Record. */
  vorgaengeList: Vorgaenge[];
  /** Zeilen-Klick → overlay.push auf das Vorgaenge-Detail (nie der Edit-Dialog). */
  onOpenVorgaenge: (record: Vorgaenge) => void;
  /** Kontextuelles „+": öffnet den Vorgaenge-Dialog mit diesem Record vorgesetzt. */
  onAddVorgaenge?: () => void;
  /** 1:N „Erfahrungen" (bestaetigt_von): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Beurteilungen" (beurteiler): VOLLE Liste — der Block filtert auf diesen Record. */
  beurteilungenList: Beurteilungen[];
  /** Zeilen-Klick → overlay.push auf das Beurteilungen-Detail (nie der Edit-Dialog). */
  onOpenBeurteilungen: (record: Beurteilungen) => void;
  /** Kontextuelles „+": öffnet den Beurteilungen-Dialog mit diesem Record vorgesetzt. */
  onAddBeurteilungen?: () => void;
  /** 1:N „Rückfragen" (adressat): VOLLE Liste — der Block filtert auf diesen Record. */
  rueckfragenList: Rueckfragen[];
  /** Zeilen-Klick → overlay.push auf das Rueckfragen-Detail (nie der Edit-Dialog). */
  onOpenRueckfragen: (record: Rueckfragen) => void;
  /** Kontextuelles „+": öffnet den Rueckfragen-Dialog mit diesem Record vorgesetzt. */
  onAddRueckfragen?: () => void;
  /** 1:N „Entscheidungen" (entscheider): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
}

export function BeteiligteDetails({
  record,
  vorgaengeList,
  onOpenVorgaenge,
  onAddVorgaenge,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  beurteilungenList,
  onOpenBeurteilungen,
  onAddBeurteilungen,
  rueckfragenList,
  onOpenRueckfragen,
  onAddRueckfragen,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
}: BeteiligteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('beteiligte', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('beteiligte', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('beteiligte', 'stelle')} value={record.fields.stelle} format="pill" />
        <RecordField label={fieldLabel('beteiligte', 'zustaendigkeitsbereich')} value={record.fields.zustaendigkeitsbereich} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beteiligte', 'entscheidungsbefugnis')} value={record.fields.entscheidungsbefugnis} format="pill" />
        <RecordField label={fieldLabel('beteiligte', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('beteiligte', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('beteiligte', 'organisation')} value={record.fields.organisation} format="text" />
        <RecordField label={fieldLabel('beteiligte', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('vorgaenge')}
        items={vorgaengeList.filter(r => extractRecordId(r.fields.zustaendige_person) === record.record_id)}
        map={r => ({ name: r.fields.vorgangsnummer ?? appLabel('vorgaenge'), meta: r.fields.eingangsdatum })}
        onOpen={onOpenVorgaenge}
        onAdd={onAddVorgaenge}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.bestaetigt_von) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('beurteilungen')}
        items={beurteilungenList.filter(r => extractRecordId(r.fields.beurteiler) === record.record_id)}
        map={r => ({ name: appLabel('beurteilungen'), meta: r.fields.beurteilt_am })}
        onOpen={onOpenBeurteilungen}
        onAdd={onAddBeurteilungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('rueckfragen')}
        items={rueckfragenList.filter(r => extractRecordId(r.fields.adressat) === record.record_id)}
        map={r => ({ name: r.fields.buendelungsgruppe ?? appLabel('rueckfragen'), meta: r.fields.gestellt_am })}
        onOpen={onOpenRueckfragen}
        onAdd={onAddRueckfragen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.entscheider) === record.record_id)}
        map={r => ({ name: r.fields.gegenstand ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BETEILIGTE} recordId={record.record_id} readOnly={!perms.canWrite('beteiligte')} />
    </>
  );
}
