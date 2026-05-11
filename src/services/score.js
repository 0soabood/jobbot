import { similarity, tokenize, unique } from "../lib/text.js";

const MID_LEVEL = ["mid", "intermediate", "ii", "iii"];
const SENIOR_LEVEL = ["senior", "staff", "principal", "lead", "manager", "director", "head"];
const JUNIOR_LEVEL = ["junior", "entry", "graduate", "intern", "associate"];

export function rankJobs(jobs, profile, searchConfig) {
  return jobs
    .map((job) => {
      const result = scoreJob(job, profile, searchConfig);
      return {
        ...job,
        score: result.score,
        reasons: result.reasons,
        matchedSkills: result.matchedSkills,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function scoreJob(job, profile, searchConfig = {}) {
  const titleTokens = tokenize(job.title);
  const descriptionTokens = tokenize(job.description);
  const roleTokens = tokenize(profile.targetRoles.join(" "));
  const skillTokens = tokenize(profile.skills.join(" "));
  const searchTokens = tokenize(searchConfig.query ?? "");
  const jobTokens = unique([...titleTokens, ...descriptionTokens]);

  const titleMatch = similarity(titleTokens, [...roleTokens, ...searchTokens]);
  const roleMatch = similarity(jobTokens, [...roleTokens, ...searchTokens]);
  const matchedSkills = profile.skills.filter((skill) =>
    jobTokens.includes(String(skill).toLowerCase()),
  );
  const skillMatch = profile.skills.length
    ? matchedSkills.length / Math.min(profile.skills.length, 8)
    : 0.35;

  const remoteBonus =
    profile.remotePreference === "remote-first" && job.remote
      ? 12
      : profile.remotePreference === "onsite"
        ? 0
        : 6;

  const locationBonus = isLocationMatch(job.location, profile.location) ? 6 : 0;
  const seniorityAdjustment = getSeniorityAdjustment(job.title, profile.yearsExperience);

  const rawScore =
    titleMatch * 34 +
    roleMatch * 22 +
    Math.min(skillMatch, 1) * 24 +
    remoteBonus +
    locationBonus +
    seniorityAdjustment;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const reasons = [];

  if (titleMatch > 0.2 || roleMatch > 0.16) {
    reasons.push("Title and description align with your target role");
  }
  if (matchedSkills.length) {
    reasons.push(`Matched skills: ${matchedSkills.slice(0, 5).join(", ")}`);
  }
  if (job.remote) {
    reasons.push("Remote-friendly listing");
  }
  if (locationBonus > 0) {
    reasons.push("Location lines up with your profile");
  }
  if (seniorityAdjustment > 0) {
    reasons.push("Seniority looks aligned");
  } else if (seniorityAdjustment < 0) {
    reasons.push("Seniority may be a stretch");
  }

  if (!reasons.length) {
    reasons.push("General keyword overlap with your profile");
  }

  return {
    score,
    reasons,
    matchedSkills,
  };
}

function isLocationMatch(jobLocation = "", profileLocation = "") {
  if (!jobLocation || !profileLocation) {
    return false;
  }

  const left = jobLocation.toLowerCase();
  const right = profileLocation.toLowerCase();
  return left.includes(right) || right.includes(left);
}

function getSeniorityAdjustment(title, yearsExperience) {
  const titleLower = String(title ?? "").toLowerCase();
  const years = Number.parseInt(yearsExperience, 10);

  if (Number.isNaN(years)) {
    return 0;
  }

  if (SENIOR_LEVEL.some((keyword) => titleLower.includes(keyword))) {
    return years >= 5 ? 8 : -8;
  }

  if (MID_LEVEL.some((keyword) => titleLower.includes(keyword))) {
    return years >= 2 ? 5 : -3;
  }

  if (JUNIOR_LEVEL.some((keyword) => titleLower.includes(keyword))) {
    return years <= 3 ? 6 : 0;
  }

  return years >= 2 ? 4 : 0;
}
