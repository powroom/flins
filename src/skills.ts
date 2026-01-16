import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { agents } from './agents.js';
import type { Skill } from './types.js';

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__'];

const COMMON_SKILL_DIRS = [
  'skills',
  'skills/.curated',
  'skills/.experimental',
  'skills/.system',
];

function getPrioritySearchDirs(searchPath: string): string[] {
  const dirs = [searchPath];

  for (const subdir of COMMON_SKILL_DIRS) {
    dirs.push(join(searchPath, subdir));
  }

  const uniqueAgentDirs = new Set<string>();
  for (const agent of Object.values(agents)) {
    uniqueAgentDirs.add(join(searchPath, agent.skillsDir));
  }
  dirs.push(...uniqueAgentDirs);

  return dirs;
}

interface FrontmatterResult {
  data: Record<string, string>;
  content: string;
}

function parseFrontmatter(content: string): FrontmatterResult {
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content };

  const yamlSection = match[1]!;
  const bodyContent = match[2]!;
  const data: Record<string, string> = {};

  for (const line of yamlSection.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      data[key] = value.slice(1, -1);
    } else if (key === 'metadata') {
      try {
        const metadata: Record<string, string> = {};
        const metadataStr = value.replace(/^\{|\}$/g, '').trim();
        if (metadataStr) {
          for (const pair of metadataStr.split(',')) {
            const [k, v] = pair.split('=').map(s => s.trim());
            if (k && v) {
              metadata[k] = v.replace(/^['"]|['"]$/g, '');
            }
          }
          data[key] = JSON.stringify(metadata);
        }
      } catch {
        data[key] = value;
      }
    } else {
      data[key] = value;
    }
  }

  return { data, content: bodyContent };
}

async function hasSkillMd(dir: string): Promise<boolean> {
  try {
    const skillPath = join(dir, 'SKILL.md');
    const stats = await stat(skillPath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function parseSkillMd(skillMdPath: string): Promise<Skill | null> {
  try {
    const content = await readFile(skillMdPath, 'utf-8');
    const { data } = parseFrontmatter(content);

    if (!data.name || !data.description) {
      return null;
    }

    return {
      name: data.name,
      description: data.description,
      path: dirname(skillMdPath),
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
    };
  } catch {
    return null;
  }
}

async function findSkillDirs(dir: string, depth = 0, maxDepth = 5): Promise<string[]> {
  const skillDirs: string[] = [];

  if (depth > maxDepth) return skillDirs;

  try {
    if (await hasSkillMd(dir)) {
      skillDirs.push(dir);
    }

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !SKIP_DIRS.includes(entry.name)) {
        const subDirs = await findSkillDirs(join(dir, entry.name), depth + 1, maxDepth);
        skillDirs.push(...subDirs);
      }
    }
  } catch {
  }

  return skillDirs;
}

export async function discoverSkills(basePath: string, subpath?: string): Promise<Skill[]> {
  const skills: Skill[] = [];
  const seenNames = new Set<string>();
  const searchPath = subpath ? join(basePath, subpath) : basePath;

  if (await hasSkillMd(searchPath)) {
    const skill = await parseSkillMd(join(searchPath, 'SKILL.md'));
    if (skill) {
      skills.push(skill);
      return skills;
    }
  }

  const prioritySearchDirs = getPrioritySearchDirs(searchPath);

  for (const dir of prioritySearchDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillDir = join(dir, entry.name);
          if (await hasSkillMd(skillDir)) {
            const skill = await parseSkillMd(join(skillDir, 'SKILL.md'));
            if (skill && !seenNames.has(skill.name)) {
              skills.push(skill);
              seenNames.add(skill.name);
            }
          }
        }
      }
    } catch {
    }
  }

  if (skills.length === 0) {
    const allSkillDirs = await findSkillDirs(searchPath);

    for (const skillDir of allSkillDirs) {
      const skill = await parseSkillMd(join(skillDir, 'SKILL.md'));
      if (skill && !seenNames.has(skill.name)) {
        skills.push(skill);
        seenNames.add(skill.name);
      }
    }
  }

  return skills;
}

export function getSkillDisplayName(skill: Skill): string {
  return skill.name || basename(skill.path);
}
