import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../stores/appStore'
import { BuiltinSetupCard } from '../Speech/BuiltinSetupCard'
import { LearnMoreLink } from '../Speech/LearnMoreLink'
import { selectPreset } from '../Speech/saveSpeech'
import { ServerSettings } from '../Speech/ServerSettings'
import { activePresetOf, builtinPresetOf, type EngineService } from '../Speech/services'

const ENGINE_TABS = ['builtin', 'server'] as const
type EngineTab = (typeof ENGINE_TABS)[number]

export function EngineSetupStep({
  service,
  onSkip,
}: {
  service: EngineService
  onSkip: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const active = useAppStore((state) => activePresetOf(service, state.config))
  const builtin = useAppStore((state) => builtinPresetOf(service, state.config))
  const usingServer = Boolean(active && !service.isBuiltin(active))
  const initialTab = usingServer ? 'server' : 'builtin'
  const [tab, setTab] = useState<EngineTab>(initialTab)
  const [serverVisited, setServerVisited] = useState(initialTab === 'server')
  const [error, setError] = useState<string | null>(null)

  const showTab = (value: EngineTab) => {
    setTab(value)
    if (value === 'server') setServerVisited(true)
  }

  const useBuiltin = () => {
    if (!builtin) return
    setError(null)
    selectPreset(service, builtin.id).catch((err) => setError(String(err)))
  }

  const tabId = (value: EngineTab) => `${id}-${value}-tab`
  const panelId = (value: EngineTab) => `${id}-${value}-panel`

  return (
    <div className="onboarding-engine">
      <div
        role="tablist"
        aria-label={t(`${service.textNs}.engineLabel`)}
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
        {ENGINE_TABS.map((value) => (
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
            <span className="option-card-title">
              {t(`${service.textNs}.engines.${value}.title`)}
            </span>
          </button>
        ))}
      </div>
      <div className="min-h-0">
        <div
          role="tabpanel"
          tabIndex={0}
          className="onboarding-engine-panel"
          id={panelId('builtin')}
          aria-labelledby={tabId('builtin')}
          hidden={tab !== 'builtin'}
        >
          <BuiltinSetupCard service={service} onUse={usingServer ? useBuiltin : undefined} />
          {error && (
            <p role="alert" className="mt-2 text-[12px] text-error">
              {error}
            </p>
          )}
        </div>
        <div
          role="tabpanel"
          tabIndex={0}
          className="onboarding-engine-panel"
          id={panelId('server')}
          aria-labelledby={tabId('server')}
          hidden={tab !== 'server'}
        >
          {serverVisited && <ServerSettings service={service} onboarding />}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <LearnMoreLink url={service.guideUrl} />
        {usingServer && active?.verified_at && (
          <p className="status-detail m-0" data-testid={`${service.textNs}-using-server`}>
            {t('speech.usingPreset', { name: active.name })}
          </p>
        )}
        <button
          type="button"
          onClick={onSkip}
          title={service.id === 'ai' ? t('ai.skipHint') : undefined}
          className="link-button link-button-muted ml-auto"
        >
          {t('onboarding.welcome.skipForNow')}
        </button>
      </div>
    </div>
  )
}
