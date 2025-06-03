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
        try {
          synthRef.current.cancel()
        } catch (error) {
          console.warn('Error during cleanup:', error)
        }
      }
    }
  }, [audioEnabled])

  const playAudioLetter = useCallback(
    (letter: string) => {
      if (!audioEnabled || !synthRef.current) {
        return
      }

      try {
        // Cancel any ongoing speech
        synthRef.current.cancel()

        const utterance = new SpeechSynthesisUtterance(letter)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0

        synthRef.current.speak(utterance)
      } catch (error) {
        console.warn('Error playing audio:', error)
      }
    },
    [audioEnabled]
  )

  const cancelAudio = useCallback(() => {
    if (synthRef.current && audioEnabled) {
      try {
        synthRef.current.cancel()
      } catch (error) {
        console.warn('Error canceling audio:', error)
      }
    }
  }, [audioEnabled])

  return {
    playAudioLetter,
    cancelAudio,
    synthRef,
  }
}
