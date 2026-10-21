import { useState, useRef, useEffect, useCallback } from 'react';
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
import { useLanguage } from '@/context/LanguageContext';

interface CustomerAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const COUNTRY_PREFIXES = [
    { code: '+591', flag: '🇧🇴', country: 'Bolivia' },
    { code: '+54', flag: '🇦🇷', country: 'Argentina' },
    { code: '+33', flag: '🇫🇷', country: 'Francia' },
    { code: '+55', flag: '🇧🇷', country: 'Brasil' },
    { code: '+51', flag: '🇵🇪', country: 'Perú' },
    { code: '+56', flag: '🇨🇱', country: 'Chile' },
    { code: '+1', flag: '🇺🇸', country: 'Estados Unidos' },
    { code: '+34', flag: '🇪🇸', country: 'España' },
    { code: '+49', flag: '🇩🇪', country: 'Alemania' },
    { code: '+57', flag: '🇨🇴', country: 'Colombia' },
    { code: '+44', flag: '🇬🇧', country: 'Reino Unido' },
    { code: '+39', flag: '🇮🇹', country: 'Italia' },
    { code: '+52', flag: '🇲🇽', country: 'México' },
    { code: '+595', flag: '🇵🇾', country: 'Paraguay' },
    { code: '+598', flag: '🇺🇾', country: 'Uruguay' },
    { code: '+593', flag: '🇪🇨', country: 'Ecuador' },
    { code: '+1', flag: '🇨🇦', country: 'Canadá' },
    { code: '+41', flag: '🇨🇭', country: 'Suiza' },
    { code: '+31', flag: '🇳🇱', country: 'Países Bajos' },
    { code: '+81', flag: '🇯🇵', country: 'Japón' },
    { code: '+86', flag: '🇨🇳', country: 'China' },
    { code: '+61', flag: '🇦🇺', country: 'Australia' },
    { code: '+58', flag: '🇻🇪', country: 'Venezuela' }
];

const POPULAR_COUNTRIES = [
    "Bolivia",
    "Argentina",
    "Francia",
    "Brasil",
    "Perú",
    "Chile",
    "Estados Unidos",
    "España",
    "Alemania",
    "Colombia",
    "Reino Unido",
    "Italia",
    "Paraguay",
    "Uruguay",
    "Ecuador",
    "Canadá",
    "Suiza",
    "Países Bajos",
    "Japón",
    "China",
    "Australia",
    "Venezuela"
];

const COUNTRIES_LIST = [
    "Bolivia",
    "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", 
    "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", 
    "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Bélgica", "Belice", 
    "Benín", "Bielorrusia", "Birmania", "Bosnia y Herzegovina", "Botsuana", 
    "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", 
    "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "República Centroafricana", 
    "Chad", "República Checa", "Chile", "China", "Chipre", "Colombia", "Comoras", 
    "República del Congo", "República Democrática del Congo", "Corea del Norte", 
    "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", 
    "Dinamarca", "Dominica", "República Dominicana", "Ecuador", "Egipto", 
    "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", 
    "España", "Estados Unidos", "Estonia", "Etiopía", "Filipinas", "Finlandia", 
    "Fiyi", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", 
    "Grecia", "Guatemala", "Guinea", "Guinea Ecuatorial", "Guyana", "Haití", 
    "Honduras", "Hungría", "India", "Indonesia", "Irak", "Irán", "Irlanda", 
    "Islandia", "Israel", "Italia", "Jamaica", "Japón", "Jordania", "Kazajistán", 
    "Kenia", "Kirguistán", "Kuwait", "Laos", "Lesoto", "Letonia", "Líbano", 
    "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo", "Macedonia del Norte", 
    "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", 
    "Mauricio", "Mauritania", "México", "Moldavia", "Mónaco", "Mongolia", 
    "Montenegro", "Mozambique", "Namibia", "Nepal", "Nicaragua", "Níger", 
    "Nigeria", "Noruega", "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", 
    "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", 
    "Reino Unido", "Ruanda", "Rumania", "Rusia", "Samoa", "San Cristóbal y Nieves", 
    "San Marino", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", 
    "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Suecia", "Suiza", 
    "Surinam", "Tailandia", "Taiwán", "Tanzania", "Tayikistán", "Togo", "Tonga", 
    "Trinidad y Tobago", "Túnez", "Turquía", "Ucrania", "Uganda", "Uruguay", 
    "Uzbekistán", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabue"
];

