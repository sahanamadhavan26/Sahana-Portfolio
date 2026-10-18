// Checks that every local file referenced by index.html and 404.html exists.
// Runs as the Vercel build step, so a missing image fails the deploy instead of shipping broken.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const optional = new Set();
let missing = 0, checked = 0;

for (const page of ['index.html', '404.html']) {
  const html = readFileSync(join(root, page), 'utf8');
  const refs = [...html.matchAll(/(?:src|href|srcset|data-zoom|content)="(\/[^"#?\s]+)(?:\?[^"]*)?"/g)].map(m => m[1]);
  for (const ref of new Set(refs)) {
    if (optional.has(ref)) continue;
    checked++;
    if (!existsSync(join(root, ref))) { console.error(`✗ ${page}: missing ${ref}`); missing++; }
  }
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  for (const [, frag] of html.matchAll(/href="#([^"]+)"/g)) {
    checked++;
    if (!ids.has(frag)) { console.error(`✗ ${page}: anchor #${frag} has no target`); missing++; }
  }
}
if (missing) { console.error(`\n${missing} problem(s) found.`); process.exit(1); }
console.log(`✓ ${checked} local references verified.`);
