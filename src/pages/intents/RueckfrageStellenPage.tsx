/**
 * Rückfrage vorbereiten — 4-Schritt-Wizard.
 * Steps: 1) Vorgang und betroffene Anforderung wählen → 2) Adressat wählen → 3) Fragetext und Bündelungsgruppe → 4) Prüfen (Vorgang wartet auf Antwort).
 * Reads: vorgaenge, anforderungen, beteiligte. Writes: rueckfragen (create), vorgaenge (update).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep (via useRueckfrageStellenFlow).
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useRueckfrageStellenFlow } from '@/lib/journey/flows/RueckfrageStellen';
import { tx } from '@/i18n';

export default function RueckfrageStellenPage() {
  const [step, setStep] = useState(1);
  const flow = useRueckfrageStellenFlow({
    steps: { vorgaenge: 1, vorgang: 1, anforderung: 1, adressat: 2, fragetext: 3, buendelungsgruppe: 3 },
    items: {
      vorgang: r => ({ id: r.id, title: fieldText(r, 'vorgangsnummer') || fieldText(r, 'titel'), subtitle: fieldText(r, 'titel') }),
      vorgaenge: r => ({ id: r.id, title: fieldText(r, 'vorgangsnummer') || fieldText(r, 'titel'), subtitle: fieldText(r, 'titel') }),
      anforderung: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: fieldText(r, 'hinweis_luecke'),
        status: fieldLookup(r, 'erfassungsstatus') ?? undefined,
      }),
      adressat: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: [fieldLookup(r, 'stelle')?.label, fieldText(r, 'zustaendigkeitsbereich')].filter(Boolean).join(' · '),
      }),
    },
  });

  const vorgangPick = flow.pick('vorgang');
  const targetPick = flow.pick('vorgaenge');

  return (
    <IntentWizardShell
      title={tx('Rückfrage vorbereiten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Rückfrage an den zuständigen Beteiligten richten und dem Vorgang zuordnen.'),
        needs: [tx('Vorgang'), tx('Betroffene Anforderung'), tx('Fragetext')],
      }}
    >
      <WizardStep label={tx('Vorgang')} heading={tx('Vorgang und Anforderung wählen')} description={tx('Zu welchem Vorgang und welcher offenen Anforderung gehört die Rückfrage?')}>
        <div className="space-y-6">
          <EntitySelectStep
            {...flow.picks.vorgang.select}
            selectedId={vorgangPick.selectedId}
            onSelect={id => { vorgangPick.onSelect(id); targetPick.onSelect(id); }}
            searchPlaceholder={tx('Vorgangsnummer …')}
          />
          <EntitySelectStep
            {...flow.picks.anforderung.select}
            {...flow.pick('anforderung')}
            searchPlaceholder={tx('Bezeichnung oder Hinweis …')}
            emptyText={tx('Keine Anforderung mit Lücke, Widerspruch oder ungeprüftem Status vorhanden.')}
          />
          <StepNav
            hideBack
            onNext={() => flow.validateStep(1)}
            nextStepLabel={tx('Adressat')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Adressat')} description={tx('Wer kann die Frage beantworten?')} needs={['vorgang']}>
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.adressat.select}
            {...flow.pick('adressat')}
            searchPlaceholder={tx('Name oder Zuständigkeit …')}
            avatar="initials"
          />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Fragetext')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Frage')} heading={tx('Fragetext und Bündelung')} description={tx('Formuliere die Frage. Mit einer Bündelungsgruppe fasst du Fragen an dieselbe Person zusammen.')} needs={['adressat']}>
        <div className="space-y-4">
          <Bound form={flow.forms.rueckfragen} name="fragetext" rows={5} />
          <Bound form={flow.forms.rueckfragen} name="buendelungsgruppe" hint={tx('Optional — z. B. „Klärung Werkstoff“')} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')} heading={tx('Prüfen und Vorgang auf „wartet auf Antwort“ setzen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Rückfrage wird als vorbereitet angelegt und der Vorgang wechselt auf „wartet auf Antwort“.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Antwort erfassen'), href: '#/intents/antwort-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Sobald die Antwort vorliegt, erfasst du sie im Ablauf „Antwort erfassen“.')}
        />
      )}
    </IntentWizardShell>
  );
}
