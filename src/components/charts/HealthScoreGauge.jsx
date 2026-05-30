import React from 'react';
import { Card } from '../common/Card';

export default function HealthScoreGauge({ score }) {
  const getColor = (s) => {
    if (s >= 80) return { color: '#10b981', label: 'Excellent', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
    if (s >= 60) return { color: '#3b82f6', label: 'Good', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    if (s >= 40) return { color: '#f59e0b', label: 'Average', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    return { color: '#ef4444', label: 'Needs Improvement', bg: 'bg-red-50 dark:bg-red-900/20' };
  };

  const { color, label, bg } = getColor(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className={`p-5 ${bg}`}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Financial Health Score</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>{score}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">/100</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium" style={{ color }}>{label}</p>
      </div>
    </Card>
  );
}
