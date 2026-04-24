const assert = require('node:assert/strict');
const rules = require('./mazeRules');

const {
  GRID_SIZE,
  CELL_SIZE,
  EDGE_DOORS,
  VERTICAL_DOORS,
  HORIZONTAL_DOORS,
  DIRECTIONS,
  isInsideGrid,
  hasVerticalWall,
  hasHorizontalWall,
  hasWallBetween,
  getNextCell,
  canMove,
  chooseMovementDirection,
  getCellCenter,
  getAllCells,
  getReachableCells
} = rules;

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  tests.forEach(({ name, fn }) => {
    fn();
    console.log(`PASS ${name}`);
  });

  console.log(`\n${tests.length} tests passed`);
}

function maxConsecutiveRun(values) {
  let longestRun = 1;
  let currentRun = 1;

  for (let index = 1; index < values.length; index += 1) {
    if (values[index] === values[index - 1] + 1) {
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 1;
    }
  }

  return longestRun;
}

function getDoorValues(line) {
  return line.rows || line.cols;
}

function assertSortedUnique(values, min, max) {
  values.forEach((value, index) => {
    assert.ok(value >= min && value <= max, `door position ${value} is outside ${min}-${max}`);

    if (index > 0) {
      assert.ok(value > values[index - 1], 'door positions must be sorted and unique');
    }
  });
}

test('grid is exactly 10x10 with 100 reachable positions', () => {
  const cells = getAllCells();
  const uniqueCells = new Set(cells.map((cell) => `${cell.row},${cell.col}`));

  assert.equal(GRID_SIZE, 10);
  assert.equal(cells.length, 100);
  assert.equal(uniqueCells.size, 100);
  cells.forEach((cell) => assert.ok(isInsideGrid(cell)));
});

test('cell centers align with the grid size and cell size', () => {
  assert.deepEqual(getCellCenter(0, 0), { x: CELL_SIZE / 2, y: CELL_SIZE / 2 });
  assert.deepEqual(getCellCenter(9, 9), { x: 9 * CELL_SIZE + CELL_SIZE / 2, y: 9 * CELL_SIZE + CELL_SIZE / 2 });
});

test('movement directions are limited to left, right, up, and down', () => {
  const movementDirections = [DIRECTIONS.left, DIRECTIONS.right, DIRECTIONS.up, DIRECTIONS.down];

  movementDirections.forEach((direction) => {
    const distance = Math.abs(direction.row) + Math.abs(direction.col);
    assert.equal(distance, 1);
  });

  assert.deepEqual(DIRECTIONS.none, { row: 0, col: 0, angle: 0 });
});

test('every grid slot is a playable position, not a filled wall cell', () => {
  getAllCells().forEach((cell) => assert.ok(isInsideGrid(cell)));
});

test('internal vertical wall lines have 5 to 6 door gaps', () => {
  assert.equal(VERTICAL_DOORS.length, GRID_SIZE - 1);

  VERTICAL_DOORS.forEach((line) => {
    assert.ok(line.col >= 1 && line.col <= GRID_SIZE - 1);
    assert.ok(line.rows.length >= 5 && line.rows.length <= 6);
    assertSortedUnique(line.rows, 0, GRID_SIZE - 1);
  });
});

test('internal horizontal wall lines have 5 to 6 door gaps', () => {
  assert.equal(HORIZONTAL_DOORS.length, GRID_SIZE - 1);

  HORIZONTAL_DOORS.forEach((line) => {
    assert.ok(line.row >= 1 && line.row <= GRID_SIZE - 1);
    assert.ok(line.cols.length >= 5 && line.cols.length <= 6);
    assertSortedUnique(line.cols, 0, GRID_SIZE - 1);
  });
});

test('door gaps do not form long consecutive runs', () => {
  [...VERTICAL_DOORS, ...HORIZONTAL_DOORS].forEach((line) => {
    assert.ok(maxConsecutiveRun(getDoorValues(line)) <= 2);
  });
});

test('edge doors are limited to at most 3 per side', () => {
  Object.entries(EDGE_DOORS).forEach(([, doors]) => {
    assert.ok(doors.length <= 3);
    assertSortedUnique(doors, 0, GRID_SIZE - 1);
  });
});

