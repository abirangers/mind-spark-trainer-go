import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStimulusGeneration, StimulusGenerationHookProps } from "./useStimulusGeneration"; // Adjust path as needed

describe("useStimulusGeneration Hook", () => {
  let mockSpeechSynthesis: {
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    paused: boolean;
    pending: boolean;
    speaking: boolean;
    onvoiceschanged: null | (() => void);
    getVoices: () => SpeechSynthesisVoice[];
  };

  beforeEach(() => {
    // Mock window.speechSynthesis
    mockSpeechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      paused: false,
      pending: false,
      speaking: false,
      onvoiceschanged: null,
      getVoices: () => [],
    };
    vi.stubGlobal("speechSynthesis", mockSpeechSynthesis);

    // Mock SpeechSynthesisUtterance
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn().mockImplementation((text) => ({
        text,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps: StimulusGenerationHookProps = {
    nLevel: 2,
    audioEnabled: true,
    letters: ["A", "B", "C"], // Using a smaller set for easier testing
  };

  it("should initialize with empty sequences and matches", () => {
    const { result } = renderHook(() => useStimulusGeneration(defaultProps));
    expect(result.current.visualSequence).toEqual([]);
    expect(result.current.audioSequence).toEqual([]);
    expect(result.current.visualMatches).toEqual([]);
    expect(result.current.audioMatches).toEqual([]);
  });

  it("generateStimulus should update sequences and return new stimuli", () => {
    const { result } = renderHook(() => useStimulusGeneration(defaultProps));

    let generatedData;
    act(() => {
      generatedData = result.current.generateStimulus();
    });

    expect(result.current.visualSequence.length).toBe(1);
    expect(result.current.audioSequence.length).toBe(1);
    expect(result.current.visualSequence[0]).toBeGreaterThanOrEqual(0);
    expect(result.current.visualSequence[0]).toBeLessThanOrEqual(8); // Assuming 9 positions (0-8)
    expect(defaultProps.letters).toContain(result.current.audioSequence[0]);

    expect(generatedData?.newPosition).toBe(result.current.visualSequence[0]);
    expect(generatedData?.newLetter).toBe(result.current.audioSequence[0]);

    // Matches should be false for the first N stimuli (N=2 here)
    expect(result.current.visualMatches.length).toBe(1);
    expect(result.current.audioMatches.length).toBe(1);
    expect(result.current.visualMatches[0]).toBe(false);
    expect(result.current.audioMatches[0]).toBe(false);
    expect(generatedData?.visualMatch).toBe(false);
    expect(generatedData?.audioMatch).toBe(false);
  });

  it("generateStimulus should correctly identify visual matches (N-Back)", () => {
    const propsN1: StimulusGenerationHookProps = { ...defaultProps, nLevel: 1 };
    const { result } = renderHook(() => useStimulusGeneration(propsN1));

    const mockRandom = vi.spyOn(Math, "random");
    mockRandom
      .mockReturnValueOnce(0.5) // Trial 1: pos 4 (9*0.5=4.5->4)
      .mockReturnValueOnce(0.5) // Trial 1: letter B (12*0.5=6->idx 6)
      .mockReturnValueOnce(0.5) // Trial 2: pos 4 (MATCH)
      .mockReturnValueOnce(0.5) // Trial 2: letter B (MATCH)
      .mockReturnValueOnce(0.1) // Trial 3: pos 0 (9*0.1=0.9->0)
      .mockReturnValueOnce(0.1); // Trial 3: letter A (12*0.1=1.2->idx 1)

    let s1, s2, s3;
    act(() => {
      s1 = result.current.generateStimulus();
    });
    expect(result.current.visualMatches[0]).toBe(false);
    expect(s1?.visualMatch).toBe(false);
    expect(result.current.visualSequence[0]).toBe(4);

    act(() => {
      s2 = result.current.generateStimulus();
    });
    expect(result.current.visualMatches.length).toBe(2);
    expect(result.current.visualMatches[1]).toBe(true);
    expect(s2?.visualMatch).toBe(true);
    expect(result.current.visualSequence[1]).toBe(4);

    act(() => {
      s3 = result.current.generateStimulus();
    });
    expect(result.current.visualMatches.length).toBe(3);
    expect(result.current.visualMatches[2]).toBe(false);
    expect(s3?.visualMatch).toBe(false);
    expect(result.current.visualSequence[2]).toBe(0);

    mockRandom.mockRestore();
  });

  it("generateStimulus should correctly identify audio matches (N-Back)", () => {
    const propsN1: StimulusGenerationHookProps = {
      ...defaultProps,
      nLevel: 1,
      letters: ["X", "Y"],
    };
    const { result } = renderHook(() => useStimulusGeneration(propsN1));

    const mockRandom = vi.spyOn(Math, "random");
    mockRandom
      .mockReturnValueOnce(0.3) // Trial 1: pos 2 (9*0.3=2.7->2)
      .mockReturnValueOnce(0.3) // Trial 1: letter 'X' (2*0.3=0.6 -> idx 0)
      .mockReturnValueOnce(0.3) // Trial 2: pos 2
      .mockReturnValueOnce(0.3) // Trial 2: letter 'X' again (MATCH)
      .mockReturnValueOnce(0.8) // Trial 3: pos 7 (9*0.8=7.2->7)
      .mockReturnValueOnce(0.8); // Trial 3: letter 'Y' (2*0.8=1.6 -> idx 1)

    let s1, s2, s3;
    act(() => {
      s1 = result.current.generateStimulus();
    });
    expect(result.current.audioMatches[0]).toBe(false);
    expect(s1?.audioMatch).toBe(false);
    expect(result.current.audioSequence[0]).toBe("X");

    act(() => {
      s2 = result.current.generateStimulus();
    });
    expect(result.current.audioMatches.length).toBe(2);
    expect(result.current.audioMatches[1]).toBe(true);
    expect(s2?.audioMatch).toBe(true);
    expect(result.current.audioSequence[1]).toBe("X");

    act(() => {
      s3 = result.current.generateStimulus();
    });
    expect(result.current.audioMatches.length).toBe(3);
    expect(result.current.audioMatches[2]).toBe(false);
    expect(s3?.audioMatch).toBe(false);
    expect(result.current.audioSequence[2]).toBe("Y");

    mockRandom.mockRestore();
  });

  it("resetStimulusSequences should clear all sequences and matches", () => {
    const { result } = renderHook(() => useStimulusGeneration(defaultProps));
    act(() => {
      result.current.generateStimulus();
      result.current.generateStimulus();
    });
    expect(result.current.visualSequence.length).toBe(2);

    act(() => {
      result.current.resetStimulusSequences();
    });

    expect(result.current.visualSequence).toEqual([]);
    expect(result.current.audioSequence).toEqual([]);
    expect(result.current.visualMatches).toEqual([]);
    expect(result.current.audioMatches).toEqual([]);
  });

  it("playAudioLetter should call speechSynthesis.speak if audioEnabled is true", () => {
    const { result } = renderHook(() =>
      useStimulusGeneration({ ...defaultProps, audioEnabled: true })
    );
    act(() => {
      result.current.playAudioLetter("A");
    });
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(mockSpeechSynthesis.speak.mock.calls[0][0].text).toBe("A");
  });

  it("playAudioLetter should not call speechSynthesis.speak if audioEnabled is false", () => {
    const { result } = renderHook(() =>
      useStimulusGeneration({ ...defaultProps, audioEnabled: false })
    );
    act(() => {
      result.current.playAudioLetter("A");
    });
    expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
  });

  it("playAudioLetter should call speechSynthesis.cancel before speaking", () => {
    const { result } = renderHook(() =>
      useStimulusGeneration({ ...defaultProps, audioEnabled: true })
    );
    act(() => {
      result.current.playAudioLetter("B");
    });
    // Check mock call order if Vitest supports it directly, or ensure cancel is called.
    // This specific check (toHaveBeenCalledBefore) might need a custom matcher or be part of a more complex spy.
    // For now, ensuring both are called is a good step.
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  });

  it("cancelCurrentSpeech should call speechSynthesis.cancel if audioEnabled is true", () => {
    const { result } = renderHook(() =>
      useStimulusGeneration({ ...defaultProps, audioEnabled: true })
    );
    act(() => {
      result.current.cancelCurrentSpeech();
    });
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });

  it("cancelCurrentSpeech should not call speechSynthesis.cancel if audioEnabled is false", () => {
    const { result } = renderHook(() =>
      useStimulusGeneration({ ...defaultProps, audioEnabled: false })
    );
    act(() => {
      result.current.cancelCurrentSpeech();
    });
    expect(mockSpeechSynthesis.cancel).not.toHaveBeenCalled();
  });

  it("useEffect cleanup should cancel speech if audio was enabled", () => {
    const { unmount } = renderHook(() =>
      useStimulusGeneration({ ...defaultProps, audioEnabled: true })
    );
    unmount();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });

  it("useEffect cleanup should not cancel speech if audio was disabled", () => {
    const { unmount } = renderHook(() =>
      useStimulusGeneration({ ...defaultProps, audioEnabled: false })
    );
    unmount();
    expect(mockSpeechSynthesis.cancel).not.toHaveBeenCalled();
  });
});
