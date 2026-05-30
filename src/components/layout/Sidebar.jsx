import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, TrendingDown, PiggyBank, Target,
  Calculator, RefreshCw, FileText, BarChart3, Calendar,
  ChevronLeft, ChevronRight, X, Menu, Users
} from 'lucide-react';
import AccountSwitcher from '../common/AccountSwitcher';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/expenses', label: 'Expenses', icon: TrendingDown },
  { path: '/savings', label: 'Savings', icon: PiggyBank },
  { path: '/goals', label: 'EMI', icon: Target },
  { path: '/budget', label: 'Budget', icon: Calculator },
  { path: '/recurring', label: 'Recurring', icon: RefreshCw },
  { path: '/monthly-summary', label: 'Monthly Summary', icon: Calendar },
  { path: '/total-summary', label: 'Total Summary', icon: BarChart3 },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/accounts', label: 'Accounts', icon: Users },
];

export default function Sidebar({ isOpen, setIsOpen, isMobile }) {
  const location = useLocation();

  const closeMobile = () => {
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300
          ${isMobile ? (isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full') : (isOpen ? 'w-64' : 'w-20')}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {(isOpen || isMobile) && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent"
            >
              SavingsTracker
            </motion.h1>
          )}
          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
          {isMobile && (
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Account Switcher */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <AccountSwitcher collapsed={!isOpen && !isMobile} />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              {(isOpen || isMobile) && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {(isOpen || isMobile) && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              v1.0.0 • Made with ♥
            </p>
          </div>
        )}
      </motion.aside>
    </>
  );
}
