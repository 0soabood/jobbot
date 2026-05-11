import { isAiConfigured } from "../services/ai.js";
import { printSection } from "../lib/ui.js";

export async function runDoctor({ config, paths }) {
  printSection("Paths");
  console.log(`Home: ${paths.homeDir}`);
  console.log(`Config: ${paths.configFile}`);
  console.log(`Applications: ${paths.applicationsDir}`);
  console.log("");
  printSection("Profile");
  console.log(`Name: ${config.profile.fullName || "(missing)"}`);
  console.log(`Email: ${config.profile.email || "(missing)"}`);
  console.log(`Target roles: ${config.profile.targetRoles.join(", ") || "(missing)"}`);
  console.log(`Resume imported: ${config.documents.resumeText ? "yes" : "no"}`);
  console.log("");
  printSection("AI");
  console.log(`Configured: ${isAiConfigured() ? "yes" : "no"}`);
  console.log(`Model: ${config.ai.model}`);
  console.log(`Base URL: ${config.ai.baseUrl}`);
  console.log("");
  printSection("Search");
  console.log(`Query: ${config.search.query || "(missing)"}`);
  console.log(`Sources: ${config.search.sources.join(", ")}`);
  console.log(`Remote only: ${config.search.remoteOnly}`);
}
