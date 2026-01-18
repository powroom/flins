import { basename } from "path";
import type { Command } from "@/types/commands";
import { parseFrontmatter } from "../skills/parser";

export function parseMarkdownCommand(filePath: string, content: string): Command | null {
  try {
    const { data } = parseFrontmatter(content);
    const name = data.name || basename(filePath, ".md");

    return {
      name,
      description: data.description,
      path: filePath,
      type: "markdown",
    };
  } catch {
    return null;
  }
}

export function getCommandDisplayName(command: Command): string {
  return command.name;
}

export function getCommandDescription(command: Command): string {
  return command.description || `Command: ${command.name}`;
}
