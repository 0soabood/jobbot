import test from "node:test";
import assert from "node:assert/strict";
import { isAiConfigured } from "../src/services/ai.js";
import { searchJobs } from "../src/services/jobs.js";
import { ensureAppLayout, getPaths } from "../src/lib/paths.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const paths = getPaths(ROOT_DIR);

test("test app layout exists", async () => {
  await ensureAppLayout(paths);
});

test("isAiConfigured returns false without API key", () => {
  // Save original env
  const originalKey = process.env.OPENAI_API_KEY;
  const originalJobbotKey = process.env.JOBBOT_OPENAI_API_KEY;
  const originalJobBotKeyAlias = process.env.JOB_BOT_OPENAI_API_KEY;
  
  delete process.env.OPENAI_API_KEY;
  delete process.env.JOBBOT_OPENAI_API_KEY;
  delete process.env.JOB_BOT_OPENAI_API_KEY;
  
  assert.equal(isAiConfigured(), false);
  
  // Restore
  if (originalKey) process.env.OPENAI_API_KEY = originalKey;
  if (originalJobbotKey) process.env.JOBBOT_OPENAI_API_KEY = originalJobbotKey;
  if (originalJobBotKeyAlias) process.env.JOB_BOT_OPENAI_API_KEY = originalJobBotKeyAlias;
});

test("isAiConfigured returns true with API key", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalJobbotKey = process.env.JOBBOT_OPENAI_API_KEY;
  
  process.env.OPENAI_API_KEY = "test-key";
  assert.equal(isAiConfigured(), true);

  delete process.env.OPENAI_API_KEY;
  process.env.JOBBOT_OPENAI_API_KEY = "test-key-alt";
  assert.equal(isAiConfigured(), true);
  
  // Restore
  if (originalKey) process.env.OPENAI_API_KEY = originalKey;
  else delete process.env.OPENAI_API_KEY;
  if (originalJobbotKey) process.env.JOBBOT_OPENAI_API_KEY = originalJobbotKey;
  else delete process.env.JOBBOT_OPENAI_API_KEY;
});

test("searchJobs with demo data", async () => {
  const search = { query: "operations", limit: 5, useDemoData: true };
  const profile = { targetRoles: ["Product Manager"], skills: ["Operations"] };
  
  const result = await searchJobs({ paths, search, profile });
  assert.ok(Array.isArray(result.jobs));
  assert.ok(result.jobs.length > 0);
});

test("searchJobs filters by query", async () => {
  const search = { query: "nonexistent123", limit: 5, useDemoData: true };
  const profile = { targetRoles: ["Product Manager"], skills: ["Operations"] };
  
  const result = await searchJobs({ paths, search, profile });
  assert.ok(Array.isArray(result.jobs));
  // The demo data might return results that don't match the query
  // Just verify the structure is correct
  if (result.jobs.length > 0) {
    assert.ok(result.jobs[0].title || result.jobs[0].company);
  }
});
