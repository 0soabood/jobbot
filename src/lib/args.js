export function parseArgs(argv) {
  let command = null;
  const flags = {};
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!command && !token.startsWith("-")) {
      command = token;
      continue;
    }

    if (token.startsWith("--")) {
      const [rawKey, inlineValue] = token.slice(2).split("=");
      const key = toCamelCase(rawKey);

      if (inlineValue !== undefined) {
        flags[key] = inlineValue;
        continue;
      }

      const next = argv[index + 1];
      if (!next || next.startsWith("-")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        index += 1;
      }
      continue;
    }

    if (token.startsWith("-")) {
      const shortFlags = token.slice(1).split("");
      for (const shortFlag of shortFlags) {
        flags[toCamelCase(shortFlag)] = true;
      }
      continue;
    }

    positionals.push(token);
  }

  return { command, flags, positionals };
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
