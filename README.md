# DevNest — Cloud IDE Monorepo

DevNest is a browser-based coding environment designed to allow users to create projects, edit code in a high-fidelity editor, execute programs safely through an isolated execution provider, and inspect output with rich telemetry.

## Architecture Overview

```
DevNest/
├── client/     # Frontend SPA (React, TypeScript, Vite, Tailwind CSS)
├── server/     # Backend REST API (Node.js, Express, TypeScript)
└── shared/     # Shared contracts, types, and constants (@devnest/shared)
```

## Prerequisites

- Node.js `>= 20.x` (Recommended: v24.x)
- npm `>= 10.x` (Recommended: v11.x)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Copy the example environment files:
   - Root: `.env.example`
   - Server: `server/.env.example` -> `server/.env`
   - Client: `client/.env.example` -> `client/.env`

3. **Run Development Mode:**
   ```bash
   npm run dev
   ```
   - Client runs on `http://localhost:5173`
   - Server runs on `http://localhost:5000`

## Build & Quality Checks

- **Full Monorepo Build:**
  ```bash
  npm run build
  ```
- **Typecheck & Linting:**
  ```bash
  npm run lint
  ```
- **Run Sub-packages Independently:**
  ```bash
  npm run dev:client
  npm run dev:server
  npm run build:shared
  npm run build:server
  npm run build:client
  ```
