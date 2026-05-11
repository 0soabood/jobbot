import { printInfo, printSection, printWarning } from "../lib/ui.js";
import { rankJobs } from "../services/score.js";
import { searchJobs } from "../services/jobs.js";
import { truncate } from "../lib/text.js";

export async function runSearchCommand({ config, paths, flags }) {
  const search = {
    ...config.search,
    query: flags.query ?? config.search.query,
    location: flags.location ?? config.search.location,
    limit: Number.parseInt(flags.limit ?? String(config.search.limit), 10),
    useDemoData: flags.demo !== undefined ? String(flags.demo).toLowerCase() !== "false" : false,
    remoteOnly:
      flags.remoteOnly !== undefined
        ? String(flags.remoteOnly).toLowerCase() !== "false"
        : config.search.remoteOnly,
  };

  printSection("Live search");
  printInfo(`Query: ${search.query || "(none)"}`);
  const { jobs, errors } = await searchJobs({ paths, search, profile: config.profile });
  const ranked = rankJobs(jobs, config.profile, search);

  if (errors.length) {
    printWarning(`Source warnings: ${errors.join(" | ")}`);
  }

  if (!ranked.length) {
    printWarning("No jobs found.");
    return;
  }

  ranked.slice(0, search.limit).forEach((job, index) => {
    console.log(
      `${index + 1}. ${job.title} @ ${job.company} | score ${job.score} | ${job.sourceLabel} | ${truncate(job.reasons.join("; "), 100)}`,
    );
    console.log(`   ${job.url}`);
  });
}
