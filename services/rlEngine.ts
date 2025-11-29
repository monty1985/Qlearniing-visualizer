import { Action, GridConfig, QTable, Model, StepDetails } from '../types';

export const DIRECTIONS = [
  { x: 0, y: -1 }, // UP
  { x: 1, y: 0 },  // RIGHT
  { x: 0, y: 1 },  // DOWN
  { x: -1, y: 0 }, // LEFT
];

export const getKey = (x: number, y: number) => `${x},${y}`;

export const initializeQTable = (rows: number, cols: number): QTable => {
  const qTable: QTable = {};
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      qTable[getKey(x, y)] = [0, 0, 0, 0];
    }
  }
  return qTable;
};

export const getNextState = (
  x: number,
  y: number,
  action: Action,
  grid: GridConfig
): { x: number; y: number; hitWall: boolean } => {
  const dx = DIRECTIONS[action].x;
  const dy = DIRECTIONS[action].y;
  let nx = x + dx;
  let ny = y + dy;

  // Boundary checks
  if (nx < 0 || nx >= grid.cols || ny < 0 || ny >= grid.rows) {
    return { x, y, hitWall: true };
  }

  // Wall checks
  const isWall = grid.walls.some((w) => w.x === nx && w.y === ny);
  if (isWall) {
    return { x, y, hitWall: true };
  }

  return { x: nx, y: ny, hitWall: false };
};

export const getReward = (
  x: number,
  y: number,
  grid: GridConfig
): { reward: number; isTerminal: boolean } => {
  if (x === grid.goal.x && y === grid.goal.y) {
    return { reward: 100, isTerminal: true };
  }
  const isPit = grid.pits.some((p) => p.x === x && p.y === y);
  if (isPit) {
    return { reward: -50, isTerminal: true }; // Big penalty for pits
  }
  return { reward: -1, isTerminal: false }; // Step penalty to encourage shortest path
};

export const chooseAction = (
  x: number,
  y: number,
  qTable: QTable,
  epsilon: number
): { action: Action; method: 'Exploration' | 'Exploitation' } => {
  if (Math.random() < epsilon) {
    return { 
      action: Math.floor(Math.random() * 4) as Action,
      method: 'Exploration'
    };
  }

  const qs = qTable[getKey(x, y)];
  // Find max value
  const maxQ = Math.max(...qs);
  // Find all actions with that max value (break ties randomly)
  const bestActions: Action[] = [];
  qs.forEach((q, idx) => {
    if (q === maxQ) bestActions.push(idx as Action);
  });

  return { 
    action: bestActions[Math.floor(Math.random() * bestActions.length)],
    method: 'Exploitation'
  };
};

// Returns new QTable and Model
export const performStep = (
  currentState: { x: number; y: number },
  qTable: QTable,
  model: Model,
  grid: GridConfig,
  params: { alpha: number; gamma: number; planningSteps: number; epsilon: number }
): {
  nextState: { x: number; y: number };
  reward: number;
  isTerminal: boolean;
  updatedQTable: QTable;
  updatedModel: Model;
  actionTaken: Action;
  stepDetails: StepDetails;
} => {
  const { x, y } = currentState;
  const { alpha, gamma, planningSteps, epsilon } = params;

  // 1. Choose Action
  const { action, method } = chooseAction(x, y, qTable, epsilon);

  // 2. Take Action
  const { x: nx, y: ny } = getNextState(x, y, action, grid);
  const { reward, isTerminal } = getReward(nx, ny, grid);

  // 3. Update Q-Table (Direct RL)
  const currentKey = getKey(x, y);
  const nextKey = getKey(nx, ny);
  const currentQ = qTable[currentKey][action];
  const maxNextQ = Math.max(...qTable[nextKey]);

  // Q(s,a) = Q(s,a) + alpha * [R + gamma * maxQ(s',a') - Q(s,a)]
  const tdTarget = reward + gamma * maxNextQ;
  const tdError = tdTarget - currentQ;
  const newQ = currentQ + alpha * tdError;
  
  const newQTable = { ...qTable };
  newQTable[currentKey] = [...qTable[currentKey]];
  newQTable[currentKey][action] = newQ;

  // 4. Update Model (for Model-Based / Dyna-Q)
  const newModel = { ...model };
  const modelKey = `${x},${y},${action}`;
  newModel[modelKey] = { reward, nextState: { x: nx, y: ny } };

  // 5. Planning (Dyna-Q)
  if (planningSteps > 0) {
    const observedKeys = Object.keys(newModel);
    for (let i = 0; i < planningSteps; i++) {
      if (observedKeys.length === 0) break;
      
      const randomKey = observedKeys[Math.floor(Math.random() * observedKeys.length)];
      const [sx, sy, sa] = randomKey.split(',').map(Number);
      const { reward: r, nextState: ns } = newModel[randomKey];
      
      const sKey = getKey(sx, sy);
      const nsKey = getKey(ns.x, ns.y);
      
      const planQ = newQTable[sKey][sa];
      const planMaxNextQ = Math.max(...newQTable[nsKey]);
      
      newQTable[sKey][sa] = planQ + alpha * (r + gamma * planMaxNextQ - planQ);
    }
  }

  // --- Generate Reasoning String ---
  const actionNames = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
  const actionName = actionNames[action];
  const qValues = qTable[getKey(x, y)];
  
  let reasoning = "";
  if (method === 'Exploitation') {
     reasoning += `I am at state (${x}, ${y}). My current estimates for actions were: [UP:${qValues[0].toFixed(1)}, RIGHT:${qValues[1].toFixed(1)}, DOWN:${qValues[2].toFixed(1)}, LEFT:${qValues[3].toFixed(1)}]. `;
     reasoning += `I chose ${actionName} because it had the highest value (or tied for highest). `;
  } else {
     reasoning += `I am at state (${x}, ${y}). I decided to Explore (random choice due to Epsilon ${epsilon}). `;
     reasoning += `I picked ${actionName} randomly, ignoring my current Q-values. `;
  }

  reasoning += `\n\nResult: I moved to (${nx}, ${ny}) and received a reward of ${reward}. `;
  
  if (isTerminal) {
      reasoning += `This is a terminal state (Goal or Pit). The episode ends here.`;
  } else {
      reasoning += `Looking ahead from the new state (${nx}, ${ny}), the best action has a value of ${maxNextQ.toFixed(2)}. `;
      reasoning += `I used this "max next Q" to update my previous estimate.`;
  }


  return {
    nextState: { x: nx, y: ny },
    reward,
    isTerminal,
    updatedQTable: newQTable,
    updatedModel: newModel,
    actionTaken: action,
    stepDetails: {
      state: { x, y },
      action,
      nextState: { x: nx, y: ny },
      reward,
      oldQ: currentQ,
      newQ,
      maxNextQ,
      method,
      calculation: `Q = ${currentQ.toFixed(2)} + ${alpha} [${reward} + ${gamma} * ${maxNextQ.toFixed(2)} - ${currentQ.toFixed(2)}]`,
      reasoning
    }
  };
};