/**
 * Capture a fresh fallback snapshot from the live feeds:
 *   npm run intel:snapshot
 * Fails loudly if any source is down, so a bad capture never replaces a good one.
 */
import { writeFileSync } from 'node:fs';
import { buildIntelSnapshot } from '../src/lib/intel/aggregate';

async function main() {
const snap = await buildIntelSnapshot();
const down = Object.entries(snap.health).filter(([, h]) => h.status !== 'ok').map(([id]) => id);
if (down.length) {
  console.error(`refusing to write fallback: sources not ok → ${down.join(', ')}`);
  process.exit(1);
}
const out = new URL('../src/lib/intel/fallback.json', import.meta.url);
writeFileSync(out, JSON.stringify(snap, null, 1) + '\n');
console.log(`wrote ${out.pathname}: kev ${snap.kev.length}, ransomware ${snap.ransomware.length}, c2 ${snap.c2.length}, headlines ${snap.headlines.length}`);
}

void main();
