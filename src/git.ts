import { join } from 'path';
import { rmSync } from 'fs';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import type { ParsedSource } from './types.js';

export function parseSource(input: string): ParsedSource {
  const githubTreeMatch = input.match(
    /github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/
  );
  if (githubTreeMatch) {
    const [, owner, repo, , subpath] = githubTreeMatch;
    return {
      type: 'github',
      url: `https://github.com/${owner}/${repo}.git`,
      subpath,
    };
  }

  const githubRepoMatch = input.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (githubRepoMatch) {
    const [, owner, repo] = githubRepoMatch;
    const cleanRepo = repo!.replace(/\.git$/, '');
    return {
      type: 'github',
      url: `https://github.com/${owner}/${cleanRepo}.git`,
    };
  }

  const gitlabTreeMatch = input.match(
    /gitlab\.com\/([^/]+)\/([^/]+)\/-\/tree\/([^/]+)\/(.+)/
  );
  if (gitlabTreeMatch) {
    const [, owner, repo, , subpath] = gitlabTreeMatch;
    return {
      type: 'gitlab',
      url: `https://gitlab.com/${owner}/${repo}.git`,
      subpath,
    };
  }

  const gitlabRepoMatch = input.match(/gitlab\.com\/([^/]+)\/([^/]+)/);
  if (gitlabRepoMatch) {
    const [, owner, repo] = gitlabRepoMatch;
    const cleanRepo = repo!.replace(/\.git$/, '');
    return {
      type: 'gitlab',
      url: `https://gitlab.com/${owner}/${cleanRepo}.git`,
    };
  }

  const shorthandMatch = input.match(/^([^/]+)\/([^/]+)(?:\/(.+))?$/);
  if (shorthandMatch && !input.includes(':')) {
    const [, owner, repo, subpath] = shorthandMatch;
    return {
      type: 'github',
      url: `https://github.com/${owner}/${repo}.git`,
      subpath,
    };
  }

  return {
    type: 'git',
    url: input,
  };
}

export async function cloneRepo(url: string): Promise<string> {
  const tempDir = join(tmpdir(), `give-skill-${Date.now()}`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('git', ['clone', '--depth', '1', url, tempDir], {
      stdio: 'pipe',
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to clone repository: ${url}`));
    });

    proc.on('error', reject);
  });

  return tempDir;
}

export async function cleanupTempDir(dir: string): Promise<void> {
  rmSync(dir, { recursive: true, force: true });
}
