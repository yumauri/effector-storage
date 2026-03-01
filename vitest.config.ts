import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    typecheck: {
      enabled: true,
      include: ['tests/**/*.test-d.ts'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts'],
      exclude: ['src/types*.ts'],
    },
  },
})
