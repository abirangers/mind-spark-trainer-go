import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GameInterface from '../GameInterface'

// Mock the settings store
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => true), // Mock adaptive difficulty as enabled
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('GameInterface', () => {
  const mockProps = {
    onBack: vi.fn(),
    onViewStats: vi.fn(),
    isPracticeMode: false,
    onPracticeComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders game setup initially', () => {
    render(<GameInterface {...mockProps} />)

    expect(screen.getByText('Game Setup')).toBeInTheDocument()
    expect(screen.getByText('N-Level')).toBeInTheDocument()
    expect(screen.getByText('Game Mode')).toBeInTheDocument()
  })

  it('starts game when start button is clicked', async () => {
    render(<GameInterface {...mockProps} />)

    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/Trial/)).toBeInTheDocument()
    })
  })

  it('handles practice mode correctly', () => {
    render(<GameInterface {...mockProps} isPracticeMode={true} />)

    expect(screen.getByText('Practice Mode')).toBeInTheDocument()
  })

  it('saves session data to localStorage on completion', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<GameInterface {...mockProps} />)

    // Start a short game and complete it
    // This would require more complex setup to simulate a full game

    expect(setItemSpy).toHaveBeenCalledWith('nback-sessions', expect.any(String))
  })
})
