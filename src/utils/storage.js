const STORAGE_KEYS = {
  INCOME: 'sst_income',
  EXPENSES: 'sst_expenses',
  SAVINGS: 'sst_savings',
  GOALS: 'sst_goals',
  BUDGETS: 'sst_budgets',
  RECURRING: 'sst_recurring',
  SETTINGS: 'sst_settings',
  THEME: 'sst_theme',
};

export const storage = {
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

  getIncome: () => storage.get(STORAGE_KEYS.INCOME) || [],
  setIncome: (data) => storage.set(STORAGE_KEYS.INCOME, data),

  getExpenses: () => storage.get(STORAGE_KEYS.EXPENSES) || [],
  setExpenses: (data) => storage.set(STORAGE_KEYS.EXPENSES, data),

  getSavings: () => storage.get(STORAGE_KEYS.SAVINGS) || [],
  setSavings: (data) => storage.set(STORAGE_KEYS.SAVINGS, data),

  getGoals: () => storage.get(STORAGE_KEYS.GOALS) || [],
  setGoals: (data) => storage.set(STORAGE_KEYS.GOALS, data),

  getBudgets: () => storage.get(STORAGE_KEYS.BUDGETS) || [],
  setBudgets: (data) => storage.set(STORAGE_KEYS.BUDGETS, data),

  getRecurring: () => storage.get(STORAGE_KEYS.RECURRING) || [],
  setRecurring: (data) => storage.set(STORAGE_KEYS.RECURRING, data),

  getSettings: () => storage.get(STORAGE_KEYS.SETTINGS) || {},
  setSettings: (data) => storage.set(STORAGE_KEYS.SETTINGS, data),

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
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  migrateIfNeeded() {
    const activeAccountId = localStorage.getItem('sst_active_account') || 'default';
    const oldPrefix = `sst_${activeAccountId}_`;
    const dataTypes = ['income', 'expenses', 'savings', 'goals', 'budgets', 'recurring', 'settings'];

    dataTypes.forEach(type => {
      const oldKey = `${oldPrefix}${type}`;
      const newKey = `sst_${type}`;
      const oldData = localStorage.getItem(oldKey);
      if (oldData && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldData);
      }
    });

    // Clean up old account keys
    Object.keys(localStorage).forEach(key => {
      if (key === 'sst_accounts' || key === 'sst_active_account') {
        localStorage.removeItem(key);
      }
      if (key.match(/^sst_[a-z0-9]+_(?:income|expenses|savings|goals|budgets|recurring|settings)$/)) {
        localStorage.removeItem(key);
      }
    });
  }
};

export default storage;
