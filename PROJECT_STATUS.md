# DevNest — Project Status & Architecture Guide

> **Current Status:** Milestones 0, 1 & 2 Complete • Milestone 3 Complete (Project & File System API) • Milestone 4 Next  
> **Last Verified:** October 24, 2026  
> **Branch:** `main` (M3 changes unstaged — do not commit secrets)

---

## 1. Project Overview

DevNest is a browser-based, Replit-inspired cloud integrated development environment (IDE) developed as a portfolio-grade college resume project.

### Core Purpose & Intended Users
The platform enables developers, students, and interview candidates to write, compile, run, and debug code instantly in their web browser without local toolchain installation.

### Key Capabilities
- **In-Browser Code Editing:** High-fidelity multi-language code editing powered by Monaco Editor with syntax highlighting, multi-tab switching, unsaved indicators, and language boilerplate templates.
- **Project & File Management:** Hierarchical multi-file and folder tree supporting create, rename, delete, and nested directory organization.
- **Interactive Execution Console & Telemetry (Planned):** Remote compilation and sandboxed execution via the Judge0 API supporting JavaScript (Node.js), Python 3, C++ (GCC), and Java (OpenJDK) with CPU time and memory consumption metrics.
- **User Authentication & Dashboard:** Polished authentication UI (Login/Sign Up) with mock session persistence and a responsive dashboard featuring project search and management.
- **Modern Monorepo Architecture:** Clean modular architecture separating client SPA, backend REST API, and shared TypeScript domain contracts.

### Overall Target Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │                 Client SPA                   │
                  │   React 18 + TypeScript + Vite + Tailwind    │
                  │              (Monaco Editor)                 │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTP / REST
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │              Backend REST API                │
                  │           Node.js + Express + TS             │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌─────────────────────────────┐  ┌─────────────────────────────┐
  │      MongoDB Atlas          │  │       Judge0 API            │
  │  (Auth, Projects, Files)    │  │  (Sandboxed Code Execution) │
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
| **Backend Utilities** | CORS, Dotenv, TSX | `cors: ^2.8.5`, `dotenv: ^16.4.5`, `tsx: ^4.19.0` | Cross-origin handling, env loading, fast TypeScript execution in dev |
| **Frontend Framework** | React & React DOM | `^18.3.1` | User interface library |
| **Frontend Bundler** | Vite | `^5.4.2` (`@vitejs/plugin-react: ^4.3.1`) | Rapid HMR dev server and production bundler |
| **Frontend Styling** | Tailwind CSS & PostCSS | `tailwindcss: ^3.4.10`, `postcss: ^8.4.41`, `autoprefixer: ^10.4.20` | Utility-first styling with custom dark theme palette |
| **Code Editor** | Monaco Editor | `@monaco-editor/react: ^4.7.0` | High-fidelity in-browser code editor with multi-tab support and syntax highlighting |
| **UI Iconography** | Lucide React | `lucide-react: ^1.61.0` | Modern, cohesive SVG developer icons across IDE and dashboard |

### Planned Technologies (Scheduled for Later Milestones)

