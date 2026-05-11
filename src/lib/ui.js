import readline from "node:readline/promises";
import process from "node:process";

const colors = {
  reset: "\u001b[0m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  dim: "\u001b[2m",
  bold: "\u001b[1m",
};

export function printHero() {
  console.log("");
  console.log(`${colors.bold}${colors.cyan}jobbot${colors.reset} | the cheat code for job seekers`);
  console.log("tired of being screened by AI? start applying with AI!");
  console.log("");
}

export function printSection(title) {
  console.log(`${colors.bold}${title}${colors.reset}`);
}

export function printInfo(message) {
  console.log(`${colors.cyan}${message}${colors.reset}`);
}

export function printSuccess(message) {
  console.log(`${colors.green}${message}${colors.reset}`);
}

export function printWarning(message) {
  console.log(`${colors.yellow}${message}${colors.reset}`);
}

export function printError(message) {
  console.error(`${colors.red}${message}${colors.reset}`);
}

export function printMuted(message) {
  console.log(`${colors.dim}${message}${colors.reset}`);
}

export function printHelp() {
  console.log("Commands");
  console.log("  jobbot guide        Run the guided search + tailoring workflow");
  console.log("  jobbot init         Set up profile, resume, and search defaults");
  console.log("  jobbot search       Pull jobs and rank them without generating packets");
  console.log("  jobbot autopilot    Search and generate packets for top matches");
  console.log("  jobbot doctor       Check config, AI settings, and storage paths");
  console.log("");
  console.log("Useful flags");
  console.log("  --name              Profile full name for init");
  console.log("  --email             Profile email for init");
  console.log("  --roles             Target roles for init");
  console.log("  --skills            Core skills for init");
  console.log("  --non-interactive   Skip prompts and use provided/default values");
  console.log("  --query             Search terms, e.g. \"product designer\"");
  console.log("  --location          Preferred location filter");
  console.log("  --limit             Number of jobs to fetch");
  console.log("  --top               Number of packets to generate in autopilot");
  console.log("  --demo              Use bundled sample jobs instead of live APIs");
  console.log("  --resume            Import a resume text or markdown file");
  console.log("  --cover-letter      Import a base cover letter file");
  console.log("");
}

export function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export async function ask(prompt, defaultValue = "") {
  const rl = createPrompt();
  const suffix = defaultValue ? ` ${colors.dim}[${defaultValue}]${colors.reset}` : "";
  const answer = await rl.question(`${prompt}${suffix}: `);
  rl.close();
  const trimmed = answer.trim();
  return trimmed || defaultValue;
}

export async function askYesNo(prompt, defaultValue = true) {
  const label = defaultValue ? "Y/n" : "y/N";
  const answer = await ask(`${prompt} (${label})`);
  if (!answer) {
    return defaultValue;
  }
  return ["y", "yes"].includes(answer.toLowerCase());
}
