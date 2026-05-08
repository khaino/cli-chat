/** @type {import('jest').Config} */
export default {
  projects: [
    '<rootDir>/packages/backend',
    '<rootDir>/packages/frontend'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/backend/src/index.ts',
    '!packages/frontend/src/index.tsx'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
