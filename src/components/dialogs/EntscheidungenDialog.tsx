/**
 * EntscheidungenDialog — pre-generated create/edit dialog for Entscheidungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * vorgaengeList (full hook array — resolves the Vorgaenge applookup),
 * regelwerkList (full hook array — resolves the Regelwerk applookup),
 * beteiligteList (full hook array — resolves the Beteiligte applookup),
 * anforderungenList (full hook array — resolves the Anforderungen applookup),
 * beurteilungenList (full hook array — resolves the Beurteilungen applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * EntscheidungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Entscheidungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<EntscheidungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Entscheidungen, Vorgaenge, Regelwerk, Beteiligte, Anforderungen, Beurteilungen, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Entscheidungen';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/Combobox';
import { VorgaengeDialog } from '@/components/dialogs/VorgaengeDialog';
import { RegelwerkDialog } from '@/components/dialogs/RegelwerkDialog';
import { BeteiligteDialog } from '@/components/dialogs/BeteiligteDialog';
import { AnforderungenDialog } from '@/components/dialogs/AnforderungenDialog';
import { BeurteilungenDialog } from '@/components/dialogs/BeurteilungenDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for EntscheidungenDialog.defaultValues — see file header. */
export type EntscheidungenDialogDefaults = Omit<Entscheidungen['fields'], 'freigabestatus'> & {
    freigabestatus?: LookupValue | string;
  };

