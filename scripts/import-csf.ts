/**
 * Regenerate the CSF 2.0 catalogue from NIST:
 *   npm run csf:import
 * Downloads the CPRT JSON export (text, implementation examples) and the CSF 2.0
 * Reference Tool workbook (informative references, incl. ISO/IEC 27001:2022),
 * then writes src/lib/grc/nist-csf-2/catalogue.data.json. Refuses to write if the
 * counts are not 6 / 22 / 106 / 363 or fewer than 90 subcategories carry an ISO mapping.
 * This is the only code in the repo that fetches NIST; builds and tests read the committed file.
 */
import { writeFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import { CONTROL_BY_ID } from '../src/lib/grc/iso27001/catalogue';
import { buildCatalogueData, parseCprt, parseIsoRefs } from '../src/lib/grc/nist-csf-2/import/parse';

const CPRT = 'https://csrc.nist.gov/extensions/nudp/services/json/nudp/framework/version/csf_2_0_0/export/json?element=all';
const OLIR = 'https://csrc.nist.gov/extensions/nudp/services/json/csf/download?olirids=all';

async function get(url: string): Promise<Response> {
  const res = await fetch(url, { headers: { 'user-agent': 'cyber.nanoteofficial.me csf:import' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res;
}

async function main() {
  const cprt = parseCprt(await (await get(CPRT)).json());

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await (await get(OLIR)).arrayBuffer());
  const ws = wb.getWorksheet('CSF 2.0');
  if (!ws) throw new Error('workbook has no "CSF 2.0" sheet');
  const rows: [string | null, string | null][] = [];
  ws.eachRow((row) => rows.push([row.getCell(3).text || null, row.getCell(5).text || null]));
  const iso = parseIsoRefs(rows);

  const { data, dropped } = buildCatalogueData(cprt, iso, new Set(Object.keys(CONTROL_BY_ID)), {
    cprt: CPRT, olir: OLIR, generatedAt: new Date().toISOString(),
  });
  const examples = data.subcategories.reduce((n, s) => n + s.examples.length, 0);
  const mapped = data.subcategories.filter((s) => s.iso27001.length > 0).length;
  const counts = `${data.functions.length} / ${data.categories.length} / ${data.subcategories.length} / ${examples}`;
  if (counts !== '6 / 22 / 106 / 363') throw new Error(`refusing to write: counts ${counts}, expected 6 / 22 / 106 / 363`);
  if (mapped < 90) throw new Error(`refusing to write: only ${mapped} subcategories have an ISO mapping`);
  if (dropped.length) console.warn(`dropped ISO ids not in the Annex A catalogue: ${dropped.join(', ')}`);

  const out = new URL('../src/lib/grc/nist-csf-2/catalogue.data.json', import.meta.url);
  writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
  console.log(`wrote ${out.pathname}: ${counts}; ${mapped} subcategories mapped to ISO 27001`);
}

main().catch((e) => { console.error(e); process.exit(1); });
