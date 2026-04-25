const {
  GRID_SIZE,
  CELL_SIZE,
  DIRECTIONS,
  hasEdgeDoor,
  hasVerticalWall,
  hasHorizontalWall,
  getNextCell,
  canMove,
  chooseMovementDirection,
  getCellCenter
} = PacmanMazeRules;

const GAME_WIDTH = GRID_SIZE * CELL_SIZE;
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE;
const PACMAN_SPEED = 160;
const PACMAN_RADIUS = 18;
const GHOST_SPEED = 105;
const GHOST_RADIUS = 17;
const MOUTH_ANIMATION_SPEED = 0.008;
const MAX_MOUTH_OPENING = 0.75;
const WALL_THICKNESS = 6;
const WALL_COLOR = 0x163cff;
const PATH_COLOR = 0x050505;
const GHOST_SPAWNS = [
  { row: 8, col: 8, color: 0xff2f7d },
  { row: 1, col: 8, color: 0x00d7ff },
  { row: 8, col: 1, color: 0xff9f1c }
];

let pacman;
let ghosts = [];
let mazeGraphics;
let cursors;
let statusText;
let mouthTime = 0;
let currentDirection = 0;
let gridPosition = { row: 1, col: 1 };
let requestedDirection = DIRECTIONS.none;
let movementDirection = DIRECTIONS.none;
let targetCell = null;
let isCaught = false;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#050505',
  scene: {
    create,
    update
  }
};

new Phaser.Game(config);

function create() {
  cursors = this.input.keyboard.createCursorKeys();
  mazeGraphics = this.add.graphics();
  drawMaze();

  pacman = this.add.graphics();
  placePacmanAtCell(gridPosition);

  ghosts = GHOST_SPAWNS.map((spawn) => createGhost(this, spawn));
  statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
    fontFamily: 'Arial',
    fontSize: '36px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5);

  drawPacman(0);
}

function update(time, delta) {
  if (isCaught) {
    return;
  }

  updateRequestedDirection();

  if (!targetCell) {
    chooseNextCell();
  }

  if (targetCell) {
    movePacmanTowardTarget(delta);
  }


  mouthTime += delta;
  const mouthOpening = getMouthOpening();
  drawPacman(mouthOpening);

  updateGhosts(delta);
  checkGhostContact();
}

function updateRequestedDirection() {
  if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
    requestedDirection = DIRECTIONS.left;
  } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
    requestedDirection = DIRECTIONS.right;
  } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
    requestedDirection = DIRECTIONS.up;
  } else if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
    requestedDirection = DIRECTIONS.down;
  }
}

function chooseNextCell() {
  movementDirection = chooseMovementDirection(gridPosition, movementDirection, requestedDirection);

  if (movementDirection === DIRECTIONS.none) {
    return;
  }

  currentDirection = movementDirection.angle;
  targetCell = getNextCell(gridPosition, movementDirection);

  if (targetCell.isWrapped) {
    gridPosition = { row: targetCell.row, col: targetCell.col };
    placePacmanAtCell(gridPosition);
    targetCell = null;
  }
}

function movePacmanTowardTarget(delta) {
  const targetPixel = getCellCenter(targetCell.row, targetCell.col);
  const distanceThisFrame = PACMAN_SPEED * (delta / 1000);
  const distanceToTarget = Phaser.Math.Distance.Between(
    pacman.x,
    pacman.y,
    targetPixel.x,
    targetPixel.y
  );

  if (distanceThisFrame >= distanceToTarget) {
    gridPosition = { row: targetCell.row, col: targetCell.col };
    placePacmanAtCell(gridPosition);
    targetCell = null;
    return;
  }

  pacman.x += movementDirection.col * distanceThisFrame;
  pacman.y += movementDirection.row * distanceThisFrame;
}

function placePacmanAtCell(cell) {
  const center = getCellCenter(cell.row, cell.col);
  pacman.x = center.x;
  pacman.y = center.y;
}

function drawMaze() {
  mazeGraphics.clear();
  mazeGraphics.fillStyle(PATH_COLOR);
  mazeGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawOuterWalls();
  drawInteriorWalls();
}

function drawOuterWalls() {
  mazeGraphics.fillStyle(WALL_COLOR);

  for (let col = 0; col < GRID_SIZE; col += 1) {
    if (!hasEdgeDoor('top', col)) {
      mazeGraphics.fillRect(col * CELL_SIZE, 0, CELL_SIZE, WALL_THICKNESS);
    }

    if (!hasEdgeDoor('bottom', col)) {
      mazeGraphics.fillRect(col * CELL_SIZE, GAME_HEIGHT - WALL_THICKNESS, CELL_SIZE, WALL_THICKNESS);
    }
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    if (!hasEdgeDoor('left', row)) {
      mazeGraphics.fillRect(0, row * CELL_SIZE, WALL_THICKNESS, CELL_SIZE);
    }

    if (!hasEdgeDoor('right', row)) {
      mazeGraphics.fillRect(GAME_WIDTH - WALL_THICKNESS, row * CELL_SIZE, WALL_THICKNESS, CELL_SIZE);
    }
  }
}

function drawInteriorWalls() {
  mazeGraphics.fillStyle(WALL_COLOR);

  for (let col = 1; col < GRID_SIZE; col += 1) {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      if (hasVerticalWall(row, col)) {
        mazeGraphics.fillRect(
          col * CELL_SIZE - WALL_THICKNESS / 2,
          row * CELL_SIZE,
          WALL_THICKNESS,
          CELL_SIZE
        );
      }
    }
  }

  for (let row = 1; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (hasHorizontalWall(row, col)) {
        mazeGraphics.fillRect(
          col * CELL_SIZE,
          row * CELL_SIZE - WALL_THICKNESS / 2,
          CELL_SIZE,
          WALL_THICKNESS
        );
      }
    }
  }
}

