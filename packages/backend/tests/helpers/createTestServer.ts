import { createServer, type CreatedServer } from '../../src/server/createServer.js';
import { makeTestDeps, type TestDeps } from './makeTestDeps.js';

export interface TestServer extends CreatedServer {
  deps: TestDeps;
}

export function createTestServer(): TestServer {
  const deps = makeTestDeps();
  const server = createServer(deps);
  return { ...server, deps };
}
