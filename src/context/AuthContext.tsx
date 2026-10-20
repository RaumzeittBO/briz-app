import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
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
                        const normalizedRole: AdminRole = ALLOWED_ROLES.includes(data.role as AdminRole)
                            ? (data.role as AdminRole)
                            : 'admin';
                        setAdminProfile({
                            uid: currentUser.uid,
                            email: data.email || currentUser.email || '',
                            name: data.name || currentUser.displayName || 'Administrador',
                            role: normalizedRole,
                            store: data.store || 'all',
                            active: data.active !== false
                        });
                    } else if (currentUser.email) {
                        // Look up by email in case the admin was pre-registered from SettingsPage with a custom ID
                        const emailLower = currentUser.email.toLowerCase().trim();
                        const qEmail = query(collection(db, 'adminUsers'), where('email', '==', emailLower));
                        const emailSnap = await getDocs(qEmail);

                        if (!emailSnap.empty) {
                            const matchedDoc = emailSnap.docs[0];
                            const data = matchedDoc.data() as Partial<AdminProfile>;
                            const normalizedRole: AdminRole = ALLOWED_ROLES.includes(data.role as AdminRole)
                                ? (data.role as AdminRole)
                                : 'admin';
                            const profile: AdminProfile = {
                                uid: currentUser.uid,
                                email: data.email || emailLower,
                                name: data.name || currentUser.displayName || 'Administrador',
                                role: normalizedRole,
                                store: data.store || 'all',
                                active: data.active !== false
                            };
                            setAdminProfile(profile);
                            // Mirror under adminUsers/{uid} so Firestore security rules can verify by UID
                            if (profile.active) {
                                await setDoc(adminRef, {
                                    ...data,
                                    uid: currentUser.uid,
                                    email: profile.email,
                                    role: profile.role,
                                    active: profile.active
                                }, { merge: true }).catch(() => undefined);
                            }
                        } else {
                            // Safe initial owner bootstrap: only grant admin if adminUsers collection is completely empty
                            const allAdminsSnap = await getDocs(collection(db, 'adminUsers'));
                            if (allAdminsSnap.empty) {
                                const bootstrapProfile: AdminProfile = {
                                    uid: currentUser.uid,
                                    email: emailLower,
                                    name: currentUser.displayName || 'Administrador Principal',
                                    role: 'admin',
                                    store: 'all',
                                    active: true
                                };
                                await setDoc(adminRef, {
                                    ...bootstrapProfile,
                                    createdAt: new Date().toISOString()
                                }, { merge: true }).catch(() => undefined);
                                setAdminProfile(bootstrapProfile);
                            } else {
                                console.warn('Usuario autenticado sin registro en adminUsers:', currentUser.email);
                                setAdminProfile(null);
                            }
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
