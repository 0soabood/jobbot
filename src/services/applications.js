import path from "node:path";
import { randomUUID } from "node:crypto";
import { ensureDir, readJson, writeJson, writeText } from "../lib/store.js";
import { slugify } from "../lib/text.js";

export async function saveApplicationPacket({ paths, profile, job, packet }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const folderName = `${timestamp}-${slugify(job.company)}-${slugify(job.title)}`;
  const packetDir = path.join(paths.applicationsDir, folderName);
  await ensureDir(packetDir);

  const summaryFile = path.join(packetDir, "job-summary.md");
  const resumeFile = path.join(packetDir, "resume-tailoring.md");
  const coverLetterFile = path.join(packetDir, "cover-letter.md");
  const answersFile = path.join(packetDir, "application-answers.md");
  const checklistFile = path.join(packetDir, "checklist.md");
  const metadataFile = path.join(packetDir, "application.json");

  await writeText(summaryFile, buildJobSummary(job, packet));
  await writeText(resumeFile, buildResumeTailoring(profile, packet));
  await writeText(coverLetterFile, packet.coverLetter.trim());
  await writeText(answersFile, buildAnswers(packet));
  await writeText(checklistFile, buildChecklist(job, packet));

  const record = {
    id: randomUUID(),
    generatedAt: new Date().toISOString(),
    job,
    packet,
    paths: {
      packetDir,
      summaryFile,
      resumeFile,
      coverLetterFile,
      answersFile,
      checklistFile,
    },
  };

  await writeJson(metadataFile, record);
  await appendApplicationIndex(paths, record);
  return record;
}

async function appendApplicationIndex(paths, record) {
  const current = (await readJson(paths.applicationsIndexFile, [])) ?? [];
  current.unshift({
    id: record.id,
    generatedAt: record.generatedAt,
    company: record.job.company,
    title: record.job.title,
    source: record.job.source,
    url: record.job.url,
    packetDir: record.paths.packetDir,
  });
  await writeJson(paths.applicationsIndexFile, current.slice(0, 200));
}

function buildJobSummary(job, packet) {
  return `# ${job.title} @ ${job.company}

- Source: ${job.sourceLabel}
- Apply URL: ${job.url}
- Location: ${job.location || "Not specified"}
- Employment type: ${job.employmentType || "Not specified"}
- Posted at: ${job.postedAt || "Unknown"}

## Why this is a fit

${packet.fitSummary}

## ATS keywords

${packet.atsKeywords.map((keyword) => `- ${keyword}`).join("\n")}

## Notes

${packet.notes.map((note) => `- ${note}`).join("\n") || "- None"}
`;
}

function buildResumeTailoring(profile, packet) {
  return `# Resume Tailoring

## Recommended headline

${packet.resumeHeadline}

## Bullet guidance

${packet.resumeHighlights.map((item) => `- ${item}`).join("\n")}

## Existing profile anchors

- Name: ${profile.fullName}
- Target roles: ${profile.targetRoles.join(", ")}
- Core skills: ${profile.skills.join(", ")}
`;
}

function buildAnswers(packet) {
  return `# Application Answers

## Why this role

${packet.applicationAnswers.whyThisRole}

## Why this company

${packet.applicationAnswers.whyThisCompany}

## Value proposition

${packet.applicationAnswers.valueProposition}

## Availability

${packet.applicationAnswers.availability}

## Interview prep

${packet.interviewPrep.map((item) => `- ${item}`).join("\n")}
`;
}

function buildChecklist(job, packet) {
  return `# Final Apply Checklist

- Open the listing: ${job.url}
- Update your resume using resume-tailoring.md
- Paste the tailored cover letter from cover-letter.md
- Reuse answers from application-answers.md
- Verify contact details and attachments
- Click send

## Sanity checks

- This draft was generated in ${packet.mode} mode via ${packet.provider}
- Re-read for truthfulness and tone
- Confirm any metrics or claims before submitting
`;
}
