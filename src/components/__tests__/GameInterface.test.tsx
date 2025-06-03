import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import GameInterface from '../GameInterface'
import { useNBackLogic } from '@/hooks/useNBackLogic'

// --- Mock localStorage START ---
const localStorageMockObject = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, value: string) { this.store[key] = value.toString(); },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; },
  get length() { return Object.keys(this.store).length; },
  key(index: number) { return Object.keys(this.store)[index] || null; },
};
vi.stubGlobal('localStorage', localStorageMockObject);
// --- Mock localStorage END ---


// Mock the settings store (used by the hook)
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    isAdaptiveDifficultyEnabled: true,
  })),
}))

// Mock toast (used by the hook)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
  },
}))

// Mock the useNBackLogic hook
vi.mock('@/hooks/useNBackLogic')

const mockUseNBackLogicDefaultValues = {
  gameState: 'setup' as const,
  gameMode: 'single-visual' as const,
  nLevel: 2,
  currentTrial: 0,
  numTrials: 20,
  currentPosition: null,
  currentLetter: '',
  isWaitingForResponse: false,
  visualResponseMadeThisTrial: false,
  audioResponseMadeThisTrial: false,
  stimulusDurationMs: 3000,
  audioEnabled: true,
  letters: ['A', 'B', 'C'],
  setGameMode: vi.fn(),
  setNLevel: vi.fn(),
  setNumTrials: vi.fn(),
  setStimulusDurationMs: vi.fn(),
  setAudioEnabled: vi.fn(),
  startGame: vi.fn(),
  resetGame: vi.fn(),
  handleResponse: vi.fn(),
  getLastSession: vi.fn(() => null),
}