interface EntscheidungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Entscheidungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: EntscheidungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  vorgaengeList: Vorgaenge[];
  regelwerkList: Regelwerk[];
  beteiligteList: Beteiligte[];
  anforderungenList: Anforderungen[];
  beurteilungenList: Beurteilungen[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  freigabestatus: LOOKUP_OPTIONS['entscheidungen']?.['freigabestatus'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  vorgang: APP_IDS.VORGAENGE,
  regel: APP_IDS.REGELWERK,
  entscheider: APP_IDS.BETEILIGTE,
  anforderung: APP_IDS.ANFORDERUNGEN,
  beurteilung: APP_IDS.BEURTEILUNGEN,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function EntscheidungenDialog({ open, onClose, onSubmit, defaultValues, recordId, vorgaengeList, regelwerkList, beteiligteList, anforderungenList, beurteilungenList, enablePhotoScan = true, enablePhotoLocation = true }: EntscheidungenDialogProps) {
  const [fields, setFields] = useState<Partial<Entscheidungen['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Vorgaenge" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraVorgaenge` list, and select it in
  // the originating Combobox via the captured `createVorgaengeField`.
  const [createVorgaengeOpen, setCreateVorgaengeOpen] = useState(false);
  const [createVorgaengeInitial, setCreateVorgaengeInitial] = useState('');
  const [createVorgaengeField, setCreateVorgaengeField] = useState<string>('');
  const [extraVorgaenge, setExtraVorgaenge] = useState< Vorgaenge[]>([]);
  const vorgaengeListAll = useMemo(
    () => [...vorgaengeList, ...extraVorgaenge],
    [vorgaengeList, extraVorgaenge],
  );
  function openCreateVorgaenge(fieldKey: string, q: string) {
    setCreateVorgaengeField(fieldKey);
    setCreateVorgaengeInitial(q);
    setCreateVorgaengeOpen(true);
  }
  // Inline-Create state for "Regelwerk" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraRegelwerk` list, and select it in
  // the originating Combobox via the captured `createRegelwerkField`.
  const [createRegelwerkOpen, setCreateRegelwerkOpen] = useState(false);
  const [createRegelwerkInitial, setCreateRegelwerkInitial] = useState('');
  const [createRegelwerkField, setCreateRegelwerkField] = useState<string>('');
  const [extraRegelwerk, setExtraRegelwerk] = useState< Regelwerk[]>([]);
  const regelwerkListAll = useMemo(
    () => [...regelwerkList, ...extraRegelwerk],
    [regelwerkList, extraRegelwerk],
  );
  function openCreateRegelwerk(fieldKey: string, q: string) {
    setCreateRegelwerkField(fieldKey);
    setCreateRegelwerkInitial(q);
    setCreateRegelwerkOpen(true);
  }
  // Inline-Create state for "Beteiligte" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraBeteiligte` list, and select it in
  // the originating Combobox via the captured `createBeteiligteField`.
  const [createBeteiligteOpen, setCreateBeteiligteOpen] = useState(false);
  const [createBeteiligteInitial, setCreateBeteiligteInitial] = useState('');
  const [createBeteiligteField, setCreateBeteiligteField] = useState<string>('');
  const [extraBeteiligte, setExtraBeteiligte] = useState< Beteiligte[]>([]);
  const beteiligteListAll = useMemo(
    () => [...beteiligteList, ...extraBeteiligte],
    [beteiligteList, extraBeteiligte],
  );
  function openCreateBeteiligte(fieldKey: string, q: string) {
    setCreateBeteiligteField(fieldKey);
    setCreateBeteiligteInitial(q);
    setCreateBeteiligteOpen(true);
  }
  // Inline-Create state for "Anforderungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraAnforderungen` list, and select it in
  // the originating Combobox via the captured `createAnforderungenField`.
  const [createAnforderungenOpen, setCreateAnforderungenOpen] = useState(false);
  const [createAnforderungenInitial, setCreateAnforderungenInitial] = useState('');
  const [createAnforderungenField, setCreateAnforderungenField] = useState<string>('');
  const [extraAnforderungen, setExtraAnforderungen] = useState< Anforderungen[]>([]);
  const anforderungenListAll = useMemo(
    () => [...anforderungenList, ...extraAnforderungen],
    [anforderungenList, extraAnforderungen],
  );
  function openCreateAnforderungen(fieldKey: string, q: string) {
    setCreateAnforderungenField(fieldKey);
    setCreateAnforderungenInitial(q);
    setCreateAnforderungenOpen(true);
  }
  // Inline-Create state for "Beurteilungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraBeurteilungen` list, and select it in
  // the originating Combobox via the captured `createBeurteilungenField`.
  const [createBeurteilungenOpen, setCreateBeurteilungenOpen] = useState(false);
  const [createBeurteilungenInitial, setCreateBeurteilungenInitial] = useState('');
  const [createBeurteilungenField, setCreateBeurteilungenField] = useState<string>('');
  const [extraBeurteilungen, setExtraBeurteilungen] = useState< Beurteilungen[]>([]);
  const beurteilungenListAll = useMemo(
    () => [...beurteilungenList, ...extraBeurteilungen],
    [beurteilungenList, extraBeurteilungen],
  );
  function openCreateBeurteilungen(fieldKey: string, q: string) {
    setCreateBeurteilungenField(fieldKey);
    setCreateBeurteilungenInitial(q);
    setCreateBeurteilungenOpen(true);
  }
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['vorgang', 'gegenstand'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'vorgang': vorgaengeList,
      'regel': regelwerkList,
      'entscheider': beteiligteList,
      'anforderung': anforderungenList,
      'beurteilung': beurteilungenList,
    },
  }), [vorgaengeList, regelwerkList, beteiligteList, anforderungenList, beurteilungenList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Entscheidungen['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'entscheidungen');
      await onSubmit(clean as Entscheidungen['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="vorgang" entity="Vorgänge">\n${JSON.stringify(vorgaengeList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="regel" entity="Regelwerk">\n${JSON.stringify(regelwerkList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="entscheider" entity="Beteiligte">\n${JSON.stringify(beteiligteList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="anforderung" entity="Anforderungen">\n${JSON.stringify(anforderungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="beurteilung" entity="Beurteilungen">\n${JSON.stringify(beurteilungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "vorgang": string | null, // Display name from Vorgänge (see <available-records>)\n  "gegenstand": string | null, // Entscheidungsgegenstand\n  "regel": string | null, // Display name from Regelwerk (see <available-records>)\n  "entscheider": string | null, // Display name from Beteiligte (see <available-records>)\n  "befugnis_geprueft": boolean | null, // Entscheidungsbefugnis geprüft\n  "unsicherheiten": string | null, // Verbleibende Unsicherheiten\n  "ki_vorschlag": string | null, // Vorschlag zur Entscheidung (unverbindlich)\n  "entscheidung": string | null, // Getroffene Entscheidung\n  "begruendung": string | null, // Begründung\n  "folgen": string | null, // Folgen der Entscheidung\n  "entscheidungsdatum": string | null, // YYYY-MM-DD\n  "freigabestatus": LookupValue | null, // Freigabestatus (select one key: "offen" | "freigegeben" | "abgelehnt" | "unter_vorbehalt") mapping: offen=Offen, freigegeben=Freigegeben, abgelehnt=Abgelehnt, unter_vorbehalt=Unter Vorbehalt\n  "anforderung": string | null, // Display name from Anforderungen (see <available-records>)\n  "beurteilung": string | null, // Display name from Beurteilungen (see <available-records>)\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["vorgang", "regel", "entscheider", "anforderung", "beurteilung"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const vorgangName = raw['vorgang'] as string | null;
        if (vorgangName) {
          const vorgangMatch = vorgaengeList.find(r => matchName(vorgangName!, [String(r.fields.vorgangsnummer ?? '')]));
          if (vorgangMatch) merged['vorgang'] = createRecordUrl(APP_IDS.VORGAENGE, vorgangMatch.record_id);
        }
        const regelName = raw['regel'] as string | null;
        if (regelName) {
          const regelMatch = regelwerkList.find(r => matchName(regelName!, [String(r.fields.bezeichnung ?? '')]));
          if (regelMatch) merged['regel'] = createRecordUrl(APP_IDS.REGELWERK, regelMatch.record_id);
        }
        const entscheiderName = raw['entscheider'] as string | null;
        if (entscheiderName) {
          const entscheiderMatch = beteiligteList.find(r => matchName(entscheiderName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (entscheiderMatch) merged['entscheider'] = createRecordUrl(APP_IDS.BETEILIGTE, entscheiderMatch.record_id);
        }
        const anforderungName = raw['anforderung'] as string | null;
        if (anforderungName) {
          const anforderungMatch = anforderungenList.find(r => matchName(anforderungName!, [String(r.fields.bezeichnung ?? '')]));
          if (anforderungMatch) merged['anforderung'] = createRecordUrl(APP_IDS.ANFORDERUNGEN, anforderungMatch.record_id);
        }
        const beurteilungName = raw['beurteilung'] as string | null;
        if (beurteilungName) {
          const beurteilungMatch = beurteilungenList.find(r => matchName(beurteilungName!, [String(r.fields.sachverhalt ?? '')]));
          if (beurteilungMatch) merged['beurteilung'] = createRecordUrl(APP_IDS.BEURTEILUNGEN, beurteilungMatch.record_id);
        }
        return merged as Partial<Entscheidungen['fields']>;
      });
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('entscheidungen') })
    : t('new_entity', { entity: appLabel('entscheidungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'vorgang': (
      <div key="vorgang" className="space-y-1.5">
        <Label htmlFor="vorgang">{fieldLabel('entscheidungen', 'vorgang')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="vorgang"
          placeholder="Welcher Vorgang?"
          items={vorgaengeListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorgangsnummer ?? r.record_id),
          }))}
          value={extractRecordId(fields.vorgang)}
          onChange={id => setFields(f => ({ ...f, vorgang: id ? createRecordUrl(APP_IDS.VORGAENGE, id) : undefined }))}
          onCreateNew={(q) => openCreateVorgaenge("vorgang", q)}
          createLabel={t('create_in', { entity: appLabel('vorgaenge') })}
        />
        {showErrors && !fields.vorgang && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'vorgang')}</p>
        )}
      </div>
    ),
    'gegenstand': (
      <div key="gegenstand" className="space-y-1.5">
        <Label htmlFor="gegenstand">{fieldLabel('entscheidungen', 'gegenstand')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="gegenstand"
          placeholder="z. B. Angebot für Rahmenvertrag"
          value={fields.gegenstand ?? ''}
          onChange={e => setFields(f => ({ ...f, gegenstand: e.target.value }))}
          required
        />
        {showErrors && !fields.gegenstand && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'gegenstand')}</p>
        )}
      </div>
    ),
    'regel': (
      <div key="regel" className="space-y-1.5">
        <Label htmlFor="regel">{fieldLabel('entscheidungen', 'regel')}</Label>
        <Combobox
          id="regel"
          placeholder="Welche Regel gilt?"
          items={regelwerkListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.bezeichnung ?? r.record_id),
          }))}
          value={extractRecordId(fields.regel)}
          onChange={id => setFields(f => ({ ...f, regel: id ? createRecordUrl(APP_IDS.REGELWERK, id) : undefined }))}
          onCreateNew={(q) => openCreateRegelwerk("regel", q)}
          createLabel={t('create_in', { entity: appLabel('regelwerk') })}
        />
      </div>
    ),
    'entscheider': (
      <div key="entscheider" className="space-y-1.5">
        <Label htmlFor="entscheider">{fieldLabel('entscheidungen', 'entscheider')}</Label>
        <Combobox
          id="entscheider"
          placeholder="Wer entscheidet?"
          items={beteiligteListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          value={extractRecordId(fields.entscheider)}
          onChange={id => setFields(f => ({ ...f, entscheider: id ? createRecordUrl(APP_IDS.BETEILIGTE, id) : undefined }))}
          onCreateNew={(q) => openCreateBeteiligte("entscheider", q)}
          createLabel={t('create_in', { entity: appLabel('beteiligte') })}
        />
      </div>
    ),
    'befugnis_geprueft': (
      <div key="befugnis_geprueft" className="space-y-1.5">
        <Label htmlFor="befugnis_geprueft">{fieldLabel('entscheidungen', 'befugnis_geprueft')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="befugnis_geprueft"
            checked={!!fields.befugnis_geprueft}
            onCheckedChange={(v) => setFields(f => ({ ...f, befugnis_geprueft: !!v }))}
          />
          <Label htmlFor="befugnis_geprueft" className="font-normal">{fieldLabel('entscheidungen', 'befugnis_geprueft')}</Label>
        </div>
      </div>
    ),
    'unsicherheiten': (
      <div key="unsicherheiten" className="space-y-1.5">
        <Label htmlFor="unsicherheiten">{fieldLabel('entscheidungen', 'unsicherheiten')}</Label>
        <Textarea
          id="unsicherheiten"
          placeholder="Was ist noch unklar?"
          value={fields.unsicherheiten ?? ''}
          onChange={e => setFields(f => ({ ...f, unsicherheiten: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'ki_vorschlag': (
      <div key="ki_vorschlag" className="space-y-1.5">
        <Label htmlFor="ki_vorschlag">{fieldLabel('entscheidungen', 'ki_vorschlag')}</Label>
        <Textarea
          id="ki_vorschlag"
          placeholder="Unverbindlicher Vorschlag"
          value={fields.ki_vorschlag ?? ''}
          onChange={e => setFields(f => ({ ...f, ki_vorschlag: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'entscheidung': (
      <div key="entscheidung" className="space-y-1.5">
        <Label htmlFor="entscheidung">{fieldLabel('entscheidungen', 'entscheidung')}</Label>
        <Textarea
          id="entscheidung"
          placeholder="Was wurde entschieden?"
          value={fields.entscheidung ?? ''}
          onChange={e => setFields(f => ({ ...f, entscheidung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'begruendung': (
      <div key="begruendung" className="space-y-1.5">
        <Label htmlFor="begruendung">{fieldLabel('entscheidungen', 'begruendung')}</Label>
        <Textarea
          id="begruendung"
          placeholder="Warum so entschieden?"
          value={fields.begruendung ?? ''}
          onChange={e => setFields(f => ({ ...f, begruendung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'folgen': (
      <div key="folgen" className="space-y-1.5">
        <Label htmlFor="folgen">{fieldLabel('entscheidungen', 'folgen')}</Label>
        <Textarea
          id="folgen"
          placeholder="Welche Folgen hat es?"
          value={fields.folgen ?? ''}
          onChange={e => setFields(f => ({ ...f, folgen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'entscheidungsdatum': (
      <div key="entscheidungsdatum" className="space-y-1.5">
        <Label htmlFor="entscheidungsdatum">{fieldLabel('entscheidungen', 'entscheidungsdatum')}</Label>
        <DatePicker
          id="entscheidungsdatum"
          placeholder="Wann wurde entschieden?"
          mode="date"
          value={fields.entscheidungsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, entscheidungsdatum: v ?? undefined }))}
        />
      </div>
    ),
    'freigabestatus': (
      <div key="freigabestatus" className="space-y-1.5">
        <Label htmlFor="freigabestatus">{fieldLabel('entscheidungen', 'freigabestatus')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'offen'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'offen' ? undefined : 'offen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'offen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'freigabestatus', 'offen') ?? 'Offen'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'freigegeben'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'freigegeben' ? undefined : 'freigegeben') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'freigegeben'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'freigabestatus', 'freigegeben') ?? 'Freigegeben'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'abgelehnt'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'abgelehnt' ? undefined : 'abgelehnt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'abgelehnt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'freigabestatus', 'abgelehnt') ?? 'Abgelehnt'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.freigabestatus) === 'unter_vorbehalt'}
            onClick={() => setFields(f => ({ ...f, freigabestatus: (lookupKey(f.freigabestatus) === 'unter_vorbehalt' ? undefined : 'unter_vorbehalt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.freigabestatus) === 'unter_vorbehalt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'freigabestatus', 'unter_vorbehalt') ?? 'Unter Vorbehalt'}
          </button>
        </div>
      </div>
    ),
    'anforderung': (
      <div key="anforderung" className="space-y-1.5">
        <Label htmlFor="anforderung">{fieldLabel('entscheidungen', 'anforderung')}</Label>
        <Combobox
          id="anforderung"
          placeholder="Welche Anforderung?"
          items={anforderungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.bezeichnung ?? r.record_id),
          }))}
          value={extractRecordId(fields.anforderung)}
          onChange={id => setFields(f => ({ ...f, anforderung: id ? createRecordUrl(APP_IDS.ANFORDERUNGEN, id) : undefined }))}
          onCreateNew={(q) => openCreateAnforderungen("anforderung", q)}
          createLabel={t('create_in', { entity: appLabel('anforderungen') })}
        />
      </div>
    ),
    'beurteilung': (
      <div key="beurteilung" className="space-y-1.5">
        <Label htmlFor="beurteilung">{fieldLabel('entscheidungen', 'beurteilung')}</Label>
        <Combobox
          id="beurteilung"
          placeholder="Welche Beurteilung?"
          items={beurteilungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.sachverhalt ?? r.record_id),
          }))}
          value={extractRecordId(fields.beurteilung)}
          onChange={id => setFields(f => ({ ...f, beurteilung: id ? createRecordUrl(APP_IDS.BEURTEILUNGEN, id) : undefined }))}
          onCreateNew={(q) => openCreateBeurteilungen("beurteilung", q)}
          createLabel={t('create_in', { entity: appLabel('beurteilungen') })}
        />
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"vorgang": "Vorgang", "gegenstand": "Entscheidungsgegenstand", "regel": "Anwendbare Regel", "entscheider": "Entscheidende Person", "befugnis_geprueft": "Entscheidungsbefugnis geprüft", "unsicherheiten": "Verbleibende Unsicherheiten", "ki_vorschlag": "Vorschlag zur Entscheidung (unverbindlich)", "entscheidung": "Getroffene Entscheidung", "begruendung": "Begründung", "folgen": "Folgen der Entscheidung", "entscheidungsdatum": "Entscheidungsdatum", "freigabestatus": "Freigabestatus", "anforderung": "Zugrunde liegende Anforderung", "beurteilung": "Fachliche Beurteilung"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"vorgang": {"vorgangsnummer": "Vorgangsnummer", "titel": "Titel", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "kundenanfrage": "Kundenanfrage im Wortlaut", "zustaendige_person": "Zuständige Person", "prozessschritt": "Aktueller Prozessschritt", "status": "Status", "freigabestatus": "Freigabestatus", "auftragsentwurf": "Auftragsentwurf", "geklaerte_punkte": "Geklärte Punkte", "offene_punkte": "Offene Punkte", "uebergabefaehig": "Bereit zur Übergabe an den nächsten Arbeitsschritt"}, "regel": {"bezeichnung": "Regelbezeichnung", "beschreibung": "Beschreibung der Regel", "geltungsbereich": "Geltungsbereich", "regeltyp": "Regeltyp", "erforderliche_befugnis": "Erforderliche Entscheidungsbefugnis", "verbindlich": "Verbindlich", "gueltig_ab": "Gültig ab", "status": "Status"}, "entscheider": {"email": "E-Mail", "telefon": "Telefon", "stelle": "Rolle oder Stelle", "zustaendigkeitsbereich": "Zuständigkeitsbereich", "entscheidungsbefugnis": "Entscheidungsbefugnis", "vorname": "Vorname", "nachname": "Nachname", "organisation": "Organisation", "aktiv": "Aktiv"}, "anforderung": {"widerspruch_zu": "Widerspruch zu Anforderung", "vorgang": "Vorgang", "bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "kategorie": "Kategorie", "wert": "Wert oder Angabe", "quelle": "Quelle", "erfassungsstatus": "Erfassungsstatus", "art_der_angabe": "Art der Angabe", "hinweis_luecke": "Hinweis zur Lücke oder zum Widerspruch"}, "beurteilung": {"vorgang": "Vorgang", "beurteiler": "Beurteilende Person", "fachgebiet": "Fachgebiet", "sachverhalt": "Sachverhalt", "bewertung": "Bewertung", "moegliche_erklaerung": "Mögliche Erklärung (Vorschlag)", "unsicherheiten": "Bestehende Unsicherheiten", "fachlich_bestaetigt": "Fachlich bestätigt", "beurteilt_am": "Datum der Beurteilung", "anforderung": "Anforderung"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                // A field the plan gives to a TOOL. On CREATE it is not shown
                // at all — the value does not exist yet and typing one only
                // gets overwritten. On EDIT it stays a normal input with a
                // note: when a tool could not compose its value (a missing
                // ingredient), this is the only place to repair the record.
                if (SYSTEM_ASSIGNED.includes(k) && !recordId) {
                  return (
                    <div key={k} className="space-y-1.5 min-w-0">
                      <Label>{fieldLabel('entscheidungen', k)}</Label>
                      <p className="text-sm text-muted-foreground">{t('assigned_by_system')}</p>
                    </div>
                  );
                }
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {SYSTEM_ASSIGNED.includes(k) && (
                      <p className="text-xs text-muted-foreground">{t('assigned_by_system')}</p>
                    )}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.ENTSCHEIDUNGEN} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createVorgaengeOpen && (
      <VorgaengeDialog
        open={createVorgaengeOpen}
        onClose={() => setCreateVorgaengeOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createVorgaengeEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Vorgaenge;
            setExtraVorgaenge(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.VORGAENGE, result.id);
            setFields(prev => ({ ...prev, [createVorgaengeField]: url } as any));
          }
          setCreateVorgaengeOpen(false);
        }}
        defaultValues={createVorgaengeInitial
          ? ({ vorgangsnummer: createVorgaengeInitial } as any)
          : undefined}
        beteiligteList={beteiligteList}
      />
    )}
    {createRegelwerkOpen && (
      <RegelwerkDialog
        open={createRegelwerkOpen}
        onClose={() => setCreateRegelwerkOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createRegelwerkEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Regelwerk;
            setExtraRegelwerk(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.REGELWERK, result.id);
            setFields(prev => ({ ...prev, [createRegelwerkField]: url } as any));
          }
          setCreateRegelwerkOpen(false);
        }}
        defaultValues={createRegelwerkInitial
          ? ({ bezeichnung: createRegelwerkInitial } as any)
          : undefined}
      />
    )}
    {createBeteiligteOpen && (
      <BeteiligteDialog
        open={createBeteiligteOpen}
        onClose={() => setCreateBeteiligteOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createBeteiligteEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Beteiligte;
            setExtraBeteiligte(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.BETEILIGTE, result.id);
            setFields(prev => ({ ...prev, [createBeteiligteField]: url } as any));
          }
          setCreateBeteiligteOpen(false);
        }}
        defaultValues={createBeteiligteInitial
          ? ({ vorname: createBeteiligteInitial } as any)
          : undefined}
      />
    )}
    {createAnforderungenOpen && (
      <AnforderungenDialog
        open={createAnforderungenOpen}
        onClose={() => setCreateAnforderungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createAnforderungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Anforderungen;
            setExtraAnforderungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.ANFORDERUNGEN, result.id);
            setFields(prev => ({ ...prev, [createAnforderungenField]: url } as any));
          }
          setCreateAnforderungenOpen(false);
        }}
        defaultValues={createAnforderungenInitial
          ? ({ bezeichnung: createAnforderungenInitial } as any)
          : undefined}
        anforderungenList={anforderungenList}
        vorgaengeList={vorgaengeList}
        quellenList={[]}
      />
    )}
    {createBeurteilungenOpen && (
      <BeurteilungenDialog
        open={createBeurteilungenOpen}
        onClose={() => setCreateBeurteilungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createBeurteilungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Beurteilungen;
            setExtraBeurteilungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.BEURTEILUNGEN, result.id);
            setFields(prev => ({ ...prev, [createBeurteilungenField]: url } as any));
          }
          setCreateBeurteilungenOpen(false);
        }}
        defaultValues={createBeurteilungenInitial
          ? ({ sachverhalt: createBeurteilungenInitial } as any)
          : undefined}
        vorgaengeList={vorgaengeList}
        beteiligteList={beteiligteList}
        anforderungenList={anforderungenList}
      />
    )}
    </>
  );
}