import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { GameMode } from '../types'
import { AUDIO_LETTERS } from '../constants'

interface UseTrialLogicProps {
  nLevel: number
  gameMode: GameMode
  stimulusDurationMs: number
  isPracticeMode?: boolean
  onTrialComplete: (trialData: TrialData) => void
}

interface TrialData {
  visualMatch: boolean
  audioMatch: boolean
  visualResponse: boolean
  audioResponse: boolean
  responseTime: number
}

interface StimulusData {
  position: number
  letter: string
  visualMatch: boolean
  audioMatch: boolean
}

export const useTrialLogic = ({
  nLevel,
  gameMode,
  stimulusDurationMs,
  isPracticeMode = false,
  onTrialComplete,
}: UseTrialLogicProps) => {
  // Trial state
  const [visualSequence, setVisualSequence] = useState<number[]>([])
  const [audioSequence, setAudioSequence] = useState<string[]>([])
  const [currentPosition, setCurrentPosition] = useState<number | null>(null)
  const [currentLetter, setCurrentLetter] = useState<string>('')
  const [visualMatches, setVisualMatches] = useState<boolean[]>([])
  const [audioMatches, setAudioMatches] = useState<boolean[]>([])
  const [userVisualResponses, setUserVisualResponses] = useState<boolean[]>([])
  const [userAudioResponses, setUserAudioResponses] = useState<boolean[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [trialStartTime, setTrialStartTime] = useState<number>(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [visualResponseMadeThisTrial, setVisualResponseMadeThisTrial] = useState(false)
  const [audioResponseMadeThisTrial, setAudioResponseMadeThisTrial] = useState(false)

  // Refs for reliable access in timeouts
  const currentTrialVisualMatchRef = useRef(false)
  const currentTrialAudioMatchRef = useRef(false)
  const trialTimeoutRef = useRef<NodeJS.Timeout>()
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>()

  const generateStimulus = useCallback((): StimulusData => {
    const newPosition = Math.floor(Math.random() * 9)
    const newLetter = AUDIO_LETTERS[Math.floor(Math.random() * AUDIO_LETTERS.length)]

    // Calculate matches BEFORE updating sequences
    const visualMatch =
      visualSequence.length >= nLevel &&
      visualSequence[visualSequence.length - nLevel] === newPosition
    const audioMatch =
      audioSequence.length >= nLevel && 
      audioSequence[audioSequence.length - nLevel] === newLetter

    // Update sequences AFTER calculating matches
    setVisualSequence(prev => [...prev, newPosition])
    setAudioSequence(prev => [...prev, newLetter])
    setVisualMatches(prev => [...prev, visualMatch])
    setAudioMatches(prev => [...prev, audioMatch])

    return { position: newPosition, letter: newLetter, visualMatch, audioMatch }
  }, [visualSequence, audioSequence, nLevel])

  const handleResponse = useCallback(
    (responseType: 'visual' | 'audio') => {
      if (!isWaitingForResponse) {
        return
      }

      const responseTime = Date.now() - trialStartTime
      setResponseTimes(prev => [...prev, responseTime])

      let currentVisualResponseMade = visualResponseMadeThisTrial
      let currentAudioResponseMade = audioResponseMadeThisTrial

      if (responseType === 'visual') {
        setUserVisualResponses(prev => {
          const newResponses = [...prev]
          newResponses[newResponses.length - 1] = true
          return newResponses
        })
        setVisualResponseMadeThisTrial(true)
        currentVisualResponseMade = true
      } else {
        setUserAudioResponses(prev => {
          const newResponses = [...prev]
          newResponses[newResponses.length - 1] = true
          return newResponses
        })
        setAudioResponseMadeThisTrial(true)
        currentAudioResponseMade = true
      }

      // Provide feedback for practice mode
      if (isPracticeMode && responseType === 'visual') {
        const visualExpected = currentTrialVisualMatchRef.current
        const visualResponse = true

        if (visualExpected && visualResponse) {
          toast.success('Correct Match!', { duration: 1500 })
        } else if (!visualExpected && visualResponse) {
          toast.warning("Oops! That wasn't a match (False Alarm).", { duration: 1500 })
        }
      }

      // Handle trial completion logic
      const shouldAdvance = gameMode === 'dual' 
        ? currentVisualResponseMade && currentAudioResponseMade
        : true

      if (shouldAdvance) {
        setIsWaitingForResponse(false)
        if (trialTimeoutRef.current) {
          clearTimeout(trialTimeoutRef.current)
        }

        const trialData: TrialData = {
          visualMatch: currentTrialVisualMatchRef.current,
          audioMatch: currentTrialAudioMatchRef.current,
          visualResponse: responseType === 'visual' || currentVisualResponseMade,
          audioResponse: responseType === 'audio' || currentAudioResponseMade,
          responseTime,
        }

        const delay = gameMode === 'dual' ? 750 : 0
        setTimeout(() => {
          setCurrentPosition(null)
          setCurrentLetter('')
          onTrialComplete(trialData)
        }, delay)
      }
    },
    [
      isWaitingForResponse,
      trialStartTime,
      gameMode,
      visualResponseMadeThisTrial,
      audioResponseMadeThisTrial,
      isPracticeMode,
      onTrialComplete,
    ]
  )

  const startTrial = useCallback((onAudioPlay: (letter: string) => void) => {
    const { position, letter, visualMatch, audioMatch } = generateStimulus()

    setCurrentPosition(position)
    setCurrentLetter(letter)
    setVisualResponseMadeThisTrial(false)
    setAudioResponseMadeThisTrial(false)
    setIsWaitingForResponse(true)
    setTrialStartTime(Date.now())

    // Store match status for this trial
    currentTrialVisualMatchRef.current = visualMatch
    currentTrialAudioMatchRef.current = audioMatch

    // Initialize response arrays if needed
    setUserVisualResponses(prev => [...prev, false])
    setUserAudioResponses(prev => [...prev, false])

    // Play audio if needed
    if ((gameMode === 'single-audio' || gameMode === 'dual')) {
      onAudioPlay(letter)
    }

    // Set timeout for trial
    trialTimeoutRef.current = setTimeout(() => {
      if (isPracticeMode) {
        const visualExpected = currentTrialVisualMatchRef.current
        if (visualExpected) {
          toast.error('Missed Match!', { duration: 1500 })
        } else {
          toast.info('Correct: No match there.', { duration: 1500 })
        }
      }

      setIsWaitingForResponse(false)
      setCurrentPosition(null)
      setCurrentLetter('')
      setResponseTimes(prev => [...prev, stimulusDurationMs])

      const trialData: TrialData = {
        visualMatch: currentTrialVisualMatchRef.current,
        audioMatch: currentTrialAudioMatchRef.current,
        visualResponse: false,
        audioResponse: false,
        responseTime: stimulusDurationMs,
      }

      onTrialComplete(trialData)
    }, stimulusDurationMs)
  }, [generateStimulus, gameMode, stimulusDurationMs, isPracticeMode, onTrialComplete])

  const resetTrialState = useCallback(() => {
    setVisualSequence([])
    setAudioSequence([])
    setVisualMatches([])
    setAudioMatches([])
    setUserVisualResponses([])
    setUserAudioResponses([])
    setResponseTimes([])
    setCurrentPosition(null)
    setCurrentLetter('')
    setIsWaitingForResponse(false)
    setVisualResponseMadeThisTrial(false)
    setAudioResponseMadeThisTrial(false)

    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current)
    }
    if (postDualResponseDelayRef.current) {
      clearTimeout(postDualResponseDelayRef.current)
    }
  }, [])

  return {
    // State
    currentPosition,
    currentLetter,
    isWaitingForResponse,
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    
    // Actions
    handleResponse,
    startTrial,
    resetTrialState,
  }
}
