# Second Brain Web App

This directory contains the web application for Second Brain.

It includes:

- `client/`: React + Vite frontend
- `server/`: Express backend
- `packages/`: shared workspaces for auth, core schemas, database, and providers

The product UI is designed around:

- a writable `Brain Vault`
- a read-only `Source Shelf`
- approval-based local file edits
- a memory-oriented experience rather than a coding assistant

## Run Locally

From this directory:

```bash
npm install
npm run dev
```

Expected local ports:

- frontend: `http://localhost:3002`
- backend: `http://localhost:3001`

When running as part of the full product from the repo root, use:

```bash
uv run start-app
```

That flow starts both the Python agent backend and this web app together.
