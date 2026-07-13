export const WORLD = Object.freeze({
  width: 1920,
  height: 1280,
  spawn: { x: 310, y: 430 },
  zones: [
    { name: 'Seed Valley', x: 0, y: 0, width: 960, height: 720, color: 0x34724c },
    { name: 'Mosswater Trail', x: 960, y: 0, width: 960, height: 720, color: 0x28605a },
    { name: 'Amber Fields', x: 0, y: 720, width: 960, height: 560, color: 0x776438 },
    { name: 'Research Grove', x: 960, y: 720, width: 960, height: 560, color: 0x473f70 }
  ],
  hazards: [
    { id: 'spore-patch', x: 885, y: 805, width: 120, height: 95, cooldownMs: 2500, message: 'A fungal spore cloud bursts from the brush. Watch your environmental conditions.' },
    { id: 'thorn-vine', x: 1590, y: 540, width: 95, height: 130, cooldownMs: 2500, message: 'Thorn vines lash out. Some wild Phenos defend their territory.' }
  ],
  obstacles: [
    { x: 580, y: 300, width: 300, height: 185, label: 'Greenhouse' },
    { x: 1030, y: 250, width: 90, height: 410, label: 'Riverbank' },
    { x: 1280, y: 520, width: 260, height: 90, label: 'Rock Shelf' },
    { x: 530, y: 870, width: 380, height: 95, label: 'Field Fence' },
    { x: 1460, y: 900, width: 230, height: 150, label: 'Research Shrine' }
  ],
  interactables: [
    {
      id: 'seed-man', type: 'npc', x: 430, y: 390, label: 'Talk to Seed Man', priority: 4,
      dialogue: [
        'Seed Man: The wild Phenos are reacting to something beyond Mosswater Trail.',
        'Seed Man: Find the Glow Seed. Watch the environment—rare traits appear under pressure.',
        'Seed Man: Return to the research shrine once you have it.'
      ]
    },
    {
      id: 'valley-sign', type: 'sign', x: 270, y: 250, label: 'Read the trail sign', priority: 1,
      text: 'Seed Valley — cultivate knowledge, protect diversity, and leave the soil better than you found it.'
    },
    {
      id: 'glow-seed', type: 'collectible', x: 1260, y: 350, label: 'Collect Glow Seed', priority: 5,
      text: 'A warm pulse runs through the shell. The seed carries an unusual stable glow trait.'
    },
    {
      id: 'research-shrine', type: 'shrine', x: 1420, y: 820, label: 'Study the research shrine', priority: 3,
      text: 'The shrine maps lineage, environment, and expression as one connected system.'
    }
  ]
});
