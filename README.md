# Kept website

Official product, support, and privacy website for Kept on macOS.

## Local preview

```bash
node scripts/build-site.mjs
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Localized pages

Landing-page copy lives in `_site-src/locales.mjs`. The generator writes English to the repository root and the other supported languages to `tr/`, `de/`, `fr/`, `es/`, `pt-BR/`, and `ja/`.

When the final custom domain is ready, rebuild canonical URLs with:

```bash
KEPT_SITE_URL="https://your-domain.example" node scripts/build-site.mjs
```

## Product media

The homepage uses:

- `assets/media/kept-demo.mp4` — 16:9 H.264 product film, user-controlled playback (about 17 MB)
- `assets/media/kept-demo-poster.jpg` — 16:9 poster image
- `assets/media/kept-demo-en.vtt` — English accessibility captions
- `assets/kept-social-preview.png` — 1200 × 630 social preview

Replace a file while keeping its filename, then verify the site locally. Keep the product film compact because Firebase Hosting's free transfer quota is finite.

The current film contains a brief self-chat sharing shot. Replace it with a clean capture before using the website as a long-term press kit.

## Hosting

GitHub Pages currently publishes the `main` branch from the repository root. `firebase.json` prepares the same static files for Firebase Hosting; no Firebase project ID is committed, and deployment is intentionally left for the custom-domain migration.

The privacy policy currently identifies GitHub Pages as the web host. Update that disclosure and its date in the same release that moves the live domain to Firebase Hosting.
