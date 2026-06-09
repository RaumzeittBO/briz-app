import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Camera, Upload, ShieldCheck, Mail, Lock, User, 
    Globe, MapPin, Search, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/context/StoreContext';

interface CustomerAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CustomerAuthModal({ isOpen, onClose, onSuccess }: CustomerAuthModalProps) {
    const { loginCustomer, registerCustomer } = useStore();
    
    // Auth Mode: 'login' | 'register'
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Common fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);

    // Register-specific fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [ci, setCi] = useState('');
    const [nationality, setNationality] = useState('Boliviana');
    const [department, setDepartment] = useState('Cochabamba');
    const [referral, setReferral] = useState('Google');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Selfie Capture states
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null); // base64 URL for preview
    const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // ID Document upload states
    const [docFile, setDocFile] = useState<File | null>(null);
    const docInputRef = useRef<HTMLInputElement | null>(null);

    // Reset fields on modal toggle or close
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setError(null);
            setSuccessMessage(null);
            setCapturedSelfie(null);
            setSelfieBlob(null);
            setDocFile(null);
            setLoading(false);
        }
    }, [isOpen]);

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Camera WebAPI controllers
    const startCamera = async () => {
        setError(null);
        setCapturedSelfie(null);
        setSelfieBlob(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: 400, height: 400 } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
        } catch (err) {
            console.error("Camera access blocked:", err);
            setError("No se pudo acceder a la cámara. Por favor otorga permisos o intenta en otro navegador.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Draw a square frame to match preview
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                const sx = (video.videoWidth - size) / 2;
                const sy = (video.videoHeight - size) / 2;
                ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                setCapturedSelfie(dataUrl);
                
                // Convert to Blob for Firebase upload
                canvas.toBlob((blob) => {
                    if (blob) setSelfieBlob(blob);
                }, 'image/jpeg', 0.95);
                
                stopCamera();
            }
        }
    };

    // Helper to convert base64 image if captured from cameras
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setDocFile(e.target.files[0]);
        }
    };

    // Submitting handlers
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            const customer = await loginCustomer(email, password, remember);
            if (customer) {
                setSuccessMessage(`¡Bienvenido de vuelta, ${customer.name}!`);
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    onClose();
                }, 1500);
            } else {
                setError("Correo electrónico o contraseña incorrectos. Revisa e intenta nuevamente.");
            }
        } catch (err) {
            console.error(err);
            setError("Ocurrió un error inesperado al intentar iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Validations
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (!selfieBlob) {
            setError("Por favor tómate una foto de rostro (Autofoto) para completar tu registro.");
            return;
        }

        if (!docFile) {
            setError("Por favor sube una foto o PDF de tu documento de identidad (C.I., D.N.I. o Pasaporte).");
            return;
        }

        setLoading(true);
        
        try {
            const customerData = {
                name,
                phone: phone.startsWith('+591') ? phone : `+591${phone}`,
                ci,
                email,
                password,
                nacionalidad: nationality,
                departamento: nationality.toLowerCase() === 'boliviana' ? department : '',
                comoNosConociste: referral
            };

            await registerCustomer(customerData, selfieBlob, docFile, remember);
            setSuccessMessage("¡Tu cuenta ha sido creada con éxito! Iniciando sesión...");
            
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1800);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "No se pudo registrar tu usuario. Verifica si el correo ya está registrado.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setError(null);
        setMode(prev => prev === 'login' ? 'register' : 'login');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-xl w-[95vw] max-h-[92vh] overflow-y-auto bg-brand-charcoal border border-white/10 text-white rounded-3xl p-0 shadow-2xl">
                
                {/* Custom Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute right-4 top-4 z-50 p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Form header */}
                <div className="p-8 pb-5 border-b border-white/5 flex flex-col items-center justify-center bg-black/10">
                    <img src="/logo_bicicleta_principal.png" alt="Briz logo" className="h-14 w-auto object-contain brightness-0 invert mb-3" />
                    <DialogTitle className="text-2xl font-tan uppercase tracking-wide text-brand-yellow">
                        {mode === 'login' ? 'INICIAR SESIÓN' : 'REGÍSTRATE EN BRIZ'}
                    </DialogTitle>
                    <p className="text-[11px] font-maiandra text-white/50 uppercase tracking-widest mt-1">
                        {mode === 'login' ? 'Ingresa para rentar tu bicicleta' : 'Sigue los pasos y regístrate en nuestro sistema'}
                    </p>
                </div>

                <div className="p-6 sm:p-8">
                    {/* Error & Success Messages */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3 text-xs font-semibold"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-5 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex items-center gap-3 text-xs font-semibold"
                            >
                                <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
                                <span>{successMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form Layouts */}
                    {mode === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Correo Electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input 
                                        type="email" 
                                        required 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="ejemplo@briz.com" 
                                        className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input 
                                        type="password" 
                                        required 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="remember" 
                                    checked={remember} 
                                    onCheckedChange={(v) => setRemember(Boolean(v))}
                                    className="border-white/20 data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow data-[state=checked]:text-brand-black"
                                />
                                <Label htmlFor="remember" className="text-xs text-white/60 font-medium cursor-pointer font-maiandra">Recordar usuario para futuras visitas</Label>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl h-12 uppercase text-xs tracking-widest transition-all mt-4 font-cocon shadow-lg shadow-brand-yellow/10"
                            >
                                {loading ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
                            </Button>

                            <div className="text-center pt-3 border-t border-white/5 mt-4">
                                <p className="text-xs text-white/40 font-medium font-maiandra">¿No tienes una cuenta aún?</p>
                                <Button 
                                    type="button" 
                                    onClick={toggleMode} 
                                    className="mt-2 bg-white/5 hover:bg-brand-yellow hover:text-brand-black text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest px-6 w-full sm:w-auto font-cocon transition-all"
                                >
                                    USUARIO NUEVO / REGISTRARSE
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-6">
                            
                            {/* CAMERA SELFIE STEP */}
                            <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col items-center">
                                <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-tangkiwood">1. Autofoto (Tu Rostro)</Label>
                                
                                <div className="relative w-40 h-40 bg-black/40 border border-white/10 rounded-full overflow-hidden flex items-center justify-center shadow-inner">
                                    {capturedSelfie ? (
                                        <img src={capturedSelfie} className="w-full h-full object-cover" alt="Selfie" />
                                    ) : cameraActive ? (
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                                    ) : (
                                        <Camera className="w-10 h-10 text-white/20" />
                                    )}

                                    {/* Canvas hidden for capture */}
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>

                                <div className="flex gap-2">
                                    {!cameraActive && !capturedSelfie && (
                                        <Button type="button" onClick={startCamera} size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/85 font-black text-[10px] px-4 py-2 rounded-lg font-cocon">
                                            <Camera className="w-3.5 h-3.5 mr-1" /> Activar Cámara
                                        </Button>
                                    )}
                                    {cameraActive && (
                                        <Button type="button" onClick={capturePhoto} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] px-4 py-2 rounded-lg font-cocon">
                                            ✓ Tomar Foto
                                        </Button>
                                    )}
                                    {(capturedSelfie || cameraActive) && (
                                        <Button type="button" onClick={() => { stopCamera(); setCapturedSelfie(null); setSelfieBlob(null); }} size="sm" className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] px-4 py-2 rounded-lg font-cocon">
                                            Reiniciar
                                        </Button>
                                    )}
                                </div>
                                <span className="text-[9px] text-white/30 font-maiandra uppercase text-center mt-1">Toma una foto clara para validar tu identidad.</span>
                            </div>

                            {/* ID DOCUMENT STEP */}
                            <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-white/5">
                                <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-tangkiwood">2. Documento de Identificación</Label>
                                <div 
                                    onClick={() => docInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 hover:border-brand-yellow/50 bg-black/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
                                >
                                    <Upload className="w-8 h-8 text-white/20 group-hover:text-brand-yellow transition-colors mb-2" />
                                    {docFile ? (
                                        <div className="text-xs font-bold text-brand-yellow truncate max-w-full">
                                            📄 {docFile.name} ({(docFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-xs font-bold text-white/60 font-maiandra">Sube una foto o documento PDF</div>
                                            <div className="text-[9px] text-white/30 uppercase mt-1 font-maiandra">C.I. / Pasaporte / Licencia (Max. 5MB)</div>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={docInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/*,application/pdf" 
                                        className="hidden" 
                                    />
                                </div>
                            </div>

                            {/* ACCOUNT DATA FORM */}
                            <div className="space-y-4">
                                <Label className="text-[10px] text-brand-yellow font-black uppercase tracking-widest font-tangkiwood">3. Datos Personales y de Cuenta</Label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Nombre Completo</Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <Input required value={name} onChange={e=>setName(e.target.value)} placeholder="Juan Pérez" className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Número de WhatsApp</Label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-4 flex items-center gap-1 text-white/40 font-black text-xs font-cocon pointer-events-none select-none">
                                                🇧🇴 +591
                                            </div>
                                            <Input required type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g, ''))} placeholder="77889900" className="pl-16 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">CI / Pasaporte / Documento</Label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <Input required value={ci} onChange={e=>setCi(e.target.value)} placeholder="1234567 LP" className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Correo Electrónico</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <Input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="cliente@briz.com" className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Nacionalidad</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <Input required value={nationality} onChange={e=>setNationality(e.target.value)} placeholder="Boliviana" className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon" />
                                        </div>
                                    </div>
                                    
                                    {nationality.toLowerCase() === 'boliviana' && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Departamento</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                                                <select 
                                                    value={department} 
                                                    onChange={e => setDepartment(e.target.value)} 
                                                    className="w-full pl-12 pr-4 bg-black/30 border border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-cocon appearance-none"
                                                >
                                                    {['Cochabamba', 'La Paz', 'Santa Cruz', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'].map(d => (
                                                        <option key={d} value={d} className="bg-brand-charcoal text-white">{d}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">▼</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Contraseña</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <Input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 caracteres" className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">Confirmar Contraseña</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <Input required type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" className="pl-12 bg-black/30 border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow font-cocon" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-maiandra">¿Cómo nos conociste?</Label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                                        <select 
                                            value={referral} 
                                            onChange={e => setReferral(e.target.value)} 
                                            className="w-full pl-12 pr-4 bg-black/30 border border-white/10 h-12 text-sm text-white font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-cocon appearance-none"
                                        >
                                            {['Google', 'Referencia en la web', 'TikTok', 'Instagram', 'Facebook', 'Por referencia de algún (a) conocido (a)', 'Otro'].map(r => (
                                                <option key={r} value={r} className="bg-brand-charcoal text-white">{r}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">▼</div>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl h-12 uppercase text-xs tracking-widest transition-all mt-4 font-cocon shadow-lg shadow-brand-yellow/10"
                            >
                                {loading ? 'Creando cuenta y subiendo archivos...' : 'CREAR MI CUENTA'}
                            </Button>

                            <div className="text-center pt-3 border-t border-white/5">
                                <p className="text-xs text-white/40 font-medium font-maiandra">¿Ya estás registrado?</p>
                                <Button 
                                    type="button" 
                                    onClick={toggleMode} 
                                    className="mt-2 bg-white/5 hover:bg-brand-yellow hover:text-brand-black text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest px-6 w-full sm:w-auto font-cocon transition-all"
                                >
                                    VOLVER A INICIAR SESIÓN
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
