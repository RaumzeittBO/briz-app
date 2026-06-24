import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Bike, Package, ShoppingCart, Wrench, Users, BarChart3,
    Settings, Menu, ChevronLeft, LogOut, Bell, Lock, MapPinned, MessagesSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useCommunity } from '@/context/CommunityContext';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const location = useLocation();
    const { logout, setEditMode } = useAuth();
    const { rentals } = useStore();
    const { items } = useCommunity();

    const pendingRentals = rentals.filter(r => r.status === 'Pendiente').length;
    const pendingCommunity = items.filter(item => item.status === 'pending').length;
    const totalNotifications = pendingRentals + pendingCommunity;

    const adminLinks = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Alquileres', href: '/admin/rentals', icon: Bike, badge: pendingRentals > 0 ? pendingRentals : undefined },
        { label: 'Inventario', href: '/admin/inventory', icon: Package },
        { label: 'Ventas', href: '/admin/sales', icon: ShoppingCart },
        { label: 'Servicio', href: '/admin/service', icon: Wrench },
        { label: 'Clientes', href: '/admin/customers', icon: Users },
        { label: 'Ciclotours', href: '/admin/routes', icon: MapPinned },
        { label: 'Comunidad', href: '/admin/community', icon: MessagesSquare, badge: pendingCommunity || undefined },
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
            <div className="p-6 flex items-center justify-between border-b border-brand-yellow/20 mb-2">
                <Link to="/admin" className="flex items-center gap-3">
                    <div className="p-1 bg-white border border-brand-yellow/25 rounded-xl">
                        <img src="/images/briz-logo.jpg" alt="Briz" className="h-10 w-10 rounded-full object-cover" />
                    </div>
                    {sidebarOpen && (
                        <div className="leading-none">
                            <span className="text-lg font-black text-brand-charcoal tracking-tighter">Briz <span className="text-brand-yellow-vibrant">OS</span></span>
                            <p className="text-[8px] font-bold text-brand-charcoal/45 tracking-widest uppercase mt-1">Panel administrativo</p>
                        </div>
                    )}
                </Link>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-brand-charcoal/35 hover:text-brand-charcoal transition-colors">
                    <ChevronLeft className={`w-5 h-5 transition-transform duration-500 ${!sidebarOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
                {adminLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 group
                                ${active 
                                    ? 'bg-brand-yellow text-brand-black shadow-[0_10px_30px_rgba(255,210,0,0.2)]' 
                                    : 'text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-white/70'
                                }`}
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {(sidebarOpen || mobileSidebarOpen) && (
                                <>
                                    <span className="flex-1 truncate">{link.label}</span>
                                    {link.badge && (
                                        <Badge className={`border-0 text-[10px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-black text-brand-yellow' : 'bg-brand-yellow text-black'}`}>
                                            {link.badge}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-brand-yellow/20 space-y-2">
                <Link
                    to="/"
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black text-brand-charcoal/55 hover:text-brand-charcoal hover:bg-white/70 transition-all group"
                >
                    <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
                    {(sidebarOpen || mobileSidebarOpen) && <span>Portal Público</span>}
                </Link>
                <button
                    onClick={() => { logout(); window.location.href = '/'; }}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black text-red-400/50 hover:text-red-400 hover:bg-red-400/5 transition-all group w-full"
                >
                    <Lock className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={3} />
                    {(sidebarOpen || mobileSidebarOpen) && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="admin-light-theme min-h-screen bg-[#FFF9E8] flex">
            {/* Desktop sidebar */}
            <aside className={`hidden lg:flex flex-col border-r border-brand-yellow/25 bg-white/65 backdrop-blur-xl transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-72' : 'w-20'
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
                            className="fixed left-0 top-0 bottom-0 w-64 bg-[#FFF9E8] z-50 lg:hidden"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#FFF9E8]">
                {/* Top bar */}
                <header className="h-20 border-b border-brand-yellow/20 flex items-center justify-between px-5 lg:px-8 bg-white/65 backdrop-blur-xl sticky top-0 z-30">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="lg:hidden text-brand-charcoal/55 hover:text-brand-charcoal p-2 hover:bg-brand-yellow/15 rounded-xl transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="hidden lg:flex items-center">
                        <h2 className="text-brand-charcoal/40 font-black uppercase tracking-[0.3em] text-[10px]">Briz Panel de Gestión</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <Button
                            className="flex items-center gap-2 bg-white text-brand-black hover:bg-brand-yellow font-black h-11 px-6 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 group"
                            onClick={() => { setEditMode(true); window.location.href = '/shop'; }}
                        >
                            <Wrench className="w-4 h-4 group-hover:rotate-12 transition-transform" strokeWidth={3} />
                            <span className="hidden sm:inline">Editor Visual</span>
                        </Button>
                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-brand-charcoal/50 hover:text-brand-charcoal hover:bg-brand-yellow/15 relative w-11 h-11 rounded-xl transition-all"
                            onClick={() => {
                                if (totalNotifications === 0) alert('No hay notificaciones nuevas');
                                else alert(`Tienes ${totalNotifications} notificaciones nuevas`);
                            }}
                        >
                            <Bell className="w-5 h-5" />
                            {totalNotifications > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-brand-yellow rounded-full shadow-[0_0_10px_#FFD200]" />}
                        </Button>
                        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-yellow to-brand-yellow/50 p-[1px] shadow-lg shadow-brand-yellow/10">
                                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                                    <span className="text-brand-yellow-vibrant text-xs font-black">AD</span>
                                </div>
                            </div>
                            <div className="hidden sm:block leading-none">
                                <p className="text-sm font-black text-brand-charcoal">Administrador</p>
                                <p className="text-[10px] font-bold text-brand-charcoal/45 uppercase tracking-widest mt-1">Panel Briz</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
