import { stripHtml, tokenize } from "../lib/text.js";

const BASE_URL = "https://www.arbeitnow.com/api/job-board-api";

export async function searchArbeitnow({
  query,
  limit = 15,
  remoteOnly = true,
  pages = 2,
  signal,
}) {
  const jobs = [];
  const pageCount = Math.max(1, Math.min(Number.parseInt(pages, 10) || 2, 4));

  for (let page = 1; page <= pageCount; page += 1) {
    const params = new URLSearchParams({ page: String(page) });
    if (remoteOnly) {
      params.set("remote", "true");
    }

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "jobbot/0.1.0",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Arbeitnow returned ${response.status}`);
    }

    const payload = await response.json();
    jobs.push(...(Array.isArray(payload.data) ? payload.data : []));
    if (!payload.links?.next) {
      break;
    }
  }

  const queryTokens = tokenize(query ?? "");
  const normalized = jobs.map((job) => normalizeArbeitnowJob(job));
  const filtered =
    queryTokens.length === 0
      ? normalized
      : normalized.filter((job) => {
          const haystack = tokenize(`${job.title} ${job.company} ${job.description} ${job.tags.join(" ")}`);
          const matches = queryTokens.filter((token) => haystack.includes(token)).length;
          return matches >= Math.max(1, Math.ceil(queryTokens.length / 2));
        });

  return filtered.slice(0, limit);
}

function normalizeArbeitnowJob(job) {
  return {
    id: `arbeitnow:${job.slug ?? job.url ?? job.title}`,
    source: "arbeitnow",
    sourceLabel: "Arbeitnow",
    title: job.title ?? "",
    company: job.company_name ?? "",
    location: Array.isArray(job.location) ? job.location.join(", ") : job.location ?? "",
    remote: Boolean(job.remote),
    employmentType: Array.isArray(job.job_types) ? job.job_types.join(", ") : job.job_types ?? "",
    category: Array.isArray(job.tags) ? job.tags.join(", ") : "",
    salary: "",
    url: job.url ?? "",
    postedAt: job.created_at ?? "",
    description: stripHtml(job.description ?? ""),
    tags: Array.isArray(job.tags) ? job.tags : [],
    raw: job,
  };
}
