// One-shot custom-domain switch. Run once you own a domain and have pointed its
// DNS at GitHub Pages (see docs/CUSTOM_DOMAIN.md):
//
//   node scripts/set-domain.mjs cartograph.de     # switch to the custom domain
//   node scripts/set-domain.mjs --revert          # back to the project-pages URL
//
// It writes public/CNAME (so the Pages deploy keeps the domain) and rewrites the
// absolute URLs (Open Graph / Twitter / JSON-LD, sitemap, robots) accordingly.

import { readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (p) => resolve(__dirname, '..', p);

const PROJECT_ORIGIN = 'https://canuzu.github.io/Test-Code';
const FILES = ['index.html', 'public/sitemap.xml', 'public/robots.txt'];

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/set-domain.mjs <domain>|--revert');
  process.exit(1);
}

const readCname = async () => {
  try { return (await readFile(R('public/CNAME'), 'utf8')).trim(); } catch { return ''; }
};

async function rewrite(from, to) {
  for (const f of FILES) {
    let s;
    try { s = await readFile(R(f), 'utf8'); } catch { console.log(`· skip ${f} (missing)`); continue; }
    const next = s.split(from).join(to);
    if (next !== s) { await writeFile(R(f), next); console.log(`✓ updated ${f}`); }
    else console.log(`· ${f} unchanged`);
  }
}

async function main() {
  if (arg === '--revert') {
    const cur = await readCname();
    const from = cur ? `https://${cur}` : null;
    if (from) await rewrite(from, PROJECT_ORIGIN);
    await rm(R('public/CNAME'), { force: true });
    console.log('✓ removed public/CNAME — back to the project-pages URL.');
    return;
  }

  const domain = arg.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const cur = await readCname();
  const from = cur ? `https://${cur}` : PROJECT_ORIGIN; // re-runnable
  await writeFile(R('public/CNAME'), `${domain}\n`);
  console.log(`✓ wrote public/CNAME → ${domain}`);
  await rewrite(from, `https://${domain}`);
  console.log('\nNext: commit & deploy, then GitHub → Settings → Pages → set the custom domain and enable "Enforce HTTPS".');
  console.log('Full steps: docs/CUSTOM_DOMAIN.md');
}

main().catch((e) => { console.error(e); process.exit(1); });
