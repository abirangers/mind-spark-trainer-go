import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react"; // Removed fireEvent as userEvent is preferred
import userEvent from "@testing-library/user-event";
import { GameSetupScreen, GameMode } from "./GameSetupScreen"; // Adjust path as needed
// AdaptiveDifficultyToggle is imported by GameSetupScreen, so it needs to be truly mocked if not tested here.
// The mock below is correct.

vi.mock("@/components/ui/AdaptiveDifficultyToggle", () => ({
  AdaptiveDifficultyToggle: vi.fn(() => (
    <div data-testid="adaptive-difficulty-toggle-mock">Adaptive Mock</div>
  )),
}));

describe("GameSetupScreen Component", () => {
  const mockOnBack = vi.fn();
  const mockSetGameMode = vi.fn();
  const mockSetNLevel = vi.fn();
  const mockSetNumTrials = vi.fn();
  const mockSetStimulusDurationMs = vi.fn();
  const mockSetAudioEnabled = vi.fn();
  const mockOnStartGame = vi.fn();
  const user = userEvent.setup(); // Setup userEvent

  const defaultProps = {
    onBack: mockOnBack,
    gameMode: "single-visual" as GameMode,
    setGameMode: mockSetGameMode,
    nLevel: 2,
    setNLevel: mockSetNLevel,
    numTrials: 20,
    setNumTrials: mockSetNumTrials,
    stimulusDurationMs: 3000,
    setStimulusDurationMs: mockSetStimulusDurationMs,
    audioEnabled: true,
    setAudioEnabled: mockSetAudioEnabled,
    onStartGame: mockOnStartGame,
    isPracticeMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with initial props", () => {
    render(<GameSetupScreen {...defaultProps} />);
    expect(screen.getByText("N-Back Training Setup")).toBeInTheDocument();
    // Check for the class on the parent div of the text - need to go up more levels
    const visualModeCard = screen.getByText("Single N-Back (Visual)").closest("div")?.parentElement;
    expect(visualModeCard).toHaveClass("border-blue-500");
    expect(screen.getByText("2-Back")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("3.0s")).toBeInTheDocument();
    expect(screen.getByText("Audio On")).toBeInTheDocument();
    expect(screen.getByTestId("adaptive-difficulty-toggle-mock")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    render(<GameSetupScreen {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("calls setGameMode when a game mode is selected", async () => {
    render(<GameSetupScreen {...defaultProps} />);
    // Click the parent div that has the onClick handler
    await user.click(screen.getByText("Dual N-Back").closest("div")!);
    expect(mockSetGameMode).toHaveBeenCalledWith("dual");
  });

  it("calls setNLevel when N-Level buttons are clicked", async () => {
    render(<GameSetupScreen {...defaultProps} nLevel={2} />);
    // N-Level buttons are distinguished by their context. Let's be more specific if possible
    // For now, using getAllByRole and indexing based on visual order.
    const nLevelControls = screen.getByText("N-Level").closest("div");
    const increaseButton = within(nLevelControls!).getByRole("button", { name: "+" });
    const decreaseButton = within(nLevelControls!).getByRole("button", { name: "-" });

    await user.click(increaseButton);
    expect(mockSetNLevel).toHaveBeenCalledTimes(1);

    await user.click(decreaseButton);
    expect(mockSetNLevel).toHaveBeenCalledTimes(2);
  });

  it("calls setNumTrials when Num Trials buttons are clicked", async () => {
    render(<GameSetupScreen {...defaultProps} numTrials={20} />);
    const numTrialsControls = screen.getByText("Number of Trials").closest("div");
    const increaseButton = within(numTrialsControls!).getByRole("button", { name: "+" });
    const decreaseButton = within(numTrialsControls!).getByRole("button", { name: "-" });

    await user.click(increaseButton);
    expect(mockSetNumTrials).toHaveBeenCalledTimes(1);
    await user.click(decreaseButton);
    expect(mockSetNumTrials).toHaveBeenCalledTimes(2);
  });

  it("calls setStimulusDurationMs when Stimulus Duration buttons are clicked", async () => {
    render(<GameSetupScreen {...defaultProps} stimulusDurationMs={3000} />);
    const stimulusDurationControls = screen.getByText("Stimulus Duration").closest("div");
    const increaseButton = within(stimulusDurationControls!).getByRole("button", { name: "+" });
    const decreaseButton = within(stimulusDurationControls!).getByRole("button", { name: "-" });

    await user.click(increaseButton);
    expect(mockSetStimulusDurationMs).toHaveBeenCalledTimes(1);
    await user.click(decreaseButton);
    expect(mockSetStimulusDurationMs).toHaveBeenCalledTimes(2);
  });

  it("calls setAudioEnabled when audio toggle button is clicked", async () => {
    render(<GameSetupScreen {...defaultProps} audioEnabled={true} />);
    await user.click(screen.getByRole("button", { name: /Audio On/i }));
    expect(mockSetAudioEnabled).toHaveBeenCalledTimes(1);
  });

  it('calls onStartGame when "Start Training Session" button is clicked', async () => {
    render(<GameSetupScreen {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Start Training Session/i }));
    expect(mockOnStartGame).toHaveBeenCalledTimes(1);
  });

  it("does not render if isPracticeMode is true", () => {
    const { container } = render(<GameSetupScreen {...defaultProps} isPracticeMode={true} />);
    expect(container.firstChild).toBeNull();
  });

  // Conceptual test removed as component returns null, making query impossible.
});

// Using the proper within function from @testing-library/react
