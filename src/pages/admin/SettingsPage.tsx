import { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut as signOutSecondary } from 'firebase/auth';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Bell, Shield, Globe, CreditCard, Upload, Check, UserPlus, KeyRound, Mail, Users } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { auth, db, firebaseConfig } from '@/lib/firebase';

interface AdminUserRecord {
    uid: string;
    email: string;
    name?: string;
    role: 'admin';
    active: boolean;
    createdAt?: unknown;
}

export default function SettingsPage() {
    const { rentalSettings, updateRentalSettings } = useStore();
    const { user } = useAuth();
    
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
        const unsubAdmins = onSnapshot(collection(db, 'adminUsers'), (snap) => {
            setAdmins(snap.docs.map(item => ({ uid: item.id, ...(item.data() as Omit<AdminUserRecord, 'uid'>) })));
        });
        const unsubSecurity = onSnapshot(doc(db, 'settings', 'admin_security'), (snap) => {
            if (snap.exists()) setAdminPin(String(snap.data().pin || '1234'));
        });
        return () => {
            unsubAdmins();
            unsubSecurity();
        };
    }, []);

    const getSecondaryAuth = () => {
        const secondaryApp = getApps().some(app => app.name === 'briz-admin-creator')
            ? getApp('briz-admin-creator')
            : initializeApp(firebaseConfig, 'briz-admin-creator');
        return getAuth(secondaryApp);
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
        try {
            if (adminPassword.length < 6) {
                throw new Error('La contraseña temporal debe tener al menos 6 caracteres.');
            }
            const secondaryAuth = getSecondaryAuth();
            const credential = await createUserWithEmailAndPassword(secondaryAuth, adminEmail.trim(), adminPassword);
            await setDoc(doc(db, 'adminUsers', credential.user.uid), {
                uid: credential.user.uid,
                email: adminEmail.trim().toLowerCase(),
                name: adminName.trim() || 'Administrador',
                role: 'admin',
                active: true,
                createdAt: serverTimestamp(),
                createdBy: user?.email || 'admin'
            });
            await signOutSecondary(secondaryAuth);
            setAdminName('');
            setAdminEmail('');
            setAdminPassword('');
            setAdminMessage('Admin creado. Ya puede entrar con ese correo y contraseña temporal.');
        } catch (error) {
            setAdminMessage(error instanceof Error ? error.message : 'No se pudo crear el usuario admin.');
        } finally {
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
        await updateDoc(doc(db, 'adminUsers', admin.uid), {
            active: !admin.active,
            updatedAt: serverTimestamp(),
            updatedBy: user?.email || 'admin'
        });
        setAdminMessage(admin.active ? 'Admin desactivado.' : 'Admin activado.');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setQrFile(file);
            setQrPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveRentalSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        try {
            await updateRentalSettings({
                bankName,
                accountNumber,
                accountOwner,
                ownerCI
            }, qrFile);
            setSuccessMessage('Configuración de pagos de alquiler guardada con éxito.');
            setQrFile(null);
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Error al guardar la configuración de pagos.');
        } finally {
            setSaving(false);
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
                                    {admins.map(admin => (
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
                                    {admins.length === 0 && <p className="text-sm font-bold text-white/35">Aún no hay admins registrados en la colección de roles.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {adminMessage && <p className="rounded-2xl bg-brand-yellow/10 px-4 py-3 text-xs font-black text-brand-yellow">{adminMessage}</p>}
                </CardContent>
            </Card>

            {/* Business info */}
            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] shadow-xl overflow-hidden group">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-yellow/30" /> Información del Negocio
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Nombre del negocio</Label>
                            <Input defaultValue="Briz" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Teléfono Principal</Label>
                            <Input defaultValue="+591 77860277" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Dirección Física</Label>
                        <Input defaultValue="Av. Heroínas #1234, Cochabamba, Bolivia" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Email de Contacto</Label>
                            <Input defaultValue="hola@briz.bo" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Enlace WhatsApp</Label>
                            <Input defaultValue="+59177860277" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                    </div>
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
                                        Formatos soportados: JPG, PNG. Máx. 3MB.
                                    </p>
                                    <div className="relative inline-block">
                                        <input 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            accept="image/*" 
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
                            <div className="flex-1" />
                            <Button 
                                type="submit" 
                                disabled={saving}
                                className="bg-brand-yellow text-brand-black hover:bg-white font-black h-12 px-8 rounded-full shadow-lg transition-all cursor-pointer"
                            >
                                {saving ? 'Guardando...' : 'Guardar Información de Pago'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Hours */}
            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] shadow-xl overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-brand-yellow/30" /> Horarios de Atención
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Lunes a Sábado</Label>
                            <Input defaultValue="08:00 - 19:00" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Domingo</Label>
                            <Input defaultValue="09:00 - 14:00" className="h-12 bg-black/40 border-white/5 rounded-xl text-white font-bold focus:ring-brand-yellow/50" />
                        </div>
                    </div>
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
                        { label: 'Nuevas reservas', desc: 'Alertas en tiempo real por cada reserva entrante.' },
                        { label: 'Stock bajo', desc: 'Notificar cuando los productos bajen del nivel mínimo.' },
                        { label: 'Alquiler atrasado', desc: 'Recordatorios automáticos de devoluciones pendientes.' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-colors group">
                            <div>
                                <p className="text-white font-black text-sm">{item.label}</p>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{item.desc}</p>
                            </div>
                            <div className="w-12 h-6 bg-white/5 rounded-full cursor-pointer relative group-hover:bg-white/10 transition-colors">
                                <div className="w-4 h-4 bg-brand-yellow rounded-full absolute top-1 right-1 shadow-lg shadow-brand-yellow/20" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Button className="bg-white text-brand-black hover:bg-brand-yellow font-black h-14 px-10 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                <Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" strokeWidth={3} /> Guardar Configuración
            </Button>
        </div>
    );
}
