import fs from 'node:fs';

const path = 'src/main.js';
let source = fs.readFileSync(path, 'utf8');

const refsBefore = "    inventoryModal: $('inventoryModal'), inventoryList: $('inventoryList'), inventoryClose: $('inventoryClose'),\n";
const refsAfter = "    inventoryModal: $('inventoryModal'), inventoryList: $('inventoryList'), inventoryClose: $('inventoryClose'), journalModal: $('journalModal'),\n";
if (!source.includes(refsBefore)) throw new Error('Expected inventory refs line not found');
source = source.replace(refsBefore, refsAfter);

const guardBefore = "        if (!game || event.target instanceof HTMLInputElement || event.ctrlKey || event.metaKey || event.altKey) return;\n";
const guardAfter = "        const gameplayOverlayOpen = [refs.dialogModal, refs.inventoryModal, refs.journalModal].some(modal => modal?.style.display === 'flex');\n        if (!game || gameplayOverlayOpen || event.target instanceof HTMLInputElement || event.ctrlKey || event.metaKey || event.altKey) return;\n";
if (!source.includes(guardBefore)) throw new Error('Expected gameplay shortcut guard not found');
source = source.replace(guardBefore, guardAfter);

fs.writeFileSync(path, source);
console.log('Applied THC RPG modal gameplay shortcut guard.');
