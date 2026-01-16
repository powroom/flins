import { join } from 'path';
import { rmSync } from 'fs';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import type { ParsedSource } from './types.js';

export function parseSource(input: string): ParsedSource {
  const githubTreeMatch = input.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+))?$/);
  if (githubTreeMatch) {
    const [, owner, repo, branch, subpath] = githubTreeMatch;
    return {
      type: 'github',
      url: `https://github.com/${owner}/${repo}.git`,
      branch,
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

  const gitlabTreeMatch = input.match(/gitlab\.com\/([^/]+)\/([^/]+)\/-\/tree\/([^/]+)(?:\/(.+))?$/);
  if (gitlabTreeMatch) {
    const [, owner, repo, branch, subpath] = gitlabTreeMatch;
    return {
      type: 'gitlab',
      url: `https://gitlab.com/${owner}/${repo}.git`,
      branch,
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

export async function cloneRepo(url: string, branch?: string): Promise<string> {
  const tempDir = join(tmpdir(), `give-skill-${Date.now()}`);

  const args = ['clone', '--depth', '1'];
  if (branch) {
    args.push('--branch', branch);
  }
  args.push(url, tempDir);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('git', args, {
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

export async function getLatestCommit(url: string, branch = 'main'): Promise<string> {
  const result = await new Promise<string>((resolve, reject) => {
    let output = '';
    const proc = spawn('git', ['ls-remote', url, `refs/heads/${branch}`], { stdio: 'pipe' });

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim().split(/\s+/)[0] ?? '');
      } else {
        reject(new Error(`Failed to get latest commit from ${url}`));
      }
    });

    proc.on('error', reject);
  });

  return result;
}

export async function getCommitHash(repoPath: string): Promise<string> {
  const result = await new Promise<string>((resolve, reject) => {
    let output = '';
    const proc = spawn('git', ['rev-parse', 'HEAD'], { cwd: repoPath, stdio: 'pipe' });

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        reject(new Error('Failed to get commit hash'));
      }
    });

    proc.on('error', reject);
  });

  return result;
}

export async function cleanupTempDir(dir: string): Promise<void> {
  rmSync(dir, { recursive: true, force: true });
}
