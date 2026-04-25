const assert = require('assert/strict');
const {
  DIRECTIONS
} = require('./mazeRules');
const {
  POWER_MODE_DURATION,
  CONTACT_ACTIONS,
  collectPowerPellet,
  updatePowerModeTime,
  isPowerModeActive,
  chooseGhostDirection,
  getGhostContactAction,
  isOppositeDirection,
  getGridDistance
} = require('./gameRules');

const tests = [];

function test(name, testFunction) {
  tests.push({ name, testFunction });
}

function run() {
  tests.forEach(({ name, testFunction }) => {
    testFunction();
    console.log(`PASS ${name}`);
  });

  console.log(`\n${tests.length} tests passed`);
}

test('power mode starts at 10 seconds and counts down without going negative', () => {
  assert.equal(POWER_MODE_DURATION, 10000);
  assert.equal(updatePowerModeTime(POWER_MODE_DURATION, 2500), 7500);
  assert.equal(updatePowerModeTime(1000, 1500), 0);
});

test('power mode is active only while time remains', () => {
  assert.equal(isPowerModeActive(1), true);
  assert.equal(isPowerModeActive(0), false);
});

test('Pacman collects only uneaten power pellets at his current cell', () => {
  const pellets = [
    { row: 0, col: 1, eaten: false },
    { row: 4, col: 4, eaten: false },
    { row: 9, col: 8, eaten: true }
  ];

  const collectedPellet = collectPowerPellet(pellets, { row: 4, col: 4 });
  assert.equal(collectedPellet, pellets[1]);
  assert.equal(pellets[1].eaten, true);
  assert.equal(collectPowerPellet(pellets, { row: 9, col: 8 }), null);
  assert.equal(collectPowerPellet(pellets, { row: 3, col: 3 }), null);
});

test('normal ghosts choose an open direction that moves closer to Pacman', () => {
  const ghost = {
    gridPosition: { row: 5, col: 5 },
    movementDirection: DIRECTIONS.none
  };

  assert.equal(chooseGhostDirection(ghost, { row: 5, col: 3 }, false), DIRECTIONS.left);
});

test('vulnerable ghosts choose an open direction that moves away from Pacman', () => {
  const ghost = {
    gridPosition: { row: 5, col: 5 },
    movementDirection: DIRECTIONS.none
  };

  assert.equal(chooseGhostDirection(ghost, { row: 5, col: 3 }, true), DIRECTIONS.down);
});

test('ghosts avoid immediate reversal when another chase choice is available', () => {
  const ghost = {
    gridPosition: { row: 5, col: 5 },
    movementDirection: DIRECTIONS.right
  };

  assert.notEqual(chooseGhostDirection(ghost, { row: 5, col: 3 }, false), DIRECTIONS.left);
});

test('ghost contact catches Pacman outside power mode', () => {
  const ghosts = [
    { isAlive: true, gridPosition: { row: 2, col: 2 } }
  ];
  const action = getGhostContactAction(ghosts, { row: 2, col: 2 }, false);

  assert.equal(action.type, CONTACT_ACTIONS.caught);
  assert.equal(action.ghost, ghosts[0]);
});

test('ghost contact kills the ghost during power mode', () => {
  const ghosts = [
    { isAlive: true, gridPosition: { row: 2, col: 2 } }
  ];
  const action = getGhostContactAction(ghosts, { row: 2, col: 2 }, true);

  assert.equal(action.type, CONTACT_ACTIONS.kill);
  assert.equal(action.ghost, ghosts[0]);
});

test('dead ghosts and empty cells do not trigger contact actions', () => {
  const ghosts = [
    { isAlive: false, gridPosition: { row: 2, col: 2 } },
    { isAlive: true, gridPosition: { row: 3, col: 3 } }
  ];

  assert.deepEqual(getGhostContactAction(ghosts, { row: 2, col: 2 }, true), {
    type: CONTACT_ACTIONS.none,
    ghost: null
  });
});

test('grid helpers support deterministic ghost decisions', () => {
  assert.equal(isOppositeDirection(DIRECTIONS.left, DIRECTIONS.right), true);
  assert.equal(isOppositeDirection(DIRECTIONS.up, DIRECTIONS.left), false);
  assert.equal(getGridDistance({ row: 1, col: 1 }, { row: 4, col: 5 }), 7);
});

run();
