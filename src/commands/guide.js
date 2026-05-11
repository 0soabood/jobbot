import { importDocumentText, hasProfileBasics } from "../lib/config.js";
import {
  ask,
  askYesNo,
  printInfo,
  printMuted,
  printSection,
  printSuccess,
  printWarning,
} from "../lib/ui.js";
import { toList, parseSelection, truncate } from "../lib/text.js";
import { searchJobs } from "../services/jobs.js";
import { rankJobs } from "../services/score.js";
import { generateApplicationPacket, isAiConfigured } from "../services/ai.js";
import { saveApplicationPacket } from "../services/applications.js";

export async function runInitFlow({ config, paths, flags }) {
  printSection("Profile setup");
  const nextConfig = structuredClone(config);
  const nonInteractive =
    flags.nonInteractive !== undefined
      ? String(flags.nonInteractive).toLowerCase() !== "false"
      : Boolean(flags.yes);

  nextConfig.profile.fullName = await resolveField(
    flags.name ?? flags.fullName,
    "Full name",
    nextConfig.profile.fullName,
    nonInteractive,
  );
  nextConfig.profile.email = await resolveField(
    flags.email,
    "Email",
    nextConfig.profile.email,
    nonInteractive,
  );
  nextConfig.profile.location = await resolveField(
    flags.location,
    "Location",
    nextConfig.profile.location,
    nonInteractive,
  );
  nextConfig.profile.targetRoles = toList(
    await resolveField(
      flags.roles ?? flags.targetRoles,
      "Target roles (comma separated)",
      nextConfig.profile.targetRoles.join(", "),
      nonInteractive,
    ),
  );
  nextConfig.profile.skills = toList(
    await resolveField(
      flags.skills,
      "Core skills (comma separated)",
      nextConfig.profile.skills.join(", "),
      nonInteractive,
    ),
  );
  nextConfig.profile.yearsExperience = await resolveField(
    flags.experience ?? flags.yearsExperience,
    "Years of experience",
    nextConfig.profile.yearsExperience,
    nonInteractive,
  );
  nextConfig.profile.remotePreference = await resolveField(
    flags.remotePreference,
    "Remote preference (remote-first, hybrid, onsite)",
    nextConfig.profile.remotePreference,
    nonInteractive,
  );
  nextConfig.profile.summary = await resolveField(
    flags.summary,
    "Short profile summary",
    nextConfig.profile.summary,
    nonInteractive,
  );

  const resumePath = await resolveField(
    flags.resume,
    "Resume file path (.txt or .md)",
    nextConfig.documents.resumePath,
    nonInteractive,
  );
  if (resumePath) {
    const imported = await importDocumentText(nextConfig.documents.resumeText, resumePath, paths.cwd);
    nextConfig.documents.resumePath = imported.resolvedPath;
    nextConfig.documents.resumeText = imported.text;
  }

  const coverLetterPath = await resolveField(
    flags.coverLetter,
    "Base cover letter file path (optional)",
    nextConfig.documents.coverLetterBasePath,
    nonInteractive,
  );
  if (coverLetterPath) {
    const imported = await importDocumentText(
      nextConfig.documents.coverLetterBaseText,
      coverLetterPath,
      paths.cwd,
    );
    nextConfig.documents.coverLetterBasePath = imported.resolvedPath;
    nextConfig.documents.coverLetterBaseText = imported.text;
  }

  nextConfig.documents.linkedinUrl = await resolveField(
    flags.linkedin ?? flags.linkedinUrl,
    "LinkedIn URL",
    nextConfig.documents.linkedinUrl,
    nonInteractive,
  );
  nextConfig.documents.githubUrl = await resolveField(
    flags.github ?? flags.githubUrl,
    "GitHub URL",
    nextConfig.documents.githubUrl,
    nonInteractive,
  );
  nextConfig.documents.portfolioUrl = await resolveField(
    flags.portfolio ?? flags.portfolioUrl,
    "Portfolio URL",
    nextConfig.documents.portfolioUrl,
    nonInteractive,
  );

  nextConfig.search.query = await resolveField(
    flags.searchQuery,
    "Default job search query",
    nextConfig.search.query || nextConfig.profile.targetRoles.join(" OR "),
    nonInteractive,
  );
  nextConfig.search.location = await resolveField(
    flags.searchLocation,
    "Default search location",
    nextConfig.search.location,
    nonInteractive,
  );
  nextConfig.search.limit = Number.parseInt(
    await resolveField(
      flags.limit,
      "Default result count",
      String(nextConfig.search.limit),
      nonInteractive,
    ),
    10,
  );

  printSuccess("Profile setup complete.");
  return nextConfig;
}

