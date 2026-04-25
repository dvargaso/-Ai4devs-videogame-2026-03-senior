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

  const EXTRA_CONNECTIONS = [
    [{ row: 0, col: 2 }, { row: 1, col: 2 }],
    [{ row: 0, col: 5 }, { row: 1, col: 5 }],
    [{ row: 1, col: 4 }, { row: 2, col: 4 }],
    [{ row: 2, col: 6 }, { row: 3, col: 6 }],
    [{ row: 3, col: 3 }, { row: 4, col: 3 }],
    [{ row: 4, col: 7 }, { row: 5, col: 7 }],
    [{ row: 5, col: 2 }, { row: 6, col: 2 }],
    [{ row: 6, col: 5 }, { row: 7, col: 5 }],
    [{ row: 7, col: 8 }, { row: 8, col: 8 }],
    [{ row: 8, col: 4 }, { row: 9, col: 4 }],
    [{ row: 2, col: 0 }, { row: 2, col: 1 }],
    [{ row: 4, col: 0 }, { row: 4, col: 1 }]
  ];

  const OPEN_CONNECTIONS = buildOpenConnections();
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

  function buildOpenConnections() {
    const connections = new Set();
    const cyclePath = buildHamiltonianCyclePath();

    for (let index = 0; index < cyclePath.length; index += 1) {
      const fromCell = cyclePath[index];
      const toCell = cyclePath[(index + 1) % cyclePath.length];
      connections.add(connectionKey(fromCell, toCell));
    }

    EXTRA_CONNECTIONS.forEach(([fromCell, toCell]) => {
      connections.add(connectionKey(fromCell, toCell));
    });

    return connections;
  }

  function buildHamiltonianCyclePath() {
    const path = [];

    path.push({ row: 0, col: 0 });

    for (let col = 1; col < GRID_SIZE; col += 1) {
      path.push({ row: 0, col });
    }

    for (let row = 1; row < GRID_SIZE; row += 1) {
      if (row % 2 === 1) {
        for (let col = GRID_SIZE - 1; col >= 1; col -= 1) {
          path.push({ row, col });
        }
      } else {
        for (let col = 1; col < GRID_SIZE; col += 1) {
          path.push({ row, col });
        }
      }
    }

    for (let row = GRID_SIZE - 1; row >= 1; row -= 1) {
      path.push({ row, col: 0 });
    }

    return path;
  }

  function buildWallLines(type, lineKey, positionsKey) {
    const lines = new Map();

    if (type === 'v') {
      for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 1; col < GRID_SIZE; col += 1) {
          const fromCell = { row, col: col - 1 };
          const toCell = { row, col };

          if (!hasOpenConnection(fromCell, toCell)) {
            addWallPosition(lines, col, row);
          }
        }
      }
    } else {
      for (let row = 1; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          const fromCell = { row: row - 1, col };
          const toCell = { row, col };

          if (!hasOpenConnection(fromCell, toCell)) {
            addWallPosition(lines, row, col);
          }
        }
      }
    }

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

  function hasOpenConnection(fromCell, toCell) {
    return OPEN_CONNECTIONS.has(connectionKey(fromCell, toCell));
  }

  function connectionKey(fromCell, toCell) {
    const firstKey = cellKey(fromCell);
    const secondKey = cellKey(toCell);

    return firstKey < secondKey ? `${firstKey}|${secondKey}` : `${secondKey}|${firstKey}`;
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

    return hasOpenConnection(fromCell, nextCell);
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
    EXTRA_CONNECTIONS,
    OPEN_CONNECTIONS,
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