| Layer | Planned Technology | Intended Purpose | Target Milestone |
|---|---|---|---|
| **Database** | MongoDB Atlas / Mongoose `^9.11.3` | User + Project persistence; recursive FileNode sub-documents; compound owner index | Milestone 2 & 3 (complete) |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs`, HTTP-only cookies | Register / login / logout / session restore implemented | Milestone 2 (complete) |
| **Validation** | Zod `^4.6.7` | Auth + project CRUD + file-tree validators implemented | Milestone 2 & 3 (complete) |
| **Code Execution** | Judge0 CE / RapidAPI | Sandboxed compilation and code execution | Milestone 4 |
| **Testing Suite** | Vitest + Supertest (server auth + project); broader suite later | 63/63 server tests passing (auth + project service + route tests) | Milestone 2 / 3 / 6 |
| **Deployment** | Vercel (Client) & Render (Server) | Production hosting and CI/CD pipelines | Milestone 7 |

---

## 3. Repository Structure

```
DevNest/
├── .env.example              # Root template for shared environment variables
├── .gitignore                # Git ignore rules (node_modules, dist, env files)
├── PROJECT_STATUS.md         # Single source of truth for implementation state & handoff
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
│       │   ├── mockAuthService.ts    # Mock authentication with delay simulation & session storage
│       │   └── mockProjectService.ts # In-memory project/file management & tree manipulation helpers
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
│               ├── RunNoticeModal.tsx    # Dialog explaining Milestone 4 Judge0 execution status
│               ├── Sidebar.tsx           # Collapsible Explorer sidebar with file/folder actions
│               ├── StatusBar.tsx         # Bottom status bar with line/col, encoding, and language
│               ├── TopToolbar.tsx        # IDE header with Run button, save status, language picker
│               └── WorkspacePage.tsx     # Full IDE workspace layout coordinator
│
├── server/                   # Backend REST API Service
│   ├── .env.example          # PORT, CLIENT_ORIGIN, MONGODB_URI, JWT_SECRET templates
│   ├── vitest.config.ts      # Vitest config for auth unit/route tests
│   ├── package.json          # Express, Mongoose, JWT, bcrypt, Zod, Vitest, …
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts         # Express app: CORS+cookies, /api/auth, /api/health, DB boot
│       ├── config/           # env.ts, db.ts, dns.ts (Windows c-ares SRV workaround)
│       ├── models/User.ts
│       ├── routes|controllers|services|validators|middleware/  # Auth stack
│       └── tests/            # auth.service + auth.routes Vitest suites
│
└── shared/                   # Shared TypeScript Library (@devnest/shared)
    ├── dist/                 # Compiled declarations (.d.ts) and JS bundle
    ├── package.json          # Shared package manifest targeting dist/
    ├── tsconfig.json         # TypeScript configuration with declaration emit enabled
    └── src/
        ├── index.ts          # Barrel export for shared types
        └── types/
            ├── execution.ts  # Types: ExecutionRequest, ExecutionTelemetry, ExecutionResult
            ├── language.ts   # SupportedLanguage ('javascript'|'python'|'cpp'|'java'), Judge0 IDs, templates
            └── project.ts    # Types: Project, ProjectFile, CreateProjectDTO, UpdateProjectDTO
