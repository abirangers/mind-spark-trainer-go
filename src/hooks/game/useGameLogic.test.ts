import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameLogic, GameLogicProps, GameState, GameMode } from './useGameLogic'; // Adjust path
import { useSettingsStore } from '@/stores/settingsStore'; // For isAdaptiveDifficultyEnabled

// Mock sonner (toast)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();
vi.stubGlobal('localStorage', localStorageMock);


describe('useGameLogic Hook', () => {
  const mockResetStimulusSequences = vi.fn();
  // The props for useGameLogic used 'executeTrial', let's align with that.
  // The test setup used 'initiateFirstTrial', but the hook itself expects 'executeTrial'.
  const mockExecuteTrial = vi.fn();
  const mockResetTrialStates = vi.fn();
  const mockOnPracticeComplete = vi.fn();


  const defaultProps: GameLogicProps = {
    initialGameMode: 'single-visual' as GameMode,
    initialNLevel: 2,
    initialNumTrials: 5,
    isPracticeMode: false,
    onPracticeComplete: mockOnPracticeComplete,
    visualMatches: [true, false, true, false, true],
    audioMatches: [false, true, false, true, false],
    userVisualResponses: [],
    userAudioResponses: [],
    responseTimes: [],
    resetStimulusSequences: mockResetStimulusSequences,
    executeTrial: mockExecuteTrial,
    resetTrialStates: mockResetTrialStates,
    currentTrial: 0,
  };

  let originalSettingsStoreState: ReturnType<typeof useSettingsStore.getState>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    originalSettingsStoreState = useSettingsStore.getState();
    useSettingsStore.setState(originalSettingsStoreState, true);
    // Explicitly set defaults for tests that might change them
    useSettingsStore.setState({
        isHighContrastMode: false,
        fontSize: 'default',
        isAdaptiveDifficultyEnabled: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Ensure mocks from vi.spyOn etc. are restored
  });

  it('should initialize with default or provided initial states', () => {
    const { result } = renderHook(() => useGameLogic(defaultProps));
    expect(result.current.gameState).toBe('setup' as GameState);
    expect(result.current.gameMode).toBe(defaultProps.initialGameMode);
    expect(result.current.nLevel).toBe(defaultProps.initialNLevel);
    expect(result.current.numTrials).toBe(defaultProps.initialNumTrials);
  });

  it('startGame should set gameState to playing and call resetStimulusSequences', () => {
    const { result } = renderHook(() => useGameLogic(defaultProps));
    act(() => {
      result.current.startGame();
    });
    expect(result.current.gameState).toBe('playing' as GameState);
    expect(mockResetStimulusSequences).toHaveBeenCalledTimes(1);
    // executeTrial is called by GameInterface via useEffect when gameState becomes 'playing'
    expect(mockExecuteTrial).not.toHaveBeenCalled();
  });

  it('resetGame should set gameState to setup and call resetTrialStates', () => {
    const { result } = renderHook(() => useGameLogic(defaultProps));
    act(() => { result.current.startGame(); });
    act(() => { result.current.resetGame(); });
    expect(result.current.gameState).toBe('setup' as GameState);
    expect(mockResetTrialStates).toHaveBeenCalledTimes(1);
  });

  describe('endSession logic', () => {
    it('should set gameState to results and calculate accuracy correctly for single-visual', () => {
      const props = {
        ...defaultProps,
        gameMode: 'single-visual' as GameMode,
        numTrials: 3,
        visualMatches:       [true,  false, true], // Expected
        userVisualResponses: [true,  true,  true], // Actual (1 Hit, 1 FA, 1 Hit) -> 2 correct (Hit, CR implied for FA)
        audioMatches: [], userAudioResponses: [], // Not used in single-visual
        responseTimes: [100, 200, 150],
      };
      const { result } = renderHook(() => useGameLogic(props));
      act(() => { result.current.endSession(); });

      expect(result.current.gameState).toBe('results' as GameState);
      const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]');
      expect(sessions.length).toBeGreaterThan(0);
      const session = sessions[0];
      // In single-visual, correct is (hits + correct rejections).
      // Trial 0: Expected T, Responded T (Hit) -> Correct
      // Trial 1: Expected F, Responded T (FA) -> Incorrect
      // Trial 2: Expected T, Responded T (Hit) -> Correct
      // Accuracy: 2/3 = 66.7%
      expect(session.accuracy.toFixed(1)).toBe("66.7");
      expect(session.visualAccuracy.toFixed(1)).toBe("66.7");
      expect(session.averageResponseTime.toFixed(0)).toBe("150");
      expect(vi.mocked(sonner.toast).success).toHaveBeenCalledWith(expect.stringContaining('Session Complete! 66.7% accuracy'));
    });

    it('should correctly calculate accuracy for dual mode', () => {
        const props = {
            ...defaultProps,
            gameMode: 'dual' as GameMode,
            numTrials: 2,
            visualMatches:       [true, false],
            audioMatches:        [false, true],
            userVisualResponses: [true, false], // Visual: T/T (Hit), F/F (CR) -> 2/2 = 100%
            userAudioResponses:  [false, true], // Audio:  F/F (CR), T/T (Hit) -> 2/2 = 100%
            responseTimes: [100,100,100,100],
        };
        const { result } = renderHook(() => useGameLogic(props));
        act(() => { result.current.endSession(); });
        const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]');
        expect(sessions.length).toBeGreaterThan(0);
        const session = sessions[0];
        expect(session.visualAccuracy).toBe(100);
        expect(session.audioAccuracy).toBe(100);
        expect(session.accuracy).toBe(100);
    });

    it('should trigger adaptive difficulty: increase N-Level', () => {
      useSettingsStore.setState({ isAdaptiveDifficultyEnabled: true });
      const props = { ...defaultProps, nLevel: 2, gameMode: 'single-visual' as GameMode, visualMatches: [true,true,true], userVisualResponses: [true,true,true], numTrials: 3, audioMatches:[], userAudioResponses:[] };
      const { result } = renderHook(() => useGameLogic(props));
      act(() => { result.current.endSession(); });
      expect(result.current.nLevel).toBe(3);
      expect(vi.mocked(sonner.toast).message).toHaveBeenCalledWith(expect.stringContaining('N-Level increased to 3!'));
    });

    it('should trigger adaptive difficulty: decrease N-Level', () => {
      useSettingsStore.setState({ isAdaptiveDifficultyEnabled: true });
      const props = { ...defaultProps, nLevel: 3, gameMode: 'single-visual' as GameMode, visualMatches: [true,true,true], userVisualResponses: [false,false,false], numTrials: 3, audioMatches:[], userAudioResponses:[] };
      const { result } = renderHook(() => useGameLogic(props));
      act(() => { result.current.endSession(); });
      expect(result.current.nLevel).toBe(2);
      expect(vi.mocked(sonner.toast).message).toHaveBeenCalledWith(expect.stringContaining('N-Level decreased to 2.'));
    });

    it('should not change N-Level if adaptive difficulty is disabled', () => {
      useSettingsStore.setState({ isAdaptiveDifficultyEnabled: false });
      const props = { ...defaultProps, nLevel: 2, gameMode: 'single-visual' as GameMode, visualMatches: [true,true,true], userVisualResponses: [true,true,true], numTrials: 3, audioMatches:[], userAudioResponses:[] };
      const { result } = renderHook(() => useGameLogic(props));
      act(() => { result.current.endSession(); });
      expect(result.current.nLevel).toBe(2);
      expect(vi.mocked(sonner.toast).message).not.toHaveBeenCalledWith(expect.stringContaining('N-Level increased'));
    });

    it('should call onPracticeComplete and not save session if isPracticeMode is true', () => {
      const props = { ...defaultProps, isPracticeMode: true, numTrials:1, visualMatches:[true], userVisualResponses:[true], audioMatches:[], userAudioResponses:[] };
      const { result } = renderHook(() => useGameLogic(props));
      act(() => { result.current.endSession(); });
      expect(mockOnPracticeComplete).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('nback-sessions')).toBeNull(); // No session saved
      expect(vi.mocked(sonner.toast).success).toHaveBeenCalledWith("Practice Complete! Well done!", { duration: 3000 });
      expect(result.current.gameState).toBe('setup'); // Should reset to setup after practice
    });

  });

  it('setGameMode, setNLevel, setNumTrials should update state', () => {
    const { result } = renderHook(() => useGameLogic(defaultProps));
    act(() => result.current.setGameMode('dual'));
    expect(result.current.gameMode).toBe('dual');
    act(() => result.current.setNLevel(5));
    expect(result.current.nLevel).toBe(5);
    act(() => result.current.setNumTrials(30));
    expect(result.current.numTrials).toBe(30);
  });

  it('useEffect should auto-start game in practice mode', () => {
    // Initial render with isPracticeMode = true should trigger startGame via useEffect
    const { result } = renderHook(() => useGameLogic({ ...defaultProps, isPracticeMode: true }));
    expect(result.current.gameState).toBe('playing'); // startGame sets it to 'playing'
    expect(mockResetStimulusSequences).toHaveBeenCalled();
  });

  it('useEffect should call endSession when currentTrial equals numTrials (passed as prop)', () => {
    const props = { ...defaultProps, numTrials: 1, currentTrial: 0 }; // Game starts, currentTrial = 0
    const { result, rerender } = renderHook((p: GameLogicProps) => useGameLogic(p), { initialProps: props });

    act(() => { result.current.startGame(); }); // gameState is 'playing'

    // Simulate trial completion by GameInterface updating currentTrial prop
    act(() => {
      rerender({ ...props, currentTrial: 1, gameState: 'playing' }); // currentTrial now equals numTrials
    });

    expect(result.current.gameState).toBe('results'); // endSession called by effect, sets state to 'results'
    expect(JSON.parse(localStorage.getItem('nback-sessions')!)[0].trials).toBe(1);
    expect(vi.mocked(sonner.toast).success).toHaveBeenCalledWith(expect.stringContaining('Session Complete!'));
  });

});
