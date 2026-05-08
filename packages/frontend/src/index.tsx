#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { loadConfig } from './config/index.js';
import { createHttpApiClient } from './services/apiClient.js';
import { createSocketClient } from './services/socketClient.js';
import { App } from './App.js';

const cfg = loadConfig();
const api = createHttpApiClient({ baseUrl: cfg.apiUrl });
const socket = createSocketClient(cfg.socketUrl);

render(<App api={api} socket={socket} />);
