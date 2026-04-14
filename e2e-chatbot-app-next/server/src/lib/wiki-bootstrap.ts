import fs from 'node:fs';
import path from 'node:path';

type BootstrapResult = {
  created: string[];
  skipped: string[];
};

function ensureDir(result: BootstrapResult, root: string, relativePath: string) {
  const target = path.join(root, relativePath);
  if (fs.existsSync(target)) {
    result.skipped.push(relativePath);
    return;
  }
  fs.mkdirSync(target, { recursive: true });
  result.created.push(relativePath);
}

function ensureFile(
  result: BootstrapResult,
  root: string,
  relativePath: string,
  content: string,
) {
  const target = path.join(root, relativePath);
  if (fs.existsSync(target)) {
    result.skipped.push(relativePath);
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  result.created.push(relativePath);
}

export function initializeWikiWorkspace(workspaceRoot: string) {
  const root = path.resolve(workspaceRoot);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error('Wiki repo must be an existing directory');
  }

  const result: BootstrapResult = { created: [], skipped: [] };

  for (const dir of [
    'wiki',
    'wiki/entities',
    'wiki/concepts',
    'wiki/topics',
    'wiki/sources',
    'wiki/analyses',
    'raw',
    'raw/inbox',
    'raw/assets',
    'schema',
    'schema/page_templates',
  ]) {
    ensureDir(result, root, dir);
  }

  ensureFile(
    result,
    root,
    'wiki/index.md',
    [
      '# Second Brain Index',
      '',
      '## Overview',
      '- [Overview](./overview.md)',
      '- [Log](./log.md)',
      '',
      '## Sections',
      '- [Entities](./entities/)',
      '- [Concepts](./concepts/)',
      '- [Topics](./topics/)',
      '- [Sources](./sources/)',
      '- [Analyses](./analyses/)',
      '',
      '## Maintenance Notes',
      '- Add new source summaries under `wiki/sources/`.',
      '- Update this index whenever a page is created, renamed, or becomes obsolete.',
      '',
    ].join('\n'),
  );

  ensureFile(
    result,
    root,
    'wiki/log.md',
    [
      '# Wiki Maintenance Log',
      '',
      '| Date | Change | Pages | Source |',
      '| --- | --- | --- | --- |',
      '| _TBD_ | Initialized Second Brain vault | `wiki/index.md`, `wiki/log.md`, `wiki/overview.md` | _none_ |',
      '',
    ].join('\n'),
  );

  ensureFile(
    result,
    root,
    'wiki/overview.md',
    [
      '# Wiki Overview',
      '',
      '## Purpose',
      'This vault is the curated markdown knowledge base maintained by Second Brain.',
      '',
      '## Operating Rules',
      '- Treat `raw/` as read-only source material.',
      '- Store curated conclusions, summaries, and cross-links under `wiki/`.',
      '- Record meaningful maintenance steps in `wiki/log.md`.',
      '- Keep `wiki/index.md` current so file-system search stays practical.',
      '',
    ].join('\n'),
  );

  ensureFile(
    result,
    root,
    'schema/AGENTS.md',
    [
      '# Second Brain Agent Instructions',
      '',
      '## Mission',
      'Maintain this markdown wiki from local source material without editing the source library.',
      '',
      '## Folder Rules',
      '- `raw/` contains immutable source material and assets.',
      '- `wiki/` contains curated markdown pages managed by the assistant.',
      '- `schema/page_templates/` contains reusable page shapes and conventions.',
      '',
      '## Maintenance Checklist',
      '1. Read the relevant source material first.',
      '2. Update or create the minimum set of wiki pages needed.',
      '3. Add cross-links when a page references another canonical concept or entity.',
      '4. Append notable maintenance actions to `wiki/log.md`.',
      '5. Refresh `wiki/index.md` when page coverage changes.',
      '',
    ].join('\n'),
  );

  ensureFile(
    result,
    root,
    'schema/page_templates/source-summary.md',
    [
      '# Source Summary',
      '',
      '## Source Metadata',
      '- Title:',
      '- Author:',
      '- Date:',
      '- Raw file:',
      '',
      '## Key Points',
      '-',
      '',
      '## Evidence',
      '-',
      '',
      '## Linked Pages',
      '-',
      '',
    ].join('\n'),
  );

  ensureFile(
    result,
    root,
    'schema/page_templates/topic-page.md',
    [
      '# Topic',
      '',
      '## Summary',
      '',
      '## Key Facts',
      '-',
      '',
      '## Open Questions',
      '-',
      '',
      '## Related Pages',
      '-',
      '',
      '## Sources',
      '-',
      '',
    ].join('\n'),
  );

  return result;
}
