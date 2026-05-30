import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from '../../contexts/AccountContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Settings, Check } from 'lucide-react';

export default function AccountSwitcher({ collapsed = false }) {
  const { accounts, activeAccount, switchAccount } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeAccount) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: activeAccount.color + '20', color: activeAccount.color }}
        >
          {activeAccount.emoji}
        </span>
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="truncate text-gray-900 dark:text-gray-100">{activeAccount.name}</p>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${collapsed ? 'left-full ml-2 top-0' : 'left-0 right-0 top-full mt-1'} z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[200px]`}
          >
            <div className="py-1 max-h-60 overflow-y-auto">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    switchAccount(account.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                    ${account.id === activeAccount.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: account.color + '20', color: account.color }}
                  >
                    {account.emoji}
                  </span>
                  <span className="flex-1 text-left truncate text-gray-900 dark:text-gray-100">
                    {account.name}
                  </span>
                  {account.id === activeAccount.id && (
                    <Check size={14} className="text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 py-1">
              <button
                onClick={() => { navigate('/accounts'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
                <span>New Account</span>
              </button>
              <button
                onClick={() => { navigate('/accounts'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings size={16} />
                <span>Manage Accounts</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
