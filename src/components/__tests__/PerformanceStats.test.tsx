import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PerformanceStats from '../PerformanceStats'

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Line: () => <div />,
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

const mockProps = {
  onBack: vi.fn(),
  onStartTraining: vi.fn(),
}

describe('PerformanceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "No Training Data Yet" when no sessions exist', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(<PerformanceStats {...mockProps} />)
    
    expect(screen.getByText('No Training Data Yet')).toBeInTheDocument()
    expect(screen.getByText('Start Your First Session')).toBeInTheDocument()
  })

  it('calculates day streak correctly for single session today', () => {
    const today = new Date()
    const sessions = [
      {
        trials: 20,
        nLevel: 2,
        accuracy: 85,
        visualAccuracy: 80,
        audioAccuracy: 90,
        averageResponseTime: 1200,
        mode: 'single-visual',
        timestamp: today.toISOString(),
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessions))

    render(<PerformanceStats {...mockProps} />)

    // Click on Insights tab to see day streak
    const insightsTab = screen.getByText('Insights')
    insightsTab.click()

    // Should show day streak of 1 in Training Summary
    expect(screen.getByText('Day Streak')).toBeInTheDocument()
    // Find the day streak value (should be 1)
    const dayStreakSection = screen.getByText('Day Streak').closest('div')
    expect(dayStreakSection).toHaveTextContent('1')
  })

  it('calculates day streak correctly for consecutive days', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)

    const sessions = [
      {
        trials: 20,
        nLevel: 2,
        accuracy: 85,
        visualAccuracy: 80,
        audioAccuracy: 90,
        averageResponseTime: 1200,
        mode: 'single-visual',
        timestamp: twoDaysAgo.toISOString(),
      },
      {
        trials: 20,
        nLevel: 2,
        accuracy: 87,
        visualAccuracy: 82,
        audioAccuracy: 92,
        averageResponseTime: 1150,
        mode: 'single-visual',
        timestamp: yesterday.toISOString(),
      },
      {
        trials: 20,
        nLevel: 2,
        accuracy: 90,
        visualAccuracy: 85,
        audioAccuracy: 95,
        averageResponseTime: 1100,
        mode: 'single-visual',
        timestamp: today.toISOString(),
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessions))

    render(<PerformanceStats {...mockProps} />)

    // Click on Insights tab to see day streak
    const insightsTab = screen.getByText('Insights')
    insightsTab.click()

    // Should show day streak of 3
    expect(screen.getByText('Day Streak')).toBeInTheDocument()
    const dayStreakSection = screen.getByText('Day Streak').closest('div')
    expect(dayStreakSection).toHaveTextContent('3')
  })

  it('resets day streak when there is a gap', () => {
    const today = new Date()
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)

    const sessions = [
      {
        trials: 20,
        nLevel: 2,
        accuracy: 85,
        visualAccuracy: 80,
        audioAccuracy: 90,
        averageResponseTime: 1200,
        mode: 'single-visual',
        timestamp: threeDaysAgo.toISOString(),
      },
      {
        trials: 20,
        nLevel: 2,
        accuracy: 90,
        visualAccuracy: 85,
        audioAccuracy: 95,
        averageResponseTime: 1100,
        mode: 'single-visual',
        timestamp: today.toISOString(),
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessions))

    render(<PerformanceStats {...mockProps} />)

    // Click on Insights tab to see day streak
    const insightsTab = screen.getByText('Insights')
    insightsTab.click()

    // Should show day streak of 1 (only today, gap resets streak)
    expect(screen.getByText('Day Streak')).toBeInTheDocument()
    const dayStreakSection = screen.getByText('Day Streak').closest('div')
    expect(dayStreakSection).toHaveTextContent('1')
  })

  it('shows 0 day streak when last session was more than 1 day ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

    const sessions = [
      {
        trials: 20,
        nLevel: 2,
        accuracy: 85,
        visualAccuracy: 80,
        audioAccuracy: 90,
        averageResponseTime: 1200,
        mode: 'single-visual',
        timestamp: threeDaysAgo.toISOString(),
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessions))

    render(<PerformanceStats {...mockProps} />)

    // Click on Insights tab to see day streak
    const insightsTab = screen.getByText('Insights')
    insightsTab.click()

    // Should show day streak of 0 (last session too old)
    expect(screen.getByText('Day Streak')).toBeInTheDocument()
    const dayStreakSection = screen.getByText('Day Streak').closest('div')
    expect(dayStreakSection).toHaveTextContent('0')
  })

  it('displays correct session statistics', () => {
    const sessions = [
      {
        trials: 20,
        nLevel: 2,
        accuracy: 85,
        visualAccuracy: 80,
        audioAccuracy: 90,
        averageResponseTime: 1200,
        mode: 'single-visual',
        timestamp: new Date().toISOString(),
      }
    ]
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessions))
    
    render(<PerformanceStats {...mockProps} />)
    
    expect(screen.getByText('1')).toBeInTheDocument() // Sessions Completed
    expect(screen.getByText('85.0%')).toBeInTheDocument() // Average Accuracy
    expect(screen.getByText('2')).toBeInTheDocument() // Best N-Level
    expect(screen.getByText('1200ms')).toBeInTheDocument() // Avg Response Time
  })
})