```

---

## 4. Milestone Tracker

| Milestone | Description | Status | Evidence / Verification Notes |
|---|---|---|---|
| **Milestone 0** | Workspace & monorepo scaffolding | **Completed** | Full npm workspaces configuration (`shared`, `server`, `client`); `@devnest/shared` builds cleanly and is imported by both `client` and `server`; `server/src/server.ts` exposes `/api/health`; `client` proxies to `/api/health`; `npm.cmd run typecheck` and `npm.cmd run build` pass with 0 errors. |
| **Milestone 1** | UI prototype with mock data & Monaco Editor | **Completed** | Complete interactive frontend prototype: Login and Sign Up flows with client validation, show/hide password, and demo auto-fill; session persistence via `AuthContext` and `mockAuthService`; Project Dashboard with real-time search, project creation, renaming, and deletion; full IDE Workspace with collapsible Explorer, recursive file/folder tree (`main.cpp`, `utils.cpp`, `utils.h`, `script.py`, `README.md`), Monaco Editor integration with multi-tabs, dirty-file tracking, `Ctrl+S` save, collapsible Output/Problems/Terminal bottom panel, real-time status bar with live cursor line/column, and Run button status notice. Verified by clean typecheck and production build. |
| **Milestone 2** | MongoDB, authentication, validation, & security | **Completed** | MongoDB Atlas connects via Mongoose; User model; JWT in HTTP-only cookies; `/api/auth/register|login|logout|me`; Zod auth validators; rate limiting; client `authApi` + `AuthContext` session restore. Auth Vitest suite: 26/26 passing. |
| **Milestone 3** | Project & File System API | **Completed** | `Project` Mongoose model with recursive `FileNode` sub-document schema; `ProjectService` with ownership enforcement on every mutation (prevents IDOR); `/api/projects` CRUD routes and `/api/projects/:id/files` + `/api/projects/:id/language` endpoints, all behind `requireAuth`; Zod validators for create, rename, and file-tree payloads; `projectApiService` client replacing `mockProjectService` in `DashboardPage` and `WorkspacePage`; pure file-tree helpers preserved in `mockProjectService.ts`; project + route Vitest suite: 37 new tests, all passing. Total test suite: 63/63. |
| **Milestone 3** | Project & File System API | **Not Started** | Project and virtual file/folder storage in MongoDB. `/api/projects` CRUD (create, list, rename, delete) and `/api/projects/:id/files` file CRUD, all ownership-enforced via `requireAuth` to prevent IDOR. Zod validators for project and file payloads. Replace `mockProjectService` in dashboard and IDE with a real `projectApi` client. Add project + file route/service tests alongside existing auth Vitest suite. |
| **Milestone 4** | Judge0 execution engine with allowlisting & rate limits | **Not Started** | Language configs and Judge0 IDs exist in `@devnest/shared`. Backend execution router (`/api/execute`), Judge0 client, polling mechanism, and rate limiting to be implemented. |
| **Milestone 5** | Execution console & telemetry | **Not Started** | Telemetry contracts exist in `@devnest/shared`. Real telemetry display (execution time, memory consumption, exit codes, stdout/stderr streams) to replace mock console. |
| **Milestone 6** | Automated testing | **Not Started** | Automated test runners (Vitest/Jest, Supertest, React Testing Library) to be configured across monorepo packages. |
| **Milestone 7** | Production deployment & smoke testing | **Not Started** | Vercel (frontend) and Render (backend) deployment configurations and production environment secrets to be established. |

---

## 5. Implemented Features

### Working Features (Verified by Execution & Code Inspection)

- **Authentication UI & Session Management:**
  - Polished Login and Sign Up pages styled with subtle dark-theme ambient glows and DevNest branding.
  - Client-side validation: email formatting, required fields, minimum password length (>= 6 chars), password matching on sign-up.
  - Show/hide password visibility toggle buttons.
  - "Auto Fill" quick demo button for one-click access using `demo@devnest.io` / `password123`.
  - Client route protection: unauthenticated users cannot access dashboard or workspace; authenticated users are automatically redirected to dashboard from login/sign-up.
  - Real backend auth via `authApi` (HTTP-only JWT cookie; session restore through `GET /api/auth/me`).
  - Dashboard/workspace project data persisted in MongoDB via `projectApiService` and `/api/projects`.
- **Project Dashboard:**
  - Welcome banner personalizing the view with the active mock user's name (`Alex Chen`).
  - Real-time search filter querying projects by title, language, or description.
  - Project cards displaying language badges, last modified dates, and action menus (Open, Rename, Delete).
  - Create New Project dialog with title, description, and primary language selector.
  - Rename Project dialog with input validation and instant state updates.
  - Delete Project confirmation dialog with cancellation safeguards.
  - Empty states for zero projects and zero search results.
- **IDE Workspace & File Management:**
  - Multi-pane dark-themed IDE layout inspired by modern cloud editors (Replit, VS Code).
  - Collapsible Explorer sidebar with recursive file and folder tree navigation.
  - Pre-seeded multi-file workspace containing `src/main.cpp`, `src/utils.cpp`, `include/utils.h`, `scripts/script.py`, and `README.md`.
  - File-type icons distinguishing C++, Python, JavaScript, TypeScript, Markdown, and directories.
  - Creation of new files and folders at root or nested within selected folders.
  - Inline renaming and deletion of files and folders with automatic tab cleanup.
- **Monaco Code Editor Integration:**
  - High-fidelity editor powered by `@monaco-editor/react` with `vs-dark` theme and `automaticLayout: true`.
  - Multi-tab management: opening files, switching active tabs, and closing tabs.
  - Independent in-memory content tracking per file.
  - Syntax highlighting dynamically mapped from file extensions (C++, Python, JS, Markdown, etc.).
  - Unsaved-changes tracking: amber dirty dot on tab and top toolbar when modified.
  - Dirty-close confirmation dialog preventing accidental loss of unsaved edits.
  - `Ctrl+S` / `Cmd+S` keyboard shortcut and toolbar Save button to persist file changes.
  - Empty state when all editor tabs are closed.
- **Collapsible Bottom Panel:**
  - Three distinct tabs: **Output**, **Problems**, and **Terminal**.
  - Collapsible and expandable with height toggle control.
  - **Output:** Execution history log and prominent notice explaining that remote Judge0 execution arrives in Milestone 4.
  - **Problems:** Clean empty state ("No problems detected in the workspace").
  - **Terminal:** Labeled as a planned container terminal feature with a clear disclaimer that shell commands do not run in this prototype.
- **Real-Time Status Bar:**
  - Live cursor metrics (`Ln <line>, Col <col>`) updating directly from Monaco's `onDidChangeCursorPosition` event.
  - Current file language indicator, indentation setting (`Spaces: 4`), and encoding (`UTF-8`).
  - Active file status indicator ("Modified" vs "Ready").
- **Top Toolbar & Run Action:**
  - Project title, language selector dropdown, Save button, and Explorer sidebar toggle.
  - **Run Button:** Triggers execution notice modal and logs run timestamp to Output panel, clearly explaining that real remote execution will be activated in Milestone 4.

---

## 6. Architecture and Design Decisions

### Client Architecture (`client/src`)
- **State Separation:**
  - `AuthContext`: Manages authenticated user state, login, signup, and logout methods.
  - `mockAuthService`: Handles demonstration authentication with network latency simulation (350ms) and non-sensitive localStorage session markers.
  - `mockProjectService`: In-memory project and file tree storage with localStorage fallback and pure immutable tree manipulation functions (`findNodeById`, `addNodeToTree`, `deleteNodeFromTree`, `renameNodeInTree`, `toggleFolderState`).
  - `WorkspacePage`: Coordinates local file state, dirty tab tracking, Monaco editor updates, and bottom panel logs.
- **Modular Design for Milestone 3 Transition:**
  - `mockAuthService` and `mockProjectService` expose asynchronous Promise-based signatures (`login`, `register`, `getProjects`, `createProject`, `updateProjectFiles`). In Milestone 3, these were replaced with real `projectApiService` calls to `/api/projects` without redesigning any UI components. The pure file-tree helper functions (`findNodeById`, `addNodeToTree`, etc.) and `detectMonacoLanguage` remain in `mockProjectService.ts` and are still used by `WorkspacePage`.
- **Monaco Editor Configuration:**
  - Monaco mounts once per tab session with `automaticLayout: true` so resizing the Explorer sidebar or bottom panel automatically recalculates editor dimensions.
  - Syntax language is dynamically resolved via `detectMonacoLanguage(filename)`.

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
VITE_API_URL=http://localhost:5000
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

> **Secrets:** Real `MONGODB_URI` / `JWT_SECRET` live only in local `server/.env` (gitignored). Never commit `.env` or paste credentials into docs/chat.

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

# 6. Run test check
npm.cmd test
```

