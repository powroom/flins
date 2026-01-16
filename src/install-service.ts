import * as p from '@clack/prompts';
import pc from 'picocolors';
import { parseSource, cloneRepo, cleanupTempDir } from './git.js';
import { discoverSkills, getSkillDisplayName } from './skills.js';
import { installSkillForAgent, isSkillInstalled, getInstallPath } from './installer.js';
import { detectInstalledAgents, agents } from './agents.js';
import type { Skill, AgentType } from './types.js';

interface Options {
  global?: boolean;
  agent?: string[];
  yes?: boolean;
  skill?: string[];
  list?: boolean;
}

interface InstallResult {
  success: boolean;
  installed: number;
  failed: number;
  results: Array<{ skill: string; agent: string; success: boolean; path: string; error?: string }>;
}

interface ServiceContext {
  tempDir: string | null;
  spinner: ReturnType<typeof p.spinner>;
}

export async function performInstallation(
  source: string,
  options: Options
): Promise<InstallResult> {
  const context: ServiceContext = {
    tempDir: null,
    spinner: p.spinner(),
  };

  try {
    context.spinner.start('Parsing source...');
    const parsed = parseSource(source);
    context.spinner.stop(`Source: ${pc.cyan(parsed.url)}${parsed.subpath ? ` (${parsed.subpath})` : ''}`);

    context.spinner.start('Cloning repository...');
    context.tempDir = await cloneRepo(parsed.url);
    context.spinner.stop('Repository cloned');

    context.spinner.start('Discovering skills...');
    const skills = await discoverSkills(context.tempDir, parsed.subpath);

    if (skills.length === 0) {
      context.spinner.stop(pc.red('No skills found'));
      p.outro(pc.red('No valid skills found. Skills require a SKILL.md with name and description.'));
      return { success: false, installed: 0, failed: 0, results: [] };
    }

    context.spinner.stop(`Found ${pc.green(skills.length)} skill${skills.length > 1 ? 's' : ''}`);

    if (options.list) {
      console.log();
      p.log.step(pc.bold('Available Skills'));
      for (const skill of skills) {
        p.log.message(`  ${pc.cyan(getSkillDisplayName(skill))}`);
        p.log.message(`    ${pc.dim(skill.description)}`);
      }
      console.log();
      p.outro('Use --skill <name> to install specific skills');
      return { success: true, installed: 0, failed: 0, results: [] };
    }

    const selectedSkills = await selectSkills(skills, options);
    if (!selectedSkills) {
      return { success: false, installed: 0, failed: 0, results: [] };
    }

    const targetAgents = await selectAgents(options, context);
    if (!targetAgents) {
      return { success: false, installed: 0, failed: 0, results: [] };
    }

    const installGlobally = await determineScope(options);
    if (installGlobally === null) {
      return { success: false, installed: 0, failed: 0, results: [] };
    }

    const confirmed = await showSummaryAndConfirm(options, selectedSkills, targetAgents, installGlobally);
    if (!confirmed) {
      return { success: false, installed: 0, failed: 0, results: [] };
    }

    context.spinner.start('Installing skills...');
    const results = await performParallelInstall(selectedSkills, targetAgents, installGlobally);
    context.spinner.stop('Installation complete');

    return results;

  } finally {
    if (context.tempDir) {
      await cleanupTempDir(context.tempDir);
    }
  }
}

