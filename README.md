# CLI Chat

A real-time CLI chat application with a Text User Interface (TUI) built using Ink (React for CLI).

## Tech Stack

- **Database**: SQLite (better-sqlite3)
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO
- **TUI Framework**: Ink (React for CLI)
- **Language**: TypeScript

## Project Structure

```
cli-chat/
├── src/
│   ├── database/           # Database layer
│   │   ├── index.ts        # Database operations
│   │   └── schema.ts       # SQL schema definitions
│   ├── server/             # Express server
│   │   └── index.ts        # API endpoints & Socket.IO handlers
│   ├── tui/                # Terminal User Interface
│   │   ├── components/     # Ink components
│   │   │   ├── Login.tsx   # Login screen
│   │   │   ├── MainScreen.tsx  # Main chat interface
│   │   │   └── ChatScreen.tsx  # Chat conversation view
│   │   ├── api.ts          # API client functions
│   │   └── index.tsx       # App entry point
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── utils/              # Utility functions
│       └── password.ts     # Password hashing utilities
├── tests/                  # Unit tests
│   ├── database.test.ts
│   ├── password.test.ts
│   └── api.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| username | TEXT | Unique username |
| password | TEXT | Bcrypt hashed password |
| created_at | TEXT | Creation timestamp |
| updated_at | TEXT | Last update timestamp |

### Chats Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| created_at | TEXT | Creation timestamp |

### ChatParticipants Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| chat_id | TEXT | Foreign key to chats |
| user_id | TEXT | Foreign key to users |
| created_at | TEXT | Creation timestamp |

### Messages Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| chat_id | TEXT | Foreign key to chats |
| content | TEXT | Message content |
| sender_id | TEXT | Foreign key to users |
| created_at | TEXT | Creation timestamp |

## API Design

### Authentication

#### POST /api/login
Login with username and password.

**Request Body:**
```json
{
  "username": "alice",
  "password": "password123"
}
```

**Success Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-001",
    "username": "alice",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

### Users

#### GET /api/users
Get all registered users.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-001",
      "username": "alice",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Chats

#### POST /api/chat/start
Start or retrieve a chat with another user.

**Request Body:**
```json
{
  "currentUserId": "user-001",
  "targetUserId": "user-002"
}
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat-001",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "participants": [...],
  "messages": [...]
}
```

#### GET /api/chat/:chatId/messages
Get all messages for a chat.

### Socket.IO Events

#### Client → Server
- `user:join` - Join with user ID
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator

#### Server → Client
- `message:receive` - Receive a new message
- `typing:indicator` - Other user is typing
- `typing:stopped` - Other user stopped typing

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd cli-chat

# Install dependencies
npm install

# Build the project
npm run build
```

## Running the Application

### Start the Server
```bash
npm run start:server
```
The server will start on port 3000 by default.

### Start the TUI Client
```bash
npm run start:tui
```
Or, if installed globally:
```bash
cli-chat
```

### Development Mode
```bash
# Run TUI in development mode
npm run dev
```

## Dummy User Credentials

The application comes pre-seeded with five dummy users for testing:

| Username | Password |
|----------|----------|
| alice | password123 |
| bob | password123 |
| charlie | password123 |
| diana | password123 |
| edward | password123 |

## TUI Commands

Once logged in, the following commands are available:

| Command | Description |
|---------|-------------|
| `/users` | List all registered users |
| `/user <username>` | Start a chat with the specified user |
| `/help` | Show available commands |
| `/exit` | Exit the application |

In a chat:
| Command | Description |
|---------|-------------|
| `/back` | Return to main screen |
| Type message | Send a message |

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Architecture

### Authentication Flow

1. User runs `cli-chat` command
2. TUI displays login screen asking for username/password
3. Credentials are sent to `/api/login` endpoint
4. On success, user is taken to main screen
5. On failure, error is shown with options to retry or exit

### Real-time Messaging

1. When a user starts a chat via `/user <username>`, a Socket.IO connection is established
2. The user joins their personal room (`user:<userId>`)
3. Messages are sent via `message:send` event
4. Messages are received via `message:receive` event
5. All messages are persisted in SQLite database

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Building
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

## License

MIT
