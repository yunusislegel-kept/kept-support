import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { locales } from "../_site-src/locales.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(root, "_site-src", "index.template.html");
const template = await readFile(templatePath, "utf8");
const siteUrl = process.env.KEPT_SITE_URL || "https://yunusislegel-kept.github.io/kept-support";
const localeCodes = ["en", "tr", "de", "fr", "es", "pt-BR", "ja"];
const localeLabels = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  "pt-BR": "Português",
  ja: "日本語"
};
const ogLocales = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  "pt-BR": "pt_BR",
  ja: "ja_JP"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function flatten(value, prefix = "", result = {}) {
  for (const [key, item] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === "object" && !Array.isArray(item)) flatten(item, nextKey, result);
    else result[nextKey] = item;
  }
  return result;
}

function localeUrl(locale) {
  return locale === "en" ? `${siteUrl}/` : `${siteUrl}/${locale}/`;
}

function makeLanguageOptions(activeLocale) {
  return localeCodes.map((locale) => {
    const selected = locale === activeLocale ? " selected" : "";
    return `<option value="${locale}"${selected}>${localeLabels[locale]}</option>`;
  }).join("\n              ");
}

function makeHreflangLinks() {
  const links = localeCodes.map((locale) =>
    `<link rel="alternate" hreflang="${locale}" href="${localeUrl(locale)}">`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${localeUrl("en")}">`);
  return links.join("\n  ");
}

function makeOgAlternates(activeLocale) {
  return localeCodes
    .filter((locale) => locale !== activeLocale)
    .map((locale) => `<meta property="og:locale:alternate" content="${ogLocales[locale]}">`)
    .join("\n  ");
}

function makeStructuredData(locale, copy) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kept: Clipboard & PDF Editor",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS 13.0 or later",
    url: localeUrl(locale),
    downloadUrl: "https://apps.apple.com/app/id6772479708",
    image: `${siteUrl}/assets/kept-social-preview.png`,
    description: copy.meta.description,
    softwareVersion: "2.0",
    author: {
      "@type": "Person",
      name: "Yunus İşlegel"
    },
    offers: {
      "@type": "Offer",
      category: "Free download with optional one-time in-app purchase"
    }
  };
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

async function buildLocale(locale) {
  const copy = locales[locale];
  if (!copy) throw new Error(`Missing locale: ${locale}`);
  const isRoot = locale === "en";
  const outputDir = isRoot ? root : path.join(root, locale);
  const outputPath = path.join(outputDir, "index.html");
  const values = {
    ...flatten(copy),
    lang: locale,
    dir: "ltr",
    rootPrefix: isRoot ? "./" : "../",
    assetPrefix: isRoot ? "./" : "../",
    canonical: localeUrl(locale),
    siteUrl,
    ogLocale: ogLocales[locale],
    hreflangLinks: makeHreflangLinks(),
    ogLocaleAlternates: makeOgAlternates(locale),
    languageOptions: makeLanguageOptions(locale),
    structuredData: makeStructuredData(locale, copy)
  };
  let html = template;
  for (const [key, rawValue] of Object.entries(values)) {
    const shouldEscape = !["hreflangLinks", "ogLocaleAlternates", "languageOptions", "structuredData"].includes(key);
    html = html.replaceAll(`{{${key}}}`, shouldEscape ? escapeHtml(rawValue) : String(rawValue));
  }
  const unresolved = [...html.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]);
  if (unresolved.length) throw new Error(`${locale}: unresolved placeholders: ${[...new Set(unresolved)].join(", ")}`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, html);
}

for (const locale of localeCodes) await buildLocale(locale);

const sitemapUrls = [
  ...localeCodes.map(localeUrl),
  `${siteUrl}/support.html`,
  `${siteUrl}/privacy.html`
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(root, "sitemap.xml"), sitemap);
await writeFile(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

console.log(`Built ${localeCodes.length} localized pages for ${siteUrl}`);
