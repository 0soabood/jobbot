import { hasProfileBasics } from "../lib/config.js";
import { printInfo, printSection, printSuccess, printWarning } from "../lib/ui.js";
import { searchJobs } from "../services/jobs.js";
import { rankJobs } from "../services/score.js";
import { generateApplicationPacket } from "../services/ai.js";
import { saveApplicationPacket } from "../services/applications.js";

export async function runAutopilot({ config, paths, flags }) {
  if (!hasProfileBasics(config)) {
    throw new Error('Profile not ready. Run "jobbot init" first.');
  }

  const nextConfig = structuredClone(config);
  nextConfig.search.query = flags.query ?? nextConfig.search.query;
  nextConfig.search.location = flags.location ?? nextConfig.search.location;
  nextConfig.search.limit = Number.parseInt(
    flags.limit ?? String(nextConfig.search.limit),
    10,
  );
  nextConfig.search.useDemoData =
    flags.demo !== undefined ? String(flags.demo).toLowerCase() !== "false" : false;

  const top = Math.max(1, Number.parseInt(flags.top ?? "3", 10));

  printSection("Autopilot");
  printInfo(`Searching for "${nextConfig.search.query}"`);
  const { jobs, errors } = await searchJobs({
    paths,
    search: nextConfig.search,
    profile: nextConfig.profile,
  });
  const ranked = rankJobs(jobs, nextConfig.profile, nextConfig.search).slice(0, top);

  if (errors.length) {
    printWarning(`Source warnings: ${errors.join(" | ")}`);
  }

  if (!ranked.length) {
    printWarning("No jobs found, so no packets were created.");
    return nextConfig;
  }

  for (const job of ranked) {
    const packet = await generateApplicationPacket({
      config: nextConfig,
      profile: nextConfig.profile,
      documents: nextConfig.documents,
      job,
    });
    const record = await saveApplicationPacket({
      paths,
      profile: nextConfig.profile,
      job,
      packet,
    });
    printSuccess(`Prepared ${job.title} @ ${job.company}: ${record.paths.packetDir}`);
  }

  return nextConfig;
}
