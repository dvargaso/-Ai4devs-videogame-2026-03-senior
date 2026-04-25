(function (root, factory) {
  const mazeRules = typeof module === 'object' && module.exports
    ? require('./mazeRules')
    : root.PacmanMazeRules;
  const rules = factory(mazeRules);

  if (typeof module === 'object' && module.exports) {
    module.exports = rules;
  }

  root.PacmanGameRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (mazeRules) {
  const POWER_MODE_DURATION = 10000;
  const DOT_SCORE = 10;
  const CONTACT_ACTIONS = {
    none: 'none',
    caught: 'caught',
    kill: 'kill'
  };

  const {
    DIRECTIONS,
    getNextCell,
    canMove
  } = mazeRules;

  function collectPowerPellet(powerPellets, pacmanCell) {
    const pellet = powerPellets.find((candidate) => {
      return !candidate.eaten && candidate.row === pacmanCell.row && candidate.col === pacmanCell.col;
    });

    if (!pellet) {
      return null;
    }

    pellet.eaten = true;
    return pellet;
  }

  function createDotCells(allCells, excludedCells) {
    return allCells
      .filter((cell) => !isExcludedCell(cell, excludedCells))
      .map((cell) => ({ row: cell.row, col: cell.col, eaten: false }));
  }

  function collectDot(dots, pacmanCell) {
    const dot = dots.find((candidate) => {
      return !candidate.eaten && candidate.row === pacmanCell.row && candidate.col === pacmanCell.col;
    });

    if (!dot) {
      return null;
    }

    dot.eaten = true;
    return dot;
  }

  function getRemainingDots(dots) {
    return dots.filter((dot) => !dot.eaten).length;
  }

  function isLevelWon(dots) {
    return dots.length > 0 && getRemainingDots(dots) === 0;
  }

  function addDotScore(score) {
    return score + DOT_SCORE;
  }

  function updatePowerModeTime(timeRemaining, delta) {
    return Math.max(0, timeRemaining - delta);
  }

  function isPowerModeActive(timeRemaining) {
    return timeRemaining > 0;
  }

  function chooseGhostDirection(ghost, pacmanCell, isVulnerable) {
    const openDirections = [DIRECTIONS.up, DIRECTIONS.left, DIRECTIONS.down, DIRECTIONS.right]
      .filter((direction) => canMove(ghost.gridPosition, direction));

    if (openDirections.length === 0) {
      return DIRECTIONS.none;
    }

    const forwardChoices = openDirections.filter((direction) => !isOppositeDirection(direction, ghost.movementDirection));
    const choices = forwardChoices.length > 0 ? forwardChoices : openDirections;
    const rankedChoices = choices
      .map((direction) => {
        const nextCell = getNextCell(ghost.gridPosition, direction);
        return {
          direction,
          distance: getGridDistance(nextCell, pacmanCell)
        };
      })
      .sort((first, second) => first.distance - second.distance);

    if (isVulnerable) {
      return rankedChoices[rankedChoices.length - 1].direction;
    }

    return rankedChoices[0].direction;
  }

  function getGhostContactAction(ghosts, pacmanCell, powerModeActive) {
    const touchedGhost = ghosts.find((ghost) => {
      return ghost.isAlive && ghost.gridPosition.row === pacmanCell.row && ghost.gridPosition.col === pacmanCell.col;
    });

    if (!touchedGhost) {
      return { type: CONTACT_ACTIONS.none, ghost: null };
    }

    return {
      type: powerModeActive ? CONTACT_ACTIONS.kill : CONTACT_ACTIONS.caught,
      ghost: touchedGhost
    };
  }

  function isOppositeDirection(firstDirection, secondDirection) {
    return firstDirection.row + secondDirection.row === 0 && firstDirection.col + secondDirection.col === 0;
  }

  function getGridDistance(firstCell, secondCell) {
    return Math.abs(firstCell.row - secondCell.row) + Math.abs(firstCell.col - secondCell.col);
  }

  function isExcludedCell(cell, excludedCells) {
    return excludedCells.some((excludedCell) => {
      return excludedCell.row === cell.row && excludedCell.col === cell.col;
    });
  }

  return {
    POWER_MODE_DURATION,
    DOT_SCORE,
    CONTACT_ACTIONS,
    collectPowerPellet,
    createDotCells,
    collectDot,
    getRemainingDots,
    isLevelWon,
    addDotScore,
    updatePowerModeTime,
    isPowerModeActive,
    chooseGhostDirection,
    getGhostContactAction,
    isOppositeDirection,
    getGridDistance,
    isExcludedCell
  };
});
