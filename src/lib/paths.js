import path from "node:path";
import { ensureDir } from "./store.js";

export function getPaths(cwd) {
  const homeDir = process.env.JOBBOT_HOME
    ? path.resolve(process.env.JOBBOT_HOME)
    : path.join(cwd, ".jobbot");

  return {
    cwd,
    homeDir,
    cacheDir: path.join(homeDir, "cache"),
    applicationsDir: path.join(homeDir, "applications"),
    configFile: path.join(homeDir, "config.json"),
    jobsFile: path.join(homeDir, "jobs.json"),
    applicationsIndexFile: path.join(homeDir, "applications", "index.json"),
    uiSettingsFile: path.join(homeDir, "ui-settings.json"),
  };
}

export async function ensureAppLayout(paths) {
  await Promise.all([
    ensureDir(paths.homeDir),
    ensureDir(paths.cacheDir),
    ensureDir(paths.applicationsDir),
  ]);
}
