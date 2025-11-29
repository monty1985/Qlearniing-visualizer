export enum CellType {
  EMPTY = 'EMPTY',
  START = 'START',
  GOAL = 'GOAL',
  WALL = 'WALL',
  PIT = 'PIT',
}

export enum Action {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export interface GridConfig {
  name: string;
  rows: number;
  cols: number;
  start: { x: number; y: number };
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
  pits: { x: number; y: number }[];
}

export interface AgentParams {
  alpha: number; // Learning rate
  gamma: number; // Discount factor
  epsilon: number; // Exploration rate
  episodes: number;
  planningSteps: number; // For Dyna-Q (Model-based)
}

export interface QTable {
  [key: string]: number[]; // Key is "x,y", value is array of 4 numbers (Q-values for actions)
}

export interface Model {
  [key: string]: { // Key is "x,y,action"
    reward: number;
    nextState: { x: number; y: number };
  };
}

export interface TrainingStats {
  episode: number;
  totalReward: number;
  steps: number;
}

export interface StepDetails {
  state: { x: number; y: number };
  action: Action;
  nextState: { x: number; y: number };
  reward: number;
  oldQ: number;
  newQ: number;
  maxNextQ: number;
  method: 'Exploration' | 'Exploitation';
  calculation: string;
  reasoning: string;
}