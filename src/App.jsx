import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AccountProvider } from './contexts/AccountContext';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import IncomePage from './pages/IncomePage';
import ExpensesPage from './pages/ExpensesPage';
import SavingsPage from './pages/SavingsPage';
import GoalsPage from './pages/GoalsPage';
import BudgetPage from './pages/BudgetPage';
import RecurringPage from './pages/RecurringPage';
import MonthlySummaryPage from './pages/MonthlySummaryPage';
import TotalSummaryPage from './pages/TotalSummaryPage';
import ReportsPage from './pages/ReportsPage';
import AccountsPage from './pages/AccountsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AccountProvider>
        <AppProvider>
          <BrowserRouter basename="/TrackUs">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="income" element={<IncomePage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="savings" element={<SavingsPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="budget" element={<BudgetPage />} />
                <Route path="recurring" element={<RecurringPage />} />
                <Route path="monthly-summary" element={<MonthlySummaryPage />} />
                <Route path="total-summary" element={<TotalSummaryPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="accounts" element={<AccountsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AccountProvider>
    </ThemeProvider>
  );
}
