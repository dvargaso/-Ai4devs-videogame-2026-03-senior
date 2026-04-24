const GRID_SIZE = 10;
const CELL_SIZE = 50;
const GAME_WIDTH = GRID_SIZE * CELL_SIZE;
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE;
const PACMAN_SPEED = 160;
const PACMAN_RADIUS = 18;
const MOUTH_ANIMATION_SPEED = 0.008;
const MAX_MOUTH_OPENING = 0.75;
const WALL_THICKNESS = 6;
const WALL_COLOR = 0x163cff;
const PATH_COLOR = 0x050505;

const EDGE_DOORS = {
  top: [1, 5, 8],
  right: [1, 5, 8],
  bottom: [1, 5, 8],
  left: [1, 5, 8]
};

const VERTICAL_DOORS = [
  { col: 1, rows: [0, 1, 3, 5, 7, 9] },
  { col: 2, rows: [0, 2, 4, 6, 8] },
  { col: 3, rows: [0, 2, 4, 5, 7, 9] },
  { col: 4, rows: [1, 3, 5, 7, 9] },
  { col: 5, rows: [0, 1, 3, 5, 7, 9] },
  { col: 6, rows: [0, 2, 4, 6, 7, 9] },
  { col: 7, rows: [0, 1, 3, 5, 7, 9] },
  { col: 8, rows: [0, 2, 4, 6, 8, 9] },
  { col: 9, rows: [0, 1, 3, 5, 7, 9] }
];

const HORIZONTAL_DOORS = [
  { row: 1, cols: [0, 2, 4, 6, 9] },
  { row: 2, cols: [0, 2, 4, 6, 8] },
  { row: 3, cols: [0, 2, 5, 7, 9] },
  { row: 4, cols: [0, 2, 4, 6, 8] },
  { row: 5, cols: [0, 3, 5, 7, 9] },
  { row: 6, cols: [0, 2, 4, 6, 9] },
  { row: 7, cols: [0, 3, 5, 7, 9] },
  { row: 8, cols: [0, 1, 3, 5, 7, 9] },
  { row: 9, cols: [0, 2, 4, 6, 7, 9] }
];

const DIRECTIONS = {
  left: { row: 0, col: -1, angle: Math.PI },
  right: { row: 0, col: 1, angle: 0 },
  up: { row: -1, col: 0, angle: -Math.PI / 2 },
  down: { row: 1, col: 0, angle: Math.PI / 2 },
  none: { row: 0, col: 0, angle: 0 }
};

let pacman;
let mazeGraphics;
let cursors;
let mouthTime = 0;
let currentDirection = 0;
let gridPosition = { row: 1, col: 1 };
let requestedDirection = DIRECTIONS.none;
let movementDirection = DIRECTIONS.none;
let targetCell = null;

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

  drawPacman(0);
}

function update(time, delta) {
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
  if (canMove(gridPosition, requestedDirection)) {
    movementDirection = requestedDirection;
  }

  if (!canMove(gridPosition, movementDirection)) {
    movementDirection = DIRECTIONS.none;
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

function canMove(fromCell, direction) {
  if (direction === DIRECTIONS.none) {
    return false;
  }

  const nextCell = getNextCell(fromCell, direction);

  if (nextCell.isBlockedByEdge) {
    return false;
  }

  if (nextCell.isWrapped) {
    return true;
  }

  return !hasWallBetween(fromCell, nextCell);
}

function getNextCell(fromCell, direction) {
  let nextRow = fromCell.row + direction.row;
  let nextCol = fromCell.col + direction.col;
  let isWrapped = false;
  let isBlockedByEdge = false;

  if (nextCol < 0 && hasEdgeDoor('left', fromCell.row) && hasEdgeDoor('right', fromCell.row)) {
    nextCol = GRID_SIZE - 1;
    isWrapped = true;
  } else if (nextCol >= GRID_SIZE && hasEdgeDoor('right', fromCell.row) && hasEdgeDoor('left', fromCell.row)) {
    nextCol = 0;
    isWrapped = true;
  } else if (nextRow < 0 && hasEdgeDoor('top', fromCell.col) && hasEdgeDoor('bottom', fromCell.col)) {
    nextRow = GRID_SIZE - 1;
    isWrapped = true;
  } else if (nextRow >= GRID_SIZE && hasEdgeDoor('bottom', fromCell.col) && hasEdgeDoor('top', fromCell.col)) {
    nextRow = 0;
    isWrapped = true;
  } else if (nextRow < 0 || nextRow >= GRID_SIZE || nextCol < 0 || nextCol >= GRID_SIZE) {
    isBlockedByEdge = true;
  }

  return { row: nextRow, col: nextCol, isWrapped, isBlockedByEdge };
}

function hasWallBetween(fromCell, toCell) {
  if (fromCell.row === toCell.row) {
    const wallCol = Math.max(fromCell.col, toCell.col);
    return hasVerticalWall(fromCell.row, wallCol);
  }

  const wallRow = Math.max(fromCell.row, toCell.row);
  return hasHorizontalWall(wallRow, fromCell.col);
}

function hasVerticalWall(row, col) {
  const doorLine = VERTICAL_DOORS.find((door) => door.col === col);
  return !doorLine || !doorLine.rows.includes(row);
}

function hasHorizontalWall(row, col) {
  const doorLine = HORIZONTAL_DOORS.find((door) => door.row === row);
  return !doorLine || !doorLine.cols.includes(col);
}

function hasEdgeDoor(edge, position) {
  return EDGE_DOORS[edge].includes(position);
}

function placePacmanAtCell(cell) {
  const center = getCellCenter(cell.row, cell.col);
  pacman.x = center.x;
  pacman.y = center.y;
}

function getCellCenter(row, col) {
  return {
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2
  };
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
