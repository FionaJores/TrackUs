import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/constants';

export default function SavingsGrowthChart({ data, title = 'Savings Growth' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Calculate cumulative savings
  let cumulative = 0;
  const chartData = data.map(d => {
    cumulative += d.savings;
    return {
      month: d.month.split('-')[1] + '/' + d.month.split('-')[0].slice(2),
      savings: d.savings,
      cumulative,
    };
  });

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="cumulative" stroke="#10b981" fill="url(#savingsGradient)" strokeWidth={2} name="Total Savings" />
          <Line type="monotone" dataKey="savings" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} name="Monthly" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
