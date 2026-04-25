# Pacman Implementation Progress

We will build the game in small, testable phases. We will only move to the next phase after the current phase has been tested and you explicitly say to continue.

## Project Rules

- Use plain `index.html`, `style.css`, and `game.js`.
- Load Phaser 3 from a CDN.
- Do not use npm, bundlers, frameworks, backend code, or external asset files.
- Keep each phase small, readable, and manually testable.
- Preserve existing working behavior when adding new features.
- Stop after each phase and wait for explicit approval before continuing.
- Run `node mazeRules.test.js` from `pacman-dv` after changes that affect maze or movement rules.

## Phase 1: Phaser Canvas and Free Pacman Movement

Status: Completed

Goal:
- Create the smallest working Phaser 3 browser game.
- Show a Pacman-like yellow circle with a simple mouth animation.
- Allow free movement with arrow keys.

Manual test:
- Open `index.html` in a browser.
- Confirm the Phaser canvas appears.
- Press one arrow key once and confirm Pacman keeps moving in that direction.
- Confirm Pacman changes direction only when another arrow key is pressed.
- Confirm Pacman wraps to the opposite side after moving past a canvas edge.

Known limitations:
- No maze yet.
- No grid movement yet.
- All canvas edges currently behave like doors; specific maze edge doors will be added with the grid.
- No ghosts, dots, score, lives, or levels yet.

## Phase 2: 10x10 Maze and Grid Movement

Status: Ready for testing

Goal:
- Add a fixed 10x10 grid maze.
- Draw walls as thin, clearly visible boundaries between grid cells.
- Change Pacman movement from free movement to cell-by-cell movement.
- Constrain Pacman movement by blocking movement across wall boundaries.
- Treat walls as small islands/segments, not full path dividers.
- Make each rendered wall island a connected shape with 2 to 5 wall segments.
- Prefer 3 to 5 wall segments for larger islands, while allowing 2-segment islands when needed to preserve corridor playability.
- Allow straight, L-shaped, T-shaped, and similar 90-degree wall island shapes.
- Require L-shaped and T-shaped walls to both be represented in the rendered maze.
- Enforce rendered wall shape and length rules in `mazeRules.test.js`.
- Keep openings as the default between neighboring cells unless a wall segment blocks movement.
- Keep all cells reachable through internal grid paths without requiring edge tunnels.
- Limit edge doors to a maximum of 3 per side; edge tunnels are escape routes, not the main navigation.
- Avoid sealed rooms, dead ends, and forced reversals where Pacman can only escape by going backward.
- Prevent free roaming with corridor degree rules instead of a hard straight-span length test.
- Ensure every cell has exactly 2 or 3 exits; never allow 4-way open cells.
- Keep most cells at 2 exits so corridors dominate, with some 3-exit intersections.
- Let wall placement naturally limit direction changes; do not add artificial turn restrictions.
- Allow Pacman to turn whenever the requested neighboring cell is not blocked by a wall.
- Keep Pacman moving in the current direction until a wall blocks movement or the player changes direction.
- Add edge doors that wrap Pacman from one side of the grid to the opposite side when a door exists.

Manual test:
- Confirm Pacman moves one cell at a time.
- Confirm walls are thin boundaries and do not fill entire grid cells.
- Confirm Pacman cannot cross thin wall boundaries.
- Confirm walls feel like small islands/segments instead of long dividers.
- Confirm Pacman can only move through boundaries not blocked by wall segments.
- Confirm Pacman can reach all 100 grid positions by navigating through internal paths and door gaps.
- Confirm Pacman does not need edge tunnels to escape any area.
- Confirm Pacman never has to reverse as the only way out of a path.
- Confirm rendered wall islands are 2 to 5 connected segments, including L-shaped and T-shaped examples.
- Confirm Pacman keeps moving in the current direction until a wall blocks him or a new valid direction is chosen.
- Confirm each outer edge has only 3 tunnel doors.

Known limitations:
- No ghosts yet.
- No dots, score, lives, or levels yet.

## Phase 3: Ghosts and Chase Movement

Status: Not started

Goal:
- Add simple ghost characters.
- Move ghosts cell-by-cell through the same maze paths as Pacman.
- Give ghosts deterministic chase behavior using simple grid-based logic.
- Add basic ghost and Pacman contact detection.

Manual test:
- Confirm ghosts spawn in valid maze cells.
- Confirm ghosts move through paths without crossing walls.
- Confirm ghosts generally move toward Pacman.
- Confirm contact between Pacman and a ghost is detected.

Known limitations:
- Ghost collisions may not cost lives until a later phase.
- No power pellets yet.
- No score or win condition yet.

## Phase 4: Power Pellets and Vulnerable Ghosts

Status: Not started

Goal:
- Add 5 to 8 power pellets to valid walkable cells.
- Let Pacman eat power pellets.
- Enable a 10-second power mode.
- Make ghosts vulnerable during power mode.
- Make vulnerable ghosts run away from Pacman using simple grid logic.
- Allow Pacman to kill vulnerable ghosts on contact.

Manual test:
- Confirm power pellets disappear when eaten.
- Confirm power mode lasts about 10 seconds.
- Confirm ghosts visibly change state while vulnerable.
- Confirm Pacman can kill ghosts only during power mode.

Known limitations:
- Score may still be incomplete until the next phase.
- Dead ghosts stay gone until the current level resets or advances.

## Phase 5: Dots, Score, and Level Win Condition

Status: Not started

Goal:
- Add dots to every other valid walkable cell except spawn and power pellet cells.
- Increase score when Pacman eats dots.
- Track remaining dots.
- Win the level when all dots are eaten.

Manual test:
- Confirm dots appear only on valid paths.
- Confirm dots disappear when eaten.
- Confirm score increases after eating dots.
- Confirm the level win state triggers after all dots are eaten.

Known limitations:
- Full level progression and lives are added in the next phase.

## Phase 6: Lives, Level Progression, and Ghost Speed Scaling

Status: Not started

Goal:
- Add 3 lives.
- Lose one life when Pacman touches a dangerous ghost.
- Reset Pacman and active ghosts to spawn positions after losing a life while preserving eaten dots and pellets.
- Restart from level 1 with score, dots, pellets, ghosts, and lives reset after losing all lives.
- Add 3 levels.
- Keep the same maze for all levels.
- Increase ghost speed by 25% each level.
- Show a final win state after completing level 3.

Manual test:
- Confirm dangerous ghost contact removes one life.
- Confirm the current level progress is preserved after losing a life.
- Confirm losing all lives fully restarts the game from level 1.
- Confirm level 2 starts only after clearing level 1.
- Confirm level 3 starts only after clearing level 2.
- Confirm ghosts move faster on each level.
- Confirm completing level 3 shows the final win state.

Known limitations:
- This is the final planned milestone for the toy game.
