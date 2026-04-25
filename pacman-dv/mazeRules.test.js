const assert = require('node:assert/strict');
const rules = require('./mazeRules');

const {
  GRID_SIZE,
  CELL_SIZE,
  EDGE_DOORS,
  WALL_COMPONENTS,
  VERTICAL_WALLS,
  HORIZONTAL_WALLS,
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

function assertSortedUnique(values, min, max) {
  values.forEach((value, index) => {
    assert.ok(value >= min && value <= max, `wall position ${value} is outside ${min}-${max}`);

    if (index > 0) {
      assert.ok(value > values[index - 1], 'wall positions must be sorted and unique');
    }
  });
}

function getOpenDirections(cell, allowEdgeTunnels = false) {
  return [DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right]
    .filter((direction) => canMove(cell, direction, allowEdgeTunnels));
}

function getOppositeDirection(direction) {
  if (direction === DIRECTIONS.up) return DIRECTIONS.down;
  if (direction === DIRECTIONS.down) return DIRECTIONS.up;
  if (direction === DIRECTIONS.left) return DIRECTIONS.right;
  if (direction === DIRECTIONS.right) return DIRECTIONS.left;
  return DIRECTIONS.none;
}

function getPerpendicularDirections(direction) {
  if (direction === DIRECTIONS.up || direction === DIRECTIONS.down) {
    return [DIRECTIONS.left, DIRECTIONS.right];
  }

  return [DIRECTIONS.up, DIRECTIONS.down];
}

function getSegmentEndpoints(segment) {
  if (segment.type === 'v') {
    return [
      `${segment.col},${segment.row}`,
      `${segment.col},${segment.row + 1}`
    ];
  }

  return [
    `${segment.col},${segment.row}`,
    `${segment.col + 1},${segment.row}`
  ];
}

function segmentsTouch(firstSegment, secondSegment) {
  const firstEndpoints = getSegmentEndpoints(firstSegment);
  const secondEndpoints = getSegmentEndpoints(secondSegment);

  return firstEndpoints.some((endpoint) => secondEndpoints.includes(endpoint));
}

function classifyWallComponent(component) {
  const vertices = new Map();

  component.segments.forEach((segment) => {
    getSegmentEndpoints(segment).forEach((endpoint) => {
      vertices.set(endpoint, (vertices.get(endpoint) || 0) + 1);
    });
  });

  const vertexDegrees = [...vertices.values()];
  const hasBranch = vertexDegrees.some((degree) => degree === 3);
  const segmentTypes = new Set(component.segments.map((segment) => segment.type));

  if (hasBranch) return 'T';
  if (segmentTypes.size === 1) return 'straight';
  if (Math.max(...vertexDegrees) === 2) return 'L';
  return 'other';
}

function isConnectedWallComponent(component) {
  const queue = [component.segments[0]];
  const seen = new Set([0]);

  for (let index = 0; index < queue.length; index += 1) {
    component.segments.forEach((segment, segmentIndex) => {
      if (!seen.has(segmentIndex) && segmentsTouch(queue[index], segment)) {
        seen.add(segmentIndex);
        queue.push(segment);
      }
    });
  }

  return seen.size === component.segments.length;
}

function getRenderedWallComponents() {
  const segments = WALL_COMPONENTS.flatMap((component) => component.segments);
  const renderedComponents = [];
  const seen = new Set();

  segments.forEach((segment, segmentIndex) => {
    if (seen.has(segmentIndex)) {
      return;
    }

    const queue = [segmentIndex];
    const componentSegments = [];
    seen.add(segmentIndex);

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const currentSegment = segments[queue[queueIndex]];
      componentSegments.push(currentSegment);

      segments.forEach((candidateSegment, candidateIndex) => {
        if (!seen.has(candidateIndex) && segmentsTouch(currentSegment, candidateSegment)) {
          seen.add(candidateIndex);
          queue.push(candidateIndex);
        }
      });
    }

    renderedComponents.push({
      name: `renderedWall${renderedComponents.length + 1}`,
      segments: componentSegments
    });
  });

  return renderedComponents;
}

test('grid is exactly 10x10 with 100 playable positions', () => {
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
  [DIRECTIONS.left, DIRECTIONS.right, DIRECTIONS.up, DIRECTIONS.down].forEach((direction) => {
    assert.equal(Math.abs(direction.row) + Math.abs(direction.col), 1);
  });

  assert.deepEqual(DIRECTIONS.none, { row: 0, col: 0, angle: 0 });
});

test('authored walls are connected components with max length 5', () => {
  const shapeCounts = { straight: 0, L: 0, T: 0, other: 0 };

  WALL_COMPONENTS.forEach((component) => {
    assert.ok(component.segments.length >= 2, `${component.name} is too short`);
    assert.ok(component.segments.length <= 5, `${component.name} is too long`);
    assert.ok(isConnectedWallComponent(component), `${component.name} is not connected`);

    const actualShape = classifyWallComponent(component);
    assert.equal(actualShape, component.shape);
    assert.ok(['straight', 'L', 'T', 'other'].includes(actualShape));
    shapeCounts[actualShape] += 1;

    component.segments.forEach((segment) => {
      assert.ok(segment.type === 'v' || segment.type === 'h');
    });
  });

  assert.ok(shapeCounts.straight > 0, 'expected at least one straight wall');
  assert.ok(shapeCounts.L > 0, 'expected at least one L-shaped wall');
  assert.ok(shapeCounts.T > 0, 'expected at least one T-shaped wall');
});

