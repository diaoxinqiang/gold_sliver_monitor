import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MarketData, Timeframe } from '../types';

interface RatioChartProps {
  data: MarketData[];
  timeframe: Timeframe;
}

const RatioChart: React.FC<RatioChartProps> = ({ data, timeframe }) => {
  const chartData = data.map(d => {
    const date = new Date(d.timestamp);
    let label = '';
    if (timeframe === '1H') {
      // For hourly, show Month-Day Hour:Minute
      label = date.toLocaleTimeString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      // For daily, show Year-Month-Day
      label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    return {
      rawTime: d.timestamp,
      time: label,
      ratio: parseFloat(d.ratio.toFixed(2)),
      gold: d.goldPrice,
      silver: d.silverPrice
    };
  });

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
        Waiting for data points...
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-200 text-lg font-semibold">Live Ratio Trend</h3>
        <span className="text-xs text-slate-500 font-mono">
           {timeframe === '1H' ? 'Hourly Data' : 'Daily Average'}
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              tick={{ fontSize: 10 }}
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#94a3b8" 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              itemStyle={{ color: '#fbbf24' }}
              labelStyle={{ color: '#94a3b8' }}
              labelFormatter={(label) => <span className="font-semibold text-indigo-300">{label}</span>}
              formatter={(value: number, name: string) => {
                 if (name === 'ratio') return [value, 'Ratio'];
                 return [value, name];
              }}
            />
            <Line 
              type="monotone" 
              dataKey="ratio" 
              stroke="#fbbf24" 
              strokeWidth={3} 
              dot={{ r: 3, strokeWidth: 1, fill: '#1e293b' }} 
              activeDot={{ r: 6 }} 
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RatioChart;
