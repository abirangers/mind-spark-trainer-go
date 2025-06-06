# N-Back Cognitive Training Game

This project is an N-Back cognitive training game designed to help users improve their working memory and attention skills. It features configurable N-levels, trial numbers, and stimulus durations, along with different game modes (visual, audio, dual).

For detailed product requirements and features, please see the [Product Requirements Document](docs/PRD.md).

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Zustand (for state management)
- Vitest (for testing)

## Project Setup & Local Development

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
# git clone <YOUR_GIT_URL> # Replace with actual URL if known

# Step 2: Navigate to the project directory.
# cd <YOUR_PROJECT_NAME> # Replace with actual directory name

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Available Scripts

This project comes with several pre-configured npm scripts to help with development, testing, and building:

-   `npm run dev`: Starts the Vite development server with Hot Module Replacement (HMR). Ideal for local development.
-   `npm run build`: Builds the application for production deployment. Output is typically in the `dist/` directory.
-   `npm run build:dev`: Builds the application in development mode (useful for debugging build issues).
-   `npm run lint`: Runs ESLint to check for code quality and style issues across the project.
-   `npm run lint:fix`: Runs ESLint and attempts to automatically fix any identified issues.
-   `npm run preview`: Starts a local server to preview the production build from the `dist/` directory.
-   `npm run test`: Runs tests using Vitest.
-   `npm run test:ui`: Runs tests with the Vitest UI for interactive test management.
-   `npm run test:coverage`: Runs tests and generates a code coverage report.
-   `npm run test:watch`: Runs tests in watch mode, re-running on file changes.
-   `npm run type-check`: Runs the TypeScript compiler (`tsc`) to check for type errors without emitting JavaScript files.
-   `npm run format`: Formats all relevant source files using Prettier.
-   `npm run format:check`: Checks if all relevant source files are formatted correctly according to Prettier rules.
-   `npm run analyze`: Builds the project and then runs `vite-bundle-analyzer` to visualize the composition of the JavaScript bundles.

## Project Structure

A brief overview of the key directories within `src/`:

-   `src/components/`: Contains reusable UI components, further organized into:
    -   `src/components/game/`: Components specific to the N-Back game interface (setup, gameplay, results).
    -   `src/components/icons/`: Custom icon components.
    -   `src/components/stats/`: Components related to displaying game statistics.
    -   `src/components/ui/`: General-purpose UI elements, often from shadcn-ui.
-   `src/config/`: Application-level configuration settings.
-   `src/hooks/`: Custom React hooks, like `useNBackGame.ts` for game logic.
-   `src/layouts/`: Layout components for different parts of the application.
-   `src/lib/`: Utility functions and helper modules, like `gameUtils.ts`.
-   `src/pages/`: Top-level page components corresponding to application routes.
-   `src/router/`: Routing configuration (e.g., using React Router).
-   `src/services/`: Modules for interacting with external APIs or services (if any).
-   `src/stores/`: State management stores, like `settingsStore.ts` using Zustand.
-   `src/styles/`: Global styles and Tailwind CSS setup.
-   `src/test/`: Test setup files and utilities.
-   `src/utils/`: General utility functions not specific to a particular domain like `lib/gameUtils.ts`.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

Please ensure your code adheres to the project's linting and formatting standards by running `npm run lint` and `npm run format` before committing.

## Deployment

(Information about deployment can be added here if applicable, e.g., Vercel, Netlify, etc.)

---

*This README was last updated based on the project structure and scripts available at the time of generation.*
