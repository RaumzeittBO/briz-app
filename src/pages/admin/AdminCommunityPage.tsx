import { useMemo, useState } from 'react';
import { CalendarDays, Check, FileText, MapPin, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCommunity, type CommunityItem } from '@/context/CommunityContext';

const statusStyle = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800' };
const statusText = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };

export default function AdminCommunityPage() {
    const { items, moderateItem, deleteItem } = useCommunity();
    const [filter, setFilter] = useState<'all' | CommunityItem['status']>('pending');
    const filtered = useMemo(() => filter === 'all' ? items : items.filter(item => item.status === filter), [items, filter]);
    const pending = items.filter(item => item.status === 'pending').length;

    const handleModeration = async (id: string, status: CommunityItem['status']) => {
        try { await moderateItem(id, status); } catch { alert('No se pudo actualizar la publicación. Verifica tu sesión de administrador.'); }
    };

    return <div className="space-y-7 pb-16">
        <div className="flex flex-col gap-4 border-b border-brand-yellow/25 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-charcoal/45">Moderación</p><h1 className="mt-1 font-tan text-4xl uppercase text-brand-black">Comunidad</h1><p className="mt-2 text-sm font-bold text-brand-charcoal/60">Aprueba el contenido antes de que aparezca en Briz.</p></div>
            <Badge className="w-fit rounded-full bg-brand-yellow px-4 py-2 text-brand-black">{pending} pendientes</Badge>
        </div>
        <div className="flex flex-wrap gap-2">{([['pending', 'Pendientes'], ['approved', 'Aprobadas'], ['rejected', 'Rechazadas'], ['all', 'Todas']] as const).map(([value, label]) => <Button key={value} onClick={() => setFilter(value)} variant="outline" className={`rounded-full border-brand-charcoal/15 px-5 font-black ${filter === value ? 'bg-brand-charcoal text-white hover:bg-brand-charcoal/85' : 'bg-white text-brand-charcoal'}`}>{label}</Button>)}</div>
        <div className="grid gap-5 xl:grid-cols-2">{filtered.map(item => <ModerationCard key={item.id} item={item} onModerate={handleModeration} onDelete={deleteItem} />)}</div>
        {!filtered.length && <div className="rounded-[2rem] border border-dashed border-brand-yellow/50 bg-white p-14 text-center text-sm font-bold text-brand-charcoal/55">No hay publicaciones en esta bandeja.</div>}
    </div>;
}

function ModerationCard({ item, onModerate, onDelete }: { item: CommunityItem; onModerate: (id: string, status: CommunityItem['status']) => void; onDelete: (id: string) => Promise<void> }) {
    return <article className="overflow-hidden rounded-[1.75rem] border border-brand-yellow/25 bg-white shadow-sm">
        <div className="flex gap-4 p-5"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.type === 'event' ? 'bg-brand-pink/10 text-brand-pink' : 'bg-brand-yellow/25 text-brand-black'}`}>{item.type === 'event' ? <CalendarDays /> : <FileText />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge className={`rounded-full ${statusStyle[item.status]}`}>{statusText[item.status]}</Badge><span className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">{item.type === 'event' ? 'Evento' : 'Blog'} · {item.category || 'Comunidad'}</span></div><h2 className="mt-2 text-xl font-black text-brand-black">{item.title}</h2><p className="mt-1 text-xs font-bold text-brand-charcoal/55">Por {item.authorName} · {new Date(item.createdAt).toLocaleDateString('es-BO')}</p></div></div>
        {item.imageUrl && <img src={item.imageUrl} alt="" className="h-36 w-full object-cover" />}
        <div className="space-y-3 p-5"><p className="whitespace-pre-line text-sm leading-relaxed text-brand-charcoal/75">{item.content}</p>{item.type === 'event' && <p className="flex items-center gap-2 text-xs font-black text-brand-charcoal/65"><MapPin className="h-4 w-4 text-brand-pink" />{item.eventDate || 'Sin fecha'} {item.eventTime ? `· ${item.eventTime}` : ''} {item.location ? `· ${item.location}` : ''}</p>}</div>
        <div className="flex flex-wrap gap-2 border-t border-brand-yellow/15 bg-[#FFFDF3] p-4">{item.status !== 'approved' && <Button onClick={() => onModerate(item.id, 'approved')} className="rounded-full bg-emerald-600 px-4 text-xs font-black text-white hover:bg-emerald-700"><Check className="mr-1 h-4 w-4" />Aprobar</Button>}{item.status !== 'rejected' && <Button onClick={() => onModerate(item.id, 'rejected')} variant="outline" className="rounded-full border-red-200 px-4 text-xs font-black text-red-600 hover:bg-red-50"><X className="mr-1 h-4 w-4" />Rechazar</Button>}<Button onClick={() => { if (confirm('¿Eliminar esta publicación?')) onDelete(item.id); }} variant="ghost" className="ml-auto rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>
    </article>;
}
