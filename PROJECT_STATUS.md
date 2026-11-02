# DevNest — Project Status & Architecture Guide

> **Current Status:** Milestones 0, 1, 2, 3 & 4 Complete • Milestone 5 Next (Execution Console and Telemetry)  
> **Last Verified:** November 2, 2026  
> **Branch:** `main` (M3 and M4 changes unstaged — do not commit secrets)

---

## 1. Project Overview

**DevNest** is a browser-based collaborative coding workspace designed for multi-language code execution, automated testing, and real-time collaboration.

### Core Purpose & Intended Users
The platform enables developers, students, and teams to write code, organize hierarchical project files, execute programs in a secure isolated environment via a backend proxy, inspect rich runtime telemetry, and collaborate in real time without local toolchain installation.

### Key Capabilities

- **In-Browser Code Editing (Completed - M1):** High-fidelity multi-language code editing powered by Monaco Editor with syntax highlighting (JavaScript, Python, C++, Java), multi-tab switching, unsaved dirty tracking, and language boilerplate templates.
- **Hierarchical Project & File Management (Completed - M3):** Recursive file/folder tree management supporting create, rename, delete, and directory nesting, backed by MongoDB Atlas with strict owner authorization to prevent IDOR attacks.
- **User Authentication & Session Management (Completed - M2):** Registration and login with client validation, show/hide password, demo auto-fill, and session restoration via secure HTTP-only JWT cookies.
- **Sandboxed Code Execution Pipeline (Completed - M4):** Secure remote compilation and sandboxed execution via **OnlineCompiler.io** supporting JavaScript (Node.js 24), Python (3.14), C++ (G++ 15), and Java (OpenJDK 25). All execution requests route through the Express backend (`POST /api/execute`) with server-side API key management, language allowlisting, source code size limits, execution timeout ceilings, and per-user rate limiting.
- **Execution Console & Telemetry (Planned - M5):** Real-time stdout and stderr output streaming, exit code tracking, CPU execution duration, and peak memory usage metrics in a collapsible bottom panel.
- **Live Collaboration (Planned - M8):** Multi-user real-time collaborative editing on shared projects using Yjs CRDTs and WebSockets. Architecture incorporates room authorization, participant presence awareness, shared file explorer, stable file IDs with per-file synchronized documents, and reconnection handling.
- **Automated Testing & Security (Planned - M6):** Comprehensive test suites expanding upon current 63/63 server tests to cover client components, end-to-end integration, and security audits.
- **Production Readiness & Deployment (Planned - M7):** Containerized or cloud production hosting on Vercel (Client SPA) and Render (Backend API Service) with automated CI/CD pipelines.

### Overall Target Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │                 Client SPA                   │
                  │   React 18 + TypeScript + Vite + Tailwind    │
                  │       (Monaco Editor + Yjs Client)           │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTP / REST & WebSockets
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │              Backend REST API                │
                  │           Node.js + Express + TS             │
                  │    (Auth, Project Service, WS Collab)        │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌─────────────────────────────┐  ┌─────────────────────────────┐
  │      MongoDB Atlas          │  │     OnlineCompiler.io       │
  │  (Auth, Projects, Files)    │  │  (Sandboxed Code Execution) │
  │  [Mongoose 9.x Models]      │  │  [Server-Side Secret Only]  │
  └─────────────────────────────┘  └─────────────────────────────┘
                 ▲                               ▲
                 └───────────────┬───────────────┘
                                 │
                  ┌──────────────────────────────┐
                  │       @devnest/shared        │
                  │ (Types, Contracts, Constants)│
                  └──────────────────────────────┘
