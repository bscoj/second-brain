import { createContext, useContext, type ReactNode } from 'react';
import useSWR from 'swr';
import { fetchWithErrorHandlers, fetcher } from '@/lib/utils';

interface WorkspaceRootConfig {
  path: string | null;
  name: string | null;
  hasGit: boolean;
  updatedAt: string | null;
}

interface ModelConfig {
  defaultModel: string | null;
  availableModels: string[];
}

interface StorageConfig {
  agentRoot: string;
  conversationMemoryDbPath: string;
  localChatHistoryPath: string;
}

interface ConfigResponse {
  features: {
    chatHistory: boolean;
    feedback: boolean;
  };
  wikiRepo: WorkspaceRootConfig;
  sourceLibrary: WorkspaceRootConfig;
  models: ModelConfig;
  storage: StorageConfig;
  obo?: {
    missingScopes: string[];
  };
}

interface AppConfigContextType {
  config: ConfigResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
  chatHistoryEnabled: boolean;
  feedbackEnabled: boolean;
  oboMissingScopes: string[];
  wikiRepo: WorkspaceRootConfig | undefined;
  sourceLibrary: WorkspaceRootConfig | undefined;
  hasWikiRepoConfigured: boolean;
  models: ModelConfig | undefined;
  storage: StorageConfig | undefined;
  setWikiRepoPath: (path: string | null) => Promise<void>;
  setSourceLibraryPath: (path: string | null) => Promise<void>;
  initializeWiki: () => Promise<{ created: string[]; skipped: string[] }>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(
  undefined,
);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<ConfigResponse>(
    '/api/config',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    },
  );

  async function updateWorkspaceRoot(
    endpoint: '/api/config/wiki-repo' | '/api/config/source-library',
    key: 'wikiRepo' | 'sourceLibrary',
    path: string | null,
  ) {
    const response = await fetchWithErrorHandlers(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });
    const payload = (await response.json()) as ConfigResponse;
    await mutate(
      (current) =>
        current
          ? {
              ...current,
              [key]: payload[key],
            }
          : current,
      false,
    );
  }

  async function setWikiRepoPath(path: string | null) {
    await updateWorkspaceRoot('/api/config/wiki-repo', 'wikiRepo', path);
  }

  async function setSourceLibraryPath(path: string | null) {
    await updateWorkspaceRoot('/api/config/source-library', 'sourceLibrary', path);
  }

  async function initializeWiki() {
    const response = await fetchWithErrorHandlers('/api/config/wiki/initialize', {
      method: 'POST',
    });
    return (await response.json()) as { created: string[]; skipped: string[] };
  }

  const value: AppConfigContextType = {
    config: data,
    isLoading,
    error,
    chatHistoryEnabled: data?.features.chatHistory ?? true,
    feedbackEnabled: data?.features.feedback ?? false,
    oboMissingScopes: data?.obo?.missingScopes ?? [],
    wikiRepo: data?.wikiRepo,
    sourceLibrary: data?.sourceLibrary,
    hasWikiRepoConfigured: !!data?.wikiRepo?.path,
    models: data?.models,
    storage: data?.storage,
    setWikiRepoPath,
    setSourceLibraryPath,
    initializeWiki,
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
}
