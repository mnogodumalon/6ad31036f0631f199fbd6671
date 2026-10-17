import type { Vorgaenge, Beteiligte, Quellen, Erfahrungen, Anforderungen, Beurteilungen, Rueckfragen, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface VorgaengeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Vorgaenge;
  /** N:1-Ziel „Beteiligte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  beteiligteList: Beteiligte[];
  /** Klick auf die Beteiligte-Relation → overlay.push auf dessen Detail. */
  onOpenBeteiligte?: (record: Beteiligte) => void;
  /** 1:N „Quellen" (vorgang): VOLLE Liste — der Block filtert auf diesen Record. */
  quellenList: Quellen[];
  /** Zeilen-Klick → overlay.push auf das Quellen-Detail (nie der Edit-Dialog). */
  onOpenQuellen: (record: Quellen) => void;
  /** Kontextuelles „+": öffnet den Quellen-Dialog mit diesem Record vorgesetzt. */
  onAddQuellen?: () => void;
  /** 1:N „Erfahrungen" (vorgang): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Anforderungen" (vorgang): VOLLE Liste — der Block filtert auf diesen Record. */
  anforderungenList: Anforderungen[];
  /** Zeilen-Klick → overlay.push auf das Anforderungen-Detail (nie der Edit-Dialog). */
  onOpenAnforderungen: (record: Anforderungen) => void;
  /** Kontextuelles „+": öffnet den Anforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnforderungen?: () => void;
  /** 1:N „Beurteilungen" (vorgang): VOLLE Liste — der Block filtert auf diesen Record. */
  beurteilungenList: Beurteilungen[];
  /** Zeilen-Klick → overlay.push auf das Beurteilungen-Detail (nie der Edit-Dialog). */
  onOpenBeurteilungen: (record: Beurteilungen) => void;
  /** Kontextuelles „+": öffnet den Beurteilungen-Dialog mit diesem Record vorgesetzt. */
  onAddBeurteilungen?: () => void;
  /** 1:N „Rückfragen" (vorgang): VOLLE Liste — der Block filtert auf diesen Record. */
  rueckfragenList: Rueckfragen[];
  /** Zeilen-Klick → overlay.push auf das Rueckfragen-Detail (nie der Edit-Dialog). */
  onOpenRueckfragen: (record: Rueckfragen) => void;
  /** Kontextuelles „+": öffnet den Rueckfragen-Dialog mit diesem Record vorgesetzt. */
  onAddRueckfragen?: () => void;
  /** 1:N „Entscheidungen" (vorgang): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
}

export function VorgaengeDetails({
  record,
  beteiligteList,
  onOpenBeteiligte,
  quellenList,
  onOpenQuellen,
  onAddQuellen,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  anforderungenList,
  onOpenAnforderungen,
  onAddAnforderungen,
  beurteilungenList,
  onOpenBeurteilungen,
  onAddBeurteilungen,
  rueckfragenList,
  onOpenRueckfragen,
  onAddRueckfragen,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
}: VorgaengeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const zustaendige_personTarget = beteiligteList.find(r => r.record_id === extractRecordId(record.fields.zustaendige_person));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('vorgaenge', 'vorgangsnummer')} value={record.fields.vorgangsnummer} format="text" />
        <RecordField label={fieldLabel('vorgaenge', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('vorgaenge', 'kunde')} value={record.fields.kunde} format="text" />
        <RecordField label={fieldLabel('vorgaenge', 'eingangsdatum')} value={record.fields.eingangsdatum} format="date" />
        <RecordField label={fieldLabel('vorgaenge', 'kundenanfrage')} value={record.fields.kundenanfrage} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorgaenge', 'prozessschritt')} value={record.fields.prozessschritt} format="pill" />
        <RecordField label={fieldLabel('vorgaenge', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('vorgaenge', 'freigabestatus')} value={record.fields.freigabestatus} format="pill" />
        <RecordField label={fieldLabel('vorgaenge', 'auftragsentwurf')} value={record.fields.auftragsentwurf} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorgaenge', 'geklaerte_punkte')} value={record.fields.geklaerte_punkte} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorgaenge', 'offene_punkte')} value={record.fields.offene_punkte} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vorgaenge', 'uebergabefaehig')} value={record.fields.uebergabefaehig} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('vorgaenge', 'zustaendige_person')}
          name={zustaendige_personTarget?.fields.vorname ?? '—'}
          meta={[zustaendige_personTarget?.fields.email, zustaendige_personTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={zustaendige_personTarget && onOpenBeteiligte ? () => onOpenBeteiligte!(zustaendige_personTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('quellen')}
        items={quellenList.filter(r => extractRecordId(r.fields.vorgang) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('quellen'), meta: undefined })}
        onOpen={onOpenQuellen}
        onAdd={onAddQuellen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.vorgang) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: undefined })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('anforderungen')}
        items={anforderungenList.filter(r => extractRecordId(r.fields.vorgang) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('anforderungen'), meta: undefined })}
        onOpen={onOpenAnforderungen}
        onAdd={onAddAnforderungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('beurteilungen')}
        items={beurteilungenList.filter(r => extractRecordId(r.fields.vorgang) === record.record_id)}
        map={r => ({ name: appLabel('beurteilungen'), meta: r.fields.beurteilt_am })}
        onOpen={onOpenBeurteilungen}
        onAdd={onAddBeurteilungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('rueckfragen')}
        items={rueckfragenList.filter(r => extractRecordId(r.fields.vorgang) === record.record_id)}
        map={r => ({ name: r.fields.buendelungsgruppe ?? appLabel('rueckfragen'), meta: r.fields.gestellt_am })}
        onOpen={onOpenRueckfragen}
        onAdd={onAddRueckfragen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.vorgang) === record.record_id)}
        map={r => ({ name: r.fields.gegenstand ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.VORGAENGE} recordId={record.record_id} readOnly={!perms.canWrite('vorgaenge')} />
    </>
  );
}
