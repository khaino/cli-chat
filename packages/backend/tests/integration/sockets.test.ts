import type { AddressInfo } from 'net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import {
  SocketEvents,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type MessageWithSender,
} from '@cli-chat/shared';
import { createTestServer, type TestServer } from '../helpers/createTestServer.js';

type TypedClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

describe('Socket.IO event flow', () => {
  let server: TestServer;
  let port: number;
  let aliceId: string;
  let bobId: string;
  let chatId: string;

  beforeEach(async () => {
    server = createTestServer();
    aliceId = server.deps.userRepo.create({ username: 'alice', passwordHash: 'h' }).id;
    bobId = server.deps.userRepo.create({ username: 'bob', passwordHash: 'h' }).id;
    const start = server.deps.chatService.startPrivate(aliceId, bobId);
    if (!start.ok) throw new Error('chat setup failed');
    chatId = start.chat.id;

    await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
    port = (server.httpServer.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.io.close(() => resolve());
    });
    server.deps.db.close();
  });

  function connect(userId: string): Promise<TypedClient> {
    return new Promise((resolve) => {
      const socket: TypedClient = ioClient(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });
      socket.on('connect', () => {
        socket.emit(SocketEvents.UserJoin, userId);
        setTimeout(() => resolve(socket), 50);
      });
    });
  }

  test('message:send broadcasts message:receive to both participants', async () => {
    const a = await connect(aliceId);
    const b = await connect(bobId);

    const received: Promise<MessageWithSender> = new Promise((resolve) => {
      b.on(SocketEvents.MessageReceive, (msg) => resolve(msg));
    });

    a.emit(SocketEvents.MessageSend, {
      chatId,
      senderId: aliceId,
      content: 'hello bob',
    });

    const msg = await received;
    expect(msg.content).toBe('hello bob');
    expect(msg.sender_username).toBe('alice');

    a.close();
    b.close();
  });

  test('presence updates broadcast on connect/disconnect', async () => {
    const a = await connect(aliceId);

    const presence = new Promise<{ userId: string; online: boolean }>((resolve) => {
      a.on(SocketEvents.PresenceUpdate, (p) => resolve(p));
    });

    const b = await connect(bobId);
    const update = await presence;
    expect(update).toEqual({ userId: bobId, online: true });

    const offline = new Promise<{ userId: string; online: boolean }>((resolve) => {
      a.on(SocketEvents.PresenceUpdate, (p) => {
        if (!p.online) resolve(p);
      });
    });

    b.close();
    const offlineUpdate = await offline;
    expect(offlineUpdate).toEqual({ userId: bobId, online: false });

    a.close();
  });
});
