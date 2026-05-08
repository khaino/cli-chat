export type Command =
  | { kind: 'list-users'; filter: 'all' | 'online' }
  | { kind: 'start-chat'; username: string }
  | { kind: 'help' }
  | { kind: 'exit' }
  | { kind: 'back' }
  | { kind: 'message'; content: string }
  | { kind: 'unknown'; raw: string }
  | { kind: 'noop' };

export function parseCommand(raw: string): Command {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { kind: 'noop' };

  if (!trimmed.startsWith('/')) {
    return { kind: 'message', content: trimmed };
  }

  if (trimmed === '/help') return { kind: 'help' };
  if (trimmed === '/exit') return { kind: 'exit' };
  if (trimmed === '/back') return { kind: 'back' };

  if (trimmed === '/users') return { kind: 'list-users', filter: 'all' };
  if (trimmed === '/users -o' || trimmed === '/users --online') {
    return { kind: 'list-users', filter: 'online' };
  }

  if (trimmed.startsWith('/user ')) {
    const username = trimmed.slice(6).trim();
    if (!username) return { kind: 'unknown', raw: trimmed };
    return { kind: 'start-chat', username };
  }

  return { kind: 'unknown', raw: trimmed };
}
