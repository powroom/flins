import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { getAllSkills, removeSkillInstallation } from './state.js';
import { agents } from './agents.js';
import type { SkillInstallation } from './types.js';

function resolveInstallationPath(installation: SkillInstallation): string {
  return installation.type === 'global'
    ? installation.path
    : resolve(process.cwd(), installation.path);
}

interface RemoveResult {
  skillName: string;
  success: boolean;
  removed: number;
  failed: number;
  installations: Array<{ agent: string; path: string; removed: boolean; error?: string }>;
}

interface RemoveOptions {
  agent?: string[];
  global?: boolean;
  yes?: boolean;
}

async function removeSkillDirectory(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function performRemove(skillNames: string[] = [], options: RemoveOptions = {}): Promise<RemoveResult[]> {
  const state = getAllSkills();
  const results: RemoveResult[] = [];

  if (Object.keys(state.skills).length === 0) {
    p.log.warn('No skills tracked. Install skills with:');
    console.log();
    p.log.message(`  ${pc.cyan('npx give-skill <repo>')}`);
    console.log();
    return [];
  }

  const allSkills = Object.entries(state.skills).map(([skillName, skillState]) => ({
    skillName,
    state: skillState,
  }));

  let skillsToRemove: typeof allSkills;

  if (skillNames.length > 0) {
    const nameSet = new Set(skillNames.map(n => n.toLowerCase()));
    skillsToRemove = allSkills.filter(({ skillName }) => nameSet.has(skillName.toLowerCase()));
  } else {
    // No skill names specified - show multiselect of all installed skills
    const allChoices = allSkills.map(({ skillName, state }) => {
      const validInstallations = state.installations
        .map(inst => ({ installation: inst, resolvedPath: resolveInstallationPath(inst) }))
        .filter(({ resolvedPath }) => existsSync(resolvedPath));

      return {
        value: skillName,
        label: skillName,
        hint: validInstallations.length > 0
          ? `${validInstallations.length} installation${validInstallations.length !== 1 ? 's' : ''}`
          : 'no valid installations',
      };
    });

    // Filter out skills with no valid installations
    const validChoices = allChoices.filter(c => c.hint !== 'no valid installations');

    if (validChoices.length === 0) {
      p.log.warn('No valid installations found');
      return [];
    }

    if (options.yes) {
      skillsToRemove = allSkills.filter(({ skillName }) =>
        validChoices.some(c => c.value === skillName)
      );
    } else {
      const selected = await p.multiselect({
        message: 'Select skills to remove',
        options: validChoices,
        required: true,
        initialValues: validChoices.map(c => c.value),
      });

      if (p.isCancel(selected)) {
        p.cancel('Remove cancelled');
        return [];
      }

      const selectedNames = selected as string[];
      skillsToRemove = allSkills.filter(({ skillName }) => selectedNames.includes(skillName));
    }
  }

  if (skillsToRemove.length === 0) {
    if (skillNames.length > 0) {
      p.log.error(`No matching skills found for: ${skillNames.join(', ')}`);
      p.log.info('Tracked skills:');
      for (const s of allSkills) {
        p.log.message(`  - ${pc.cyan(s.skillName)}`);
      }
    }
    return [];
  }

  console.log();
  p.log.step(pc.bold('Skills to Remove'));

  const toRemove: Array<{ skillName: string; installations: Array<{ installation: typeof allSkills[0]['state']['installations'][number]; resolvedPath: string }> }> = [];

  for (const { skillName, state: skillState } of skillsToRemove) {
    let installations = skillState.installations;

    if (options.agent && options.agent.length > 0) {
      const agentSet = new Set(options.agent);
      installations = installations.filter(i => agentSet.has(i.agent));
    }

    if (options.global !== undefined) {
      const scope = options.global ? 'global' : 'project';
      installations = installations.filter(i => i.type === scope);
    }

    const validInstallations = installations
      .map(inst => ({ installation: inst, resolvedPath: resolveInstallationPath(inst) }))
      .filter(({ resolvedPath }) => existsSync(resolvedPath));

    if (validInstallations.length > 0) {
      toRemove.push({ skillName, installations: validInstallations });
      p.log.message(`  ${pc.cyan(skillName)}`);
      for (const { resolvedPath } of validInstallations) {
        p.log.message(`    ${pc.dim('→')} ${resolvedPath}`);
      }
    }
  }

  if (toRemove.length === 0) {
    p.log.warn('No installations match the specified criteria');
    return [];
  }

  // Skip second multiselect if we already showed one (no skill names provided)
  const skipSecondMultiselect = skillNames.length === 0;

  let selectedToRemove: string[];

  if (options.yes || skipSecondMultiselect) {
    selectedToRemove = toRemove.map(({ skillName }) => skillName);
  } else {
    const removeChoices = toRemove.map(({ skillName, installations }) => ({
      value: skillName,
      label: skillName,
      hint: `${installations.length} installation${installations.length !== 1 ? 's' : ''}`,
    }));

    const selected = await p.multiselect({
      message: 'Select skills to remove',
      options: removeChoices,
      required: true,
      initialValues: toRemove.map(({ skillName }) => skillName),
    });

    if (p.isCancel(selected)) {
      p.cancel('Remove cancelled');
      return [];
    }

    selectedToRemove = selected as string[];
  }

  console.log();
  p.log.step(pc.bold('Will Remove'));
  for (const skillName of selectedToRemove) {
    const item = toRemove.find(r => r.skillName === skillName);
    if (item) {
      p.log.message(`  ${pc.cyan(item.skillName)}`);
      for (const { resolvedPath } of item.installations) {
        p.log.message(`    ${pc.dim('→')} ${resolvedPath}`);
      }
    }
  }
  console.log();

  if (!options.yes) {
    const confirmed = await p.confirm({ message: 'Remove these skills?' });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Remove cancelled');
      return [];
    }
  }

  const spinner = p.spinner();
  spinner.start(`Removing ${selectedToRemove.length} skill${selectedToRemove.length > 1 ? 's' : ''}...`);

  for (const { skillName, installations } of toRemove) {
    if (!selectedToRemove.includes(skillName)) {
      continue;
    }
    const result: RemoveResult = {
      skillName,
      success: true,
      removed: 0,
      failed: 0,
      installations: [],
    };

    for (const { installation, resolvedPath } of installations) {
      const removeResult = await removeSkillDirectory(resolvedPath);

      result.installations.push({
        agent: agents[installation.agent].displayName,
        path: resolvedPath,
        removed: removeResult.success,
        error: removeResult.error,
      });

      if (removeResult.success) {
        result.removed++;
        removeSkillInstallation(skillName, installation.agent, installation.path);
      } else {
        result.failed++;
        result.success = false;
      }
    }

    results.push(result);
  }

  spinner.stop('Remove complete');

  console.log();
  const successful = results.filter(r => r.success && r.removed > 0);
  const failed = results.filter(r => !r.success || r.failed > 0);

  if (successful.length > 0) {
    p.log.success(pc.green(`Removed ${successful.length} skill${successful.length !== 1 ? 's' : ''}`));
    for (const r of successful) {
      p.log.message(`  ${pc.green('✓')} ${pc.cyan(r.skillName)}`);
      p.log.message(`    ${pc.dim(`${r.removed} installation${r.removed !== 1 ? 's' : ''} removed`)}`);
    }
  }

  if (failed.length > 0) {
    console.log();
    p.log.error(pc.red(`Failed to remove ${failed.length} skill${failed.length !== 1 ? 's' : ''}`));
    for (const r of failed) {
      p.log.message(`  ${pc.red('✗')} ${pc.cyan(r.skillName)}`);
      for (const inst of r.installations.filter(i => !i.removed)) {
        if (inst.error) {
          p.log.message(`    ${pc.dim(inst.error)}`);
        }
      }
    }
  }

  console.log();
  p.outro(pc.green('Done!'));

  return results;
}

export async function listRemovableSkills(): Promise<void> {
  const state = getAllSkills();

  if (Object.keys(state.skills).length === 0) {
    p.log.warn('No skills tracked. Install skills with:');
    console.log();
    p.log.message(`  ${pc.cyan('npx give-skill <repo>')}`);
    console.log();
    return;
  }

  console.log();
  p.log.step(pc.bold('Installed Skills'));

  for (const [skillName, skillState] of Object.entries(state.skills)) {
    p.log.message(`${pc.cyan(skillName)}`);

    const validInstallations = skillState.installations
      .map(inst => ({ installation: inst, resolvedPath: resolveInstallationPath(inst) }))
      .filter(({ resolvedPath }) => existsSync(resolvedPath));

    if (validInstallations.length > 0) {
      p.log.message(`  ${pc.dim('Installed in:')}`);
      for (const { installation, resolvedPath } of validInstallations) {
        const scope = installation.type === 'global' ? 'global' : 'project';
        p.log.message(`    ${pc.dim('•')} ${agents[installation.agent].displayName} ${pc.dim(`(${scope})`)}: ${pc.dim(resolvedPath)}`);
      }
    }

    console.log();
  }
}
