import React from 'react';
import { AgentParams } from '../types';
import { Play, Pause, RotateCcw, StepForward, Grid3X3, Grid2X2, FastForward, RotateCw } from 'lucide-react';

interface ControlsProps {
  params: AgentParams;
  setParams: (p: AgentParams) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onFinishEpisode: () => void;
  isEpisodeFinished: boolean;
  onReset: () => void;
  speed: number;
  setSpeed: (s: number) => void;
  mode: 'Model-Free' | 'Model-Based';
  setMode: (m: 'Model-Free' | 'Model-Based') => void;
  gridSizeName: string;
  onToggleGrid: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  params,
  setParams,
  isPlaying,
  onPlayPause,
  onStep,
  onFinishEpisode,
  isEpisodeFinished,
  onReset,
  speed,
  setSpeed,
  mode,
  setMode,
  gridSizeName,
  onToggleGrid
}) => {
  const handleChange = (key: keyof AgentParams, value: number) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Controls</h2>
        <div className="flex gap-2">
            <button 
                onClick={onToggleGrid}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                title="Switch Grid Size"
            >
                {gridSizeName.includes('Small') ? <Grid2X2 size={20} /> : <Grid3X3 size={20} />}
            </button>
            <button 
                onClick={onReset}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                title="Reset Training"
            >
                <RotateCcw size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
           <button 
                onClick={onStep}
                disabled={isPlaying}
                className={`col-span-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${isEpisodeFinished ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
                {isEpisodeFinished ? (
                   <><RotateCw size={18} /> Next Episode</>
                ) : (
                   <><StepForward size={18} /> Next Step</>
                )}
            </button>
            <button 
                onClick={onFinishEpisode}
                disabled={isPlaying || isEpisodeFinished}
                className="col-span-1 flex items-center justify-center gap-2 px-3 py-3 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all shadow-lg active:scale-95 text-sm"
            >
                <FastForward size={18} /> Finish Ep
            </button>
            <button 
                onClick={onPlayPause}
                className={`col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95 text-white ${isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
                {isPlaying ? <><Pause size={20} /> Pause Auto Run</> : <><Play size={20} /> Auto Run</>}
            </button>
      </div>

      {/* Mode Selection */}
      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
        <label className="text-sm font-medium text-slate-400 block mb-2">Learning Strategy</label>
        <div className="flex gap-2">
            <button 
                onClick={() => setMode('Model-Free')}
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === 'Model-Free' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
                Q-Learning
            </button>
            <button 
                onClick={() => setMode('Model-Based')}
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === 'Model-Based' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
                Dyna-Q
            </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Simulation Speed</span>
                <span className="text-indigo-400 font-mono">{speed}ms</span>
            </div>
            <input 
                type="range" min="10" max="1000" step="10" 
                value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-700 rounded-lg appearance-none h-2 cursor-pointer"
            />
        </div>

        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Learning Rate (α)</span>
                <span className="text-indigo-400 font-mono">{params.alpha}</span>
            </div>
            <input 
                type="range" min="0.01" max="1" step="0.01" 
                value={params.alpha} onChange={(e) => handleChange('alpha', Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-700 rounded-lg appearance-none h-2 cursor-pointer"
            />
        </div>

        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Discount Factor (γ)</span>
                <span className="text-indigo-400 font-mono">{params.gamma}</span>
            </div>
            <input 
                type="range" min="0.1" max="0.99" step="0.01" 
                value={params.gamma} onChange={(e) => handleChange('gamma', Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-700 rounded-lg appearance-none h-2 cursor-pointer"
            />
        </div>

        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Exploration (ε)</span>
                <span className="text-indigo-400 font-mono">{params.epsilon.toFixed(2)}</span>
            </div>
            <input 
                type="range" min="0" max="1" step="0.05" 
                value={params.epsilon} onChange={(e) => handleChange('epsilon', Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-700 rounded-lg appearance-none h-2 cursor-pointer"
            />
        </div>

        {mode === 'Model-Based' && (
             <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Planning Steps (N)</span>
                    <span className="text-indigo-400 font-mono">{params.planningSteps}</span>
                </div>
                <input 
                    type="range" min="0" max="50" step="1" 
                    value={params.planningSteps} onChange={(e) => handleChange('planningSteps', Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-700 rounded-lg appearance-none h-2 cursor-pointer"
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default Controls;