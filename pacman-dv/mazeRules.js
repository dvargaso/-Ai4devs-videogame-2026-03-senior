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

  function isInsideGrid(cell) {
    return cell.row >= 0 && cell.row < GRID_SIZE && cell.col >= 0 && cell.col < GRID_SIZE;
  }

  function hasEdgeDoor(edge, position) {
    return EDGE_DOORS[edge].includes(position);
  }

  function hasVerticalWall(row, col) {
    const doorLine = VERTICAL_DOORS.find((door) => door.col === col);
    return !doorLine || !doorLine.rows.includes(row);
  }

  function hasHorizontalWall(row, col) {
    const doorLine = HORIZONTAL_DOORS.find((door) => door.row === row);
    return !doorLine || !doorLine.cols.includes(col);
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
    VERTICAL_DOORS,
    HORIZONTAL_DOORS,
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
