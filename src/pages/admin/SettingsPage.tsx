import { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut as signOutSecondary, type Auth } from 'firebase/auth';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Bell, Shield, Globe, CreditCard, Upload, Check, UserPlus, KeyRound, Mail, Users } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { auth, db, firebaseConfig, isFirebaseEmulatorEnabled } from '@/lib/firebase';
import { provisionAdminUser } from '@/lib/backend';
import { BUSINESS_DAY_KEYS, BUSINESS_DAY_LABELS, DEFAULT_PUBLIC_BUSINESS_CONFIG, validatePublicBusinessConfig, type PublicBusinessConfig, type PublicBusinessConfigUpdate } from '@/lib/businessConfig';

interface AdminUserRecord {
    uid: string;
    email: string;
    name?: string;
    role: 'admin';
    active: boolean;
    createdAt?: unknown;
    source?: 'firestore' | 'local';
}

const connectedSecondaryAuth = new WeakSet<Auth>();

export default function SettingsPage() {
    const { rentalSettings, rentalSettingsLoaded, rentalSettingsLoadError, updateRentalSettings, publicBusinessConfig, updatePublicBusinessConfig } = useStore();
    const { user, isAdmin } = useAuth();
    
    const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
    const [adminPin, setAdminPin] = useState('1234');
    const [pinInput, setPinInput] = useState('');
    const [pinUnlocked, setPinUnlocked] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminMessage, setAdminMessage] = useState('');
    const [adminSaving, setAdminSaving] = useState(false);
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountOwner, setAccountOwner] = useState('');
    const [ownerCI, setOwnerCI] = useState('');
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [businessDraft, setBusinessDraft] = useState<PublicBusinessConfig>(DEFAULT_PUBLIC_BUSINESS_CONFIG);
    const [businessBase, setBusinessBase] = useState<PublicBusinessConfig>(DEFAULT_PUBLIC_BUSINESS_CONFIG);
    const [businessDirty, setBusinessDirty] = useState(false);
    const [businessSaving, setBusinessSaving] = useState(false);
    const [businessMessage, setBusinessMessage] = useState('');
    const [businessError, setBusinessError] = useState('');

    useEffect(() => {
        if (rentalSettings) {
            setBankName(rentalSettings.bankName || '');
            setAccountNumber(rentalSettings.accountNumber || '');
            setAccountOwner(rentalSettings.accountOwner || '');
            setOwnerCI(rentalSettings.ownerCI || '');
            setQrPreview(rentalSettings.qrCodeUrl || '');
        }
    }, [rentalSettings]);

    useEffect(() => {
        if (!businessDirty) {
            setBusinessDraft(publicBusinessConfig);
            setBusinessBase(publicBusinessConfig);
        }
    }, [businessDirty, publicBusinessConfig]);

    useEffect(() => () => {
        if (qrPreview.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
    }, [qrPreview]);

    useEffect(() => {
        if (!isAdmin) return;
        const unsubAdmins = onSnapshot(collection(db, 'adminUsers'), (snap) => {
            setAdmins(snap.docs.map(item => ({ uid: item.id, ...(item.data() as Omit<AdminUserRecord, 'uid'>), source: 'firestore' })));
        }, (error) => {
            console.warn('No se pudo leer adminUsers:', error);
            setAdminMessage('No se pudo leer la lista Firestore de admins. La lista local seguirá funcionando.');
        });
        const unsubSecurity = onSnapshot(doc(db, 'settings', 'admin_security'), (snap) => {
            if (snap.exists()) setAdminPin(String(snap.data().pin || '1234'));
        }, (error) => {
            console.warn('No se pudo leer admin_security:', error);
        });
        return () => {
            unsubAdmins();
            unsubSecurity();
        };
    }, [isAdmin]);

    const displayedAdmins = admins;

    const getSecondaryAuth = () => {
        const secondaryApp = getApps().some(app => app.name === 'briz-admin-creator')
            ? getApp('briz-admin-creator')
            : initializeApp(firebaseConfig, 'briz-admin-creator');
        const secondaryAuth = getAuth(secondaryApp);
        if (isFirebaseEmulatorEnabled && !connectedSecondaryAuth.has(secondaryAuth)) {
            connectAuthEmulator(secondaryAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
            connectedSecondaryAuth.add(secondaryAuth);
        }
        return secondaryAuth;
    };

    const handleUnlockAdmins = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput.trim() === adminPin) {
            setPinUnlocked(true);
            setPinInput('');
            setAdminMessage('');
        } else {
            setAdminMessage('PIN incorrecto. Intenta nuevamente.');
        }
    };

    const handleChangePin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.trim().length < 4) {
            setAdminMessage('El PIN debe tener al menos 4 dígitos o caracteres.');
            return;
        }
        await setDoc(doc(db, 'settings', 'admin_security'), {
            pin: newPin.trim(),
            updatedAt: serverTimestamp(),
            updatedBy: user?.email || 'admin'
        }, { merge: true });
        setAdminPin(newPin.trim());
        setNewPin('');
        setAdminMessage('PIN actualizado correctamente.');
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminSaving(true);
        setAdminMessage('');
        let secondaryAuth: Auth | null = null;
        try {
            if (adminPassword.length < 6) {
                throw new Error('La contraseña temporal debe tener al menos 6 caracteres.');
            }
            secondaryAuth = getSecondaryAuth();
            const credential = await createUserWithEmailAndPassword(secondaryAuth, adminEmail.trim(), adminPassword);
            const createdAdmin: AdminUserRecord = {
                uid: credential.user.uid,
                email: adminEmail.trim().toLowerCase(),
                name: adminName.trim() || 'Administrador',
                role: 'admin',
                active: true
            };
            await provisionAdminUser({ uid: createdAdmin.uid, role: 'admin', name: createdAdmin.name, active: true });
            setAdminName('');
            setAdminEmail('');
            setAdminPassword('');
            setAdminMessage('Admin creado. Ya puede entrar con ese correo y contraseña temporal.');
        } catch (error) {
            const errorCode = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
            if (errorCode === 'auth/email-already-in-use') setAdminMessage('Ese correo ya existe en Firebase Authentication. No se creó un perfil local; revisa la lista sincronizada o usa recuperación de contraseña.');
            else setAdminMessage(error instanceof Error ? error.message : 'No se pudo crear el usuario admin. Si Firebase Auth alcanzó a crear la cuenta, falta completar su perfil con soporte.');
        } finally {
            if (secondaryAuth?.currentUser) await signOutSecondary(secondaryAuth).catch(() => undefined);
            setAdminSaving(false);
        }
    };

    const handleSendReset = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
        setAdminMessage(`Correo de recuperación enviado a ${email}.`);
    };

    const handleToggleAdmin = async (admin: AdminUserRecord) => {
        if (admin.uid === user?.uid) {
            setAdminMessage('No puedes desactivar tu propio usuario mientras estás conectado.');
            return;
        }
        try {
            await provisionAdminUser({ uid: admin.uid, role: admin.role, name: admin.name, active: !admin.active });
            setAdminMessage(admin.active ? 'Perfil administrador desactivado.' : 'Perfil administrador activado.');
        } catch (error) {
            setAdminMessage(error instanceof Error ? error.message : 'No se pudo actualizar el perfil administrador.');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 3 * 1024 * 1024) {
                setPaymentError('El QR debe ser JPG, PNG o WebP y pesar como máximo 3 MB. El archivo anterior se conserva.');
                if (qrPreview.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
                setQrFile(null);
                setQrPreview(rentalSettings.qrCodeUrl || '');
                e.target.value = '';
                return;
            }
            if (qrPreview.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
            setQrFile(file);
            setQrPreview(URL.createObjectURL(file));
            setPaymentError('');
        }
    };

    const handleSaveRentalSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving || !rentalSettingsLoaded) return;
        setSaving(true);
        setSuccessMessage('');
        setPaymentError('');
        try {
            const savedSettings = await updateRentalSettings({
                bankName,
                accountNumber,
                accountOwner,
                ownerCI
            }, qrFile);
            setSuccessMessage('Configuración de pagos de alquiler guardada con éxito.');
            if (qrPreview.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
            setQrPreview(savedSettings.qrCodeUrl || '');
            setQrFile(null);
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error(error);
            setPaymentError(error instanceof Error ? error.message : 'Error al guardar la configuración de pagos.');
            if (qrPreview.startsWith('blob:')) URL.revokeObjectURL(qrPreview);
            setQrPreview(rentalSettings.qrCodeUrl || '');
            setQrFile(null);
        } finally {
            setSaving(false);
        }
    };

    const updateBusinessDraft = (patch: Partial<PublicBusinessConfig>) => {
        setBusinessDirty(true);
        setBusinessMessage('');
        setBusinessError('');
        setBusinessDraft(current => ({ ...current, ...patch }));
    };

    const updateBusinessDay = (dayKey: typeof BUSINESS_DAY_KEYS[number], day: PublicBusinessConfig['hours'][typeof BUSINESS_DAY_KEYS[number]]) => {
        updateBusinessDraft({ hours: { ...businessDraft.hours, [dayKey]: day } });
    };

    const handleSaveBusiness = async (event: React.FormEvent) => {
        event.preventDefault();
        if (businessSaving) return;
        const validationError = validatePublicBusinessConfig(businessDraft);
        if (validationError) {
            setBusinessError(validationError);
            setBusinessMessage('');
            return;
        }
        setBusinessSaving(true);
        setBusinessMessage('');
        setBusinessError('');
        try {
            const updates: PublicBusinessConfigUpdate = {};
            (['businessName', 'phone', 'address', 'email', 'whatsapp'] as const).forEach(field => {
                if (businessDraft[field] !== businessBase[field]) updates[field] = businessDraft[field];
            });
            const changedHours = Object.fromEntries(BUSINESS_DAY_KEYS
                .filter(day => JSON.stringify(businessDraft.hours[day]) !== JSON.stringify(businessBase.hours[day]))
                .map(day => [day, businessDraft.hours[day]]));
            if (Object.keys(changedHours).length > 0) updates.hours = changedHours;
            if (Object.keys(updates).length === 0) {
                setBusinessDirty(false);
                setBusinessMessage('No hay cambios nuevos para guardar.');
                return;
            }
            await updatePublicBusinessConfig(updates);
            setBusinessBase(businessDraft);
            setBusinessDirty(false);
            setBusinessMessage('Configuración del negocio guardada correctamente.');
        } catch (error) {
            setBusinessError(error instanceof Error ? error.message : 'No se pudo guardar la configuración del negocio.');
        } finally {
            setBusinessSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 max-w-4xl">
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <Save className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Configuración
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Gestiona los parámetros globales de Briz.</p>
                </div>
            </div>

            {/* Admin users */}
            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] shadow-xl overflow-hidden group">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-brand-yellow/30" /> Usuarios administradores
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    {!pinUnlocked ? (
                        <form onSubmit={handleUnlockAdmins} className="max-w-md space-y-4 rounded-3xl border border-brand-yellow/15 bg-black/25 p-5">
                            <div className="flex items-start gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-yellow text-brand-black">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Acceso protegido por PIN</h3>
                                    <p className="mt-1 text-xs font-bold leading-relaxed text-white/35">
                                        Ingresa el PIN para crear administradores, activar/desactivar accesos o enviar recuperación de contraseña. PIN inicial: 1234.
                                    </p>
                                </div>
                            </div>
                            <Input
                                value={pinInput}
                                onChange={e => setPinInput(e.target.value)}
                                type="password"
                                placeholder="PIN de seguridad"
                                className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50"
                            />
                            <Button type="submit" className="bg-brand-yellow text-brand-black hover:bg-white font-black h-11 px-7 rounded-full">
                                Entrar al apartado
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                                <form onSubmit={handleCreateAdmin} className="space-y-4 rounded-3xl border border-brand-yellow/15 bg-black/25 p-5">
                                    <div className="flex items-center gap-3">
                                        <UserPlus className="h-5 w-5 text-brand-yellow" />
                                        <h3 className="text-lg font-black text-white">Crear nuevo admin</h3>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Nombre</Label>
                                            <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Ej. Dueño Briz" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Correo</Label>
                                            <Input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@briz.com" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Contraseña temporal</Label>
                                        <Input required type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">No se guarda ni se muestra después. Si la olvidan, envías recuperación por correo.</p>
                                    </div>
                                    <Button type="submit" disabled={adminSaving} className="bg-brand-yellow text-brand-black hover:bg-white font-black h-12 px-8 rounded-full">
                                        {adminSaving ? 'Creando...' : 'Crear usuario admin'}
                                    </Button>
                                </form>

                                <form onSubmit={handleChangePin} className="space-y-4 rounded-3xl border border-brand-yellow/15 bg-black/25 p-5">
                                    <div className="flex items-center gap-3">
                                        <KeyRound className="h-5 w-5 text-brand-yellow" />
                                        <h3 className="text-lg font-black text-white">Cambiar PIN</h3>
                                    </div>
                                    <Input value={newPin} onChange={e => setNewPin(e.target.value)} type="password" placeholder="Nuevo PIN" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                                    <Button type="submit" className="bg-white text-brand-black hover:bg-brand-yellow font-black h-11 px-7 rounded-full">
                                        Guardar nuevo PIN
                                    </Button>
                                </form>
                            </div>

                            <div className="rounded-3xl border border-brand-yellow/15 bg-black/25 p-5">
                                <div className="mb-4 flex items-center gap-3">
                                    <Users className="h-5 w-5 text-brand-yellow" />
                                    <h3 className="text-lg font-black text-white">Admins registrados</h3>
                                </div>
                                <div className="space-y-3">
                                    {displayedAdmins.map(admin => (
                                        <div key={admin.uid} className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="font-black text-white">{admin.name || 'Administrador'}</p>
                                                <p className="text-xs font-bold text-white/35">{admin.email}</p>
                                                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${admin.active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                                                    {admin.active ? 'Activo' : 'Desactivado'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" onClick={() => handleSendReset(admin.email)} className="bg-white/5 text-white hover:bg-brand-yellow hover:text-brand-black rounded-full h-10 px-4 text-xs font-black">
                                                    <Mail className="mr-2 h-4 w-4" /> Reset
                                                </Button>
                                                <Button type="button" onClick={() => handleToggleAdmin(admin)} className="bg-white/5 text-white hover:bg-brand-yellow hover:text-brand-black rounded-full h-10 px-4 text-xs font-black">
                                                    {admin.active ? 'Desactivar' : 'Activar'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {displayedAdmins.length === 0 && <p className="text-sm font-bold text-white/35">No hay perfiles administradores de Firebase para mostrar.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {adminMessage && <p className="rounded-2xl bg-brand-yellow/10 px-4 py-3 text-xs font-black text-brand-yellow">{adminMessage}</p>}
                </CardContent>
            </Card>

            {/* Business info */}
            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] shadow-xl overflow-hidden group">
                <CardHeader className="p-5 sm:p-8 border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-yellow/30" /> Información del Negocio
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-8">
                  <form onSubmit={handleSaveBusiness} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Nombre del negocio</Label>
                            <Input value={businessDraft.businessName} onChange={event => updateBusinessDraft({ businessName: event.target.value })} className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Teléfono Principal</Label>
                            <Input type="tel" value={businessDraft.phone} onChange={event => updateBusinessDraft({ phone: event.target.value })} className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Dirección Física</Label>
                        <Input value={businessDraft.address} onChange={event => updateBusinessDraft({ address: event.target.value })} className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Email de Contacto</Label>
                            <Input type="email" value={businessDraft.email} onChange={event => updateBusinessDraft({ email: event.target.value })} className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Enlace WhatsApp</Label>
                            <Input type="tel" value={businessDraft.whatsapp} onChange={event => updateBusinessDraft({ whatsapp: event.target.value })} className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                    </div>
                    <div className="space-y-4 border-t border-white/5 pt-5">
                        <div>
                            <h3 className="text-sm font-black text-white">Horarios de atención</h3>
                            <p className="mt-1 text-[11px] font-medium text-white/40">Configura cada día por separado, con horario continuo o dos turnos.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {BUSINESS_DAY_KEYS.map((dayKey, index) => {
                                const day = businessDraft.hours[dayKey];
                                const dayName = BUSINESS_DAY_LABELS.es[index];
                                const timeInputClass = 'h-11 min-w-0 w-full px-2 text-sm text-white';
                                return <div key={dayKey} role="group" aria-label={dayName} className="min-w-0 rounded-xl border border-white/5 bg-black/20 p-3 sm:p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h4 className="px-1 text-sm font-black text-white/90">{dayName}</h4>
                                        <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-bold text-white/65 hover:bg-white/5">
                                            <input type="checkbox" checked={day.closed} onChange={event => updateBusinessDay(dayKey, { ...day, closed: event.target.checked })} className="h-4 w-4 accent-[#FFD500]" />
                                            Cerrado todo el día
                                        </label>
                                    </div>
                                    {day.closed ? <p className="py-3 text-center text-xs font-semibold text-white/35">Cerrado</p> : <div className="mt-3 space-y-3">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-white/45">{day.secondShift ? 'Primer turno' : 'Horario'}</p>
                                            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2">
                                                <label className="min-w-0 space-y-1 text-[10px] font-semibold text-white/50">
                                                    <span>Abre</span>
                                                    <Input aria-label={`${dayName} abre primer turno`} type="time" value={day.open} disabled={day.closed} onChange={event => updateBusinessDay(dayKey, { ...day, open: event.target.value })} className={timeInputClass} />
                                                </label>
                                                <label className="min-w-0 space-y-1 text-[10px] font-semibold text-white/50">
                                                    <span>Cierra</span>
                                                    <Input aria-label={`${dayName} cierra primer turno`} type="time" value={day.close} disabled={day.closed} onChange={event => updateBusinessDay(dayKey, { ...day, close: event.target.value })} className={timeInputClass} />
                                                </label>
                                            </div>
                                        </div>
                                        <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-bold text-white/65 hover:bg-white/5">
                                            <input type="checkbox" checked={Boolean(day.secondShift)} disabled={day.closed} onChange={event => {
                                                if (event.target.checked) updateBusinessDay(dayKey, { ...day, secondShift: { open: '', close: '' } });
                                                else {
                                                    const continuousDay = { ...day };
                                                    delete continuousDay.secondShift;
                                                    updateBusinessDay(dayKey, continuousDay);
                                                }
                                            }} className="h-4 w-4 accent-[#FFD500] disabled:opacity-40" />
                                            Agregar segundo turno
                                        </label>
                                        {day.secondShift && <div className="space-y-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-white/45">Segundo turno</p>
                                            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2">
                                                <label className="min-w-0 space-y-1 text-[10px] font-semibold text-white/50">
                                                    <span>Reabre</span>
                                                    <Input aria-label={`${dayName} reabre segundo turno`} type="time" value={day.secondShift.open} disabled={day.closed} onChange={event => updateBusinessDay(dayKey, { ...day, secondShift: { ...day.secondShift!, open: event.target.value } })} className={timeInputClass} />
                                                </label>
                                                <label className="min-w-0 space-y-1 text-[10px] font-semibold text-white/50">
                                                    <span>Cierre final</span>
                                                    <Input aria-label={`${dayName} cierra segundo turno`} type="time" value={day.secondShift.close} disabled={day.closed} onChange={event => updateBusinessDay(dayKey, { ...day, secondShift: { ...day.secondShift!, close: event.target.value } })} className={timeInputClass} />
                                                </label>
                                            </div>
                                        </div>}
                                    </div>}
                                </div>;
                            })}
                        </div>
                    </div>
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-200">Excepciones fuera de horario</h3>
                        <p className="mt-2 text-xs leading-relaxed text-white/60">Deshabilitadas hasta que BRIZ apruebe sus condiciones. No se han definido minutos máximos, cantidad mínima, duraciones, sucursales, aprobadores ni cargos; por eso no se aceptan automáticamente reservas fuera del horario configurado. El cliente puede consultar por WhatsApp, sin crear una reserva. Cuando BRIZ defina esos límites, se podrá habilitar un flujo administrativo con aprobación y auditoría.</p>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center">
                        <p role="status" className="flex-1 text-xs font-bold text-emerald-300">{businessMessage}</p>
                        {businessError && <p role="alert" className="flex-1 text-xs font-bold text-red-300">{businessError}</p>}
                        <Button type="submit" disabled={businessSaving || !businessDirty} className="h-11 rounded-full bg-brand-yellow px-7 font-black text-brand-black hover:bg-white disabled:opacity-50">
                            {businessSaving ? 'Guardando…' : 'Guardar información del negocio'}
                        </Button>
                    </div>
                  </form>
                </CardContent>
            </Card>

            {/* Configuración de Alquileres e Info de Pago */}
            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] shadow-xl overflow-hidden group">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand-yellow/30" /> Configuración de Alquileres e Información de Pago
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSaveRentalSettings} className="space-y-6">
                        {!rentalSettingsLoaded && <p role={rentalSettingsLoadError ? 'alert' : 'status'} className={`text-xs font-bold ${rentalSettingsLoadError ? 'text-red-300' : 'text-white/40'}`}>{rentalSettingsLoadError || 'Cargando configuración actual de Firebase…'}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Banco</Label>
                                <Input 
                                    value={bankName} 
                                    onChange={e => setBankName(e.target.value)} 
                                    placeholder="Ej. BNB (Banco Nacional de Bolivia)"
                                    className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Número de Cuenta</Label>
                                <Input 
                                    value={accountNumber} 
                                    onChange={e => setAccountNumber(e.target.value)} 
                                    placeholder="Ej. 1500234567"
                                    className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" 
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Nombre del Titular</Label>
                                <Input 
                                    value={accountOwner} 
                                    onChange={e => setAccountOwner(e.target.value)} 
                                    placeholder="Ej. Briz S.R.L."
                                    className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">C.I. / NIT del Titular</Label>
                                <Input 
                                    value={ownerCI} 
                                    onChange={e => setOwnerCI(e.target.value)} 
                                    placeholder="Ej. 1234567 LP"
                                    className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" 
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Código QR para Pago Simple</Label>
                            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-black/30 border border-white/5">
                                <div className="w-32 h-32 bg-white/5 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shrink-0 relative group">
                                    {qrPreview ? (
                                        <img src={qrPreview} className="w-full h-full object-contain" alt="QR de Pago" />
                                    ) : (
                                        <span className="text-white/20 text-xs">Sin código QR</span>
                                    )}
                                </div>
                                <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                                    <h4 className="text-white font-bold text-sm">Sube la imagen de tu código QR</h4>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                        Formatos soportados: JPG, PNG o WebP. Máx. 3 MB.
                                    </p>
                                    <div className="relative inline-block">
                                        <input 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden" 
                                            id="qr-upload-input" 
                                        />
                                        <Button 
                                            type="button" 
                                            asChild
                                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl h-10 px-4 text-xs font-bold tracking-wider cursor-pointer"
                                        >
                                            <label htmlFor="qr-upload-input" className="flex items-center gap-2 cursor-pointer">
                                                <Upload className="w-4 h-4 text-brand-yellow" /> Seleccionar Imagen
                                            </label>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                            {successMessage && (
                                <p className="text-emerald-400 font-bold text-xs flex items-center gap-2">
                                    <Check className="w-4 h-4" /> {successMessage}
                                </p>
                            )}
                            {paymentError && <p role="alert" className="flex-1 text-xs font-bold text-red-300">{paymentError}</p>}
                            <div className="flex-1" />
                            <Button 
                                type="submit" 
                                disabled={saving || !rentalSettingsLoaded}
                                className="bg-brand-yellow text-brand-black hover:bg-white font-black h-12 px-8 rounded-full shadow-lg transition-all cursor-pointer"
                            >
                                    {saving ? 'Guardando...' : 'Guardar Información de Pago'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] shadow-xl overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-yellow/30" /> Preferencias del Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-2">
                    {[
                        { label: 'Nuevas reservas', desc: 'La notificación automática existente se gestiona en el backend; esta preferencia personal aún no está disponible.' },
                        { label: 'Stock bajo', desc: 'Próximamente: aún no existe una preferencia configurable para esta alerta.' },
                        { label: 'Alquiler atrasado', desc: 'Próximamente: aún no existe una preferencia configurable para este recordatorio.' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-colors group">
                            <div>
                                <p className="text-white font-black text-sm">{item.label}</p>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{item.desc}</p>
                            </div>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white/40">{item.label === 'Nuevas reservas' ? 'Backend' : 'Próximamente'}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

        </div>
    );
}
