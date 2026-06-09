import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Bell, Shield, Globe, CreditCard, Upload, Check } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export default function SettingsPage() {
    const { rentalSettings, updateRentalSettings } = useStore();
    
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
            alert('Error al guardar la configuración de pagos.');
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