```

---

## 2. Technology Stack

### Implemented Technologies (Verified in Repository)

| Layer | Technology | Version | Purpose in Codebase |
|---|---|---|---|
| **Monorepo Management** | npm Workspaces | npm `11.9.0` (Node `v24.14.0`) | Coordinates multi-package repository (`shared`, `server`, `client`) |
| **Orchestration** | Concurrently | `^8.2.2` | Runs server and client dev servers in parallel via `npm run dev` |
| **Language** | TypeScript | `^5.5.4` | Strict static typing across all workspaces |
| **Shared Contracts** | `@devnest/shared` | Internal Workspace | Exports execution interfaces, language configurations, and project DTOs |
| **Backend Runtime** | Node.js | `>= 20.x` (verified `v24.14.0`) | JavaScript/TypeScript server runtime |
| **Backend Framework** | Express | `^4.19.2` | REST API framework (`server/src/server.ts`) |
| **Backend Utilities** | CORS, Cookie-Parser, Dotenv, TSX | `cors: ^2.8.5`, `cookie-parser: ^1.4.7`, `dotenv: ^16.4.5`, `tsx: ^4.19.0` | Cookie handling, CORS origin check, env config, dev TS execution |
| **Database & ODM** | MongoDB Atlas / Mongoose | `mongoose: ^9.11.3` | User and Project persistence; recursive `FileNode` sub-documents; owner indexing |
| **Authentication & Security** | JWT, bcryptjs, express-rate-limit | `jsonwebtoken: ^9.0.3`, `bcryptjs: ^3.0.3`, `express-rate-limit: ^8.7.1` | HTTP-only cookie auth, password hashing, auth route brute-force protection |
| **Validation** | Zod | `zod: ^4.6.7` | Auth schemas, project CRUD validators, recursive file-tree validation |
| **Frontend Framework** | React & React DOM | `^18.3.1` | User interface library |
| **Frontend Bundler** | Vite | `^5.4.2` (`@vitejs/plugin-react: ^4.3.1`) | Rapid HMR dev server and production bundler |
| **Frontend Styling** | Tailwind CSS & PostCSS | `tailwindcss: ^3.4.10`, `postcss: ^8.4.41`, `autoprefixer: ^10.4.20` | Utility-first styling with custom dark theme palette |
| **Code Editor** | Monaco Editor | `@monaco-editor/react: ^4.7.0` | In-browser editor with multi-tab support, syntax highlighting, and dirty tracking |
| **UI Iconography** | Lucide React | `lucide-react: ^1.61.0` | Modern SVG icons across workspace, file tree, and dashboard |
| **Testing Suite (Server)** | Vitest & Supertest | `vitest: ^2.1.8`, `supertest: ^7.3.1` | 89 unit & route integration tests passing (auth, project, execution services) |
| **Code Execution Pipeline** | OnlineCompiler.io | Native REST API (`/api/run-code-sync/`) | Sandboxed remote execution proxied via Express backend (`POST /api/execute`) |

### Planned Technologies (Scheduled for Later Milestones)

| Layer | Planned Technology | Intended Purpose | Target Milestone |
|---|---|---|---|
| **Execution Telemetry** | Custom/Monaco Output Console | Display execution time, peak memory, exit codes, and stdout/stderr streams | Milestone 5 |
| **Live Collaboration** | Yjs, WebSockets | CRDT-based concurrent editing, participant presence, and multi-file document sync | Milestone 8 |
| **Automated Testing** | Vitest, React Testing Library, Supertest | Full-coverage frontend and backend integration testing | Milestone 6 |
| **Production Deployment** | Vercel (Client) & Render (Server) | Production cloud hosting, environment configuration, and CI/CD pipelines | Milestone 7 |

---

## 3. Repository Structure

```
DevNest/
├── .env.example              # Root template for shared environment variables
├── .gitignore                # Git ignore rules (node_modules, dist, env files)
├── PROJECT_STATUS.md         # Single source of truth for implementation state & roadmap
├── README.md                 # Developer setup and onboarding guide
├── package.json              # Monorepo root manifest configuring npm workspaces & orchestrator
├── package-lock.json         # Lockfile for root and workspace dependency graph
│
├── client/                   # Frontend Single Page Application
│   ├── .env.example          # Client environment template (VITE_API_URL)
│   ├── dist/                 # Production build output generated by Vite
│   ├── index.html            # Main HTML entry point configuring dark mode root
│   ├── package.json          # Client dependencies (React, Vite, Tailwind CSS, Monaco, Lucide)
│   ├── postcss.config.js     # PostCSS configuration for Tailwind CSS
│   ├── tailwind.config.ts    # Tailwind theme extension (brand colors, slate dark shades)
│   ├── tsconfig.json         # TypeScript client compiler configuration (bundler resolution)
│   ├── tsconfig.node.json    # TypeScript compiler configuration for Vite config
│   ├── vite.config.ts        # Vite configuration (React plugin, path aliases, /api reverse proxy)
│   └── src/
│       ├── App.tsx           # Main application router and view switcher
│       ├── index.css         # Tailwind directives, custom scrollbars, and dark theme
│       ├── main.tsx          # React 18 DOM mount point
│       ├── context/
│       │   └── AuthContext.tsx # React Context managing auth state, login, signup, logout
│       ├── data/
│       │   └── mockData.ts   # Seed data (Demo user, multi-file C++/Python/JS projects)
│       ├── services/
│       │   ├── authApi.ts            # Client HTTP service for auth endpoints (/api/auth)
│       │   ├── projectApi.ts         # Client HTTP service for project CRUD and file tree (/api/projects)
│       │   ├── executionApi.ts       # Client HTTP service for code execution (/api/execute)
│       │   ├── mockAuthService.ts    # Legacy mock authentication service
│       │   └── mockProjectService.ts # In-memory file-tree helper utilities (pure tree operations)
│       ├── types/
│       │   ├── auth.ts       # User, LoginCredentials, SignUpCredentials interfaces
│       │   ├── files.ts      # FileNode (hierarchical tree), OpenTab, EditorCursorPosition
│       │   ├── ide.ts        # BottomPanelTab ('output'|'problems'|'terminal'), ToastMessage
│       │   └── project.ts    # WorkspaceProject, CreateProjectForm, ProjectMetadata
│       └── components/
│           ├── auth/
│           │   ├── LoginPage.tsx   # Login page with validation, demo autofill, show/hide password
│           │   └── SignUpPage.tsx  # Sign Up page with password confirmation & validation
│           ├── common/
│           │   └── Toast.tsx       # Non-intrusive floating notification toasts
│           ├── dashboard/
│           │   ├── CreateProjectModal.tsx # Dialog to initialize a new project
│           │   ├── DashboardHeader.tsx    # Header with user menu, avatar, and logout
│           │   ├── DashboardPage.tsx      # Main dashboard with search, project cards, and empty states
│           │   ├── DeleteConfirmModal.tsx # Confirmation modal for project deletion
│           │   ├── ProjectCard.tsx        # Project card with language badge, date, actions
│           │   └── RenameProjectModal.tsx # Dialog to rename existing projects
│           └── workspace/
│               ├── BottomPanel.tsx       # Collapsible panel with Output, Problems, and Terminal tabs
│               ├── CreateItemModal.tsx   # Dialog to add new files or folders to file tree
│               ├── EditorTabs.tsx        # Multi-tab bar with dirty indicators and close confirmation
│               ├── FileTreeNode.tsx      # Recursive tree node with file-type icons & inline actions
│               ├── MonacoEditorPane.tsx  # Monaco Editor integration with cursor listener & resize
│               ├── RunNoticeModal.tsx    # Dialog explaining sandboxed code execution status
│               ├── Sidebar.tsx           # Collapsible Explorer sidebar with file/folder actions
│               ├── StatusBar.tsx         # Bottom status bar with line/col, encoding, and language
│               ├── TopToolbar.tsx        # IDE header with Run button, save status, language picker
│               └── WorkspacePage.tsx     # Full IDE workspace layout coordinator
│
├── server/                   # Backend REST API Service
│   ├── .env.example          # PORT, CLIENT_ORIGIN, MONGODB_URI, JWT_SECRET, ONLINECOMPILER_API_KEY
│   ├── vitest.config.ts      # Vitest config for unit/route tests
│   ├── package.json          # Express, Mongoose, JWT, bcrypt, Zod, Vitest, Supertest
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts         # Express app: CORS+cookies, /api/auth, /api/projects, /api/execute, /api/health
│       ├── config/           # env.ts, db.ts, dns.ts (Windows c-ares SRV workaround)
│       ├── models/           # User.ts, Project.ts (recursive FileNode schema)
│       ├── controllers/      # auth.controller.ts, project.controller.ts, execution.controller.ts
│       ├── middleware/       # auth.ts (requireAuth), executionRateLimiter.ts
│       ├── routes/           # auth.routes.ts, project.routes.ts, execution.routes.ts
│       ├── services/         # auth.service.ts, project.service.ts, execution.service.ts
│       ├── validators/       # auth.validator.ts, project.validator.ts, execution.validator.ts
│       └── tests/            # auth, project, execution unit and route Vitest suites
│
└── shared/                   # Shared TypeScript Library (@devnest/shared)
    ├── dist/                 # Compiled declarations (.d.ts) and JS bundle
    ├── package.json          # Shared package manifest targeting dist/
    ├── tsconfig.json         # TypeScript configuration with declaration emit enabled
    └── src/
        ├── index.ts          # Barrel export for shared types
        └── types/
            ├── execution.ts  # Types: ExecutionRequest, ExecutionTelemetry, ExecutionResult
            ├── language.ts   # SupportedLanguage ('javascript'|'python'|'cpp'|'java'), compilerId, templates
            └── project.ts    # Types: Project, ProjectFile, CreateProjectDTO, UpdateProjectDTO