test('edge doors are optional escape tunnels, not required for internal reachability', () => {
  const reachableWithoutTunnels = getReachableCells({ row: 1, col: 1 }, false);

  assert.equal(reachableWithoutTunnels.size, GRID_SIZE * GRID_SIZE);
});

test('all cells remain reachable when edge tunnels are enabled', () => {
  const reachableWithTunnels = getReachableCells({ row: 1, col: 1 }, true);

  assert.equal(reachableWithTunnels.size, GRID_SIZE * GRID_SIZE);
});

test('movement through vertical boundaries is allowed only through vertical door gaps', () => {
  for (let col = 1; col < GRID_SIZE; col += 1) {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      const fromLeft = { row, col: col - 1 };
      const fromRight = { row, col };
      const hasDoor = !hasVerticalWall(row, col);

      assert.equal(canMove(fromLeft, DIRECTIONS.right, false), hasDoor);
      assert.equal(canMove(fromRight, DIRECTIONS.left, false), hasDoor);
      assert.equal(hasWallBetween(fromLeft, fromRight), !hasDoor);
    }
  }
});

test('movement through horizontal boundaries is allowed only through horizontal door gaps', () => {
  for (let row = 1; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const fromTop = { row: row - 1, col };
      const fromBottom = { row, col };
      const hasDoor = !hasHorizontalWall(row, col);

      assert.equal(canMove(fromTop, DIRECTIONS.down, false), hasDoor);
      assert.equal(canMove(fromBottom, DIRECTIONS.up, false), hasDoor);
      assert.equal(hasWallBetween(fromTop, fromBottom), !hasDoor);
    }
  }
});

test('non-door outer edges block movement', () => {
  assert.equal(canMove({ row: 0, col: 0 }, DIRECTIONS.up), false);
  assert.equal(canMove({ row: 0, col: 0 }, DIRECTIONS.left), false);
  assert.equal(canMove({ row: 9, col: 9 }, DIRECTIONS.right), false);
  assert.equal(canMove({ row: 9, col: 9 }, DIRECTIONS.down), false);
});

test('edge doors wrap to the opposite side when matching edge doors exist', () => {
  assert.deepEqual(getNextCell({ row: 1, col: 0 }, DIRECTIONS.left), {
    row: 1,
    col: 9,
    isWrapped: true,
    isBlockedByEdge: false
  });

  assert.deepEqual(getNextCell({ row: 5, col: 9 }, DIRECTIONS.right), {
    row: 5,
    col: 0,
    isWrapped: true,
    isBlockedByEdge: false
  });

  assert.deepEqual(getNextCell({ row: 0, col: 8 }, DIRECTIONS.up), {
    row: 9,
    col: 8,
    isWrapped: true,
    isBlockedByEdge: false
  });

  assert.deepEqual(getNextCell({ row: 9, col: 5 }, DIRECTIONS.down), {
    row: 0,
    col: 5,
    isWrapped: true,
    isBlockedByEdge: false
  });
});

test('edge wrapping is disabled when checking internal connectivity', () => {
  assert.deepEqual(getNextCell({ row: 1, col: 0 }, DIRECTIONS.left, false), {
    row: 1,
    col: -1,
    isWrapped: false,
    isBlockedByEdge: true
  });
});

test('Pacman keeps current direction when requested turn is blocked', () => {
  const cell = { row: 0, col: 1 };

  assert.equal(canMove(cell, DIRECTIONS.right, false), true);
  assert.equal(canMove(cell, DIRECTIONS.down, false), false);
  assert.equal(chooseMovementDirection(cell, DIRECTIONS.right, DIRECTIONS.down, false), DIRECTIONS.right);
});

test('Pacman changes direction when requested turn has a door gap', () => {
  const cell = { row: 0, col: 1 };

  assert.equal(canMove(cell, DIRECTIONS.right, false), true);
  assert.equal(canMove(cell, DIRECTIONS.left, false), true);
  assert.equal(chooseMovementDirection(cell, DIRECTIONS.right, DIRECTIONS.left, false), DIRECTIONS.left);
});

test('Pacman stops when current direction and requested direction are both blocked', () => {
  const cell = { row: 0, col: 0 };

  assert.equal(canMove(cell, DIRECTIONS.left, false), false);
  assert.equal(canMove(cell, DIRECTIONS.up, false), false);
  assert.equal(chooseMovementDirection(cell, DIRECTIONS.left, DIRECTIONS.up, false), DIRECTIONS.none);
});

run();
