import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface WorkspaceRootConfig {
  path: string | null;
  name: string | null;
  hasGit: boolean;
  updatedAt: string | null;
}

export interface LocalWorkspaceConfig {
  wikiRepo: WorkspaceRootConfig;
  sourceLibrary: WorkspaceRootConfig;
}

type WorkspaceKey = keyof LocalWorkspaceConfig;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, '../../.local/workspace-roots.json');

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function normalizeRoot(raw?: Partial<WorkspaceRootConfig>): WorkspaceRootConfig {
  return {
    path: raw?.path ?? null,
    name: raw?.name ?? null,
    hasGit: raw?.hasGit ?? false,
    updatedAt: raw?.updatedAt ?? null,
  };
}

function normalizeConfig(raw?: Partial<LocalWorkspaceConfig>): LocalWorkspaceConfig {
  return {
    wikiRepo: normalizeRoot(raw?.wikiRepo),
    sourceLibrary: normalizeRoot(raw?.sourceLibrary),
  };
}

export function getLocalWorkspaceConfig(): LocalWorkspaceConfig {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return normalizeConfig();
    }
    const raw = JSON.parse(
      fs.readFileSync(STORE_PATH, 'utf-8'),
    ) as Partial<LocalWorkspaceConfig>;
    return normalizeConfig(raw);
  } catch {
    return normalizeConfig();
  }
}

function validateDirectoryPath(rootPath: string): WorkspaceRootConfig {
  const resolved = path.resolve(rootPath);
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error('Selected path must be a directory');
  }

  const hasGit = fs.existsSync(path.join(resolved, '.git'));
  return {
    path: resolved,
    name: path.basename(resolved),
    hasGit,
    updatedAt: new Date().toISOString(),
  };
}

function writeConfig(config: LocalWorkspaceConfig) {
  ensureStoreDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(config, null, 2));
}

export function setWorkspaceRoot(
  key: WorkspaceKey,
  rootPath: string,
): LocalWorkspaceConfig {
  const config = getLocalWorkspaceConfig();
  config[key] = validateDirectoryPath(rootPath);
  writeConfig(config);
  return config;
}

export function clearWorkspaceRoot(key: WorkspaceKey): LocalWorkspaceConfig {
  const config = getLocalWorkspaceConfig();
  config[key] = normalizeRoot();
  writeConfig(config);
  return config;
}
