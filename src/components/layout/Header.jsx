import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Moon, Sun, Menu, Cloud, CloudOff, Bell } from 'lucide-react';
import googleSheetsService from '../../services/googleSheets';

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useApp();

  const handleGoogleSync = async () => {
    if (!googleSheetsService.isConfigured()) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: 'Set your Apps Script URL in src/config/google.js first' } });
      return;
    }
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      await googleSheetsService.syncAllData({
        income: state.income,
        expenses: state.expenses,
        savings: state.savings,
        goals: state.goals,
        budgets: state.budgets,
        recurring: state.recurring,
      });
      dispatch({ type: 'SET_GOOGLE_CONNECTED', payload: true });
      dispatch({ type: 'SET_SYNCING', payload: false });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Data synced to Google Sheets!' } });
    } catch (err) {
      dispatch({ type: 'SET_SYNCING', payload: false });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: 'Sync failed: ' + err.message } });
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
      >
        <Menu size={20} className="text-gray-600 dark:text-gray-300" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Google Sync */}
        <button
          onClick={handleGoogleSync}
          className={`p-2 rounded-lg transition-colors ${
            state.isGoogleConnected
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
          title={state.isGoogleConnected ? 'Connected to Google Sheets' : 'Connect to Google Sheets'}
        >
          {state.isGoogleConnected ? <Cloud size={20} /> : <CloudOff size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
            <Bell size={20} />
            {state.notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
