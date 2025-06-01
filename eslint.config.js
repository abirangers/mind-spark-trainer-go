import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginPrettier from "eslint-plugin-prettier"; // Added
import eslintConfigPrettier from "eslint-config-prettier"; // Added

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // ...tseslint.configs.stylistic, // Optional: if you use stylistic rules from typescript-eslint

  // Original React specific config object (or create one if not existing)
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    plugins: {
      "react-hooks": eslintPluginReactHooks,
      "react-refresh": eslintPluginReactRefresh,
      prettier: eslintPluginPrettier, // Added prettier plugin
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "prettier/prettier": "error", // Added prettier rule
      // Add any other project-specific rules here
      // e.g., "@typescript-eslint/no-unused-vars": "warn"
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
  },

  // Configuration for ignoring files (if needed, often in .eslintignore)
  {
    ignores: [
      "dist/",
      "node_modules/",
      "coverage/",
      "eslint.config.js", // Often good to ignore the config itself from certain rules
      ".*.cjs", // Example: ignore dotfiles ending in .cjs
      "vite.config.ts",
      "postcss.config.js",
      "tailwind.config.ts",
    ],
  },

  // Add eslint-config-prettier as the last configuration object
  // This turns off ESLint rules that might conflict with Prettier
  eslintConfigPrettier
);
