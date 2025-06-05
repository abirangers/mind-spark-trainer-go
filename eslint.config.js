import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import vitestPlugin from "eslint-plugin-vitest";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      "import": importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: { // Required for eslint-plugin-import with TypeScript
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules, // Ensure TS recommended rules are included
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules, // Add jsx-a11y recommended rules
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/explicit-function-return-type": "warn", // Changed from "off"
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "prefer-const": "error",
      // Import plugin rules
      "import/order": [
        "warn",
        {
          "groups": ["builtin", "external", "internal", "type", ["parent", "sibling", "index"]],
          "newlines-between": "always",
          "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
      ],
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",
      "import/namespace": "error",
      "import/no-duplicates": "warn",
      // General good rules
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
    },
  },
  {
    files: ["*.config.{js,ts}", "vite.config.ts", "tailwind.config.ts"], // Keep existing overrides for config files
    languageOptions: { // Ensure config files can use CommonJS if needed, or specific globals
        globals: {
            ...globals.node, // Node.js globals
            // module: true, // if using module.exports
            // require: true, // if using require
        }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off", // Example, if these files use require
      "@typescript-eslint/no-var-requires": "off", // if these files use require
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"], // Keep existing override for UI components
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Configuration for Vitest test files
  {
    files: ["**/*.test.{ts,tsx}", "src/test/setup.ts"],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "vitest/no-focused-tests": ["error", { "fixable": true }],
      "vitest/no-disabled-tests": "warn",
    },
    languageOptions: {
      globals: {
        ...globals.node, // Or specific test environment globals
        // Vitest globals like describe, it, expect are often auto-provided or recognized by the plugin
      }
    }
  }
);