export async function runGuide({ config, paths, flags }) {
  let nextConfig = structuredClone(config);

  if (!hasProfileBasics(nextConfig)) {
    printWarning("Your profile is incomplete, so I’m running setup first.");
    nextConfig = await runInitFlow({ config: nextConfig, paths, flags });
  }

  printSection("Search focus");
  nextConfig.search.query = flags.query ?? (await ask("Search query", nextConfig.search.query));
  nextConfig.search.location =
    flags.location ?? (await ask("Location", nextConfig.search.location));
  nextConfig.search.limit = Number.parseInt(
    flags.limit ?? (await ask("How many listings should I pull?", String(nextConfig.search.limit))),
    10,
  );
  nextConfig.search.useDemoData =
    flags.demo !== undefined ? String(flags.demo).toLowerCase() !== "false" : false;
  nextConfig.search.remoteOnly = flags.remoteOnly
    ? String(flags.remoteOnly).toLowerCase() !== "false"
    : await askYesNo("Remote only", nextConfig.search.remoteOnly);

  printInfo("Pulling live jobs...");
  const { jobs, errors } = await searchJobs({
    paths,
    search: nextConfig.search,
    profile: nextConfig.profile,
  });
  const ranked = rankJobs(jobs, nextConfig.profile, nextConfig.search);

  if (errors.length) {
    printWarning(`Some sources failed: ${errors.join(" | ")}`);
  }

  if (!ranked.length) {
    printWarning("No jobs came back from the configured sources.");
    return nextConfig;
  }

  printSection("Shortlist");
  const shortlist = ranked.slice(0, Math.min(ranked.length, 10));
  shortlist.forEach((job, index) => {
    console.log(
      `${index + 1}. ${job.title} @ ${job.company} | score ${job.score} | ${job.location || "Remote"} | ${truncate(job.reasons.join("; "), 90)}`,
    );
  });

  const defaultSelection = shortlist
    .slice(0, Math.min(3, shortlist.length))
    .map((_, index) => index + 1)
    .join(",");

  const selectionInput =
    flags.jobs ??
    (await ask(
      "Which jobs should I prep? Use numbers like 1,2,3 or 1-3",
      defaultSelection,
    ));
  const selectedIndexes = parseSelection(selectionInput, shortlist.length);
  const selectedJobs = selectedIndexes.map((index) => shortlist[index]).filter(Boolean);

  if (!selectedJobs.length) {
    printWarning("No jobs selected, so I’m stopping after ranking.");
    return nextConfig;
  }

  printSection("Application packets");
  if (isAiConfigured()) {
    printMuted(`AI mode active with model ${nextConfig.ai.model}`);
  } else {
    printWarning("No OpenAI key found, so I’ll use rule-based drafting.");
  }

  for (const job of selectedJobs) {
    printInfo(`Preparing ${job.title} @ ${job.company}`);
    const packet = await generateApplicationPacket({
      config: nextConfig,
      profile: nextConfig.profile,
      documents: nextConfig.documents,
      job,
    });
    const saved = await saveApplicationPacket({
      paths,
      profile: nextConfig.profile,
      job,
      packet,
    });
    printSuccess(`Packet saved to ${saved.paths.packetDir}`);
  }

  printSuccess("Your shortlisted applications are ready for review.");
  return nextConfig;
}

async function resolveField(flagValue, prompt, defaultValue, nonInteractive = false) {
  if (flagValue !== undefined) {
    return flagValue;
  }
  if (nonInteractive) {
    return defaultValue;
  }
  return ask(prompt, defaultValue);
}
