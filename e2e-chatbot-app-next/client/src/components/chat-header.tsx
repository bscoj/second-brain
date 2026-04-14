import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import {
  BookOpenCheck,
  Cpu,
  FolderOpen,
  LibraryBig,
  MessageSquareOff,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react';
import { useConfig } from '@/hooks/use-config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlusIcon, CloudOffIcon } from './icons';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/skeleton';
import { ProfileSheet } from './profile-sheet';
import { ModelPicker } from './model-picker';
import { WorkspaceRootPicker } from './workspace-root-picker';
import { toast } from './toast';

const DOCS_URL =
  'https://docs.databricks.com/aws/en/generative-ai/agent-framework/chat-app';

const OBO_DOCS_URL =
  'https://docs.databricks.com/aws/en/generative-ai/agent-framework/chat-app#enable-user-authorization';

function OboScopeBanner({ missingScopes }: { missingScopes: string[] }) {
  if (missingScopes.length === 0) return null;

  return (
    <div className="w-full border-b border-red-500/20 bg-red-50 dark:bg-red-950/20 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        <p className="text-sm text-red-700 dark:text-red-400">
          This endpoint requires on-behalf-of user authorization. Add these
          scopes to your app:{' '}
          <strong>{missingScopes.join(', ')}</strong>.{' '}
          <a
            href={OBO_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}

export function ChatHeader({
  title,
  empty,
  isLoadingTitle,
  selectedModel,
  onSelectModel,
}: {
  title?: string;
  empty?: boolean;
  isLoadingTitle?: boolean;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}) {
  const navigate = useNavigate();
  const {
    chatHistoryEnabled,
    feedbackEnabled,
    oboMissingScopes,
    wikiRepo,
    sourceLibrary,
    models,
    initializeWiki,
  } = useConfig();
  const [wikiPickerOpen, setWikiPickerOpen] = useState(false);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [isInitializingWiki, setIsInitializingWiki] = useState(false);
  const modelLabel = selectedModel ?? models?.defaultModel ?? 'Select Model';

  async function handleInitializeWiki() {
    setIsInitializingWiki(true);
    try {
      const result = await initializeWiki();
      const created = result.created.length;
      const skipped = result.skipped.length;
      toast({
        type: 'success',
        description:
          created > 0
            ? `Seeded the brain vault with ${created} new item${created === 1 ? '' : 's'}${skipped > 0 ? ` and kept ${skipped} existing item${skipped === 1 ? '' : 's'} intact` : ''}.`
            : 'This brain vault already looks initialized. Existing files were left untouched.',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsInitializingWiki(false);
    }
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-20 flex h-[64px] items-center gap-2 bg-[linear-gradient(180deg,rgba(24,19,15,0.92),rgba(24,19,15,0.72))] px-4 backdrop-blur-xl',
          {
            'border-b border-white/[0.08]': !empty,
          },
        )}
      >
        <div className="md:hidden">
          <SidebarToggle forceOpenIcon />
        </div>

        {(title || isLoadingTitle) && (
          <h4 className="truncate text-[15px] font-medium tracking-[0.01em] text-white/90">
            {isLoadingTitle ? (
              <Skeleton className="h-5 w-32 bg-[#f5e7d1]/[0.08]" />
            ) : (
              title
            )}
          </h4>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 max-w-[220px] rounded-full border-[#5a4a39] bg-[#241c16]/80 px-3 text-xs text-[#f1e5d3] hover:bg-[#2c221b] hover:text-white"
            onClick={() => setModelPickerOpen(true)}
          >
            <Cpu className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{modelLabel}</span>
          </Button>
          <Button
            variant="outline"
            className="h-9 max-w-[200px] rounded-full border-[#5a4a39] bg-[#241c16]/80 px-3 text-xs text-[#f1e5d3] hover:bg-[#2c221b] hover:text-white"
            onClick={() => setWikiPickerOpen(true)}
          >
            <LibraryBig className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{wikiRepo?.name ?? 'Brain Vault'}</span>
          </Button>
          <Button
            variant="outline"
            className="h-9 max-w-[220px] rounded-full border-[#5a4a39] bg-[#241c16]/80 px-3 text-xs text-[#f1e5d3] hover:bg-[#2c221b] hover:text-white"
            onClick={() => setSourcePickerOpen(true)}
          >
            <FolderOpen className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {sourceLibrary?.name ?? 'Source Shelf'}
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-full border-[#866742] bg-[#c99d62] px-3 text-xs text-[#1a120c] hover:bg-[#d4aa73] hover:text-[#120f0b] disabled:opacity-45"
            onClick={() => void handleInitializeWiki()}
            disabled={!wikiRepo?.path || isInitializingWiki}
          >
            <BookOpenCheck className="mr-1.5 h-3.5 w-3.5 text-white/72" />
            {isInitializingWiki ? 'Initializing...' : 'Seed Vault'}
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-full border-[#5a4a39] bg-[linear-gradient(180deg,rgba(255,242,220,0.08),rgba(255,242,220,0.03))] px-3 text-xs text-[#f2e7d7] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[linear-gradient(180deg,rgba(255,242,220,0.12),rgba(255,242,220,0.05))] hover:text-white"
            onClick={() => setProfileOpen(true)}
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-white/72" />
            Memory
          </Button>
          {!chatHistoryEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-foreground/80 text-xs hover:bg-white/[0.08] hover:text-foreground"
                  >
                    <CloudOffIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">Ephemeral</span>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chat history disabled — conversations are not saved. Click to learn more.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!feedbackEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-foreground/80 text-xs hover:bg-white/[0.08] hover:text-foreground"
                  >
                    <MessageSquareOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Feedback disabled</span>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Feedback submission disabled. Click to learn more.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="default"
            className="order-2 ml-auto h-9 rounded-full bg-[#eadcc8] px-3 text-[#140f0b] hover:bg-[#f4e7d4] md:hidden"
            onClick={() => {
              navigate('/');
            }}
          >
            <PlusIcon />
            <span>New Chat</span>
          </Button>
        </div>
      </header>

      <OboScopeBanner missingScopes={oboMissingScopes} />
      <WorkspaceRootPicker
        kind="wikiRepo"
        open={wikiPickerOpen}
        onOpenChange={setWikiPickerOpen}
      />
      <WorkspaceRootPicker
        kind="sourceLibrary"
        open={sourcePickerOpen}
        onOpenChange={setSourcePickerOpen}
      />
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <ModelPicker
        open={modelPickerOpen}
        onOpenChange={setModelPickerOpen}
        selectedModel={selectedModel ?? ''}
        onSelectModel={(model) => {
          onSelectModel?.(model);
          setModelPickerOpen(false);
        }}
      />
    </>
  );
}
