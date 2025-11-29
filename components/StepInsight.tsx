import React from 'react';
import { StepDetails, Action } from '../types';
import { ArrowRight, Calculator, MessageSquareQuote, CheckCircle, Flag } from 'lucide-react';

interface StepInsightProps {
  details: StepDetails | null;
  isEpisodeFinished?: boolean;
}

const StepInsight: React.FC<StepInsightProps> = ({ details, isEpisodeFinished }) => {
  if (!details && !isEpisodeFinished) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full flex flex-col items-center justify-center text-slate-500">
        <Calculator className="w-12 h-12 mb-2 opacity-50" />
        <p className="text-center">Start the simulation or click "Next Step"<br/>to see how Q-Values are updated.</p>
      </div>
    );
  }

  const actionLabels = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
  const actionName = details ? actionLabels[details.action] : '';

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 h-full overflow-y-auto custom-scrollbar relative">
      
      {/* Episode Finished Overlay/Banner */}
      {isEpisodeFinished && (
         <div className="bg-emerald-900/50 border border-emerald-500/50 rounded-lg p-3 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-emerald-400 w-6 h-6" />
            <div>
                <h3 className="font-bold text-emerald-100">Episode Complete!</h3>
                <p className="text-xs text-emerald-300">Agent reached a terminal state.</p>
            </div>
         </div>
      )}

      {details && (
      <>
      <div className="flex items-center justify-between shrink-0">
         <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="text-indigo-400 w-5 h-5"/>
            Step Insight
         </h3>
         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${details.method === 'Exploration' ? 'bg-purple-900 text-purple-200 border border-purple-500' : 'bg-emerald-900 text-emerald-200 border border-emerald-500'}`}>
            {details.method}
         </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm shrink-0">
        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
            <div className="text-slate-400 text-xs">State</div>
            <div className="font-mono text-white">({details.state.x}, {details.state.y})</div>
        </div>
        <div className="bg-slate-900/50 p-2 rounded border border-slate-700 flex flex-col items-center">
            <div className="text-slate-400 text-xs">Action</div>
            <div className="font-bold text-indigo-400">{actionName}</div>
        </div>
        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
            <div className="text-slate-400 text-xs">Reward</div>
            <div className={`font-mono font-bold ${details.reward > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {details.reward}
            </div>
        </div>
      </div>

      {/* Reasoning Box */}
      <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30 shrink-0">
        <div className="flex items-center gap-2 mb-2">
            <MessageSquareQuote className="text-indigo-400 w-4 h-4" />
            <h4 className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Agent's Reasoning</h4>
        </div>
        <p className="text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap font-medium">
            {details.reasoning}
        </p>
      </div>

      {/* Math Box */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 shrink-0">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Q-Learning Update Formula</h4>
        <div className="text-xs font-mono text-slate-500 mb-2">
           Q(s,a) ← Q(s,a) + α[R + γ·maxQ(s') - Q(s,a)]
        </div>
        <div className="text-sm font-mono text-white break-all mb-3 bg-slate-950 p-2 rounded border border-slate-800">
           {details.calculation}
        </div>
        <div className="flex items-center gap-4 justify-center">
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase">Old Q</span>
                <span className="font-mono text-slate-300">{details.oldQ.toFixed(2)}</span>
             </div>
             <ArrowRight className="text-slate-600" size={16}/>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase">New Q</span>
                <span className="font-mono font-bold text-indigo-400 text-lg">{details.newQ.toFixed(2)}</span>
             </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default StepInsight;