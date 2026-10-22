# DevNest — Project Status & Architecture Guide

> **Current Status:** Milestone 0 Complete • Milestone 1 (UI Prototype & Monaco Editor) Not Started  
> **Last Verified:** October 22, 2026  
> **Branch:** `main` (0 commits, working directory uncommitted)

---

## 1. Project Overview

DevNest is a browser-based, Replit-inspired cloud integrated development environment (IDE) developed as a portfolio-grade college resume project.

### Core Purpose & Intended Users
The platform enables developers, students, and interview candidates to write, compile, run, and debug code instantly in their web browser without local toolchain installation.

### Key Planned Features
- **In-Browser Code Editing:** High-fidelity multi-language code editing powered by Monaco Editor with syntax highlighting and language boilerplate templates.
- **Isolated Multi-Language Execution:** Remote compilation and sandboxed execution via the Judge0 API supporting JavaScript (Node.js), Python 3, C++ (GCC), and Java (OpenJDK).
- **Interactive Execution Console & Telemetry:** Output inspection showing `stdout`, `stderr`, compilation warnings, execution time (ms), memory consumption (KB), and exit codes.
- **Project & File Management:** Cloud persistence of multi-file projects backed by MongoDB Atlas with user authorization and ownership isolation.
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

### Planned Technologies (Not Yet Installed / Implemented)

| Layer | Planned Technology | Intended Purpose | Current Status |
|---|---|---|---|
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | In-browser code editing with IntelliSense and theme matching | Not installed in `client/package.json` |
| **Database** | MongoDB Atlas / Mongoose | User profiles, project persistence, file trees | Not installed; no models or connection logic present |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` | User registration, login, and project authorization | Not installed; no auth routes or middleware |
| **Validation** | Zod / Joi | Request payload validation for project CRUD and executions | Not installed |
| **Code Execution** | Judge0 CE / RapidAPI | Sandboxed compilation and code execution | Shared IDs defined, but no HTTP execution client implemented |
| **Testing Suite** | Vitest / Jest, Supertest, React Testing Library | Automated unit and integration testing across workspaces | Root `test` script is a placeholder stub |
| **Deployment** | Vercel (Client) & Render (Server) | Production hosting and CI/CD pipelines | No deployment manifests (`vercel.json`, `render.yaml`) present |

---

## 3. Repository Structure

```
DevNest/
├── .env.example              # Root template for shared environment variables
├── .gitignore                # Git ignore rules (node_modules, dist, env files)
├── README.md                 # High-level developer documentation and setup guide
├── package.json              # Monorepo root manifest configuring npm workspaces & orchestrator
├── package-lock.json         # Lockfile for root and workspace dependency graph
│
├── client/                   # Frontend Single Page Application
│   ├── .env.example          # Client environment template (VITE_API_URL)
│   ├── dist/                 # Production build output generated by Vite
│   ├── index.html            # Main HTML entry point configuring dark mode root
│   ├── package.json          # Client dependencies (React, Vite, Tailwind CSS)
│   ├── postcss.config.js     # PostCSS configuration for Tailwind CSS
│   ├── tailwind.config.ts    # Tailwind theme extension (brand colors, slate dark shades)
│   ├── tsconfig.json         # TypeScript client compiler configuration (bundler resolution)
│   ├── tsconfig.node.json    # TypeScript compiler configuration for Vite config
│   ├── vite.config.ts        # Vite configuration (React plugin, path aliases, /api reverse proxy)
│   └── src/
│       ├── App.tsx           # Baseline React view displaying system health & shared languages
│       ├── index.css         # Tailwind directives and base dark theme styles
│       └── main.tsx          # React 18 DOM mount point
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
| **Milestone 0** | Workspace & monorepo scaffolding | **Completed** | Full npm workspaces configuration (`shared`, `server`, `client`); `@devnest/shared` builds cleanly and is imported by both `client` and `server`; `server/src/server.ts` exposes `/api/health`; `client/src/App.tsx` proxies to `/api/health` and displays `@devnest/shared` language configs; `npm run typecheck` and `npm run build` pass with 0 errors. |
| **Milestone 1** | UI prototype with mock data & Monaco Editor | **Not Started** | Monaco Editor (`@monaco-editor/react`) is not installed. `client/src/App.tsx` only contains a basic system health dashboard card. Multi-pane IDE layout, editor pane, file tree, and mock runner are not implemented. |
| **Milestone 2** | MongoDB, authentication, validation, & security | **Not Started** | No MongoDB driver or Mongoose in `server/package.json`. No user/auth routes, JWT logic, password hashing, or project ownership guards. |
| **Milestone 3** | Judge0 execution engine with allowlisting & rate limits | **Not Started** | Shared contracts define Judge0 IDs in `shared/src/types/language.ts`, but no backend execution route (`/api/execute`), Judge0 client, polling worker, or rate limiter exists. |
| **Milestone 4** | Execution console & telemetry | **Not Started** | Telemetry interfaces (`ExecutionTelemetry`) exist in `@devnest/shared`, but no console UI, telemetry badges, or terminal output components exist in `client`. |
| **Milestone 5** | Automated testing | **Not Started** | `package.json` contains stub test script `echo "Testing will be configured in Milestone 5" && exit 0`. Vitest, Jest, Supertest, and React Testing Library are not installed. |
| **Milestone 6** | Production deployment & smoke testing | **Not Started** | No Vercel or Render deployment manifests exist. Production environment variables are unconfigured. |

