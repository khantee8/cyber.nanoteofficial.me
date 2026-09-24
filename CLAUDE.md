# CLAUDE.md — cyber.nanoteofficial.me

Guidance for Claude Code when working in this repository.

> Next.js 16 with React 19 — APIs differ from training data. Read `node_modules/next/dist/docs/` or use the context7 MCP tool before writing Next-specific code.

## What this is

**NaNote Cyber**: a cybersecurity platform with several modules behind one landing page and one login.

- **Threat Intel** (`/intel`, public) — live ops view over free public feeds. Also feeds the landing page HUD and map band.
- **GRC / ISO 27001** (`/grc/iso27001`, gated) — an ISMS workspace: 93 Annex A controls, gap assessment, risk register, Statement of Applicability. The framework registry (`src/lib/grc/frameworks.ts`) is built for further frameworks (CRAF) to slot in beside it.
- **GRC / NIST CSF 2.0** (`/grc/nist-csf-2`, gated) — an Organisational Profile workspace: Current/Target scoring (0–10, half-point steps) for all 106 CSF 2.0 subcategories, gap analysis by Function and Category, per-Function ratings, Tiers, NIST Implementation Examples, cross-reference to the ISO 27001 assessment (via NIST's informative reference) with suggestions, a risk register shared with ISO 27001, and CSV export.
- **AI Red Teaming** and **Training / Consulting** — "in design" pages only (`src/app/redteam`, `src/app/training`).

Design spec: `/project/docs/superpowers/specs/2026-09-08-cyber-nanoteofficial-v1-design.md`. Plan: `/project/docs/superpowers/plans/2026-09-08-cyber-nanoteofficial-v1.md`.

## Commands

```bash
npm run dev                 # http://localhost:3000
npm run build               # must pass with DATABASE_URL unset
npm run lint
npm test                    # vitest — parsers, aggregate, geo, catalogue, scoring (pure logic only)
npx tsc --noEmit
npm run intel:snapshot      # refresh src/lib/intel/fallback.json from the live feeds (refuses if any source is down)
npm run csf:import          # regenerate src/lib/grc/nist-csf-2/catalogue.data.json from the NIST CPRT export (network; not run in CI)
npm run -s seed:demo -- --org "BankX" | psql "$DATABASE_URL_UNPOOLED"   # load the fictional BankX assessment (ISO + CSF) into an existing organisation (re-runnable). The `-s` is required: without it npm's own banner line ("> cyber.nanoteofficial.me@… seed:demo") leaks into the piped SQL and breaks psql's parser.
DATABASE_URL="…" npx drizzle-kit push   # production (Neon HTTP) only — see "Local development with a database" for why this doesn't work against the local proxy
```

Release gate: `npx tsc --noEmit && npm run lint && npm test && npm run build`.

## Architecture rules

- **Auth gate** is `src/app/(app)/layout.tsx` and nowhere else. No middleware, no `proxy.ts`. Public routes live outside `(app)`. Approval is re-read from the DB on every gated request.
- **DB client** (`src/db/index.ts`): the eager `db` exists only because `@auth/drizzle-adapter` needs a real instance at module load. **App code uses `getDb()`**, which throws loudly when `DATABASE_URL` is unset — that is what keeps the build green without a database.
- **Threat Intel refresh** (`src/lib/intel/refresh.ts` + `store.ts` + `db.ts` + `cronAuth.ts`, route `src/app/api/cron/intel/route.ts`): a background job, not a page request. `.github/workflows/intel-refresh.yml` runs every 30 min (also `workflow_dispatch`); `vercel.json` adds a once-daily Vercel cron as a backstop. Both call `GET /api/cron/intel` with `Authorization: Bearer $CRON_SECRET` — `cronAuth.isAuthorised` fails closed (401) if the secret is unset, missing, or wrong. The route re-fetches each source (KEV conditionally, via ETag/If-Modified-Since), merges the result into `intel_source` — one row per source, last good copy kept on failure — and calls `revalidateTag('intel', { expire: 0 })`. Cadence must never go below 30 min: that's the Neon free-tier compute budget.
- **Threat Intel read path** (`src/lib/intel/snapshot.ts`): `getIntelSnapshot()` is one `unstable_cache` (tag `intel`, 1 h `revalidate` as a safety net only — the refresh job invalidates the tag every 30 min) shared by `/`, `/intel` and `/api/intel`; pages never call upstream directly. `"use cache"` was deliberately not used — it would switch the whole app into Cache Components mode and force Suspense boundaries around every cookie read. `fallback.json` fills a source only when `DATABASE_URL` is unset or the DB is unreachable/empty — never as a routine substitute. Each panel shows its own data age; health is `ok` under 60 min, `stale` after that, and a source that has never succeeded is `down` (never blank). Tests and builds never touch the network.
- **Sources** (`src/lib/intel/sources/*.ts`): pure `parse*` (throws on shape mismatch) + `fetch*` (never throws). Fixtures in `__fixtures__/`. Excluded on purpose: URLhaus API (needs a key), URLhaus CSV (3.8 MB), NVD (rate-limited), Cloudflare Radar (403).
- **Map**: inline SVG from `d3-geo` + `world-atlas` 110m, built and memoised in `src/lib/intel/geo/atlas.ts`. Countries are joined by ISO numeric id via `geo/iso.ts`; places too small for the atlas use `SMALL_TERRITORY_COORDS`. The browser makes no network request for the map.
- **ISO catalogue** (`src/lib/grc/iso27001/catalogue.ts`): titles and numbering are public; the one-line summaries are **our own words** — never paste the standard's text. `catalogue.test.ts` enforces 93 / 37-8-14-34 / bilingual / tagged.
- **Demo data** (`src/lib/grc/iso27001/demo/bankx.ts`): a fictional Thai digital bank at mid maturity — 93 statuses with owners and notes, 12 risks. Regulatory references (BOT IT-risk guidelines, CRAF, PDPA) are real; BankX and its documents are invented. `scripts/seed-demo.ts` emits one SQL transaction for `psql`, keyed by organisation name, so it can be applied to any workspace. Keep it in sync with the catalogue — `bankx.test.ts` fails if a control is missing. The CSF 2.0 demo (`src/lib/grc/nist-csf-2/demo/bankx.ts`, 106 scores) is seeded by the same script.
- **Scoring** (`src/lib/grc/iso27001/score.ts`) is pure and tested. Compliance weights partial at 0.5. `buildSoa` reports not-applicable controls without a justification; the CSV route returns 409 while any remain.
- **CSF catalogue** (`src/lib/grc/nist-csf-2/catalogue.ts`): English is NIST's own text (public domain) from `catalogue.data.json`, regenerated only by `npm run csf:import`; Thai lives in `catalogue.th.json` and is ours. `catalogue.test.ts` enforces 6/22/106/363, bilingual text and that every ISO id exists.
- **CSF scoring** (`score.ts`): 0–10 in 0.5 steps, 5 = minimum acceptable, 8+ = excessive. Suggestions from ISO use our weights (5/3/0) and are never written without the user accepting. Client components import `SCORE_STEPS`/`band`/`bandColor` from `src/lib/grc/nist-csf-2/scale.ts` (client-safe, no catalogue import) rather than from `score.ts`, to keep the ~500-string bilingual catalogue out of client bundles.
- **Shared risk register**: `getRisks(orgId)` returns every risk regardless of which framework created it; `risk.framework` only records where it was created; `linkedControlIds` (ISO) and `linkedCsfIds` (CSF) live side by side on the same row.
- **Server actions** (`src/server/actions/grc.ts`) resolve the organisation from the session on every call and validate with `src/lib/validate.ts`. No zod.
- **i18n**: `lang.ts` (cookie) vs `i18n.ts` (dictionary, typed keys). Every UI string has EN and TH. Data files use `LStr`.
- **Security headers** in `next.config.ts`. CSP is `default-src 'self'`; fonts are self-hosted via next/font, so no third-party hosts. `'unsafe-eval'` is added in development only (React dev overlay).
- **No emoji in UI**, no `dangerouslySetInnerHTML`, no LLM dependency in v1. Copy avoids "unlock / empower / seamless / next-gen".

## Local development with a database

Neon's HTTP driver cannot talk to a plain Postgres. For local work run a Postgres plus a Neon-protocol proxy and point the driver at it:

```bash
docker run -d --name cyber-pg --security-opt apparmor=unconfined -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=cyber -p 55432:5432 postgres:16-alpine
docker network create cyber-net && docker network connect cyber-net cyber-pg
docker run -d --name cyber-neon-proxy --security-opt apparmor=unconfined --network cyber-net -p 4444:4444 \
  -e PG_CONNECTION_STRING="postgres://postgres:pg@cyber-pg:5432/cyber" ghcr.io/timowilhelm/local-neon-http-proxy:main
docker exec -i cyber-pg psql -U postgres -d cyber -c "CREATE SCHEMA IF NOT EXISTS neon_control_plane; CREATE TABLE IF NOT EXISTS neon_control_plane.endpoints (endpoint_id VARCHAR(255) PRIMARY KEY, allowed_ips VARCHAR(255)); INSERT INTO neon_control_plane.endpoints (endpoint_id, allowed_ips) VALUES ('localhost', '0.0.0.0/0'), ('cyber-pg', '0.0.0.0/0') ON CONFLICT DO NOTHING;"
npx drizzle-kit generate --schema src/db/schema.ts --dialect postgresql --out /tmp/drz && cat /tmp/drz/*.sql | sed 's/--> statement-breakpoint//' | docker exec -i cyber-pg psql -U postgres -d cyber
DATABASE_URL="postgres://postgres:pg@cyber-pg:5432/cyber" NEON_LOCAL_PROXY="http://localhost:4444/sql" AUTH_SECRET=dev ALLOWED_EMAILS=you@example.com npm run dev
```

The proxy resolves the connection's "endpoint id" (the host in the connection string) against `neon_control_plane.endpoints`; without that table every query fails with `NeonDbError` / "Control plane request failed: relation neon_control_plane.endpoints does not exist". It's durable state in the `cyber-pg` container, so this is normally a one-time step per container, not per session.

`drizzle-kit push` does not work against this local stack (it hangs trying to introspect through the proxy) — always use the `drizzle-kit generate` → `psql` recipe above for local schema changes. `drizzle-kit push` is for production (Neon's real HTTP endpoint) only.

To skip the magic-link email locally, insert a `user` row with `approvedAt` set and a `session` row, then send `authjs.session-token=<sessionToken>` as a cookie.

## Releases

Vercel auto-deploys `main`. Bump `package.json` **and** both `version` fields in `package-lock.json`; run the gate; commit `feat: vX.Y.Z — …`; `git tag -a vX.Y.Z`; push main and the tag; confirm production serves the change and `/api/intel` reports every source `ok`. After a Threat Intel release, also trigger `.github/workflows/intel-refresh.yml` once by hand (`gh workflow run intel-refresh`) and confirm production's `intel_source` table has six rows with `fetchedAt` set.
