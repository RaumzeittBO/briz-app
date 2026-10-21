import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, FileText, MapPin, PenLine, Plus, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CustomerAuthModal from '@/components/layout/CustomerAuthModal';
import { useCommunity, type CommunityItemType } from '@/context/CommunityContext';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { FileUploader } from '@/components/ui/file-uploader';

const emptyForm = { title: '', content: '', imageUrl: '', category: '', eventDate: '', eventTime: '', location: '', registrationUrl: '' };

export default function CommunityPage() {
    const { items, createItem } = useCommunity();
    const { currentCustomer } = useStore();
    const { language } = useLanguage();
    const [tab, setTab] = useState<'all' | CommunityItemType>('all');
    const [search, setSearch] = useState('');
    const [composer, setComposer] = useState<CommunityItemType | null>(null);
    const [authOpen, setAuthOpen] = useState(false);

    const [searchParams] = useSearchParams();

    // Initialize and update selected tab from URL search params
    useEffect(() => {
        const type = searchParams.get('tab');
        if (type === 'post' || type === 'event') {
            setTab(type);
        } else {
            setTab('all');
        }
    }, [searchParams]);
    const [form, setForm] = useState(emptyForm);
    const [sending, setSending] = useState(false);

    const visibleItems = useMemo(() => items.filter(item => item.status === 'approved' && (tab === 'all' || item.type === tab) && `${item.title} ${item.content} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [items, tab, search]);
    const openComposer = (type: CommunityItemType) => {
        if (!currentCustomer) { setAuthOpen(true); return; }
        setForm(emptyForm); setComposer(type);
    };
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!currentCustomer || !composer) return;
        setSending(true);
        try {
            await createItem({ type: composer, title: form.title.trim(), content: form.content.trim(), imageUrl: form.imageUrl.trim() || undefined, category: form.category.trim() || undefined, eventDate: composer === 'event' ? form.eventDate : undefined, eventTime: composer === 'event' ? form.eventTime : undefined, location: composer === 'event' ? form.location.trim() : undefined, registrationUrl: composer === 'event' ? form.registrationUrl.trim() : undefined, authorId: currentCustomer.id, authorName: currentCustomer.name, authorAvatar: currentCustomer.autofotoUrl });
            setComposer(null);
            alert(language === 'es'
                ? '¡Listo! Tu publicación fue enviada a revisión. Aparecerá en Comunidad cuando Briz la apruebe.'
                : 'Done! Your post has been submitted for review and will appear in Community once approved by Briz.');
        } catch (error: any) {
            console.error('Error al enviar publicación:', error);
            alert(language === 'es'
                ? `No pudimos enviar tu publicación. Detalle del error de la base de datos: ${error.message || error}`
                : `We could not submit your post. Error details: ${error.message || error}`);
        } finally { setSending(false); }
    };

    const tabs = [
        ['all', language === 'es' ? 'Todo' : 'All'],
        ['post', 'Blog'],
        ['event', language === 'es' ? 'Eventos' : 'Events'],
    ] as const;

    return <main className="min-h-screen bg-[#FFFDF3] pt-20">
        <section className="relative overflow-hidden bg-brand-yellow px-4 py-12 sm:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,.35),transparent_22%),radial-gradient(circle_at_84%_65%,rgba(36,169,197,.2),transparent_28%)]" />
            <div className="relative mx-auto max-w-6xl">
                <p className="font-gochi text-lg text-white/90 sm:text-xl">
                    {language === 'es' ? 'Pedalear también es contar historias.' : 'Cycling is also about sharing stories.'}
                </p>
                <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="max-w-full font-tan text-[1.8rem] xs:text-[2rem] uppercase leading-[1.3] text-white sm:text-6xl">
                            {language === 'es' ? 'Comunidad Briz' : 'Briz Community'}
                        </h1>
                        <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-white/95">
                            {language === 'es'
                                ? 'Eventos, rutas, aprendizajes y relatos creados por ciclistas. Todo contenido es revisado por nuestro equipo antes de publicarse.'
                                : 'Events, routes, tips, and stories created by cyclists. All content is reviewed by our team before publishing.'}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button onClick={() => openComposer('post')} className="h-12 rounded-full border-2 border-brand-charcoal bg-brand-yellow px-6 font-black text-brand-black shadow-[3px_3px_0_rgba(6,61,71,.7)] hover:bg-white">
                            <PenLine className="mr-2 h-4 w-4" />{language === 'es' ? 'Escribir post' : 'Write a post'}
                        </Button>
                        <Button onClick={() => openComposer('event')} className="h-12 rounded-full border-2 border-brand-cyan bg-brand-yellow px-6 font-black text-brand-black shadow-[3px_3px_0_rgba(6,61,71,.7)] hover:bg-white">
                            <CalendarDays className="mr-2 h-4 w-4" />{language === 'es' ? 'Crear evento' : 'Create event'}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                    {tabs.map(([value, label]) => (
                        <Button
                            key={value}
                            onClick={() => setTab(value)}
                            variant="outline"
                            className={`rounded-full px-5 font-black ${tab === value ? 'border-2 border-brand-charcoal bg-brand-yellow text-brand-black hover:bg-brand-yellow-light' : 'border-2 border-brand-cyan/60 bg-white text-brand-charcoal hover:bg-brand-yellow/10'}`}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-charcoal/40" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={language === 'es' ? 'Buscar en la comunidad' : 'Search community'}
                        className="h-11 rounded-full border-brand-yellow/35 bg-white pl-10"
                    />
                </div>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleItems.map(item => (
                    <article key={item.id} className="flex overflow-hidden rounded-[1.75rem] border border-brand-yellow/25 bg-white shadow-sm transition-transform hover:-translate-y-1">
                        <div className="flex flex-1 flex-col">
                            {item.imageUrl && <img src={item.imageUrl} alt="" className="h-44 w-full object-cover" />}
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-charcoal/45">
                                    {item.type === 'event' ? <CalendarDays className="h-4 w-4 text-brand-pink" /> : <FileText className="h-4 w-4 text-brand-yellow-vibrant" />}
                                    {item.type === 'event' ? (language === 'es' ? 'Evento' : 'Event') : item.category || 'Blog'}
                                </div>
                                <h2 className="mt-3 text-2xl font-black leading-tight text-brand-black">{item.title}</h2>
                                <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-brand-charcoal/70">{item.content}</p>
                                {item.type === 'event' && (
                                    <div className="mt-4 rounded-2xl bg-[#FFF9E8] p-3 text-xs font-black text-brand-charcoal/70">
                                        <p>
                                            {item.eventDate
                                                ? new Date(`${item.eventDate}T12:00:00`).toLocaleDateString(language === 'es' ? 'es-BO' : 'en-US', { dateStyle: 'long' })
                                                : (language === 'es' ? 'Fecha por confirmar' : 'Date TBD')}
                                            {item.eventTime && ` · ${item.eventTime}`}
                                        </p>
                                        {item.location && (
                                            <p className="mt-1 flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-brand-pink" />{item.location}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="mt-5 flex items-center gap-2 border-t border-brand-yellow/15 pt-4">
                                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-yellow/25 text-[10px] font-black text-brand-black">
                                        {item.authorAvatar ? <img src={item.authorAvatar} alt="" className="h-full w-full object-cover" /> : item.authorName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-black text-brand-charcoal/60">{item.authorName}</span>
                                    {item.type === 'event' && item.registrationUrl && (
                                        <a className="ml-auto text-xs font-black text-brand-pink hover:underline" href={item.registrationUrl} target="_blank" rel="noreferrer">
                                            {language === 'es' ? 'Participar' : 'Join'}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            {!visibleItems.length && (
                <div className="mt-8 rounded-[2rem] border border-dashed border-brand-yellow/50 bg-white px-6 py-16 text-center">
                    <UserRound className="mx-auto h-12 w-12 text-brand-yellow-vibrant" />
                    <h2 className="mt-4 font-tan text-2xl uppercase text-brand-black">
                        {language === 'es' ? 'Aún no hay contenido' : 'No content yet'}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm font-bold text-brand-charcoal/60">
                        {language === 'es'
                            ? 'Sé quien abra la conversación. Comparte una historia o propone una rodada.'
                            : 'Be the first to start the conversation. Share a story or propose a group ride.'}
                    </p>
                    <Button onClick={() => openComposer('post')} className="mt-5 rounded-full bg-brand-yellow font-black text-brand-black hover:bg-brand-yellow-light">
                        <Plus className="mr-1 h-4 w-4" />{language === 'es' ? 'Crear publicación' : 'Create post'}
                    </Button>
                </div>
            )}
        </section>
        <CustomerAuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => { setAuthOpen(false); setComposer('post'); }} />
        <Dialog open={!!composer} onOpenChange={open => !open && setComposer(null)}>
            <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-[1.75rem] bg-[#FFFDF3] p-0">
                <DialogHeader className="border-b border-brand-yellow/20 bg-brand-yellow px-7 py-6">
                    <DialogTitle className="font-tan text-3xl uppercase text-brand-black">
                        {composer === 'event'
                            ? (language === 'es' ? 'Propón un evento' : 'Propose an event')
                            : (language === 'es' ? 'Escribe para la comunidad' : 'Write for the community')}
                    </DialogTitle>
                    <p className="mt-1 text-sm font-bold text-brand-charcoal/65">
                        {language === 'es' ? 'Se enviará a revisión antes de hacerse público.' : 'It will be reviewed before being published.'}
                    </p>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 p-7">
                    <div>
                        <Label>{language === 'es' ? 'Título' : 'Title'}</Label>
                        <Input
                            required
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="mt-2 h-11 bg-white"
                            placeholder={composer === 'event'
                                ? (language === 'es' ? 'Ej. Rodada nocturna por la ciudad' : 'E.g. Night ride through the city')
                                : (language === 'es' ? 'El título de tu historia' : 'The title of your story')}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label>{language === 'es' ? 'Categoría' : 'Category'}</Label>
                            <Input
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="mt-2 h-11 bg-white"
                                placeholder={language === 'es' ? 'Ej. Consejos, historias' : 'E.g. Tips, stories'}
                            />
                        </div>
                        <div>
                            <Label>{language === 'es' ? 'Imagen (URL, opcional)' : 'Image (URL, optional)'}</Label>
                            <div className="flex gap-2 mt-2">
                                <Input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="h-11 bg-white flex-1" placeholder="https://..." />
                                <FileUploader 
                                    onUpload={(url) => setForm({ ...form, imageUrl: url })} 
                                    folder="community" 
                                    className="h-11 px-4 flex items-center justify-center gap-1.5 rounded-xl border border-brand-charcoal bg-brand-charcoal text-white hover:bg-brand-charcoal/90 text-xs font-bold transition-all cursor-pointer shrink-0"
                                />
                            </div>
                        </div>
                    </div>
                    {composer === 'event' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>{language === 'es' ? 'Fecha' : 'Date'}</Label>
                                <Input required type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} className="mt-2 h-11 bg-white" />
                            </div>
                            <div>
                                <Label>{language === 'es' ? 'Hora' : 'Time'}</Label>
                                <Input type="time" value={form.eventTime} onChange={e => setForm({ ...form, eventTime: e.target.value })} className="mt-2 h-11 bg-white" />
                            </div>
                            <div>
                                <Label>{language === 'es' ? 'Lugar de encuentro' : 'Meeting Point'}</Label>
                                <Input
                                    required
                                    value={form.location}
                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                    className="mt-2 h-11 bg-white"
                                    placeholder={language === 'es' ? 'Ej. Plaza principal' : 'E.g. Main square'}
                                />
                            </div>
                            <div>
                                <Label>{language === 'es' ? 'Enlace de registro (opcional)' : 'Registration Link (optional)'}</Label>
                                <Input type="url" value={form.registrationUrl} onChange={e => setForm({ ...form, registrationUrl: e.target.value })} className="mt-2 h-11 bg-white" placeholder="https://..." />
                            </div>
                        </div>
                    )}
                    <div>
                        <Label>{composer === 'event' ? (language === 'es' ? 'Descripción del evento' : 'Event Description') : (language === 'es' ? 'Tu publicación' : 'Your Post')}</Label>
                        <Textarea
                            required
                            rows={6}
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            className="mt-2 resize-none bg-white"
                            placeholder={language === 'es' ? 'Cuéntale algo valioso a la comunidad...' : 'Share something valuable with the community...'}
                        />
                    </div>
                    <Button disabled={sending} type="submit" className="h-12 w-full rounded-full bg-brand-black font-black text-white hover:bg-brand-charcoal">
                        {sending ? (language === 'es' ? 'Enviando...' : 'Submitting...') : (language === 'es' ? 'Enviar a revisión' : 'Submit for review')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    </main>;
}
