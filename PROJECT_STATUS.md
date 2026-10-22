# DevNest — Project Status & Architecture Guide

> **Current Status:** Milestone 0 & Milestone 1 Complete • Milestone 2 (MongoDB, Auth, Validation) Ready to Start  
> **Last Verified:** October 22, 2026  
> **Branch:** `main` (Working directory changes staged/handled by user)

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
| **Database** | MongoDB Atlas / Mongoose | User profiles, project persistence, file trees | Milestone 2 |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` | Real user registration, login, and project authorization | Milestone 2 |
| **Validation** | Zod / Joi | Request payload validation for project CRUD and executions | Milestone 2 |
| **Code Execution** | Judge0 CE / RapidAPI | Sandboxed compilation and code execution | Milestone 3 |
| **Testing Suite** | Vitest / Jest, Supertest, React Testing Library | Automated unit and integration testing across workspaces | Milestone 5 |
| **Deployment** | Vercel (Client) & Render (Server) | Production hosting and CI/CD pipelines | Milestone 6 |

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
│               ├── RunNoticeModal.tsx    # Dialog explaining Milestone 3 Judge0 execution status
│               ├── Sidebar.tsx           # Collapsible Explorer sidebar with file/folder actions
│               ├── StatusBar.tsx         # Bottom status bar with line/col, encoding, and language
│               ├── TopToolbar.tsx        # IDE header with Run button, save status, language picker
│               └── WorkspacePage.tsx     # Full IDE workspace layout coordinator
│
├── server/                   # Backend REST API Service
│   ├── .env.example          # Server environment template (PORT, NODE_ENV)
│   ├── dist/                 # Compiled JavaScript output from tsc
│   ├── package.json          # Server dependencies (Express, CORS, Dotenv, TSX)
│   ├── tsconfig.json         # TypeScript CommonJS configuration for Node.js
│   └── src/
│       └── server.ts         # Express server entry point exposing /api/health
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
| **Milestone 2** | MongoDB, authentication, validation, & security | **Not Started** | Next milestone: MongoDB Atlas connection, Mongoose schemas (User, Project), JWT authentication endpoints (`/api/auth/register`, `/api/auth/login`), bcrypt password hashing, request payload validation (Zod), and project ownership enforcement. |
| **Milestone 3** | Judge0 execution engine with allowlisting & rate limits | **Not Started** | Language configs and Judge0 IDs exist in `@devnest/shared`. Backend execution router (`/api/execute`), Judge0 client, polling mechanism, and rate limiting to be implemented. |
| **Milestone 4** | Execution console & telemetry | **Not Started** | Telemetry contracts exist in `@devnest/shared`. Real telemetry display (execution time, memory consumption, exit codes, stdout/stderr streams) to replace mock console. |
| **Milestone 5** | Automated testing | **Not Started** | Automated test runners (Vitest/Jest, Supertest, React Testing Library) to be configured across monorepo packages. |
| **Milestone 6** | Production deployment & smoke testing | **Not Started** | Vercel (frontend) and Render (backend) deployment configurations and production environment secrets to be established. |

---

## 5. Implemented Features

### Working Features (Verified by Execution & Code Inspection)

- **Authentication UI & Session Management:**
  - Polished Login and Sign Up pages styled with subtle dark-theme ambient glows and DevNest branding.
  - Client-side validation: email formatting, required fields, minimum password length (>= 6 chars), password matching on sign-up.
  - Show/hide password visibility toggle buttons.
  - "Auto Fill" quick demo button for one-click access using `demo@devnest.io` / `password123`.
  - Client route protection: unauthenticated users cannot access dashboard or workspace; authenticated users are automatically redirected to dashboard from login/sign-up.
  - Non-sensitive mock session persistence in `localStorage` across page refreshes.
  - Clear in-app disclaimer indicating client-side demonstration authentication.
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
  - **Output:** Execution history log and prominent notice explaining that remote Judge0 execution arrives in Milestone 3.
  - **Problems:** Clean empty state ("No problems detected in the workspace").
  - **Terminal:** Labeled as a planned container terminal feature with a clear disclaimer that shell commands do not run in this prototype.
- **Real-Time Status Bar:**
  - Live cursor metrics (`Ln <line>, Col <col>`) updating directly from Monaco's `onDidChangeCursorPosition` event.
  - Current file language indicator, indentation setting (`Spaces: 4`), and encoding (`UTF-8`).
  - Active file status indicator ("Modified" vs "Ready").
- **Top Toolbar & Run Action:**
  - Project title, language selector dropdown, Save button, and Explorer sidebar toggle.
  - **Run Button:** Triggers execution notice modal and logs run timestamp to Output panel, clearly explaining that real remote execution will be activated in Milestone 3.

---

## 6. Architecture and Design Decisions

### Client Architecture (`client/src`)
- **State Separation:**
  - `AuthContext`: Manages authenticated user state, login, signup, and logout methods.
  - `mockAuthService`: Handles demonstration authentication with network latency simulation (350ms) and non-sensitive localStorage session markers.
  - `mockProjectService`: In-memory project and file tree storage with localStorage fallback and pure immutable tree manipulation functions (`findNodeById`, `addNodeToTree`, `deleteNodeFromTree`, `renameNodeInTree`, `toggleFolderState`).
  - `WorkspacePage`: Coordinates local file state, dirty tab tracking, Monaco editor updates, and bottom panel logs.
- **Modular Design for Milestone 2 Transition:**
  - `mockAuthService` and `mockProjectService` expose asynchronous Promise-based signatures (`login`, `register`, `getProjects`, `createProject`, `updateProjectFiles`). In Milestone 2, these can be replaced with real Axios/fetch calls to `/api/auth` and `/api/projects` without redesigning any UI components.
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
```

