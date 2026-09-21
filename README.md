# Vighnaharta Run

**Beat the Vighna. Earn the Blessing.**

Vighnaharta Run is a Ganesh Chaturthi endless runner starring Mushika. Dodge festival obstacles, collect modaks, climb connected rooftop routes, and run toward Lord Ganesha's distant pandal. A sacred Om gift appears during longer runs and activates Maha Aashirwad Mode.

## Play

- Live game: https://vighnahartarun.vercel.app/
- Source: https://github.com/jahnavi-buddala/ganesh-game

The game works in current mobile and desktop browsers. No account is required to play. A name is requested only when a player chooses to submit a final score to the public leaderboard.

## How to play

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move lanes | `A` / `D` or `Left` / `Right` | Swipe left/right or use the buttons |
| Jump | `W`, `Up`, or `Space` | Swipe up or tap Jump |
| Slide | `S` or `Down` | Swipe down or tap Slide |
| Pause | `P` or `Esc` | Pause button |

Collect modaks for points. Avoid drums, carts, gates, and festival vehicles. Mushika has three hearts; the run ends after the last heart is lost. The difficulty and running speed increase with distance. Collecting the Om gift activates ten seconds of Maha Aashirwad: double score, automatic modak collection, and obstacle protection.

## Festival features

- Mushika as the animated player character
- Lord Ganesha waiting at the distant glowing pandal
- Five changing festival street themes
- Modaks, rangoli, marigolds, diyas, drums, carts, lamps, and decorated facades
- Connected ramps, vehicle roofs, and elevated routes
- Maha Aashirwad collectible and blessing effects
- Public Supabase top-ten leaderboard
- Responsive controls and shared model rendering for mobile devices

## Technology

- Vue 3 and TypeScript
- Three.js with GLTF/FBX assets
- Vite
- Supabase leaderboard
- Vercel deployment

The renderer uses per-instance camera culling and shared GPU draws for repeated approved models, reuses street geometry, and limits collision checks to nearby obstacles. It stops rendering behind the opaque main menu and while paused. Original models, textures, bloom, and shadows are retained on every device; RAM detection no longer substitutes simplified assets or lowers resolution during a run. Large assets still load sequentially to limit temporary loading memory.

## Local development

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` to connect a different Supabase project.

## Validation

```bash
npm test
npm run build
```

The gameplay checks cover lane limits, jumping, sliding, collisions, heart loss, scoring, blessings, difficulty progression, obstacle patterns, ramps, rooftops, pausing, and restarts.

## Asset and tool disclosure

The project combines custom/procedural Three.js scenery with 3D and audio files supplied by the project team. The menu illustration was created with OpenAI image generation. Development used coding assistance, but the gameplay rules, presentation, testing, and final integration remain part of this repository and can be explained from the source.

Before contest submission, attach the original creator/license link or generation record for every externally supplied model, texture, image, and audio file. See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for the remaining submission items.

### First-load delivery

`npm run dev` and `npm run build` generate lossless packed models in `public/assets/packed`. Originals remain unchanged; the packing script verifies decompressed bytes against every original GLB. The 92.4 MB model set transfers as about 70.3 MB. Content-hashed filenames can be cached safely across visits. The opening menu renders before the 3D engine initializes, with progress while models load. Low-memory and unknown mobile devices decode one model at a time; other devices load at most two concurrently. Browsers without streaming gzip support use the original GLBs.

Run `node scripts/check-model-loading.mjs` to check queue limits, retry recovery, and both automatic and manual gzip decoding.
