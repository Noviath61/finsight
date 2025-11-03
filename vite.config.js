import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // Import the plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ // Add the plugin here
      // This plugin automatically handles the 'events' module and others.
      protocolImports: true,
    }),
  ],
})