function createGhost(scene, spawn) {
  const ghost = {
    graphics: scene.add.graphics(),
    color: spawn.color,
    gridPosition: { row: spawn.row, col: spawn.col },
    movementDirection: DIRECTIONS.none,
    targetCell: null
  };

  placeGhostAtCell(ghost, ghost.gridPosition);
  drawGhost(ghost);

  return ghost;
}

function updateGhosts(delta) {
  ghosts.forEach((ghost) => {
    if (!ghost.targetCell) {
      chooseGhostNextCell(ghost);
    }

    if (ghost.targetCell) {
      moveGhostTowardTarget(ghost, delta);
    }
  });
}

function chooseGhostNextCell(ghost) {
  const direction = chooseGhostDirection(ghost);

  if (direction === DIRECTIONS.none) {
    return;
  }

  ghost.movementDirection = direction;
  ghost.targetCell = getNextCell(ghost.gridPosition, direction);

  if (ghost.targetCell.isWrapped) {
    ghost.gridPosition = { row: ghost.targetCell.row, col: ghost.targetCell.col };
    placeGhostAtCell(ghost, ghost.gridPosition);
    ghost.targetCell = null;
  }
}

function chooseGhostDirection(ghost) {
  const openDirections = [DIRECTIONS.up, DIRECTIONS.left, DIRECTIONS.down, DIRECTIONS.right]
    .filter((direction) => canMove(ghost.gridPosition, direction));

  if (openDirections.length === 0) {
    return DIRECTIONS.none;
  }

  const forwardChoices = openDirections.filter((direction) => !isOppositeDirection(direction, ghost.movementDirection));
  const choices = forwardChoices.length > 0 ? forwardChoices : openDirections;

  return choices
    .map((direction) => {
      const nextCell = getNextCell(ghost.gridPosition, direction);
      return {
        direction,
        distance: getGridDistance(nextCell, gridPosition)
      };
    })
    .sort((first, second) => first.distance - second.distance)[0].direction;
}

function moveGhostTowardTarget(ghost, delta) {
  const targetPixel = getCellCenter(ghost.targetCell.row, ghost.targetCell.col);
  const distanceThisFrame = GHOST_SPEED * (delta / 1000);
  const distanceToTarget = Phaser.Math.Distance.Between(
    ghost.graphics.x,
    ghost.graphics.y,
    targetPixel.x,
    targetPixel.y
  );

  if (distanceThisFrame >= distanceToTarget) {
    ghost.gridPosition = { row: ghost.targetCell.row, col: ghost.targetCell.col };
    placeGhostAtCell(ghost, ghost.gridPosition);
    ghost.targetCell = null;
    return;
  }

  ghost.graphics.x += ghost.movementDirection.col * distanceThisFrame;
  ghost.graphics.y += ghost.movementDirection.row * distanceThisFrame;
}

function placeGhostAtCell(ghost, cell) {
  const center = getCellCenter(cell.row, cell.col);
  ghost.graphics.x = center.x;
  ghost.graphics.y = center.y;
}

function drawGhost(ghost) {
  ghost.graphics.clear();
  ghost.graphics.fillStyle(ghost.color);
  ghost.graphics.fillCircle(0, -3, GHOST_RADIUS);
  ghost.graphics.fillRect(-GHOST_RADIUS, -3, GHOST_RADIUS * 2, GHOST_RADIUS + 8);

  for (let index = 0; index < 3; index += 1) {
    ghost.graphics.fillTriangle(
      -GHOST_RADIUS + index * 12,
      GHOST_RADIUS + 5,
      -GHOST_RADIUS + index * 12 + 6,
      GHOST_RADIUS + 14,
      -GHOST_RADIUS + index * 12 + 12,
      GHOST_RADIUS + 5
    );
  }

  ghost.graphics.fillStyle(0xffffff);
  ghost.graphics.fillCircle(-6, -5, 4);
  ghost.graphics.fillCircle(6, -5, 4);
}

function checkGhostContact() {
  const touchedGhost = ghosts.some((ghost) => {
    return ghost.gridPosition.row === gridPosition.row && ghost.gridPosition.col === gridPosition.col;
  });

  if (!touchedGhost) {
    return;
  }

  isCaught = true;
  movementDirection = DIRECTIONS.none;
  targetCell = null;
  statusText.setText('CAUGHT!');
}

function isOppositeDirection(firstDirection, secondDirection) {
  return firstDirection.row + secondDirection.row === 0 && firstDirection.col + secondDirection.col === 0;
}

function getGridDistance(firstCell, secondCell) {
  return Math.abs(firstCell.row - secondCell.row) + Math.abs(firstCell.col - secondCell.col);
}

function getMouthOpening() {
  const animationValue = Math.abs(Math.sin(mouthTime * MOUTH_ANIMATION_SPEED));
  return animationValue * MAX_MOUTH_OPENING;
}

function drawPacman(mouthOpening) {
  pacman.clear();
  pacman.fillStyle(0xffdd00);
  pacman.slice(
    0,
    0,
    PACMAN_RADIUS,
    currentDirection + mouthOpening,
    currentDirection + Math.PI * 2 - mouthOpening,
    false
  );
  pacman.fillPath();
}
