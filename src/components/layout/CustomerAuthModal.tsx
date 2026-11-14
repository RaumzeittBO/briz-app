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
import ArtworkPicture from '@/components/ArtworkPicture';
import { auth } from '@/lib/firebase';

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
    const { currentCustomer, loginCustomer, resendCustomerVerification, refreshCustomerVerification, changeCustomerVerificationEmail, completeCustomerProfile, registerCustomer, verifyCustomerRecovery } = useStore();
    const { language } = useLanguage();
    
    // Auth Mode: 'login' | 'register' | 'forgot' | 'reset'
    const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'complete'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [verificationPending, setVerificationPending] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState(() => localStorage.getItem('briz_customer_verification_email') || '');
    const [verificationPassword, setVerificationPassword] = useState('');
    const [replacementEmail, setReplacementEmail] = useState('');
    const [resendAvailableAt, setResendAvailableAt] = useState(0);
    const [clockNow, setClockNow] = useState(Date.now());
    const [completionFields, setCompletionFields] = useState<{ name: string; phone: string; ci: string }>({ name: '', phone: '', ci: '' });
    const [completionMissingFiles, setCompletionMissingFiles] = useState<Array<'autofoto' | 'documento' | 'documentoReverso'>>([]);
    const [completionNeedsReview, setCompletionNeedsReview] = useState<Array<'autofoto' | 'documento' | 'documentoReverso'>>([]);
    const [completionFiles, setCompletionFiles] = useState<{ autofoto: File | null; documento: File | null; documentoReverso: File | null }>({ autofoto: null, documento: null, documentoReverso: null });

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

    const startProfileCompletion = (customer: { name: string; phone: string; ci: string; missingPrivateFiles?: Array<'autofoto' | 'documento' | 'documentoReverso'>; privateFilesNeedReview?: Array<'autofoto' | 'documento' | 'documentoReverso'> }) => {
        const missingName = customer.name.trim().length < 2;
        const missingPhone = customer.phone.replace(/\D/g, '').length < 7;
        const missingCi = customer.ci.trim().length < 3;
        const missingFiles = customer.missingPrivateFiles || [];
        const needsReview = customer.privateFilesNeedReview || [];
        if (!missingName && !missingPhone && !missingCi && missingFiles.length === 0 && needsReview.length === 0) return false;
        setCompletionFields({ name: missingName ? '' : customer.name, phone: missingPhone ? '' : customer.phone, ci: missingCi ? '' : customer.ci });
        setCompletionMissingFiles(missingFiles);
        setCompletionNeedsReview(needsReview);
        setCompletionFiles({ autofoto: null, documento: null, documentoReverso: null });
        setMode('complete');
        setError(null);
        setSuccessMessage(null);
        return true;
    };

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

    useEffect(() => {
        if (isOpen) auth.languageCode = language === 'en' ? 'en' : 'es';
    }, [isOpen, language]);

    useEffect(() => {
        if (isOpen && mode === 'login' && currentCustomer) startProfileCompletion(currentCustomer);
    }, [isOpen, mode, currentCustomer]);

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
            setVerificationPending(false);
            setCapturedSelfie(null);
            setSelfieBlob(null);
            setDocFileAnverso(null);
            setDocFileReverso(null);
            setLoading(false);
            setMode('login');
            setRecoveryEmail('');
            if (localStorage.getItem('briz_customer_verification_email')) setMode('verify');
        }
    }, [isOpen, stream]);

    useEffect(() => {
        const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isOpen || !verificationEmail) return;
        const lastSent = Number(localStorage.getItem(`briz_verify_sent_${verificationEmail.toLowerCase()}`) || 0);
        setResendAvailableAt(lastSent + 60_000);
    }, [isOpen, verificationEmail]);

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
        setSuccessMessage(null);
        setVerificationPending(false);
        setLoading(true);
        
        try {
            const customer = await loginCustomer(email, password, remember);
            if (customer) {
                if (startProfileCompletion(customer)) return;
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
            if (err && typeof err === 'object' && 'code' in err && err.code === 'auth/email-not-verified') {
                setVerificationPending(true);
                setVerificationEmail(email.trim().toLowerCase());
                localStorage.setItem('briz_customer_verification_email', email.trim().toLowerCase());
                setMode('verify');
                setVerificationPassword(password);
                setError(null);
                setLoading(false);
                return;
            }
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
            setError(code.includes('wrong-password') || code.includes('invalid-credential')
                ? (language === 'es' ? 'El correo o la contraseña no son correctos.' : 'The email or password is incorrect.')
                : code.includes('network-request-failed')
                    ? (language === 'es' ? 'No hay conexión. Comprueba tu internet e inténtalo de nuevo.' : 'Connection failed. Check your internet and try again.')
                    : (language === 'es' ? 'No pudimos cargar tu perfil. Inténtalo de nuevo en unos minutos.' : 'We could not load your profile. Please try again shortly.'));
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = async (event: React.FormEvent) => {
        event.preventDefault(); setLoading(true); setError(null);
        try {
            if (completionMissingFiles.some(kind => !completionFiles[kind])) {
                setError(language === 'es' ? 'Sube únicamente los archivos indicados para continuar.' : 'Upload only the files listed to continue.');
                return;
            }
            const completed = await completeCustomerProfile({
                ...(completionFields.name.trim() ? { name: completionFields.name } : {}),
                ...(completionFields.phone.trim() ? { phone: completionFields.phone } : {}),
                ...(completionFields.ci.trim() ? { ci: completionFields.ci } : {}),
                privateFiles: completionFiles,
            });
            if (completed.privateFilesNeedReview?.length) {
                setCompletionNeedsReview(completed.privateFilesNeedReview);
                setSuccessMessage(language === 'es'
                    ? 'Tus datos pendientes se guardaron. Algunos archivos antiguos requieren revisión de BRIZ.'
                    : 'Your missing details were saved. Some older files need BRIZ review.');
                return;
            }
            setSuccessMessage(language === 'es' ? 'Perfil completado. Ya puedes continuar.' : 'Profile completed. You can continue.');
            onSuccess?.(); window.setTimeout(onClose, 900);
        } catch (err) {
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
            setError(code.includes('invalid-argument')
                ? (language === 'es' ? 'Completa los datos pendientes con información válida.' : 'Enter valid information for the missing fields.')
                : (language === 'es' ? 'No se pudo guardar el perfil. Comprueba tu conexión e inténtalo de nuevo.' : 'Could not save the profile. Check your connection and try again.'));
        } finally { setLoading(false); }
    };

    const handleResendVerification = async () => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            const result = await resendCustomerVerification(email, password || undefined, language);
            setVerificationPending(false);
            setSuccessMessage(result === 'sent'
                ? (language === 'es'
                    ? 'Enviamos un nuevo enlace de verificación. Revisa tu bandeja de entrada y correo no deseado.'
                    : 'A new verification link was sent. Check your inbox and spam folder.')
                : (language === 'es'
                    ? 'Este correo ya figura como verificado. Intenta iniciar sesión nuevamente.'
                    : 'This email is already verified. Please try signing in again.'));
        } catch (err) {
            console.error(err);
            setError(err instanceof Error
                ? err.message
                : (language === 'es' ? 'No se pudo enviar el enlace. Revisa tus datos e intenta nuevamente.' : 'Could not send the link. Check your credentials and try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationCheck = async () => {
        setError(null); setSuccessMessage(null); setLoading(true);
        try {
            const customer = await refreshCustomerVerification();
            if (!customer) { setError(language === 'es' ? 'Tu correo aún está pendiente de confirmación.' : 'Your email is still awaiting verification.'); return; }
            if (startProfileCompletion(customer)) return;
            localStorage.removeItem('briz_customer_verification_email');
            setSuccessMessage(language === 'es' ? 'Correo confirmado. Tu cuenta BRIZ está lista.' : 'Email confirmed. Your BRIZ account is ready.');
            onSuccess?.();
            window.setTimeout(onClose, 900);
        } catch {
            setError(language === 'es' ? 'El correo está confirmado, pero no pudimos cargar tu perfil. Inténtalo nuevamente.' : 'Your email is verified, but we could not load your profile. Please try again.');
        } finally { setLoading(false); }
    };

    const handleVerificationResend = async () => {
        if (clockNow < resendAvailableAt) return;
        setError(null); setSuccessMessage(null); setLoading(true);
        try {
            const result = await resendCustomerVerification(verificationEmail, verificationPassword || undefined, language);
            if (result === 'verified') { await handleVerificationCheck(); return; }
            const sentAt = Date.now();
            localStorage.setItem(`briz_verify_sent_${verificationEmail.toLowerCase()}`, String(sentAt));
            setResendAvailableAt(sentAt + 60_000);
            setSuccessMessage(language === 'es' ? 'Enviamos un nuevo enlace de verificación.' : 'A new verification link has been sent.');
        } catch (err) {
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
            setError(code.includes('too-many-requests')
                ? (language === 'es' ? 'Firebase limitó temporalmente los envíos. Espera antes de volver a intentarlo.' : 'Firebase temporarily limited verification emails. Please wait before trying again.')
                : (language === 'es' ? 'Inicia sesión con tu contraseña antes de reenviar el enlace.' : 'Sign in with your password before resending the link.'));
        } finally { setLoading(false); }
    };

    const handleVerificationEmailChange = async () => {
        setLoading(true); setError(null); setSuccessMessage(null);
        try {
            await changeCustomerVerificationEmail(replacementEmail, verificationPassword);
            const cleanEmail = replacementEmail.trim().toLowerCase();
            setVerificationEmail(cleanEmail);
            localStorage.setItem('briz_customer_verification_email', cleanEmail);
            setReplacementEmail('');
            const sentAt = Date.now(); localStorage.setItem(`briz_verify_sent_${cleanEmail}`, String(sentAt)); setResendAvailableAt(sentAt + 60_000);
            setSuccessMessage(language === 'es' ? `Enviamos el enlace de confirmación a ${cleanEmail}.` : `A confirmation link was sent to ${cleanEmail}.`);
        } catch (err) {
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
            setError(code.includes('email-already-in-use')
                ? (language === 'es' ? 'Ese correo ya pertenece a otra cuenta.' : 'That email is already linked to another account.')
                : (language === 'es' ? 'No pudimos cambiar el correo. Comprueba tu contraseña e inténtalo de nuevo.' : 'We could not change the email. Check your password and try again.'));
        } finally { setLoading(false); }
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

            const result = await registerCustomer(customerData, selfieBlob, docFileAnverso, docFileReverso, remember, language);
            const cleanEmail = email.trim().toLowerCase();
            setVerificationEmail(cleanEmail);
            localStorage.setItem('briz_customer_verification_email', cleanEmail);
            setVerificationPassword('');
            setMode('verify');
            setPassword('');
            if (result.verificationSent) {
                const sentAt = Date.now();
                localStorage.setItem(`briz_verify_sent_${cleanEmail}`, String(sentAt));
                setResendAvailableAt(sentAt + 60_000);
                setSuccessMessage(null);
            } else {
                setError(language === 'es' ? 'La cuenta se creó, pero no se pudo enviar el correo. Revisa tu conexión y pulsa “Reenviar correo”.' : 'Your account was created, but the email could not be sent. Check your connection and choose “Resend email”.');
            }
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "No se pudo registrar tu usuario. Verifica si el correo ya está registrado.");
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
                    <ArtworkPicture slotId="customer_auth_logo" language={language} alt="Briz logo" className="mb-3" imageClassName="h-20 w-auto object-contain" />
                    <DialogTitle className="text-lg sm:text-xl md:text-2xl font-tangkiwood uppercase tracking-wide text-brand-charcoal text-center px-4 w-full break-words">
                        {mode === 'login' 
                            ? (language === 'es' ? 'INICIAR SESIÓN' : 'SIGN IN') 
                            : mode === 'register' 
                            ? (language === 'es' ? 'REGÍSTRATE EN BRIZ' : 'REGISTER AT BRIZ') 
                            : mode === 'verify'
                            ? (language === 'es' ? 'CONFIRMA TU CORREO PARA INICIAR SESIÓN' : 'VERIFY YOUR EMAIL TO SIGN IN')
                            : mode === 'complete'
                            ? (language === 'es' ? 'COMPLETA TU PERFIL' : 'COMPLETE YOUR PROFILE')
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
                            : mode === 'verify'
                            ? (language === 'es' ? 'Activa tu cuenta BRIZ con el enlace que enviamos' : 'Activate your BRIZ account using the link we sent')
                            : mode === 'complete'
                            ? (language === 'es' ? 'Solo te pediremos los datos que faltan' : 'We will ask only for missing details')
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
                    {mode === 'complete' ? (
                        <form onSubmit={handleCompleteProfile} className="space-y-4">
                            <p className="text-sm leading-relaxed text-brand-charcoal/65">{language === 'es' ? 'Tu correo ya está verificado. Para proteger tus datos, conserva lo que ya existe y completa únicamente los campos vacíos.' : 'Your email is verified. To protect your information, existing details will stay as they are; fill only the empty fields.'}</p>
                            {completionNeedsReview.length > 0 && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">{language === 'es' ? 'Algunos archivos antiguos no tienen una referencia verificable. No asumimos que fueron borrados ni te pediremos volver a subirlos. Contacta a BRIZ para revisar su recuperación segura.' : 'Some older files have no verifiable reference. We do not assume they were deleted or ask you to upload them again. Contact BRIZ to review safe recovery.'}</p>}
                            {!completionFields.name.trim() && <div className="space-y-1"><Label>{language === 'es' ? 'Nombre completo' : 'Full name'}</Label><Input required minLength={2} value={completionFields.name} onChange={event => setCompletionFields(value => ({ ...value, name: event.target.value }))} /></div>}
                            {completionFields.phone.replace(/\D/g, '').length < 7 && <div className="space-y-1"><Label>{language === 'es' ? 'Teléfono' : 'Phone'}</Label><Input required type="tel" value={completionFields.phone} onChange={event => setCompletionFields(value => ({ ...value, phone: event.target.value }))} /></div>}
                            {completionFields.ci.trim().length < 3 && <div className="space-y-1"><Label>{language === 'es' ? 'Documento de identidad' : 'Identity document'}</Label><Input required value={completionFields.ci} onChange={event => setCompletionFields(value => ({ ...value, ci: event.target.value }))} /></div>}
                            {completionMissingFiles.includes('autofoto') && <div className="space-y-1"><Label>{language === 'es' ? 'Fotografía pendiente' : 'Missing profile photo'}</Label><Input required type="file" accept="image/*" onChange={event => setCompletionFiles(value => ({ ...value, autofoto: event.target.files?.[0] || null }))} /></div>}
                            {completionMissingFiles.includes('documento') && <div className="space-y-1"><Label>{language === 'es' ? 'Documento · anverso pendiente' : 'ID document · front missing'}</Label><Input required type="file" accept="image/*,application/pdf" onChange={event => setCompletionFiles(value => ({ ...value, documento: event.target.files?.[0] || null }))} /></div>}
                            {completionMissingFiles.includes('documentoReverso') && <div className="space-y-1"><Label>{language === 'es' ? 'Documento · reverso pendiente' : 'ID document · back missing'}</Label><Input required type="file" accept="image/*,application/pdf" onChange={event => setCompletionFiles(value => ({ ...value, documentoReverso: event.target.files?.[0] || null }))} /></div>}
                            {(!completionFields.name.trim() || completionFields.phone.replace(/\D/g, '').length < 7 || completionFields.ci.trim().length < 3 || completionMissingFiles.length > 0) && <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-brand-yellow font-black text-brand-charcoal hover:bg-brand-yellow-light">{loading ? (language === 'es' ? 'Guardando…' : 'Saving…') : (language === 'es' ? 'Guardar y continuar' : 'Save and continue')}</Button>}
                            <button type="button" onClick={() => setMode('login')} className="w-full text-sm font-bold text-brand-charcoal/70 underline underline-offset-4">{language === 'es' ? 'Volver al inicio de sesión' : 'Back to sign in'}</button>
                        </form>
                    ) : mode === 'verify' ? (
                        <div className="space-y-5 text-center">
                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-yellow/25 text-brand-charcoal"><Mail className="h-7 w-7" /></div>
                            <div className="space-y-2">
                                <p className="text-sm text-brand-charcoal/75">{language === 'es' ? 'Enviamos un enlace de verificación a:' : 'We sent a verification link to:'}</p>
                                <p className="break-all rounded-xl border border-brand-yellow/50 bg-white px-4 py-3 text-base font-black text-brand-charcoal">{verificationEmail}</p>
                                <p className="text-sm leading-relaxed text-brand-charcoal/65">{language === 'es' ? 'Abre el correo y pulsa el botón de confirmación para activar tu cuenta BRIZ. Si no encuentras el mensaje, revisa Spam o Correo no deseado.' : 'Open the email and select the confirmation button to activate your BRIZ account. If you cannot find it, check Spam or Junk.'}</p>
                            </div>
                            {verificationPassword && <div className="space-y-2 text-left"><Label>{language === 'es' ? 'Contraseña para confirmar cambios o reenviar' : 'Password to confirm changes or resend'}</Label><Input type="password" autoComplete="current-password" value={verificationPassword} onChange={event => setVerificationPassword(event.target.value)} /></div>}
                            <Button type="button" disabled={loading} onClick={handleVerificationCheck} className="h-12 w-full rounded-xl bg-brand-yellow font-black text-brand-charcoal hover:bg-brand-yellow-light">{loading ? (language === 'es' ? 'Verificando…' : 'Checking…') : (language === 'es' ? 'Ya confirmé mi correo' : 'I have verified my email')}</Button>
                            <Button type="button" variant="outline" disabled={loading || clockNow < resendAvailableAt} onClick={handleVerificationResend} className="h-11 w-full rounded-xl border-brand-charcoal/15">{clockNow < resendAvailableAt ? (language === 'es' ? `Reenviar correo (${Math.ceil((resendAvailableAt-clockNow)/1000)} s)` : `Resend email (${Math.ceil((resendAvailableAt-clockNow)/1000)} s)`) : (language === 'es' ? 'Reenviar correo' : 'Resend email')}</Button>
                            <div className="space-y-2 border-t border-brand-charcoal/10 pt-4 text-left">
                                <Label>{language === 'es' ? '¿Correo escrito incorrectamente?' : 'Typo in your email?'}</Label>
                                <Input type="email" autoComplete="email" value={replacementEmail} onChange={event => setReplacementEmail(event.target.value)} placeholder={language === 'es' ? 'Nuevo correo electrónico' : 'New email address'} />
                                {!verificationPassword && <Input type="password" autoComplete="current-password" value={verificationPassword} onChange={event => setVerificationPassword(event.target.value)} placeholder={language === 'es' ? 'Contraseña actual' : 'Current password'} />}
                                <Button type="button" variant="outline" disabled={loading || !replacementEmail || !verificationPassword} onClick={handleVerificationEmailChange} className="w-full">{language === 'es' ? 'Cambiar correo de forma segura' : 'Change email securely'}</Button>
                            </div>
                            <button type="button" onClick={() => { setMode('login'); setEmail(verificationEmail); setError(null); setSuccessMessage(null); }} className="text-sm font-bold text-brand-charcoal/70 underline underline-offset-4">{language === 'es' ? 'Volver al inicio de sesión' : 'Back to sign in'}</button>
                        </div>
                    ) : mode === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Correo Electrónico' : 'Email Address'}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/30" />
                                    <Input 
                                        type="email" 
                                        required 
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setVerificationPending(false); }}
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
                                        onChange={e => { setPassword(e.target.value); setVerificationPending(false); }}
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

                            {verificationPending && (
                                <Button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={loading || !email.trim() || !password}
                                    className="w-full bg-white text-brand-charcoal border border-brand-charcoal/15 hover:bg-brand-yellow/10 font-bold rounded-xl h-11 text-xs tracking-wide transition-all font-sans"
                                >
                                    {loading
                                        ? (language === 'es' ? 'Enviando enlace...' : 'Sending link...')
                                        : (language === 'es' ? 'REENVIAR ENLACE DE VERIFICACIÓN' : 'RESEND VERIFICATION LINK')}
                                </Button>
                            )}

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