async function selectSkills(
  skills: Skill[],
  options: Options
): Promise<Skill[] | null> {
  let selectedSkills: Skill[];

  if (options.skill && options.skill.length > 0) {
    selectedSkills = skills.filter(s =>
      options.skill!.some(name =>
        s.name.toLowerCase() === name.toLowerCase() ||
        getSkillDisplayName(s).toLowerCase() === name.toLowerCase()
      )
    );

    if (selectedSkills.length === 0) {
      p.log.error(`No matching skills found for: ${options.skill.join(', ')}`);
      p.log.info('Available skills:');
      for (const s of skills) {
        p.log.message(`  - ${getSkillDisplayName(s)}`);
      }
      return null;
    }

    p.log.info(`Selected ${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''}: ${selectedSkills.map(s => pc.cyan(getSkillDisplayName(s))).join(', ')}`);
  } else if (skills.length === 1) {
    selectedSkills = skills;
    const firstSkill = skills[0]!;
    p.log.info(`Skill: ${pc.cyan(getSkillDisplayName(firstSkill))}`);
    p.log.message(pc.dim(firstSkill.description));
  } else if (options.yes) {
    selectedSkills = skills;
    p.log.info(`Installing all ${skills.length} skills`);
  } else {
    const skillChoices = skills.map(s => ({
      value: s,
      label: getSkillDisplayName(s),
      hint: s.description.length > 60 ? s.description.slice(0, 57) + '...' : s.description,
    }));

    const selected = await p.multiselect({
      message: 'Select skills to install',
      options: skillChoices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Installation cancelled');
      return null;
    }

    selectedSkills = selected as Skill[];
  }

  return selectedSkills;
}

async function selectAgents(
  options: Options,
  context: ServiceContext
): Promise<AgentType[] | null> {
  if (options.agent && options.agent.length > 0) {
    const validAgents = Object.keys(agents) as AgentType[];
    const invalidAgents = options.agent.filter(a => !validAgents.includes(a as AgentType));

    if (invalidAgents.length > 0) {
      p.log.error(`Invalid agents: ${invalidAgents.join(', ')}`);
      p.log.info(`Valid agents: ${validAgents.join(', ')}`);
      return null;
    }

    return options.agent as AgentType[];
  }

  context.spinner.start('Detecting installed agents...');
  const installedAgents = await detectInstalledAgents();
  context.spinner.stop(`Detected ${installedAgents.length} agent${installedAgents.length !== 1 ? 's' : ''}`);

  if (installedAgents.length === 0) {
    if (options.yes) {
      const allAgents = Object.keys(agents) as AgentType[];
      p.log.info('Installing to all agents (none detected)');
      return allAgents;
    } else {
      p.log.warn('No coding agents detected. You can still install skills.');

      const allAgentChoices = Object.entries(agents).map(([key, config]) => ({
        value: key as AgentType,
        label: config.displayName,
      }));

      const selected = await p.multiselect({
        message: 'Select agents to install skills to',
        options: allAgentChoices,
        required: true,
      });

      if (p.isCancel(selected)) {
        p.cancel('Installation cancelled');
        return null;
      }

      return selected as AgentType[];
    }
  } else if (installedAgents.length === 1 || options.yes) {
    if (installedAgents.length === 1) {
      const firstAgent = installedAgents[0]!;
      p.log.info(`Installing to: ${pc.cyan(agents[firstAgent].displayName)}`);
    } else {
      p.log.info(`Installing to: ${installedAgents.map(a => pc.cyan(agents[a].displayName)).join(', ')}`);
    }
    return installedAgents;
  } else {
    const agentChoices = installedAgents.map(a => ({
      value: a,
      label: agents[a].displayName,
      hint: agents[a].skillsDir,
    }));

    const selected = await p.multiselect({
      message: 'Select agents to install skills to',
      options: agentChoices,
      required: true,
      initialValues: installedAgents,
    });

    if (p.isCancel(selected)) {
      p.cancel('Installation cancelled');
      return null;
    }

    return selected as AgentType[];
  }
}

async function determineScope(
  options: Options
): Promise<boolean | null> {
  let installGlobally = options.global ?? false;

  if (options.global === undefined && !options.yes) {
    const scope = await p.select({
      message: 'Installation scope',
      options: [
        { value: false, label: 'Project', hint: 'Install in current directory (committed with your project)' },
        { value: true, label: 'Global', hint: 'Install in home directory (available across all projects)' },
      ],
    });

    if (p.isCancel(scope)) {
      p.cancel('Installation cancelled');
      return null;
    }

    installGlobally = scope as boolean;
  }

  return installGlobally;
}

async function showSummaryAndConfirm(
  options: Options,
  selectedSkills: Skill[],
  targetAgents: AgentType[],
  installGlobally: boolean
): Promise<boolean> {
  console.log();
  p.log.step(pc.bold('Installation Summary'));

  for (const skill of selectedSkills) {
    p.log.message(`  ${pc.cyan(getSkillDisplayName(skill))}`);
    for (const agent of targetAgents) {
      const path = getInstallPath(skill.name, agent, { global: installGlobally });
      const installed = await isSkillInstalled(skill.name, agent, { global: installGlobally });
      const status = installed ? pc.yellow(' (will overwrite)') : '';
      p.log.message(`    ${pc.dim('→')} ${agents[agent].displayName}: ${pc.dim(path)}${status}`);
    }
  }
  console.log();

  if (!options.yes) {
    const confirmed = await p.confirm({ message: 'Proceed with installation?' });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Installation cancelled');
      return false;
    }
  }

  return true;
}

async function performParallelInstall(
  selectedSkills: Skill[],
  targetAgents: AgentType[],
  installGlobally: boolean
): Promise<InstallResult> {
  const installPromises = selectedSkills.flatMap(skill =>
    targetAgents.map(agent => installSkillForAgent(skill, agent, { global: installGlobally }))
  );

  const installResults = await Promise.all(installPromises);

  const results = installResults.map((result, i) => {
    const skillIndex = Math.floor(i / targetAgents.length);
    const agentIndex = i % targetAgents.length;
    const skill = selectedSkills[skillIndex]!;
    const agent = targetAgents[agentIndex]!;

    return {
      skill: getSkillDisplayName(skill),
      agent: agents[agent].displayName,
      ...result,
    };
  });

  console.log();
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    p.log.success(pc.green(`Successfully installed ${successful.length} skill${successful.length !== 1 ? 's' : ''}`));
    for (const r of successful) {
      p.log.message(`  ${pc.green('✓')} ${r.skill} → ${r.agent}`);
      p.log.message(`    ${pc.dim(r.path)}`);
    }
  }

  if (failed.length > 0) {
    console.log();
    p.log.error(pc.red(`Failed to install ${failed.length} skill${failed.length !== 1 ? 's' : ''}`));
    for (const r of failed) {
      p.log.message(`  ${pc.red('✗')} ${r.skill} → ${r.agent}`);
      p.log.message(`    ${pc.dim(r.error)}`);
    }
  }

  console.log();
  p.outro(pc.green('Done!'));

  return {
    success: failed.length === 0,
    installed: successful.length,
    failed: failed.length,
    results,
  };
}
