# DevNest — Collaborative Code Execution & Testing Platform

DevNest is a browser-based coding workspace designed for multi-language code execution, automated testing, and real-time collaboration. It provides developers, students, and teams with an interactive web environment to write code, organize hierarchical project files, trigger sandboxed execution via a secure backend proxy, and inspect output metrics without requiring local toolchain installations.

---

## Core Workflow

1. **Authentication & Session Management:** Developers authenticate via secure HTTP-only JWT cookies (with session restoration and registration/login validation).
2. **Project & File Management:** Create, rename, delete, and organize multi-file codebases in hierarchical folder trees persisted in MongoDB with strict owner authorization.
3. **In-Browser Code Editing:** Edit code in a Monaco-powered editor featuring syntax highlighting (JavaScript, Python, C++, Java), tabbed navigation, and dirty-file tracking.
4. **Sandboxed Code Execution (Completed - M4):** Dispatch code execution requests through the DevNest Express backend, which securely proxies to **OnlineCompiler.io** with server-side API key protection and per-user rate limiting.
5. **Console Output, Telemetry & Test Runner (Completed - M5):** View real-time stdout, stderr, compiler diagnostics, exit codes, CPU execution time, memory usage metrics, standard input (stdin) editor, and multi-test case runner in the collapsible IDE bottom panel.
6. **Real-Time Collaboration (Planned - M8):** Multi-user real-time collaboration across project files using Yjs CRDTs, WebSockets, shared presence indicators, and independent per-file document sync.

---

## Monorepo Architecture

DevNest is structured as an npm workspaces monorepo:

```
DevNest/
├── client/     # Frontend SPA (React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor)
├── server/     # Backend REST API (Node.js, Express, TypeScript, Mongoose, Zod, Vitest)
└── shared/     # Shared domain contracts, DTOs, and language interfaces (@devnest/shared)
```

### Communication Flow

```
┌──────────────────────────────────────────────┐
│                 Client SPA                   │
│   React 18 + TypeScript + Vite + Tailwind    │
│              (Monaco Editor)                 │
└──────────────────────┬───────────────────────┘
                       │ HTTP / REST (JWT in Cookie)
                       ▼
┌──────────────────────────────────────────────┐
│              Backend REST API                │
│       Node.js + Express + TypeScript         │
│  (Auth, Project Service, Execution Proxy)    │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┴───────────────────────┐
       ▼                               ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│      MongoDB Atlas          │  │     OnlineCompiler.io       │
│  (Users, Projects, Files)   │  │  (Sandboxed Code Execution) │
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

## Technology Stack

### Implemented & Verified

- **Monorepo Management:** npm Workspaces (`shared`, `server`, `client`)
- **Orchestration:** `concurrently` (parallel client & server startup)
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Lucide React icons
- **Backend:** Node.js, Express, TypeScript (`tsx` in dev, `tsc` for build)
- **Database & ODM:** MongoDB Atlas, Mongoose 9.x (recursive `FileNode` schema, owner compound indexing)
- **Security & Auth:** HTTP-only secure JWT cookies, `bcryptjs` password hashing, `express-rate-limit`
- **Validation:** Zod (auth credentials, project schemas, file trees, execution requests, batch test schemas)
- **Testing:** Vitest & Supertest (102 passing server unit & integration tests)
- **Code Execution Pipeline (M4):** OnlineCompiler.io API (sandboxed remote compilation and execution proxied exclusively via Express backend; secrets remain server-side)
- **Execution Console & Telemetry (M5):** Collapsible execution console with stdout, stderr, compile error separation, live execution time, peak memory metrics, standard input (`stdin`) preservation, and multi-test case evaluation (`POST /api/execute/run-tests`).

### Planned Technologies

- **Real-Time Collaboration (M8):** Yjs (CRDT synchronization engine), WebSockets (communication server), shared presence, and per-file collaborative documents
- **Production Hosting (M7):** Vercel (Client SPA) & Render (Backend API Service)

---

## Current Status & Roadmap

| Milestone | Title | Status | Description |
|---|---|---|---|
| **M0** | Monorepo Scaffolding | **Completed** | npm workspaces, shared library `@devnest/shared`, build & typecheck scripts. |
| **M1** | Frontend UI Prototype | **Completed** | Interactive dashboard, file tree, Monaco editor, tabs, bottom panel mockups. |
| **M2** | Database Integration & Authentication | **Completed** | MongoDB Atlas, Mongoose `User` model, HTTP-only JWT cookies, 26 auth tests. |
| **M3** | Project & File Management APIs | **Completed** | Recursive `FileNode` Mongoose schema, IDOR-protected project CRUD, `/api/projects/:id/files` endpoints, full `projectApiService` client integration, 37 Vitest tests. |
| **M4** | Code Execution Pipeline | **Completed** | OnlineCompiler.io backend proxy (`POST /api/execute`), language allowlisting, server-side secret management, per-user rate limiting, Run button wired with loading spinner, 26 Vitest tests (89 total). |
| **M5** | Execution Console & Telemetry | **Completed** | Polished multi-tab execution console (Output, Input stdin, Test Cases, Problems), telemetry metrics (execution time ms/s, memory KB/MB, exit status), stdin persistence, multi-case test runner (`POST /api/execute/run-tests` with sequential fallback), stale response guards, 102 passing Vitest tests. |
| **M8** | Live Collaboration | **Planned** | Multi-file shared workspaces via Yjs and WebSockets; room auth, presence, reconnection handling, starting with single-file sync. |
| **M6** | Testing & Security | **Planned** | Monorepo-wide test suites, frontend unit/integration testing, end-to-end security audits. |
| **M7** | Production Readiness & Deployment | **Planned** | Production environment configurations, CI/CD pipelines, Vercel client & Render backend deployments. |


---

## Prerequisites

- **Node.js:** `>= 20.x` (Recommended: `v24.x`; tested on `v24.14.0`)
- **npm:** `>= 10.x` (Recommended: `v11.x`; tested on `11.9.0`)
- **MongoDB Atlas:** Active cluster URI

> **Windows PowerShell Note:** If `npm.ps1` script execution is restricted by PowerShell policy, execute commands using `npm.cmd` (e.g., `npm.cmd run dev`).

---

## Setup & Local Development

### 1. Install Dependencies

From the repository root:
```bash
npm install
```

### 2. Environment Configuration

Copy the template environment files into place:

```bash
# Server environment
cp server/.env.example server/.env

# Client environment (if overriding default port)
cp client/.env.example client/.env
```

Ensure `server/.env` contains valid credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/devnest?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
ONLINECOMPILER_API_KEY=your_onlinecompiler_api_key_here
ONLINECOMPILER_BASE_URL=https://api.onlinecompiler.io
```

> **Security Warning:** Never commit `.env` files or hardcode secrets into the repository. The root `.gitignore` excludes all `.env` files.

### 3. Start Development Servers

Run both backend and frontend concurrently:
```bash
npm run dev
```

Or start packages independently:
```bash
# Start backend only (http://localhost:5000)
npm run dev:server

# Start frontend only (http://localhost:5173)
npm run dev:client
```

---

## Verification & Testing

### Static Typechecking
```bash
npm run typecheck
```

### Build Packages
```bash
npm run build
```

### Run Server Test Suite
```bash
npm test
```
*Executes Vitest suites across `server/src/tests/` (102 unit & integration tests covering auth, project, execution, and batch test runner).*

