/** @type {import('jest').Config} */
export default {
  displayName: 'backend',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
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
          isolatedModules: true
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
