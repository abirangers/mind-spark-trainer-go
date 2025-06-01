import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameInterface, { GameInterfaceProps } from './GameInterface'; // Adjust path

// Mock the custom hooks
vi.mock('@/hooks/game/useGameLogic');
vi.mock('@/hooks/game/useStimulusGeneration');
vi.mock('@/hooks/game/useTrialManagement');

// Mock sub-components
vi.mock('./game/GameSetupScreen', () => ({
  GameSetupScreen: vi.fn((props) => (
    <div data-testid="game-setup-screen-mock">
      <button onClick={props.onStartGame}>Start Game (Mock)</button>
      <button onClick={() => props.setGameMode('dual')}>Set Dual Mode (Mock)</button>
      <button onClick={() => props.setNLevel(3)}>Set N-Level 3 (Mock)</button>
      <button onClick={() => props.setNumTrials(10)}>Set NumTrials 10 (Mock)</button>
      <button onClick={() => props.setStimulusDurationMs(1500)}>Set Duration 1.5s (Mock)</button>
      <button onClick={() => props.setAudioEnabled(false)}>Disable Audio (Mock)</button>
      <button onClick={props.onBack}>Back (Mock)</button>
    </div>
  )),
}));
vi.mock('./game/PlayingScreen', () => ({
  PlayingScreen: vi.fn((props) => (
    <div data-testid="playing-screen-mock">
      <button onClick={() => props.onRespond('visual')}>Visual Match (Mock)</button>
      <button onClick={() => props.onRespond('audio')}>Audio Match (Mock)</button>
      <button onClick={props.onPauseGame}>Pause Game (Mock)</button>
      <span>Trial: {props.currentTrial + 1}</span>
      <span>N-Level: {props.nLevel}</span>
      <span>GameMode: {props.gameMode}</span>
      <span>Position: {props.currentPosition}</span>
      <span>Letter: {props.currentLetter}</span>
    </div>
  )),
}));
vi.mock('./game/ResultsScreen', () => ({
  ResultsScreen: vi.fn((props) => (
    <div data-testid="results-screen-mock">
      <button onClick={props.onTrainAgain}>Train Again (Mock)</button>
      <button onClick={props.onViewStats}>View Stats (Mock)</button>
      <button onClick={props.onBackToHome}>Back to Home (Mock)</button>
      {props.lastSession && <span>Accuracy: {props.lastSession.accuracy}%</span>}
    </div>
  )),
}));


import { useGameLogic } from '@/hooks/game/useGameLogic';
import { useStimulusGeneration } from '@/hooks/game/useStimulusGeneration';
import { useTrialManagement } from '@/hooks/game/useTrialManagement';

// Helper to create a typed mock function
const mockFn = <T extends (...args: any[]) => any>(fn?: T): Mock<Parameters<T>, ReturnType<T>> => {
  return vi.fn(fn) as Mock<Parameters<T>, ReturnType<T>>;
};


