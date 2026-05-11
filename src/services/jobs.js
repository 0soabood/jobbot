import { readJson, writeJson } from "../lib/store.js";
import { searchRemotive } from "../sources/remotive.js";
import { searchArbeitnow } from "../sources/arbeitnow.js";
import { demoJobs } from "../data/demo-jobs.js";

const SOURCE_HANDLERS = {
  remotive: searchRemotive,
  arbeitnow: searchArbeitnow,
};

export async function searchJobs({ paths, search, profile }) {
  if (search.useDemoData) {
    const jobs = demoJobs.slice(0, search.limit);
    await writeJson(paths.jobsFile, {
      generatedAt: new Date().toISOString(),
      search,
      jobs,
      errors: ["Using bundled demo jobs instead of live sources."],
    });
    return {
      jobs,
      errors: ["Using bundled demo jobs instead of live sources."],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const sources =
      search.sources.filter((source) => SOURCE_HANDLERS[source]).length > 0
        ? search.sources.filter((source) => SOURCE_HANDLERS[source])
        : Object.keys(SOURCE_HANDLERS);
    const results = await Promise.allSettled(
      sources.map((source) =>
        SOURCE_HANDLERS[source]({
          query: search.query,
          limit: search.limit,
          remoteOnly: search.remoteOnly,
          pages: search.pages,
          location: profile.location,
          signal: controller.signal,
        }),
      ),
    );

    const jobs = [];
    const errors = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        jobs.push(...result.value);
      } else {
        errors.push(result.reason.message);
      }
    }

    let deduped = dedupeJobs(jobs).slice(0, search.limit * Math.max(sources.length, 1));

    if (!deduped.length) {
      const cached = await readJson(paths.jobsFile, null);
      if (cached?.jobs?.length) {
        deduped = cached.jobs;
        errors.push("Using cached results because live job sources were unavailable.");
      }
    }

    await writeJson(paths.jobsFile, {
      generatedAt: new Date().toISOString(),
      search,
      jobs: deduped,
      errors,
    });

    return { jobs: deduped, errors };
  } finally {
    clearTimeout(timeout);
  }
}

function dedupeJobs(jobs) {
  const seen = new Set();
  const result = [];

  for (const job of jobs) {
    const key = `${job.company}|${job.title}|${job.url}`.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(job);
  }

  return result;
}
