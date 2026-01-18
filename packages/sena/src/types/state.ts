import type { AgentType } from "./agents";
import type { InstallableType } from "./skills";

export interface SkillInstallation {
  agent: AgentType;
  installableType: InstallableType;
  type: "global" | "project";
  path: string;
}

export interface SkillEntry {
  url: string;
  subpath?: string;
  branch: string;
  commit: string;
}

export interface StateFile {
  lastUpdate: string;
  skills: Record<string, SkillEntry>;
}

export interface LocalSkillEntry {
  url: string;
  subpath?: string;
  branch: string;
  commit: string;
}

export interface LocalState {
  version: string;
  skills: Record<string, LocalSkillEntry>;
}

export interface Dirent {
  name: string;
  isDirectory(): boolean;
}

export function skillKey(name: string): string {
  return `skill:${name.toLowerCase()}`;
}

export function commandKey(name: string): string {
  return `command:${name.toLowerCase()}`;
}

export function parseKey(
  key: string,
): { type: "skill" | "command"; name: string; installableType: InstallableType } | null {
  const skillPrefix = "skill:";
  const commandPrefix = "command:";

  if (key.startsWith(skillPrefix)) {
    return {
      type: "skill",
      name: key.slice(skillPrefix.length),
      installableType: "skill" as const,
    };
  }

  if (key.startsWith(commandPrefix)) {
    return {
      type: "command",
      name: key.slice(commandPrefix.length),
      installableType: "command" as const,
    };
  }

  return null;
}
