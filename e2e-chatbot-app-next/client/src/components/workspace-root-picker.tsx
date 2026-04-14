import { useEffect, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { fetchWithErrorHandlers } from '@/lib/utils';

type WorkspaceRootKind = 'wikiRepo' | 'sourceLibrary';

const ROOT_COPY: Record<
  WorkspaceRootKind,
  {
    title: string;
    helper: string;
    placeholder: string;
    browseEndpoint: string;
    clearLabel: string;
    saveLabel: string;
    activeLabel: string;
  }
> = {
  wikiRepo: {
    title: 'Select Brain Vault',
    helper: 'Choose the local vault where Second Brain maintains its curated markdown memory.',
    placeholder: '/Users/you/path/to/brain-vault',
    browseEndpoint: '/api/config/wiki-repo/browse',
    clearLabel: 'Clear Brain Vault',
    saveLabel: 'Use Brain Vault',
    activeLabel: 'Active brain vault',
  },
  sourceLibrary: {
    title: 'Select Source Shelf',
    helper: 'Choose the read-only directory that holds notes, clippings, and source material.',
    placeholder: '/Users/you/path/to/source-shelf',
    browseEndpoint: '/api/config/source-library/browse',
    clearLabel: 'Clear Source Shelf',
    saveLabel: 'Use Source Shelf',
    activeLabel: 'Active source shelf',
  },
};

export function WorkspaceRootPicker({
  kind,
  open,
  onOpenChange,
}: {
  kind: WorkspaceRootKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    wikiRepo,
    sourceLibrary,
    setWikiRepoPath,
    setSourceLibraryPath,
  } = useAppConfig();
  const copy = ROOT_COPY[kind];
  const root = kind === 'wikiRepo' ? wikiRepo : sourceLibrary;
  const setRootPath = kind === 'wikiRepo' ? setWikiRepoPath : setSourceLibraryPath;
  const [path, setPath] = useState(root?.path ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);

  useEffect(() => {
    if (open) {
      setPath(root?.path ?? '');
      setError(null);
    }
  }, [open, root?.path]);

  const helperText = useMemo(() => {
    if (!root?.path) {
      return copy.helper;
    }
    return `Currently scoped to ${root.path}`;
  }, [copy.helper, root?.path]);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await setRootPath(path.trim() || null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setError(null);
    setIsSaving(true);
    try {
      setPath('');
      await setRootPath(null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBrowse() {
    setError(null);
    setIsBrowsing(true);
    try {
      const response = await fetchWithErrorHandlers(copy.browseEndpoint, {
        method: 'POST',
      });
      if (response.status === 204) {
        return;
      }

      const payload = (await response.json()) as {
        wikiRepo: { path: string | null };
        sourceLibrary: { path: string | null };
      };
      setPath(
        kind === 'wikiRepo'
          ? (payload.wikiRepo?.path ?? '')
          : (payload.sourceLibrary?.path ?? ''),
      );
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBrowsing(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[#5b4937] bg-[#18130f] text-[#f5eee2] shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[#bca890]">
            {helperText}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder={copy.placeholder}
              className="border-[#5b4937] bg-[#241c16] text-[#f5eee2] placeholder:text-[#9a866d]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleBrowse()}
              disabled={isBrowsing || isSaving}
              className="shrink-0 border-[#5b4937] bg-[#241c16] text-[#f5eee2] hover:bg-[#2d231b] hover:text-white"
            >
              {isBrowsing ? 'Opening...' : 'Browse...'}
            </Button>
          </div>
          <div className="text-xs text-[#a99781]">
            Browse opens your system folder picker. Manual path entry is still available if needed.
          </div>
          {root?.path ? (
            <div className="rounded-xl border border-[#4e3f31] bg-[#211913] px-3 py-2 text-xs text-[#d9cab3]">
              {copy.activeLabel}: {root.path}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-[#5b4937] bg-transparent text-[#f5eee2] hover:bg-[#2b221b] hover:text-white">
            Cancel
          </AlertDialogCancel>
          {root?.path ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleClear()}
              disabled={isSaving || isBrowsing}
              className="border-[#5b4937] bg-transparent text-[#e4d8c7] hover:bg-[#2b221b] hover:text-white"
            >
              {copy.clearLabel}
            </Button>
          ) : null}
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleSave();
            }}
            className="bg-[#e8dcc6] text-[#120f0b] hover:bg-[#f5e8d4]"
          >
            {isSaving ? 'Saving...' : copy.saveLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
