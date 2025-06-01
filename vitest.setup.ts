// vitest.setup.ts
import '@testing-library/jest-dom/vitest'; // Extends Vitest's expect with jest-dom matchers
// import '@testing-library/jest-dom'; // Alternative import if the above doesn't work, check docs

// You can add other global setup here if needed, for example:
// - Mock global objects (localStorage, matchMedia)
// - Setup MSW (Mock Service Worker) for API mocking

// Example: Mock localStorage if tests need it
// const localStorageMock = (() => {
//   let store: { [key: string]: string } = {};
//   return {
//     getItem: (key: string) => store[key] || null,
//     setItem: (key: string, value: string) => {
//       store[key] = value.toString();
//     },
//     removeItem: (key: string) => {
//       delete store[key];
//     },
//     clear: () => {
//       store = {};
//     },
    // length: Object.keys(store).length, // Add if needed
    // key: (index: number) => Object.keys(store)[index] || null, // Add if needed
//   };
// })();
// Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Example: Mock matchMedia
// Object.defineProperty(window, 'matchMedia', {
//   writable: true,
//   value: vi.fn().mockImplementation(query => ({
//     matches: false,
//     media: query,
//     onchange: null,
//     addListener: vi.fn(), // deprecated
//     removeListener: vi.fn(), // deprecated
//     addEventListener: vi.fn(),
//     removeEventListener: vi.fn(),
//     dispatchEvent: vi.fn(),
//   })),
// });

console.log('Vitest setup file loaded.');
