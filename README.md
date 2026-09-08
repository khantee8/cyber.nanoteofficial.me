# cyber.nanoteofficial.me

**NaNote Cyber** — a cybersecurity platform built module by module. Live at https://cyber.nanoteofficial.me.

| Module | Status | What it does |
|---|---|---|
| Threat Intel | live, public | Ops view over free feeds: CISA KEV joined with FIRST EPSS, ransomware claims by country and sector, botnet C2 servers, most-attacked ports, headlines. SVG world map, 15-minute refresh, graceful fallback, public JSON at `/api/intel`. |
| GRC · ISO/IEC 27001:2022 | available, invite-only | ISMS workspace: all 93 Annex A controls with status, owner, justification and evidence links; gap assessment by theme; 5×5 risk register with treatment and residual scoring; Statement of Applicability with CSV export. |
| GRC · NIST CSF 2.0, CRAF | in design | Registry seam is in place; assessments follow. |
| AI Red Teaming | in design | Prompt-injection suites, agent probes, attack-path simulation. |
| Training / Consulting | in design | Certification prep, tabletop exercises, ISMS implementation support. |

Bilingual (Thai / English). Dark by design.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Auth.js v5 (Resend magic link) · Neon Postgres + Drizzle · Vitest · d3-geo + world-atlas.

```bash
npm install
npm run dev
npm run lint && npx tsc --noEmit && npm test && npm run build
```

See `CLAUDE.md` for architecture rules, local-database setup and the release process. Copy `.env.example` to `.env.local` for the variables.

## Data sources and credits

Threat Intel uses public, key-less feeds: [CISA Known Exploited Vulnerabilities](https://www.cisa.gov/known-exploited-vulnerabilities-catalog), [FIRST EPSS](https://www.first.org/epss/), [ransomware.live](https://www.ransomware.live/), [abuse.ch Feodo Tracker](https://feodotracker.abuse.ch/), [SANS Internet Storm Center](https://isc.sans.edu/), [The Hacker News](https://thehackernews.com/) and [BleepingComputer](https://www.bleepingcomputer.com/) RSS. Data stays attributed to its source on every panel.

The Threat Intel view is modelled on the ops-center of [marc-shade/world-intel-mcp](https://github.com/marc-shade/world-intel-mcp); the ISO 27001 workspace on the data model of [Sushegaad/MCP-Server-for-ISO27001](https://github.com/Sushegaad/MCP-Server-for-ISO27001); the planned CSF 2.0 assessment on [rocklambros/nist-csf-2-mcp-server](https://github.com/rocklambros/nist-csf-2-mcp-server). None of them is a dependency.

ISO/IEC 27001 and 27002 are trademarks of ISO. This project lists Annex A control identifiers and titles and describes each control in its own words; it does not reproduce the standards' text.

## License

MIT for the code in this repository. Third-party data remains under its publishers' terms.
