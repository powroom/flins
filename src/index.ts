#!/usr/bin/env node

import { program } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { performInstallation } from './install-service.js';
import packageJson from '../package.json' with { type: 'json' };

const version = packageJson.version;

interface Options {
  global?: boolean;
  agent?: string[];
  yes?: boolean;
  skill?: string[];
  list?: boolean;
}

program
  .name('give-skill')
  .description('Install skills onto coding agents (OpenCode, Claude Code, Codex, Cursor, Antigravity, GitHub Copilot)')
  .version(version)
  .argument('<source>', 'Git repo URL, GitHub shorthand (owner/repo), or direct path to skill')
  .option('-g, --global', 'Install skill globally (user-level) instead of project-level')
  .option('-a, --agent <agents...>', 'Specify agents to install to (opencode, claude-code, codex, cursor, copilot)')
  .option('-s, --skill <skills...>', 'Specify skill names to install (skip selection prompt)')
  .option('-l, --list', 'List available skills in the repository without installing')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (source: string, options: Options) => {
    await main(source, options);
  });

program.parse();

async function main(source: string, options: Options) {
  console.log();
  p.intro(pc.bgCyan(pc.black(' give-skill ')));

  try {
    const result = await performInstallation(source, options);

    if (!result.success && result.installed === 0 && result.failed === 0) {
      process.exit(1);
    }

    if (result.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    p.outro(pc.red('Installation failed'));
    process.exit(1);
  }
}
