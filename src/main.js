import { Game } from './game/Game.js';

const SAVE_KEY = 'thc-rpg-save';
const UPDATE_INTERVAL_MS = 3000;

let gameData = null;
let game = null;
let particles = null;
let updateTimer = null;
let lastFocusedElement = null;

const $ = id => document.getElementById(id);
const refs = {
    app: $('app'), loading: $('loading'), loadBar: $('loadBar'), loadText: $('loadText'), loadError: $('loadError'),
    startModal: $('startModal'), nameInput: $('nameInput'), startBtn: $('startBtn'), loadBtn: $('loadBtn'),
    dialogModal: $('dialogModal'), dialogTitle: $('dialogTitle'), dialogText: $('dialogText'), dialogChoices: $('dialogChoices'), dialogClose: $('dialogClose'),
    inventoryModal: $('inventoryModal'), inventoryList: $('inventoryList'), inventoryClose: $('inventoryClose'),
    playerName: $('playerName'), playerLevel: $('playerLevel'), playerXp: $('playerXp'), xpBar: $('xpBar'), playerMoney: $('playerMoney'),
    plantStatus: $('plantStatus'), plantHealth: $('plantHealth'), btnInteract: $('btnInteract'), btnPlant: $('btnPlant'), btnWater: $('btnWater'), btnHarvest: $('btnHarvest'),
    btnInventory: $('btnInventory'), btnSave: $('btnSave'), sceneContent: $('sceneContent'), particleCanvas: $('particleCanvas')
};

const Audio = {
    ctx: null,
    enabled: true,
    init() {
        if (this.ctx || !this.enabled) return;
        try {
            const Context = window.AudioContext || window.webkitAudioContext;
            if (!Context) throw new Error('Web Audio unavailable');
            this.ctx = new Context();
        } catch {
            this.enabled = false;
        }
    },
    play(type = 'click') {
        this.init();
        if (!this.enabled || !this.ctx) return;
        try {
            void this.ctx.resume();
            const sounds = {
                click: { freq: 600, dur: 0.08, vol: 0.08 },
                plant: { freq: 400, dur: 0.2, vol: 0.10 },
                water: { freq: 300, dur: 0.15, vol: 0.07 },
                harvest: { freq: 800, dur: 0.3, vol: 0.10 },
                levelup: { freq: 500, dur: 0.4, vol: 0.12 },
                purchase: { freq: 720, dur: 0.18, vol: 0.10 }
            };
            const s = sounds[type] || sounds.click;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.value = s.freq;
            gain.gain.setValueAtTime(s.vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + s.dur);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + s.dur);
        } catch {
            // Audio is non-critical.
        }
    }
};