describe('GameInterface', () => {
  const mockProps = {
    onBack: vi.fn(),
    onViewStats: vi.fn(),
    isPracticeMode: false,
    onPracticeComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMockObject.clear(); // Explicitly call clear on the mock object
    (useNBackLogic as vi.Mock).mockReturnValue({ ...mockUseNBackLogicDefaultValues });
  })

  afterEach(() => {
    // vi.unstubAllGlobals(); // Consider if needed, but usually stubs are isolated per file run
  })


  it('renders GameSetupScreen when gameState is "setup"', () => {
    (useNBackLogic as vi.Mock).mockReturnValueOnce({
      ...mockUseNBackLogicDefaultValues,
      gameState: 'setup',
    })
    render(<GameInterface {...mockProps} />)

    expect(screen.getByText('N-Back Training Setup')).toBeInTheDocument()
    expect(screen.getByText('Select Training Mode')).toBeInTheDocument()
    expect(screen.getByText('Training Settings')).toBeInTheDocument()
  })

  it('calls startGame from the hook when "Start Training Session" is clicked in GameSetupScreen', () => {
    const startGameMock = vi.fn();
    (useNBackLogic as vi.Mock).mockReturnValueOnce({
      ...mockUseNBackLogicDefaultValues,
      gameState: 'setup',
      startGame: startGameMock,
    })
    render(<GameInterface {...mockProps} />)

    const startButton = screen.getByText('Start Training Session')
    fireEvent.click(startButton)
    expect(startGameMock).toHaveBeenCalled()
  })

  it('renders GamePlayScreen when gameState is "playing"', () => {
    (useNBackLogic as vi.Mock).mockReturnValueOnce({
      ...mockUseNBackLogicDefaultValues,
      gameState: 'playing',
      currentTrial: 0,
      numTrials: 20,
      nLevel: 2,
      gameMode: 'single-visual',
    })
    render(<GameInterface {...mockProps} />)

    // Check for parts of the trial display separately
    expect(screen.getByText('Trial')).toBeInTheDocument()
    // The dynamic part "1 / 20" is rendered as distinct text nodes sometimes.
    // A more robust way is to get the parent and check its text content.
    const trialProgressElement = screen.getByText('Trial').nextElementSibling; // This assumes specific DOM structure
    expect(trialProgressElement).toHaveTextContent('1 / 20');

    expect(screen.getByText('2-Back Single Visual')).toBeInTheDocument()
    expect(screen.getByText('Position Match')).toBeInTheDocument()
  })

  it('renders GameResultsScreen when gameState is "results"', () => {
    const mockSession = {
      trials: 20, nLevel: 2, accuracy: 80, visualAccuracy: 80, audioAccuracy: 0,
      averageResponseTime: 500, mode: 'single-visual' as const, timestamp: new Date().toISOString(),
      actualVisualMatches: 5, visualHits: 4, visualMisses: 1, visualFalseAlarms: 2, visualCorrectRejections: 12,
    };
    (useNBackLogic as vi.Mock).mockReturnValueOnce({
      ...mockUseNBackLogicDefaultValues,
      gameState: 'results',
      getLastSession: vi.fn(() => mockSession),
    })
    render(<GameInterface {...mockProps} />)

    expect(screen.getByText('Session Complete!')).toBeInTheDocument()
    expect(screen.getByText(/Overall Accuracy/)).toBeInTheDocument()
    expect(screen.getByText(/80.0%/)).toBeInTheDocument()
  })

  it('does not render GameSetupScreen when isPracticeMode is true and gameState is "setup" (due to auto-start)', () => {
    (useNBackLogic as vi.Mock).mockReturnValue({
      ...mockUseNBackLogicDefaultValues,
      gameState: 'setup',
    });

    const { container } = render(<GameInterface {...mockProps} isPracticeMode={true} />)

    expect(container.firstChild).toBeNull();
    expect(useNBackLogic).toHaveBeenCalledWith(expect.objectContaining({
      isPracticeMode: true,
      onPracticeComplete: mockProps.onPracticeComplete
    }));
  })

  it('initializes useNBackLogic with onPracticeComplete when in practice mode', () => {
    // Changed test name for clarity and focus
    render(<GameInterface {...mockProps} isPracticeMode={true} />)
    expect(useNBackLogic).toHaveBeenCalledWith(expect.objectContaining({
      onPracticeComplete: mockProps.onPracticeComplete,
      isPracticeMode: true, // also check this
    }));
  })


  it('localStorage setItem is not called directly by GameInterface', () => {
    // Renamed for clarity, confirming GameInterface doesn't do this itself.
    const setItemSpy = vi.spyOn(localStorageMockObject, 'setItem'); // Spy on the explicit mock object
    render(<GameInterface {...mockProps} />);
    expect(setItemSpy).not.toHaveBeenCalled();
  })

  it('passes keyboard events to handleResponse from the hook when playing (visual)', () => {
    // Renamed for clarity
    const handleResponseMock = vi.fn();
    (useNBackLogic as vi.Mock).mockReturnValueOnce({
      ...mockUseNBackLogicDefaultValues,
      gameState: 'playing',
      isWaitingForResponse: true,
      gameMode: 'single-visual',
      handleResponse: handleResponseMock,
    });

    render(<GameInterface {...mockProps} />);

    fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });
    expect(handleResponseMock).toHaveBeenCalledWith('visual');

    fireEvent.keyDown(window, { key: 'l', code: 'KeyL' }); // Should not trigger visual response
    expect(handleResponseMock).toHaveBeenCalledTimes(1);
  });

  it('passes keyboard events to handleResponse from the hook when playing (audio)', () => {
    // Renamed for clarity
    const handleResponseMock = vi.fn();
    (useNBackLogic as vi.Mock).mockReturnValueOnce({
      ...mockUseNBackLogicDefaultValues,
      gameState: 'playing',
      isWaitingForResponse: true,
      gameMode: 'dual',
      handleResponse: handleResponseMock,
    });

    render(<GameInterface {...mockProps} />);

    fireEvent.keyDown(window, { key: 'l', code: 'KeyL' });
    expect(handleResponseMock).toHaveBeenCalledWith('audio');
  });

})
