import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type AdminRole = 'admin' | 'manager' | 'mechanic' | 'viewer';

export interface AdminProfile {
    uid: string;
    email: string;
    name?: string;
    role: AdminRole;
    store?: string;
    active: boolean;
}

interface AuthContextType {
    user: User | null;
    adminProfile: AdminProfile | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isEditMode: boolean;
    setEditMode: (mode: boolean) => void;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ALLOWED_ROLES: AdminRole[] = ['admin', 'manager', 'mechanic', 'viewer'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(() => {
        return sessionStorage.getItem('briz_edit_mode') === 'true';
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setIsLoading(true);
            try {
                setUser(currentUser);
                setAdminProfile(null);
                if (currentUser) {
                    const adminRef = doc(db, 'adminUsers', currentUser.uid);
                    const snap = await getDoc(adminRef);
                    if (snap.exists()) {
                        const data = snap.data() as Partial<AdminProfile>;
                        if (ALLOWED_ROLES.includes(data.role as AdminRole)) {
                            setAdminProfile({
                                uid: currentUser.uid,
                                email: data.email || currentUser.email || '',
                                name: data.name || currentUser.displayName || 'Administrador',
                                role: data.role as AdminRole,
                                store: data.store || 'all',
                                active: data.active !== false
                            });
                        }
                    } else {
                        setAdminProfile(null);
                    }
                }
            } catch (error) {
                console.error('No se pudo verificar el rol admin:', error);
                // Deny by default on error instead of granting blind admin access
                setAdminProfile(null);
            } finally {
                setIsLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const setEditMode = (mode: boolean) => {
        setIsEditMode(mode);
        if (mode) {
            sessionStorage.setItem('briz_edit_mode', 'true');
        } else {
            sessionStorage.removeItem('briz_edit_mode');
        }
    };

    const login = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const logout = async () => {
        await signOut(auth);
        setAdminProfile(null);
        setIsEditMode(false);
        sessionStorage.removeItem('briz_edit_mode');
    };

    const isAdmin = !!user && !!adminProfile && adminProfile.active !== false && ALLOWED_ROLES.includes(adminProfile.role);

    return (
        <AuthContext.Provider value={{
            user,
            adminProfile,
            isAuthenticated: isAdmin,
            isAdmin,
            isEditMode,
            setEditMode,
            login,
            logout,
            isLoading
        }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
