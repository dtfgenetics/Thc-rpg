import { cp, copyFile, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const out = new URL('../dist/', import.meta.url);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await copyFile(new URL('index.html', root), new URL('index.html', out));
await cp(new URL('src/', root), new URL('src/', out), { recursive: true });
await copyFile(new URL('public/game-release.json', root), new URL('game-release.json', out));

console.log('Built THC RPG production artifact in dist/.');
