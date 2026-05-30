import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import storage from '../utils/storage';
import { generateId } from '../utils/constants';
import { addMonths, format, isBefore, parseISO } from 'date-fns';
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
    case 'SET_INCOME': return { ...state, income: action.payload };
    case 'ADD_INCOME': return { ...state, income: [...state.income, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_INCOME': return { ...state, income: state.income.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'DELETE_INCOME': return { ...state, income: state.income.filter(i => i.id !== action.payload) };

    case 'SET_EXPENSES': return { ...state, expenses: action.payload };
    case 'ADD_EXPENSE': return { ...state, expenses: [...state.expenses, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_EXPENSE': return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case 'DELETE_EXPENSE': return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

    case 'SET_SAVINGS': return { ...state, savings: action.payload };
    case 'ADD_SAVINGS': return { ...state, savings: [...state.savings, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_SAVINGS': return { ...state, savings: state.savings.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'DELETE_SAVINGS': return { ...state, savings: state.savings.filter(s => s.id !== action.payload) };

    case 'SET_GOALS': return { ...state, goals: action.payload };
    case 'ADD_GOAL': return { ...state, goals: [...state.goals, { ...action.payload, id: generateId(), paidMonths: [], createdAt: new Date().toISOString() }] };
    case 'UPDATE_GOAL': return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g) };
    case 'DELETE_GOAL': return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };

    case 'SET_BUDGETS': return { ...state, budgets: action.payload };
    case 'ADD_BUDGET': return { ...state, budgets: [...state.budgets, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] };
    case 'UPDATE_BUDGET': return { ...state, budgets: state.budgets.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
    case 'DELETE_BUDGET': return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) };

    case 'SET_RECURRING': return { ...state, recurring: action.payload };
    case 'ADD_RECURRING': return { ...state, recurring: [...state.recurring, { ...action.payload, id: generateId(), active: true, createdAt: new Date().toISOString() }] };
    case 'UPDATE_RECURRING': return { ...state, recurring: state.recurring.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'DELETE_RECURRING': return { ...state, recurring: state.recurring.filter(r => r.id !== action.payload) };

    case 'SET_GOOGLE_CONNECTED': return { ...state, isGoogleConnected: action.payload };
    case 'SET_SYNCING': return { ...state, isSyncing: action.payload };

    case 'ADD_NOTIFICATION': return { ...state, notifications: [...state.notifications, { ...action.payload, id: generateId(), timestamp: new Date().toISOString() }] };
    case 'DISMISS_NOTIFICATION': return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'CLEAR_NOTIFICATIONS': return { ...state, notifications: [] };

    case 'LOAD_ALL': return { ...state, ...action.payload };

    default: return state;
  }
}

export function AppProvider({ children }) {
  const sheetSyncRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const isSyncingRef = useRef(false);
  const hasPendingChangesRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  const getInitialState = () => {
    storage.migrateIfNeeded();
    // Check if there are unsynced local changes from a previous session
    if (localStorage.getItem('sst_dirty')) {
      hasPendingChangesRef.current = true;
    }
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

  // Persist to localStorage on changes and mark as dirty
  useEffect(() => { storage.setIncome(state.income); localStorage.setItem('sst_dirty', '1'); }, [state.income]);
  useEffect(() => { storage.setExpenses(state.expenses); localStorage.setItem('sst_dirty', '1'); }, [state.expenses]);
  useEffect(() => { storage.setSavings(state.savings); localStorage.setItem('sst_dirty', '1'); }, [state.savings]);
  useEffect(() => { storage.setGoals(state.goals); localStorage.setItem('sst_dirty', '1'); }, [state.goals]);
  useEffect(() => { storage.setBudgets(state.budgets); localStorage.setItem('sst_dirty', '1'); }, [state.budgets]);
  useEffect(() => { storage.setRecurring(state.recurring); localStorage.setItem('sst_dirty', '1'); }, [state.recurring]);

  // --- Google Sheets Sync ---
  const loadFromSheets = useCallback(async (showSyncing = true) => {
    if (!googleSheetsService.isConfigured() || isSyncingRef.current || hasPendingChangesRef.current) return;
    try {
      if (showSyncing) dispatch({ type: 'SET_SYNCING', payload: true });
      const sheetData = await googleSheetsService.loadAllData();

      if (hasPendingChangesRef.current || isSyncingRef.current) return;

      // Only use sheet data for a category if it has valid entries
      // Goals must have emiAmount/totalAmount fields (guards against old sheet format)
      const validGoals = (sheetData.goals || []).filter(g => g.totalAmount !== undefined && g.emiAmount !== undefined);

      const payload = {};
      if (sheetData.income?.length > 0) payload.income = sheetData.income;
      if (sheetData.expenses?.length > 0) payload.expenses = sheetData.expenses;
      if (sheetData.savings?.length > 0) payload.savings = sheetData.savings;
      if (validGoals.length > 0) payload.goals = validGoals;
      if (sheetData.budgets?.length > 0) payload.budgets = sheetData.budgets;
      if (sheetData.recurring?.length > 0) payload.recurring = sheetData.recurring;

      if (Object.keys(payload).length > 0) {
        sheetSyncRef.current = false;
        dispatch({ type: 'LOAD_ALL', payload });
        if (payload.income) storage.setIncome(payload.income);
        if (payload.expenses) storage.setExpenses(payload.expenses);
        if (payload.savings) storage.setSavings(payload.savings);
        if (payload.goals) storage.setGoals(payload.goals);
        if (payload.budgets) storage.setBudgets(payload.budgets);
        if (payload.recurring) storage.setRecurring(payload.recurring);
        localStorage.removeItem('sst_dirty');
      }

      dispatch({ type: 'SET_GOOGLE_CONNECTED', payload: true });
      setTimeout(() => { sheetSyncRef.current = true; }, 200);
    } catch (err) {
      console.error('Google Sheets load failed:', err.message);
      dispatch({ type: 'SET_GOOGLE_CONNECTED', payload: false });
    } finally {
      if (showSyncing) dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, []);

  // Load from Sheets on mount (or push local if dirty)
  useEffect(() => {
    if (!googleSheetsService.isConfigured()) return;
    if (hasPendingChangesRef.current) {
      // Local has unsaved changes — push to sheet instead of pulling
      sheetSyncRef.current = true;
    } else {
      loadFromSheets(true);
    }
  }, [loadFromSheets]);

  // Refresh from Sheets when tab gets focus
  useEffect(() => {
    if (!googleSheetsService.isConfigured()) return;

    const handleFocus = () => {
      if (Date.now() - lastSyncTimeRef.current > 5000) {
        loadFromSheets(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleFocus();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadFromSheets]);

  // Sync to Google Sheets when data changes (debounced)
  useEffect(() => {
    if (!sheetSyncRef.current || !googleSheetsService.isConfigured()) return;

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
        localStorage.removeItem('sst_dirty');
        lastSyncTimeRef.current = Date.now();
      } catch (err) {
        console.warn('Google Sheets sync failed:', err.message);
      } finally {
        dispatch({ type: 'SET_SYNCING', payload: false });
        isSyncingRef.current = false;
      }
    }, 2000);

    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [state.income, state.expenses, state.savings, state.goals, state.budgets, state.recurring]);

  // Process recurring transactions
  const processRecurring = useCallback(() => {
    const today = new Date();
    state.recurring.filter(r => r.active).forEach(r => {
      const nextDate = parseISO(r.nextDate);
      if (isBefore(nextDate, today) || format(nextDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        if (r.type === 'income') {
          dispatch({ type: 'ADD_INCOME', payload: { date: r.nextDate, amount: r.amount, source: r.category, notes: `Auto: ${r.description}` } });
        } else if (r.type === 'expense') {
          dispatch({ type: 'ADD_EXPENSE', payload: { date: r.nextDate, amount: r.amount, category: r.category, paymentMethod: 'Auto', notes: `Auto: ${r.description}` } });
        } else if (r.type === 'savings') {
          dispatch({ type: 'ADD_SAVINGS', payload: { date: r.nextDate, amount: r.amount, type: r.category, notes: `Auto: ${r.description}` } });
        }

        let newNextDate;
        switch (r.frequency) {
          case 'Daily': newNextDate = format(new Date(nextDate.getTime() + 86400000), 'yyyy-MM-dd'); break;
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
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
