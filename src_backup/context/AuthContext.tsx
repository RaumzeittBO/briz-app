import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    isEditMode: boolean;
    setEditMode: (mode: boolean) => void;
    login: (username: string, password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo credentials — in production this would be a backend call
const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'briz2026';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('briz_auth') === 'true';
    });

    const [isEditMode, setIsEditMode] = useState(() => {
        return sessionStorage.getItem('briz_edit_mode') === 'true';
    });

    const setEditMode = (mode: boolean) => {
        setIsEditMode(mode);
        if (mode) {
            sessionStorage.setItem('briz_edit_mode', 'true');
        } else {
            sessionStorage.removeItem('briz_edit_mode');
        }
    };

    const login = (username: string, password: string): boolean => {
        if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('briz_auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsEditMode(false);
        sessionStorage.removeItem('briz_auth');
        sessionStorage.removeItem('briz_edit_mode');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isEditMode, setEditMode, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
