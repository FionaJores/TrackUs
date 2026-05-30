import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import storage from '../utils/storage';
import { generateId } from '../utils/constants';
import { addMonths, format, isBefore, parseISO } from 'date-fns';
import { useAccount } from './AccountContext';
import googleSheetsService from '../services/googleSheets';

const AppContext = createContext();

const initialState = {
  income: [],
  expenses: [],
  savings: [],
  goals: [],
  budgets: [],
  recurring: [],
  isGoogleConnected: false,
  isSyncing: false,
  notifications: [],
};

function appReducer(state, action) {
  switch (action.type) {
    // Income
    case 'SET_INCOME': return { ...state, income: action.payload };
    case 'ADD_INCOME': return { ...state, income: [...state.income, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_INCOME': return { ...state, income: state.income.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'DELETE_INCOME': return { ...state, income: state.income.filter(i => i.id !== action.payload) };

    // Expenses
    case 'SET_EXPENSES': return { ...state, expenses: action.payload };
    case 'ADD_EXPENSE': return { ...state, expenses: [...state.expenses, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_EXPENSE': return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case 'DELETE_EXPENSE': return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

    // Savings
    case 'SET_SAVINGS': return { ...state, savings: action.payload };
    case 'ADD_SAVINGS': return { ...state, savings: [...state.savings, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_SAVINGS': return { ...state, savings: state.savings.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'DELETE_SAVINGS': return { ...state, savings: state.savings.filter(s => s.id !== action.payload) };

    // Goals
    case 'SET_GOALS': return { ...state, goals: action.payload };
    case 'ADD_GOAL': return { ...state, goals: [...state.goals, { ...action.payload, id: generateId(), currentAmount: 0, createdAt: new Date().toISOString() }] };
    case 'UPDATE_GOAL': return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g) };
    case 'DELETE_GOAL': return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };

    // Budgets
    case 'SET_BUDGETS': return { ...state, budgets: action.payload };
    case 'ADD_BUDGET': return { ...state, budgets: [...state.budgets, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_BUDGET': return { ...state, budgets: state.budgets.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
    case 'DELETE_BUDGET': return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) };

    // Recurring
    case 'SET_RECURRING': return { ...state, recurring: action.payload };
    case 'ADD_RECURRING': return { ...state, recurring: [...state.recurring, { ...action.payload, id: generateId(), active: true, createdAt: new Date().toISOString() }] };
    case 'UPDATE_RECURRING': return { ...state, recurring: state.recurring.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'DELETE_RECURRING': return { ...state, recurring: state.recurring.filter(r => r.id !== action.payload) };

    // Sync
    case 'SET_GOOGLE_CONNECTED': return { ...state, isGoogleConnected: action.payload };
    case 'SET_SYNCING': return { ...state, isSyncing: action.payload };

    // Notifications
    case 'ADD_NOTIFICATION': return { ...state, notifications: [...state.notifications, { ...action.payload, id: generateId(), timestamp: new Date().toISOString() }] };
    case 'DISMISS_NOTIFICATION': return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'CLEAR_NOTIFICATIONS': return { ...state, notifications: [] };

    // Load all
    case 'LOAD_ALL': return { ...state, ...action.payload };

    default: return state;
  }
}

export function AppProvider({ children }) {
  const { activeAccountId } = useAccount();
  const loadedRef = React.useRef(false);
  const accountRef = React.useRef(activeAccountId);

  // Initialize state from localStorage immediately
  const getInitialState = () => {
    storage.setActiveAccount(activeAccountId);
    storage.migrateIfNeeded();
    return {
      ...initialState,
      income: storage.getIncome(),
      expenses: storage.getExpenses(),
      savings: storage.getSavings(),
      goals: storage.getGoals(),
      budgets: storage.getBudgets(),
      recurring: storage.getRecurring(),
    };
  };

  const [state, dispatch] = useReducer(appReducer, null, getInitialState);

  // Mark as loaded after first render
  useEffect(() => {
    loadedRef.current = true;
  }, []);

  // Reload data when active account changes (not on first mount)
  useEffect(() => {
    if (accountRef.current === activeAccountId) return;
    accountRef.current = activeAccountId;
    loadedRef.current = false;
    storage.setActiveAccount(activeAccountId);
    dispatch({
      type: 'LOAD_ALL',
      payload: {
        income: storage.getIncome(),
        expenses: storage.getExpenses(),
        savings: storage.getSavings(),
        goals: storage.getGoals(),
        budgets: storage.getBudgets(),
        recurring: storage.getRecurring(),
      }
    });
    // Use setTimeout to ensure state has updated before enabling saves
    setTimeout(() => { loadedRef.current = true; }, 0);
  }, [activeAccountId]);

  // Persist to localStorage on changes (skip initial render)
  useEffect(() => { if (loadedRef.current) storage.setIncome(state.income); }, [state.income]);
  useEffect(() => { if (loadedRef.current) storage.setExpenses(state.expenses); }, [state.expenses]);
  useEffect(() => { if (loadedRef.current) storage.setSavings(state.savings); }, [state.savings]);
  useEffect(() => { if (loadedRef.current) storage.setGoals(state.goals); }, [state.goals]);
  useEffect(() => { if (loadedRef.current) storage.setBudgets(state.budgets); }, [state.budgets]);
  useEffect(() => { if (loadedRef.current) storage.setRecurring(state.recurring); }, [state.recurring]);

  // --- Google Sheets Sync ---
  const syncTimeoutRef = useRef(null);
  const isSyncingRef = useRef(false);
  const hasPendingChangesRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  // Load data from Google Sheets
  const loadFromSheets = useCallback(async (showSyncing = true) => {
    // Don't load if we have pending local changes or an active sync
    if (!googleSheetsService.isConfigured() || isSyncingRef.current || hasPendingChangesRef.current) return;
    try {
      if (showSyncing) dispatch({ type: 'SET_SYNCING', payload: true });
      const sheetData = await googleSheetsService.loadAllData();

      // Don't overwrite if local changes happened while we were fetching
      if (hasPendingChangesRef.current || isSyncingRef.current) return;

      const payload = {
        income: sheetData.income || [],
        expenses: sheetData.expenses || [],
        savings: sheetData.savings || [],
        goals: sheetData.goals || [],
        budgets: sheetData.budgets || [],
        recurring: sheetData.recurring || [],
      };

      loadedRef.current = false; // Prevent triggering sync from this load
      dispatch({ type: 'LOAD_ALL', payload });
      dispatch({ type: 'SET_GOOGLE_CONNECTED', payload: true });

      // Persist to localStorage for offline access
      storage.setIncome(payload.income);
      storage.setExpenses(payload.expenses);
      storage.setSavings(payload.savings);
      storage.setGoals(payload.goals);
      storage.setBudgets(payload.budgets);
      storage.setRecurring(payload.recurring);
      setTimeout(() => { loadedRef.current = true; }, 100);
    } catch (err) {
      console.error('Google Sheets load failed:', err.message);
      dispatch({ type: 'SET_GOOGLE_CONNECTED', payload: false });
    } finally {
      if (showSyncing) dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, []);

  // Load from Sheets on mount
  useEffect(() => {
    if (!googleSheetsService.isConfigured()) return;
    loadFromSheets(true);
  }, [activeAccountId, loadFromSheets]);

  // Refresh from Sheets when tab gets focus (cross-browser sync)
  useEffect(() => {
    if (!googleSheetsService.isConfigured()) return;

    const handleFocus = () => {
      // Only reload if enough time has passed since last sync (5 seconds)
      if (Date.now() - lastSyncTimeRef.current > 5000) {
        loadFromSheets(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadFromSheets]);

  // Sync to Google Sheets when data changes (debounced)
  useEffect(() => {
    if (!loadedRef.current || !googleSheetsService.isConfigured()) return;

    hasPendingChangesRef.current = true;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        isSyncingRef.current = true;
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
        hasPendingChangesRef.current = false;
        lastSyncTimeRef.current = Date.now();
      } catch (err) {
        console.warn('Google Sheets sync failed:', err.message);
        // Keep hasPendingChangesRef true so poll won't overwrite local data
      } finally {
        dispatch({ type: 'SET_SYNCING', payload: false });
        isSyncingRef.current = false;
      }
    }, 2000); // Debounce 2 seconds

    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [state.income, state.expenses, state.savings, state.goals, state.budgets, state.recurring]);

  // Process recurring transactions
  const processRecurring = useCallback(() => {
    const today = new Date();
    state.recurring.filter(r => r.active).forEach(r => {
      const nextDate = parseISO(r.nextDate);
      if (isBefore(nextDate, today) || format(nextDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        // Create the transaction
        if (r.type === 'income') {
          dispatch({ type: 'ADD_INCOME', payload: { date: r.nextDate, amount: r.amount, source: r.category, notes: `Auto: ${r.description}` } });
        } else if (r.type === 'expense') {
          dispatch({ type: 'ADD_EXPENSE', payload: { date: r.nextDate, amount: r.amount, category: r.category, paymentMethod: 'Auto', notes: `Auto: ${r.description}` } });
        } else if (r.type === 'savings') {
          dispatch({ type: 'ADD_SAVINGS', payload: { date: r.nextDate, amount: r.amount, type: r.category, notes: `Auto: ${r.description}` } });
        }

        // Update next date
        let newNextDate;
        switch (r.frequency) {
          case 'Daily': newNextDate = format(addMonths(nextDate, 0), 'yyyy-MM-dd'); break;
          case 'Weekly': newNextDate = format(new Date(nextDate.getTime() + 7 * 86400000), 'yyyy-MM-dd'); break;
          case 'Monthly': newNextDate = format(addMonths(nextDate, 1), 'yyyy-MM-dd'); break;
          case 'Quarterly': newNextDate = format(addMonths(nextDate, 3), 'yyyy-MM-dd'); break;
          case 'Yearly': newNextDate = format(addMonths(nextDate, 12), 'yyyy-MM-dd'); break;
          default: newNextDate = format(addMonths(nextDate, 1), 'yyyy-MM-dd');
        }
        dispatch({ type: 'UPDATE_RECURRING', payload: { id: r.id, nextDate: newNextDate } });
      }
    });
  }, [state.recurring]);

  useEffect(() => {
    processRecurring();
  }, []); // Run once on mount

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
