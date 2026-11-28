import { useTranslation } from 'react-i18next'
import type { OfferedModel, SpeechSetupStatus } from '../../lib/tauri'
import { formatSize, progressPercent, setupKey } from '../../lib/speechSetup'
import { modelDetail, modelName } from './builtinText'
import { SPEECH_SERVICE, type EngineService } from './services'

const CANTONESE_VARIANTS: Partial<Record<string, string>> = {
  'qwen3-asr-1.7b': '1.7B',
  'qwen3-asr-0.6b': '0.6B',
}

/**
 * Plan `two-tab-speech`: the models this Mac runs well, as radio option cards. With one model there
 * is nothing to choose, but it still shows as selected. Plan `language-model-suggestions`: with
 * more than two they stack in one column, and the model of the user's suggested setup is tagged
 * (then no model is marked Recommended).
 */
export function ModelOptions({
  models,
  selected,
  onSelect,
  service = SPEECH_SERVICE,
  suggested = null,
  groupCantonese = false,
}: {
  models: OfferedModel[]
  selected: string | null
  onSelect: (id: string) => void
  service?: EngineService
  suggested?: string | null
  groupCantonese?: boolean
}) {
  const { t } = useTranslation()
  const one = models.length === 1
  const tagged = suggested && models.some((model) => model.id === suggested) ? suggested : null
  const cantonese = groupCantonese ? models.filter(({ id }) => CANTONESE_VARIANTS[id]) : []
  const showFamily = cantonese.length > 1
  const primary = showFamily ? models.filter(({ id }) => !CANTONESE_VARIANTS[id]) : models
  const layout =
    primary.length === 1 ? 'option-cards-one' : primary.length > 2 ? 'option-cards-list' : ''

  const option = (model: OfferedModel, grouped = false) => (
    <button
      key={model.id}
      type="button"
      role="radio"
      aria-checked={model.id === selected}
      onClick={() => {
        if (!one) onSelect(model.id)
      }}
      className="option-card"
    >
      <span className="option-card-title">
        {grouped ? CANTONESE_VARIANTS[model.id] : modelName(model.id, t, service)}
        {tagged === model.id && <span className="tag">{t('languageSetup.suggestedTag')}</span>}
        {!tagged && model.recommended && (
          <span className="tag">{t('speechSetup.recommended')}</span>
        )}
      </span>
      <span className="option-card-detail">
        {grouped ? formatSize(model.sizeBytes) : modelDetail(model.id, t, model.sizeBytes, service)}
      </span>
    </button>
  )

  return (
    <div role="radiogroup" aria-label={t('speechSetup.model')} className={`option-cards ${layout}`}>
      {primary.map((model) => option(model))}
      {showFamily && (
        <div
          className="speech-model-family"
          role="group"
          aria-label={t('speechSetup.cantoneseModels')}
        >
          <span aria-hidden="true" className="option-card-title">
            {t('speechSetup.cantoneseModels')}
          </span>
          <div className="option-cards">{cantonese.map((model) => option(model, true))}</div>
        </div>
      )}
    </div>
  )
}

/** The progress bar of a running setup. */
export function ProgressTrack({
  status,
  service = SPEECH_SERVICE,
}: {
  status: SpeechSetupStatus
  service?: EngineService
}) {
  const { t } = useTranslation()
  const downloading = status.phase === 'downloading'
  const percent = downloading ? progressPercent(status) : 100
  return (
    <div
      role="progressbar"
      aria-label={t(setupKey(service.ns, 'progressLabel'))}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="progress-track"
    >
      <div className={downloading ? '' : 'animate-pulse'} style={{ width: `${percent}%` }} />
    </div>
  )
}
