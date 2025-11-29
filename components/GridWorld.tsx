import React from 'react';
import { GridConfig, QTable, Action } from '../types';
import { getKey } from '../services/rlEngine';
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Skull, Trophy } from 'lucide-react';

interface GridWorldProps {
  grid: GridConfig;
  agentPos: { x: number; y: number };
  qTable: QTable;
  showValues?: boolean;
}

const GridWorld: React.FC<GridWorldProps> = ({ grid, agentPos, qTable, showValues = true }) => {
  const isCompact = grid.cols <= 4;

  // Dynamic Sizing Classes
  const cellClasses = isCompact 
    ? "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32" // Very Large for 4x4
    : "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20"; // Larger for 6x6
  
  const iconSize = isCompact ? "w-8 h-8 md:w-10 md:h-10" : "w-5 h-5 md:w-6 md:h-6";
  const agentSize = isCompact ? "w-16 h-16 md:w-20 md:h-20" : "w-8 h-8 md:w-12 md:h-12";
  
  const textSizeBase = isCompact ? "text-xs md:text-sm" : "text-[8px] sm:text-[10px]";
  const textSizeVal = isCompact ? "text-sm md:text-base" : "text-[9px] sm:text-xs";

  const getCellColor = (x: number, y: number) => {
    // Check static types first
    if (grid.start.x === x && grid.start.y === y) return 'bg-emerald-900/40 border-emerald-500';
    if (grid.goal.x === x && grid.goal.y === y) return 'bg-yellow-900/40 border-yellow-500';
    if (grid.walls.some(w => w.x === x && w.y === y)) return 'bg-slate-700 border-slate-600';
    if (grid.pits.some(p => p.x === x && p.y === y)) return 'bg-red-900/40 border-red-500';

    // Q-Value coloring
    const key = getKey(x, y);
    const qs = qTable[key] || [0, 0, 0, 0];
    const maxQ = Math.max(...qs);
    
    // Normalize color intensity based on Max Q
    if (maxQ > 0) {
      return `bg-blue-600`; 
    } else if (maxQ < 0) {
      return `bg-red-600`;
    }
    
    return 'bg-slate-800 border-slate-700';
  };

  const getOpacity = (x: number, y: number) => {
      const key = getKey(x, y);
      const qs = qTable[key] || [0,0,0,0];
      const maxQ = Math.max(...qs);
      
      if (grid.walls.some(w => w.x === x && w.y === y)) return 1;

      // Absolute intensity
      const val = Math.abs(maxQ);
      // Logarithmic scaling for better visualization of small differences
      const intensity = Math.min(val / 50, 0.8) + 0.1; 
      return intensity;
  }

  const renderArrow = (x: number, y: number) => {
    if (grid.walls.some(w => w.x === x && w.y === y)) return null;
    if (grid.goal.x === x && grid.goal.y === y) return <Trophy className={`${iconSize} text-yellow-400`} />;
    if (grid.pits.some(p => p.x === x && p.y === y)) return <Skull className={`${iconSize} text-red-400`} />;

    const key = getKey(x, y);
    const qs = qTable[key] || [0,0,0,0];
    const maxQ = Math.max(...qs);

    // Don't show arrows if values are basically zero (unexplored)
    if (Math.abs(maxQ) < 0.01) return null;

    const bestAction = qs.indexOf(maxQ);

    switch (bestAction) {
      case Action.UP: return <ArrowUp className={`${iconSize} text-white/80`} />;
      case Action.RIGHT: return <ArrowRight className={`${iconSize} text-white/80`} />;
      case Action.DOWN: return <ArrowDown className={`${iconSize} text-white/80`} />;
      case Action.LEFT: return <ArrowLeft className={`${iconSize} text-white/80`} />;
      default: return null;
    }
  };

  return (
    <div 
      className="grid gap-2 p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl relative"
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
        width: 'fit-content',
        margin: '0 auto'
      }}
    >
      {Array.from({ length: grid.rows * grid.cols }).map((_, i) => {
        const x = i % grid.cols;
        const y = Math.floor(i / grid.cols);
        const isAgent = agentPos.x === x && agentPos.y === y;
        const baseClass = getCellColor(x, y);
        const opacity = getOpacity(x,y);

        // Check special cells
        const isWall = grid.walls.some(w => w.x === x && w.y === y);
        const isPit = grid.pits.some(p => p.x === x && p.y === y);
        const isGoal = grid.goal.x === x && grid.goal.y === y;

        // Dynamic style for heatmap
        const style = (!isWall && !isGoal && !isPit) ? {
            backgroundColor: baseClass.includes('bg-blue') ? `rgba(37, 99, 235, ${opacity})` : `rgba(220, 38, 38, ${opacity})`
        } : {};

        // Reward Value Display
        let rewardVal = -1;
        let rewardColor = 'text-slate-400';
        if (isGoal) { rewardVal = 100; rewardColor = 'text-yellow-400 font-bold'; }
        else if (isPit) { rewardVal = -50; rewardColor = 'text-red-400 font-bold'; }
        
        return (
          <div
            key={`${x}-${y}`}
            className={`
              ${cellClasses} flex items-center justify-center rounded-lg border 
              ${baseClass.includes('rgba') ? '' : baseClass} 
              transition-all duration-200 relative
            `}
            style={style}
          >
            {/* Reward Label (Top Left) */}
            {!isWall && (
                <div className="absolute top-1 left-1.5 z-10 pointer-events-none">
                    <div className="flex items-center gap-0.5 shadow-sm bg-slate-900/30 rounded px-1 backdrop-blur-[1px]">
                        <span className={`${textSizeBase} text-slate-300 font-mono`}>R:</span>
                        <span className={`${textSizeVal} font-mono leading-none ${rewardColor}`}>
                            {rewardVal}
                        </span>
                    </div>
                </div>
            )}

            {/* Cell Content (Arrows/Icons) */}
            <div className="z-10 pointer-events-none">
              {renderArrow(x, y)}
            </div>

            {/* Agent Overlay */}
            {isAgent && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className={`${agentSize} bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)] border-4 border-white animate-pulse`} />
              </div>
            )}
            
            {/* Max Q Value (Bottom Right) */}
             {showValues && !isWall && (
               <div className="absolute bottom-1 right-1.5 z-20 pointer-events-none">
                   <div className="flex items-center gap-0.5 justify-end bg-slate-900/30 rounded px-1 backdrop-blur-[1px]">
                       <span className={`${textSizeBase} text-slate-300 font-mono`}>Q:</span>
                       <span className={`${textSizeVal} text-white font-mono leading-none drop-shadow-md font-bold`}>
                          {Math.round(Math.max(...(qTable[getKey(x,y)] || [0])))}
                       </span>
                   </div>
               </div>
             )}
          </div>
        );
      })}
    </div>
  );
};

export default GridWorld;