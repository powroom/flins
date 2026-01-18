import { resolve } from "path";
import { homedir } from "os";
import type { SkillInstallation } from "@/types/state";

export function expandHomeDir(path: string): string {
  if (path.startsWith("~")) {
    return path.replace("~", homedir());
  }
  return path;
}

export function resolveInstallationPath(installation: SkillInstallation): string {
  return installation.type === "global"
    ? expandHomeDir(installation.path)
    : resolve(process.cwd(), installation.path);
}
