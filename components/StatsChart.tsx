import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrainingStats } from '../types';

interface StatsChartProps {
  data: TrainingStats[];
}

const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">Total Reward per Episode</h3>
      <div className="h-full w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                    dataKey="episode" 
                    stroke="#94a3b8" 
                    fontSize={12}
                    label={{ value: 'Episode', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }} 
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                    itemStyle={{ color: '#818cf8' }}
                />
                <Line 
                    type="monotone" 
                    dataKey="totalReward" 
                    stroke="#818cf8" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false} // Disable animation for real-time performance
                />
            </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;