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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
        } catch (err: any) {
            setError('Correo o contraseña incorrectos');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-charcoal flex items-center justify-center px-4 relative overflow-hidden">
            {/* SaaS Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,210,0,0.03),transparent_50%)]" />
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-brand-yellow/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-brand-yellow/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300">
                        <div className="p-1 bg-white/[0.03] border border-white/10 rounded-[2rem] shadow-2xl">
                            <img src="/images/briz-logo.jpg" alt="Briz" className="w-24 h-24 rounded-[1.8rem] object-cover" />
                        </div>
                    </Link>
                    <h1 className="text-4xl font-black text-white mt-8 tracking-tighter">Briz <span className="text-brand-yellow">OS</span></h1>
                    <p className="text-white/30 text-lg font-medium mt-2">Panel de Control Inteligente</p>
                </div>

                <Card className="bg-[#1A1A1A]/80 border-white/5 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    <CardContent className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-3">
                                <Label className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px] ml-4">Correo Electrónico</Label>
                                <Input
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="bg-black/40 border-white/5 text-white placeholder:text-white/10 pl-6 h-14 rounded-full focus:ring-brand-yellow/30 focus:border-white/20 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px] ml-4">Clave de Acceso</Label>
                                <div className="relative group">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-black/40 border-white/5 text-white placeholder:text-white/10 pl-6 pr-14 h-14 rounded-full focus:ring-brand-yellow/30 focus:border-white/20 transition-all font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-400/5 border border-red-400/20 rounded-2xl px-4 py-3"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-brand-black hover:bg-brand-yellow font-black h-14 text-lg rounded-full shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4 group"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-3 border-brand-charcoal/20 border-t-brand-charcoal rounded-full animate-spin" />
                                        <span>Autenticando...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" strokeWidth={3} />
                                        <span>Entrar al Sistema</span>
                                    </div>
                                )}
                            </Button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/5 text-center">
                            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors flex items-center justify-center gap-2">
                                <span>← Volver al Inicio</span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
