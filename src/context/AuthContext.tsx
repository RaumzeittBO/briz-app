import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    type User
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isEditMode: boolean;
    setEditMode: (mode: boolean) => void;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(() => {
        return sessionStorage.getItem('briz_edit_mode') === 'true';
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
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
        setIsEditMode(false);
        sessionStorage.removeItem('briz_edit_mode');
    };

    return (
        <AuthContext.Provider value={{ 
            user,
            isAuthenticated: !!user, 
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
