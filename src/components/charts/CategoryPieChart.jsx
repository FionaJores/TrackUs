import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../common/Card';
import { formatCurrency, CHART_COLORS } from '../../utils/constants';

export default function CategoryPieChart({ data, title, nameKey = 'name', valueKey = 'value' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = Object.entries(data).map(([name, items]) => ({
    name,
    value: Array.isArray(items) ? items.reduce((s, i) => s + Number(i.amount || 0), 0) : Number(items),
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No data available</div>
      </Card>
    );
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#fff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '12px',
            }}
            formatter={(value) => [formatCurrency(value), '']}
            labelFormatter={(name) => name}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry) => {
              const item = chartData.find(d => d.name === value);
              const percent = item ? Math.round((item.value / total) * 100) : 0;
              return <span className="text-xs text-gray-600 dark:text-gray-400">{value} ({percent}%)</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