---

## 5. Implemented Features

### Working Features (Verified by Execution & Code Inspection)
- **Multi-Package Monorepo Orchestration:**
  - Standardized root scripts for concurrent development (`npm run dev`), workspace-targeted builds (`npm run build`), and typecheck sweeps (`npm run typecheck`).
  - Strict TypeScript configuration across workspaces with declaration maps in `@devnest/shared`.
- **Shared Domain Contracts (`@devnest/shared`):**
  - Canonical language configurations (`SUPPORTED_LANGUAGES`) for JavaScript, Python, C++, and Java with associated file extensions, default file names, Monaco language tokens, boilerplate code, and Judge0 language IDs.
  - Strict data models for execution requests, execution results, telemetry data, and project CRUD DTOs.
- **Backend Service Baseline (`@devnest/server`):**
  - Express application configured with CORS middleware and JSON body parsing.
  - Health endpoint at `GET /api/health` returning system status, service identifier, ISO timestamp, and dynamic supported language keys imported from `@devnest/shared`.
  - Development hot-reloading powered by `tsx watch`.
- **Frontend Baseline Application (`@devnest/client`):**
  - React 18 single page application bundled with Vite.
  - Tailwind CSS dark-theme styling configured with custom slate color scale.
  - Vite reverse-proxy forwarding `/api` requests to backend server at `http://localhost:5000`.
  - Verification dashboard in `App.tsx` actively querying `/api/health` and rendering active language badges from `@devnest/shared`.

### Incomplete & Partially Working Features
- **Client IDE View (`client/src/App.tsx`):**
  - Currently acts only as a connectivity test harness for Milestone 0. It does not contain an editor, tabs, file manager, or execution panel.
- **Root Test Script (`package.json`):**
  - Exits with code 0 via `echo` message; no test runner or assertions exist.
- **Monorepo Package Resolution:**
  - Client Vite config aliases `@devnest/shared` directly to `../shared/src`, while `package.json` specifies `"@devnest/shared": "*"`. Production build compiles, but development uses source files rather than built package declarations.

---

## 6. Architecture and Design Decisions

### Monorepo Structure & Package Boundaries
- **Workspaces:** Configured in root `package.json` using npm workspaces:
  - `shared`: Zero-runtime-dependency TypeScript library defining data models, DTOs, and constants. Builds with `tsc` to CommonJS + `.d.ts`.
  - `server`: Node.js / Express backend service consuming `@devnest/shared`.
  - `client`: Vite / React frontend consuming `@devnest/shared` and proxied to `server`.

