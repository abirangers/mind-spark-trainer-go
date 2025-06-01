# Welcome to this N-Back Game Project

This project is an N-Back cognitive training game built with modern web technologies.

## Project Setup

To get this project running locally, you'll need Node.js (preferably a recent LTS version, e.g., v18 or v20) and npm.

1.  **Clone the repository:**

    ```sh
    git clone <YOUR_GIT_URL> # Replace with your actual Git URL
    cd <YOUR_PROJECT_NAME>   # Replace with your project directory name
    ```

2.  **Install dependencies:**
    This project uses npm for package management.

    ```sh
    npm install
    ```

    _(Note: If you primarily use Bun and have a `bun.lockb` file, you might prefer `bun install`)_

3.  **Start the development server:**
    ```sh
    npm run dev
    ```
    This will start the Vite development server, typically on `http://localhost:5173`.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`
  Runs the app in development mode with hot reloading.
  Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view it in the browser.

- `npm run build`
  Builds the app for production to the `dist` folder.
  It correctly bundles React in production mode and optimizes the build for the best performance.

- `npm run build:dev`
  Builds the app in development mode (less optimized, for debugging build issues).

- `npm run preview`
  Serves the production build from the `dist` folder locally. This is useful for testing the production build before deployment.

- `npm run format`
  Formats all code in the project using Prettier.

- `npm run lint:check`
  Checks the codebase for linting issues using ESLint.

- `npm run lint:fix`
  Attempts to automatically fix ESLint issues.

- `npm run test`
  Runs unit and integration tests using Vitest.

- `npm run test:ui`
  Runs tests with the Vitest UI for a more interactive testing experience.

## Project Architecture Overview

This project is a single-page application built with the following core technologies:

- **Vite**: For fast development and optimized builds.
- **React**: For building the user interface declaratively with components.
- **TypeScript**: For static typing, improving code quality and maintainability.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **shadcn/ui**: (Assumed from file structure) UI components built using Radix UI and Tailwind CSS.
- **Zustand**: For global state management (e.g., user settings).
- **React Router**: For client-side routing.
- **Vitest & React Testing Library**: For unit and integration testing.

**Key Directory Structure:**

- `public/`: Static assets.
- `src/`: Application source code.
  - `components/`: Reusable UI components, including:
    - `ui/`: Base UI elements (likely from shadcn/ui).
    - `game/`: Components specific to the game interface (`GameSetupScreen`, `PlayingScreen`, `ResultsScreen`).
    - `SettingsApplier.tsx`: Applies global settings to the DOM.
    - `GameInterface.tsx`: Orchestrates the main game flow and UI.
  - `hooks/`: Custom React hooks, including:
    - `game/`: Hooks for game logic (`useGameLogic`, `useStimulusGeneration`, `useTrialManagement`).
  - `lib/`: Utility functions (e.g., `utils.ts` for `cn`).
  - `pages/`: Top-level page components (e.g., `Index.tsx`, `NotFound.tsx`).
  - `stores/`: Global state stores (e.g., `settingsStore.ts` using Zustand).
  - `App.tsx`: Root application component, sets up routing and providers.
  - `main.tsx`: Entry point of the application.

## Technologies Used

- Vite
- TypeScript
- React
- shadcn/ui (UI components)
- Tailwind CSS
- Zustand (State Management)
- React Router (Routing)
- Vitest & React Testing Library (Testing)
- Prettier & ESLint (Code Formatting & Linting)

## How to Edit This Code

(This section can be kept from the original README if relevant, or simplified)

You can edit this code using:

- **Your preferred IDE**: Clone the repository, install dependencies (`npm install`), and start the dev server (`npm run dev`). Push changes to the Git repository.
- **Directly in GitHub**: For minor edits.
- **GitHub Codespaces**: For a cloud-based development environment.

## Contribution Guidelines

We welcome contributions! If you'd like to contribute, please:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix (e.g., `feature/new-stimulus-type` or `fix/settings-bug`).
3.  Make your changes, ensuring code is formatted (`npm run format`) and linted (`npm run lint:check`).
4.  Add tests for any new functionality or bug fixes.
5.  Commit your changes with clear, descriptive messages.
6.  Push your branch to your fork.
7.  Open a pull request to the main repository, detailing the changes you've made.

## Deployment

(This section can be updated based on actual deployment strategy. The original mentioned "This project platform".)

Deployment details will vary based on your hosting provider. Generally, you would:

1.  Build the project: `npm run build`
2.  Deploy the contents of the `dist/` directory to your static hosting service (e.g., Vercel, Netlify, GitHub Pages).

_(The original "This project platform" sections for editing and deployment have been generalized or removed if they are specific to a proprietary platform not universally applicable to this codebase.)_