class Particles {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.parts = [];
        this.raf = null;
        this.ambientTimer = null;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);
        window.addEventListener('resize', this.resize, { passive: true });
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = Math.max(1, rect?.width || window.innerWidth);
        this.h = Math.max(1, rect?.height || window.innerHeight);
        this.canvas.width = Math.floor(this.w * dpr);
        this.canvas.height = Math.floor(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    emit(x, y, count, opts = {}) {
        if (this.reducedMotion) return;
        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (opts.speed ?? 2) + Math.random() * 2;
            this.parts.push({
                x: x ?? this.w / 2,
                y: y ?? this.h / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (opts.upward ? 1.5 : 0),
                life: 1,
                decay: 0.008 + Math.random() * 0.015,
                size: (opts.size ?? 4) + Math.random() * 4,
                color: opts.color || `hsl(${120 + Math.random() * 40}, 70%, 55%)`,
                gravity: opts.gravity ?? 0.02
            });
        }
    }

    update() {
        for (let i = this.parts.length - 1; i >= 0; i -= 1) {
            const p = this.parts[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
            if (p.life <= 0) this.parts.splice(i, 1);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.w, this.h);
        for (const p of this.parts) {
            this.ctx.globalAlpha = p.life * 0.6;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }

    loop() {
        this.update();
        this.render();
        this.raf = requestAnimationFrame(this.loop);
    }

    start() {
        if (this.reducedMotion || this.raf) return;
        this.raf = requestAnimationFrame(this.loop);
        this.ambientTimer = window.setInterval(() => {
            if (document.hidden || this.parts.length >= 40 || Math.random() <= 0.7) return;
            this.emit(Math.random() * this.w, this.h * 0.85, 2, {
                upward: true, size: 2, speed: 0.5,
                color: `hsla(${140 + Math.random() * 40}, 50%, 50%, 0.2)`
            });
        }, 800);
    }
}

function setLoading(percent, text) {
    refs.loadBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    refs.loadText.textContent = text;
}

function showFatalError(message) {
    refs.loadText.textContent = 'THC RPG could not start.';
    refs.loadError.style.display = 'block';
    refs.loadError.textContent = message;
}

async function loadGameData() {
    const url = new URL('./data/game-data.json', import.meta.url);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Game data failed to load (${response.status}).`);
    const data = await response.json();
    if (!data?.genetics || !data?.locations || !data?.quests) throw new Error('Game data is missing required sections.');
    return data;
}

function ensureParticles() {
    if (!particles && refs.particleCanvas) {
        particles = new Particles(refs.particleCanvas);
        particles.start();
    }
    return particles;
}

function startUpdateLoop() {
    if (updateTimer) clearInterval(updateTimer);
    updateTimer = setInterval(() => {
        if (!game || !game.plant || document.hidden) return;
        game.update(Date.now());
        updateUI();
    }, UPDATE_INTERVAL_MS);
}

function startNewGame() {
    const name = refs.nameInput.value.trim() || 'Green Thumb';
    localStorage.removeItem(SAVE_KEY);
    game = new Game(name, gameData);
    refs.startModal.style.display = 'none';
    ensureParticles();
    startUpdateLoop();
    updateUI();
    Audio.play('click');
    showDialog('🌱 Welcome, Grower!', `Welcome to THC RPG, ${name}!\n\nOld Man Jenkins has a task for you. Visit the Mentor Shop to get started.`, [
        { label: '🚶 Go to Main Street', action: () => travelTo('main_street') }
    ]);
}

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
        showDialog('❌ No Save', 'No saved game was found in this browser.');
        return;
    }
    try {
        const data = JSON.parse(raw);
        game = new Game(data.player?.name || 'Green Thumb', gameData);
        game.load(data);
        refs.startModal.style.display = 'none';
        ensureParticles();
        startUpdateLoop();
        updateUI();
        Audio.play('click');
        showDialog('📂 Loaded!', 'Your save loaded successfully.');
    } catch (error) {
        console.error('Failed to load save:', error);
        showDialog('❌ Save Error', 'The save data is invalid or from an unsupported version. Your existing save was not overwritten.');
    }
}

function saveGame() {
    if (!game) return;
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(game.save()));
        Audio.play('click');
        showDialog('💾 Saved!', 'Game saved successfully.');
    } catch (error) {
        console.error('Failed to save:', error);
        showDialog('❌ Save Error', 'The browser could not save the game.');
    }
}

function travelTo(locationId) {
    if (!game) return false;
    if (!game.moveTo(locationId)) {
        showDialog('🚫 Can’t Travel There', 'That location is not connected to your current position.');
        return false;
    }
    Audio.play('click');
    updateUI();
    return true;
}

function talkToJenkins() {
    if (!game) return;
    if (game.location !== 'mentor_shop') {
        showDialog('👴 Old Man Jenkins', 'Jenkins is at the Mentor Shop. Travel there to speak with him.');
        return;
    }

    Audio.play('click');
    const npc = gameData.npcs.old_man_jenkins;
    if (game.quests.completed.includes('first_seed')) {
        showDialog(`👴 ${npc.name}`, npc.dialog.harvest_ready.join('\n\n'));
        return;
    }

    if (game.quests.active.includes('first_seed')) {
        if (game.plant?.stage === 'harvest_ready') showDialog(`👴 ${npc.name}`, 'Your Blue Mango is ready. Head back to the grow room and harvest it.');
        else if (game.plant) showDialog(`👴 ${npc.name}`, npc.dialog.after_plant.join('\n\n'));
        else showDialog(`👴 ${npc.name}`, 'You have the seed. Head to your grow room and plant it.', [{ label: '🚶 Go to Main Street', action: () => travelTo('main_street') }]);
        return;
    }

    if (!game.startQuest('first_seed')) {
        showDialog(`👴 ${npc.name}`, 'I do not have another task for you yet.');
        return;
    }

    game.inventory.add('seed', 'blue_mango', 1);
    showDialog(`👴 ${npc.name}`, npc.dialog.first_meeting.join('\n\n'), [
        { label: '🌱 Accept the Blue Mango seed', action: () => updateUI() }
    ]);
    updateUI();
}

function formatTrait(trait) {
    return String(trait || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function phenotypeSeedLabel(seed) {
    return `#${Number(seed || 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function roomSummary() {
    const environment = game.getEnvironmentStatus();
    const room = game.environment;
    return `Room score: ${Math.round(environment.score)}% (${formatTrait(environment.status)})\nTemperature: ${room.temperature.toFixed(0)}°F\nHumidity: ${room.humidity.toFixed(0)}%\nVPD: ${environment.vpd.toFixed(2)} kPa\nLight: ${room.light.toFixed(0)}%\npH: ${room.ph.toFixed(1)}\nEC: ${room.ec.toFixed(1)}`;
}

function interact() {
    if (!game) return;
    Audio.play('click');
    if (game.location === 'grow_room') {
        if (!game.plant) {
            showDialog('🌱 Empty Grow Space', `Your grow space is empty. Plant a seed to get started.\n\n${roomSummary()}\n\nThese are THC RPG simulation values.`);
            return;
        }
        const p = game.plant;
        const traits = p.dominantTraits.length ? p.dominantTraits.map(formatTrait).join(', ') : 'None expressed';
        showDialog(`🌱 ${p.name}`, `Stage: ${formatStage(p.stage)}\nHealth: ${Math.round(p.health)}%\nMoisture: ${Math.round(p.hydration)}%\nStress: ${Math.round(p.stress)}%\nDevelopment: ${Math.round(p.development)}%\n\nPhenotype ${phenotypeSeedLabel(p.phenotype.seed)}\nVigor: ${Math.round(p.vigor)}%\nYield potential: ${Math.round(p.yieldPotential)}%\nQuality potential: ${Math.round(p.qualityPotential)}%\nResilience: ${Math.round(p.resilience)}%\nFlowering expression: ${p.floweringDays} game days\nDominant traits: ${traits}\n\n${roomSummary()}\n\nRoom values are game simulation controls, not real-world instructions.`);
    } else if (game.location === 'mentor_shop') talkToJenkins();
    else showDialog('🚶 Main Street', 'Choose a connected location below to continue your journey.');
}

function getPlantableSeed() {
    const seeds = game?.inventory.getAll('seed') || {};
    if ((seeds.blue_mango || 0) > 0) return 'blue_mango';
    return Object.keys(seeds).find(id => gameData.genetics[id]) || null;
}

function plantSeed() {
    if (!game) return;
    if (game.location !== 'grow_room') {
        showDialog('🌿 Grow Room Required', 'Travel to your grow room before planting.');
        return;
    }
    if (game.plant) {
        showDialog('🌿 Already Growing', 'You already have a plant in this grow space.');
        return;
    }
    const geneticsId = getPlantableSeed();
    if (!geneticsId) {
        showDialog('❌ No Seeds', 'You do not have a plantable seed. Talk to Old Man Jenkins at the Mentor Shop.');
        return;
    }
    if (!game.plantSeed(geneticsId)) {
        showDialog('❌ Planting Failed', 'The seed could not be planted.');
        return;
    }
    const genetics = gameData.genetics[geneticsId];
    Audio.play('plant');
    ensureParticles()?.emit(undefined, undefined, 20, { color: 'hsl(140, 80%, 50%)', size: 5 });
    showDialog('🌱 Seed Planted!', `${genetics.name} has been planted. This individual received phenotype ${phenotypeSeedLabel(game.plant.phenotype.seed)}. Keep the simulation room stable and watch stress as it develops.`, [
        { label: '💧 Water', action: waterPlant }
    ]);
    updateUI();
}

function waterPlant() {
    if (!game) return;
    if (game.location !== 'grow_room') {
        showDialog('💧 Grow Room Required', 'Travel to your grow room before watering.');
        return;
    }
    if (!game.plant) {
        showDialog('🌱 No Plant', 'Plant a seed first.');
        return;
    }
    if (game.plant.stage === 'harvest_ready') {
        showDialog('🌾 Ready to Harvest', 'This plant is finished growing and ready to harvest.');
        return;
    }
    game.plant.water(15);
    Audio.play('water');
    const hydration = Math.round(game.plant.hydration);
    const message = hydration > 92 ? 'The medium is very wet. More water can increase stress.' : hydration >= 45 ? 'Moisture is in a healthy game range.' : 'The plant is still dry and may need attention.';
    showDialog('💧 Watering', `Moisture: ${hydration}%\n\n${message}`);
    updateUI();
}

function harvestPlant() {
    if (!game) return;
    if (game.location !== 'grow_room') {
        showDialog('🌾 Grow Room Required', 'Travel to your grow room before harvesting.');
        return;
    }
    if (!game.plant) {
        showDialog('🌱 No Plant', 'There is nothing to harvest.');
        return;
    }
    if (game.plant.stage !== 'harvest_ready') {
        showDialog('⏳ Not Ready', `Your plant is currently in the ${formatStage(game.plant.stage)} stage.`);
        return;
    }
    const result = game.harvest();
    if (!result) return;
    const questCompleted = game.completeQuest('first_seed');
    Audio.play('harvest');
    ensureParticles()?.emit(undefined, undefined, 30, { color: 'hsl(45, 100%, 50%)', size: 6 });
    if (questCompleted) Audio.play('levelup');
    const rewardText = questCompleted ? '\n\nQuest complete: +100 XP, +$50, and 2 Blue Bubblegum seeds.' : '';
    showDialog('🌾 Harvest Complete!', `Yield: ${result.yield}g\nQuality: ${result.quality}%\nHarvest XP: +${result.xp}\nHarvest value: +$${result.money}${rewardText}`);
    updateUI();
}

function formatStage(stage) {
    return String(stage || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function locationLabel(id) {
    const loc = gameData.locations[id];
    return loc ? `${loc.icon || '📍'} ${loc.name}` : id;
}

function renderInventory() {
    refs.inventoryList.replaceChildren();
    const sections = [['seed', '🌱'], ['harvest', '🌾'], ['item', '📦']];
    let itemCount = 0;
    for (const [category, icon] of sections) {
        for (const [id, count] of Object.entries(game.inventory.getAll(category))) {
            itemCount += 1;
            const row = document.createElement('div');
            row.className = 'inv-item';
            const name = document.createElement('span');
            name.className = 'name';
            const data = gameData.genetics[id] || gameData.items[id] || gameData.genetics[id.replace('_harvest', '')];
            name.textContent = `${icon} ${data?.name || id.replaceAll('_', ' ')}`;
            const amount = document.createElement('span');
            amount.className = 'count';
            amount.textContent = category === 'harvest' ? `${count}g` : `×${count}`;
            row.append(name, amount);
            refs.inventoryList.append(row);
        }
    }
    if (itemCount === 0) {
        const empty = document.createElement('div');
        empty.className = 'inv-empty';
        empty.textContent = '📦 Inventory empty';
        refs.inventoryList.append(empty);
    }
    const money = document.createElement('div');
    money.className = 'inv-item inventory-money';
    money.innerHTML = '<span class="name">💰 Money</span>';
    const amount = document.createElement('span');
    amount.className = 'count';
    amount.textContent = `$${game.player.money}`;
    money.append(amount);
    refs.inventoryList.append(money);
}

function openInventory() {
    if (!game) return;
    Audio.play('click');
    renderInventory();
    lastFocusedElement = document.activeElement;
    refs.inventoryModal.style.display = 'flex';
    refs.inventoryClose.focus();
}

function closeInventory() {
    refs.inventoryModal.style.display = 'none';
    lastFocusedElement?.focus?.();
}

function closeDialog() {
    refs.dialogModal.style.display = 'none';
    refs.dialogChoices.replaceChildren();
    lastFocusedElement?.focus?.();
}

function showDialog(title, text, choices = null) {
    lastFocusedElement = document.activeElement;
    refs.dialogTitle.textContent = title;
    refs.dialogText.textContent = text;
    refs.dialogChoices.replaceChildren();
    if (choices?.length) {
        for (const choice of choices) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = choice.label;
            button.addEventListener('click', () => {
                if (!choice.keepOpen) closeDialog();
                choice.action?.();
            });
            refs.dialogChoices.append(button);
        }
        refs.dialogClose.style.display = 'none';
    } else refs.dialogClose.style.display = 'block';
    refs.dialogModal.style.display = 'flex';
    requestAnimationFrame(() => (refs.dialogChoices.querySelector('button') || refs.dialogClose)?.focus());
}

function equipmentPrecisionLabel(definition) {
    const entries = Object.entries(definition?.controlSteps || {});
    if (!entries.length) return 'No room controls';
    const names = { temperature: 'Temp', humidity: 'Humidity', light: 'Light', ph: 'pH', ec: 'EC' };
    return entries.map(([field, step]) => `${names[field] || field} ±${step}`).join(' • ');
}

function purchaseEquipment(id) {
    if (!game || game.location !== 'mentor_shop') return;
    const item = gameData.equipment?.[id];
    if (!item) return;
    if (!game.purchaseEquipment(id)) {
        const reason = game.equipment.has(id)
            ? 'You already own this upgrade.'
            : game.player.money < Number(item.price)
                ? `You need $${item.price}, but currently have $${game.player.money}.`
                : 'The upgrade could not be purchased.';
        showDialog('🧰 Upgrade Not Purchased', reason);
        return;
    }
    Audio.play('purchase');
    updateUI();
    showDialog('🧰 Upgrade Installed', `${item.name} is now equipped in the ${formatTrait(item.slot)} slot.\n\n${equipmentPrecisionLabel(item)}\n\nBalance: $${game.player.money}`);
}

function equipOwnedEquipment(id) {
    if (!game || game.location !== 'mentor_shop') return;
    const item = gameData.equipment?.[id];
    if (!item || !game.equipEquipment(id)) return;
    Audio.play('click');
    updateUI();
}

function renderEquipmentShop() {
    const catalog = game.getEquipmentCatalog();
    if (!catalog.length) return;

    const shop = document.createElement('section');
    shop.className = 'environment-card';
    const header = document.createElement('div');
    header.className = 'environment-header';
    const title = document.createElement('div');
    title.innerHTML = '<strong>🧰 Equipment Counter</strong><span>Upgrade your game controls</span>';
    const balance = document.createElement('div');
    balance.className = 'environment-score good';
    balance.innerHTML = `<strong>$${game.player.money}</strong><span>Balance</span>`;
    header.append(title, balance);
    shop.append(header);

    const note = document.createElement('div');
    note.className = 'vpd-readout';
    note.textContent = 'Upgrades improve control precision; they do not directly change genetics.';
    shop.append(note);

    const list = document.createElement('div');
    list.className = 'environment-grid';

    for (const item of catalog) {
        const row = document.createElement('div');
        row.className = 'environment-row';

        const info = document.createElement('div');
        info.className = 'environment-label';
        const name = document.createElement('strong');
        name.textContent = `${item.equipped ? '✓ ' : ''}${item.name}`;
        name.style.display = 'block';
        name.style.color = item.equipped ? 'var(--primary)' : 'var(--text-primary)';
        const meta = document.createElement('span');
        meta.textContent = `${formatTrait(item.slot)} • ${equipmentPrecisionLabel(item)}`;
        meta.style.display = 'block';
        meta.style.marginTop = '3px';
        info.append(name, meta);

        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'travel-button';
        if (item.equipped) {
            action.textContent = 'Equipped';
            action.disabled = true;
        } else if (item.owned) {
            action.textContent = 'Equip';
            action.dataset.equipEquipment = item.id;
        } else {
            action.textContent = `Buy $${item.price}`;
            action.dataset.buyEquipment = item.id;
            action.disabled = game.player.money < Number(item.price);
            if (action.disabled) action.title = `Need $${item.price}`;
        }

        row.append(info, action);
        list.append(row);
    }

    shop.append(list);
    const disclaimer = document.createElement('p');
    disclaimer.className = 'simulation-note';
    disclaimer.textContent = 'Equipment values are THC RPG progression mechanics, not real-world cultivation specifications.';
    shop.append(disclaimer);
    refs.sceneContent.append(shop);
}

function renderScene() {
    if (!game) return;
    refs.sceneContent.replaceChildren();
    const loc = gameData.locations[game.location];
    const name = document.createElement('div');
    name.className = 'location-name';
    name.textContent = `${loc?.icon || '📍'} ${loc?.name || game.location}`;
    const description = document.createElement('div');
    description.className = 'location-desc';
    description.textContent = loc?.description || '';
    refs.sceneContent.append(name, description);

    if (game.location === 'grow_room') renderGrowRoom();
    else if (game.location === 'mentor_shop') {
        const npc = gameData.npcs.old_man_jenkins;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'npc-card';
        card.dataset.action = 'talk-jenkins';
        card.innerHTML = `<span class="npc-emoji">${npc.emoji}</span><span class="npc-name">${npc.name}</span><span class="npc-title">${npc.title}</span><span class="npc-hint">💬 Talk</span>`;
        refs.sceneContent.append(card);
        renderEquipmentShop();
    } else {
        const empty = document.createElement('div');
        empty.className = 'empty-space';
        empty.innerHTML = '<span class="icon">🚶</span><div class="title">Cultivation District</div><div class="subtitle">Choose where to go next</div>';
        refs.sceneContent.append(empty);
    }
    renderTravelOptions(loc?.exits || []);
}

function makeProfileItem(label, value) {
    const item = document.createElement('div');
    item.className = 'profile-item';
    const key = document.createElement('span');
    key.className = 'profile-label';
    key.textContent = label;
    const result = document.createElement('strong');
    result.className = 'profile-value';
    result.textContent = value;
    item.append(key, result);
    return item;
}

function renderPhenotypeProfile(plant) {
    const profile = document.createElement('section');
    profile.className = 'phenotype-profile';
    const header = document.createElement('div');
    header.className = 'profile-heading';
    header.textContent = `🧬 Phenotype ${phenotypeSeedLabel(plant.phenotype.seed)}`;
    const grid = document.createElement('div');
    grid.className = 'profile-grid';
    grid.append(
        makeProfileItem('Vigor', `${Math.round(plant.vigor)}%`),
        makeProfileItem('Yield', `${Math.round(plant.yieldPotential)}%`),
        makeProfileItem('Quality', `${Math.round(plant.qualityPotential)}%`),
        makeProfileItem('Resilience', `${Math.round(plant.resilience)}%`),
        makeProfileItem('Flower', `${plant.floweringDays}d`)
    );
    profile.append(header, grid);

    const traitRow = document.createElement('div');
    traitRow.className = 'trait-row';
    for (const trait of plant.dominantTraits) {
        const chip = document.createElement('span');
        chip.className = 'trait-chip';
        chip.textContent = formatTrait(trait);
        traitRow.append(chip);
    }
    if (!plant.dominantTraits.length) {
        const chip = document.createElement('span');
        chip.className = 'trait-chip muted';
        chip.textContent = 'No dominant traits';
        traitRow.append(chip);
    }
    profile.append(traitRow);
    return profile;
}

function addEnvironmentControl(container, field, label, value, unit = '') {
    const step = game.getEnvironmentControlStep(field);
    const row = document.createElement('div');
    row.className = 'environment-row';
    const name = document.createElement('span');
    name.className = 'environment-label';
    name.textContent = `${label} · ±${step}`;
    const controls = document.createElement('div');
    controls.className = 'environment-controls';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.className = 'env-step';
    decrease.dataset.envField = field;
    decrease.dataset.envDirection = '-1';
    decrease.setAttribute('aria-label', `Decrease ${label} by ${step}`);
    decrease.textContent = '−';
    const current = document.createElement('strong');
    current.className = 'environment-value';
    current.textContent = `${value}${unit}`;
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.className = 'env-step';
    increase.dataset.envField = field;
    increase.dataset.envDirection = '1';
    increase.setAttribute('aria-label', `Increase ${label} by ${step}`);
    increase.textContent = '+';
    controls.append(decrease, current, increase);
    row.append(name, controls);
    container.append(row);
}

function renderEnvironmentPanel() {
    const status = game.getEnvironmentStatus();
    const room = game.environment;
    const card = document.createElement('section');
    card.className = `environment-card status-${status.status}`;

    const header = document.createElement('div');
    header.className = 'environment-header';
    const title = document.createElement('div');
    title.innerHTML = '<strong>🎛️ Grow Room</strong><span>Equipment-driven game controls</span>';
    const score = document.createElement('div');
    score.className = `environment-score ${status.status}`;
    score.innerHTML = `<strong>${Math.round(status.score)}%</strong><span>${formatTrait(status.status)}</span>`;
    header.append(title, score);

    const vpd = document.createElement('div');
    vpd.className = 'vpd-readout';
    const equipped = game.equipment.getEquippedDefinitions();
    const gearNames = Object.values(equipped).map(item => item.name).join(' • ');
    vpd.textContent = `VPD ${status.vpd.toFixed(2)} kPa • ${gearNames}`;

    const controls = document.createElement('div');
    controls.className = 'environment-grid';
    addEnvironmentControl(controls, 'temperature', 'Temperature', room.temperature.toFixed(0), '°F');
    addEnvironmentControl(controls, 'humidity', 'Humidity', room.humidity.toFixed(0), '%');
    addEnvironmentControl(controls, 'light', 'Light', room.light.toFixed(0), '%');
    addEnvironmentControl(controls, 'ph', 'pH', room.ph.toFixed(1));
    addEnvironmentControl(controls, 'ec', 'EC', room.ec.toFixed(1));

    const note = document.createElement('p');
    note.className = 'simulation-note';
    note.textContent = 'Upgrade gear at the Mentor Shop for finer game controls. These are simulation values, not real-world cultivation instructions.';

    card.append(header, vpd, controls, note);
    refs.sceneContent.append(card);
}

function renderGrowRoom() {
    if (!game.plant) {
        const empty = document.createElement('div');
        empty.className = 'empty-space';
        empty.innerHTML = '<span class="icon">🌱</span><div class="title">Empty Grow Space</div><div class="subtitle">Plant a seed to begin</div>';
        refs.sceneContent.append(empty);
        renderEnvironmentPanel();
        return;
    }

    const p = game.plant;
    const emojis = p.genetics.stageEmojis || {};
    const isReady = p.stage === 'harvest_ready';
    const healthColor = p.health > 70 ? 'good' : p.health > 40 ? 'warning' : 'danger';
    const moistureColor = p.hydration >= 45 && p.hydration <= 90 ? 'good' : p.hydration >= 25 ? 'warning' : 'danger';
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.innerHTML = `
        <span class="plant-emoji ${isReady ? 'harvest-ready' : ''}">${emojis[p.stage] || '🌱'}</span>
        <div class="plant-name"></div>
        <div class="plant-stage-text">${isReady ? '🌾 READY TO HARVEST!' : formatStage(p.stage)}</div>
        <div class="plant-badge ${p.stage}">${formatStage(p.stage)}</div>
        <div class="plant-stats">
            <div class="plant-stat">❤️ Health <span class="stat-value">${Math.round(p.health)}%</span><div class="stat-bar"><div class="stat-bar-fill ${healthColor}" style="width:${Math.round(p.health)}%"></div></div></div>
            <div class="plant-stat">💪 Vigor <span class="stat-value">${Math.round(p.vigor)}%</span><div class="stat-bar"><div class="stat-bar-fill good" style="width:${Math.round(p.vigor)}%"></div></div></div>
            <div class="plant-stat">💧 Moisture <span class="stat-value">${Math.round(p.hydration)}%</span><div class="stat-bar"><div class="stat-bar-fill ${moistureColor}" style="width:${Math.round(p.hydration)}%"></div></div></div>
            <div class="plant-stat">⚠️ Stress <span class="stat-value">${Math.round(p.stress)}%</span><div class="stat-bar"><div class="stat-bar-fill ${p.stress < 25 ? 'good' : p.stress < 60 ? 'warning' : 'danger'}" style="width:${Math.round(p.stress)}%"></div></div></div>
            <div class="plant-stat">📈 Growth <span class="stat-value">${Math.round(p.development)}%</span><div class="stat-bar"><div class="stat-bar-fill good" style="width:${Math.round(p.development)}%"></div></div></div>
            <div class="plant-stat">🏠 Room <span class="stat-value">${Math.round(p.environmentScore)}%</span><div class="stat-bar"><div class="stat-bar-fill ${p.environmentScore >= 75 ? 'good' : p.environmentScore >= 45 ? 'warning' : 'danger'}" style="width:${Math.round(p.environmentScore)}%"></div></div></div>
        </div>`;
    card.querySelector('.plant-name').textContent = p.name;
    card.append(renderPhenotypeProfile(p));
    refs.sceneContent.append(card);
    renderEnvironmentPanel();
}

function renderTravelOptions(exits) {
    if (!exits.length) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'travel-list';
    for (const exit of exits) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'travel-button';
        button.dataset.travel = exit;
        button.textContent = locationLabel(exit);
        wrapper.append(button);
    }
    refs.sceneContent.append(wrapper);
}

function updateUI() {
    if (!game) return;
    const p = game.player;
    refs.playerName.textContent = p.name;
    refs.playerLevel.textContent = String(p.level);
    refs.playerXp.textContent = `${Math.floor(p.xp)} / ${p.xpToNext}`;
    refs.xpBar.style.width = `${Math.min(100, (p.xp / p.xpToNext) * 100)}%`;
    refs.playerMoney.textContent = `$${p.money}`;
    if (game.plant) {
        const emoji = game.plant.genetics.stageEmojis?.[game.plant.stage] || '🌱';
        refs.plantStatus.textContent = `${emoji} ${formatStage(game.plant.stage)}`;
        refs.plantHealth.textContent = `${Math.round(game.plant.health)}%`;
        refs.plantHealth.style.color = game.plant.health > 70 ? '#2ecc71' : game.plant.health > 40 ? '#f1c40f' : '#e74c3c';
    } else {
        refs.plantStatus.textContent = '🌰 None';
        refs.plantHealth.textContent = '—';
        refs.plantHealth.style.color = '#6a6a8a';
    }
    const inGrowRoom = game.location === 'grow_room';
    refs.btnPlant.disabled = !inGrowRoom || Boolean(game.plant) || !getPlantableSeed();
    refs.btnWater.disabled = !inGrowRoom || !game.plant || game.plant.stage === 'harvest_ready';
    refs.btnHarvest.disabled = !inGrowRoom || game.plant?.stage !== 'harvest_ready';
    renderScene();
}

function adjustRoomControl(control) {
    if (!game || game.location !== 'grow_room') return;
    const field = control.dataset.envField;
    const direction = Number(control.dataset.envDirection);
    if (!field || ![-1, 1].includes(direction)) return;
    if (!game.nudgeEnvironment(field, direction)) return;
    Audio.play('click');
    updateUI();
}

function bindEvents() {
    refs.startBtn.addEventListener('click', startNewGame);
    refs.loadBtn.addEventListener('click', loadGame);
    refs.btnInteract.addEventListener('click', interact);
    refs.btnPlant.addEventListener('click', plantSeed);
    refs.btnWater.addEventListener('click', waterPlant);
    refs.btnHarvest.addEventListener('click', harvestPlant);
    refs.btnInventory.addEventListener('click', openInventory);
    refs.btnSave.addEventListener('click', saveGame);
    refs.dialogClose.addEventListener('click', closeDialog);
    refs.inventoryClose.addEventListener('click', closeInventory);
    refs.sceneContent.addEventListener('click', event => {
        const buyButton = event.target.closest('[data-buy-equipment]');
        if (buyButton) {
            purchaseEquipment(buyButton.dataset.buyEquipment);
            return;
        }
        const equipButton = event.target.closest('[data-equip-equipment]');
        if (equipButton) {
            equipOwnedEquipment(equipButton.dataset.equipEquipment);
            return;
        }
        const envControl = event.target.closest('[data-env-field]');
        if (envControl) {
            adjustRoomControl(envControl);
            return;
        }
        const travel = event.target.closest('[data-travel]');
        if (travel) travelTo(travel.dataset.travel);
        else if (event.target.closest('[data-action]')?.dataset.action === 'talk-jenkins') talkToJenkins();
    });
    refs.nameInput.addEventListener('keydown', event => { if (event.key === 'Enter') startNewGame(); });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (refs.dialogModal.style.display === 'flex') closeDialog();
            else if (refs.inventoryModal.style.display === 'flex') closeInventory();
            return;
        }
        if (!game || event.target instanceof HTMLInputElement || event.ctrlKey || event.metaKey || event.altKey) return;
        switch (event.key.toLowerCase()) {
            case 'e': interact(); break;
            case 'p': plantSeed(); break;
            case 'w': waterPlant(); break;
            case 'h': harvestPlant(); break;
            case 'i': openInventory(); break;
            case 's': saveGame(); break;
            default: break;
        }
    });
}

async function bootstrap() {
    bindEvents();
    try {
        setLoading(15, 'Loading cultivation data...');
        gameData = await loadGameData();
        setLoading(65, 'Preparing grow room...');
        refs.loadBtn.disabled = !localStorage.getItem(SAVE_KEY);
        refs.app.style.display = 'flex';
        refs.startModal.style.display = 'flex';
        setLoading(100, 'Ready to grow! 🌱');
        await new Promise(resolve => setTimeout(resolve, 150));
        refs.loading.style.display = 'none';
        refs.nameInput.focus();
    } catch (error) {
        console.error(error);
        showFatalError(error instanceof Error ? error.message : 'Unknown startup error.');
    }
}

void bootstrap();