### API Design
- **Current Endpoints:**
  - `GET /api/health` — Returns status, timestamp, service name, and supported languages.
- **Planned Endpoints:**
  - `POST /api/auth/register` — User account registration.
  - `POST /api/auth/login` — Authentication and JWT issuance.
  - `GET /api/projects` — List user projects.
  - `POST /api/projects` — Create project.
  - `GET /api/projects/:id` — Retrieve project and associated files.
  - `PUT /api/projects/:id` — Update project metadata.
  - `POST /api/projects/:id/files` — Add or update project files.
  - `POST /api/execute` — Submit code execution job to Judge0 and poll for telemetry.

### Data Models (Defined in `@devnest/shared`)
- **`Project`:** `id`, `title`, `description`, `language`, `ownerId`, `files: ProjectFile[]`, `createdAt`, `updatedAt`.
- **`ProjectFile`:** `id`, `name`, `path`, `content`, `isEntry?: boolean`.
- **`ExecutionTelemetry`:** `timeMs`, `memoryKb`, `exitCode`, `status`, `statusDescription`.
- **`ExecutionResult`:** `stdout`, `stderr`, `compileOutput`, `telemetry: ExecutionTelemetry`.

### Security Decisions (Planned)
- Isolated execution using Judge0 containerized workers with strict CPU time, memory limits, and disabled network access.
- Language allowlisting to restrict execution requests to verified language IDs (JS: 63, Python: 71, C++: 54, Java: 62).
- Authentication via JWT in HTTP headers or HTTP-only cookies.
- Ownership validation ensuring users can only read or edit projects where `ownerId === req.user.id`.

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

# 2. Setup environment files
# Copy server/.env.example to server/.env
# Copy client/.env.example to client/.env

# 3. Start development servers concurrently (Client on :5173, Server on :5000)
npm.cmd run dev

# 4. Or start workspaces independently
npm.cmd run dev:client
npm.cmd run dev:server

# 5. Build all packages in topological order (shared -> server -> client)
npm.cmd run build

# 6. Run typecheck across all packages
npm.cmd run typecheck

# 7. Run test check
npm.cmd test
```

---

## 8. Testing and Verification

All checks recorded below were physically executed on the machine on October 22, 2026.

| Command / Check | Execution Context | Result | Observations / Output |
|---|---|---|---|
| `git status` | DevNest Root | **Executed** | Branch `main`, 0 commits, working tree untracked. |
| `node -v` & `npm.cmd -v` | DevNest Root | **Executed** | Node `v24.14.0`, npm `11.9.0`. |
| `npm run typecheck` (PowerShell) | DevNest Root | **Failed (OS Security)** | Blocked by Windows PowerShell Execution Policy (`npm.ps1 cannot be loaded`). |
| `npm.cmd run typecheck` | DevNest Root | **Passed (Exit code 0)** | Strict typecheck succeeded across `@devnest/shared`, `@devnest/server`, and `@devnest/client`. |
| `npm.cmd run build` | DevNest Root | **Passed (Exit code 0)** | - `@devnest/shared`: `tsc` compiled `dist/`<br>- `@devnest/server`: `tsc` compiled `dist/server.js`<br>- `@devnest/client`: `tsc && vite build` bundled 35 modules in 21.48s (`dist/assets/index-*.js: 146.78 kB`). |
| `node dist/server.js` | `server/` | **Passed** | Server initialized and bound successfully: `[DevNest Engine] Server running on http://localhost:5000`. |
| `npm.cmd test` | DevNest Root | **Passed (Exit code 0)** | Output: `"Testing will be configured in Milestone 5"` (stub check). |

---

## 9. Known Issues and Technical Debt

