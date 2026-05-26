import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout() {
    const { isAuthenticated, isEditMode, setEditMode } = useAuth();

    return (
        <div className="min-h-screen flex flex-col relative">
            {isAuthenticated && isEditMode && (
                <div className="fixed bottom-4 right-4 z-50 bg-brand-yellow text-brand-black px-4 py-2 rounded-full shadow-lg flex items-center gap-3 font-semibold text-sm animate-in slide-in-from-bottom border border-brand-yellow-light">
                    <span>✏️ Modo Edición Activo</span>
                    <button onClick={() => setEditMode(false)} className="text-xs bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-full transition-colors font-bold">
                        Salir
                    </button>
                </div>
            )}
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
