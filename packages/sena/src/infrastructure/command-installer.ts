import { mkdir, cp } from "fs/promises";
import { join, dirname } from "path";
import { agents } from "@/core/agents/config";
import type { Command } from "@/types/commands";
import type { AgentType } from "@/types/agents";

const COMMANDS_SUPPORT_AGENTS: AgentType[] = ["claude-code", "opencode", "factory"];

export function supportsCommands(agent: AgentType): boolean {
  return COMMANDS_SUPPORT_AGENTS.includes(agent);
}

export function getCommandSupportAgents(): AgentType[] {
  return COMMANDS_SUPPORT_AGENTS.filter((agent) => agents[agent]?.commandsDir);
}

async function ensureCommandsDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function copyCommandFile(
  src: string,
  dest: string,
): Promise<{ success: boolean; path: string; error?: string }> {
  try {
    await ensureCommandsDir(dirname(dest));
    await cp(src, dest);
    return { success: true, path: dest };
  } catch (error) {
    return {
      success: false,
      path: dest,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function installMarkdownCommand(
  command: Command,
  agent: AgentType,
  options: { global: boolean },
): Promise<{ success: boolean; path: string; error?: string }> {
  const agentConfig = agents[agent];
  const baseDir = options.global ? agentConfig.globalCommandsDir! : agentConfig.commandsDir!;
  const targetPath = join(baseDir, `${command.name}.md`);

  return copyCommandFile(command.path, targetPath);
}

export async function installCommandForAgent(
  command: Command,
  agent: AgentType,
  options: { global: boolean },
): Promise<{ success: boolean; path: string; originalPath: string; error?: string }> {
  if (!supportsCommands(agent)) {
    return {
      success: false,
      path: "",
      originalPath: command.path,
      error: `Agent ${agent} does not support commands`,
    };
  }

  const agentConfig = agents[agent];
  if (!agentConfig.commandsDir) {
    return {
      success: false,
      path: "",
      originalPath: command.path,
      error: `Agent ${agent} has no commands directory configured`,
    };
  }

  const result = await installMarkdownCommand(command, agent, options);

  return {
    ...result,
    originalPath: command.path,
  };
}

export async function isCommandInstalled(
  commandName: string,
  agent: AgentType,
  options: { global: boolean },
): Promise<boolean> {
  const agentConfig = agents[agent];
  const baseDir = options.global ? agentConfig.globalCommandsDir! : agentConfig.commandsDir!;

  try {
    await mkdir(baseDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export function getCommandInstallPath(
  commandName: string,
  agent: AgentType,
  options: { global: boolean },
): string {
  const agentConfig = agents[agent];
  const baseDir = options.global ? agentConfig.globalCommandsDir! : agentConfig.commandsDir!;
  return join(baseDir, commandName);
}
