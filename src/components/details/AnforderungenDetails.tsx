import type { Anforderungen, Vorgaenge, Quellen, Beurteilungen, Rueckfragen, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface AnforderungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Anforderungen;
  /** N:1-Ziel „Anforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  anforderungenList: Anforderungen[];
  /** Klick auf die Anforderungen-Relation → overlay.push auf dessen Detail. */
  onOpenAnforderungen?: (record: Anforderungen) => void;
  /** N:1-Ziel „Vorgaenge": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  vorgaengeList: Vorgaenge[];
  /** Klick auf die Vorgaenge-Relation → overlay.push auf dessen Detail. */
  onOpenVorgaenge?: (record: Vorgaenge) => void;
  /** N:1-Ziel „Quellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  quellenList: Quellen[];
  /** Klick auf die Quellen-Relation → overlay.push auf dessen Detail. */
  onOpenQuellen?: (record: Quellen) => void;
  /** 1:N „Beurteilungen" (anforderung): VOLLE Liste — der Block filtert auf diesen Record. */
  beurteilungenList: Beurteilungen[];
  /** Zeilen-Klick → overlay.push auf das Beurteilungen-Detail (nie der Edit-Dialog). */
  onOpenBeurteilungen: (record: Beurteilungen) => void;
  /** Kontextuelles „+": öffnet den Beurteilungen-Dialog mit diesem Record vorgesetzt. */
  onAddBeurteilungen?: () => void;
  /** 1:N „Rückfragen" (anforderung): VOLLE Liste — der Block filtert auf diesen Record. */
  rueckfragenList: Rueckfragen[];
  /** Zeilen-Klick → overlay.push auf das Rueckfragen-Detail (nie der Edit-Dialog). */
  onOpenRueckfragen: (record: Rueckfragen) => void;
  /** Kontextuelles „+": öffnet den Rueckfragen-Dialog mit diesem Record vorgesetzt. */
  onAddRueckfragen?: () => void;
  /** 1:N „Entscheidungen" (anforderung): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
}

export function AnforderungenDetails({
  record,
  anforderungenList,
  onOpenAnforderungen,
  vorgaengeList,
  onOpenVorgaenge,
  quellenList,
  onOpenQuellen,
  beurteilungenList,
  onOpenBeurteilungen,
  onAddBeurteilungen,
  rueckfragenList,
  onOpenRueckfragen,
  onAddRueckfragen,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
}: AnforderungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const widerspruch_zuTarget = anforderungenList.find(r => r.record_id === extractRecordId(record.fields.widerspruch_zu));
  const vorgangTarget = vorgaengeList.find(r => r.record_id === extractRecordId(record.fields.vorgang));
  const quelleTarget = quellenList.find(r => r.record_id === extractRecordId(record.fields.quelle));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anforderungen', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('anforderungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('anforderungen', 'kategorie')} value={record.fields.kategorie} format="pill" />
        <RecordField label={fieldLabel('anforderungen', 'wert')} value={record.fields.wert} format="text" />
        <RecordField label={fieldLabel('anforderungen', 'erfassungsstatus')} value={record.fields.erfassungsstatus} format="pill" />
        <RecordField label={fieldLabel('anforderungen', 'art_der_angabe')} value={record.fields.art_der_angabe} format="pill" />
        <RecordField label={fieldLabel('anforderungen', 'hinweis_luecke')} value={record.fields.hinweis_luecke} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('anforderungen', 'widerspruch_zu')}
          name={widerspruch_zuTarget?.fields.bezeichnung ?? '—'}
          meta={[widerspruch_zuTarget?.fields.wert].filter(Boolean).join(' · ') || undefined}
          onClick={widerspruch_zuTarget && onOpenAnforderungen ? () => onOpenAnforderungen!(widerspruch_zuTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anforderungen', 'vorgang')}
          name={vorgangTarget?.fields.vorgangsnummer ?? '—'}
          meta={[vorgangTarget?.fields.titel, vorgangTarget?.fields.kunde].filter(Boolean).join(' · ') || undefined}
          onClick={vorgangTarget && onOpenVorgaenge ? () => onOpenVorgaenge!(vorgangTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anforderungen', 'quelle')}
          name={quelleTarget?.fields.bezeichnung ?? '—'}
          meta={[quelleTarget?.fields.version].filter(Boolean).join(' · ') || undefined}
          onClick={quelleTarget && onOpenQuellen ? () => onOpenQuellen!(quelleTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('beurteilungen')}
        items={beurteilungenList.filter(r => extractRecordId(r.fields.anforderung) === record.record_id)}
        map={r => ({ name: appLabel('beurteilungen'), meta: r.fields.beurteilt_am })}
        onOpen={onOpenBeurteilungen}
        onAdd={onAddBeurteilungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('rueckfragen')}
        items={rueckfragenList.filter(r => extractRecordId(r.fields.anforderung) === record.record_id)}
        map={r => ({ name: r.fields.buendelungsgruppe ?? appLabel('rueckfragen'), meta: r.fields.gestellt_am })}
        onOpen={onOpenRueckfragen}
        onAdd={onAddRueckfragen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.anforderung) === record.record_id)}
        map={r => ({ name: r.fields.gegenstand ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ANFORDERUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('anforderungen')} />
    </>
  );
}
