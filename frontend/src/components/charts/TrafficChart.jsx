import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TrafficChart = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
            itemStyle={{ color: '#818cf8' }}
          />
          <Area type="monotone" dataKey="requests" name="Req / min" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#trafficGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrafficChart;
