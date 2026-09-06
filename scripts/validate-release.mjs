import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const errors = [];

async function exists(url) {
  try {
    await stat(url);
    return true;
  } catch {
    return false;
  }
}

async function walk(url, prefix = '') {
  const entries = await readdir(url, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walk(new URL(`${entry.name}/`, url), relative));
    else files.push(relative);
  }
  return files;
}

const release = JSON.parse(await readFile(new URL('public/game-release.json', root), 'utf8'));
const expected = {
  id: 'thc-rpg',
  route: '/games/thc-rpg/',
  runtime: 'static-es-modules',
  status: 'release-candidate',
  artifact: 'thc-rpg-production-build',
  saveVersion: 6
};

for (const [key, value] of Object.entries(expected)) {
  if (release[key] !== value) errors.push(`game-release ${key} must be ${JSON.stringify(value)}`);
}
if (!Array.isArray(release.input) || !release.input.includes('touch') || !release.input.includes('keyboard')) {
  errors.push('game-release input must include keyboard and touch');
}
if (release.promotionGate?.liveVerification !== 'required-before-production-ready') {
  errors.push('live verification must remain required before production-ready');
}

for (const required of [
  'index.html',
  'game-release.json',
  'src/main.js',
  'src/autosave.js',
  'src/grow-journal-ui.js',
  'src/styles.css',
  'src/grow-journal-v1.css',
  'src/data/game-data.json',
  'src/game/Game.js',
  'src/game/GrowJournal.js',
  'src/game/KeeperCuttings.js'
]) {
  if (!await exists(new URL(required, dist))) errors.push(`dist missing ${required}`);
}

if (await exists(new URL('dist/index.html', root))) {
  const html = await readFile(new URL('index.html', dist), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:)?\/\//i.test(ref)) {
      errors.push(`external runtime asset is not allowed: ${ref}`);
      continue;
    }
    if (ref.startsWith('/')) {
      errors.push(`root-absolute runtime asset breaks subroute packaging: ${ref}`);
      continue;
    }
    if (!ref.startsWith('./')) continue;
    const clean = ref.split(/[?#]/, 1)[0];
    if (!await exists(new URL(clean, dist))) errors.push(`index references missing local asset: ${ref}`);
  }
}

if (await exists(dist)) {
  const files = await walk(dist);
  const forbidden = ['node_modules/', 'tests/', 'e2e/', 'docs/', '.github/', 'playwright.config', 'package.json'];
  for (const file of files) {
    if (forbidden.some(part => file === part || file.startsWith(part) || file.includes(part))) {
      errors.push(`development-only file leaked into production artifact: ${file}`);
    }
  }
  if (files.length < 10) errors.push(`production artifact unexpectedly small: ${files.length} files`);

  const distPath = fileURLToPath(dist);
  for (const file of files) {
    const absolute = path.join(distPath, file);
    const info = await stat(absolute);
    if (info.size > 5 * 1024 * 1024) errors.push(`production file exceeds 5 MiB: ${file}`);
  }
}

if (errors.length) {
  console.error(`THC RPG release validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`THC RPG release valid: ${release.route} -> ${release.artifact}, save v${release.saveVersion}.`);