export default function CustomerAuthModal({ isOpen, onClose, onSuccess }: CustomerAuthModalProps) {
    const { loginCustomer, registerCustomer, verifyCustomerRecovery } = useStore();
    const { language } = useLanguage();
    
    // Auth Mode: 'login' | 'register' | 'forgot' | 'reset'
    const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
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
    const [countryPrefix, setCountryPrefix] = useState('+591');
    const [ci, setCi] = useState('');
    const [nationality, setNationality] = useState('Bolivia');
    const [department, setDepartment] = useState('Cochabamba');
    const [referral, setReferral] = useState('Google');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Recovery states
    const [recoveryEmail, setRecoveryEmail] = useState('');

    // Selfie Capture states
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null); // base64 URL for preview
    const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const selfieInputRef = useRef<HTMLInputElement | null>(null);
    const docAnversoInputRef = useRef<HTMLInputElement | null>(null);
    const docReversoInputRef = useRef<HTMLInputElement | null>(null);

    // Callback ref to bind stream and play video when the element mounts
    const videoRef = useCallback((node: HTMLVideoElement | null) => {
        videoElementRef.current = node;
        if (node && stream) {
            node.srcObject = stream;
            node.play().catch(err => {
                console.error("Error playing webcam stream:", err);
            });
        }
    }, [stream]);

    // ID Document upload states
    const [docFileAnverso, setDocFileAnverso] = useState<File | null>(null);
    const [docFileReverso, setDocFileReverso] = useState<File | null>(null);

    // Reset fields on modal toggle or close
    useEffect(() => {
        if (!isOpen) {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            setCameraActive(false);
            setError(null);
            setSuccessMessage(null);
            setCapturedSelfie(null);
            setSelfieBlob(null);
            setDocFileAnverso(null);
            setDocFileReverso(null);
            setLoading(false);
            setMode('login');
            setRecoveryEmail('');
        }
    }, [isOpen, stream]);

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Camera WebAPI controllers
    const startCamera = async () => {
        setError(null);
        setCapturedSelfie(null);
        setSelfieBlob(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
            });
            setStream(mediaStream);
            setCameraActive(true);
        } catch (err) {
            console.error("Camera access blocked:", err);
            setError("No se pudo acceder a la cámara. Por favor otorga permisos o intenta en otro navegador.");
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCameraActive(false);
    }, [stream]);

    const capturePhoto = () => {
        if (videoElementRef.current && canvasRef.current) {
            const video = videoElementRef.current;
            const canvas = canvasRef.current;
            
            const videoWidth = video.videoWidth || video.clientWidth || 640;
            const videoHeight = video.videoHeight || video.clientHeight || 480;
            const size = Math.min(videoWidth, videoHeight);
            
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                const sx = (videoWidth - size) / 2;
                const sy = (videoHeight - size) / 2;
                
                ctx.translate(size, 0);
                ctx.scale(-1, 1);
                
                ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
                
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                setCapturedSelfie(dataUrl);
                
                canvas.toBlob((blob) => {
                    if (blob) setSelfieBlob(blob);
                }, 'image/jpeg', 0.95);
                
                stopCamera();
            }
        }
    };

    const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelfieBlob(file);
            
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setCapturedSelfie(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileAnversoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setDocFileAnverso(e.target.files[0]);
        }
    };

    const handleFileReversoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setDocFileReverso(e.target.files[0]);
        }
    };

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
            setError(err instanceof Error ? err.message : "Ocurrió un error inesperado al intentar iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (!selfieBlob) {
            setError("Por favor tómate una foto o sube una foto de tu rostro para completar tu registro.");
            return;
        }

        if (!docFileAnverso) {
            setError("Por favor sube una foto de la parte frontal (anverso) de tu documento de identidad.");
            return;
        }

        if (!docFileReverso) {
            setError("Por favor sube una foto de la parte posterior (reverso) de tu documento de identidad.");
            return;
        }

        setLoading(true);
        
        try {
            const customerData = {
                name,
                phone: `${countryPrefix} ${phone}`,
                ci,
                email,
                password,
                nacionalidad: nationality,
                departamento: nationality.toLowerCase() === 'bolivia' ? department : '',
                comoNosConociste: referral
            };

            await registerCustomer(customerData, selfieBlob, docFileAnverso, docFileReverso, remember);
            setSuccessMessage("Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión.");
            setMode('login');
            setEmail(email.trim().toLowerCase());
            setPassword('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "No se pudo registrar tu usuario. Verifica si el correo ya está registrado.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            await verifyCustomerRecovery(recoveryEmail);
            setEmail(recoveryEmail.trim().toLowerCase());
            setMode('login');
            setSuccessMessage('Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.');
        } catch {
            setError("No se pudo verificar la cuenta en este momento.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMode('forgot');
    };

    const toggleMode = () => {
        setError(null);
        setMode(prev => prev === 'login' ? 'register' : 'login');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className={`${
                mode === 'register' 
                    ? 'max-w-xl sm:max-w-3xl lg:max-w-4xl' 
                    : 'max-w-md'
            } w-[95vw] max-h-[92vh] overflow-y-auto bg-brand-beige border border-brand-yellow/30 text-brand-black rounded-3xl p-0 shadow-2xl transition-all duration-300`}>
                
                {/* Custom Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute right-4 top-4 z-50 p-2 text-brand-charcoal/40 hover:text-brand-charcoal bg-black/5 hover:bg-black/10 rounded-full transition-all cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Form header */}
                <div className="p-8 pb-5 border-b border-brand-charcoal/5 flex flex-col items-center justify-center bg-brand-yellow/10">
                    <img src="/logoamarillo.png" alt="Briz logo" className="h-20 w-auto object-contain mb-3" />
                    <DialogTitle className="text-lg sm:text-xl md:text-2xl font-tangkiwood uppercase tracking-wide text-brand-charcoal text-center px-4 w-full break-words">
                        {mode === 'login' 
                            ? (language === 'es' ? 'INICIAR SESIÓN' : 'SIGN IN') 
                            : mode === 'register' 
                            ? (language === 'es' ? 'REGÍSTRATE EN BRIZ' : 'REGISTER AT BRIZ') 
                            : mode === 'forgot'
                            ? (language === 'es' ? 'RECUPERAR CONTRASEÑA' : 'RECOVER PASSWORD')
                            : (language === 'es' ? 'RESTABLECER CONTRASEÑA' : 'RESET PASSWORD')
                        }
                    </DialogTitle>
                    <p className="text-[11px] font-maiandra text-brand-charcoal/60 uppercase tracking-widest mt-1">
                        {mode === 'login' 
                            ? (language === 'es' ? 'Ingresa para rentar tu bicicleta' : 'Sign in to rent your bicycle') 
                            : mode === 'register'
                            ? (language === 'es' ? 'Sigue los pasos y regístrate en nuestro sistema' : 'Follow the steps to create your account')
                            : mode === 'forgot'
                            ? (language === 'es' ? 'Ingresa tus datos para validar tu perfil' : 'Enter your details to verify your profile')
                            : (language === 'es' ? 'Establece tu nueva contraseña de acceso' : 'Set your new account password')
                        }
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
                                className="mb-5 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-semibold"
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
                                className="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3 text-xs font-semibold"
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
                                <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                    <Input 
                                        type="email" 
                                        required 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="ejemplo@briz.com" 
                                        className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Contraseña' : 'Password'}</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                    <Input 
                                        type="password" 
                                        required 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-medium font-maiandra text-brand-charcoal/70">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="remember" 
                                        checked={remember} 
                                        onCheckedChange={(v) => setRemember(Boolean(v))}
                                        className="border-brand-charcoal/20 data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow data-[state=checked]:text-brand-black"
                                    />
                                    <Label htmlFor="remember" className="cursor-pointer">{language === 'es' ? 'Recordar usuario' : 'Remember me'}</Label>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => { setMode('forgot'); setError(null); setSuccessMessage(null); }}
                                    className="text-brand-yellow hover:underline font-bold"
                                >
                                    {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
                                </button>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl h-12 uppercase text-xs tracking-widest transition-all mt-4 font-sans shadow-lg shadow-brand-yellow/10 cursor-pointer"
                            >
                                {loading ? (language === 'es' ? 'Iniciando sesión...' : 'Signing in...') : (language === 'es' ? 'INICIAR SESIÓN' : 'SIGN IN')}
                            </Button>

                            <div className="text-center pt-3 border-t border-brand-charcoal/5 mt-4">
                                <p className="text-xs text-red-600 font-semibold font-maiandra">{language === 'es' ? '¿No tienes una cuenta aún?' : 'Don’t have an account yet?'}</p>
                                <Button 
                                    type="button" 
                                    onClick={toggleMode} 
                                    className="mt-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest px-6 w-full sm:w-auto font-sans transition-all border border-transparent cursor-pointer shadow-lg shadow-brand-orange/10"
                                >
                                    {language === 'es' ? 'USUARIO NUEVO / REGISTRARSE' : 'NEW USER / REGISTER'}
                                </Button>
                            </div>
                        </form>
                    ) : mode === 'register' ? (
                        <form onSubmit={handleRegisterSubmit} className="space-y-6">
                            
                            {/* CAMERA SELFIE STEP */}
                            <div className="space-y-3 bg-brand-yellow/5 p-5 rounded-2xl border border-brand-yellow/10 flex flex-col items-center">
                                <Label className="text-sm font-black uppercase tracking-wide text-brand-charcoal font-tangkiwood">{language === 'es' ? '1. Autofoto o Sube tu Foto' : '1. Selfie or Upload Your Photo'}</Label>
                                
                                <div className="relative w-48 h-48 bg-white border border-brand-charcoal/10 rounded-full overflow-hidden flex items-center justify-center shadow-inner">
                                    {capturedSelfie ? (
                                        <img src={capturedSelfie} className="w-full h-full object-cover" alt="Selfie" />
                                    ) : (
                                        <>
                                            {cameraActive && (
                                                <video 
                                                    ref={videoRef}
                                                    autoPlay 
                                                    playsInline 
                                                    muted 
                                                    className="w-full h-full object-cover scale-x-[-1]" 
                                                />
                                            )}
                                            {!cameraActive && (
                                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                                    <Camera className="w-8 h-8 text-brand-charcoal/30 mb-1" />
                                                    <span className="text-[10px] font-bold text-brand-charcoal/50 uppercase tracking-wider font-maiandra">
                                                        {language === 'es' ? 'Autofoto o Sube tu Foto' : 'Selfie or Upload Photo'}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Canvas hidden for capture */}
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>

                                <div className="flex gap-2">
                                    {!cameraActive && !capturedSelfie && (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button type="button" onClick={startCamera} size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/85 font-black text-[10px] px-4 py-2 rounded-lg font-sans cursor-pointer">
                                                <Camera className="w-3.5 h-3.5 mr-1" /> {language === 'es' ? 'Autofoto (Cámara)' : 'Selfie (Camera)'}
                                            </Button>
                                            <Button 
                                                type="button" 
                                                onClick={() => selfieInputRef.current?.click()} 
                                                size="sm" 
                                                className="bg-brand-charcoal hover:bg-brand-yellow hover:text-brand-black text-brand-yellow font-black text-[10px] px-4 py-2 rounded-lg font-sans cursor-pointer border border-transparent"
                                            >
                                                <Upload className="w-3.5 h-3.5 mr-1" /> {language === 'es' ? 'Sube tu Foto' : 'Upload Photo'}
                                            </Button>
                                            <input 
                                                type="file"
                                                ref={selfieInputRef}
                                                onChange={handleSelfieFileChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                    )}
                                    {cameraActive && (
                                        <Button type="button" onClick={capturePhoto} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] px-4 py-2 rounded-lg font-sans cursor-pointer">
                                            ✓ Tomar Autofoto
                                        </Button>
                                    )}
                                    {(capturedSelfie || cameraActive) && (
                                        <Button type="button" onClick={() => { stopCamera(); setCapturedSelfie(null); setSelfieBlob(null); }} size="sm" className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] px-4 py-2 rounded-lg font-sans cursor-pointer">
                                            Reiniciar
                                        </Button>
                                    )}
                                </div>
                                <span className="text-[9px] text-brand-charcoal/40 font-maiandra uppercase text-center mt-1">Saca una foto frontal de tu rostro o sube un archivo de imagen.</span>
                            </div>

                            {/* ID DOCUMENT STEP */}
                            <div className="space-y-3 bg-brand-yellow/5 p-5 rounded-2xl border border-brand-yellow/10">
                                <Label className="text-sm font-black uppercase tracking-wide text-brand-charcoal font-tangkiwood">{language === 'es' ? '2. Documento de Identificación (C.I., D.N.I. o Pasaporte)' : '2. ID Document (National ID or Passport)'}</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* ANVERSO */}
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] text-brand-charcoal/50 uppercase font-maiandra block">{language === 'es' ? 'Lado Anverso (Frontal):' : 'Front Side:'}</span>
                                        <div 
                                            onClick={() => docAnversoInputRef.current?.click()}
                                            className="border-2 border-dashed border-brand-charcoal/10 hover:border-brand-yellow bg-white rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center group h-28"
                                        >
                                            <Upload className="w-6 h-6 text-brand-charcoal/20 group-hover:text-brand-yellow transition-colors mb-1.5" />
                                            {docFileAnverso ? (
                                                <div className="text-[10px] font-bold text-brand-charcoal truncate max-w-full">
                                                    📄 {docFileAnverso.name}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-[10px] font-bold text-brand-charcoal/60 font-maiandra">{language === 'es' ? 'Subir Anverso' : 'Upload Front Side'}</div>
                                                    <div className="text-[8px] text-brand-charcoal/40 uppercase mt-0.5 font-maiandra">Imagen o PDF</div>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                ref={docAnversoInputRef} 
                                                onChange={handleFileAnversoChange} 
                                                accept="image/*,application/pdf" 
                                                className="hidden" 
                                            />
                                        </div>
                                    </div>

                                    {/* REVERSO */}
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] text-brand-charcoal/50 uppercase font-maiandra block">{language === 'es' ? 'Lado Reverso (Atrás):' : 'Back Side:'}</span>
                                        <div 
                                            onClick={() => docReversoInputRef.current?.click()}
                                            className="border-2 border-dashed border-brand-charcoal/10 hover:border-brand-yellow bg-white rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center group h-28"
                                        >
                                            <Upload className="w-6 h-6 text-brand-charcoal/20 group-hover:text-brand-yellow transition-colors mb-1.5" />
                                            {docFileReverso ? (
                                                <div className="text-[10px] font-bold text-brand-charcoal truncate max-w-full">
                                                    📄 {docFileReverso.name}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-[10px] font-bold text-brand-charcoal/60 font-maiandra">{language === 'es' ? 'Subir Reverso' : 'Upload Back Side'}</div>
                                                    <div className="text-[8px] text-brand-charcoal/40 uppercase mt-0.5 font-maiandra">Imagen o PDF</div>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                ref={docReversoInputRef} 
                                                onChange={handleFileReversoChange} 
                                                accept="image/*,application/pdf" 
                                                className="hidden" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ACCOUNT DATA FORM */}
                            <div className="space-y-4">
                                <Label className="text-sm font-black uppercase tracking-wide text-brand-charcoal font-tangkiwood">{language === 'es' ? '3. Datos Personales y de Cuenta' : '3. Personal & Account Details'}</Label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Nombre Completo' : 'Full Name'}</Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                            <Input required value={name} onChange={e=>setName(e.target.value)} placeholder="Juan Pérez" className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Número de WhatsApp' : 'WhatsApp Number'}</Label>
                                        <div className="relative flex items-center">
                                            <select 
                                                value={countryPrefix} 
                                                onChange={e => setCountryPrefix(e.target.value)} 
                                                className="absolute left-2 bg-transparent text-brand-charcoal/70 font-black text-xs font-sans border-0 focus:outline-none cursor-pointer z-10 pr-1 h-full"
                                            >
                                                {COUNTRY_PREFIXES.map(p => (
                                                    <option key={p.code} value={p.code} className="bg-white text-brand-black">
                                                        {p.flag} {p.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <Input required type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g, ''))} placeholder="77889900" className="pl-24 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'CI / Pasaporte / Documento' : 'ID / Passport Number'}</Label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                            <Input required value={ci} onChange={e=>setCi(e.target.value)} placeholder="1234567 LP" className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                            <Input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="cliente@briz.com" className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Nacionalidad' : 'Nationality'}</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30 z-10" />
                                            <select 
                                                required 
                                                value={nationality} 
                                                onChange={e=>setNationality(e.target.value)} 
                                                className="w-full pl-12 pr-10 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-sans appearance-none shadow-sm"
                                            >
                                                {POPULAR_COUNTRIES.map(country => (
                                                    <option key={`pop-${country}`} value={country}>{country}</option>
                                                ))}
                                                <option disabled>──────────────</option>
                                                {COUNTRIES_LIST.map(country => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-charcoal/40">▼</div>
                                        </div>
                                    </div>
                                    
                                    {nationality.toLowerCase() === 'bolivia' && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Departamento' : 'Department / State'}</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30 z-10" />
                                                <select 
                                                    value={department} 
                                                    onChange={e => setDepartment(e.target.value)} 
                                                    className="w-full pl-12 pr-10 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-sans appearance-none shadow-sm"
                                                >
                                                    {['Cochabamba', 'La Paz', 'Santa Cruz', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'].map(d => (
                                                        <option key={d} value={d} className="bg-white text-brand-black">{d}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-charcoal/40">▼</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Contraseña' : 'Password'}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                            <Input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 caracteres" className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                            <Input required type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? '¿Cómo nos conociste?' : 'How did you hear about us?'}</Label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30 z-10" />
                                        <select 
                                            value={referral} 
                                            onChange={e => setReferral(e.target.value)} 
                                            className="w-full pl-12 pr-10 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-sans appearance-none shadow-sm"
                                        >
                                            {['Google', 'Referencia en la web', 'TikTok', 'Instagram', 'Facebook', 'Por referencia de algún (a) conocido (a)', 'Otro'].map(r => (
                                                <option key={r} value={r} className="bg-white text-brand-black">{r}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-charcoal/40">▼</div>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl h-12 uppercase text-xs tracking-widest transition-all mt-4 font-sans shadow-lg shadow-brand-yellow/10 cursor-pointer"
                            >
                                {loading ? (language === 'es' ? 'Creando cuenta y subiendo archivos...' : 'Creating account & uploading files...') : (language === 'es' ? 'CREAR MI CUENTA' : 'CREATE MY ACCOUNT')}
                            </Button>

                            <div className="text-center pt-3 border-t border-brand-charcoal/5">
                                <p className="text-xs text-brand-charcoal/40 font-medium font-maiandra">{language === 'es' ? '¿Ya estás registrado?' : 'Already have an account?'}</p>
                                <Button 
                                    type="button" 
                                    onClick={toggleMode} 
                                    className="mt-2 bg-brand-charcoal/5 hover:bg-brand-yellow hover:text-brand-black text-brand-charcoal rounded-xl h-11 text-xs font-black uppercase tracking-widest px-6 w-full sm:w-auto font-sans transition-all border border-transparent cursor-pointer"
                                >
                                    {language === 'es' ? 'VOLVER A INICIAR SESIÓN' : 'BACK TO SIGN IN'}
                                </Button>
                            </div>
                        </form>
                    ) : mode === 'forgot' ? (
                        <form onSubmit={handleVerifyRecovery} className="space-y-5">
                            <p className="text-xs text-brand-charcoal/70 font-maiandra leading-relaxed">
                                Ingresa el correo vinculado a tu cuenta. Si existe, recibirás un enlace seguro para restablecer la contraseña.
                            </p>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                    <Input 
                                        type="email" 
                                        required 
                                        value={recoveryEmail}
                                        onChange={e => setRecoveryEmail(e.target.value)}
                                        placeholder="ejemplo@briz.com" 
                                        className="pl-12 bg-white border border-brand-charcoal/15 h-12 text-sm text-brand-black font-bold rounded-xl focus-visible:ring-brand-yellow focus-visible:border-brand-yellow font-sans shadow-sm"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit" 
                                className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl h-12 uppercase text-xs tracking-widest transition-all mt-4 font-sans shadow-lg cursor-pointer"
                            >
                                {language === 'es' ? 'ENVIAR ENLACE' : 'SEND RESET LINK'}
                            </Button>
                            <div className="text-center pt-3 border-t border-brand-charcoal/5 mt-4">
                                <Button 
                                    type="button" 
                                    onClick={() => setMode('login')} 
                                    className="bg-brand-charcoal/5 hover:bg-brand-yellow hover:text-brand-black text-brand-charcoal rounded-xl h-11 text-xs font-black uppercase tracking-widest px-6 w-full sm:w-auto font-sans transition-all border border-transparent cursor-pointer"
                                >
                                    {language === 'es' ? 'VOLVER AL LOGIN' : 'BACK TO SIGN IN'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                            <p className="text-xs text-brand-charcoal/70 font-maiandra leading-relaxed">Usa el enlace seguro enviado por correo para establecer una contraseña nueva.</p>
                            <Button type="button" onClick={() => setMode('login')} className="w-full">VOLVER AL LOGIN</Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
