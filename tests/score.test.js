import test from "node:test";
import assert from "node:assert/strict";
import { scoreJob } from "../src/services/score.js";

test("scores matching remote engineering role higher", () => {
  const profile = {
    targetRoles: ["Software Engineer"],
    skills: ["Node.js", "TypeScript", "APIs", "Automation"],
    yearsExperience: "5",
    remotePreference: "remote-first",
    location: "Berlin",
  };

  const strongMatch = {
    title: "Senior Software Engineer",
    description: "Build Node.js APIs, automation tools, and internal systems.",
    remote: true,
    location: "Remote - Europe",
  };

  const weakMatch = {
    title: "Office Manager",
    description: "Coordinate calendars, visitors, and facilities.",
    remote: false,
    location: "Berlin",
  };

  assert.ok(scoreJob(strongMatch, profile).score > scoreJob(weakMatch, profile).score);
});
