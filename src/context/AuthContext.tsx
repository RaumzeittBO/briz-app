import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { loadAdminProfile, profileReadFailure, type AdminProfileFailure } from './adminAuth';

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
    authError: AdminProfileFailure | null;
    clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<AdminProfileFailure | null>(null);
    const [isEditMode, setIsEditMode] = useState(() => {
        return sessionStorage.getItem('briz_edit_mode') === 'true';
    });

    useEffect(() => {
        let latestEvent = 0;
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            const eventId = ++latestEvent;
            setIsLoading(true);
            setUser(currentUser);
            setAdminProfile(null);
            setAuthError(null);
            if (!currentUser) {
                setIsLoading(false);
                return;
            }

            try {
                const result = await loadAdminProfile(currentUser, async (uid) => {
                    const snap = await getDoc(doc(db, 'adminUsers', uid));
                    return snap.exists() ? snap.data() as Partial<AdminProfile> : null;
                });
                if (eventId !== latestEvent) return;
                setAdminProfile(result.profile);
                setAuthError(result.failure);
            } catch (error) {
                if (eventId !== latestEvent) return;
                console.error('No se pudo leer el perfil Admin en Firestore:', error);
                // Deny by default and expose the Firestore error separately from Auth errors.
                setAdminProfile(null);
                setAuthError(profileReadFailure(error));
            } finally {
                if (eventId === latestEvent) setIsLoading(false);
            }
        });
        return () => {
            latestEvent += 1;
            unsubscribe();
        };
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
        setAuthError(null);
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const logout = async () => {
        await signOut(auth);
        setAdminProfile(null);
        setAuthError(null);
        setIsEditMode(false);
        sessionStorage.removeItem('briz_edit_mode');
    };

    const isAdmin = !!user && !!adminProfile && adminProfile.active === true;

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
            isLoading,
            authError,
            clearAuthError: () => setAuthError(null)
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// The hook intentionally shares this module with its provider/context; it is not a component export.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
