import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react"; // Added within
import userEvent from "@testing-library/user-event";
import { PlayingScreen, GameMode } from "./PlayingScreen"; // Adjust path as needed

describe("PlayingScreen Component", () => {
  const mockOnPauseGame = vi.fn();
  const mockOnRespond = vi.fn();
  const user = userEvent.setup();

  const defaultProps = {
    onPauseGame: mockOnPauseGame,
    nLevel: 2,
    gameMode: "single-visual" as GameMode,
    currentTrial: 0,
    numTrials: 20,
    currentPosition: 4,
    currentLetter: "A",
    isWaitingForResponse: true,
    onRespond: mockOnRespond,
    visualResponseMadeThisTrial: false,
    audioResponseMadeThisTrial: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with initial props for single-visual mode", () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByText("2-Back Single Visual")).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
    expect(screen.getByText("1 / 20")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument();

    const visualGrid = screen
      .getByText("Position Match")
      .closest(".space-y-8")!
      .querySelector(".grid.grid-cols-3");
    expect(visualGrid).toBeInTheDocument();
    if (visualGrid) {
      const squares = within(visualGrid as HTMLElement).getAllByRole("generic", { name: "" });
      expect(squares.length).toBe(9);
      expect(squares[4]).toHaveClass("bg-blue-500");
    }

    expect(screen.getByRole("button", { name: /Position Match/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sound Match/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/Press when current stimulus matches 2 steps back/i)
    ).toBeInTheDocument();
  });

  it("renders correctly for single-audio mode", () => {
    render(<PlayingScreen {...defaultProps} gameMode="single-audio" currentLetter="B" />);
    expect(screen.getByText("2-Back Single Audio")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();

    const visualGrid = screen.queryByTestId("visual-grid"); // Use test ID for more reliable querying
    expect(visualGrid).toBeNull(); // Grid should not be rendered in single-audio mode

    expect(screen.queryByRole("button", { name: /Position Match/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sound Match/i })).toBeInTheDocument();
  });

  it("renders correctly for dual mode", () => {
    render(
      <PlayingScreen {...defaultProps} gameMode="dual" currentPosition={1} currentLetter="C" />
    );
    expect(screen.getByText("2-Back Dual")).toBeInTheDocument();

    const visualGrid = screen
      .getByText("Position Match")
      .closest(".space-y-8")!
      .querySelector(".grid.grid-cols-3");
    expect(visualGrid).toBeInTheDocument();
    if (visualGrid) {
      const squares = within(visualGrid as HTMLElement).getAllByRole("generic", { name: "" });
      expect(squares.length).toBe(9);
      expect(squares[1]).toHaveClass("bg-blue-500");
    }
    expect(screen.getByText("C")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Position Match/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sound Match/i })).toBeInTheDocument();
  });

  it("calls onPauseGame when Pause button is clicked", async () => {
    render(<PlayingScreen {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Pause/i }));
    expect(mockOnPauseGame).toHaveBeenCalledTimes(1);
  });

  it('calls onRespond with "visual" when Position Match button is clicked', async () => {
    render(<PlayingScreen {...defaultProps} gameMode="single-visual" />);
    await user.click(screen.getByRole("button", { name: /Position Match/i }));
    expect(mockOnRespond).toHaveBeenCalledWith("visual");
  });

  it('calls onRespond with "audio" when Sound Match button is clicked', async () => {
    render(<PlayingScreen {...defaultProps} gameMode="single-audio" />);
    await user.click(screen.getByRole("button", { name: /Sound Match/i }));
    expect(mockOnRespond).toHaveBeenCalledWith("audio");
  });

  it("response buttons are disabled if not isWaitingForResponse", () => {
    render(<PlayingScreen {...defaultProps} gameMode="dual" isWaitingForResponse={false} />);
    expect(screen.getByRole("button", { name: /Position Match/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Sound Match/i })).toBeDisabled();
  });

  it("in dual mode, visual button is disabled if visualResponseMadeThisTrial is true", () => {
    render(<PlayingScreen {...defaultProps} gameMode="dual" visualResponseMadeThisTrial={true} />);
    expect(screen.getByRole("button", { name: /Position Match/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Sound Match/i })).not.toBeDisabled();
  });

  it("in dual mode, audio button is disabled if audioResponseMadeThisTrial is true", () => {
    render(<PlayingScreen {...defaultProps} gameMode="dual" audioResponseMadeThisTrial={true} />);
    expect(screen.getByRole("button", { name: /Position Match/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Sound Match/i })).toBeDisabled();
  });

  it("displays correct progress", () => {
    render(<PlayingScreen {...defaultProps} currentTrial={9} numTrials={20} />);
    const progressBar = screen.getByRole("progressbar");
    // Progress is (currentTrial / numTrials) * 100. Since currentTrial is 0-indexed, for trial 10, currentTrial is 9.
    // So it should be (9 / 20) * 100 = 45.
    // However, the component displays currentTrial + 1. So for trial 10 (currentTrial=9), it displays "10 / 20".
    // The progress bar value is (currentTrial / numTrials) * 100.
    // Check if the progress bar has the correct value (shadcn Progress might use different attributes)
    expect(progressBar).toHaveAttribute("aria-valuenow", "45");
  });

  it("displays placeholder for audio letter if currentLetter is empty", () => {
    render(<PlayingScreen {...defaultProps} gameMode="single-audio" currentLetter="" />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("hides response instruction text if not isWaitingForResponse", () => {
    render(<PlayingScreen {...defaultProps} isWaitingForResponse={false} />);
    expect(screen.queryByText(/Press when current stimulus matches/i)).not.toBeInTheDocument();
  });
});
