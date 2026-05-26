import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate a brief delay for realism
        setTimeout(() => {
            const success = login(username, password);
            if (!success) {
                setError('Usuario o contraseña incorrectos');
            }
            setLoading(false);
        }, 600);
    };

    return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-yellow/6 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-brand-yellow/4 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/">
                        <img
                            src="/images/briz-logo.jpg"
                            alt="Briz"
                            className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-lg shadow-brand-yellow/20"
                        />
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-4">Briz Admin</h1>
                    <p className="text-white/50 text-sm mt-1">Ingresa tus credenciales para continuar</p>
                </div>

                <Card className="bg-brand-charcoal/80 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-white/70 text-sm">Usuario</Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Ingresa tu usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-4 h-11 focus:border-brand-yellow/50 focus:ring-brand-yellow/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white/70 text-sm">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Ingresa tu contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-4 pr-10 h-11 focus:border-brand-yellow/50 focus:ring-brand-yellow/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold h-11 text-base disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                                        Verificando...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Iniciar Sesión
                                    </div>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-4 border-t border-white/10 text-center">
                            <Link to="/" className="text-sm text-white/40 hover:text-brand-yellow transition-colors">
                                ← Volver al sitio público
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Demo hint */}
                <div className="mt-4 text-center">
                    <p className="text-white/30 text-xs">
                        Demo: usuario <span className="text-brand-yellow/60 font-mono">admin</span> | contraseña <span className="text-brand-yellow/60 font-mono">briz2026</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
