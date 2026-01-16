import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { cloneRepo, cleanupTempDir, getLatestCommit, getCommitHash } from './git.js';
import { discoverSkills } from './skills.js';
import { installSkillForAgent } from './installer.js';
import { getAllSkills, updateSkillCommit, removeSkillInstallation, cleanOrphanedEntries } from './state.js';
import { agents } from './agents.js';
import type { SkillState, SkillInstallation } from './types.js';

function resolveInstallationPath(installation: SkillInstallation): string {
  return installation.type === 'global'
    ? installation.path
    : resolve(process.cwd(), installation.path);
}

interface StatusResult {
  skillName: string;
  currentCommit: string;
  latestCommit: string;
  status: 'latest' | 'update-available' | 'error' | 'orphaned';
  installations: Array<{ agent: string; path: string; exists: boolean }>;
  error?: string;
}

interface UpdateResult {
  skillName: string;
  success: boolean;
  updated: number;
  failed: number;
  error?: string;
};

async function checkSkillUpdate(skillName: string, skillState: SkillState): Promise<StatusResult> {
  const installations = skillState.installations.map(inst => {
    const resolvedPath = resolveInstallationPath(inst);
    return {
      agent: agents[inst.agent].displayName,
      path: resolvedPath,
      exists: existsSync(resolvedPath),
    };
  });

  const existingInstallations = installations.filter(i => i.exists);
  if (existingInstallations.length === 0) {
    return {
      skillName,
      currentCommit: skillState.commit,
      latestCommit: skillState.commit,
      status: 'orphaned',
      installations,
    };
  }

  try {
    const latestCommit = await getLatestCommit(skillState.url, skillState.branch);
    const isLatest = latestCommit === skillState.commit;

    return {
      skillName,
      currentCommit: skillState.commit,
      latestCommit,
      status: isLatest ? 'latest' : 'update-available',
      installations,
    };
  } catch (error) {
    return {
      skillName,
      currentCommit: skillState.commit,
      latestCommit: skillState.commit,
      status: 'error',
      installations,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkStatus(skillNames?: string[]): Promise<StatusResult[]> {
  const state = getAllSkills();
  const results: StatusResult[] = [];

  const allSkills = Object.entries(state.skills).map(([skillName, skillState]) => ({
    skillName,
    state: skillState,
  }));

  let skillsToCheck: typeof allSkills;

  if (skillNames && skillNames.length > 0) {
    const nameSet = new Set(skillNames.map(n => n.toLowerCase()));
    skillsToCheck = allSkills.filter(({ skillName }) => nameSet.has(skillName.toLowerCase()));
  } else {
    skillsToCheck = allSkills;
  }

  if (skillsToCheck.length === 0) {
    return [];
  }

  const spinner = p.spinner();

  if (skillsToCheck.length === 1) {
    const { skillName, state: skillState } = skillsToCheck[0]!;
    spinner.start(`Checking ${pc.cyan(skillName)}...`);
    const result = await checkSkillUpdate(skillName, skillState);
    spinner.stop(result.status === 'latest' ? pc.green('Up to date') : pc.yellow('Update available'));
    results.push(result);
  } else {
    spinner.start(`Checking ${skillsToCheck.length} skill${skillsToCheck.length > 1 ? 's' : ''}...`);
    for (const { skillName, state: skillState } of skillsToCheck) {
      const result = await checkSkillUpdate(skillName, skillState);
      results.push(result);
    }
    spinner.stop('Check complete');
  }

  return results;
}

export async function performUpdate(skillNames?: string[], options: { yes?: boolean } = {}): Promise<UpdateResult[]> {
  const state = getAllSkills();
  const results: UpdateResult[] = [];

  const allSkills = Object.entries(state.skills).map(([skillName, skillState]) => ({
    skillName,
    state: skillState,
  }));

  let skillsToUpdate: typeof allSkills;

  if (skillNames && skillNames.length > 0) {
    const nameSet = new Set(skillNames.map(n => n.toLowerCase()));
    skillsToUpdate = allSkills.filter(({ skillName }) => nameSet.has(skillName.toLowerCase()));
  } else {
    skillsToUpdate = allSkills;
  }

  if (skillsToUpdate.length === 0) {
    p.log.warn('No skills found to update');
    return [];
  }

  const statusResults = await checkStatus(skillNames);
  const skillsWithUpdates = statusResults.filter(r => r.status === 'update-available');

  if (skillsWithUpdates.length === 0) {
    const orphaned = statusResults.filter(r => r.status === 'orphaned');
    if (orphaned.length > 0) {
      p.log.warn(`${orphaned.length} skill${orphaned.length > 1 ? 's' : ''} have no valid installations`);
      for (const o of orphaned) {
        p.log.message(`  ${pc.yellow('○')} ${pc.cyan(o.skillName)} - all installations removed`);
      }
    }
    p.log.success(pc.green('All skills are up to date'));
    return [];
  }

  console.log();
  p.log.step(pc.bold('Updates Available'));

  const updateChoices = skillsWithUpdates.map(r => ({
    value: r.skillName,
    label: r.skillName,
    hint: `${r.currentCommit.slice(0, 7)} → ${r.latestCommit.slice(0, 7)}`,
  }));

  let selectedToUpdate: string[];

  if (options.yes) {
    selectedToUpdate = skillsWithUpdates.map(r => r.skillName);
  } else {
    const selected = await p.multiselect({
      message: 'Select skills to update',
      options: updateChoices,
      required: true,
      initialValues: skillsWithUpdates.map(r => r.skillName),
    });

    if (p.isCancel(selected)) {
      p.cancel('Update cancelled');
      return [];
    }

    selectedToUpdate = selected as string[];
  }

  console.log();
  p.log.step(pc.bold('Will Update'));
  for (const skillName of selectedToUpdate) {
    const result = skillsWithUpdates.find(r => r.skillName === skillName);
    if (result) {
      p.log.message(`  ${pc.cyan(result.skillName)}`);
      p.log.message(`    ${pc.dim('Current:')} ${pc.yellow(result.currentCommit.slice(0, 7))} ${pc.dim('→')} ${pc.green(result.latestCommit.slice(0, 7))}`);
    }
  }
  console.log();

  if (!options.yes) {
    const confirmed = await p.confirm({ message: 'Proceed with update?' });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Update cancelled');
      return [];
    }
  }

  const spinner = p.spinner();
  spinner.start(`Updating ${selectedToUpdate.length} skill${selectedToUpdate.length > 1 ? 's' : ''}...`);

  for (const { skillName, state: skillState } of skillsToUpdate) {
    const statusResult = statusResults.find(r => r.skillName === skillName);

    if (!statusResult || statusResult.status !== 'update-available') {
      if (statusResult?.status === 'latest') {
        results.push({ skillName, success: true, updated: 0, failed: 0 });
      } else {
        results.push({ skillName, success: false, updated: 0, failed: 0 });
      }
      continue;
    }

    if (!selectedToUpdate.includes(skillName)) {
      continue;
    }

    let tempDir: string | null = null;
    let updatedCount = 0;
    let failedCount = 0;

    try {
      tempDir = await cloneRepo(skillState.url);
      const commit = await getCommitHash(tempDir);

      const searchPath = skillState.subpath ? join(tempDir, skillState.subpath) : tempDir;
      const skills = await discoverSkills(searchPath);

      const matchingSkill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());

      if (!matchingSkill) {
        throw new Error('Skill not found in repository');
      }

      for (const installation of skillState.installations) {
        const resolvedPath = resolveInstallationPath(installation);
        if (!existsSync(resolvedPath)) {
          removeSkillInstallation(skillName, installation.agent, installation.path);
          continue;
        }

        const result = await installSkillForAgent(matchingSkill, installation.agent, {
          global: installation.type === 'global',
        });

        if (result.success) {
          updatedCount++;
        } else {
          failedCount++;
        }
      }

      updateSkillCommit(skillName, commit);

      results.push({
        skillName,
        success: failedCount === 0,
        updated: updatedCount,
        failed: failedCount,
      });
    } catch (error) {
      results.push({
        skillName,
        success: false,
        updated: updatedCount,
        failed: failedCount + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      if (tempDir) {
        await cleanupTempDir(tempDir);
      }
    }
  }

  spinner.stop('Update complete');

  console.log();
  const successful = results.filter(r => r.success && r.updated > 0);
  const failed = results.filter(r => !r.success || r.failed > 0);

  if (successful.length > 0) {
    p.log.success(pc.green(`Updated ${successful.length} skill${successful.length !== 1 ? 's' : ''}`));
    for (const r of successful) {
      p.log.message(`  ${pc.green('✓')} ${pc.cyan(r.skillName)} (${r.updated} installation${r.updated !== 1 ? 's' : ''})`);
    }
  }

  if (failed.length > 0) {
    console.log();
    p.log.error(pc.red(`Failed to update ${failed.length} skill${failed.length !== 1 ? 's' : ''}`));
    for (const r of failed) {
      p.log.message(`  ${pc.red('✗')} ${pc.cyan(r.skillName)}`);
      if (r.error) {
        p.log.message(`    ${pc.dim(r.error)}`);
      }
    }
  }

  console.log();

  if (successful.length > 0) {
    p.outro(pc.green('Done!'));
  } else {
    p.outro(pc.yellow('No skills were updated'));
  }

  return results;
}

export async function displayStatus(statusResults: StatusResult[]): Promise<void> {
  if (statusResults.length === 0) {
    p.log.warn('No skills tracked. Install skills with:');
    console.log();
    p.log.message(`  ${pc.cyan('npx give-skill <repo>')}`);
    console.log();
    return;
  }

  console.log();
  p.log.step(pc.bold('Skills Status'));

  for (const result of statusResults) {
    const statusIcon = {
      latest: pc.green('✓'),
      'update-available': pc.yellow('↓'),
      error: pc.red('✗'),
      orphaned: pc.dim('○'),
    }[result.status];

    const statusText = {
      latest: pc.green('latest'),
      'update-available': pc.yellow('update available'),
      error: pc.red('error'),
      orphaned: pc.dim('orphaned'),
    }[result.status];

    p.log.message(`${statusIcon} ${pc.cyan(result.skillName)}`);
    p.log.message(`    Status: ${statusText}`);

    if (result.status === 'update-available') {
      p.log.message(
        `    ${pc.dim('Commit:')} ${pc.yellow(result.currentCommit.slice(0, 7))} ${pc.dim('→')} ${pc.green(result.latestCommit.slice(0, 7))}`
      );
    } else if (result.status === 'latest') {
      p.log.message(`    ${pc.dim('Commit:')} ${result.currentCommit.slice(0, 7)}`);
    }

    if (result.error) {
      p.log.message(`    ${pc.red(result.error)}`);
    }

    const validInstallations = result.installations.filter(i => i.exists);
    if (validInstallations.length > 0) {
      p.log.message(`    ${pc.dim('Installed in:')}`);
      for (const inst of validInstallations) {
        p.log.message(`      ${pc.dim('•')} ${inst.agent}: ${pc.dim(inst.path)}`);
      }
    }

    const orphanedInstallations = result.installations.filter(i => !i.exists);
    if (orphanedInstallations.length > 0) {
      p.log.message(`    ${pc.yellow('Missing installations:')}`);
      for (const inst of orphanedInstallations) {
        p.log.message(`      ${pc.dim('•')} ${inst.agent}: ${pc.dim(inst.path)}`);
      }
    }

    console.log();
  }
}

export async function cleanOrphaned(): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Checking for orphaned entries...');
  await cleanOrphanedEntries();
  spinner.stop(pc.green('Cleaned up orphaned entries'));
}
