import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {

    environment: 'jsdom', 
    
    coverage: {
      provider: 'v8', // o 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
    
    globals: true,
    include: ['**/*.spec.ts', '**/*.e2e-spec.ts'], 
  },
});