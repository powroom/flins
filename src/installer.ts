import { mkdir, cp, access, readdir } from 'fs/promises';
import { join, basename } from 'path';
import type { Skill, AgentType } from './types.js';
import { agents } from './agents.js';

interface InstallResult {
  success: boolean;
  path: string;
  originalPath: string;
  error?: string;
}

export async function installSkillForAgent(
  skill: Skill,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {}
): Promise<InstallResult> {
  const agent = agents[agentType];
  const skillName = skill.name || basename(skill.path);
  const cwd = options.cwd || process.cwd();

  const targetBase = options.global
    ? agent.globalSkillsDir
    : join(cwd, agent.skillsDir);

  const targetDir = join(targetBase, skillName);

  try {
    await mkdir(targetDir, { recursive: true });
    await copyDirectory(skill.path, targetDir);

    return {
      success: true,
      path: targetDir,
      originalPath: options.global ? targetDir : join(agent.skillsDir, skillName)
    };
  } catch (error) {
    return {
      success: false,
      path: targetDir,
      originalPath: options.global ? targetDir : join(agent.skillsDir, skillName),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const EXCLUDE_FILES = new Set([
  'README.md',
  'metadata.json',
]);

const isExcluded = (name: string): boolean => {
  if (EXCLUDE_FILES.has(name)) return true;
  if (name.startsWith('_')) return true;
  return false;
};

async function copyDirectory(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (isExcluded(entry.name)) {
      continue;
    }

    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await cp(srcPath, destPath);
    }
  }
}

export async function isSkillInstalled(
  skillName: string,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {}
): Promise<boolean> {
  const agent = agents[agentType];

  const targetBase = options.global
    ? agent.globalSkillsDir
    : join(options.cwd || process.cwd(), agent.skillsDir);

  const skillDir = join(targetBase, skillName);

  try {
    await access(skillDir);
    return true;
  } catch {
    return false;
  }
}

export function getInstallPath(
  skillName: string,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {}
): string {
  const agent = agents[agentType];

  const targetBase = options.global
    ? agent.globalSkillsDir
    : join(options.cwd || process.cwd(), agent.skillsDir);

  return join(targetBase, skillName);
}
