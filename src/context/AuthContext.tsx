import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    type User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';

interface AdminProfile {
    uid: string;
    email: string;
    name?: string;
    role: 'admin';
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
                        const data = snap.data() as AdminProfile;
                        setAdminProfile({
                            uid: currentUser.uid,
                            email: data.email || currentUser.email || '',
                            name: data.name,
                            role: data.role || 'admin',
                            active: data.active !== false
                        });
                    } else {
                        // Compatibilidad: el proyecto ya usaba Firebase Auth como lista de admins.
                        // Al primer ingreso, el usuario Auth existente queda registrado como admin formal.
                        const legacyAdmin: AdminProfile = {
                            uid: currentUser.uid,
                            email: currentUser.email || '',
                            name: currentUser.displayName || 'Administrador',
                            role: 'admin',
                            active: true
                        };
                        await setDoc(adminRef, {
                            ...legacyAdmin,
                            createdAt: serverTimestamp(),
                            createdBy: 'legacy-auth-bootstrap',
                            bootstrap: true
                        });
                        setAdminProfile(legacyAdmin);
                    }
                }
            } catch (error) {
                console.error('No se pudo verificar el rol admin:', error);
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

    const isAdmin = !!user && !!adminProfile && adminProfile.active !== false && adminProfile.role === 'admin';

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
