import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// This config tells ESLint how to check the React code for common mistakes.
export default defineConfig([
  // This block ignores the generated production build folder.
  globalIgnores(['dist']),
  {
    // This block applies the rules below to JavaScript and JSX files.
    files: ['**/*.{js,jsx}'],
    // These presets enable recommended JS, React Hooks, and Vite refresh rules.
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    // This block tells ESLint the code runs in a browser and can contain JSX.
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
