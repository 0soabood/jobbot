import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PORT = 8787;
const BASE_URL = `http://localhost:${PORT}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");

let serverProcess = null;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await request("/api/health");
      if (res.status === 200) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("API server did not become ready in time");
}

before(async () => {
  serverProcess = spawn("node", ["src/server.js"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      JOBBOT_UI_API_PORT: String(PORT),
    },
    stdio: "pipe",
  });

  serverProcess.on("error", (error) => {
    throw error;
  });

  await waitForServer();
});

after(async () => {
  if (!serverProcess) {
    return;
  }
  serverProcess.kill("SIGTERM");
  await new Promise((resolve) => {
    serverProcess.on("exit", resolve);
    setTimeout(resolve, 1500);
  });
});

test("API health endpoint", async () => {
  const res = await request("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test("API profile endpoints", async () => {
  let res = await request("/api/profile");
  assert.equal(res.status, 200);

  const profile = {
    fullName: "Test User",
    email: "test@example.com",
    targetRoles: ["Software Engineer"],
    skills: ["JavaScript", "TypeScript"],
  };

  res = await request("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.fullName, "Test User");
});

test("API settings endpoints", async () => {
  const res = await request("/api/settings");
  assert.equal(res.status, 200);
  assert.ok("aiProvider" in res.body);
  assert.ok("demoMode" in res.body);
});

test("API returns 400 on malformed JSON", async () => {
  const res = await request("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: '{"fullName":"Broken"',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Invalid JSON body");
});

test("API returns 400 on non-object profile payload", async () => {
  const res = await request("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(["bad"]),
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "profile must be a JSON object");
});

test("API returns 400 when creating application without jobId", async () => {
  const res = await request("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "jobId is required");
});