test('rendered walls are 2 to 5 connected segments with L and T shapes present', () => {
  const renderedComponents = getRenderedWallComponents();
  const shapeCounts = { straight: 0, L: 0, T: 0, other: 0 };

  renderedComponents.forEach((component) => {
    assert.ok(component.segments.length >= 2, `${component.name} is too short`);
    assert.ok(component.segments.length <= 5, `${component.name} is too long`);
    assert.ok(isConnectedWallComponent(component), `${component.name} is not connected`);

    const shape = classifyWallComponent(component);
    shapeCounts[shape] += 1;
  });

  assert.ok(shapeCounts.L > 0, 'expected at least one rendered L-shaped wall');
  assert.ok(shapeCounts.T > 0, 'expected at least one rendered T-shaped wall');
});

test('wall components create vertical and horizontal blockers', () => {
  assert.ok(VERTICAL_WALLS.length > 0);
  assert.ok(HORIZONTAL_WALLS.length > 0);

  VERTICAL_WALLS.forEach((wall) => {
    assert.ok(wall.col >= 1 && wall.col <= GRID_SIZE - 1);
    assertSortedUnique(wall.rows, 0, GRID_SIZE - 1);
  });

  HORIZONTAL_WALLS.forEach((wall) => {
    assert.ok(wall.row >= 1 && wall.row <= GRID_SIZE - 1);
    assertSortedUnique(wall.cols, 0, GRID_SIZE - 1);
  });
});

test('edge doors are limited to at most 3 per side', () => {
  Object.values(EDGE_DOORS).forEach((doors) => {
    assert.ok(doors.length <= 3);
    assertSortedUnique(doors, 0, GRID_SIZE - 1);
  });
});

test('edge doors are optional escape tunnels, not required for internal reachability', () => {
  assert.equal(getReachableCells({ row: 1, col: 1 }, false).size, GRID_SIZE * GRID_SIZE);
  assert.equal(getReachableCells({ row: 1, col: 1 }, true).size, GRID_SIZE * GRID_SIZE);
});

test('no cell is a dead end', () => {
  getAllCells().forEach((cell) => {
    assert.ok(getOpenDirections(cell, false).length >= 2, `dead end at ${cell.row},${cell.col}`);
  });
});

test('corridors dominate and no cell is 4-way open', () => {
  const degreeCounts = { 2: 0, 3: 0, 4: 0 };

  getAllCells().forEach((cell) => {
    const degree = getOpenDirections(cell, false).length;
    assert.ok(degree === 2 || degree === 3, `cell ${cell.row},${cell.col} has ${degree} exits`);
    degreeCounts[degree] += 1;
  });

  assert.ok(degreeCounts[2] >= 60, `expected corridors to dominate, got ${degreeCounts[2]} degree-2 cells`);
  assert.ok(degreeCounts[3] >= 10, `expected some intersections, got ${degreeCounts[3]} degree-3 cells`);
  assert.equal(degreeCounts[4], 0);
});

test('Pacman is never forced to reverse as the only way out', () => {
  getAllCells().forEach((cell) => {
    [DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right].forEach((incomingDirection) => {
      const reverseDirection = getOppositeDirection(incomingDirection);

      if (!canMove(cell, reverseDirection, false) || canMove(cell, incomingDirection, false)) {
        return;
      }

      const canTurn = getPerpendicularDirections(incomingDirection)
        .some((direction) => canMove(cell, direction, false));

      assert.ok(canTurn, `forced reversal at ${cell.row},${cell.col}`);
    });
  });
});

test('walls prevent direction changes where the requested path is blocked', () => {
  const wallLimitedCell = { row: 0, col: 5 };

  assert.equal(canMove(wallLimitedCell, DIRECTIONS.down, false), true);
  assert.equal(canMove(wallLimitedCell, DIRECTIONS.right, false), false);
  assert.equal(chooseMovementDirection(wallLimitedCell, DIRECTIONS.down, DIRECTIONS.right, false), DIRECTIONS.down);
});

test('Pacman changes direction when the requested path is open', () => {
  const cornerCell = { row: 0, col: 0 };

  assert.equal(canMove(cornerCell, DIRECTIONS.down, false), true);
  assert.equal(chooseMovementDirection(cornerCell, DIRECTIONS.right, DIRECTIONS.down, false), DIRECTIONS.down);
});

test('movement through vertical boundaries is blocked only by vertical wall islands', () => {
  for (let col = 1; col < GRID_SIZE; col += 1) {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      const fromLeft = { row, col: col - 1 };
      const fromRight = { row, col };
      const hasWall = hasVerticalWall(row, col);

      assert.equal(canMove(fromLeft, DIRECTIONS.right, false), !hasWall);
      assert.equal(canMove(fromRight, DIRECTIONS.left, false), !hasWall);
      assert.equal(hasWallBetween(fromLeft, fromRight), hasWall);
    }
  }
});

test('movement through horizontal boundaries is blocked only by horizontal wall islands', () => {
  for (let row = 1; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const fromTop = { row: row - 1, col };
      const fromBottom = { row, col };
      const hasWall = hasHorizontalWall(row, col);

      assert.equal(canMove(fromTop, DIRECTIONS.down, false), !hasWall);
      assert.equal(canMove(fromBottom, DIRECTIONS.up, false), !hasWall);
      assert.equal(hasWallBetween(fromTop, fromBottom), hasWall);
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
  const cell = { row: 0, col: 9 };

  assert.equal(canMove(cell, DIRECTIONS.right, false), false);
  assert.equal(canMove(cell, DIRECTIONS.left, false), true);
  assert.equal(chooseMovementDirection(cell, DIRECTIONS.right, DIRECTIONS.left, false), DIRECTIONS.left);
});

test('Pacman stops when current direction and requested direction are both blocked', () => {
  assert.equal(chooseMovementDirection({ row: 0, col: 0 }, DIRECTIONS.left, DIRECTIONS.up, false), DIRECTIONS.none);
});

run();