#### Client (`client/.env.example`)
```env
VITE_API_URL=http://localhost:5000
```

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

All checks recorded below were physically executed on the machine on October 22, 2026.

| Command / Check | Execution Context | Result | Observations / Output |
|---|---|---|---|
| `npm.cmd run typecheck` | DevNest Root | **Passed (Exit code 0)** | Strict typecheck passed across `@devnest/shared`, `@devnest/server`, and `@devnest/client` with 0 errors. |
| `npm.cmd run build` | DevNest Root | **Passed (Exit code 0)** | Full monorepo production build succeeded. `@devnest/client` bundled 1,987 modules in 2.09s (`dist/assets/index-BqIh1RdY.js`: 256.79 kB, gzip: 73.49 kB). |
| `npm.cmd run dev:client` | `client/` | **Passed** | Vite dev server started in 261ms on `http://localhost:5173/`. |
| `Invoke-WebRequest http://localhost:5173/` | PowerShell | **Passed (HTTP 200)** | Server verified actively serving the frontend HTML bundle. |
| Browser Subagent Verification | Antigravity IDE | **Tool Limitation** | Browser subagent reported Playwright driver download 404 in offline sandbox environment. Code, builds, and HTTP responses verified via command line. |
| `npm.cmd test` | DevNest Root | **Passed (Exit code 0)** | Stub check output: `"Testing will be configured in Milestone 5"`. |

---

## 9. Known Issues and Technical Debt

1. **Client-Side Mock Authentication:** Authentication is currently simulated via `mockAuthService` with `localStorage` session markers. Real user credentials, password hashing (`bcrypt`), and JWT tokens will be introduced in Milestone 2.
2. **In-Memory Project Persistence:** Projects and files are stored in `localStorage` and memory. Real MongoDB Atlas persistence is scheduled for Milestone 2.
3. **Remote Code Execution Pending:** The Run button and Output console display Milestone 1 simulation notices. Real remote compilation via Judge0 API is scheduled for Milestone 3.
4. **Offline Playwright Driver Download:** In this sandboxed environment, automated browser tools running Playwright cannot reach external CDN endpoints for driver binaries. Local HTTP endpoints and TypeScript build outputs serve as empirical verification.
5. **Windows PowerShell Execution Policy:** Running bare `npm` in PowerShell fails due to `npm.ps1` script signing policies. Users must invoke `npm.cmd`.

