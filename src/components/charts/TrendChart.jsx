import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/constants';

export default function TrendChart({ data, title = 'Monthly Trend Analysis' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = data.map(d => ({
    ...d,
    month: d.month.split('-')[1] + '/' + d.month.split('-')[0].slice(2),
  }));

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="month" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#fff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '12px',
            }}
            formatter={(value) => [formatCurrency(value)]}
          />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Income" />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
          <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Savings" />
          <Line type="monotone" dataKey="net" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Net" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
