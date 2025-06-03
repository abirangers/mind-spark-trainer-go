import { describe, it, expect } from 'vitest'

// Helper function to calculate day streak (copied from PerformanceStats.tsx)
const calculateDayStreak = (sessions: Array<{ timestamp: string }>): number => {
  if (sessions.length === 0) {
    return 0
  }

  // Get unique dates from sessions (sorted by date)
  const sessionDates = sessions
    .map(session => {
      const date = new Date(session.timestamp)
      return date.toDateString() // This gives us "Mon Jan 01 2024" format
    })
    .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // Sort chronologically

  if (sessionDates.length === 0) {
    return 0
  }

  // Check if the most recent session was today or yesterday
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
  const mostRecentDate = sessionDates[sessionDates.length - 1]

  // If the most recent session is not today or yesterday, streak is 0
  if (mostRecentDate !== today && mostRecentDate !== yesterday) {
    return 0
  }

  // Count consecutive days working backwards from the most recent date
  let streak = 0
  const currentDate = new Date(mostRecentDate)

  for (let i = sessionDates.length - 1; i >= 0; i--) {
    const sessionDate = new Date(sessionDates[i])
    const expectedDate = new Date(currentDate.getTime() - streak * 24 * 60 * 60 * 1000)

    if (sessionDate.toDateString() === expectedDate.toDateString()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

describe('calculateDayStreak', () => {
  it('returns 0 for empty sessions', () => {
    expect(calculateDayStreak([])).toBe(0)
  })

  it('returns 1 for single session today', () => {
    const today = new Date()
    const sessions = [{ timestamp: today.toISOString() }]
    expect(calculateDayStreak(sessions)).toBe(1)
  })

  it('returns 1 for single session yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sessions = [{ timestamp: yesterday.toISOString() }]
    expect(calculateDayStreak(sessions)).toBe(1)
  })

  it('returns 0 for session more than 1 day ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const sessions = [{ timestamp: threeDaysAgo.toISOString() }]
    expect(calculateDayStreak(sessions)).toBe(0)
  })

  it('calculates correct streak for consecutive days', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
    
    const sessions = [
      { timestamp: twoDaysAgo.toISOString() },
      { timestamp: yesterday.toISOString() },
      { timestamp: today.toISOString() }
    ]
    
    expect(calculateDayStreak(sessions)).toBe(3)
  })

  it('resets streak when there is a gap', () => {
    const today = new Date()
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    const sessions = [
      { timestamp: threeDaysAgo.toISOString() },
      { timestamp: today.toISOString() }
    ]
    
    expect(calculateDayStreak(sessions)).toBe(1)
  })

  it('handles multiple sessions on same day', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    
    const sessions = [
      { timestamp: yesterday.toISOString() },
      { timestamp: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString() }, // 2 hours ago
      { timestamp: today.toISOString() }
    ]
    
    expect(calculateDayStreak(sessions)).toBe(2)
  })

  it('handles sessions in random order', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
    
    const sessions = [
      { timestamp: today.toISOString() },
      { timestamp: twoDaysAgo.toISOString() },
      { timestamp: yesterday.toISOString() }
    ]
    
    expect(calculateDayStreak(sessions)).toBe(3)
  })
})
