export const SocketEvents = {
  UserJoin: 'user:join',
  MessageSend: 'message:send',
  MessageReceive: 'message:receive',
  PresenceUpdate: 'presence:update',
  TypingStart: 'typing:start',
  TypingStop: 'typing:stop',
  TypingIndicator: 'typing:indicator',
  TypingStopped: 'typing:stopped',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
