import { useEffect, useRef, useCallback } from 'react'

interface UseAudioSynthesisProps {
  audioEnabled: boolean
}

export const useAudioSynthesis = ({ audioEnabled }: UseAudioSynthesisProps) => {
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize Speech Synthesis
  useEffect(() => {
    if (audioEnabled) {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [audioEnabled])

  const playAudioLetter = useCallback(
    (letter: string) => {
      if (!audioEnabled || !synthRef.current) {
        return
      }

      // Cancel any ongoing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(letter)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      synthRef.current.speak(utterance)
    },
    [audioEnabled]
  )

  const cancelAudio = useCallback(() => {
    if (synthRef.current && audioEnabled) {
      synthRef.current.cancel()
    }
  }, [audioEnabled])

  return {
    playAudioLetter,
    cancelAudio,
    synthRef,
  }
}
