import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const encounters = JSON.parse(await readFile(new URL('../data/encounters.json', import.meta.url), 'utf8'));
assert.equal(encounters.length, 8);
assert.equal(new Set(encounters.map((encounter) => encounter.id)).size, encounters.length);

for (const encounter of encounters) {
  assert.ok(encounter.title?.trim(), `${encounter.id} missing title`);
  assert.ok(encounter.scene?.trim(), `${encounter.id} missing scene`);
  assert.ok(encounter.lesson?.trim(), `${encounter.id} missing lesson`);
  assert.equal(encounter.choices?.length, 3, `${encounter.id} must have exactly three choices`);
  assert.equal(encounter.choices.filter((choice) => choice.quality === 'best').length, 1, `${encounter.id} must have exactly one best choice`);
  assert.equal(new Set(encounter.choices.map((choice) => choice.id)).size, 3, `${encounter.id} has duplicate choice ids`);
  for (const choice of encounter.choices) {
    assert.ok(choice.label?.trim(), `${encounter.id}/${choice.id} missing label`);
    assert.ok(choice.feedback?.trim(), `${encounter.id}/${choice.id} missing feedback`);
    assert.ok(['best','mixed','poor'].includes(choice.quality), `${encounter.id}/${choice.id} invalid quality`);
    for (const key of ['vigor','stress','knowledge','energy','score']) {
      assert.equal(Number.isFinite(Number(choice.effects?.[key] ?? 0)), true, `${encounter.id}/${choice.id} invalid ${key}`);
    }
  }
}

console.log('THC RPG content contract passed: 8 encounters / 24 choices.');
