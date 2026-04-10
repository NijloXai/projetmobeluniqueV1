import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          setupFiles: ['./src/__tests__/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          setupFiles: ['./src/__tests__/integration/setup.ts'],
          include: ['src/**/*.integration.test.ts'],
          // Desactiver le parallelisme pour les tests d'integration (ordre FK, état partagé)
          poolOptions: {
            forks: { singleFork: true },
          },
          testTimeout: 30000,
        },
      },
    ],
  },
})
