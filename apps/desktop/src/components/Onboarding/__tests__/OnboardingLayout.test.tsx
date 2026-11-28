import type { ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import appIcon from '../../../../src-tauri/icons/app-icon.svg'
import { OnboardingLayout } from '../OnboardingLayout'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue(undefined) }))
vi.mock('react-i18next', async () => {
  const { translate } = await import('../../../test-utils/i18nMock')
  return { useTranslation: () => ({ t: translate }) }
})

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

function props(overrides: Partial<ComponentProps<typeof OnboardingLayout>> = {}) {
  return {
    step: 1,
    totalSteps: 4,
    title: 'Test step',
    subtitle: 'Test instructions',
    canNext: true,
    canBack: true,
    nextLabel: 'Continue',
    onNext: vi.fn(),
    onBack: vi.fn(),
    children: <p>Step content</p>,
    ...overrides,
  }
}

describe('OnboardingLayout', () => {
  it('shows the app icon at welcome and keeps the same scenery through the early steps', () => {
    const { container, rerender } = render(
      <OnboardingLayout {...props({ step: 0, title: 'Welcome to Munia' })} />,
    )
    const scenery = container.querySelector('.home-scenery')
    expect(scenery).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('img.onboarding-app-icon')).toHaveAttribute('src', appIcon)

    for (const step of [1, 2]) {
      rerender(<OnboardingLayout {...props({ step })} />)
      expect(container.querySelector('.home-scenery')).toBe(scenery)
      expect(container.querySelector('.onboarding-app-icon')).not.toBeInTheDocument()
    }
  })

  it('renders the step and gates navigation with canNext and canBack', () => {
    const callbacks = props({ canNext: false, canBack: false })
    const { rerender } = render(<OnboardingLayout {...callbacks} />)
    expect(screen.getByRole('heading', { name: 'Test step' })).toBeInTheDocument()
    expect(screen.getByText('Test instructions')).toBeInTheDocument()
    expect(screen.getByText('Step content')).toBeInTheDocument()

    const next = screen.getByRole('button', { name: 'Continue' })
    const back = screen.getByRole('button', { name: 'Back' })
    expect(next).toBeDisabled()
    expect(back).toBeDisabled()
    fireEvent.click(next)
    fireEvent.click(back)
    expect(callbacks.onNext).not.toHaveBeenCalled()
    expect(callbacks.onBack).not.toHaveBeenCalled()

    rerender(<OnboardingLayout {...callbacks} canNext canBack />)
    fireEvent.click(next)
    fireEvent.click(back)
    expect(callbacks.onNext).toHaveBeenCalledTimes(1)
    expect(callbacks.onBack).toHaveBeenCalledTimes(1)
  })

  it('offers Skip only when supplied and uses a custom close action', () => {
    const callbacks = props({ onClose: vi.fn() })
    const { rerender } = render(<OnboardingLayout {...callbacks} />)
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()

    const onSkip = vi.fn()
    rerender(<OnboardingLayout {...callbacks} onSkip={onSkip} />)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(callbacks.onClose).toHaveBeenCalledTimes(1)
    expect(invoke).not.toHaveBeenCalled()
  })

  it('quits when Close has no custom action', async () => {
    render(<OnboardingLayout {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('plugin:process|exit', { code: 0 }))
  })
})
