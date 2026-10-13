# Two Weeks in Hawaiʻi

A private, password-gated site that presents a honeymoon itinerary chapter by chapter, plus a
case study explaining how the trip was planned. Content is authored locally through an
admin tool that never ships to production.

## Getting started

```bash
cp .env.example .env.local   # then fill in the values (see below)
npm install
npm run dev                  # http://localhost:3000
```

## Environment

| Variable | Purpose |
| --- | --- |
| `SITE_PASSWORD_HASH` | bcrypt hash of the shared site password. Escape every `$` as `\$`. |
| `SESSION_SECRET` | ≥32 random characters, used to seal the session cookie. |
| `CLOUDINARY_*` | Optional. Cloud name / API key / API secret for signed-URL delivery of photos not shipped with the site. |
| `PHOTO_SOURCE_DIR` | Local folder the admin media browser scans. Never read in production. |

Generate the two secrets with:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## How the content works

All trip content lives in a single file, `content/trip-data.json`: chapters, their
activities, media references, and the planning case study. `content/trip.ts` imports it statically,
so **the public site is built from a snapshot** — author locally, then rebuild and
redeploy to publish.

A few values are deliberately *not* stored, so they can never disagree with the
itinerary they describe:

- **Trip and chapter dates, and day counts** come from the activities' dates
  (`lib/content.ts`, `content/chapters.ts`).
- **The time budget on the planning page** is derived from activity durations and
  interest tags (`lib/time-budget.ts`).
- **Nights** are authored per chapter (a chapter is a place we stayed); the trip total
  is their sum.

## Where images come from

`lib/media-delivery.ts` picks a source per photo, in this order:

1. **The local library, in development.** If `PHOTO_SOURCE_DIR` is set and the photo's
   `sourcePath` file exists, it is served through `/admin/api/raw`, which resizes it
   on demand with sharp (`?w=`) and returns WebP. This lets the whole site be authored
   and reviewed with the real photos before anything is rendered.
2. **WebP derivatives shipped with the site.** `npm run build-media` renders every
   referenced photo from `media-source/` into `public/media/` at a few widths and writes
   `content/media-manifest.json` (committed) describing them. The files are not in git;
   the Vercel CLI uploads them with each deploy (see `.vercelignore`). This is what a
   deployed site uses. `lib/media-manifest.ts` holds the widths and quality.
3. **Cloudinary signed URLs**, whenever credentials are configured.
4. **A placeholder**, if none of the above.

Local delivery is off in any production build — the route that serves it 404s there. To
preview the shipped derivatives while developing, unset `PHOTO_SOURCE_DIR`. `npm run
build` runs `scripts/check-media.ts` first and fails if a referenced photo has not been
rendered, or if the rendered files did not come along, so a deploy can never ship holes.

## Authoring workflow

The admin tool is available at `/admin` in development only — it reads an arbitrary
local filesystem path and bypasses the site password, so every entry point (layout,
route handlers, and every server action) refuses to run when `NODE_ENV=production`.

1. **`/admin/library`** — browse `PHOTO_SOURCE_DIR`, grouped by capture date. Rotate
   photos in place and assign each one to a chapter hero, an activity's cover or its rows.
2. **`/admin/itinerary`** — open a chapter to edit everything in it, laid out as the
   reader sees it: add activities (date, time, duration, interest tags), their photos,
   and **alt text and captions**. Edits save automatically as you type.
3. **`/admin/story`** — the trip's name and subtitle, the case-study intro, planning
   principles, and the trade-offs behind them.
4. **`npm run build-media`** — renders every referenced photo in `media-source/` into
   `public/media/` and updates `content/media-manifest.json`. Safe to re-run: it keeps
   what is current, renders what is new, and prunes what is gone. Commit the manifest.
5. **`vercel --prod`** — see Deploying.

(`npm run upload-media` pushes the same staged files to Cloudinary instead, for the
optional signed-URL delivery.)

Assigning a photo stages a copy into `media-source/` under a public id derived from its
path in the library, so moving a photo between activities reuses the same file. Removing
a photo deletes its staged copy.

## Access

The site is meant to be shared by link with specific people, not discovered:

- `proxy.ts` gates every non-`/admin` route behind a bcrypt password and an encrypted
  `iron-session` cookie, with a per-IP attempt throttle.
- A link can carry the password: `https://honeymoon-lake.vercel.app/?key=<password>`
  (URL-encode it if it has spaces or symbols). The gate checks it like the form would,
  sets the cookie, and redirects to the same address without the key. The recipient's
  browser history keeps the original link, so share it only with people who should
  have the password anyway.
- The shipped photographs under `/media` are static files, but the proxy's matcher
  covers them, so they need the same cookie as a page, and they are served
  `Cache-Control: private` so no shared cache holds them.
- Cloudinary assets, if used, are uploaded as `authenticated` and delivered through
  signed URLs generated server-side, so they can't be hotlinked out of the site.
- `noindex` is set both in metadata and as an `X-Robots-Tag` header on every response.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server, including `/admin`. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint. |
| `npm run build-media` | Render the referenced photos to `public/media/` and write the manifest. |
| `npm run upload-media` | Push staged media to Cloudinary (optional). |

## Deploying

The site is deployed from this folder with the Vercel CLI. The GitHub remote
(`reginaldwhite/honeymoon`) is for backup and history only — do not connect the Vercel
project to it, because `public/media/` is not in git and a git-triggered build would fail
the media check. Once, per machine: `vercel link --project honeymoon`, then add `SITE_PASSWORD_HASH`
and `SESSION_SECRET` as production env vars (`vercel env add … production`). Never set
`PHOTO_SOURCE_DIR` there. Then, after every content change:

```
npm run build-media
vercel --prod
```

`.vercelignore` decides what is uploaded — the CLI does not read `.gitignore` — and it
deliberately lets `public/media/` through while keeping the library out.
