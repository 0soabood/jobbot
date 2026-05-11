#!/usr/bin/env node

import process from "node:process";
import { parseArgs } from "./lib/args.js";
import { loadConfig, saveConfig } from "./lib/config.js";
import { getPaths, ensureAppLayout } from "./lib/paths.js";
import { loadDotEnv } from "./lib/env.js";
import { runGuide, runInitFlow } from "./commands/guide.js";
import { runSearchCommand } from "./commands/search.js";
import { runAutopilot } from "./commands/autopilot.js";
import { runDoctor } from "./commands/doctor.js";
import { printError, printHero, printHelp, printSuccess } from "./lib/ui.js";

async function main() {
  await loadDotEnv(process.cwd());
  const parsed = parseArgs(process.argv.slice(2));
  const command = parsed.command ?? "guide";
  const paths = getPaths(process.cwd());
  await ensureAppLayout(paths);
  const config = await loadConfig(paths);

  if (parsed.flags.help || command === "help") {
    printHero();
    printHelp();
    return;
  }

  switch (command) {
    case "init": {
      printHero();
      const nextConfig = await runInitFlow({ config, paths, flags: parsed.flags });
      await saveConfig(paths, nextConfig);
      printSuccess(`Saved your setup to ${paths.configFile}`);
      return;
    }
    case "guide": {
      printHero();
      const nextConfig = await runGuide({ config, paths, flags: parsed.flags });
      await saveConfig(paths, nextConfig);
      return;
    }
    case "search": {
      await runSearchCommand({ config, paths, flags: parsed.flags });
      return;
    }
    case "autopilot": {
      const nextConfig = await runAutopilot({ config, paths, flags: parsed.flags });
      await saveConfig(paths, nextConfig);
      return;
    }
    case "doctor": {
      await runDoctor({ config, paths });
      return;
    }
    default:
      throw new Error(
        `Unknown command "${command}". Run "jobbot help" to see available commands.`,
      );
  }
}

main().catch((error) => {
  printError(error.message);
  process.exitCode = 1;
});
