import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Bike, Package, ShoppingCart, Wrench, Users, BarChart3,
    Settings, Menu, ChevronLeft, LogOut, Bell, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const location = useLocation();
    const { logout, setEditMode } = useAuth();
    const { rentals, serviceOrders } = useStore();

    const pendingRentals = rentals.filter(r => r.status === 'Pendiente').length;
    const pendingService = serviceOrders.filter(so => so.status === 'Recibido' || so.status === 'En revisión').length;
    const totalNotifications = pendingRentals + pendingService;

    const adminLinks = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Alquileres', href: '/admin/rentals', icon: Bike, badge: pendingRentals > 0 ? pendingRentals : undefined },
        { label: 'Inventario', href: '/admin/inventory', icon: Package },
        { label: 'Ventas', href: '/admin/sales', icon: ShoppingCart },
        { label: 'Servicio', href: '/admin/service', icon: Wrench, badge: pendingService > 0 ? pendingService : undefined },
        { label: 'Clientes', href: '/admin/customers', icon: Users },
        { label: 'Reportes', href: '/admin/reports', icon: BarChart3 },
        { label: 'Configuración', href: '/admin/settings', icon: Settings },
    ];

    const isActive = (href: string) => {
        if (href === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(href);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
                <Link to="/admin" className="flex items-center gap-2">
                    <img src="/images/briz-logo.jpg" alt="Briz" className="h-8 w-8 rounded-lg object-cover" />
                    {sidebarOpen && <span className="text-lg font-bold text-white">Briz Admin</span>}</Link>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-white/50 hover:text-white">
                    <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {adminLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.href)
                                ? 'bg-brand-yellow/15 text-brand-yellow'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {(sidebarOpen || mobileSidebarOpen) && (
                                <>
                                    <span className="flex-1">{link.label}</span>
                                    {link.badge && (
                                        <Badge className="bg-brand-yellow/20 text-brand-yellow border-0 text-xs">
                                            {link.badge}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-white/10 space-y-1">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    {(sidebarOpen || mobileSidebarOpen) && <span>Volver al sitio</span>}
                </Link>
                <button
                    onClick={() => { logout(); window.location.href = '/'; }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-colors w-full"
                >
                    <Lock className="w-5 h-5" />
                    {(sidebarOpen || mobileSidebarOpen) && <span>Cerrar sesión</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-black flex">
            {/* Desktop sidebar */}
            <aside className={`hidden lg:flex flex-col border-r border-white/10 bg-brand-charcoal/50 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'
                }`}>
                <SidebarContent />
            </aside>

            {/* Mobile sidebar overlay */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed left-0 top-0 bottom-0 w-64 bg-brand-charcoal z-50 lg:hidden"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-brand-charcoal/30">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="lg:hidden text-white/60 hover:text-white"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:flex-1" />
                    <div className="flex items-center gap-3">
                        <Button
                            className="flex items-center gap-2 bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold h-9 px-3 sm:px-4"
                            onClick={() => { setEditMode(true); window.location.href = '/shop'; }}
                            title="Editar en página principal"
                        >
                            <Wrench className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar en página principal</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white/60 hover:text-white hover:bg-white/5 relative"
                            onClick={() => {
                                if (totalNotifications === 0) alert('No hay notificaciones nuevas');
                                else alert(`Tienes ${totalNotifications} notificaciones nuevas`);
                            }}
                        >
                            <Bell className="w-5 h-5" />
                            {totalNotifications > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-yellow rounded-full" />}
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                                <span className="text-brand-yellow text-xs font-bold">BR</span>
                            </div>
                            <span className="text-sm text-white/80 hidden sm:block">Briz Admin</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
