import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTrialManagement, TrialManagementProps, GameMode } from "./useTrialManagement"; // Adjust path

// Mock sonner (toast)
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(), // Generic toast
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("useTrialManagement Hook", () => {
  const mockGenerateStimulus = vi.fn();
  const mockPlayAudioLetter = vi.fn();
  const mockOnAllTrialsComplete = vi.fn();

  const defaultProps: TrialManagementProps = {
    nLevel: 1,
    numTrials: 3, // Keep low for easier testing of completion
    gameMode: "single-visual" as GameMode,
    stimulusDurationMsInitial: 1000,
    isPracticeMode: false,
    visualMatches: [false, true, false], // Example, ensure length matches numTrials for tests
    generateStimulus: mockGenerateStimulus,
    playAudioLetter: mockPlayAudioLetter,
    onAllTrialsComplete: mockOnAllTrialsComplete,
    // audioEnabled prop was removed from useTrialManagementProps in its definition,
    // as playAudioLetter is passed in and presumed to handle its own audioEnabled logic.
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockGenerateStimulus.mockReset().mockReturnValue({
      newPosition: 1,
      newLetter: "A",
      visualMatch: false,
      audioMatch: false,
    });
    mockPlayAudioLetter.mockReset();
    mockOnAllTrialsComplete.mockReset();
    vi.mocked(sonner.toast.error).mockClear(); // Clear sonner mocks
    vi.mocked(sonner.toast.info).mockClear();
    vi.mocked(sonner.toast.success).mockClear();
    vi.mocked(sonner.toast.warning).mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should initialize with correct default states", () => {
    const { result } = renderHook(() => useTrialManagement(defaultProps));
    expect(result.current.currentTrial).toBe(0);
    expect(result.current.stimulusDurationMs).toBe(defaultProps.stimulusDurationMsInitial);
    expect(result.current.currentPosition).toBeNull();
    expect(result.current.currentLetter).toBe("");
    expect(result.current.isWaitingForResponse).toBe(false);
    expect(result.current.userVisualResponses).toEqual(Array(defaultProps.numTrials).fill(false));
    expect(result.current.userAudioResponses).toEqual(Array(defaultProps.numTrials).fill(false));
    expect(result.current.responseTimes).toEqual([]);
  });

  it("initiateFirstTrial should reset states and start the first trial", () => {
    const { result } = renderHook(() => useTrialManagement(defaultProps));

    act(() => {
      result.current.initiateFirstTrial();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.currentTrial).toBe(0);
    expect(mockGenerateStimulus).toHaveBeenCalledTimes(1);
    expect(result.current.isWaitingForResponse).toBe(true);
    expect(result.current.trialStartTime).toBeGreaterThan(0);
    expect(result.current.currentPosition).not.toBeNull();
    expect(mockPlayAudioLetter).not.toHaveBeenCalled();
  });

  it("initiateFirstTrial should call playAudioLetter for audio/dual modes", () => {
    const audioProps = { ...defaultProps, gameMode: "single-audio" as GameMode };
    const { result: audioResult } = renderHook(() => useTrialManagement(audioProps));
    act(() => {
      audioResult.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });
    expect(mockPlayAudioLetter).toHaveBeenCalledTimes(1);
    mockPlayAudioLetter.mockClear();

    const dualProps = { ...defaultProps, gameMode: "dual" as GameMode };
    const { result: dualResult } = renderHook(() => useTrialManagement(dualProps));
    act(() => {
      dualResult.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });
    expect(mockPlayAudioLetter).toHaveBeenCalledTimes(1);
  });

  it("handleResponse should record visual response, time, and advance trial", () => {
    const { result } = renderHook(() => useTrialManagement(defaultProps));
    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });

    const initialTrial = result.current.currentTrial; // Should be 0
    act(() => {
      vi.advanceTimersByTime(500);
      result.current.handleResponse("visual");
    });

    expect(result.current.userVisualResponses[initialTrial]).toBe(true);
    expect(result.current.responseTimes.length).toBe(1);
    expect(result.current.responseTimes[0]).toBe(500);
    expect(result.current.isWaitingForResponse).toBe(false); // Response made, waiting ends

    act(() => {
      vi.advanceTimersByTime(1000);
    }); // Inter-trial interval
    expect(result.current.currentTrial).toBe(initialTrial + 1); // Advanced to next trial
    expect(mockGenerateStimulus).toHaveBeenCalledTimes(2);
  });

  it("handleTrialTimeout should record max duration response and advance trial", () => {
    const { result } = renderHook(() => useTrialManagement(defaultProps));
    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });

    const initialTrial = result.current.currentTrial;
    act(() => {
      vi.advanceTimersByTime(defaultProps.stimulusDurationMsInitial);
    });

    expect(result.current.responseTimes.length).toBe(1);
    expect(result.current.responseTimes[0]).toBe(defaultProps.stimulusDurationMsInitial);
    expect(result.current.isWaitingForResponse).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentTrial).toBe(initialTrial + 1);
  });

  it("handleTrialTimeout should show toast for missed match in practice mode if visualMatch was true", () => {
    // visualMatches for this test: [true, false, false]
    const practiceProps = {
      ...defaultProps,
      isPracticeMode: true,
      visualMatches: [true, false, false],
    };
    const { result } = renderHook(() => useTrialManagement(practiceProps));
    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    }); // Trial 0

    act(() => {
      vi.advanceTimersByTime(defaultProps.stimulusDurationMsInitial); // Timeout on trial 0
    });
    expect(vi.mocked(sonner.toast).error).toHaveBeenCalledWith("Missed Match!", { duration: 1500 });
  });

  it("handleTrialTimeout should show toast for correct no-response in practice mode if visualMatch was false", () => {
    // visualMatches for this test: [false, false, false]
    const practiceProps = {
      ...defaultProps,
      isPracticeMode: true,
      visualMatches: [false, false, false],
    };
    const { result } = renderHook(() => useTrialManagement(practiceProps));
    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    }); // Trial 0

    act(() => {
      vi.advanceTimersByTime(defaultProps.stimulusDurationMsInitial); // Timeout on trial 0
    });
    expect(vi.mocked(sonner.toast).info).toHaveBeenCalledWith("Correct: No match there.", {
      duration: 1500,
    });
  });

  it("should call onAllTrialsComplete when all trials are done", () => {
    const props = { ...defaultProps, numTrials: 1 };
    const { result } = renderHook(() => useTrialManagement(props));

    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.handleResponse("visual");
    });

    // The effect [currentTrial, numTrials, onAllTrialsComplete] handles completion.
    // No further timers need to be run here as advanceTrial itself updates currentTrial, triggering the effect.
    expect(result.current.currentTrial).toBe(1); // currentTrial becomes equal to numTrials
    expect(mockOnAllTrialsComplete).toHaveBeenCalledTimes(1);
  });

  it("resetTrialStates should reset relevant trial-specific states", () => {
    const { result } = renderHook(() => useTrialManagement(defaultProps));
    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.handleResponse("visual");
    });

    // At this point, currentTrial is 0, one response made. advanceTrial for next trial is pending.
    // Let's advance to start the next trial to make currentTrial > 0
    act(() => {
      vi.advanceTimersByTime(1000);
    }); // currentTrial is now 1
    expect(result.current.currentTrial).toBe(1);
    expect(result.current.userVisualResponses[0]).toBe(true);
    expect(result.current.responseTimes.length).toBe(1);
    expect(result.current.currentPosition).not.toBeNull(); // From second trial's stimulus

    act(() => {
      result.current.resetTrialStates();
    });

    // currentTrial is NOT reset by resetTrialStates, it's reset by initiateFirstTrial or numTrials change.
    // resetTrialStates is more about clearing active trial stimuli and timers.
    expect(result.current.currentTrial).toBe(1); // Remains, as it's not for full game reset.
    expect(result.current.currentPosition).toBeNull();
    expect(result.current.currentLetter).toBe("");
    expect(result.current.isWaitingForResponse).toBe(false);
    // These are not reset by resetTrialStates, but by initiateFirstTrial or numTrials change effect
    // expect(result.current.userVisualResponses).toEqual(Array(defaultProps.numTrials).fill(false));
    // expect(result.current.responseTimes).toEqual([]);
  });

  it("should correctly handle dual mode responses and advance", () => {
    const dualProps = { ...defaultProps, gameMode: "dual" as GameMode, numTrials: 1 };
    const { result } = renderHook(() => useTrialManagement(dualProps));
    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleResponse("visual");
    });
    expect(result.current.isWaitingForResponse).toBe(true);
    expect(result.current.userVisualResponses[0]).toBe(true);
    expect(mockOnAllTrialsComplete).not.toHaveBeenCalled();

    act(() => {
      result.current.handleResponse("audio");
    });
    expect(result.current.isWaitingForResponse).toBe(true); // Still true until 750ms delay finishes

    act(() => {
      vi.advanceTimersByTime(750);
    });
    expect(result.current.isWaitingForResponse).toBe(false); // Now false

    // currentTrial is now 1, which equals numTrials. The effect should call onAllTrialsComplete.
    expect(result.current.currentTrial).toBe(1);
    expect(mockOnAllTrialsComplete).toHaveBeenCalledTimes(1);
  });

  it("useEffect for numTrials change should reset states including currentTrial", () => {
    const { result, rerender } = renderHook(
      (props: TrialManagementProps) => useTrialManagement(props),
      { initialProps: defaultProps }
    );

    act(() => {
      result.current.initiateFirstTrial();
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.handleResponse("visual");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    }); // currentTrial is now 1

    expect(result.current.currentTrial).toBe(1);
    expect(result.current.responseTimes.length).toBe(1);

    const newProps = { ...defaultProps, numTrials: 5 };
    rerender(newProps);

    expect(result.current.currentTrial).toBe(0); // currentTrial is reset by numTrials change effect
    expect(result.current.userVisualResponses).toEqual(Array(5).fill(false));
    expect(result.current.responseTimes).toEqual([]);
  });
});
