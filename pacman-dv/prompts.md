Initial Prompt


I want to create a simple html, CSS, JS  and Phaser lib based pacman game. This is a toy project I want to keep things simple.  I will use an coding IDE to build the game and I want to do it as an iterative process where I will create small milestones that I can be testing as I complete. 

The main goal is to come up with a solid starting prompt to get started with the process with the code assistant. Before comming up with the prompt, let's capture all main details of the game and the process. 

Some initial requirements:
- Game is web  browser based. Simplistic. No advanced graphics
- At the last phase it should resemble a pacman
- Game has 3 levels. NExt level can only be reached by winning the previous level.
- Main character is a "pacman" or a circle with a mouth that is opened and closed 
- The pacmas moves over a maze. The maze is simple, random generated and it follows 90 degree turns. Maze path connect at multiple places. Between 3 to 5 connection or doors per path.
- Maze grid should follow an 8x8 grid
- pacman can only go up or down, left or right. Directiion determined by arrow keys.
- The game features "ghosts" which are pacman enemies. Ghosts chase pacman following the same maze paths.  The pacman can kill ghosts by eating power pallets. There's 5-8 power pallets per maze per level. Each power pallet lasts 30 seconds. During porwer pallet working period. the ghosts run away from pacman and pacman can kill them by touching them. All the other time the ghosts chase pacman and kill him by touching him.
- Level is determined by speed of ghosts. Each leel the ghosts move faster 
- The maze is filled with dots that pacman eats while navigating trough the maze. The player wins when he eats all the dots. 

I want to develop the game following by phases following at a minimum the next milestones:

1. There is a pacman that can move freely over a canvas
2. There is an 8x8 maze over the canvas, the pacman can move following the paths
3. There are ghosts that chase pacman
4. There are power pallets spread across the maze. Pacman can eat them and chase ghosts. When a ghost is touched during a power pellet activation. The ghost dies
5. There is a score counter. Evey dot the pacman eats, increase the score. Player wins when pacman eats all the dots.
6. Player can move to the next level when a level is won. Next level the ghosts move 25% faster. 


That's the main definition of the game. 
Review my plan, rules and phases and ask me any claryfing questions. Keep the questions up t 10. I'm not trying to build a perfect game and I rather correct over the implementation than try to have everything ready.  We should clarify gaps and contradictions 


# Initial Prompt for Cursor 

## INSTRUCTIONS

Adopt the role of an expert Phaser 3 game developer and technical mentor. Help me build a simple browser-based Pacman-style toy game using plain HTML, CSS, JavaScript, and Phaser 3 loaded from a CDN.

This project must be developed iteratively through small, testable milestones. Do not try to build the entire game at once. For each phase, produce only the code and explanation needed for that phase, then stop and wait for me to test it before continuing.

The final game should resemble a simplified Pacman-style game with a circle character, a maze, dots, power pellets, ghosts, scoring, lives, and level progression.

Build the project with this approach:

1. Start from the smallest working version.
2. Keep the code simple and readable.
3. Avoid advanced graphics, build tools, bundlers, frameworks, physics engines, or complex architecture.
4. Use Phaser 3 from a CDN.
5. Use plain `index.html`, `style.css`, and `game.js`.
6. After each milestone, explain exactly what I should test manually.
7. Only move to the next milestone after I confirm the current one works.
8. When adding a feature, preserve existing working behavior unless a change is required.
9. Prefer clear, explicit logic over clever abstractions.
10. When there is ambiguity, choose the simplest implementation that keeps the game playable.

## INPUTS

Project type:
- Browser-based toy game
- Plain HTML, CSS, JavaScript
- Phaser 3 loaded from CDN
- No advanced graphics
- No build tools
- No backend
- No asset files unless absolutely necessary

Game concept:
- A simplified Pacman-style game.
- The player controls a Pacman-like circle with a mouth animation that opens and closes.
- Pacman moves through a square maze.
- Ghosts chase Pacman.
- Dots are placed throughout the maze.
- Power pellets allow Pacman to kill ghosts temporarily.
- The player wins a level by eating all dots.
- The game has 3 levels.
- Each next level is reached only after winning the previous level.
- The maze stays consistent across all levels.
- Only ghost speed changes between levels.

Grid and maze:
- Use a 10x10 grid.
- The grid represents 100 potential positions.
- Each grid slot may contain Pacman, a dot, a power pellet, a ghost, empty path, or wall.
- Movement is cell-by-cell.
- Pacman can only move up, down, left, or right.
- Direction is controlled by arrow keys.
- Pacman continues moving in the current direction until the player changes direction or a wall blocks movement.
- Maze is square and limited by the 10x10 grid.
- Maze walls are vertical or horizontal.
- Maze paths should connect at multiple places.
- Each vertical or horizontal path should have a minimum of 5 doors/connections and a maximum of 8 doors/connections where practical.
- If this door rule creates complexity, prioritize a playable connected maze over perfect procedural generation.
- The maze should be valid: Pacman must be able to reach all dots and power pellets.

Dots and power pellets:
- Dots appear on every other walkable cell, except cells used for Pacman spawn, ghost spawn, and power pellets.
- Eating a dot increases the score.
- The player wins the level when all dots are eaten.
- Each maze has 5 to 8 power pellets.
- Power pellets last 10 seconds.
- During power pellet mode, ghosts switch from dangerous to vulnerable.
- During power pellet mode, ghosts run away from Pacman instead of chasing him.
- If Pacman touches a ghost during power pellet mode, the ghost dies.
- Dead ghosts disappear until the player wins or loses the current level.

