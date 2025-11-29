import React, { useState, useEffect, useCallback, useRef } from 'react';
import GridWorld from './components/GridWorld';
import Controls from './components/Controls';
import StatsChart from './components/StatsChart';
import AiTutor from './components/AiTutor';
import StepInsight from './components/StepInsight';
import QTableViz from './components/QTableViz';
import { AgentParams, GridConfig, QTable, Model, TrainingStats, StepDetails } from './types';
import { initializeQTable, performStep } from './services/rlEngine';
import { INITIAL_GRID, LARGE_GRID } from './constants';
import { LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [grid, setGrid] = useState<GridConfig>(INITIAL_GRID);
  const [qTable, setQTable] = useState<QTable>(() => initializeQTable(INITIAL_GRID.rows, INITIAL_GRID.cols));
  const [model, setModel] = useState<Model>({});
  
  const [agentPos, setAgentPos] = useState(INITIAL_GRID.start);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEpisodeFinished, setIsEpisodeFinished] = useState(false);
  const [lastStepDetails, setLastStepDetails] = useState<StepDetails | null>(null);
  
  // Params
  const [params, setParams] = useState<AgentParams>({
    alpha: 0.1,
    gamma: 0.9,
    epsilon: 0.1,
    episodes: 0,
    planningSteps: 0, // 0 for Q-learning, >0 for Dyna-Q
  });
  
  const [mode, setMode] = useState<'Model-Free' | 'Model-Based'>('Model-Free');
  const [speed, setSpeed] = useState(200); // ms delay

  // Stats
  const [stats, setStats] = useState<TrainingStats[]>([]);
  const [currentEpisodeReward, setCurrentEpisodeReward] = useState(0);
  const [currentEpisodeSteps, setCurrentEpisodeSteps] = useState(0);

  // Refs for loop management to avoid stale closures
  const paramsRef = useRef(params);
  const gridRef = useRef(grid);
  const qTableRef = useRef(qTable);
  const modelRef = useRef(model);
  const agentPosRef = useRef(agentPos);
  const statsRef = useRef(stats);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Keep refs synced
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { qTableRef.current = qTable; }, [qTable]);
  useEffect(() => { modelRef.current = model; }, [model]);
  useEffect(() => { agentPosRef.current = agentPos; }, [agentPos]);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  // Update planning steps when mode changes
  useEffect(() => {
    setParams(p => ({
        ...p,
        planningSteps: mode === 'Model-Based' ? 20 : 0
    }));
  }, [mode]);

  // --- Logic ---

  const resetSimulation = (newGrid?: GridConfig) => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const g = newGrid || grid;
    setQTable(initializeQTable(g.rows, g.cols));
    setModel({});
    setAgentPos(g.start);
    setStats([]);
    setParams(p => ({ ...p, episodes: 0 }));
    setCurrentEpisodeReward(0);
    setCurrentEpisodeSteps(0);
    setIsEpisodeFinished(false);
    setLastStepDetails(null);
  };

  const toggleGrid = () => {
      const newGrid = grid.rows === 4 ? LARGE_GRID : INITIAL_GRID;
      setGrid(newGrid);
      resetSimulation(newGrid);
  };

  const startNextEpisode = () => {
    setAgentPos(grid.start);
    setIsEpisodeFinished(false);
    setCurrentEpisodeReward(0);
    setCurrentEpisodeSteps(0);
    setLastStepDetails(null);
  };

  const step = useCallback(() => {
    // If episode is finished, the next "step" command starts a new episode
    if (isEpisodeFinished) {
      startNextEpisode();
      return;
    }

    const currentQ = qTableRef.current;
    const currentModel = modelRef.current;
    const currentPos = agentPosRef.current;
    const p = paramsRef.current;
    const g = gridRef.current;

    const result = performStep(
      currentPos, 
      currentQ, 
      currentModel, 
      g, 
      { alpha: p.alpha, gamma: p.gamma, planningSteps: p.planningSteps, epsilon: p.epsilon }
    );

    setQTable(result.updatedQTable);
    setModel(result.updatedModel);
    setLastStepDetails(result.stepDetails);
    
    // Accumulate reward/steps for the current episode
    const newTotalReward = currentEpisodeReward + result.reward;
    const newTotalSteps = currentEpisodeSteps + 1;
    setCurrentEpisodeReward(newTotalReward);
    setCurrentEpisodeSteps(newTotalSteps);

    if (result.isTerminal) {
      // Episode Finished: Update stats and pause
      const newStat: TrainingStats = {
        episode: p.episodes + 1,
        totalReward: newTotalReward,
        steps: newTotalSteps
      };

      setStats(prev => {
          const newStats = [...prev, newStat];
          if (newStats.length > 100) return newStats.slice(newStats.length - 100);
          return newStats;
      });

      // Increment completed episodes count
      setParams(prev => ({ ...prev, episodes: prev.episodes + 1 }));
      
      // Mark as finished but DO NOT reset position yet
      setIsEpisodeFinished(true);
      
      // Note: We leave agentPos at result.nextState (the terminal state)
      setAgentPos(result.nextState);
    } else {
      // Continue episode
      setAgentPos(result.nextState);
    }
  }, [isEpisodeFinished, currentEpisodeReward, currentEpisodeSteps]);

  // Fast forward to end of episode
  const finishEpisode = () => {
    // If currently playing, stop auto-play to prevent conflicts
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    let currentQ = qTableRef.current;
    let currentModel = modelRef.current;
    let currentPos = agentPosRef.current;
    const p = paramsRef.current;
    const g = gridRef.current;

    // If already finished, start next first
    if (isEpisodeFinished) {
        currentPos = g.start;
        setCurrentEpisodeReward(0);
        setCurrentEpisodeSteps(0);
        setIsEpisodeFinished(false);
    }

    let loopReward = currentEpisodeReward;
    let loopSteps = currentEpisodeSteps;
    let maxSteps = 1000; // Safety break
    let lastDetails = null;
    let isTerm = false;

    // Run synchronous loop
    while (!isTerm && maxSteps > 0) {
        const result = performStep(
            currentPos, currentQ, currentModel, g,
            { alpha: p.alpha, gamma: p.gamma, planningSteps: p.planningSteps, epsilon: p.epsilon }
        );
        
        currentQ = result.updatedQTable;
        currentModel = result.updatedModel;
        currentPos = result.nextState;
        loopReward += result.reward;
        loopSteps++;
        lastDetails = result.stepDetails;
        isTerm = result.isTerminal;
        maxSteps--;
    }

    // Batch update state
    setQTable(currentQ);
    setModel(currentModel);
    setAgentPos(currentPos);
    setCurrentEpisodeReward(loopReward);
    setCurrentEpisodeSteps(loopSteps);
    setLastStepDetails(lastDetails);

    if (isTerm) {
         const newStat: TrainingStats = {
            episode: p.episodes + 1,
            totalReward: loopReward,
            steps: loopSteps
         };
         setStats(prev => {
             const newStats = [...prev, newStat];
             if (newStats.length > 100) return newStats.slice(newStats.length - 100);
             return newStats;
         });
         setParams(prev => ({ ...prev, episodes: prev.episodes + 1 }));
         setIsEpisodeFinished(true);
    }
  };

  // --- Loop Control ---
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(step, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, step]);

  // --- Context for Tutor ---
  const getTutorContext = () => {
    return `
      Mode: ${mode}
      Episode: ${params.episodes}
      Status: ${isEpisodeFinished ? 'Episode Finished (At Terminal State)' : 'Exploring'}
      Epsilon: ${params.epsilon}
      Last Reward: ${stats.length > 0 ? stats[stats.length - 1].totalReward : 'N/A'}
      Agent Pos: (${agentPos.x}, ${agentPos.y})
      Grid Name: ${grid.name}
      Last Action: ${lastStepDetails ? JSON.stringify(lastStepDetails.action) : 'None'}
      Last Math: ${lastStepDetails ? lastStepDetails.calculation : 'None'}
    `;
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <header className="shrink-0 p-4 md:p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-3">
            <LayoutDashboard /> Q-Learning Visualizer
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
                Interactive Reinforcement Learning Playground
            </p>
        </div>
        
        <div className="flex gap-4 items-center bg-slate-900 p-2 rounded-lg border border-slate-700 shadow-lg">
           <div className="text-center px-4 border-r border-slate-700">
             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Episode</div>
             <div className="text-lg font-mono text-white">{params.episodes}</div>
           </div>
           <div className="text-center px-2">
             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Avg Reward</div>
             <div className="text-lg font-mono text-emerald-400">
                {stats.length > 0 
                  ? (stats.slice(-10).reduce((a, b) => a + b.totalReward, 0) / Math.min(stats.length, 10)).toFixed(1)
                  : '0.0'}
             </div>
           </div>
        </div>
      </header>

      {/* Main Layout - Dashboard Style */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column: Visualization & Stats */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:h-full lg:overflow-hidden">
            <div className="flex-1 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl flex justify-center items-center min-h-[350px] relative overflow-auto">
                 <GridWorld grid={grid} agentPos={agentPos} qTable={qTable} />
            </div>
            
            <div className="shrink-0 h-64">
               <StatsChart data={stats} />
            </div>
        </div>

        {/* Middle Column: Q-Table & Math (Scrollable QTable, Fixed Insight) */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full lg:overflow-hidden">
             <div className="flex-1 min-h-[200px] overflow-hidden rounded-xl border border-slate-700 bg-slate-800 flex flex-col">
                <QTableViz grid={grid} qTable={qTable} agentPos={agentPos} />
             </div>
             <div className="shrink-0 h-[400px]">
                <StepInsight details={lastStepDetails} isEpisodeFinished={isEpisodeFinished} />
             </div>
        </div>

        {/* Right Column: Controls & Tutor (Fixed Controls, Scrollable Tutor) */}
        <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:overflow-hidden">
            <div className="shrink-0">
                <Controls 
                    params={params} 
                    setParams={setParams} 
                    isPlaying={isPlaying} 
                    onPlayPause={() => setIsPlaying(!isPlaying)}
                    onStep={step}
                    onFinishEpisode={finishEpisode}
                    isEpisodeFinished={isEpisodeFinished}
                    onReset={() => resetSimulation()}
                    speed={speed}
                    setSpeed={setSpeed}
                    mode={mode}
                    setMode={setMode}
                    gridSizeName={grid.name}
                    onToggleGrid={toggleGrid}
                />
            </div>
            
            <div className="flex-1 min-h-[300px] overflow-hidden rounded-xl border border-indigo-500/30 shadow-2xl">
                <AiTutor contextData={getTutorContext()} />
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;