import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Bell, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-3xl">
            <div><h1 className="text-2xl font-bold text-white">Configuración</h1><p className="text-white/50 text-sm">Ajustes del sistema (Demo)</p></div>

            {/* Business info */}
            <Card className="bg-brand-charcoal/50 border-white/5">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-brand-yellow" /> Información del Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-white/60">Nombre del negocio</Label><Input defaultValue="Briz" className="bg-white/5 border-white/10 text-white" /></div>
                        <div><Label className="text-white/60">Teléfono</Label><Input defaultValue="+591 77860277" className="bg-white/5 border-white/10 text-white" /></div>
                    </div>
                    <div><Label className="text-white/60">Dirección</Label><Input defaultValue="Av. Heroínas #1234, Cochabamba, Bolivia" className="bg-white/5 border-white/10 text-white" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-white/60">Email</Label><Input defaultValue="hola@briz.bo" className="bg-white/5 border-white/10 text-white" /></div>
                        <div><Label className="text-white/60">WhatsApp</Label><Input defaultValue="+59177860277" className="bg-white/5 border-white/10 text-white" /></div>
                    </div>
                </CardContent>
            </Card>

            {/* Hours */}
            <Card className="bg-brand-charcoal/50 border-white/5">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-brand-yellow" /> Horarios de Atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-white/60">Lunes a Sábado</Label><Input defaultValue="08:00 - 19:00" className="bg-white/5 border-white/10 text-white" /></div>
                        <div><Label className="text-white/60">Domingo</Label><Input defaultValue="09:00 - 14:00" className="bg-white/5 border-white/10 text-white" /></div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-brand-charcoal/50 border-white/5">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-brand-yellow" /> Notificaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Nuevas reservas', desc: 'Recibir notificación por cada nueva reserva' },
                        { label: 'Stock bajo', desc: 'Alerta cuando un producto esté por debajo del mínimo' },
                        { label: 'Alquiler atrasado', desc: 'Aviso cuando un alquiler exceda su tiempo' },
                        { label: 'Nuevo cliente', desc: 'Notificación por cada nuevo registro' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm text-white font-medium">{item.label}</p>
                                <p className="text-xs text-white/40">{item.desc}</p>
                            </div>
                            <div className="w-11 h-6 bg-brand-yellow/30 rounded-full cursor-pointer relative">
                                <div className="w-5 h-5 bg-brand-yellow rounded-full absolute top-0.5 right-0.5 transition-transform" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Button className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-semibold">
                <Save className="w-4 h-4 mr-2" /> Guardar Cambios (Demo)
            </Button>
        </div>
    );
}
