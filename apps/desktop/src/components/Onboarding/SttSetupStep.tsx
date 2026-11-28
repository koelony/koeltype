import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { BuiltinSetupCard } from '../Speech/BuiltinSetupCard'
import { ServerPresetSheet } from '../Speech/ServerPresetSheet'
import { LearnMoreLink } from '../Speech/LearnMoreLink'
import { selectPreset } from '../Speech/saveSpeech'
import { ServerSettings } from '../Speech/ServerSettings'
import {
  SPEECH_SERVICE,
  activePresetOf,
  builtinPresetOf,
  type EngineService,
} from '../Speech/services'

/**
 * The onboarding AI step's Built-in card and optional server sheet (plan `ai-polish-setup`).
 */
export function EngineSetupStep({
  service,
  onSkip,
}: {
  service: EngineService
  onSkip: () => void
}) {
  const { t } = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const active = useAppStore((s) => activePresetOf(service, s.config))
  const usingServer = Boolean(active && !service.isBuiltin(active) && active.verified_at)

  return (
    <div>
      <BuiltinSetupCard service={service} />
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setSheetOpen(true)}
          className="link-button"
        >
          {t('speech.useOwnServer')}
        </button>
        <button
          type="button"
          onClick={onSkip}
          title={service.id === 'ai' ? t('ai.skipHint') : undefined}
          className="link-button link-button-muted"
        >
          {t('onboarding.welcome.skipForNow')}
        </button>
      </div>
      {usingServer && active && (
        <p className="status-detail m-0 mt-2" data-testid={`${service.textNs}-using-server`}>
          {t('speech.usingPreset', { name: active.name })}
        </p>
      )}
      {sheetOpen && <ServerPresetSheet service={service} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

const SPEECH_TABS = ['builtin', 'server'] as const
type SpeechTab = (typeof SPEECH_TABS)[number]

export function SttSetupStep({ onSkip }: { onSkip: () => void }) {
  const { t } = useTranslation()
  const id = useId()
  const active = useAppStore((state) => activePresetOf(SPEECH_SERVICE, state.config))
  const builtin = useAppStore((state) => builtinPresetOf(SPEECH_SERVICE, state.config))
  const usingServer = Boolean(active && !SPEECH_SERVICE.isBuiltin(active))
  const initialTab = usingServer ? 'server' : 'builtin'
  const [tab, setTab] = useState<SpeechTab>(initialTab)
  const [serverVisited, setServerVisited] = useState(initialTab === 'server')
  const [error, setError] = useState<string | null>(null)

  const showTab = (value: SpeechTab) => {
    setTab(value)
    if (value === 'server') setServerVisited(true)
  }

  const useBuiltin = () => {
    if (!builtin) return
    setError(null)
    selectPreset(SPEECH_SERVICE, builtin.id).catch((err) => setError(String(err)))
  }

  const tabId = (value: SpeechTab) => `${id}-${value}-tab`
  const panelId = (value: SpeechTab) => `${id}-${value}-panel`

  return (
    <div>
      <div
        role="tablist"
        aria-label={t('speech.engineLabel')}
        className="option-cards"
        onKeyDown={(event) => {
          const { key } = event
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return
          event.preventDefault()
          const next = key === 'Home' || (key !== 'End' && tab === 'server') ? 'builtin' : 'server'
          showTab(next)
          event.currentTarget.querySelector<HTMLButtonElement>(`[data-engine="${next}"]`)?.focus()
        }}
      >
        {SPEECH_TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={tabId(value)}
            data-engine={value}
            aria-selected={tab === value}
            aria-controls={panelId(value)}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => showTab(value)}
            className="option-card"
          >
            <span className="option-card-title">{t(`speech.engines.${value}.title`)}</span>
            <span className="option-card-detail">{t(`speech.engines.${value}.detail`)}</span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={panelId('builtin')}
        aria-labelledby={tabId('builtin')}
        hidden={tab !== 'builtin'}
        className="mt-3"
      >
        <BuiltinSetupCard onUse={usingServer ? useBuiltin : undefined} />
        {error && (
          <p role="alert" className="mt-2 text-[12px] text-error">
            {error}
          </p>
        )}
      </div>
      <div
        role="tabpanel"
        id={panelId('server')}
        aria-labelledby={tabId('server')}
        hidden={tab !== 'server'}
      >
        {serverVisited && <ServerSettings onboarding />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <LearnMoreLink url={SPEECH_SERVICE.guideUrl} />
        {usingServer && active?.verified_at && (
          <p className="status-detail m-0" data-testid="speech-using-server">
            {t('speech.usingPreset', { name: active.name })}
          </p>
        )}
        <button type="button" onClick={onSkip} className="link-button link-button-muted ml-auto">
          {t('onboarding.welcome.skipForNow')}
        </button>
      </div>
    </div>
  )
}
