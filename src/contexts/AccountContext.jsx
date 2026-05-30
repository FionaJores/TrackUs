import React, { createContext, useContext, useState, useCallback } from 'react';

const AccountContext = createContext();

const ACCOUNTS_KEY = 'sst_accounts';
const ACTIVE_ACCOUNT_KEY = 'sst_active_account';

function loadAccounts() {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function loadActiveAccountId() {
  return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || null;
}

function saveActiveAccountId(id) {
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState(() => {
    const existing = loadAccounts();
    if (existing.length === 0) {
      const defaultAccount = {
        id: 'default',
        name: 'Personal',
        color: DEFAULT_COLORS[0],
        emoji: '👤',
        createdAt: new Date().toISOString(),
      };
      saveAccounts([defaultAccount]);
      saveActiveAccountId(defaultAccount.id);
      return [defaultAccount];
    }
    return existing;
  });

  const [activeAccountId, setActiveAccountId] = useState(() => {
    const id = loadActiveAccountId();
    const accs = loadAccounts();
    if (id && accs.find(a => a.id === id)) return id;
    return accs[0]?.id || 'default';
  });

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const createAccount = useCallback((name, emoji = '💼', color = null) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newAccount = {
      id,
      name,
      emoji,
      color: color || DEFAULT_COLORS[accounts.length % DEFAULT_COLORS.length],
      createdAt: new Date().toISOString(),
    };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    saveAccounts(updated);
    return newAccount;
  }, [accounts]);

  const updateAccount = useCallback((id, updates) => {
    const updated = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
    setAccounts(updated);
    saveAccounts(updated);
  }, [accounts]);

  const deleteAccount = useCallback((id) => {
    if (accounts.length <= 1) return false;
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    saveAccounts(updated);

    // Clear the deleted account's data
    const prefix = `sst_${id}_`;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) localStorage.removeItem(key);
    });

    if (activeAccountId === id) {
      const newActiveId = updated[0].id;
      setActiveAccountId(newActiveId);
      saveActiveAccountId(newActiveId);
    }
    return true;
  }, [accounts, activeAccountId]);

  const switchAccount = useCallback((id) => {
    if (accounts.find(a => a.id === id)) {
      setActiveAccountId(id);
      saveActiveAccountId(id);
    }
  }, [accounts]);

  return (
    <AccountContext.Provider value={{
      accounts,
      activeAccount,
      activeAccountId,
      createAccount,
      updateAccount,
      deleteAccount,
      switchAccount,
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);