describe('GameInterface Component - Top-Level Integration', () => {
  const mockOnBack = mockFn();
  const mockOnViewStats = mockFn();
  const mockOnPracticeComplete = mockFn();
  const user = userEvent.setup();

  let mockGameLogicValues: ReturnType<typeof useGameLogic>;
  let mockStimulusGenerationValues: ReturnType<typeof useStimulusGeneration>;
  let mockTrialManagementValues: ReturnType<typeof useTrialManagement>;

  const setupDefaultMocks = (initialGameState: string = 'setup') => {
    // Define mutable state for gameLogic mock to simulate state changes
    let currentGameState = initialGameState;
    let currentNLevel = 2;
    let currentNumTrials = 20;
    let currentGameMode = 'single-visual';

    mockGameLogicValues = {
      gameMode: currentGameMode as any,
      setGameMode: mockFn((mode) => { currentGameMode = mode; }),
      gameState: currentGameState as any,
      setGameState: mockFn((state) => { currentGameState = state; }),
      nLevel: currentNLevel,
      setNLevel: mockFn((updater) => {
        currentNLevel = typeof updater === 'function' ? updater(currentNLevel) : updater;
      }),
      numTrials: currentNumTrials,
      setNumTrials: mockFn((updater) => {
        currentNumTrials = typeof updater === 'function' ? updater(currentNumTrials) : updater;
      }),
      startGame: mockFn(() => { currentGameState = 'playing'; }),
      resetGame: mockFn(() => { currentGameState = 'setup'; }),
      endSession: mockFn(() => { currentGameState = 'results'; }),
      PRACTICE_MODE: 'single-visual' as any,
      PRACTICE_N_LEVEL: 1,
      PRACTICE_NUM_TRIALS: 7,
    };

    (useGameLogic as Mock).mockImplementation(() => ({
      ...mockGameLogicValues,
      gameState: currentGameState as any, // Ensure it reflects current mock state
      nLevel: currentNLevel,
      numTrials: currentNumTrials,
      gameMode: currentGameMode as any,
    }));


    mockStimulusGenerationValues = {
      visualSequence: [], audioSequence: [], visualMatches: [], audioMatches: [],
      generateStimulus: mockFn(() => ({newPosition:0, newLetter:'A', visualMatch:false, audioMatch:false})),
      playAudioLetter: mockFn(),
      resetStimulusSequences: mockFn(),
      cancelCurrentSpeech: mockFn(),
    };
    (useStimulusGeneration as Mock).mockReturnValue(mockStimulusGenerationValues);

    mockTrialManagementValues = {
      currentTrial: 0,
      stimulusDurationMs: 3000,
      setStimulusDurationMs: mockFn(),
      currentPosition: null,
      currentLetter: '',
      isWaitingForResponse: false,
      userVisualResponses: [],
      userAudioResponses: [],
      responseTimes: [],
      handleResponse: mockFn(),
      initiateFirstTrial: mockFn(),
      resetTrialStates: mockFn(),
      visualResponseMadeThisTrial: false,
      audioResponseMadeThisTrial: false,
    };
    (useTrialManagement as Mock).mockReturnValue(mockTrialManagementValues);
  };

  const defaultGameInterfaceProps: GameInterfaceProps = {
    onBack: mockOnBack,
    onViewStats: mockOnViewStats,
    isPracticeMode: false,
    onPracticeComplete: mockOnPracticeComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks(); // Clear all mocks, including sub-component mocks
    setupDefaultMocks('setup');
  });

  it('should render GameSetupScreen initially', () => {
    render(<GameInterface {...defaultGameInterfaceProps} />);
    expect(screen.getByTestId('game-setup-screen-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('playing-screen-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('results-screen-mock')).not.toBeInTheDocument();
  });

  it('should transition from setup to playing when startGame is triggered from GameSetupScreen', async () => {
    const { rerender } = render(<GameInterface {...defaultGameInterfaceProps} />);
    expect(screen.getByTestId('game-setup-screen-mock')).toBeInTheDocument();

    await user.click(screen.getByText('Start Game (Mock)'));
    expect(mockGameLogicValues.startGame).toHaveBeenCalledTimes(1);

    // Manually update mock to reflect state change by startGame
    setupDefaultMocks('playing');
    rerender(<GameInterface {...defaultGameInterfaceProps} />);

    expect(screen.queryByTestId('game-setup-screen-mock')).not.toBeInTheDocument();
    expect(screen.getByTestId('playing-screen-mock')).toBeInTheDocument();
    expect(mockTrialManagementValues.initiateFirstTrial).toHaveBeenCalled();
  });

  it('should transition from playing to results when endSession is triggered', async () => {
    setupDefaultMocks('playing');
    const { rerender } = render(<GameInterface {...defaultGameInterfaceProps} />);
    expect(screen.getByTestId('playing-screen-mock')).toBeInTheDocument();

    act(() => {
      // Simulate all trials completed which would call onAllTrialsComplete (wired to gameLogic.endSession)
      // In the test, we can directly trigger the state change as if endSession was called and did its job.
      (useGameLogic as Mock).mockImplementation(() => ({
        ...mockGameLogicValues,
        gameState: 'results',
      }));
    });

    rerender(<GameInterface {...defaultGameInterfaceProps} />);

    expect(screen.queryByTestId('playing-screen-mock')).not.toBeInTheDocument();
    expect(screen.getByTestId('results-screen-mock')).toBeInTheDocument();
  });

  it('should transition from results to setup when onTrainAgain is triggered from ResultsScreen', async () => {
    setupDefaultMocks('results');
    const { rerender } = render(<GameInterface {...defaultGameInterfaceProps} />);
    expect(screen.getByTestId('results-screen-mock')).toBeInTheDocument();

    await user.click(screen.getByText('Train Again (Mock)'));

    // onTrainAgain in ResultsScreen mock calls handleResetGame in GameInterface
    // handleResetGame calls gameLogic.resetGame() and trialM.resetTrialStates()
    expect(mockGameLogicValues.resetGame).toHaveBeenCalledTimes(1);
    expect(mockTrialManagementValues.resetTrialStates).toHaveBeenCalledTimes(1);

    // Manually update mock to reflect state change by resetGame
    setupDefaultMocks('setup');
    rerender(<GameInterface {...defaultGameInterfaceProps} />);

    expect(screen.queryByTestId('results-screen-mock')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-setup-screen-mock')).toBeInTheDocument();
  });

  it('should call trialManagement.handleResponse on keyboard input during "playing" state', async () => {
    setupDefaultMocks('playing');
    // Ensure isWaitingForResponse is true for the keyboard listener to act
    (useTrialManagement as Mock).mockReturnValue({
      ...mockTrialManagementValues,
      isWaitingForResponse: true,
    });
    // Ensure gameMode allows visual/audio responses
     (useGameLogic as Mock).mockImplementation(() => ({
      ...mockGameLogicValues,
      gameState: 'playing',
      gameMode: 'dual' as any,
    }));


    render(<GameInterface {...defaultGameInterfaceProps} />);
    expect(screen.getByTestId('playing-screen-mock')).toBeInTheDocument();

    act(() => { fireEvent.keyDown(window, { key: 'a', code: 'KeyA' }); });
    expect(mockTrialManagementValues.handleResponse).toHaveBeenCalledWith('visual');

    act(() => { fireEvent.keyDown(window, { key: 'l', code: 'KeyL' }); });
    expect(mockTrialManagementValues.handleResponse).toHaveBeenCalledWith('audio');
  });

  it('should correctly handle practice mode start (skip setup, go to playing)', () => {
    setupDefaultMocks('setup'); // Start with setup

    // GameLogic's useEffect for practice mode should call startGame, which sets gameState to 'playing'
    // The GameInterface useEffect for gameState 'playing' should then call initiateFirstTrial
    (useGameLogic as Mock).mockImplementation((props) => {
      // Simulate the behavior of useGameLogic when isPracticeMode is true
      const initialGameState = props.isPracticeMode ? 'playing' : 'setup';
      // If it's practice mode, we assume startGame was called internally by the hook's effect
      if (props.isPracticeMode) {
        mockGameLogicValues.startGame(); // Simulate the effect calling startGame
      }
      return {
        ...mockGameLogicValues,
        gameState: initialGameState as any,
      };
    });

    const { rerender } = render(<GameInterface {...defaultGameInterfaceProps} isPracticeMode={true} />);

    // After GameLogic's effect runs (simulated by mockImplementation), GameInterface's effect should run
    // This might require a rerender if the state change isn't picked up immediately for the second effect
    rerender(<GameInterface {...defaultGameInterfaceProps} isPracticeMode={true} />);

    expect(screen.queryByTestId('game-setup-screen-mock')).not.toBeInTheDocument();
    expect(screen.getByTestId('playing-screen-mock')).toBeInTheDocument();
    expect(mockTrialManagementValues.initiateFirstTrial).toHaveBeenCalled();
  });

});
