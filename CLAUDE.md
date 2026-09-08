# CLAUDE.md — cyber.nanoteofficial.me

Guidance for Claude Code when working in this repository.

> Next.js 16 with React 19 — APIs differ from training data. Read `node_modules/next/dist/docs/` or use the context7 MCP tool before writing Next-specific code.

## What this is

**NaNote Cyber**: a cybersecurity platform with several modules behind one landing page and one login.

- **Threat Intel** (`/intel`, public) — live ops view over free public feeds. Also feeds the landing page HUD and map band.
- **GRC / ISO 27001** (`/grc/iso27001`, gated) — an ISMS workspace: 93 Annex A controls, gap assessment, risk register, Statement of Applicability. The framework registry (`src/lib/grc/frameworks.ts`) is built for a second framework (NIST CSF 2.0, CRAF) to slot in beside it.
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
npm run seed:demo -- --org "BankX" | psql "$DATABASE_URL_UNPOOLED"   # load the fictional BankX assessment into an existing organisation (re-runnable)
DATABASE_URL="…" npx drizzle-kit push
```

Release gate: `npx tsc --noEmit && npm run lint && npm test && npm run build`.

## Architecture rules

- **Auth gate** is `src/app/(app)/layout.tsx` and nowhere else. No middleware, no `proxy.ts`. Public routes live outside `(app)`. Approval is re-read from the DB on every gated request.
- **DB client** (`src/db/index.ts`): the eager `db` exists only because `@auth/drizzle-adapter` needs a real instance at module load. **App code uses `getDb()`**, which throws loudly when `DATABASE_URL` is unset — that is what keeps the build green without a database.
- **Threat Intel cache** (`src/lib/intel/snapshot.ts`): one `unstable_cache` (15 min) shared by `/`, `/intel` and `/api/intel`. `"use cache"` was deliberately not used — it would switch the whole app into Cache Components mode and force Suspense boundaries around every cookie read. Every source fetcher returns `null` on failure; `buildIntelSnapshot` fills gaps from the committed `fallback.json` and labels them `stale`. Tests and builds never touch the network.
- **Sources** (`src/lib/intel/sources/*.ts`): pure `parse*` (throws on shape mismatch) + `fetch*` (never throws). Fixtures in `__fixtures__/`. Excluded on purpose: URLhaus API (needs a key), URLhaus CSV (3.8 MB), NVD (rate-limited), Cloudflare Radar (403).
- **Map**: inline SVG from `d3-geo` + `world-atlas` 110m, built and memoised in `src/lib/intel/geo/atlas.ts`. Countries are joined by ISO numeric id via `geo/iso.ts`; places too small for the atlas use `SMALL_TERRITORY_COORDS`. The browser makes no network request for the map.
- **ISO catalogue** (`src/lib/grc/iso27001/catalogue.ts`): titles and numbering are public; the one-line summaries are **our own words** — never paste the standard's text. `catalogue.test.ts` enforces 93 / 37-8-14-34 / bilingual / tagged.
- **Demo data** (`src/lib/grc/iso27001/demo/bankx.ts`): a fictional Thai digital bank at mid maturity — 93 statuses with owners and notes, 12 risks. Regulatory references (BOT IT-risk guidelines, CRAF, PDPA) are real; BankX and its documents are invented. `scripts/seed-demo.ts` emits one SQL transaction for `psql`, keyed by organisation name, so it can be applied to any workspace. Keep it in sync with the catalogue — `bankx.test.ts` fails if a control is missing.
- **Scoring** (`src/lib/grc/iso27001/score.ts`) is pure and tested. Compliance weights partial at 0.5. `buildSoa` reports not-applicable controls without a justification; the CSV route returns 409 while any remain.
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
npx drizzle-kit generate --schema src/db/schema.ts --dialect postgresql --out /tmp/drz && cat /tmp/drz/*.sql | sed 's/--> statement-breakpoint//' | docker exec -i cyber-pg psql -U postgres -d cyber
DATABASE_URL="postgres://postgres:pg@cyber-pg:5432/cyber" NEON_LOCAL_PROXY="http://localhost:4444/sql" AUTH_SECRET=dev ALLOWED_EMAILS=you@example.com npm run dev
```

To skip the magic-link email locally, insert a `user` row with `approvedAt` set and a `session` row, then send `authjs.session-token=<sessionToken>` as a cookie.

## Releases

Vercel auto-deploys `main`. Bump `package.json` **and** both `version` fields in `package-lock.json`; run the gate; commit `feat: vX.Y.Z — …`; `git tag -a vX.Y.Z`; push main and the tag; confirm production serves the change and `/api/intel` reports every source `ok`.
