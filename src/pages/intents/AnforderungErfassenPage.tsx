/**
 * Anforderung erfassen — 5-Schritt-Wizard.
 * Steps: 1) Vorgang wählen → 2) Anforderung mit Kategorie und Wert → 3) Quelle und Art der Angabe →
 *        4) Erfassungsstatus, Hinweis und ggf. widersprüchliche Anforderung → 5) Prüfen (setzt den Vorgang auf „Informationen prüfen“).
 * Reads: vorgaenge, quellen, anforderungen. Writes: anforderungen (create), vorgaenge (update: prozessschritt, status).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, ChoiceGroup, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useAnforderungErfassenFlow } from '@/lib/journey/flows/AnforderungErfassen';
import { tx } from '@/i18n';

export default function AnforderungErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnforderungErfassenFlow({
    steps: {
      vorgaenge: 1, vorgang: 1,
      bezeichnung: 2, beschreibung: 2, kategorie: 2, wert: 2,
      quelle: 3, art_der_angabe: 3,
      erfassungsstatus: 4, hinweis_luecke: 4, widerspruch_zu: 4,
    },
    items: {
      vorgang: r => ({
        id: r.id,
        title: fieldText(r, 'vorgangsnummer'),
        subtitle: [fieldText(r, 'titel'), fieldText(r, 'kunde')].filter(Boolean).join(' · '),
      }),
      quelle: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: [fieldLookup(r, 'quellenart')?.label, fieldLookup(r, 'verlaesslichkeit')?.label].filter(Boolean).join(' · '),
      }),
      widerspruch_zu: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: [fieldText(r, 'wert'), fieldLookup(r, 'erfassungsstatus')?.label].filter(Boolean).join(' · '),
      }),
    },
  });

  const f = flow.forms.anforderungen;
  const status = (f.get('erfassungsstatus') as string | null) ?? null;
  const showHinweis = status === 'fehlt' || status === 'widerspruechlich';
  const showWiderspruch = status === 'widerspruechlich';

  return (
    <IntentWizardShell
      title={tx('Anforderung erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Anforderung mit Quelle erfassen und Lücken oder Widersprüche markieren.'),
        needs: [tx('Den Vorgang'), tx('Bezeichnung und Wert der Anforderung'), tx('Die Quelle, falls bekannt')],
      }}
    >
      <WizardStep label={tx('Vorgang')} description={tx('Zu welchem Vorgang gehört die Anforderung?')}>
        <EntitySelectStep
          {...flow.picks.vorgang.select}
          {...flow.pick('vorgang')}
          selectedId={f.get('vorgang') as string | null}
          onSelect={id => {
            flow.pick('vorgang').onSelect(id);
            flow.targets.vorgaenge.onSelect(id);
          }}
          searchPlaceholder={tx('Nummer, Titel oder Kunde …')}
          avatar="none"
        />
      </WizardStep>

      <WizardStep label={tx('Anforderung')} description={tx('Was wird verlangt? Bezeichnung, Kategorie und Wert eintragen.')} needs={['vorgang']}>
        <div className="space-y-4">
          <Bound form={f} name="bezeichnung" />
          <Bound form={f} name="beschreibung" rows={3} />
          <Bound form={f} name="kategorie" />
          <Bound form={f} name="wert" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Quelle')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Quelle')} description={tx('Woher stammt die Angabe und wie sicher ist sie?')} needs={['bezeichnung']}>
        <div className="space-y-4">
          <Field form={f} name="quelle">
            <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')} searchPlaceholder={tx('Quelle suchen …')} avatar="none" />
          </Field>
          <Bound form={f} name="art_der_angabe" allowClear />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Status')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Status')} description={tx('Ist die Angabe vollständig, fehlt sie oder widerspricht sie einer anderen?')} needs={['bezeichnung']}>
        <div className="space-y-4">
          <Bound form={f} name="erfassungsstatus" />
          {showHinweis && (
            <Bound
              form={f}
              name="hinweis_luecke"
              rows={3}
              hint={showWiderspruch ? tx('Worin besteht der Widerspruch?') : tx('Was fehlt noch?')}
            />
          )}
          {showWiderspruch && (
            <Field form={f} name="widerspruch_zu">
              <EntitySelectStep
                {...flow.picks.widerspruch_zu.select}
                {...flow.pick('widerspruch_zu')}
                searchPlaceholder={tx('Bezeichnung oder Wert …')}
                avatar="none"
              />
            </Field>
          )}
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Anforderung wird angelegt und der Vorgang auf „Informationen prüfen“ mit Status „In Klärung“ gesetzt.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Rückfrage vorbereiten'), href: '#/intents/rueckfrage-stellen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
