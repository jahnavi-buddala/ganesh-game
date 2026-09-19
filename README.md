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
- Optional 45-second Ganesh Chaturthi quiz
- Public Supabase top-ten leaderboard
- Responsive controls and adaptive graphics for lower-memory mobile devices

## Technology

- Vue 3 and TypeScript
- Three.js with GLTF/FBX assets
- Vite
- Supabase leaderboard
- Vercel deployment

The renderer uses Three.js frustum culling for off-screen meshes, reuses shared geometry and materials, batches procedural scenery, adapts pixel density to frame time, pauses when the tab is hidden, and loads large models sequentially. Devices reporting 4 GB of memory or less load essential hero, Ganesha, modak, and Om models while using the game's lighter procedural scenery templates. Stronger devices retain the full approved asset set.

For testing, append `?quality=lite` or `?quality=full` to the game URL to override automatic graphics selection.

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
