const STORAGE_KEYS = {
  INCOME: 'income',
  EXPENSES: 'expenses',
  SAVINGS: 'savings',
  GOALS: 'goals',
  BUDGETS: 'budgets',
  RECURRING: 'recurring',
  SETTINGS: 'settings',
  THEME: 'sst_theme',
};

// Account-scoped key: sst_{accountId}_{dataType}
function scopedKey(key, accountId) {
  return `sst_${accountId}_${key}`;
}

// Current active account ID for storage scoping
let _activeAccountId = localStorage.getItem('sst_active_account') || 'default';

export const storage = {
  setActiveAccount(accountId) {
    _activeAccountId = accountId;
  },

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  getIncome: () => storage.get(scopedKey(STORAGE_KEYS.INCOME, _activeAccountId)) || [],
  setIncome: (data) => storage.set(scopedKey(STORAGE_KEYS.INCOME, _activeAccountId), data),

  getExpenses: () => storage.get(scopedKey(STORAGE_KEYS.EXPENSES, _activeAccountId)) || [],
  setExpenses: (data) => storage.set(scopedKey(STORAGE_KEYS.EXPENSES, _activeAccountId), data),

  getSavings: () => storage.get(scopedKey(STORAGE_KEYS.SAVINGS, _activeAccountId)) || [],
  setSavings: (data) => storage.set(scopedKey(STORAGE_KEYS.SAVINGS, _activeAccountId), data),

  getGoals: () => storage.get(scopedKey(STORAGE_KEYS.GOALS, _activeAccountId)) || [],
  setGoals: (data) => storage.set(scopedKey(STORAGE_KEYS.GOALS, _activeAccountId), data),

  getBudgets: () => storage.get(scopedKey(STORAGE_KEYS.BUDGETS, _activeAccountId)) || [],
  setBudgets: (data) => storage.set(scopedKey(STORAGE_KEYS.BUDGETS, _activeAccountId), data),

  getRecurring: () => storage.get(scopedKey(STORAGE_KEYS.RECURRING, _activeAccountId)) || [],
  setRecurring: (data) => storage.set(scopedKey(STORAGE_KEYS.RECURRING, _activeAccountId), data),

  getSettings: () => storage.get(scopedKey(STORAGE_KEYS.SETTINGS, _activeAccountId)) || {},
  setSettings: (data) => storage.set(scopedKey(STORAGE_KEYS.SETTINGS, _activeAccountId), data),

  getTheme: () => storage.get(STORAGE_KEYS.THEME) || 'dark',
  setTheme: (theme) => storage.set(STORAGE_KEYS.THEME, theme),

  exportAll() {
    return {
      income: storage.getIncome(),
      expenses: storage.getExpenses(),
      savings: storage.getSavings(),
      goals: storage.getGoals(),
      budgets: storage.getBudgets(),
      recurring: storage.getRecurring(),
      settings: storage.getSettings(),
      exportedAt: new Date().toISOString(),
    };
  },

  importAll(data) {
    if (data.income) storage.setIncome(data.income);
    if (data.expenses) storage.setExpenses(data.expenses);
    if (data.savings) storage.setSavings(data.savings);
    if (data.goals) storage.setGoals(data.goals);
    if (data.budgets) storage.setBudgets(data.budgets);
    if (data.recurring) storage.setRecurring(data.recurring);
    if (data.settings) storage.setSettings(data.settings);
  },

  clearAll() {
    const prefix = `sst_${_activeAccountId}_`;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) localStorage.removeItem(key);
    });
  },

  // Migrate old unscoped data to default account
  migrateIfNeeded() {
    const OLD_KEYS = ['sst_income', 'sst_expenses', 'sst_savings', 'sst_goals', 'sst_budgets', 'sst_recurring', 'sst_settings'];
    const DATA_KEYS = ['income', 'expenses', 'savings', 'goals', 'budgets', 'recurring', 'settings'];
    let migrated = false;
    OLD_KEYS.forEach((oldKey, i) => {
      const data = localStorage.getItem(oldKey);
      if (data) {
        const newKey = scopedKey(DATA_KEYS[i], 'default');
        if (!localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, data);
        }
        localStorage.removeItem(oldKey);
        migrated = true;
      }
    });
    return migrated;
  }
};

export default storage;
