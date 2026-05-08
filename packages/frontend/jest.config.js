/** @type {import('jest').Config} */
export default {
  displayName: 'frontend',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          target: 'ES2020',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          isolatedModules: true,
          jsx: 'react-jsx'
        }
      }
    ]
  },
  moduleNameMapper: {
    '^@cli-chat/shared$': '<rootDir>/../shared/src/index.ts',
    '^@cli-chat/shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
