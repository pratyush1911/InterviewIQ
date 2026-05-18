import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// This config tells Vite how to build and run the React frontend.
export default defineConfig({
  // This plugin lets Vite understand React JSX files like Login.jsx and Dashboard.jsx.
  plugins: [react()],
})
