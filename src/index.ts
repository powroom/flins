#!/usr/bin/env node

import { program } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { performInstallation } from './install-service.js';
import { performUpdate, checkStatus, displayStatus, cleanOrphaned as cleanOrphanedService } from './update-service.js';
import packageJson from '../package.json' with { type: 'json' };

const version = packageJson.version;

interface Options {
  global?: boolean;
  agent?: string[];
  yes?: boolean;
  skill?: string[];
  list?: boolean;
}

interface UpdateOptions {
  yes?: boolean;
}

program
  .name('give-skill')
  .description('Install skills onto coding agents (Claude Code, Cursor, Copilot, Gemini, Windsurf, Trae, Factory, Letta, OpenCode, Codex, Antigravity, Amp, Kilo, Roo, Goose)')
  .version(version)
  .argument('<source>', 'Git repo URL, GitHub shorthand (owner/repo), or direct path to skill')
  .option('-g, --global', 'Install skill globally (user-level) instead of project-level')
  .option('-a, --agent <agents...>', 'Specify agents to install to (windsurf, gemini, claude-code, cursor, copilot, etc.)')
  .option('-s, --skill <skills...>', 'Specify skill names to install (skip selection prompt)')
  .option('-l, --list', 'List available skills in the repository without installing')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (source: string, options: Options) => {
    await main(source, options);
  });

program
  .command('update [skills...]')
  .description('Update installed skills to their latest versions')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (skills: string[], options: UpdateOptions) => {
    await updateCommand(skills, options);
  });

program
  .command('status [skills...]')
  .description('Check status of installed skills (updates available, orphaned, etc.)')
  .action(async (skills: string[]) => {
    await statusCommand(skills);
  });

program
  .command('clean')
  .description('Remove orphaned skill entries from state')
  .action(async () => {
    await cleanCommand();
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

async function updateCommand(skills: string[], options: UpdateOptions) {
  console.log();
  p.intro(pc.bgCyan(pc.black(' give-skill ')));

  try {
    await performUpdate(skills.length > 0 ? skills : undefined, options);
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    p.outro(pc.red('Update failed'));
    process.exit(1);
  }
}

async function statusCommand(skills: string[]) {
  console.log();
  p.intro(pc.bgCyan(pc.black(' give-skill ')));

  try {
    const results = await checkStatus(skills.length > 0 ? skills : undefined);
    await displayStatus(results);
    p.outro('Done!');
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    p.outro(pc.red('Status check failed'));
    process.exit(1);
  }
}

async function cleanCommand() {
  console.log();
  p.intro(pc.bgCyan(pc.black(' give-skill ')));

  try {
    await cleanOrphanedService();
    console.log();
    p.outro(pc.green('Done!'));
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    p.outro(pc.red('Clean failed'));
    process.exit(1);
  }
}
