# Two Weeks in Hawaiʻi

A private, password-gated site that presents a honeymoon itinerary day by day, plus a
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
| `CLOUDINARY_*` | Cloud name / API key / API secret. Until these are set the site renders media placeholders instead of photos. |
| `PHOTO_SOURCE_DIR` | Local folder the admin media browser scans. Never read in production. |

Generate the two secrets with:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## How the content works

All trip content lives in a single file, `content/trip-data.json`: days, activities,
media references, and the planning case study. `content/trip.ts` imports it statically,
so **the public site is built from a snapshot** — author locally, then rebuild and
redeploy to publish.

A few values are deliberately *not* stored, so they can never disagree with the
itinerary they describe:

- **Trip start/end dates** are the first and last day (`lib/content.ts`).
- **Booked hours per day** are summed from that day's activity durations.
- **The time budget on the planning page** is derived from activity durations, interest
  tags, and each day's buffer hours (`lib/time-budget.ts`).

## Where images come from

`lib/media-delivery.ts` picks a source per photo, in this order:

1. **The local library, in development.** If `PHOTO_SOURCE_DIR` is set and the photo's
   `sourcePath` file exists, it is served through `/admin/api/raw`, which resizes it
   on demand with sharp (`?w=`) and returns WebP. This lets the whole site be authored
   and reviewed with the real photos before anything is uploaded to Cloudinary.
2. **Cloudinary signed URLs**, whenever credentials are configured.
3. **A placeholder**, if neither is available.

Local delivery is off in any production build — the route that serves it 404s there — so
a deployed site always uses Cloudinary. To preview real Cloudinary delivery while
developing, unset `PHOTO_SOURCE_DIR`.

## Authoring workflow

The admin tool is available at `/admin` in development only — it reads an arbitrary
local filesystem path and bypasses the site password, so every entry point (layout,
route handlers, and every server action) refuses to run when `NODE_ENV=production`.

1. **`/admin/library`** — browse `PHOTO_SOURCE_DIR`, grouped by capture date. Rotate
   photos in place and assign each one to a day's cover or an activity.
2. **`/admin/itinerary`** — "Sync days from photo library" creates a day for every
   capture date. Open a day to write its copy, add activities (time, duration, interest
   tags), and write **alt text and captions** for its photos.
3. **`/admin/story`** — the trip's name and subtitle, the case-study intro, planning
   principles, and the trade-offs behind them.
4. **`npm run upload-media`** — uploads everything staged in `media-source/` to
   Cloudinary as `authenticated` assets, matching each `MediaRef.publicId`. Safe to
   re-run; pass `--overwrite` to replace existing assets.
5. Rebuild and redeploy.

Assigning a photo stages a copy into `media-source/` under a public id derived from its
path in the library, so moving a photo between activities reuses the same file. Removing
a photo deletes its staged copy.

## Access

The site is meant to be shared by link with specific people, not discovered:

- `proxy.ts` gates every non-`/admin` route behind a bcrypt password and an encrypted
  `iron-session` cookie, with a per-IP attempt throttle.
- Cloudinary assets are uploaded as `authenticated` and delivered through signed URLs
  generated server-side, so they can't be hotlinked out of the site.
- `noindex` is set both in metadata and as an `X-Robots-Tag` header on every response.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server, including `/admin`. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint. |
| `npm run upload-media` | Push staged media to Cloudinary. |
