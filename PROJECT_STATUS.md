# DevNest — Project Status & Architecture Guide

> **Current Status:** Milestones 0, 1, 2 & 3 Complete • Milestone 4 Next (OnlineCompiler.io Code Execution Pipeline)  
> **Last Verified:** October 24, 2026  
> **Branch:** `main` (M3 changes unstaged — do not commit secrets)

---

## 1. Project Overview

**DevNest** is a browser-based collaborative coding workspace designed for multi-language code execution, automated testing, and real-time collaboration.

### Core Purpose & Intended Users
The platform enables developers, students, and teams to write code, organize hierarchical project files, execute programs in a secure isolated environment via a backend proxy, inspect rich runtime telemetry, and collaborate in real time without local toolchain installation.

### Key Capabilities

- **In-Browser Code Editing (Completed - M1):** High-fidelity multi-language code editing powered by Monaco Editor with syntax highlighting (JavaScript, Python, C++, Java), multi-tab switching, unsaved dirty tracking, and language boilerplate templates.
- **Hierarchical Project & File Management (Completed - M3):** Recursive file/folder tree management supporting create, rename, delete, and directory nesting, backed by MongoDB Atlas with strict owner authorization to prevent IDOR attacks.
- **User Authentication & Session Management (Completed - M2):** Registration and login with client validation, show/hide password, demo auto-fill, and session restoration via secure HTTP-only JWT cookies.
- **Sandboxed Code Execution Pipeline (Planned - M4):** Secure remote compilation and sandboxed execution via **OnlineCompiler.io** supporting JavaScript (Node.js), Python 3, C++ (GCC), and Java (OpenJDK). All execution requests route through the Express backend with server-side API key management and rate limiting.
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
| **Testing Suite (Server)** | Vitest & Supertest | `vitest: ^2.1.8`, `supertest: ^7.3.1` | 63 unit & route integration tests passing for auth and project services |

### Planned Technologies (Scheduled for Later Milestones)

| Layer | Planned Technology | Intended Purpose | Target Milestone |
|---|---|---|---|
| **Code Execution Pipeline** | OnlineCompiler.io | Remote sandboxed compilation and execution proxied via Express backend | Milestone 4 |
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
│               ├── RunNoticeModal.tsx    # Dialog explaining Milestone 4 OnlineCompiler.io execution status
│               ├── Sidebar.tsx           # Collapsible Explorer sidebar with file/folder actions
│               ├── StatusBar.tsx         # Bottom status bar with line/col, encoding, and language
│               ├── TopToolbar.tsx        # IDE header with Run button, save status, language picker
│               └── WorkspacePage.tsx     # Full IDE workspace layout coordinator
│
├── server/                   # Backend REST API Service
│   ├── .env.example          # PORT, CLIENT_ORIGIN, MONGODB_URI, JWT_SECRET templates
│   ├── vitest.config.ts      # Vitest config for auth unit/route tests
│   ├── package.json          # Express, Mongoose, JWT, bcrypt, Zod, Vitest, Supertest
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts         # Express app: CORS+cookies, /api/auth, /api/projects, /api/health
│       ├── config/           # env.ts, db.ts, dns.ts (Windows c-ares SRV workaround)
│       ├── models/           # User.ts, Project.ts (recursive FileNode schema)
│       ├── controllers/      # auth.controller.ts, project.controller.ts
│       ├── middleware/       # auth.ts (requireAuth JWT verification)
│       ├── routes/           # auth.routes.ts, project.routes.ts
│       ├── services/         # auth.service.ts, project.service.ts (IDOR-safe CRUD)
│       ├── validators/       # auth.validator.ts, project.validator.ts
│       └── tests/            # auth.service, auth.routes, project.service, project.routes tests
│
└── shared/                   # Shared TypeScript Library (@devnest/shared)
    ├── dist/                 # Compiled declarations (.d.ts) and JS bundle
    ├── package.json          # Shared package manifest targeting dist/
    ├── tsconfig.json         # TypeScript configuration with declaration emit enabled
    └── src/
        ├── index.ts          # Barrel export for shared types
        └── types/
            ├── execution.ts  # Types: ExecutionRequest, ExecutionTelemetry, ExecutionResult
            ├── language.ts   # SupportedLanguage ('javascript'|'python'|'cpp'|'java'), configs, templates
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
| **Milestone 4** | Code Execution Pipeline | **Planned** | Sandboxed multi-language remote compilation and execution via OnlineCompiler.io. Express backend endpoint `POST /api/execute` receiving `{ language, sourceCode, stdin? }`, proxying requests with server-side API key protection, language allowlisting, user rate limits, and response mapping to `ExecutionResult`. |
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
- **Collapsible Bottom Panel (Completed UI Prototype - M1):**
  - Three distinct tabs: **Output**, **Problems**, and **Terminal**.
  - Collapsible and expandable with height toggle control.
  - **Output:** Execution history log with run notices explaining that remote OnlineCompiler.io execution is scheduled for Milestone 4.
  - **Problems:** Clean empty state ("No problems detected in the workspace").
  - **Terminal:** Container terminal interface placeholder with disclaimer that shell execution arrives in subsequent phases.
- **Real-Time Status Bar (Completed - M1):**
  - Live cursor metrics (`Ln <line>, Col <col>`) updating directly from Monaco's `onDidChangeCursorPosition` event.
  - Current file language indicator, indentation setting (`Spaces: 4`), and encoding (`UTF-8`).
  - Active file status indicator ("Modified" vs "Ready").
