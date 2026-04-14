import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function trimOutput(value: string | undefined) {
  return value?.trim() || '';
}

async function pickWindowsFolder(prompt: string) {
  const script = [
    'Add-Type -AssemblyName System.Windows.Forms',
    '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
    `$dialog.Description = "${prompt.replace(/"/g, '\\"')}"`,
    '$dialog.ShowNewFolderButton = $false',
    'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {',
    '  Write-Output $dialog.SelectedPath',
    '}',
  ].join('; ');

  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-STA',
    '-Command',
    script,
  ]);
  return trimOutput(stdout);
}

async function pickMacFolder(prompt: string) {
  const { stdout } = await execFileAsync('osascript', [
    '-e',
    `set chosenFolder to choose folder with prompt "${prompt.replace(/"/g, '\\"')}"`,
    '-e',
    'POSIX path of chosenFolder',
  ]);
  return trimOutput(stdout);
}

async function pickLinuxFolder(prompt: string) {
  const attempts: Array<[string, string[]]> = [
    ['zenity', ['--file-selection', '--directory', `--title=${prompt}`]],
    ['kdialog', ['--getexistingdirectory', process.cwd(), '--title', prompt]],
  ];

  for (const [command, args] of attempts) {
    try {
      const { stdout } = await execFileAsync(command, args);
      const value = trimOutput(stdout);
      if (value) {
        return value;
      }
    } catch {
      // Try the next picker.
    }
  }

  throw new Error('No supported native folder picker is available on this machine');
}

export async function pickFolder(prompt = 'Select folder') {
  switch (os.platform()) {
    case 'win32':
      return pickWindowsFolder(prompt);
    case 'darwin':
      return pickMacFolder(prompt);
    default:
      return pickLinuxFolder(prompt);
  }
}
