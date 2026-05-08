import React from 'react';
import { jest } from '@jest/globals';
import { render } from 'ink-testing-library';
import { Login } from '../../src/components/Login.js';
import { createFakeApiClient } from '../helpers/fakes.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('<Login />', () => {
  test('initial render shows the title and username prompt', () => {
    const api = createFakeApiClient({});
    const onLogin = jest.fn();
    const onExit = jest.fn();

    const { lastFrame } = render(
      <Login api={api} onLogin={onLogin} onExit={onExit} />
    );

    const frame = lastFrame() ?? '';
    expect(frame).toContain('CLI Chat - Login');
    expect(frame).toContain('Enter username:');
  });

  test('typing a username appears in the rendered output', async () => {
    const api = createFakeApiClient({});
    const onLogin = jest.fn();
    const onExit = jest.fn();

    const { stdin, lastFrame } = render(
      <Login api={api} onLogin={onLogin} onExit={onExit} />
    );

    stdin.write('alice');
    await delay(20);

    expect(lastFrame() ?? '').toContain('alice');
    expect(onLogin).not.toHaveBeenCalled();
  });
});
