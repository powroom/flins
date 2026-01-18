import { existsSync, readdirSync, statSync } from "fs";

export function isValidSkillInstallation(path: string): boolean {
  if (!existsSync(path)) return false;

  try {
    const stat = statSync(path);
    if (!stat.isDirectory()) return false;

    const files = readdirSync(path);
    if (files.length === 0) return false;
    return files.includes("SKILL.md");
  } catch {
    return false;
  }
}

export function isValidCommandInstallation(path: string): boolean {
  if (!existsSync(path)) return false;

  try {
    const stat = statSync(path);
    if (!stat.isFile()) return false;
    return path.endsWith(".md");
  } catch {
    return false;
  }
}

export function isValidInstallation(path: string, installableType: "skill" | "command"): boolean {
  return installableType === "skill"
    ? isValidSkillInstallation(path)
    : isValidCommandInstallation(path);
}
