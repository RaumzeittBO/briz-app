import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CommunityProvider } from '@/context/CommunityContext';
import { ArtworkProvider } from '@/context/ArtworkContext';
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
import ProfilePage from '@/pages/public/ProfilePage';

// Admin pages
import LoginPage from '@/pages/admin/LoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import AdminRentalsPage from '@/pages/admin/AdminRentalsPage';
import AdminShopPage from '@/pages/admin/AdminShopPage';
import InventoryPage from '@/pages/admin/InventoryPage';
import AdminSalesPage from '@/pages/admin/AdminSalesPage';
import AdminServicePage from '@/pages/admin/AdminServicePage';
import CustomersPage from '@/pages/admin/CustomersPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import AdminRoutesPage from '@/pages/admin/AdminRoutesPage';
import AdminSeedPage from '@/pages/admin/AdminSeedPage';
import AdminCommunityPage from '@/pages/admin/AdminCommunityPage';
import AdminEventsPage from '@/pages/admin/AdminEventsPage';
import AdminArtworksPage from '@/pages/admin/AdminArtworksPage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div role="status" className="min-h-screen flex items-center justify-center bg-brand-charcoal text-white/70">Verificando acceso al panel…</div>;
  }
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  return <>{children}</>;
}

function AdminRoleRoute({ children }: { children: React.ReactNode }) {
  const { adminProfile, isLoading } = useAuth();
  if (isLoading) return <div role="status" className="min-h-screen flex items-center justify-center bg-brand-charcoal text-white/70">Verificando acceso al panel…</div>;
  if (adminProfile?.role !== 'admin') return <div role="alert" className="min-h-screen grid place-items-center bg-[#FFF9E8] p-6 text-center"><div><h1 className="text-xl font-black">Acceso reservado a Admin</h1><p className="mt-2 text-sm text-stone-600">Tu perfil no tiene permiso para administrar artes públicos.</p></div></div>;
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
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin routes — protected */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="rentals" element={<AdminRentalsPage />} />
        <Route path="shop" element={<AdminShopPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="sales" element={<AdminSalesPage />} />
        <Route path="service" element={<AdminServicePage />} />
        <Route path="community" element={<AdminCommunityPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="routes" element={<AdminRoutesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="seed" element={<AdminSeedPage />} />
        <Route path="artes" element={<AdminRoleRoute><AdminArtworksPage /></AdminRoleRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';

import ScrollToTop from '@/components/layout/ScrollToTop';

function App() {
  return (
    <TooltipProvider>
      <LanguageProvider>
        <StoreProvider>
          <CartProvider>
              <CommunityProvider>
                <ArtworkProvider>
              <BrowserRouter>
                <ScrollToTop />
                <AuthProvider>
                  <AppRoutes />
                </AuthProvider>
              </BrowserRouter>
                </ArtworkProvider>
            </CommunityProvider>
          </CartProvider>
        </StoreProvider>
      </LanguageProvider>
    </TooltipProvider>
  );
}

export default App;
