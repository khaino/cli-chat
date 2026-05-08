import { parseCommand, type Command } from '../../../src/commands/parseCommand.js';

describe('parseCommand', () => {
  test.each<[string, Command]>([
    ['/users', { kind: 'list-users', filter: 'all' }],
    ['/users -o', { kind: 'list-users', filter: 'online' }],
    ['/users --online', { kind: 'list-users', filter: 'online' }],
    ['/user alice', { kind: 'start-chat', username: 'alice' }],
    ['/user   bob  ', { kind: 'start-chat', username: 'bob' }],
    ['/help', { kind: 'help' }],
    ['/exit', { kind: 'exit' }],
    ['/back', { kind: 'back' }],
    ['hello there', { kind: 'message', content: 'hello there' }],
    ['  hi  ', { kind: 'message', content: 'hi' }],
    ['', { kind: 'noop' }],
    ['   ', { kind: 'noop' }],
    ['/junk', { kind: 'unknown', raw: '/junk' }],
    ['/user', { kind: 'unknown', raw: '/user' }],
    ['/user ', { kind: 'unknown', raw: '/user' }],
  ])('parseCommand(%j) -> %j', (input, expected) => {
    expect(parseCommand(input)).toEqual(expected);
  });
});
