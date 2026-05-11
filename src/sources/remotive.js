import { stripHtml } from "../lib/text.js";

const BASE_URL = "https://remotive.com/api/remote-jobs";

export async function searchRemotive({ query, limit = 15, signal }) {
  const params = new URLSearchParams();
  if (query) {
    params.set("search", query);
  }
  params.set("limit", String(limit));

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "jobbot/0.1.0",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Remotive returned ${response.status}`);
  }

  const payload = await response.json();
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];

  return jobs.map((job) => ({
    id: `remotive:${job.id}`,
    source: "remotive",
    sourceLabel: "Remotive",
    title: job.title ?? "",
    company: job.company_name ?? "",
    location: job.candidate_required_location ?? "Remote",
    remote: true,
    employmentType: job.job_type ?? "",
    category: job.category ?? "",
    salary: job.salary ?? "",
    url: job.url ?? "",
    postedAt: job.publication_date ?? "",
    description: stripHtml(job.description ?? ""),
    tags: [job.category, job.job_type].filter(Boolean),
    raw: job,
  }));
}
