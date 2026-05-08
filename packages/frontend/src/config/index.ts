export interface FrontendConfig {
  apiUrl: string;
  socketUrl: string;
}

const DEFAULT_API_URL = 'http://localhost:3000';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): FrontendConfig {
  const apiUrl = env.CLI_CHAT_API_URL ?? DEFAULT_API_URL;
  const socketUrl = env.CLI_CHAT_SOCKET_URL ?? apiUrl;
  return { apiUrl, socketUrl };
}
