import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSettingsStore } from './settingsStore'; // Path to your store

// Helper to get the initial state directly for some tests if needed, or reset store
const getInitialState = () => useSettingsStore.getState();

describe('useSettingsStore', () => {
  const originalInitialState = getInitialState();

  beforeEach(() => {
    // Reset the store to its initial state before each test
    useSettingsStore.setState(originalInitialState, true); // Replace state

    // It's good practice to clear localStorage if persist middleware is involved,
    // to ensure tests are isolated from each other.
    // Vitest's JSDOM environment provides a basic localStorage.
    localStorage.clear();
    // Mock console.error to avoid polluting test output from initial hydration attempts if any
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear(); // Clean up localStorage after each test
    vi.restoreAllMocks(); // Restore any mocks
  });

  it('should have correct initial state', () => {
    const state = useSettingsStore.getState();
    expect(state.isHighContrastMode).toBe(false);
    expect(state.fontSize).toBe('default');
    expect(state.isAdaptiveDifficultyEnabled).toBe(true);
  });

  it('toggleHighContrastMode should toggle isHighContrastMode', () => {
    const initialStateValue = useSettingsStore.getState().isHighContrastMode;
    // expect(initialStateValue).toBe(false); // Initial state is already tested above, this can be redundant

    useSettingsStore.getState().toggleHighContrastMode();
    expect(useSettingsStore.getState().isHighContrastMode).toBe(!initialStateValue);

    useSettingsStore.getState().toggleHighContrastMode();
    expect(useSettingsStore.getState().isHighContrastMode).toBe(initialStateValue);
  });

  it('setHighContrastMode should set isHighContrastMode to the given value', () => {
    useSettingsStore.getState().setHighContrastMode(true);
    expect(useSettingsStore.getState().isHighContrastMode).toBe(true);

    useSettingsStore.getState().setHighContrastMode(false);
    expect(useSettingsStore.getState().isHighContrastMode).toBe(false);
  });

  it('setFontSize should update fontSize', () => {
    useSettingsStore.getState().setFontSize('large');
    expect(useSettingsStore.getState().fontSize).toBe('large');

    useSettingsStore.getState().setFontSize('xlarge');
    expect(useSettingsStore.getState().fontSize).toBe('xlarge');

    useSettingsStore.getState().setFontSize('default');
    expect(useSettingsStore.getState().fontSize).toBe('default');
  });

  it('toggleAdaptiveDifficulty should toggle isAdaptiveDifficultyEnabled', () => {
    const initialValue = useSettingsStore.getState().isAdaptiveDifficultyEnabled;
    // expect(initialValue).toBe(true); // Initial state is already tested

    useSettingsStore.getState().toggleAdaptiveDifficulty();
    expect(useSettingsStore.getState().isAdaptiveDifficultyEnabled).toBe(!initialValue);

    useSettingsStore.getState().toggleAdaptiveDifficulty();
    expect(useSettingsStore.getState().isAdaptiveDifficultyEnabled).toBe(initialValue);
  });

  // Test persistence (optional, more of an integration test for persist middleware)
  it('should persist state to localStorage (basic check)', async () => {
    // Modify state
    useSettingsStore.getState().setFontSize('xlarge');
    useSettingsStore.getState().setHighContrastMode(true);
    useSettingsStore.getState().toggleAdaptiveDifficulty(); // Make it false
    const expectedAdaptiveDifficulty = !originalInitialState.isAdaptiveDifficultyEnabled;


    // Zustand's persist middleware might write to localStorage asynchronously or debounced.
    // Waiting for a short timeout can help, though not perfectly robust.
    await new Promise(resolve => setTimeout(resolve, 200)); // Increased timeout slightly

    const persistedDataString = localStorage.getItem('app-settings');
    expect(persistedDataString).not.toBeNull();
    if (persistedDataString) {
      const persistedData = JSON.parse(persistedDataString);
      expect(persistedData.state.fontSize).toBe('xlarge');
      expect(persistedData.state.isHighContrastMode).toBe(true);
      expect(persistedData.state.isAdaptiveDifficultyEnabled).toBe(expectedAdaptiveDifficulty);
    }

    // Note: Testing rehydration from localStorage back into a new store instance
    // is more complex and often better suited for integration/e2e tests or
    // by manually calling the persist middleware's rehydration logic if exposed.
    // For this unit test, checking localStorage content is a primary step.
  });

});
