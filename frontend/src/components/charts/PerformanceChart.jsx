import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const PerformanceChart = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
          />
          <Bar dataKey="count" name="Total Requests" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
