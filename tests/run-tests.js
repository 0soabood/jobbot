import assert from "node:assert/strict";
import { scoreJob } from "../src/services/score.js";
import { parseSelection, slugify, stripHtml } from "../src/lib/text.js";

const tests = [
  {
    name: "scores matching remote engineering role higher",
    run() {
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
    },
  },
  {
    name: "stripHtml removes tags and entities",
    run() {
      assert.equal(stripHtml("<p>Hello &amp; <strong>world</strong></p>"), "Hello & world");
    },
  },
  {
    name: "slugify creates safe folder names",
    run() {
      assert.equal(slugify("Senior Product Designer @ ACME"), "senior-product-designer-acme");
    },
  },
  {
    name: "parseSelection expands ranges",
    run() {
      assert.deepEqual(parseSelection("1,3-4", 5), [0, 2, 3]);
    },
  },
];

let failures = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error.stack);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} tests passed.`);
}
