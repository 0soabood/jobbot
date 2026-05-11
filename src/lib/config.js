import path from "node:path";
import { fileExists, readJson, readText, writeJson } from "./store.js";
import { toList } from "./text.js";

function getDefaultConfig() {
  return {
    version: 1,
    profile: {
      fullName: "",
      email: "",
      location: "",
      targetRoles: [],
      skills: [],
      yearsExperience: "",
      remotePreference: "remote-first",
      salaryTarget: "",
      workAuthorization: "",
      summary: "",
    },
    documents: {
      resumePath: "",
      resumeText: "",
      coverLetterBasePath: "",
      coverLetterBaseText: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
    },
    search: {
      query: "",
      location: "Remote",
      remoteOnly: true,
      useDemoData: false,
      limit: 15,
      sources: ["remotive", "arbeitnow"],
      pages: 2,
    },
    ai: {
      provider: "openai",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.JOBBOT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini",
      temperature: Number(process.env.JOBBOT_TEMPERATURE || "0.4"),
    },
  };
}

export async function loadConfig(paths) {
  const defaults = getDefaultConfig();
  const current = await readJson(paths.configFile, defaults);
  const merged = mergeConfig(defaults, current);

  if (process.env.OPENAI_BASE_URL) {
    merged.ai.baseUrl = process.env.OPENAI_BASE_URL;
  }
  if (process.env.JOBBOT_MODEL || process.env.OPENAI_MODEL) {
    merged.ai.model = process.env.JOBBOT_MODEL || process.env.OPENAI_MODEL;
  }
  if (process.env.JOBBOT_TEMPERATURE) {
    merged.ai.temperature = Number(process.env.JOBBOT_TEMPERATURE);
  }

  return merged;
}

export async function saveConfig(paths, config) {
  await writeJson(paths.configFile, config);
}

export function mergeConfig(base, next) {
  const merged = structuredClone(base);

  for (const [sectionKey, sectionValue] of Object.entries(next ?? {})) {
    if (
      typeof sectionValue === "object" &&
      sectionValue !== null &&
      !Array.isArray(sectionValue) &&
      sectionKey in merged
    ) {
      merged[sectionKey] = {
        ...merged[sectionKey],
        ...sectionValue,
      };
    } else {
      merged[sectionKey] = sectionValue;
    }
  }

  merged.profile.targetRoles = toList(merged.profile.targetRoles);
  merged.profile.skills = toList(merged.profile.skills);
  merged.search.sources = toList(merged.search.sources).map((item) => item.toLowerCase());
  return merged;
}

export async function importDocumentText(currentValue, filePath, cwd) {
  if (!filePath) {
    return {
      resolvedPath: "",
      text: currentValue ?? "",
    };
  }

  const resolvedPath = path.resolve(cwd, filePath);
  if (!(await fileExists(resolvedPath))) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const text = await readText(resolvedPath);
  if (!text.trim()) {
    throw new Error(`The file is empty: ${resolvedPath}`);
  }

  return { resolvedPath, text };
}

export function hasProfileBasics(config) {
  return Boolean(
    config.profile.fullName &&
      config.profile.email &&
      config.profile.targetRoles.length &&
      config.documents.resumeText,
  );
}
