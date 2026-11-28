import { SPEECH_SERVICE } from '../Speech/services'
import { EngineSetupStep } from './EngineSetupStep'

export function SttSetupStep({ onSkip }: { onSkip: () => void }) {
  return <EngineSetupStep service={SPEECH_SERVICE} onSkip={onSkip} />
}
