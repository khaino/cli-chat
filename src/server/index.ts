import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getUserByUsername, getAllUsers, getOrCreatePrivateChat, createMessage, getChatMessages, initializeDatabase, getChatParticipants, getUserById } from '../database/index.js';
import { verifyPassword } from '../utils/password.js';
import type { SafeUser, LoginRequest, LoginResponse, MessageWithSender } from '../types/index.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());

// Store connected users
const connectedUsers = new Map<string, string>(); // userId -> socketId

// Initialize database on startup
initializeDatabase().catch(console.error);

// API Routes

// Login endpoint
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;
    
    if (!username || !password) {
      const response: LoginResponse = {
        success: false,
        error: 'Username and password are required'
      };
      return res.status(400).json(response);
    }
    
    const user = getUserByUsername(username);
    
    if (!user) {
      const response: LoginResponse = {
        success: false,
        error: 'Invalid username or password'
      };
      return res.status(401).json(response);
    }
    
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      const response: LoginResponse = {
        success: false,
        error: 'Invalid username or password'
      };
      return res.status(401).json(response);
    }
    
    const safeUser: SafeUser = {
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    const response: LoginResponse = {
      success: true,
      user: safeUser
    };
    
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all users
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const onlineOnly = req.query.online === 'true';
    const users = getAllUsers();
    const usersWithStatus = users.map((user) => ({
      ...user,
      online: connectedUsers.has(user.id)
    }));
    const filteredUsers = onlineOnly
      ? usersWithStatus.filter((user) => user.online)
      : usersWithStatus;

    res.json({ success: true, users: filteredUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get or create chat with user
app.post('/api/chat/start', (req: Request, res: Response) => {
  try {
    const { currentUserId, targetUserId } = req.body;
    
    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ success: false, error: 'Both user IDs are required' });
    }
    
    const chat = getOrCreatePrivateChat(currentUserId, targetUserId);
    const participants = getChatParticipants(chat.id).map((participant) => ({
      ...participant,
      online: connectedUsers.has(participant.id)
    }));
    const messages = getChatMessages(chat.id);
    
    res.json({ 
      success: true, 
      chat,
      participants,
      messages
    });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get chat messages
app.get('/api/chat/:chatId/messages', (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const messages = getChatMessages(chatId);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User joins with their user ID
  socket.on('user:join', (userId: string) => {
    connectedUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    socket.broadcast.emit('presence:update', { userId, online: true });
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });
  
  // User sends a message
  socket.on('message:send', (data: { chatId: string; senderId: string; content: string }) => {
    const { chatId, senderId, content } = data;
    
    // Save message to database
    const message = createMessage(chatId, senderId, content);
    
    // Get sender username
    const user = getUserById(senderId);
    const senderUsername = user?.username || 'Unknown';
    
    const messageWithSender: MessageWithSender = {
      ...message,
      sender_username: senderUsername
    };
    
    // Get chat participants and emit to them
    const participants = getChatParticipants(chatId);
    participants.forEach((participant) => {
      socket.to(`user:${participant.id}`).emit('message:receive', messageWithSender);
    });
    
    // Also emit back to sender
    socket.emit('message:receive', messageWithSender);
  });
  
  // User starts typing
  socket.on('typing:start', (data: { chatId: string; userId: string }) => {
    const participants = getChatParticipants(data.chatId);
    participants.forEach((participant) => {
      if (participant.id !== data.userId) {
        socket.to(`user:${participant.id}`).emit('typing:indicator', { userId: data.userId });
      }
    });
  });
  
  // User stops typing
  socket.on('typing:stop', (data: { chatId: string; userId: string }) => {
    const participants = getChatParticipants(data.chatId);
    participants.forEach((participant) => {
      if (participant.id !== data.userId) {
        socket.to(`user:${participant.id}`).emit('typing:stopped', { userId: data.userId });
      }
    });
  });
  
  socket.on('disconnect', () => {
    // Remove user from connected users
    connectedUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        socket.broadcast.emit('presence:update', { userId, online: false });
        console.log(`User ${userId} disconnected`);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;

export function startServer(): void {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const isDirectRun = import.meta.url === new URL(process.argv[1], 'file:').href;
if (isDirectRun) {
  startServer();
}

export { app, httpServer, io };
