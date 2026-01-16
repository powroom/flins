export type AgentType = 'opencode' | 'claude-code' | 'codex' | 'cursor' | 'amp' | 'kilo' | 'roo' | 'goose' | 'antigravity' | 'copilot' | 'gemini' | 'windsurf' | 'trae' | 'factory' | 'letta';

export interface Skill {
  name: string;
  description: string;
  path: string;
  metadata?: Record<string, string>;
}

export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  detectInstalled: () => Promise<boolean>;
}

export interface ParsedSource {
  type: 'github' | 'gitlab' | 'git';
  url: string;
  subpath?: string;
  branch?: string;
}

export interface SkillInstallation {
  agent: AgentType;
  type: 'global' | 'project';
  path: string;
}

export interface SkillState {
  source: string;
  url: string;
  subpath?: string;
  branch: string;
  commit: string;
  installedAt: string;
  installations: SkillInstallation[];
}

export interface StateFile {
  lastUpdate: string;
  skills: Record<string, SkillState>;
}
