import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["en", "tr", "de", "fr", "es", "pt-BR", "ja"];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

for (const locale of locales) {
  const file = locale === "en" ? path.join(root, "index.html") : path.join(root, locale, "index.html");
  const html = await readFile(file, "utf8");
  check(html.includes(`<html lang="${locale}"`), `${locale}: incorrect lang attribute`);
  check(!html.includes("{{"), `${locale}: unresolved template placeholder`);
  check((html.match(/rel="alternate" hreflang=/g) || []).length === 8, `${locale}: incomplete hreflang set`);
  check(html.includes("application/ld+json"), `${locale}: missing structured data`);
  check(html.includes("supported") || locale !== "en", `${locale}: PDF scope copy missing`);
}

for (const relativePath of [
  "support.html",
  "privacy.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "assets/site.css",
  "assets/site.js",
  "assets/KeptLogo.png",
  "assets/kept-social-preview.png",
  "assets/media/kept-demo.mp4",
  "assets/media/kept-demo-poster.jpg",
  "assets/media/kept-demo-en.vtt"
]) {
  try { await access(path.join(root, relativePath)); }
  catch { failures.push(`missing required file: ${relativePath}`); }
}

const support = await readFile(path.join(root, "support.html"), "utf8");
const privacy = await readFile(path.join(root, "privacy.html"), "utf8");
check(support.includes('href="./support.html"'), "support page lacks stable self-link");
check(privacy.includes('href="./support.html"'), "privacy page still points Support to landing page");
check(privacy.includes("GitHub Pages"), "interim hosting disclosure unexpectedly changed");

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Verified ${locales.length} localized pages and all required static assets.`);
