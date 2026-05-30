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

  // Load data from Google Sheets on mount (merges with localStorage)
  useEffect(() => {
    if (!googleSheetsService.isConfigured()) return;
    let cancelled = false;

    const loadFromSheets = async () => {
      try {
        dispatch({ type: 'SET_SYNCING', payload: true });
        const sheetData = await googleSheetsService.loadAllData();
        if (cancelled) return;

        // Use sheet data if it has content; merge with local data
        const merged = {
          income: sheetData.income?.length ? sheetData.income : storage.getIncome(),
          expenses: sheetData.expenses?.length ? sheetData.expenses : storage.getExpenses(),
          savings: sheetData.savings?.length ? sheetData.savings : storage.getSavings(),
          goals: sheetData.goals?.length ? sheetData.goals : storage.getGoals(),
          budgets: sheetData.budgets?.length ? sheetData.budgets : storage.getBudgets(),
          recurring: sheetData.recurring?.length ? sheetData.recurring : storage.getRecurring(),
        };

        dispatch({ type: 'LOAD_ALL', payload: merged });
        dispatch({ type: 'SET_GOOGLE_CONNECTED', payload: true });

        // Also persist sheet data to localStorage for offline access
        storage.setIncome(merged.income);
        storage.setExpenses(merged.expenses);
        storage.setSavings(merged.savings);
        storage.setGoals(merged.goals);
        storage.setBudgets(merged.budgets);
        storage.setRecurring(merged.recurring);
      } catch (err) {
        console.warn('Google Sheets load failed (using localStorage):', err.message);
        dispatch({ type: 'SET_GOOGLE_CONNECTED', payload: false });
      } finally {
        if (!cancelled) dispatch({ type: 'SET_SYNCING', payload: false });
      }
    };

    loadFromSheets();
    return () => { cancelled = true; };
  }, [activeAccountId]);

  // Sync to Google Sheets when data changes (debounced)
  useEffect(() => {
    if (!loadedRef.current || !googleSheetsService.isConfigured()) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
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
      } catch (err) {
        console.warn('Google Sheets sync failed:', err.message);
      } finally {
        dispatch({ type: 'SET_SYNCING', payload: false });
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
