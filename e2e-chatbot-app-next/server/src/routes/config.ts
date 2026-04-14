import {
  Router,
  type Request,
  type Response,
  type Router as RouterType,
} from 'express';
import { isDatabaseAvailable } from '@chat-template/db';
import { getEndpointOboInfo } from '@chat-template/ai-sdk-providers';
import {
  getLocalAgentModelConfig,
  getLocalAgentStorageConfig,
} from '../lib/local-agent-config';
import { pickFolder } from '../lib/folder-picker';
import {
  clearWorkspaceRoot,
  getLocalWorkspaceConfig,
  setWorkspaceRoot,
} from '../lib/local-workspace-store';
import {
  getLocalChatHistoryPath,
  isLocalChatHistoryEnabled,
} from '../lib/local-chat-store';
import {
  getSharedProfile,
  saveSharedProfile,
} from '../lib/shared-profile-store';
import { initializeWikiWorkspace } from '../lib/wiki-bootstrap';

export const configRouter: RouterType = Router();

/**
 * Extract OAuth scopes from a JWT token (without verification).
 * Databricks tokens use 'scope' (space-separated string) or 'scp' (array).
 */
function getScopesFromToken(token: string): string[] {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return [];
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    if (typeof payload.scope === 'string') return payload.scope.split(' ');
    if (Array.isArray(payload.scp)) return payload.scp as string[];
    return [];
  } catch {
    return [];
  }
}

/**
 * GET /api/config - Get application configuration
 * Returns feature flags and OBO status based on environment configuration.
 * If the user's OBO token is present, decodes it to check which required
 * scopes are missing — the banner only shows missing scopes.
 */
configRouter.get('/', async (req: Request, res: Response) => {
  const oboInfo = await getEndpointOboInfo();
  const workspace = getLocalWorkspaceConfig();
  const models = getLocalAgentModelConfig();
  const storage = getLocalAgentStorageConfig();

  let missingScopes = oboInfo.endpointRequiredScopes;

  // If the user has an OBO token, check which scopes are already present
  const userToken = req.headers['x-forwarded-access-token'] as string | undefined;
  if (userToken && oboInfo.isEndpointOboEnabled) {
    const tokenScopes = getScopesFromToken(userToken);
    // A required scope like "sql.statement-execution" is satisfied by
    // an exact match OR by its parent prefix (e.g. "sql")
    missingScopes = oboInfo.endpointRequiredScopes.filter(required => {
      const parent = required.split('.')[0];
      return !tokenScopes.some(ts => ts === required || ts === parent);
    });
  }

  res.json({
    features: {
      chatHistory: isDatabaseAvailable() || isLocalChatHistoryEnabled(),
      feedback: !!process.env.MLFLOW_EXPERIMENT_ID,
    },
    wikiRepo: workspace.wikiRepo,
    sourceLibrary: workspace.sourceLibrary,
    models,
    storage: {
      agentRoot: storage.agentRoot,
      conversationMemoryDbPath: storage.conversationMemoryDbPath,
      localChatHistoryPath: getLocalChatHistoryPath(),
    },
    obo: {
      missingScopes,
    },
  });
});

function getRootLabel(kind: 'wikiRepo' | 'sourceLibrary') {
  return kind === 'wikiRepo' ? 'Wiki repo' : 'Source library';
}

async function updateWorkspaceRoot(
  req: Request,
  res: Response,
  kind: 'wikiRepo' | 'sourceLibrary',
) {
  const rootPath = req.body?.path;

  if (rootPath === null || rootPath === '') {
    const workspace = clearWorkspaceRoot(kind);
    res.json(workspace);
    return;
  }

  if (typeof rootPath !== 'string') {
    res.status(400).json({
      code: 'bad_request:api',
      cause: 'path must be a string',
    });
    return;
  }

  try {
    const workspace = setWorkspaceRoot(kind, rootPath);
    res.json(workspace);
  } catch (error) {
    res.status(400).json({
      code: 'bad_request:api',
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

async function browseWorkspaceRoot(
  _req: Request,
  res: Response,
  kind: 'wikiRepo' | 'sourceLibrary',
) {
  try {
    const selectedPath = await pickFolder(`Select ${getRootLabel(kind)}`);
    if (!selectedPath) {
      res.status(204).end();
      return;
    }

    const workspace = setWorkspaceRoot(kind, selectedPath);
    res.json(workspace);
  } catch (error) {
    res.status(400).json({
      code: 'bad_request:api',
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

configRouter.put('/wiki-repo', async (req: Request, res: Response) => {
  await updateWorkspaceRoot(req, res, 'wikiRepo');
});

configRouter.put('/source-library', async (req: Request, res: Response) => {
  await updateWorkspaceRoot(req, res, 'sourceLibrary');
});

configRouter.post('/wiki-repo/browse', async (req: Request, res: Response) => {
  await browseWorkspaceRoot(req, res, 'wikiRepo');
});

configRouter.post('/source-library/browse', async (req: Request, res: Response) => {
  await browseWorkspaceRoot(req, res, 'sourceLibrary');
});

configRouter.put('/repo', async (req: Request, res: Response) => {
  await updateWorkspaceRoot(req, res, 'wikiRepo');
});

configRouter.post('/repo/browse', async (req: Request, res: Response) => {
  await browseWorkspaceRoot(req, res, 'wikiRepo');
});

configRouter.get('/profile', async (req: Request, res: Response) => {
  const scope = req.query.scope === 'project' ? 'project' : 'global';
  const workspace = getLocalWorkspaceConfig();
  const workspaceRoot = workspace.wikiRepo.path;

  if (scope === 'project' && !workspaceRoot) {
    res.json({
      scope,
      title: 'Wiki workspace profile',
      path: null,
      workspace_root: null,
      workspace_name: null,
      updated_at: null,
      entries: [],
    });
    return;
  }

  const profile = getSharedProfile(scope, scope === 'project' ? workspaceRoot : null);
  res.json(profile);
});

configRouter.put('/profile', async (req: Request, res: Response) => {
  const scope = req.body?.scope === 'project' ? 'project' : 'global';
  const entries = req.body?.entries;
  const workspace = getLocalWorkspaceConfig();
  const workspaceRoot = workspace.wikiRepo.path;

  if (!Array.isArray(entries)) {
    res.status(400).json({
      code: 'bad_request:api',
      cause: 'entries must be an array',
    });
    return;
  }

  if (scope === 'project' && !workspaceRoot) {
    res.status(400).json({
      code: 'bad_request:api',
      cause: 'Select a brain vault before editing workspace memory',
    });
    return;
  }

  const profile = saveSharedProfile(
    scope,
    scope === 'project' ? workspaceRoot : null,
    entries,
  );
  res.json(profile);
});

configRouter.post('/wiki/initialize', async (_req: Request, res: Response) => {
  try {
    const workspace = getLocalWorkspaceConfig();
    if (!workspace.wikiRepo.path) {
      res.status(400).json({
        code: 'bad_request:api',
        cause: 'Select a brain vault before seeding the workspace',
      });
      return;
    }

    const result = initializeWikiWorkspace(workspace.wikiRepo.path);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      code: 'bad_request:api',
      cause: error instanceof Error ? error.message : String(error),
    });
  }
});
