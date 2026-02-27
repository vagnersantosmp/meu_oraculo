import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';

import ShoppingLists from './pages/Shopping/ShoppingLists';
import ShoppingDetail from './pages/Shopping/ShoppingDetail';
import ShoppingDashboard from './pages/Shopping/ShoppingDashboard';

import { Car } from './pages/Car/Car';
import { Ledger } from './pages/Ledger/Ledger';
import { FixedExpenses } from './pages/FixedExpenses/FixedExpenses';
import { Profile } from './pages/Profile';
import { Login } from './pages/Auth/Login';
import { SignUp } from './pages/Auth/SignUp';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { CreditCards } from './pages/Cards/Cards';

function App() {
  return (
    <AccessibilityProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ToastProvider>
                    <AppProvider>
                      <Layout />
                    </AppProvider>
                  </ToastProvider>
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="shopping" element={<ShoppingLists />} />
                <Route path="shopping/dashboard" element={<ShoppingDashboard />} />
                <Route path="shopping/:id" element={<ShoppingDetail />} />
                <Route path="car" element={<Car />} />
                <Route path="ledger" element={<Ledger />} />
                <Route path="bills" element={<FixedExpenses />} />
                <Route path="cards" element={<CreditCards />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </AccessibilityProvider>
  );
}

export default App;
