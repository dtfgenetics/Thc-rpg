export const MAX_VIGOR = 100;
export const MAX_STRESS = 100;
export const MAX_ENERGY = 6;

export function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < String(value).length; i += 1) {
    hash ^= String(value).charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed = 'thc-rpg') {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(items, seed = 'thc-rpg') {
  const copy = [...items];
  const random = createRng(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createInitialState({ seed = `run-${Date.now()}`, encounterIds = [] } = {}) {
  return {
    version: 1,
    seed,
    encounterOrder: seededShuffle(encounterIds, seed),
    turn: 0,
    vigor: 68,
    stress: 22,
    energy: MAX_ENERGY,
    knowledge: 0,
    score: 0,
    bestChoices: 0,
    mixedChoices: 0,
    poorChoices: 0,
    history: [],
    status: 'playing'
  };
}

export function applyEffects(state, effects = {}) {
  return {
    ...state,
    vigor: clamp(state.vigor + Number(effects.vigor || 0), 0, MAX_VIGOR),
    stress: clamp(state.stress + Number(effects.stress || 0), 0, MAX_STRESS),
    energy: clamp(state.energy + Number(effects.energy || 0), 0, MAX_ENERGY),
    knowledge: Math.max(0, state.knowledge + Number(effects.knowledge || 0)),
    score: Math.max(0, state.score + Number(effects.score || 0))
  };
}

export function resolveChoice(state, encounter, choice) {
  if (state.status !== 'playing') return state;
  if (!encounter || !choice) throw new Error('Encounter and choice are required.');
  const requiredEnergy = Math.abs(Math.min(0, Number(choice.effects?.energy || 0)));
  if (state.energy < requiredEnergy) {
    return {
      ...state,
      energy: clamp(state.energy + 2, 0, MAX_ENERGY),
      stress: clamp(state.stress + 3, 0, MAX_STRESS),
      score: Math.max(0, state.score - 15),
      history: [...state.history, {
        encounterId: encounter.id,
        encounterTitle: encounter.title,
        choiceId: 'recover',
        choiceLabel: 'Recover energy',
        quality: 'recovery',
        feedback: 'You were too drained to take that action, so the shift was spent recovering energy.',
        lesson: encounter.lesson
      }]
    };
  }

  let next = applyEffects(state, choice.effects);
  next = {
    ...next,
    turn: state.turn + 1,
    energy: clamp(next.energy + 1, 0, MAX_ENERGY),
    bestChoices: state.bestChoices + (choice.quality === 'best' ? 1 : 0),
    mixedChoices: state.mixedChoices + (choice.quality === 'mixed' ? 1 : 0),
    poorChoices: state.poorChoices + (choice.quality === 'poor' ? 1 : 0),
    history: [...state.history, {
      encounterId: encounter.id,
      encounterTitle: encounter.title,
      choiceId: choice.id,
      choiceLabel: choice.label,
      quality: choice.quality,
      feedback: choice.feedback,
      lesson: encounter.lesson
    }]
  };

  if (next.vigor <= 0 || next.stress >= MAX_STRESS) next.status = 'failed';
  else if (next.turn >= next.encounterOrder.length) next.status = 'complete';
  return next;
}

export function getCurrentEncounterId(state) {
  if (!state || state.status !== 'playing') return null;
  return state.encounterOrder[state.turn] ?? null;
}

export function runScore(state) {
  const healthBonus = Math.round(state.vigor * 4);
  const calmBonus = Math.round((MAX_STRESS - state.stress) * 2);
  const knowledgeBonus = state.knowledge * 25;
  const decisionBonus = state.bestChoices * 45 + state.mixedChoices * 12;
  return Math.max(0, Math.round(state.score + healthBonus + calmBonus + knowledgeBonus + decisionBonus));
}

export function rankForRun(state) {
  if (state.status === 'failed') return 'Room Reset';
  const score = runScore(state);
  if (score >= 2100) return 'Master Scout';
  if (score >= 1750) return 'Crop Guardian';
  if (score >= 1400) return 'Cultivation Scout';
  if (score >= 1050) return 'Room Keeper';
  return 'Seedling Runner';
}

export function nextMissionText(state) {
  if (state.status === 'failed') return 'The plant could not finish the shift. Review the field notes and start another run.';
  if (state.status === 'complete') return 'Seedling Shift cleared. The plant is ready for the next district.';
  return `Resolve room event ${state.turn + 1} of ${state.encounterOrder.length}.`;
}
