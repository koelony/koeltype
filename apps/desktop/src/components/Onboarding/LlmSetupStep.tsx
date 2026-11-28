import { AI_SERVICE } from '../Speech/services'
import { EngineSetupStep } from './EngineSetupStep'

export function LlmSetupStep({ onSkip }: { onSkip: () => void }) {
  return <EngineSetupStep service={AI_SERVICE} onSkip={onSkip} />
}
