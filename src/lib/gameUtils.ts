import { GameMode } from '../components/game/types' // Assuming this path is correct from /lib back to /components

// Interface for the return type of calculatePerformanceStats
export interface PerformanceStats {
  visualAccuracy: number
  audioAccuracy: number
  overallAccuracy: number
  avgResponseTime: number
  actualVisualMatches: number
  visualHits: number
  visualMisses: number
  visualFalseAlarms: number
  visualCorrectRejections: number
  actualAudioMatches: number
  audioHits: number
  audioMisses: number
  audioFalseAlarms: number
  audioCorrectRejections: number
}

// Interface for the arguments of calculatePerformanceStats
export interface CalculateStatsArgs {
  numTrials: number
  visualMatches: boolean[]
  audioMatches: boolean[]
  userVisualResponses: boolean[]
  userAudioResponses: boolean[]
  responseTimes: number[]
  gameMode: GameMode
}

/**
 * @function calculatePerformanceStats
 * @description Calculates comprehensive performance statistics for a completed N-Back game session.
 * This includes overall accuracy, visual/audio specific accuracies, average response time,
 * and detailed counts of hits, misses, false alarms, and correct rejections.
 *
 * @param {CalculateStatsArgs} args - An object containing all necessary data from the
 * game session required for calculation. This includes trial counts, match arrays,
 * user response arrays, response times, and the game mode.
 * @returns {PerformanceStats} An object containing the calculated performance statistics,
 * such as accuracies, average response time, and various hit/miss counts.
 */
export const calculatePerformanceStats = (args: CalculateStatsArgs): PerformanceStats => {
  const {
    numTrials,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    gameMode,
  } = args

  let visualCorrect = 0
  let audioCorrect = 0
  let actualVisualMatches = 0
  let visualHits = 0
  let visualMisses = 0
  let visualFalseAlarms = 0
  let visualCorrectRejections = 0
  let actualAudioMatches = 0
  let audioHits = 0
  let audioMisses = 0
  let audioFalseAlarms = 0
  let audioCorrectRejections = 0

  for (let i = 0; i < numTrials; i++) {
    const visualExpected = visualMatches[i] || false
    const audioExpected = audioMatches[i] || false
    const visualResponse = userVisualResponses[i] || false
    const audioResponse = userAudioResponses[i] || false

    if (gameMode === 'single-visual' || gameMode === 'dual') {
      if (visualExpected) {
        actualVisualMatches++
      }
      if (visualExpected && visualResponse) {
        visualHits++
      } else if (visualExpected && !visualResponse) {
        visualMisses++
      } else if (!visualExpected && visualResponse) {
        visualFalseAlarms++
      } else if (!visualExpected && !visualResponse) {
        visualCorrectRejections++
      }
    }

    if (gameMode === 'single-audio' || gameMode === 'dual') {
      if (audioExpected) {
        actualAudioMatches++
      }
      if (audioExpected && audioResponse) {
        audioHits++
      } else if (audioExpected && !audioResponse) {
        audioMisses++
      } else if (!audioExpected && audioResponse) {
        audioFalseAlarms++
      } else if (!audioExpected && !audioResponse) {
        audioCorrectRejections++
      }
    }

    // Note: The original GameInterface calculated visualCorrect and audioCorrect
    // based on simple equality. This logic is preserved here.
    // A more nuanced calculation might consider hits vs correct rejections.
    if (visualExpected === visualResponse) {
      visualCorrect++
    }
    if (audioExpected === audioResponse) {
      audioCorrect++
    }
  }

  const visualAccuracy = numTrials > 0 ? (visualCorrect / numTrials) * 100 : 0
  const audioAccuracy = numTrials > 0 ? (audioCorrect / numTrials) * 100 : 0

  let overallAccuracy = 0
  if (numTrials > 0) { // Ensure numTrials is positive to avoid division by zero or NaN results
    if (gameMode === 'dual') {
      // In dual mode, overall accuracy could be the average of visual and audio if both are relevant
      // Or, if only one response type is expected per trial, this might need adjustment
      // Based on the original code, it's an average of the two individual accuracies
      overallAccuracy = (visualAccuracy + audioAccuracy) / 2
    } else if (gameMode === 'single-visual') {
      overallAccuracy = visualAccuracy
    } else { // 'single-audio'
      overallAccuracy = audioAccuracy
    }
  }


  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0

  return {
    visualAccuracy,
    audioAccuracy,
    overallAccuracy,
    avgResponseTime,
    actualVisualMatches,
    visualHits,
    visualMisses,
    visualFalseAlarms,
    visualCorrectRejections,
    actualAudioMatches,
    audioHits,
    audioMisses,
    audioFalseAlarms,
    audioCorrectRejections,
  }
}