1. **Git Repository Uncommitted:** The repository has been initialized (`.git` exists on branch `main`), but no initial commit has been made. All workspace files remain untracked.
2. **Windows PowerShell Execution Policy:** Running `npm` directly in standard PowerShell fails due to script signing policies on `npm.ps1`. Workspaces and documentation should explicitly instruct Windows users to invoke `npm.cmd`.
3. **Absence of Code Editor:** Monaco Editor (`@monaco-editor/react`) is not yet installed in `client/package.json`, and no editor components exist in `client/src`.
4. **No Automated Testing Framework:** Milestone 5 has not been initiated. There are no test runners (Vitest, Jest), assertion libraries, or mock environments configured.
5. **No Database Layer:** No MongoDB or Mongoose setup exists in the backend; all state is currently stateless.
6. **No Error Handling & Validation Middleware:** `server/src/server.ts` does not yet have 404 handlers, global exception handling middleware, or request schema validation (Zod).
7. **Client Shared Import Resolution:** `client/vite.config.ts` aliases `@devnest/shared` to `../shared/src`, which bypasses `shared/dist`. While convenient for HMR, it differs from the package manifest standard.

---

## 10. Next Steps

### Highest Priority Task
**Milestone 1: UI Prototype with Monaco Editor and Mock Data**

### Step-by-Step Action Plan
1. **Establish Git Baseline:**
   - Create initial commit tracking all Milestone 0 files on `main`:
     ```bash
     git add .
     git commit -m "feat: complete milestone 0 monorepo scaffolding"
     ```
2. **Install Monaco Editor:**
   - In `client/`: Install `@monaco-editor/react` (and Lucide icons for UI polish if desired):
     ```bash
     npm.cmd install @monaco-editor/react --workspace=client
     ```
3. **Build Core IDE Layout Components:**
   - Create `client/src/components/Header.tsx`: Navigation bar with DevNest logo, project title, language selector dropdown (populated dynamically from `@devnest/shared`), and a "Run Code" action button.
   - Create `client/src/components/Sidebar.tsx`: Mock file tree display showing default project files according to active language (e.g., `main.py` or `index.js`).
   - Create `client/src/components/EditorPane.tsx`: Monaco Editor integration with dark theme (`vs-dark`), language mode synchronization, and editable state initialized from language boilerplate.
   - Create `client/src/components/ConsolePane.tsx`: Output console supporting tabs for `stdout`, `stderr`, and a telemetry status bar showing execution time, memory, and status badges.
4. **Wire State & Mock Execution Flow:**
   - In `client/src/App.tsx`, connect language selection state to update the editor boilerplate and Monaco language syntax.
   - Add mock execution handler to simulate running code: when clicking "Run", show execution state, simulate 300ms processing delay, and display mock telemetry in `ConsolePane`.
5. **Verify Build & Typecheck:**
   - Execute `npm.cmd run typecheck` and `npm.cmd run build` to confirm zero compilation errors.

---

## 11. Session Handoff

```markdown
### Future AI Session Handoff

- **Project:** DevNest — Replit-inspired browser Cloud IDE (Resume Project).
- **Current Milestone:** Milestone 1 (UI Prototype with Monaco Editor & Mock Data).
- **Completed Milestone:** Milestone 0 (Monorepo scaffolding, npm workspaces, TypeScript builds, shared contracts, Express health route, React baseline).
- **Important Files to Inspect First:**
  - `shared/src/types/language.ts` (Language definitions, Judge0 IDs, boilerplates)
  - `shared/src/types/execution.ts` (Execution telemetry & result contracts)
  - `client/src/App.tsx` (Current client entry point to replace with IDE layout)
  - `client/package.json` (Needs @monaco-editor/react installed)
- **Recent Architectural Decisions:**
  - Standardized on npm workspaces (`shared`, `server`, `client`).
  - `@devnest/shared` is the single source of truth for execution schemas and language configs.
  - Tailwind CSS dark theme configured with slate palette.
- **Immediate Task:**
  1. Commit Milestone 0 files to git (`git commit -m "feat: milestone 0 baseline"`).
  2. Install `@monaco-editor/react` in `client`.
  3. Implement the multi-pane IDE layout in `client/src/` with Monaco Editor and mock execution console.
- **Verification Commands:**
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run dev`
```
