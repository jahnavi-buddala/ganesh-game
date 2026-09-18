# Vighnaharta Run

A playable Vue + Three.js festival runner based on the supplied concept image.

## Play locally

Run `npm run dev -- --host 127.0.0.1`, then open the local address printed in the terminal. The current development address is http://127.0.0.1:5173/.

Use arrow keys or WASD to switch lanes, jump and slide; Space also jumps. Escape or P pauses. Touch devices support swipes and on-screen buttons. Jump over drums, slide beneath striped barriers and dodge carts. Collect modaks and select the correct offering at each timed Vighna Gate.

Near misses require a recent lane change, rather than simply running in an adjacent lane. Successful dodges, near misses and gate answers build a combo. Combo 3 grants a ten-second blessing with increased speed, automatic collection and invincibility. Combo 5 and subsequent multiples of 5 grant Maha Aashirwad with double scoring, flower particles and a golden aura. Obstacles passed during invincibility do not build combos or perpetually extend the timer. Failed gate challenges break the combo and cost one heart. Three lost hearts end the run.

Five environments cycle every 500 metres. The opening environment can be selected from the menu. They share the street foundations, with different atmospheric colors and scenery: temple columns, market stalls, festival arches, ceremonial arches and flowers, and a covered temple corridor.

Personal leaderboard entries persist in this browser using local storage. They are device-local, not an online leaderboard. Audio is synthesized in the browser and can be muted.

The interface adapts to desktop, split-screen windows, tablets, portrait phones and short landscape phones. Mobile layouts respect display cutouts and browser safe areas, keep dialogs scrollable, and provide persistent touch controls in both orientations.

## Verification

- `npm test`: gameplay checks for movement, jump/slide collision rules, lives, invulnerability, combos, scoring, frame-rate independence, pause, gates, environment cycling and restart.
- `npm run build`: TypeScript validation and production build in `dist/`.
- Browser visual and interaction checks cover the menu, starting, pause/resume, restart, game over, leaderboard, gate and responsive layouts.

## Files

- `src/festival/world.ts`: Three.js scenery, character, obstacles, rendering, controls and audio.
- `src/festival/rules.ts`: game state and simulation rules.
- `src/App.vue`: menus, HUD, dialogs and saved scores.
- `src/assets/main.less`: responsive visual styling.
- `public/assets/festival/`: generated artwork and its provenance.
- `backup-before-festival/`: original App.vue, main.less and index.html.

The previous subway engine and its model files remain available in `src/Game/` and `public/assets/glb/`; the new application uses the festival engine. Synced ChatGPT reference files were not changed.

## Visual scope

The approved route GLB models are loaded from `public/model-review-v1/models/` by `src/festival/approved.ts`. Mushika now uses the user-supplied skinned running character at `public/assets/models/meshy_mushika_running.glb`; its embedded animation is mapped to the gameplay `Run` state and the model is normalized to the existing player height. The distant landmark uses the user-supplied textured model at `public/assets/models/ganesha_3d.glb`. Drum obstacles use the user-supplied textured model at `public/assets/models/tribal_drum_free.glb`; it is normalized to the gameplay obstacle size so its visible body and collision behavior stay aligned. The striped slide barrier has been replaced by the user-supplied textured marigold gate at `public/assets/models/marigold_temple_gate.glb`, fitted to one lane and the slide collision height. Roadside lights use the user-supplied textured model at `public/assets/models/titanic_lamp.glb`, normalized and repeated with the street modules. The running surface now uses the user-supplied textured path at `public/assets/models/marigold_lantern_path.glb`; it is oriented, stretched to the street module, and flattened to a shallow paving layer above the continuous collision road. Play waits for the assets to load. Runtime materials use a lighter lighting model while retaining the approved geometry and colors. Vehicle roofs, access ramps and rooftop sections support elevated running, jumping and returning to street level. The ramp, vehicle and rooftop seams are linked so the connected route does not report false collisions while Mushika crosses it. Ganesha stays at a fixed distant position in every environment; the corridor has an open center so he remains visible. The original review gallery is retained as the approval snapshot.