- **Top Toolbar & Run Action (Completed UI - M1):**
  - Project title, language selector dropdown, Save button, and Explorer sidebar toggle.
  - **Run Button:** Triggers execution notice modal and logs run timestamp to Output panel, noting that live OnlineCompiler.io execution will be connected in Milestone 4.

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
| `npm.cmd run test` (server Vitest) | `server/` | **Passed (63/63)** | `auth.service.test.ts` (12) + `auth.routes.test.ts` (14) + `project.service.test.ts` (14) + `project.routes.test.ts` (23). |
| `npm.cmd run typecheck` | DevNest Root | **Passed (Exit code 0)** | Shared, server, client — 0 errors. |
| `npm.cmd run build` | DevNest Root | **Passed (Exit code 0)** | Client bundle ~257.42 kB JS (gzip 73.60 kB). |

---

## 9. Known Issues and Technical Debt

1. **Node.js Windows DNS / `querySrv ECONNREFUSED` (mitigated in code):** On Node `v24.14.0` (c-ares `1.34.6`), `dns.getServers()` incorrectly returns `127.0.0.1`, breaking `mongodb+srv` SRV lookups. Mitigated by `server/src/config/dns.ts` (loopback-only → public DNS fallback). **Preferred long-term fix:** upgrade Node.js to **>= 24.19.0** (includes c-ares fix).
2. **In-Memory Project Persistence:** ~~Dashboard/workspace still use `mockProjectService` + `localStorage`.~~ **Resolved in Milestone 3** — projects and file trees are now persisted in MongoDB via `/api/projects`.
3. **Remote Code Execution Pending:** Run button / Output panel still show Milestone 4 placeholders for OnlineCompiler.io.
4. **Legacy `mockAuthService`:** File remains in the repo for fallback reference, but `AuthContext` uses `authApi` against the real backend.
5. **Windows PowerShell Execution Policy:** Use `npm.cmd` instead of bare `npm` when `npm.ps1` is blocked.

---

## 10. Next Steps

### Highest Priority Task
**Implement Milestone 4: OnlineCompiler.io Code Execution Pipeline** (M0, M1, M2 & M3 are fully completed and verified).

### Step-by-Step Action Plan
1. **Optional environment hardening:** Upgrade Node.js to `>= 24.19.0` so the Windows c-ares DNS bug is fixed at the runtime layer.
2. **OnlineCompiler.io backend route:** Implement `POST /api/execute` — accepts `{ language, sourceCode, stdin? }`, proxies to OnlineCompiler.io using server-side API key, polls for result, and returns `ExecutionResult` (stdout, stderr, telemetry).
3. **Allowlisting and rate limiting:** Restrict to supported languages (`javascript`, `python`, `cpp`, `java`); apply per-user rate limit to prevent abuse.
4. **Wire client execution:** Replace the run-notice placeholder in `WorkspacePage` with a real `executeApi` call; display output in the BottomPanel Output tab.
5. **Execution Telemetry (Milestone 5):** Display execution duration, peak memory consumption, and exit code in `BottomPanel`.
6. **Live Collaboration Preparation (Milestone 8):** Design WebSocket gateway and integrate Yjs document bindings for Monaco Editor.

---

## 11. Session Handoff

```markdown
### Future AI Session Handoff

- **Project:** DevNest — Collaborative Code Execution & Testing Platform.
- **Current Milestone:** Milestone 3 complete → Milestone 4 (OnlineCompiler.io Code Execution Pipeline) next.
- **Roadmap Sequence:**
  - M0: Monorepo Scaffolding (Completed)
  - M1: Frontend UI Prototype (Completed)
  - M2: Database Integration & Authentication (Completed)
  - M3: Project & File Management APIs (Completed)
  - M4: Code Execution Pipeline (Next)
  - M5: Execution Console & Telemetry (Planned)
  - M8: Live Collaboration (Planned - Yjs & WebSockets)
  - M6: Testing & Security (Planned)
  - M7: Production Readiness & Deployment (Planned)
- **Completed / Verified:**
  - Milestones 0, 1, 2 & 3 complete.
  - Milestone 3: `Project` Mongoose model (recursive `FileNode` sub-documents); `ProjectService` with IDOR-preventing ownership checks; `/api/projects` CRUD + `/api/projects/:id/files` + `/api/projects/:id/language`; Zod validators; `projectApiService` client; `DashboardPage` + `WorkspacePage` wired to real API. 63/63 Vitest tests passing.
- **Important Files:**
  - `server/src/models/Project.ts` — Project + recursive FileNode Mongoose schema
  - `server/src/services/project.service.ts` — ownership-enforced CRUD
  - `server/src/controllers/project.controller.ts` — HTTP layer
  - `server/src/routes/project.routes.ts` — all routes behind `requireAuth`
  - `server/src/validators/project.validator.ts` — Zod schemas
  - `server/src/tests/project.service.test.ts` — 14 unit tests
  - `server/src/tests/project.routes.test.ts` — 23 integration tests
  - `client/src/services/projectApi.ts` — real API client (replaces mockProjectService)
  - `client/src/services/mockProjectService.ts` — pure file-tree helpers still used by WorkspacePage
  - `client/src/components/dashboard/DashboardPage.tsx` — wired to projectApiService
  - `client/src/components/workspace/WorkspacePage.tsx` — wired to projectApiService
- **Immediate Task:** OnlineCompiler.io execution backend (`POST /api/execute`) with server-side credentials + client output display.
- **Runtime note:** Node `v24.14.0` on Windows has c-ares DNS bug; prefer upgrade to `>= 24.19.0`. Do not commit `.env`.
- **Verification Commands:**
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test`
  - `npm.cmd run dev`
```
