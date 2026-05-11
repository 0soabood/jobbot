import http from "node:http";
import path from "node:path";
import { readdir, rm } from "node:fs/promises";

import { loadDotEnv } from "./lib/env.js";
import { getPaths, ensureAppLayout } from "./lib/paths.js";
import { loadConfig, saveConfig } from "./lib/config.js";
import { readJson, writeJson, writeText } from "./lib/store.js";
import { rankJobs } from "./services/score.js";
import { searchJobs } from "./services/jobs.js";
import { generateApplicationPacket } from "./services/ai.js";
import { saveApplicationPacket } from "./services/applications.js";

const PORT = Number.parseInt(process.env.JOBBOT_UI_API_PORT ?? "8787", 10);

await loadDotEnv(process.cwd());

const paths = getPaths(process.cwd());
await ensureAppLayout(paths);

const server = http.createServer(async (request, response) => {
  try {
    await handleRequest(request, response);
  } catch (error) {
    console.error(`[Server Error] ${request.method} ${request.url}:`, error);
    sendJson(response, 500, { error: error?.message ?? "Unexpected server error" });
  }
});

server.listen(PORT, () => {
  console.log(`jobbot API listening on http://localhost:${PORT}/api`);
});

async function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    sendEmpty(response, 204);
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (!url.pathname.startsWith("/api")) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const route = url.pathname.slice(4) || "/";
  const config = await loadConfig(paths);

  if (request.method === "GET" && route === "/health") {
    sendJson(response, 200, { ok: true, cwd: paths.cwd, dataDir: paths.homeDir });
    return;
  }

  if (request.method === "GET" && route === "/profile") {
    sendJson(response, 200, toUiProfile(config));
    return;
  }

  if (request.method === "PUT" && route === "/profile") {
    const profile = await readBody(request);
    const nextConfig = applyUiProfile(config, profile);
    await saveConfig(paths, nextConfig);
    sendJson(response, 200, toUiProfile(nextConfig));
    return;
  }

  if (request.method === "GET" && route === "/settings") {
    sendJson(response, 200, await loadUiSettings(config));
    return;
  }

  if (request.method === "PUT" && route === "/settings") {
    const settings = await readBody(request);
    const nextConfig = applyUiSettings(config, settings);
    await saveConfig(paths, nextConfig);
    await writeJson(paths.uiSettingsFile, {
      aiProvider: settings.aiProvider,
      modelName: settings.modelName,
      apiUrl: settings.apiUrl,
      demoMode: settings.demoMode,
      theme: settings.theme,
    });
    sendJson(response, 200, await loadUiSettings(nextConfig));
    return;
  }

  if (request.method === "DELETE" && route === "/data") {
    await rm(paths.homeDir, { recursive: true, force: true });
    await ensureAppLayout(paths);
    sendEmpty(response, 204);
    return;
  }

  if (request.method === "GET" && route === "/dashboard") {
    sendJson(response, 200, await getDashboardStats(config));
    return;
  }

  if (request.method === "GET" && route === "/jobs") {
    const search = normalizeSearch(config.search, url.searchParams);
    sendJson(response, 200, await getUiJobs(config, search));
    return;
  }

  if (request.method === "GET" && route.startsWith("/jobs/")) {
    const jobId = decodeURIComponent(route.slice("/jobs/".length));
    const job = await getUiJobById(config, jobId, normalizeSearch(config.search, url.searchParams));
    if (!job) {
      sendJson(response, 404, { error: "Job not found" });
      return;
    }
    sendJson(response, 200, job);
    return;
  }

  if (request.method === "GET" && route === "/applications") {
    sendJson(response, 200, await getUiApplicationPackets());
    return;
  }

  if (request.method === "GET" && route.startsWith("/applications/")) {
    const packetId = decodeURIComponent(route.slice("/applications/".length));
    const packet = await getUiApplicationPacket(packetId);
    if (!packet) {
      sendJson(response, 404, { error: "Application packet not found" });
      return;
    }
    sendJson(response, 200, packet);
    return;
  }

  if (request.method === "POST" && route === "/applications") {
    const body = await readBody(request);
    const jobId = String(body?.jobId ?? "");
    if (!jobId) {
      sendJson(response, 400, { error: "jobId is required" });
      return;
    }

    const rawJob = await getRawJobById(config, jobId);
    if (!rawJob) {
      sendJson(response, 404, { error: "Job not found" });
      return;
    }

    const packet = await generateApplicationPacket({
      config,
      profile: config.profile,
      documents: config.documents,
      job: rawJob,
    });
    const record = await saveApplicationPacket({
      paths,
      profile: config.profile,
      job: rawJob,
      packet,
    });
    const uiPacket = toUiPacket(record, packet, rawJob);
    const storedRecord = {
      ...record,
      status: uiPacket.status,
      uiPacket,
    };
    await writeJson(path.join(record.paths.packetDir, "application.json"), storedRecord);
    sendJson(response, 201, uiPacket);
    return;
  }

  if ((request.method === "PATCH" || request.method === "PUT") && route.startsWith("/applications/")) {
    const packetId = decodeURIComponent(route.slice("/applications/".length));
    const body = await readBody(request);
    const updated = await updateUiPacket(packetId, body);
    if (!updated) {
      sendJson(response, 404, { error: "Application packet not found" });
      return;
    }
    sendJson(response, 200, updated);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

function normalizeSearch(searchConfig, params) {
  const query = params.get("query") ?? searchConfig.query ?? "";
  const limit = Number.parseInt(params.get("limit") ?? String(searchConfig.limit ?? 10), 10);
  const remoteOnly = params.has("remoteOnly")
    ? params.get("remoteOnly") !== "false"
    : Boolean(searchConfig.remoteOnly);

  return {
    ...searchConfig,
    query,
    limit: Number.isNaN(limit) ? 10 : Math.max(1, limit),
    remoteOnly,
    useDemoData: params.has("demo") ? params.get("demo") !== "false" : Boolean(searchConfig.useDemoData),
  };
}

async function getUiJobs(config, search) {
  const cached = await readJson(paths.jobsFile, null);
  const rawCachedJobs = Array.isArray(cached?.jobs) && cached.jobs.length ? cached.jobs : [];
  const hasQueryMatch = search.query ? filterRawJobs(rawCachedJobs, search.query).length > 0 : true;
  const useCachedJobs = rawCachedJobs.length > 0 && hasQueryMatch;

  const rawJobs = useCachedJobs
    ? filterRawJobs(rawCachedJobs, search.query)
    : (await searchJobs({ paths, search, profile: config.profile })).jobs;

  return rankJobs(rawJobs, config.profile, search).map((job) => toUiJob(job, config.profile));
}

async function getUiJobById(config, jobId, search) {
  const jobs = await getUiJobs(config, search);
  return jobs.find((job) => String(job.id) === String(jobId)) ?? null;
}

async function getRawJobById(config, jobId) {
  const cached = await readJson(paths.jobsFile, null);
  const rawCachedJobs = Array.isArray(cached?.jobs) ? cached.jobs : [];
  const match = rawCachedJobs.find((job) => String(job.id) === String(jobId));
  if (match) {
    return match;
  }

  const refreshed = await searchJobs({ paths, search: config.search, profile: config.profile });
  return refreshed.jobs.find((job) => String(job.id) === String(jobId)) ?? null;
}

async function getDashboardStats(config) {
  const jobs = await getUiJobs(config, config.search);
  const packets = await getUiApplicationPackets();
  const profile = toUiProfile(config);

  return {
    profileCompletion: getProfileCompletion(profile),
    activeSearches: packets.filter((packet) => packet.status !== "submitted").length,
    topMatchCount: jobs.filter((job) => job.score.overall > 85).length,
    recentPackets: packets.slice(0, 3),
    momentumScore: jobs.length ? Math.min(99, Math.max(30, jobs[0].score.overall)) : 72,
  };
}

async function getUiApplicationPackets() {
  const records = await loadApplicationRecords();
  return records
    .map((record) => toUiPacket(record, record.packet, record.job))
    .sort((left, right) => new Date(right.lastEditedAt).getTime() - new Date(left.lastEditedAt).getTime());
}

async function getUiApplicationPacket(packetId) {
  const records = await loadApplicationRecords();
  const record = records.find((item) => String(item.id) === String(packetId));
  return record ? toUiPacket(record, record.packet, record.job) : null;
}

async function updateUiPacket(packetId, patch) {
  const records = await loadApplicationRecords();
  const index = records.findIndex((item) => String(item.id) === String(packetId));
  if (index === -1) {
    return null;
  }

  const current = records[index];
  const currentUiPacket = toUiPacket(current, current.packet, current.job);
  const merged = {
    ...currentUiPacket,
    ...patch,
    content: {
      ...currentUiPacket.content,
      ...(patch.content ?? {}),
    },
    checklist: Array.isArray(patch.checklist) ? patch.checklist : currentUiPacket.checklist,
    status: patch.status ?? currentUiPacket.status,
    lastEditedAt: new Date().toISOString(),
  };

  const nextRecord = {
    ...current,
    status: merged.status,
    lastEditedAt: merged.lastEditedAt,
    uiPacket: merged,
  };

  await writeJson(path.join(current.paths.packetDir, "application.json"), nextRecord);
  await writeText(current.paths.resumeFile, merged.content.tailoredResumeNotes);
  await writeText(current.paths.coverLetterFile, merged.content.coverLetter.trim());
  await writeText(current.paths.answersFile, buildAnswersMarkdown(merged));
  await writeText(current.paths.checklistFile, buildChecklistMarkdown(merged, current.job));

  records[index] = nextRecord;
  return merged;
}

async function loadApplicationRecords() {
  const indexed = await readJson(paths.applicationsIndexFile, []);
  const records = [];

  if (Array.isArray(indexed) && indexed.length) {
    for (const entry of indexed) {
      const record = await readJson(path.join(entry.packetDir, "application.json"), null);
      if (record) {
        records.push(record);
      }
    }
    return records;
  }

  const entries = await readdir(paths.applicationsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const record = await readJson(path.join(paths.applicationsDir, entry.name, "application.json"), null);
    if (record) {
      records.push(record);
    }
  }

  return records;
}

async function loadUiSettings(config) {
  const stored = await readJson(paths.uiSettingsFile, {});
  return {
    aiProvider:
      stored.aiProvider ??
      (config.ai.provider === "mock"
        ? "Workspace API"
        : "OpenAI-compatible"),
    modelName: config.ai.model,
    apiUrl: stored.apiUrl ?? `http://localhost:${PORT}/api`,
    demoMode: typeof stored.demoMode === "boolean" ? stored.demoMode : Boolean(config.search.useDemoData),
    theme: stored.theme ?? "dark",
  };
}

function applyUiSettings(config, settings) {
  const nextConfig = structuredClone(config);
  nextConfig.ai.provider = settings.aiProvider === "Workspace API" ? "workspace" : "openai";
  nextConfig.ai.model = settings.modelName ?? nextConfig.ai.model;
  nextConfig.search.useDemoData = Boolean(settings.demoMode);
  return nextConfig;
}

function applyUiProfile(config, profile) {
  const nextConfig = structuredClone(config);
  nextConfig.profile = {
    ...nextConfig.profile,
    fullName: profile.fullName ?? "",
    email: profile.email ?? "",
    targetRoles: Array.isArray(profile.targetRoles) ? profile.targetRoles : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    yearsExperience: nextConfig.profile.yearsExperience ?? "",
    remotePreference: mapCliRemotePreference(profile.preferences?.remote ?? "hybrid"),
    summary: profile.bio ?? nextConfig.profile.summary ?? "",
    location: profile.preferences?.locations?.[0] ?? nextConfig.profile.location ?? "",
    links: profile.links ?? {},
    preferences: profile.preferences ?? { remote: "hybrid", locations: [] },
  };
  nextConfig.documents = {
    ...nextConfig.documents,
    resumeText: profile.resumeText ?? "",
    linkedinUrl: profile.links?.linkedin ?? "",
    githubUrl: profile.links?.github ?? "",
    portfolioUrl: profile.links?.portfolio ?? "",
  };
  return nextConfig;
}

function toUiProfile(config) {
  const profile = config.profile ?? {};
  const documents = config.documents ?? {};
  const savedLinks = profile.links ?? {};
  const savedPreferences = profile.preferences ?? {};

  return {
    fullName: profile.fullName ?? "",
    email: profile.email ?? "",
    targetRoles: Array.isArray(profile.targetRoles) ? profile.targetRoles : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    bio: profile.bio ?? profile.summary ?? "",
    links: {
      linkedin: savedLinks.linkedin ?? documents.linkedinUrl ?? "",
      github: savedLinks.github ?? documents.githubUrl ?? "",
      portfolio: savedLinks.portfolio ?? documents.portfolioUrl ?? "",
    },
    preferences: {
      remote: mapUiRemotePreference(savedPreferences.remote ?? profile.remotePreference),
      locations: Array.isArray(savedPreferences.locations)
        ? savedPreferences.locations
        : profile.location
          ? [profile.location]
          : [],
      minSalary: savedPreferences.minSalary,
    },
    resumeText: documents.resumeText ?? profile.resumeText ?? "",
  };
}

function toUiJob(job, profile) {
  const matchedSkills = Array.isArray(job.matchedSkills) ? job.matchedSkills : [];
  const profileSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const missingKeywords = uniqueKeywords([
    ...profileSkills.filter((skill) => !matchedSkills.some((matched) => matched.toLowerCase() === skill.toLowerCase())),
    ...(Array.isArray(job.tags) ? job.tags : []).filter(
      (tag) => !matchedSkills.some((matched) => matched.toLowerCase() === tag.toLowerCase()),
    ),
  ]).slice(0, 5);

  return {
    id: String(job.id),
    title: String(job.title ?? ""),
    company: String(job.company ?? ""),
    location: String(job.location ?? ""),
    postedAt: String(job.postedAt ?? new Date().toISOString()),
    source: String(job.sourceLabel ?? job.source ?? ""),
    url: String(job.url ?? ""),
    type: mapRoleType(job.employmentType ?? job.type),
    remote: mapRemotePreference(job.remote),
    salary: job.salary ?? "",
    description: String(job.description ?? ""),
    score: {
      overall: Number(job.score ?? 0),
      matchReasons: Array.isArray(job.reasons) ? job.reasons : [],
      missingKeywords,
    },
  };
}

function toUiPacket(record, backendPacket, job) {
  if (record.uiPacket) {
    return {
      ...record.uiPacket,
      status: record.uiPacket.status ?? record.status ?? "draft",
      lastEditedAt: record.uiPacket.lastEditedAt ?? record.lastEditedAt ?? record.generatedAt,
    };
  }

  const packet = backendPacket ?? record.packet ?? {};
  return {
    id: record.id,
    jobId: job.id,
    jobTitle: job.title,
    companyId: slugifyLike(job.company),
    companyName: job.company,
    sourceUrl: job.url,
    status: record.status ?? "draft",
    createdAt: record.generatedAt,
    lastEditedAt: record.lastEditedAt ?? record.generatedAt,
    content: {
      tailoredResumeNotes: buildResumeTailoringMarkdownFromBackend(packet),
      coverLetter: String(packet.coverLetter ?? ""),
      applicationAnswers: [
        { question: "Why this role", answer: String(packet.applicationAnswers?.whyThisRole ?? "") },
        { question: "Why this company", answer: String(packet.applicationAnswers?.whyThisCompany ?? "") },
        { question: "Value proposition", answer: String(packet.applicationAnswers?.valueProposition ?? "") },
        { question: "Availability", answer: String(packet.applicationAnswers?.availability ?? "") },
      ],
    },
    checklist: defaultChecklist(),
  };
}

function buildResumeTailoringMarkdownFromBackend(packet) {
  const highlights = Array.isArray(packet.resumeHighlights) ? packet.resumeHighlights : [];
  const keywords = Array.isArray(packet.atsKeywords) ? packet.atsKeywords : [];
  return [
    "# Resume Tailoring",
    "",
    "## Recommended headline",
    "",
    String(packet.resumeHeadline ?? ""),
    "",
    "## Fit summary",
    "",
    String(packet.fitSummary ?? ""),
    "",
    "## Bullet guidance",
    "",
    ...highlights.map((item) => `- ${item}`),
    "",
    "## ATS keywords",
    "",
    ...keywords.map((item) => `- ${item}`),
  ].join("\n");
}

function buildAnswersMarkdown(packet) {
  return [
    "# Application Answers",
    ...packet.content.applicationAnswers.flatMap((item) => ["", `## ${item.question}`, "", item.answer]),
  ].join("\n");
}

function buildChecklistMarkdown(packet, job) {
  return `# Final Apply Checklist\n\n- Open the listing: ${job.url}\n- Update your resume using resume-tailoring.md\n- Paste the tailored cover letter from cover-letter.md\n- Reuse answers from application-answers.md\n- Verify contact details and attachments\n- Click send\n\n## Status\n\n- Current status: ${packet.status}`;
}

function defaultChecklist() {
  return [
    { id: "review-notes", label: "Review AI Resume Notes", completed: false },
    { id: "polish-letter", label: "Polish Cover Letter", completed: false },
    { id: "review-answers", label: "Review application answers", completed: false },
    { id: "submit", label: "Submit via company portal", completed: false },
  ];
}

function mapRemotePreference(value) {
  if (value === true || value === "remote" || value === "remote-first") {
    return "remote";
  }
  if (value === "onsite") {
    return "onsite";
  }
  return "hybrid";
}

function mapUiRemotePreference(value) {
  if (value === "remote" || value === "hybrid" || value === "onsite") {
    return value;
  }
  if (value === "remote-first") {
    return "remote";
  }
  return "hybrid";
}

function mapCliRemotePreference(value) {
  if (value === "remote") {
    return "remote-first";
  }
  if (value === "onsite") {
    return "onsite";
  }
  return "hybrid";
}

function mapRoleType(value) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("contract")) {
    return "Contract";
  }
  if (normalized.includes("part")) {
    return "Part-time";
  }
  if (normalized.includes("freelance")) {
    return "Freelance";
  }
  return "Full-time";
}

function slugifyLike(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueKeywords(values) {
  return [...new Set(values.filter(Boolean))];
}

function filterRawJobs(jobs, query) {
  if (!query) {
    return jobs;
  }

  const lowered = query.toLowerCase();
  return jobs.filter((job) => {
    const haystack = [job.title, job.company, job.location, job.description, ...(Array.isArray(job.tags) ? job.tags : [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(lowered);
  });
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(body));
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end();
}

function getProfileCompletion(profile) {
  const checks = [
    Boolean(profile.fullName),
    Boolean(profile.email),
    Array.isArray(profile.targetRoles) && profile.targetRoles.length > 0,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Boolean(profile.resumeText),
    Array.isArray(profile.preferences?.locations) && profile.preferences.locations.length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}