```

---

## 4. Milestone Tracker & Roadmap

The development roadmap is organized into sequentially executed milestones:

| Milestone | Title | Status | Scope & Implementation Summary |
|---|---|---|---|
| **Milestone 0** | Monorepo Scaffolding | **Completed** | Full npm workspaces configuration (`shared`, `server`, `client`); `@devnest/shared` builds cleanly and is imported by both `client` and `server`; `server/src/server.ts` exposes `/api/health`; `client` proxies to `/api/health`; `npm.cmd run typecheck` and `npm.cmd run build` pass with 0 errors. |
| **Milestone 1** | Frontend UI Prototype | **Completed** | Complete interactive frontend prototype: Login and Sign Up flows with client validation, show/hide password, and demo auto-fill; session persistence via `AuthContext` and `mockAuthService`; Project Dashboard with real-time search, project creation, renaming, and deletion; full IDE Workspace with collapsible Explorer, recursive file/folder tree (`main.cpp`, `utils.cpp`, `utils.h`, `script.py`, `README.md`), Monaco Editor integration with multi-tabs, dirty-file tracking, `Ctrl+S` save, collapsible Output/Problems/Terminal bottom panel, real-time status bar with live cursor line/column, and Run button status notice. Verified by clean typecheck and production build. |
| **Milestone 2** | Database Integration & Authentication | **Completed** | MongoDB Atlas connected via Mongoose; `User` model with secure bcrypt password hashing; JWT in HTTP-only cookies; `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`; Zod auth validators; rate limiting on auth routes; client `authApi` + `AuthContext` session restore on application mount. Auth Vitest suite: 26/26 tests passing. |
| **Milestone 3** | Project & File Management APIs | **Completed** | `Project` Mongoose model with recursive `FileNode` sub-document schema; `ProjectService` with strict ownership checks preventing Insecure Direct Object References (IDOR); `/api/projects` CRUD endpoints and `/api/projects/:id/files` + `/api/projects/:id/language` routes protected by `requireAuth`; Zod request payload validators; real `projectApiService` client integrated into `DashboardPage` and `WorkspacePage`; pure in-memory tree helpers retained in `mockProjectService.ts`; server Vitest test suite expanded to 63/63 passing tests (37 project unit & route tests). |
| **Milestone 4** | Code Execution Pipeline | **Completed** | Sandboxed multi-language remote compilation and execution via OnlineCompiler.io. Dedicated backend execution service (`ExecutionService`) and authenticated route `POST /api/execute`; server-side `ONLINECOMPILER_API_KEY` configuration; language allowlisting (`javascript`, `python`, `cpp`, `java`); source code size limits (100KB) and stdin limits (50KB); execution timeout with AbortController (15s ceiling); per-user rate limiting (`executionRateLimiter`, 20 req/min); project ownership verification (IDOR prevention); normalized `ExecutionResult` contract; client `executionApi` integration wiring the Run button with loading spinner, auto-save, and formatted Output panel logs; 26 Vitest tests passing with mocked provider (89/89 tests total across server suite). |
| **Milestone 5** | Execution Console & Telemetry | **Planned** | Real telemetry integration: streaming stdout and stderr output, recording execution duration, peak memory usage, and exit codes; live display in the collapsible BottomPanel Output tab. |
| **Milestone 8** | Live Collaboration | **Planned** | Real-time multi-user collaborative workspace: shared project editing powered by Monaco Editor, Yjs (CRDT synchronization engine), and WebSockets. Phased delivery starting with single-file synchronization and expanding to multiple files within a shared project. Features include participant presence (cursors, user colors), a shared synchronized file explorer, stable file IDs with a separate collaborative document per file, room authorization, automatic reconnection handling, and document persistence to MongoDB. |
| **Milestone 6** | Testing & Security | **Planned** | Comprehensive monorepo test coverage: expanding unit, integration, and UI testing across packages (Vitest, Supertest, React Testing Library); security validation, CSRF verification, rate-limit stress tests, and sanitization checks. |
| **Milestone 7** | Production Readiness & Deployment | **Planned** | Production build optimization, containerization/PaaS deployment on Vercel (Client SPA) and Render (Backend API Service), automated CI/CD pipeline triggers, and production environment secret configuration. |

---

## 5. Implemented Features

### Working Features (Verified by Execution & Code Inspection)

- **Authentication UI & Session Management (Completed - M2):**
  - Polished Login and Sign Up pages styled with subtle dark-theme ambient glows and DevNest branding.
  - Client-side validation: email formatting, required fields, minimum password length (>= 6 chars), password matching on sign-up.
  - Show/hide password visibility toggle buttons.
  - "Auto Fill" quick demo button for one-click access using `demo@devnest.io` / `password123`.
  - Client route protection: unauthenticated users cannot access dashboard or workspace; authenticated users are automatically redirected to dashboard from login/sign-up.
  - Real backend auth via `authApi` (HTTP-only JWT cookie; session restore through `GET /api/auth/me`).
- **Project Dashboard (Completed - M1 & M3):**
  - Welcome banner personalizing the view with the active authenticated user's name.
  - Real-time search filter querying projects by title, language, or description.
  - Project cards displaying language badges, last modified dates, and action menus (Open, Rename, Delete).
  - Create New Project dialog with title, description, and primary language selector.
  - Rename Project dialog with input validation and instant state updates.
  - Delete Project confirmation dialog with cancellation safeguards.
  - Empty states for zero projects and zero search results.
  - Real backend persistence via `projectApiService` calling `/api/projects`.
- **IDE Workspace & File Management (Completed - M1 & M3):**
  - Multi-pane dark-themed IDE layout.
  - Collapsible Explorer sidebar with recursive file and folder tree navigation.
  - Full CRUD operations on files and folders: create, inline rename, delete, and folder nesting.
  - File-type icons distinguishing C++, Python, JavaScript, TypeScript, Markdown, and directories.
  - Persistent synchronization with MongoDB Atlas via `PUT /api/projects/:id/files`.
- **Monaco Code Editor Integration (Completed - M1):**
  - High-fidelity editor powered by `@monaco-editor/react` with `vs-dark` theme and `automaticLayout: true`.
  - Multi-tab management: opening files, switching active tabs, and closing tabs.
  - Independent in-memory content tracking per file.
  - Syntax highlighting dynamically mapped from file extensions (C++, Python, JS, Markdown, etc.).
  - Unsaved-changes tracking: amber dirty dot on tab and top toolbar when modified.
  - Dirty-close confirmation dialog preventing accidental loss of unsaved edits.
  - `Ctrl+S` / `Cmd+S` keyboard shortcut and toolbar Save button to persist file changes to MongoDB.
  - Empty state when all editor tabs are closed.
- **Collapsible Bottom Panel (Updated - M1 & M4):**
  - Three distinct tabs: **Output**, **Problems**, and **Terminal**.
  - Collapsible and expandable with height toggle control.
  - **Output:** Real-time execution log rendering stdout, formatted compile/runtime errors, and execution metrics (`[Finished in ... | Memory: ... | Exit Code: ... | Status: ...]`).
  - **Problems:** Clean empty state ("No problems detected in the workspace").
  - **Terminal:** Container terminal interface placeholder with disclaimer that shell execution arrives in subsequent phases.
- **Real-Time Status Bar (Completed - M1):**
  - Live cursor metrics (`Ln <line>, Col <col>`) updating directly from Monaco's `onDidChangeCursorPosition` event.
  - Current file language indicator, indentation setting (`Spaces: 4`), and encoding (`UTF-8`).
  - Active file status indicator ("Modified" vs "Ready").
- **Top Toolbar & Run Action (Completed - M1 & M4):**
  - Project title, language selector dropdown, Save button, and Explorer sidebar toggle.
  - **Run Button:** Fully connected to `/api/execute` endpoint; displays live spinning loader and "Running..." state while execution is in progress, automatically persists dirty files, and appends output to the Output console.
- **Code Execution Pipeline (Completed - M4):**
  - Authenticated backend execution route `POST /api/execute` protected by `requireAuth` and `executionRateLimiter` (20 req/min per user).
  - Dedicated `ExecutionService` proxying execution requests to OnlineCompiler.io `POST /api/run-code-sync/` with server-side `ONLINECOMPILER_API_KEY`.
  - Language allowlisting supporting JavaScript (`nodejs-24`), Python (`python-3.14`), C++ (`g++-15`), and Java (`openjdk-25`).
  - Strict input validation via Zod: source code limit of 100KB, standard input limit of 50KB.
  - Execution request timeout ceiling using AbortController (15 seconds).
  - Project ownership verification preventing unauthorized access to other users' project resources (IDOR protection).
  - Normalization of provider responses into standard `ExecutionResult` contract with telemetry (`timeMs`, `memoryKb`, `exitCode`, `status`, `statusDescription`).
  - Frontend client `executionApi` service wired into `WorkspacePage` with toast notifications and formatted terminal output.

---

## 6. Architecture and Design Decisions

### Client Architecture (`client/src`)
- **State Separation:**
  - `AuthContext`: Manages authenticated user state, login, signup, and logout methods via `authApi`.
  - `projectApi`: Real HTTP client calling `/api/projects` endpoints with cookie credentials.
  - `mockProjectService`: Pure immutable tree manipulation helper functions (`findNodeById`, `addNodeToTree`, `deleteNodeFromTree`, `renameNodeInTree`, `toggleFolderState`) and `detectMonacoLanguage`.
  - `WorkspacePage`: Coordinates local file state, dirty tab tracking, Monaco editor updates, and bottom panel logs.
- **Monaco Editor Configuration:**
  - Monaco mounts once per tab session with `automaticLayout: true` so resizing the Explorer sidebar or bottom panel automatically recalculates editor dimensions.
  - Syntax language is dynamically resolved via `detectMonacoLanguage(filename)`.

### Live Collaboration Architecture (Planned - M8 Design)
- **Engine & Transport:** **Yjs** CRDT engine paired with **WebSockets** server for low-latency, conflict-free collaborative editing.
- **Phased Implementation:**
  1. *Phase 1:* Single-file synchronization in an active editor session.
  2. *Phase 2:* Multi-file project workspace synchronization.
- **Per-File Document Model:** Each file in a project is bound to a separate synchronized Yjs document addressed by a **stable file ID**. This isolates file edit histories and prevents cross-file sync bottlenecks.
- **Presence & Awareness:** Real-time awareness protocol transmitting collaborator cursor positions, text selections, and user identification colors.
- **Shared Workspace Explorer:** Real-time synchronization of file tree mutations (create, rename, delete files/folders).
- **Room Authorization & Reconnection:** WebSocket handshake verifies JWT cookies for project room admission; connection recovery with buffered offline change reconciliation.
- **Persistence:** Periodic debounced flush of synchronized document snapshots into MongoDB Atlas `Project` records.

---

## 7. Environment Setup

### Prerequisites
- Node.js: `>= 20.x` (Recommended: `v24.x`; verified on `v24.14.0`)
- npm: `>= 10.x` (Recommended: `v11.x`; verified on `11.9.0`)
- Operating System: Windows / macOS / Linux

> **Windows PowerShell Execution Policy Note:**  
> On Windows PowerShell, executing bare `npm` may trigger a `PSSecurityException` due to script execution policy restrictions on `npm.ps1`. Use `npm.cmd` instead (e.g., `npm.cmd run dev`, `npm.cmd run build`).

### Environment Variables

#### Root (`.env.example`)
```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/devnest?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
```

#### Server (`server/.env.example`)
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/devnest?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
```

