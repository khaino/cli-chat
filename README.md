# CLI Chat

A real-time CLI chat application with a Text User Interface (TUI), structured as an npm-workspaces monorepo.

## Tech Stack

- **Database**: SQLite (better-sqlite3)
- **Backend**: Node.js with Express + Socket.IO
- **TUI Framework**: Ink (React for CLI)
- **Validation**: Zod
- **Language**: TypeScript

## Repository layout

```
cli-chat/
├── package.json                  # workspace root
├── tsconfig.base.json            # shared TS settings
├── jest.config.js                # multi-project Jest config
├── packages/
│   ├── shared/                   # @cli-chat/shared (types, socket contracts, zod schemas)
│   ├── backend/                  # @cli-chat/backend (Express + Socket.IO + SQLite)
│   └── frontend/                 # @cli-chat/frontend (Ink TUI)
└── README.md
```

Dependency direction: `frontend ──▶ shared ◀── backend`. The frontend and backend never import from each other.

### `shared/`
- Domain types (`SafeUser`, `Chat`, `Message`, `MessageWithSender`)
- HTTP request/response DTOs
- Socket.IO event names + typed contracts (`ClientToServerEvents`, `ServerToClientEvents`)
- Zod schemas for HTTP and socket payload validation
- API path constants

### `backend/`
Layered: `config → database (connection + repositories) → services (Auth, Chat, Presence) → server (createServer + routes + sockets) → entrypoint`. Routes are thin and call services; services are constructed with explicit dependencies, so tests can swap in an in-memory SQLite DB.

### `frontend/`
Pure presentational components driven by an `appReducer` and an `ApiClient` / `SocketClient` interface. Components never call `fetch` or talk to sockets directly; everything goes through the injected services so tests can pass in fakes.

## Installation

```bash
npm install
```

This installs all workspaces and links them together.

## Running

The backend (Express + Socket.IO) and the TUI (Ink fullscreen) need their own terminals.

### Development (fast: tsx, no compile step)

```bash
# Terminal 1 — backend on :3000
#   On the first run with an empty DB, you'll be prompted:
#   "Seed 5 dummy users into 'cli-chat.db'? [y/N]"
#   Default is N. Hit y to seed demo users; otherwise the server just starts.
npm run server:dev

# Wipe the SQLite DB and start fresh (re-prompts for seeding):
npm run server:dev --clear

# Terminal 2 — TUI client
npm run tui:dev
```

### Database utilities

```bash
# Seed 5 dummy users (prompts Y/N, default N)
npm run db:seed

# Seed without prompting (CI / scripts)
npm run db:seed -w @cli-chat/backend -- --yes

# Wipe the dev SQLite DB without starting the server
npm run db:clear
```

### Production (compiled JS via node)

```bash
# Terminal 1
npm run server:start

# Terminal 2
npm run tui:start
```

Both `:dev` and `:start` modes run the same code; `:dev` skips the frontend/backend compile step using `tsx`. See the table in this README for differences.

## Building

```bash
npm run build         # builds shared, backend, frontend in dependency order
npm run typecheck     # type-checks every package
```

## Testing

```bash
npm test              # runs all unit + integration tests across all packages
npm run test:coverage # with coverage report
```

Tests are organized as:
- `packages/*/tests/unit/` — pure unit tests (services, reducers, parsers, repositories on `:memory:` SQLite)
- `packages/*/tests/integration/` — Express via `supertest`, real Socket.IO over an ephemeral port, Ink components via `ink-testing-library`

## Configuration

All configuration is read from environment variables. See `.env.example` for the full list. Important ones:

| Variable | Default | Used by |
|---|---|---|
| `PORT` | `3000` | backend |
| `DB_PATH` | `cli-chat.db` | backend |
| `SALT_ROUNDS` | `10` | backend |
| `SEED_PASSWORD` | `password123` | backend (used only by `npm run db:seed`) |
| `LOG_LEVEL` | `info` | backend |
| `CORS_ORIGIN` | `*` | backend |
| `CLI_CHAT_API_URL` | `http://localhost:3000` | frontend |
| `CLI_CHAT_SOCKET_URL` | (falls back to API URL) | frontend |

## TUI Commands

In the main screen:

| Command | Description |
|---|---|
| `/users` | List all registered users |
| `/users -o` (or `--online`) | List online users only |
| `/user <username>` | Start a chat with the specified user |
| `/help` | Show available commands |
| `/exit` | Exit the application |

In a chat:

| Command | Description |
|---|---|
| `/back` (or `/exit`) | Return to main screen |
| Anything else | Sent as a chat message |

## Dummy users for development

The backend itself never seeds. Seeding is a separate developer tool:

- `npm run server:dev` chains `npm run db:seed` before starting the server.
- `db:seed` checks the `users` table:
  - **If non-empty** → silently skips (no prompt, no work).
  - **If empty** → asks `Seed 5 dummy users into 'cli-chat.db'? [y/N]`. Default is **N**.
- Hit Enter (or `n`) to skip; type `y` to seed.
- Pass `--yes` for non-interactive scripts: `npm run db:seed -- --yes`.
- In non-TTY environments (CI), the prompt is suppressed and the default (skip) applies.

So your daily flow is:

```bash
npm run server:dev          # silent on subsequent restarts
npm run server:dev --clear  # wipes DB; will re-prompt for seeding
```

In production (`npm run server:start`) seeding is impossible — there's no code path that calls `seedDummyUsers`.

When seeded, the following users are created (password configurable via `SEED_PASSWORD`):

| Username | Password |
|---|---|
| alice | password123 |
| bob | password123 |
| charlie | password123 |
| diana | password123 |
| edward | password123 |
