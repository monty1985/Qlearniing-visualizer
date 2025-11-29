import { GridConfig } from './types';

export const INITIAL_GRID: GridConfig = {
  name: 'Small (4x4)',
  rows: 4,
  cols: 4,
  start: { x: 0, y: 0 },
  goal: { x: 3, y: 3 },
  walls: [
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  pits: [
    { x: 2, y: 2 }
  ]
};

export const LARGE_GRID: GridConfig = {
  name: 'Standard (6x6)',
  rows: 6,
  cols: 6,
  start: { x: 0, y: 0 },
  goal: { x: 5, y: 5 },
  walls: [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 1, y: 4 },
  ],
  pits: [
    { x: 4, y: 1 },
    { x: 2, y: 3 },
    { x: 0, y: 5 },
  ]
};
