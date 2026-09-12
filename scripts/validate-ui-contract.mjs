import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');
const release = JSON.parse(fs.readFileSync('public/game-release.json', 'utf8'));

assert.match(html, /name="viewport"[^>]*viewport-fit=cover/, 'mobile viewport must retain safe-area support');
for (const id of ['app','hud','gameView','scene','sceneContent','actionBar','btnInteract','btnPlant','btnWater','btnHarvest','btnInventory','btnJournal','btnSave','startModal','dialogModal','inventoryModal','journalModal']) {
  assert.match(html, new RegExp(`id="${id}"`), `missing shipped UI hook #${id}`);
}
assert.equal((html.match(/role="dialog"/g) ?? []).length, 4, 'start, dialog, inventory, and journal surfaces must remain dialogs');
assert.match(html, /id="journalStatus"[^>]*aria-live="polite"/, 'journal feedback must remain an accessible live region');
assert.match(html, /type="module" src="\.\/src\/main\.js"/, 'visitor runtime must remain ES-module based');

assert.match(styles, /#actionBar button[\s\S]*min-height:\s*44px/, 'primary mobile actions must retain 44px minimum targets');
assert.match(styles, /#actionBar button[\s\S]*min-width:\s*48px/, 'default action buttons must remain comfortably tappable');
assert.match(styles, /@media \(max-width:\s*640px\)/, 'compact mobile layout must remain defined');
assert.match(styles, /@media \(max-width:\s*400px\)[\s\S]*min-height:\s*44px[\s\S]*min-width:\s*44px/, 'small-phone actions must retain 44px targets');
assert.match(styles, /env\(safe-area-inset-bottom\)/, 'bottom action bar must respect device safe areas');
assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)/, 'CSS must retain reduced-motion handling');
assert.match(styles, /#sceneContent[\s\S]*overflow-y:\s*auto/, 'scene content must stay vertically scrollable on compact screens');

assert.match(main, /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/, 'particle renderer must honor reduced motion');
assert.match(main, /document\.addEventListener\('keydown'/, 'keyboard play controls must remain wired');
assert.match(main, /event\.target instanceof HTMLInputElement/, 'keyboard shortcuts must not hijack text entry');
assert.match(main, /journalModal:\s*\$\('journalModal'\)/, 'main keyboard runtime must know about the journal overlay');
assert.match(main, /\[refs\.dialogModal, refs\.inventoryModal, refs\.journalModal\]\.some\(modal => modal\?\.style\.display === 'flex'\)/, 'gameplay shortcuts must detect every active gameplay overlay');
assert.match(main, /!game \|\| gameplayOverlayOpen \|\| event\.target instanceof HTMLInputElement/, 'gameplay shortcuts must stop while a dialog, inventory, or journal overlay is open');
for (const shortcut of ["case 'e'", "case 'p'", "case 'w'", "case 'h'", "case 'i'", "case 's'"]) {
  assert.ok(main.includes(shortcut), `missing keyboard shortcut ${shortcut}`);
}
assert.match(main, /localStorage\.setItem\(SAVE_KEY, JSON\.stringify\(game\.save\(\)\)\)/, 'manual save path must remain wired');
assert.match(main, /localStorage\.getItem\(SAVE_KEY\)/, 'load path must remain wired');
assert.match(main, /showDialog\(/, 'dialog-driven progression surface must remain wired');

assert.equal(release.route, '/games/thc-rpg/');
assert.equal(release.status, 'release-candidate');
assert.equal(release.version, '2.1.0');
assert.equal(release.saveVersion, 6);
assert.deepEqual(release.input, ['keyboard', 'mouse', 'touch']);
assert.equal(release.promotionGate?.standaloneCI, 'required');
assert.equal(release.promotionGate?.deterministicUiValidation, 'required');
assert.equal(release.promotionGate?.routeValidation, 'required');
assert.equal(release.promotionGate?.centralPackaging, 'required');
assert.equal(release.promotionGate?.liveVerification, 'required-before-production-ready');
assert.equal(release.promotionGate?.browserAcceptance, undefined, 'browser-runner acceptance must not remain a release gate');
assert.ok(!release.features.some((feature) => /browser acceptance/i.test(feature)), 'release features must not advertise browser-runner acceptance');

console.log('THC RPG deterministic UI, modal input guard, and release contract valid.');
