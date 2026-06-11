import fs from "node:fs";
import path from "node:path";

const siteDir = process.argv[2] || "_site";
const root = path.resolve(siteDir);

if (!fs.existsSync(root)) {
  console.error(`Built site directory not found: ${root}`);
  process.exit(1);
}

const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

function normalizeLocalPath(rawValue) {
  if (!rawValue || rawValue.startsWith("http://") || rawValue.startsWith("https://") || rawValue.startsWith("//") || rawValue.startsWith("data:") || rawValue.startsWith("#")) {
    return null;
  }

  const [withoutHash] = rawValue.split("#");
  const [pathname] = withoutHash.split("?");
  if (!pathname || !pathname.startsWith("/")) return null;
  return decodeURIComponent(pathname);
}

walk(root);

const missing = [];
const imageTagPattern = /<(img|source|video)\b[^>]*>/gi;
const attrPattern = /\b(?:src|srcset|poster)=["']([^"']+)["']/gi;

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, "utf8");
  let match;

  let tagMatch;

  while ((tagMatch = imageTagPattern.exec(html)) !== null) {
    const tag = tagMatch[0];
    attrPattern.lastIndex = 0;

    while ((match = attrPattern.exec(tag)) !== null) {
      const attrValue = match[1];
      const candidates = attrValue
        .split(",")
        .map(part => part.trim().split(/\s+/)[0])
        .filter(Boolean);

      for (const candidate of candidates) {
        const localPath = normalizeLocalPath(candidate);
        if (!localPath) continue;

        const expected = path.join(root, localPath);
        if (!fs.existsSync(expected)) {
          missing.push(`${path.relative(root, htmlFile)} -> ${candidate}`);
        }
      }
    }
  }
}

if (missing.length) {
  console.error("Missing local image assets:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Local image reference audit passed for ${siteDir}`);