---

## 10. Next Steps

### Highest Priority Task
**Milestone 2: MongoDB, Authentication, Validation, and Project Ownership Security**

### Step-by-Step Action Plan
1. **Configure Backend Dependencies:**
   - In `server/`: Install `mongoose`, `jsonwebtoken`, `bcryptjs`, and `zod` for request validation.
   - Install corresponding TypeScript declaration packages (`@types/jsonwebtoken`, `@types/bcryptjs`).
2. **Setup MongoDB Atlas Connection:**
   - Create `server/src/config/db.ts` to manage the Mongoose connection lifecycle.
   - Add `MONGODB_URI` to `server/.env.example`.
3. **Define Mongoose Data Models:**
   - Create `server/src/models/User.ts` (email, password hash, name, timestamps).
   - Create `server/src/models/Project.ts` (title, description, language, ownerId reference, files subdocument array).
4. **Implement Backend Authentication Endpoints:**
   - `POST /api/auth/register`: Validate body with Zod, hash password with bcrypt, create user, return JWT token.
   - `POST /api/auth/login`: Verify credentials, return JWT token and user profile.
   - `GET /api/auth/me`: Authenticated endpoint returning current user profile from token.
5. **Implement Project CRUD Endpoints with Ownership Protection:**
   - Create auth middleware `server/src/middleware/auth.ts` to verify JWT and attach `req.user`.
   - `GET /api/projects`: List projects owned by `req.user.id`.
   - `POST /api/projects`: Create project linked to `req.user.id`.
   - `GET /api/projects/:id`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`: Guard with ownership validation (`project.ownerId === req.user.id`).
6. **Connect Client to Backend APIs:**
   - Replace `mockAuthService` with HTTP calls to `/api/auth`.
   - Replace `mockProjectService` with HTTP calls to `/api/projects`.

---

## 11. Session Handoff

```markdown
### Future AI Session Handoff

- **Project:** DevNest — Replit-inspired browser Cloud IDE (College Resume Project).
- **Current Milestone:** Milestone 2 (MongoDB, Authentication, Validation, and Project Ownership Security).
- **Completed Milestones:**
  - Milestone 0: Workspace & monorepo scaffolding (npm workspaces, TS build, Express baseline, React baseline).
  - Milestone 1: Complete interactive UI prototype (Login/Signup with validation, Project Dashboard with search/CRUD, full IDE workspace with Explorer tree, Monaco Editor with multi-tabs & dirty tracking, Bottom Panel with Output/Problems/Terminal, live status bar, and Run modal).
- **Important Files to Inspect First:**
  - `client/src/services/mockAuthService.ts` (To be swapped with real auth API in Milestone 2)
  - `client/src/services/mockProjectService.ts` (To be swapped with real project API in Milestone 2)
  - `server/src/server.ts` (To be expanded with MongoDB connection, auth routes, and project routes)
  - `shared/src/types/project.ts` (Data contracts to align with Mongoose schemas)
- **Recent Architectural Decisions:**
  - `mockAuthService` and `mockProjectService` use Promise-based interfaces that mirror future REST endpoints.
  - `@monaco-editor/react` (4.7.0) and `lucide-react` (1.61.0) installed and verified in production bundle.
  - Strict TypeScript with zero unused locals (`noUnusedLocals: true`).
- **Immediate Task:**
  1. Install Mongoose, jsonwebtoken, bcryptjs, and zod in `server`.
  2. Implement MongoDB connection, User/Project schemas, and authentication endpoints.
  3. Replace client mock services with real backend integration.
- **Verification Commands:**
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run dev`
```
