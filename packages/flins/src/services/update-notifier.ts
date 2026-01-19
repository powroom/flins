import updateNotifier from "update-notifier";
import pc from "picocolors";
import packageJson from "../../package.json" with { type: "json" };

export function checkForUpdates(silent = false): void {
  if (silent) return;
  if (process.env.NO_UPDATE_NOTIFIER) return;
  if (process.env.CI === "true") return;
  if (process.env.NODE_ENV === "test") return;
  if (!process.stdout.isTTY) return;

  const notifier = updateNotifier({
    pkg: packageJson,
    updateCheckInterval: 1000 * 60 * 60 * 24,
  });

  if (notifier.update) {
    const { current, latest } = notifier.update;
    console.log(
      `\n${pc.yellow("Update available")} ${pc.dim(current)} → ${pc.green(latest)}` +
        `\nRun ${pc.cyan("npm i -g flins@latest")} to update\n`,
    );
  }
}
