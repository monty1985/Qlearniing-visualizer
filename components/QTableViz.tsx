import React from 'react';
import { GridConfig, QTable } from '../types';
import { getKey } from '../services/rlEngine';

interface QTableVizProps {
  grid: GridConfig;
  qTable: QTable;
  agentPos: { x: number; y: number };
}

const QTableViz: React.FC<QTableVizProps> = ({ grid, qTable, agentPos }) => {
  const getIntensityColor = (val: number) => {
    if (val === 0) return 'text-slate-600';
    if (val > 0) return 'text-emerald-400 font-bold';
    return 'text-red-400';
  };

  const rows = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      rows.push({ x, y });
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="p-4 border-b border-slate-700 bg-slate-800 sticky top-0 z-10 shrink-0">
        <h3 className="font-bold text-white">Q-Table Values</h3>
        <p className="text-xs text-slate-400">Values for State (x,y) → Action</p>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead className="bg-slate-900 text-slate-400 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="p-2 md:p-3 font-medium whitespace-nowrap">State</th>
                    <th className="p-2 md:p-3 font-medium text-center">↑ Up</th>
                    <th className="p-2 md:p-3 font-medium text-center">→ Right</th>
                    <th className="p-2 md:p-3 font-medium text-center">↓ Down</th>
                    <th className="p-2 md:p-3 font-medium text-center">← Left</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
                {rows.map(({x, y}) => {
                    const key = getKey(x, y);
                    const values = qTable[key] || [0, 0, 0, 0];
                    const isCurrent = agentPos.x === x && agentPos.y === y;
                    const isWall = grid.walls.some(w => w.x === x && w.y === y);
                    const isPit = grid.pits.some(p => p.x === x && p.y === y);
                    const isGoal = grid.goal.x === x && grid.goal.y === y;
                    
                    let rowBg = 'hover:bg-slate-700/50';
                    if (isCurrent) rowBg = 'bg-indigo-900/40 border-l-4 border-indigo-500';
                    else if (isWall) rowBg = 'bg-slate-800 opacity-50';
                    else if (isGoal) rowBg = 'bg-yellow-900/10';
                    else if (isPit) rowBg = 'bg-red-900/10';

                    return (
                        <tr key={key} className={`transition-colors ${rowBg}`}>
                            <td className="p-2 md:p-3 font-mono text-slate-400 border-r border-slate-700/50 whitespace-nowrap">
                                {isWall ? 'WALL' : isGoal ? 'GOAL' : isPit ? 'PIT' : `(${x},${y})`}
                            </td>
                            {values.map((v, idx) => (
                                <td key={idx} className={`p-2 md:p-3 font-mono text-center ${getIntensityColor(v)}`}>
                                    {isWall ? '-' : v.toFixed(2)}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default QTableViz;
