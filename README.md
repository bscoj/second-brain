# Second Brain

Second Brain is a local-first LLM product for maintaining a curated markdown knowledge base from raw source material.

It ships as a fully functional frontend + backend app:

- `agent_server/`: the Python agent backend
- `e2e-chatbot-app-next/`: the React + Express app shell
- `scripts/start_app.py`: the local entry point that runs both together

The product direction is:

- read from a raw source library
- maintain a structured markdown vault
- answer questions from the curated vault
- preserve approvals before writing local files

## Repo Layout

```text
second-brain/
  agent_server/             # Python agent backend
  e2e-chatbot-app-next/     # Web app frontend + Node backend
  scripts/                  # Local startup and setup helpers
  README.md
  pyproject.toml
  databricks.yml
```

## Local Run

Prerequisites:

- `uv`
- Node 20
- `npm`
- Databricks CLI

Start the full product from the repo root:

```bash
uv run start-app
```

That starts:

- the agent backend at `http://localhost:8000`
- the web app backend at `http://localhost:3001`
- the web app frontend at `http://localhost:3002`

If you only want the Python backend:

```bash
uv run start-server
```

## Web App

The web app lives in `e2e-chatbot-app-next/`.

Its current product branding is `Second Brain`, with:

- `Brain Vault` for the writable markdown workspace
- `Source Shelf` for read-only source material
- a branded UI for memory-building workflows instead of coding-assistant workflows

To run the web app directly:

```bash
cd e2e-chatbot-app-next
npm install
npm run dev
```

## Environment

The root `.env` is used by the Python backend and by the combined local startup flow.

Common settings:

```bash
AGENT_MODEL_ENDPOINT=your-databricks-chat-endpoint
AGENT_AVAILABLE_MODEL_ENDPOINTS=your-databricks-chat-endpoint
CHAT_APP_SERVER_PORT=3001
CHAT_APP_CLIENT_PORT=3002
```

The combined startup script automatically wires:

- `API_PROXY=http://localhost:8000/invocations`
- `LOCAL_AUTH_BYPASS=true` for local UI development

## Databricks Deploy

The repo still includes a Databricks bundle config in `databricks.yml`.

Validate:

```bash
databricks bundle validate
```

Deploy:

```bash
databricks bundle deploy
```

## Notes

- This repo is intended to be pushed as the full product, not just the nested web app.
- Some nested package names still use internal workspace-style identifiers for compatibility, but the shipped product branding is `Second Brain`.