The current visual pass uses a lower chase camera, a cool-to-warm sunset sky, directional key light, contact shadows and distance haze. The street module includes varied facade colors, arched window surrounds, balcony rails, layered temple roofs, shop awnings, lamps, garlands, rangoli and festival visitors. These details repeat as optimized modular geometry so the endless route can continue without creating new scenery every frame.

The menu illustration follows the reference's detailed art direction. Gameplay is genuine 3D using original procedural models and textured scenery. It is a stylized implementation, not a pixel-identical reproduction of the concept illustration. Matching that illustration's fur, animation and architectural detail in gameplay would require bespoke production 3D assets. Environment cards are illustrative previews using the menu artwork.

The supplied Mixamo jump and running-slide FBX clips are retargeted onto the skinned Mushika rig at load time. Root translation stays under gameplay control, while matching body-bone rotations provide the jump and slide poses.

The supplied `BeHit_FlyUp` clip uses the same skinned Mushika skeleton and plays for every obstacle collision that removes a heart. It takes priority over locomotion during the 1.6-second impact response, then returns to the appropriate running, jumping, or sliding state.

After an impact, Mushika remains continuously visible and the struck obstacle releases its collision hold so the route keeps moving. Any lane, jump, or slide input immediately exits the hit pose, while the short damage-protection timer continues to prevent repeated heart loss.

Landing switches directly from the jump clip to the running clip, avoiding an unanimated bind-pose frame. Elevated routes add a small visual foot clearance above the mathematical collision surface so the running animation stays on top of ramp cloth, vehicle roofs and bridge trim.

The original tribal drum has been replaced in gameplay by the supplied textured festival drum on wheels at `public/assets/models/festival_drum_on_wheels.glb`. It is fitted to the existing jumpable drum collision volume so its wheels, body and visible clearance agree with gameplay.

The long elevated bridge is fitted to the same 2.67-unit height used by its support collision. This removes the previous 0.47-unit gap that made Mushika appear embedded in the bridge deck.

When the final heart is lost, gameplay enters a three-second cinematic state before the results screen. The supplied `Flying Back Death` FBX is retargeted onto the existing textured Mushika skin, the HUD is hidden, the route freezes, and the camera moves in front of Mushika to show the complete fall with cinematic framing.

Death-animation hip motion is floor-clamped so the fallen character cannot pass underground. Elevated support uses the full visible deck width, and the ramp, vehicle and bridge support ranges overlap slightly to prevent a one-frame drop at their seams.

Each run opens with a short animated Mushika entrance and a smooth camera move into the chase view. Route movement and controls begin after the transition so the opening pose cannot be interrupted or flash into a bind pose.

The premium street pass uses a 62-degree low chase camera with Mushika framed at roughly one quarter of the screen height, dark warm stone paving, thin gold lane guides, repeated rangoli, varied facade heights and colors, fewer side pedestrians, warm-orange key light, purple evening fog, ACES tone mapping and restrained bloom. Obstacles spawn individually at varied 9–12 unit intervals using the supplied festival drum, marigold barricade and festival vehicle, with elevated routes spaced farther apart. The Ganesha landmark is smaller, farther away and lit from inside its destination pandal.

Blessing Mode now displays the supplied ornamental golden lotus aura around Mushika. The optimized camera-facing effect pulses and rotates gently, replacing the plain torus, and grows brighter and larger during Maha Aashirwad.

The supplied textured marigold market cart is included as a fourth randomized obstacle. It is fitted to one lane, uses the low jumpable obstacle collision profile, and appears alongside the festival drum, marigold barricade and festival vehicle.

## Smooth gameplay

- Gameplay and animation continue at the browser's full frame rate, while HUD number updates are limited to reduce interface rendering work.
- Render resolution adapts to slower devices and uses a lower ceiling on touch devices to protect frame pacing.
- Repeated roadside lamp models are spaced efficiently, reducing the number of detailed GLB copies in view.
- The procedural road remains beneath the decorative lantern-path model so collision and movement stay reliable.
