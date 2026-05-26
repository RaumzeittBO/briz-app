import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Public pages
import HomePage from '@/pages/public/HomePage';
import RentalsPage from '@/pages/public/RentalsPage';
import ShopPage from '@/pages/public/ShopPage';
import ServicePage from '@/pages/public/ServicePage';
import RoutesPage from '@/pages/public/RoutesPage';
import AboutPage from '@/pages/public/AboutPage';
import ContactPage from '@/pages/public/ContactPage';
import CommunityPage from '@/pages/public/CommunityPage';

// Admin pages
import LoginPage from '@/pages/admin/LoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import AdminRentalsPage from '@/pages/admin/AdminRentalsPage';
import InventoryPage from '@/pages/admin/InventoryPage';
import AdminSalesPage from '@/pages/admin/AdminSalesPage';
import AdminServicePage from '@/pages/admin/AdminServicePage';
import CustomersPage from '@/pages/admin/CustomersPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import SettingsPage from '@/pages/admin/SettingsPage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/rentals" element={<RentalsPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/service" element={<ServicePage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Admin routes — protected */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="rentals" element={<AdminRentalsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="sales" element={<AdminSalesPage />} />
        <Route path="service" element={<AdminServicePage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';

import ScrollToTop from '@/components/layout/ScrollToTop';

function App() {
  return (
    <TooltipProvider>
      <StoreProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </CartProvider>
      </StoreProvider>
    </TooltipProvider>
  );
}

export default App;
