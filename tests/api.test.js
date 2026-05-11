import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

const PORT = 8787;
const BASE_URL = `http://localhost:${PORT}`;

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

function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.request(`${BASE_URL}/api/health`, (res) => {
      resolve(res.statusCode === 200);
      res.resume(); // Consume response
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

test("API health endpoint", async (t) => {
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    t.skip("Server not running on port " + PORT);
    return;
  }
  
  const res = await request("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test("API profile endpoints", async (t) => {
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    t.skip("Server not running on port " + PORT);
    return;
  }
  
  // Get initial profile
  let res = await request("/api/profile");
  assert.equal(res.status, 200);
  
  // Update profile
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

test("API settings endpoints", async (t) => {
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    t.skip("Server not running on port " + PORT);
    return;
  }
  
  const res = await request("/api/settings");
  assert.equal(res.status, 200);
  assert.ok("aiProvider" in res.body);
  assert.ok("demoMode" in res.body);
});
