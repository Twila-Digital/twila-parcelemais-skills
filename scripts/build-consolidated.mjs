#!/usr/bin/env node
// Concatena rules/, examples/, tools/ e utils/ num único SKILL-CONSOLIDATED.md,
// para ferramentas de IA que só conseguem carregar um arquivo de skill.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const LANGUAGES = [
  ["dotnet", ".NET"],
  ["java", "Java"],
  ["node", "Node.js"],
  ["python", "Python"],
  ["php", "PHP"],
  ["go", "Go"],
];
const MODULES = ["orders", "simulations", "customers", "establishments", "webhooks", "security"];
const EXAMPLE_EXT = { dotnet: "cs", java: "java", node: "ts", python: "py", php: "php", go: "go" };
const MODULE_TITLES = {
  orders: "Orders",
  simulations: "Simulations",
  customers: "Customers",
  establishments: "Establishments",
  webhooks: "Webhooks",
  security: "Security",
};

function read(path) {
  return readFileSync(join(root, path), "utf8").split("\r\n").join("\n").trimEnd();
}

function splitTitle(content) {
  const match = content.match(/^# (.+)\n/);

  return match
    ? { title: match[1].trim(), body: content.slice(match[0].length) }
    : { title: null, body: content };
}

function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

function demoteHeadings(content, levels = 2) {
  let inFence = false;
  return content
    .split("\n")
    .map((line) => {
      if (/^```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line.replace(/^(#{1,4})\s/, (_, hashes) => "#".repeat(hashes.length + levels) + " ");
    })
    .join("\n");
}

const parts = [];

parts.push(`---
name: parcelemais-consolidated
description: Standalone consolidated skill for Parcele+ integration — all rules, examples, tools, and utilities inlined in a single file. No external references needed.
metadata:
  tags: parcelemais, cdc, credito, pix-parcelado, webhooks, checkout
---`);

parts.push(stripFrontmatter(read("SKILL.md")).split("## File Index")[0].trim());

parts.push("---\n\n## Rules: Agent Mode — Direct API Usage\n\n" + demoteHeadings(read("rules/agent.md").replace(/^# .+\n/, "")));

for (const [dir, label] of LANGUAGES) {
  let section = `---\n\n## Rules: ${label}\n`;
  for (const mod of MODULES) {
    const path = `rules/${dir}/${mod}.md`;
    if (!existsSync(join(root, path))) continue;
    const content = read(path).replace(/^# .+\n/, "");
    section += `\n### ${MODULE_TITLES[mod]}\n` + demoteHeadings(content, 1);
  }
  parts.push(section.trim());
}

for (const [dir, label] of LANGUAGES) {
  let section = `---\n\n## Examples: ${label}\n`;
  for (const mod of MODULES) {
    if (mod === "security") continue;
    const ext = EXAMPLE_EXT[dir];
    const path = `examples/${dir}/${mod}.${ext}`;
    if (!existsSync(join(root, path))) continue;
    section += `\n### ${MODULE_TITLES[mod]}\n\`\`\`${dir === "node" ? "ts" : dir}\n${read(path)}\n\`\`\`\n`;
  }
  parts.push(section.trim());
}

let tools = "---\n\n## Tools\n";
for (const f of ["auth", "environments", "production", "ecosystem"]) {
  const { title, body } = splitTitle(read(`tools/${f}.md`));
  tools += `\n### ${title}\n` + demoteHeadings(body, 2);
}
tools += "\n### SDKs\n";
for (const [dir] of LANGUAGES) {
  const { title, body } = splitTitle(read(`tools/sdks/${dir}.md`));
  tools += `\n#### ${title}\n` + demoteHeadings(body, 3);
}
parts.push(tools.trim());

let utils = "---\n\n## Utils\n";
for (const f of ["faq", "glossary"]) {
  const { title, body } = splitTitle(read(`utils/${f}.md`));
  utils += `\n### ${title}\n` + demoteHeadings(body, 2);
}
parts.push(utils.trim());

const skillVisual = read("SKILL.md").split("## Visual Documentation")[1];
if (skillVisual) {
  parts.push("---\n\n## Visual Documentation\n" + skillVisual.trim());
}

const output = parts.join("\n\n") + "\n";
writeFileSync(join(root, "SKILL-CONSOLIDATED.md"), output);
console.log(`SKILL-CONSOLIDATED.md gerado (${output.length} bytes).`);