---

## 8. Testing and Verification

All checks recorded below were physically executed on the machine on October 23, 2026 (after DNS fix).

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

1. **Node.js Windows DNS / `querySrv ECONNREFUSED` (mitigated in code):** On Node `v24.14.0` (c-ares `1.34.6`), `dns.getServers()` incorrectly returns `127.0.0.1`, breaking `mongodb+srv` SRV lookups. Mitigated by `server/src/config/dns.ts` (loopback-only → public DNS fallback). **Preferred long-term fix:** upgrade Node.js to **>= 24.19.0** (includes c-ares fix). Optional OS step: set Wi-Fi DNS to `1.1.1.1` / `8.8.8.8` via Settings → Network → Wi-Fi → DNS — helpful for other tools, but not required once Node is upgraded or the app fallback is present.
2. **In-Memory Project Persistence:** ~~Dashboard/workspace still use `mockProjectService` + `localStorage`.~~ **Resolved in Milestone 3** — projects and file trees are now persisted in MongoDB via `/api/projects`.
3. **Remote Code Execution Pending:** Run button / Output panel still show Milestone 4 placeholders for Judge0.
4. **Legacy `mockAuthService`:** File remains in the repo but `AuthContext` uses `authApi` against the real backend.
5. **Windows PowerShell Execution Policy:** Use `npm.cmd` instead of bare `npm` when `npm.ps1` is blocked.

---

## 10. Next Steps

### Highest Priority Task
**Implement Milestone 4: Judge0 execution engine** (auth + MongoDB + project/file persistence all complete).

### Step-by-Step Action Plan
1. **Optional environment hardening:** Upgrade Node.js to `>= 24.19.0` so the Windows c-ares DNS bug is fixed at the runtime layer.
2. **Judge0 backend route:** `POST /api/execute` — accepts `{ language, sourceCode, stdin? }`, submits to Judge0 CE / RapidAPI, polls for result, returns `ExecutionResult` (stdout, stderr, telemetry).
3. **Allowlisting and rate limiting:** Restrict to supported languages; per-user rate limit to prevent abuse.
4. **Wire client:** Replace the run-notice placeholder in `WorkspacePage` with a real `executeApi` call; display output in the Output panel.
5. **Telemetry display (Milestone 5):** Show execution time, memory, exit code in `BottomPanel`.

---

## 11. Session Handoff

```markdown
### Future AI Session Handoff

- **Project:** DevNest — Replit-inspired browser Cloud IDE (College Resume Project).
- **Current Milestone:** Milestone 3 complete → Milestone 4 (Judge0 execution engine) next.
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
- **Immediate Task:** Judge0 execution backend (`POST /api/execute`) + client output display.
- **Runtime note:** Node `v24.14.0` on Windows has c-ares DNS bug; prefer upgrade to `>= 24.19.0`. Do not commit `.env`.
- **Verification Commands:**
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test`
  - `npm.cmd run dev`
```
