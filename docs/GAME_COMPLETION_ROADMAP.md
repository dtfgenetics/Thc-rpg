# THC: Pheno Quest — Game Completion Roadmap

## What Exists Now

The project now has a real vertical-slice foundation:

- Seed Man main character
- cannabis parody world bible
- Next.js website shell
- Express API
- PostgreSQL / Prisma schema
- shared battle math package
- RPG kernel package
- Phaser Grower’s Grove prototype
- turn-based battle engine
- Strain Addition timing
- Pheno Awakening
- inventory
- key tools
- obstacles
- unlock flags
- dialogue
- quests
- recruitment
- party roster
- Cure Station save points
- persistent companion HP
- Docker local database
- GitHub Actions CI

## What Still Must Be Built To Make It A Real Game

### 1. Run and Fix Build Errors

Before adding too many more features, the branch must be run locally or in CI.

Required checks:

```bash
npm install
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm test
npm run dev:api
npm run dev:web
```

Expected playable routes:

```text
/games/pheno-quest/grove
/games/pheno-quest
/games/pheno-quest/party
```

### 2. Proper Map Engine Layer

The Grower’s Grove map is currently a prototype scene with generated placeholder art and distance-based interactions.

Needed:

- tilemap loading
- collision layer
- interactable layer
- item layer
- obstacle layer
- NPC layer
- save point layer
- battle trigger layer
- region exit layer

### 3. Real Dialogue UI

Current dialogue is server-side data plus simple action text.

Needed:

- dialogue box component
- speaker portrait
- next/continue control
- player choices
- action choice handling
- quest start from dialogue choice

### 4. Battle Route Integration

Current Grower’s Grove rival interaction points players to the battle screen instead of transitioning directly.

Needed:

- map trigger starts battle
- battle screen receives battle ID
- after battle, return to map
- after win/loss, update quest/rewards

### 5. Map Save / Respawn Coordinates

Current save system stores last save point and region.

Needed:

- Seed Man spawn X/Y
- facing direction
- last map route
- respawn after defeat
- reload at save point

### 6. Item Use Outside Battle

Current inventory can store and consume items, but item effects are not connected to party HP yet.

Needed:

- Terp Tonic restores companion HP
- choose item target
- prevent overhealing
- update inventory quantity
- update companion current HP

### 7. Quest Journal UI

Current quest data exists in API/database.

Needed:

- active quest list
- completed quest list
- current step display
- rewards preview
- claim reward button when complete

### 8. Recruitment UI

Current recruitment is mostly automatic in Grower’s Grove.

Needed:

- available recruits screen
- requirement display
- recruit button
- confirmation message
- added-to-roster notice

### 9. Real Assets

Current art is placeholder generated shapes.

Needed minimum vertical-slice assets:

- Seed Man overworld sprite sheet
- Seed Man portrait
- Blue Mango companion portrait
- Sour Diesel companion portrait
- Granddaddy Purple companion portrait
- Skunk Scout portrait
- Kush Bruiser portrait
- Grower’s Grove tileset
- Grinder Relic icon
- Vapor Lens icon
- Terp Tonic icon
- Cure Station asset
- Resin Wall obstacle
- Smoke Path obstacle
- battle background
- UI buttons/frames

### 10. Mobile Controls

Since this must be playable on the website, mobile support is required early.

Needed:

- touch joystick
- interact button
- responsive battle controls
- large buttons
- mute/fullscreen buttons

### 11. Audio

Needed:

- Grower’s Grove loop
- battle loop
- menu click
- pickup sound
- tool-use sound
- Cure Station sound
- battle hit sound
- victory sound

### 12. First Chapter Polish

The first chapter should become a complete playable loop:

```text
Seed Man wakes in Grower’s Grove
→ talks to Garden Keeper Nugsworth
→ finds Grinder Relic
→ picks up Terp Tonic
→ clears Resin Wall
→ uses Cure Station
→ challenges Rival Grower Ashtray
→ wins battle
→ Skunk Scout joins
→ party screen unlocks
→ path to next region opens
```

### 13. Next Region

After Grower’s Grove, build one next region only.

Recommended:

```text
Sativa Summit
```

Purpose:
- prove region transitions
- introduce stronger enemy
- introduce new obstacle type
- introduce second recruit

### 14. Deployment

Needed before launch:

- decide dtfseeds route vs subdomain
- configure production env vars
- production database
- API host
- CORS
- build frontend
- run seed data
- verify health endpoint
- verify game routes

## Current Priority Order

1. Run/patch build and database errors.
2. Add item-use healing to companion HP.
3. Add real dialogue box UI.
4. Add battle transition from Grower’s Grove.
5. Add quest journal UI.
6. Add map save/respawn coordinates.
7. Add mobile controls.
8. Replace placeholder art with Seed Man and region assets.
9. Polish first chapter.
10. Deploy private beta route.

## Rule Going Forward

Do not expand to multiple regions or advanced systems until Grower’s Grove is a clean playable loop.

A game is not the number of features. A game is a complete loop that works, saves, recovers, rewards, and can be replayed without breaking.