#### Client (`client/.env.example`)
```env
VITE_API_URL=http://localhost:5000
```

> **Security Warning:** Real `MONGODB_URI`, `JWT_SECRET`, and future `ONLINECOMPILER_API_KEY` credentials live exclusively in local `server/.env` (gitignored). Never commit `.env` or paste credentials into documentation or chat.

### Installation & Execution Commands

```bash
# 1. Install all dependencies across monorepo workspaces
npm.cmd install

# 2. Start development servers concurrently (Client on :5173, Server on :5000)
npm.cmd run dev

# 3. Or start workspaces independently
npm.cmd run dev:client
npm.cmd run dev:server

# 4. Build all packages in topological order (shared -> server -> client)
npm.cmd run build

# 5. Run static typecheck across all packages
npm.cmd run typecheck

# 6. Run test check (server test suite)
npm.cmd test
```

---

## 8. Testing and Verification

All checks recorded below were physically executed on the development machine on October 23, 2026.

| Command / Check | Execution Context | Result | Observations / Output |
|---|---|---|---|
| Node DNS diagnosis | PowerShell / Node | **Root cause confirmed** | `dns.getServers()` → `['127.0.0.1']`; `resolveSrv` → `ECONNREFUSED`. Public DNS (`8.8.8.8` / `1.1.1.1`) and Wi-Fi DNS succeed. Node `v24.14.0` + c-ares `1.34.6` Windows regression ([nodejs/node#62748](https://github.com/nodejs/node/issues/62748)). |
| `npm.cmd run dev:server` | `server/` | **Passed** | Conditional DNS fallback logged; MongoDB Atlas connected to database `devnest`; server on `:5000`. |
| `GET /api/health` | PowerShell | **Passed (HTTP 200)** | `{"status":"ok","service":"devnest-server",...}`. |
| `npm.cmd run dev:client` | `client/` | **Passed** | Vite ready in ~264ms on `http://localhost:5173/`. |
| `Invoke-WebRequest http://localhost:5173/` | PowerShell | **Passed (HTTP 200)** | Frontend HTML served. |
| `npm.cmd run test` (server Vitest) | `server/` | **Passed (89/89)** | `auth.service.test.ts` (12) + `auth.routes.test.ts` (14) + `project.service.test.ts` (14) + `project.routes.test.ts` (23) + `execution.service.test.ts` (15) + `execution.routes.test.ts` (11). |
| `npm.cmd run typecheck` | DevNest Root | **Passed (Exit code 0)** | Shared, server, client — 0 errors. |
| `npm.cmd run build` | DevNest Root | **Passed (Exit code 0)** | Client bundle ~259.82 kB JS (gzip 74.30 kB). |

---

## 9. Known Issues and Technical Debt

1. **Node.js Windows DNS / `querySrv ECONNREFUSED` (mitigated in code):** On Node `v24.14.0` (c-ares `1.34.6`), `dns.getServers()` incorrectly returns `127.0.0.1`, breaking `mongodb+srv` SRV lookups. Mitigated by `server/src/config/dns.ts` (loopback-only → public DNS fallback). **Preferred long-term fix:** upgrade Node.js to **>= 24.19.0** (includes c-ares fix).
2. **In-Memory Project Persistence:** ~~Dashboard/workspace still use `mockProjectService` + `localStorage`.~~ **Resolved in Milestone 3** — projects and file trees are now persisted in MongoDB via `/api/projects`.
3. **Remote Code Execution Pending:** ~~Run button / Output panel still show Milestone 4 placeholders for OnlineCompiler.io.~~ **Resolved in Milestone 4** — `POST /api/execute` proxy service with OnlineCompiler.io, Run button loading states, and output display are fully connected and verified.
4. **Legacy `mockAuthService`:** File remains in the repo for fallback reference, but `AuthContext` uses `authApi` against the real backend.
5. **Windows PowerShell Execution Policy:** Use `npm.cmd` instead of bare `npm` when `npm.ps1` is blocked.

---

## 10. Next Steps

### Highest Priority Task
**Implement Milestone 5: Execution Console & Telemetry** (M0, M1, M2, M3 & M4 are fully completed and verified).

### Step-by-Step Action Plan
1. **Rich telemetry metrics presentation:** Upgrade bottom panel to display live CPU time gauges, memory peak consumption indicators, and structured error diagnostics alongside stdout.
2. **Standard input (stdin) interactive prompt:** Add dedicated interactive stdin console or input drawer in the bottom panel to pass custom input data into execution requests.
3. **Live Collaboration Preparation (Milestone 8):** Design WebSocket gateway and integrate Yjs document bindings for Monaco Editor.

---

## 11. Session Handoff

```markdown
### Future AI Session Handoff

- **Project:** DevNest — Collaborative Code Execution & Testing Platform.
- **Current Milestone:** Milestone 4 complete → Milestone 5 (Execution Console & Telemetry) next.
- **Roadmap Sequence:**
  - M0: Monorepo Scaffolding (Completed)
  - M1: Frontend UI Prototype (Completed)
  - M2: Database Integration & Authentication (Completed)
  - M3: Project & File Management APIs (Completed)
  - M4: Code Execution Pipeline (Completed)
  - M5: Execution Console & Telemetry (Next)
  - M8: Live Collaboration (Planned - Yjs & WebSockets)
  - M6: Testing & Security (Planned)
  - M7: Production Readiness & Deployment (Planned)
- **Completed / Verified:**
  - Milestones 0, 1, 2, 3 & 4 complete.
  - Milestone 4: Dedicated `ExecutionService`, authenticated `POST /api/execute` route with per-user rate limiting, Zod validation, OnlineCompiler.io sandboxing proxy, AbortController timeouts, project IDOR checks, normalized `ExecutionResult` contract, client `executionApi` with Run button loading state & output panel rendering. 89/89 Vitest tests passing.
- **Important Files:**
  - `server/src/services/execution.service.ts` — OnlineCompiler.io proxy & response normalizer
  - `server/src/controllers/execution.controller.ts` — HTTP layer for /api/execute
  - `server/src/routes/execution.routes.ts` — /api/execute route with requireAuth & executionRateLimiter
  - `server/src/validators/execution.validator.ts` — Zod schemas for execution requests
  - `server/src/middleware/executionRateLimiter.ts` — 20 req/min per-user rate limiter
  - `server/src/tests/execution.service.test.ts` — 15 unit tests
  - `server/src/tests/execution.routes.test.ts` — 11 route integration tests
  - `client/src/services/executionApi.ts` — client API service for /api/execute
  - `client/src/components/workspace/WorkspacePage.tsx` — wired Run handler & output logging
  - `client/src/components/workspace/TopToolbar.tsx` — Run button with loading spinner & disabled state
  - `client/src/components/workspace/BottomPanel.tsx` — Output panel rendering stdout, stderr, telemetry
- **Immediate Task:** Milestone 5 — enhanced execution console telemetry and interactive stdin support.
- **Runtime note:** Node `v24.14.0` on Windows has c-ares DNS bug; prefer upgrade to `>= 24.19.0`. Do not commit `.env`.
- **Verification Commands:**
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test`
  - `npm.cmd run dev`
```
