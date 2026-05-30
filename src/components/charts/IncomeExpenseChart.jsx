import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/constants';

export default function IncomeExpenseChart({ data, title = 'Income vs Expenses' }) {
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
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="month" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#fff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: isDark ? '#e5e7eb' : '#1f2937' }}
            formatter={(value) => [formatCurrency(value)]}
          />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
