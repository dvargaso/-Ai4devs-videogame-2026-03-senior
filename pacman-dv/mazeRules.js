(function (root, factory) {
  const rules = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = rules;
  }

  root.PacmanMazeRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const GRID_SIZE = 10;
  const CELL_SIZE = 50;

  const EDGE_DOORS = {
    top: [1, 5, 8],
    right: [1, 5, 8],
    bottom: [1, 5, 8],
    left: [1, 5, 8]
  };

  const WALL_COMPONENTS = [
    { name: 'wall1', shape: 'L', segments: [{ type: 'h', row: 1, col: 1 }, { type: 'h', row: 1, col: 2 }, { type: 'v', row: 1, col: 1 }, { type: 'v', row: 2, col: 1 }] },
    { name: 'wall2', shape: 'L', segments: [{ type: 'h', row: 1, col: 7 }, { type: 'h', row: 1, col: 8 }, { type: 'v', row: 1, col: 7 }, { type: 'v', row: 1, col: 9 }] },
    { name: 'wall3', shape: 'L', segments: [{ type: 'h', row: 2, col: 2 }, { type: 'h', row: 2, col: 3 }, { type: 'v', row: 1, col: 4 }] },
    { name: 'wall4', shape: 'T', segments: [{ type: 'h', row: 3, col: 2 }, { type: 'h', row: 3, col: 3 }, { type: 'h', row: 3, col: 4 }, { type: 'v', row: 2, col: 5 }, { type: 'v', row: 3, col: 5 }] },
    { name: 'wall5', shape: 'L', segments: [{ type: 'h', row: 3, col: 6 }, { type: 'v', row: 2, col: 6 }, { type: 'v', row: 1, col: 6 }, { type: 'v', row: 0, col: 6 }] },
    { name: 'wall6', shape: 'T', segments: [{ type: 'h', row: 3, col: 8 }, { type: 'v', row: 2, col: 8 }, { type: 'v', row: 3, col: 8 }, { type: 'h', row: 4, col: 7 }, { type: 'h', row: 4, col: 6 }] },
    { name: 'wall7', shape: 'straight', segments: [{ type: 'h', row: 4, col: 0 }, { type: 'h', row: 4, col: 1 }] },
    { name: 'wall8', shape: 'L', segments: [{ type: 'h', row: 5, col: 2 }, { type: 'v', row: 4, col: 3 }, { type: 'v', row: 5, col: 2 }, { type: 'h', row: 6, col: 1 }] },
    { name: 'wall9', shape: 'L', segments: [{ type: 'h', row: 5, col: 4 }, { type: 'h', row: 5, col: 5 }, { type: 'v', row: 5, col: 4 }, { type: 'v', row: 5, col: 6 }] },
    { name: 'wall10', shape: 'L', segments: [{ type: 'h', row: 6, col: 7 }, { type: 'v', row: 5, col: 8 }] },
    { name: 'wall11', shape: 'straight', segments: [{ type: 'h', row: 7, col: 0 }, { type: 'h', row: 7, col: 1 }] },
    { name: 'wall12', shape: 'T', segments: [{ type: 'h', row: 7, col: 4 }, { type: 'h', row: 7, col: 5 }, { type: 'v', row: 7, col: 5 }, { type: 'h', row: 7, col: 6 }] },
    { name: 'wall13', shape: 'L', segments: [{ type: 'h', row: 7, col: 8 }, { type: 'v', row: 6, col: 9 }, { type: 'v', row: 5, col: 9 }, { type: 'v', row: 4, col: 9 }] },
    { name: 'wall14', shape: 'L', segments: [{ type: 'h', row: 8, col: 3 }, { type: 'v', row: 7, col: 3 }, { type: 'v', row: 6, col: 3 }] },
    { name: 'wall15', shape: 'T', segments: [{ type: 'h', row: 8, col: 6 }, { type: 'h', row: 8, col: 7 }, { type: 'v', row: 8, col: 7 }, { type: 'h', row: 8, col: 8 }, { type: 'v', row: 8, col: 9 }] },
    { name: 'wall16', shape: 'T', segments: [{ type: 'h', row: 9, col: 1 }, { type: 'h', row: 9, col: 2 }, { type: 'v', row: 8, col: 2 }] },
    { name: 'wall17', shape: 'straight', segments: [{ type: 'h', row: 9, col: 4 }, { type: 'h', row: 9, col: 5 }] }
  ];

  const VERTICAL_WALLS = buildWallLines('v', 'col', 'rows');
  const HORIZONTAL_WALLS = buildWallLines('h', 'row', 'cols');

  const DIRECTIONS = {
    left: { row: 0, col: -1, angle: Math.PI },
    right: { row: 0, col: 1, angle: 0 },
    up: { row: -1, col: 0, angle: -Math.PI / 2 },
    down: { row: 1, col: 0, angle: Math.PI / 2 },
    none: { row: 0, col: 0, angle: 0 }
  };

  function isInsideGrid(cell) {
    return cell.row >= 0 && cell.row < GRID_SIZE && cell.col >= 0 && cell.col < GRID_SIZE;
  }

  function hasEdgeDoor(edge, position) {
    return EDGE_DOORS[edge].includes(position);
  }

  function buildWallLines(type, lineKey, positionsKey) {
    const lines = new Map();

    WALL_COMPONENTS.forEach((component) => {
      component.segments
        .filter((segment) => segment.type === type)
        .forEach((segment) => {
          addWallPosition(lines, segment[lineKey], type === 'v' ? segment.row : segment.col);
        });
    });

    return [...lines.entries()]
      .map(([line, positions]) => ({
        [lineKey]: line,
        [positionsKey]: [...new Set(positions)].sort((a, b) => a - b)
      }))
      .sort((a, b) => a[lineKey] - b[lineKey]);
  }

  function addWallPosition(lines, line, position) {
    if (!lines.has(line)) {
      lines.set(line, []);
    }

    lines.get(line).push(position);
  }

  function hasVerticalWall(row, col) {
    const wallLine = VERTICAL_WALLS.find((wall) => wall.col === col);
    return Boolean(wallLine && wallLine.rows.includes(row));
  }

  function hasHorizontalWall(row, col) {
    const wallLine = HORIZONTAL_WALLS.find((wall) => wall.row === row);
    return Boolean(wallLine && wallLine.cols.includes(col));
  }

  function hasWallBetween(fromCell, toCell) {
    if (fromCell.row === toCell.row) {
      const wallCol = Math.max(fromCell.col, toCell.col);
      return hasVerticalWall(fromCell.row, wallCol);
    }

    const wallRow = Math.max(fromCell.row, toCell.row);
    return hasHorizontalWall(wallRow, fromCell.col);
  }

  function getNextCell(fromCell, direction, allowEdgeTunnels = true) {
    let nextRow = fromCell.row + direction.row;
    let nextCol = fromCell.col + direction.col;
    let isWrapped = false;
    let isBlockedByEdge = false;

    if (allowEdgeTunnels && nextCol < 0 && hasEdgeDoor('left', fromCell.row) && hasEdgeDoor('right', fromCell.row)) {
      nextCol = GRID_SIZE - 1;
      isWrapped = true;
    } else if (allowEdgeTunnels && nextCol >= GRID_SIZE && hasEdgeDoor('right', fromCell.row) && hasEdgeDoor('left', fromCell.row)) {
      nextCol = 0;
      isWrapped = true;
    } else if (allowEdgeTunnels && nextRow < 0 && hasEdgeDoor('top', fromCell.col) && hasEdgeDoor('bottom', fromCell.col)) {
      nextRow = GRID_SIZE - 1;
      isWrapped = true;
    } else if (allowEdgeTunnels && nextRow >= GRID_SIZE && hasEdgeDoor('bottom', fromCell.col) && hasEdgeDoor('top', fromCell.col)) {
      nextRow = 0;
      isWrapped = true;
    } else if (nextRow < 0 || nextRow >= GRID_SIZE || nextCol < 0 || nextCol >= GRID_SIZE) {
      isBlockedByEdge = true;
    }

    return { row: nextRow, col: nextCol, isWrapped, isBlockedByEdge };
  }

  function canMove(fromCell, direction, allowEdgeTunnels = true) {
    if (direction === DIRECTIONS.none) {
      return false;
    }

    const nextCell = getNextCell(fromCell, direction, allowEdgeTunnels);

    if (nextCell.isBlockedByEdge) {
      return false;
    }

    if (nextCell.isWrapped) {
      return true;
    }

    return !hasWallBetween(fromCell, nextCell);
  }

  function chooseMovementDirection(fromCell, currentDirection, requestedDirection, allowEdgeTunnels = true) {
    if (canMove(fromCell, requestedDirection, allowEdgeTunnels)) {
      return requestedDirection;
    }

    if (canMove(fromCell, currentDirection, allowEdgeTunnels)) {
      return currentDirection;
    }

    return DIRECTIONS.none;
  }

  function getCellCenter(row, col) {
    return {
      x: col * CELL_SIZE + CELL_SIZE / 2,
      y: row * CELL_SIZE + CELL_SIZE / 2
    };
  }

  function getAllCells() {
    const cells = [];

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        cells.push({ row, col });
      }
    }

    return cells;
  }

  function getReachableCells(startCell, allowEdgeTunnels = true) {
    const queue = [startCell];
    const seen = new Set([cellKey(startCell)]);
    const directions = [DIRECTIONS.up, DIRECTIONS.down, DIRECTIONS.left, DIRECTIONS.right];

    for (let index = 0; index < queue.length; index += 1) {
      directions.forEach((direction) => {
        if (!canMove(queue[index], direction, allowEdgeTunnels)) {
          return;
        }

        const nextCell = getNextCell(queue[index], direction, allowEdgeTunnels);
        const key = cellKey(nextCell);

        if (!seen.has(key)) {
          seen.add(key);
          queue.push({ row: nextCell.row, col: nextCell.col });
        }
      });
    }

    return seen;
  }

  function cellKey(cell) {
    return `${cell.row},${cell.col}`;
  }

  return {
    GRID_SIZE,
    CELL_SIZE,
    EDGE_DOORS,
    WALL_COMPONENTS,
    VERTICAL_WALLS,
    HORIZONTAL_WALLS,
    DIRECTIONS,
    isInsideGrid,
    hasEdgeDoor,
    hasVerticalWall,
    hasHorizontalWall,
    hasWallBetween,
    getNextCell,
    canMove,
    chooseMovementDirection,
    getCellCenter,
    getAllCells,
    getReachableCells,
    cellKey
  };
});