Ghosts:
- Ghosts move on the same grid paths as Pacman.
- Ghosts move cell-by-cell.
- Ghosts have two normal behavior modes: chase and scatter.
- In chase mode, ghosts move toward Pacman using simple grid-based logic.
- In scatter mode, ghosts move toward predefined corner targets or away from Pacman using simple logic.
- Ghost AI should be simple and understandable, not a full recreation of the original arcade game.
- When Pacman is not powered up, touching a ghost costs the player one life.
- If the player still has lives left, restart Pacman and active ghosts at their spawn positions, but keep maze progress.
- If the player loses all 3 lives, restart from level 1 with score, dots, pellets, ghosts, and lives reset.

Levels:
- The game has 3 levels.
- The maze stays the same across all 3 levels.
- Level 1 uses base ghost speed.
- Level 2 makes ghosts 25% faster than Level 1.
- Level 3 makes ghosts 25% faster than Level 2.
- The player can only move to the next level after eating all dots in the current level.
- Winning Level 3 shows a final win state.

Milestones:
1. Create a canvas with Phaser 3 and a Pacman character that can move freely.
2. Add a 10x10 maze and constrain Pacman to move cell-by-cell along valid paths.
3. Add ghosts that move through the maze and chase Pacman.
4. Add power pellets. Pacman can eat them, ghosts become vulnerable, and Pacman can kill ghosts by touching them.
5. Add dots, score counter, and win condition when all dots are eaten.
6. Add lives, level progression, and 25% ghost speed increase per level.

## CONSTRAINTS

1. Do not generate the full final game in one response.
2. Begin with Milestone 1 only.
3. At the end of each milestone response, stop and ask me to test before continuing.
4. Keep each milestone small enough that I can copy the code into my IDE and run it immediately.
5. Use only these files unless a later milestone clearly needs another file:
   - `index.html`
   - `style.css`
   - `game.js`
6. Include complete file contents when code changes are required.
7. Do not provide partial snippets unless you clearly say where they go.
8. Do not introduce npm, Vite, Webpack, TypeScript, React, external assets, or server-side code.
9. Use simple Phaser shapes for graphics:
   - Pacman as a yellow circle or arc-style shape with simple mouth animation.
   - Ghosts as simple colored circles or rounded shapes.
   - Dots as small circles.
   - Power pellets as larger circles.
   - Maze walls as rectangles.
10. Use constants for grid size, cell size, speeds, level settings, power mode duration, and score values.
11. Keep collision and movement logic grid-based once the maze milestone begins.
12. Prefer deterministic behavior for easier testing.
13. Add comments only where they explain important logic.
14. Mention known limitations after each milestone if something is intentionally incomplete.

Aknowledge rules before doing any change or trying to start  



#Phase 1 Adjustments 

Good. 
Apply the following adjustments
- Pacman moves but it doesn't continue mmoveing. Once a direction has been set by the player with the arrow keys, pcam an must contnue moving in the same direction until the player changes it again or the game f=finishes by wither the player losing or winning the level
- Right now, the edges of the grid are walls. There can be doors in the adges as well. If pacman or the ghosts enter a door that it's in an edge, it continues moving in the same direction from the oposite side of the grid when there is a door

#Phase 2 

##Adjustment 1

The output it's not the expectted.  Few  things to clarify.
The walls won't fill up a cell in the grid. They are thin but clearly visible. They just separate the maze paths and offer doors for the pacman to enter or exit. 


## Adjustment 2
Much better.Another correction needed. There cannot be rooms created by walls. All paths must be reachable trough doors. All the positions in the grid must be reachable by pacaman by navigatin trough paths and doors

##Adjustment 3 
There's too many doors between paths. There should be more walls. Right now pacaman can move wayy to freely. It's movement should be limited to moving left or right or up or down. It should only be able to change directions trough a door, there must not be consecutive doors. I stablished. alimit of doors per path. It must be respected. 

##Adjustment 4 
The walls are  now creating "virtual rooms"  The only way out of a room cannot only be trough an edge of the grid. 
I want to lomit the number of edge doors. Maximim 3 per side. It's a scape route and it valid. But most of the pacaman navigation should be within the grid withouth hacing to use tunnels all the time. 

## Phase 2 MVP reached 
It's not great but it's acceptable. Before I add any more rules. I want to be sure that further changes don't break existing rules grid and movement rules. Create a unit test file and add unit tests for every single rule that we have discusses. I want to guarantee that everything stays working ad we add more rules. 

##Adjustment 5

ok. New rule. For playability. Some of the paths are just sort of staircases. That makes it awkward playing it. For any given movement, pacman must be able to move a minimum of 4 cells without having to change direction. before getting blocked. It should be able to move a maximum of 8 cells without changing direction. 


## Adjustment 6
Last change really made the game worse. The pacman now has to take the oposite direcion following most paths. Meaning it will get stuck really quick and must reverse. This cannot happen. Pacman must be able to move just by taking a 90 degreee turn in at least 1 direction. The only wait out of a path cannot be  the oposite direction. Is this rule clear ? 

# Phase 5

##Adjustmet 1
Change the following rules:
- There must be a dot pr cell unless there is a pellet. Right now there is one ebvery other cell
- Counters must be located outside of the grid. 

## Adjustment 2

REmove the Score and dots from the main layout. Right now it looks like it's located in the game, just outside of the grill. It must be complete separated. Outside of the game boundaries. What is dots ? IS it dots left ? 


# MVP Finished

##Game Experience Improvements

The MVP is working. Now I want to make small improvements:
- Make the ghosts move faster. 25% faster. Keep level over level speed increases the same. Extract the ghost speed into a config variable I can easily tweak. It should prepresent the base. All other levels are just increments over that base
- Make the ghosts blink when power pellet is active
- Add simlple 8 bit retro game music in the background to the game. When pellet is active, it should speed up a bit 