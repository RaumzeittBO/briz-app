import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Bell, Shield, Globe } from 'lucide-react';
export default function SettingsPage() {

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
