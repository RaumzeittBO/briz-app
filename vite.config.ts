import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import process from 'node:process'
import { resolveFirebaseRuntimeConfig } from './src/lib/firebaseConfig'

export default defineConfig(({ mode }) => {
  const deploymentEnvironment = process.env.VERCEL_ENV ?? 'local'
  if (deploymentEnvironment !== 'local') {
    // Refuse to publish a Vercel artifact with missing or cross-environment Firebase settings.
    // VERCEL_ENV is available at build time and is also embedded for a runtime guard.
    resolveFirebaseRuntimeConfig(loadEnv(mode, process.cwd(), 'VITE_'), deploymentEnvironment, mode)
  }

  return {
    define: {
      __BRIZ_DEPLOYMENT_ENV__: JSON.stringify(deploymentEnvironment),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
