import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsScreen, GameSession } from "./ResultsScreen"; // Adjust path as needed

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

describe("ResultsScreen Component", () => {
  const mockOnBackToHome = vi.fn();
  const mockOnViewStats = vi.fn();
  const mockOnTrainAgain = vi.fn();
  const user = userEvent.setup();

  const sampleSession: GameSession = {
    trials: 20,
    nLevel: 2,
    accuracy: 85.0,
    visualAccuracy: 90.0,
    audioAccuracy: 80.0,
    averageResponseTime: 550,
    mode: "dual", // Ensure this is a string matching component's GameMode type if strictly typed
    timestamp: new Date().toISOString(),
    actualVisualMatches: 5,
    visualHits: 4,
    visualMisses: 1,
    visualFalseAlarms: 1,
    visualCorrectRejections: 14,
    actualAudioMatches: 6,
    audioHits: 5,
    audioMisses: 1,
    audioFalseAlarms: 2,
    audioCorrectRejections: 12,
  };

  const defaultProps = {
    lastSession: sampleSession,
    onBackToHome: mockOnBackToHome,
    onViewStats: mockOnViewStats,
    onTrainAgain: mockOnTrainAgain,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders correctly with lastSession data", () => {
    render(<ResultsScreen {...defaultProps} />);
    expect(screen.getByText("Session Complete!")).toBeInTheDocument();
    expect(screen.getByText("85.0%")).toBeInTheDocument();
    expect(screen.getByText("550ms")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("Detailed Visual Performance")).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.startsWith("Actual Visual Matches:") && content.includes("5")
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Detailed Audio Performance")).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.startsWith("Actual Audio Matches:") && content.includes("6")
      )
    ).toBeInTheDocument();
  });

  it("renders fallback message if lastSession is null and localStorage is empty", () => {
    render(<ResultsScreen {...defaultProps} lastSession={null} />);
    expect(screen.getByText(/Loading session results or no data found/i)).toBeInTheDocument();
  });

  it("loads data from localStorage if lastSession prop is null and data exists in localStorage", async () => {
    localStorageMock.setItem("nback-sessions", JSON.stringify([sampleSession]));
    render(<ResultsScreen {...defaultProps} lastSession={null} />);

    await waitFor(() => {
      expect(screen.getByText("85.0%")).toBeInTheDocument();
    });
    expect(screen.getByText("550ms")).toBeInTheDocument();
  });

  it("handles localStorage parsing error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorageMock.setItem("nback-sessions", "invalid json");
    render(<ResultsScreen {...defaultProps} lastSession={null} />);

    await waitFor(() => {
      expect(screen.getByText(/Loading session results or no data found/i)).toBeInTheDocument();
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to parse sessions from localStorage",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('calls onTrainAgain when "Train Again" button is clicked', async () => {
    render(<ResultsScreen {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Train Again/i }));
    expect(mockOnTrainAgain).toHaveBeenCalledTimes(1);
  });

  it('calls onViewStats when "View All Stats" button is clicked', async () => {
    render(<ResultsScreen {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /View All Stats/i }));
    expect(mockOnViewStats).toHaveBeenCalledTimes(1);
  });

  it('calls onBackToHome when "Back to Home" button is clicked', async () => {
    render(<ResultsScreen {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Back to Home/i }));
    expect(mockOnBackToHome).toHaveBeenCalledTimes(1);
  });

  it("renders specific stats for single-visual mode", () => {
    const visualSession = {
      ...sampleSession,
      mode: "single-visual",
      audioAccuracy: 0,
      actualAudioMatches: 0,
      audioHits: 0,
      audioMisses: 0,
      audioFalseAlarms: 0,
      audioCorrectRejections: 0,
    };
    render(<ResultsScreen {...defaultProps} lastSession={visualSession} />);
    expect(screen.getByText("Detailed Visual Performance")).toBeInTheDocument();
    expect(screen.queryByText("Detailed Audio Performance")).not.toBeInTheDocument();
  });

  it("renders specific stats for single-audio mode", () => {
    const audioSession = {
      ...sampleSession,
      mode: "single-audio",
      visualAccuracy: 0,
      actualVisualMatches: 0,
      visualHits: 0,
      visualMisses: 0,
      visualFalseAlarms: 0,
      visualCorrectRejections: 0,
    };
    render(<ResultsScreen {...defaultProps} lastSession={audioSession} />);
    expect(screen.queryByText("Detailed Visual Performance")).not.toBeInTheDocument();
    expect(screen.getByText("Detailed Audio Performance")).toBeInTheDocument();
  });
});
