import { useEffect, useMemo, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { ImagePlus, RotateCcw, Save, Send, Smartphone, Monitor, X, CheckCircle2, Clock3, Languages } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useArtwork, useArtworkPair } from '@/context/ArtworkContext';
import { ARTWORK_REGISTRY, type ArtworkDevice, type ArtworkSlotId, type ArtworkVariant } from '@/lib/artworkRegistry';
import { discardArtworkDraft, finalizePublishedArtworkDraft, getArtworkDraft, getArtworkHistory, inspectArtworkFile, publishArtworkDraft, publishSharedArtworkVariant, restoreArtworkVersion, saveArtworkDraft, type ArtworkDraft, type ArtworkVersion } from '@/lib/artworkAdmin';

const slots = Object.keys(ARTWORK_REGISTRY) as ArtworkSlotId[];
const variants: { key: ArtworkVariant; label: string; language: 'es' | 'en'; device: ArtworkDevice }[] = [
    { key: 'esDesktop', label: 'Español · Computadora', language: 'es', device: 'desktop' },
    { key: 'esMobile', label: 'Español · Celular', language: 'es', device: 'mobile' },
    { key: 'enDesktop', label: 'English · Desktop', language: 'en', device: 'desktop' },
    { key: 'enMobile', label: 'English · Mobile', language: 'en', device: 'mobile' },
];

function formatBytes(size?: number) {
    if (!size) return '—';
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function PreviewImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    const failed = failedSource === src;
    if (failed) return <div role="img" aria-label={`${alt}: fuente original no disponible`} className={`grid place-items-center rounded-xl bg-stone-100 p-4 text-center text-xs font-semibold text-stone-500 ${className}`}>Fuente original no disponible en este checkout</div>;
    return <img src={src} alt={alt} className={className} onError={() => setFailedSource(src)} />;
}

function ArtworkCatalogCard({ slotId, active, onClick, disabled }: { slotId: ArtworkSlotId; active: boolean; onClick: () => void; disabled: boolean }) {
    const item = ARTWORK_REGISTRY[slotId];
    const { desktop } = useArtworkPair(slotId, 'es');
    const { desktop: english } = useArtworkPair(slotId, 'en');
    return <button type="button" onClick={onClick} disabled={disabled} className={`w-full rounded-2xl border p-3 text-left transition disabled:cursor-wait disabled:opacity-60 ${active ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-stone-200 bg-white hover:border-amber-300'}`}>
        <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
            <PreviewImage src={desktop.src} alt={item.titleEs} className="h-full w-full object-contain" />
        </div>
        <p className="font-bold text-stone-900">{item.titleEs}</p>
        <p className="mt-1 text-xs text-stone-500">{item.page} · {item.section}</p>
        <p className={`mt-2 text-[11px] font-semibold ${english.status === 'spanish-fallback' ? 'text-amber-700' : 'text-emerald-700'}`}>
            {item.originalAvailable === false && !desktop.sourceAvailable ? 'Original faltante · se puede cargar' : english.status === 'spanish-fallback' ? 'Inglés pendiente' : 'Inglés disponible'}
        </p>
    </button>;
}

function ArtworkVariantButton({ slotId, selected, item, onClick, disabled }: { slotId: ArtworkSlotId; selected: boolean; item: (typeof variants)[number]; onClick: () => void; disabled: boolean }) {
    const source = useArtwork(slotId, item.language, item.device);
    return <button type="button" onClick={onClick} disabled={disabled} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold disabled:cursor-wait disabled:opacity-60 ${selected ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-stone-200 hover:border-amber-300'}`}>
        <span>{item.label}</span><span className={`mt-1 block ${source.status === 'spanish-fallback' ? 'text-amber-700' : 'text-emerald-700'}`}>{source.status === 'spanish-fallback' ? 'Muestra respaldo español' : source.status === 'shared' ? 'Usa variante compartida' : 'Imagen propia'}</span>
    </button>;
}

function ArtworkPreview({ src, slotId, device, title }: { src: string; slotId: ArtworkSlotId; device: ArtworkDevice; title: string }) {
    const kind = ARTWORK_REGISTRY[slotId].previewKind;
    const mobile = device === 'mobile';
    const frame = mobile ? 'mx-auto w-[min(100%,360px)]' : 'mx-auto w-full max-w-[760px]';
    if (kind === 'texture') return <div className={`${frame} overflow-hidden rounded-2xl border border-stone-200 bg-[#fff9e8]`}><div className="relative h-40 sm:h-56"><PreviewImage src={src} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-multiply" /><div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amber-100/70 to-white/40"><span className="rounded-lg bg-white/80 px-3 py-2 text-xs font-bold text-stone-700">Vista del fondo público · {ARTWORK_REGISTRY[slotId].page}</span></div></div></div>;
    if (kind === 'sticker' || kind === 'logo') return <div className={`${frame} flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-[#fff9e8] p-8`}><div className="relative grid h-44 w-full place-items-center rounded-2xl bg-[#f1e6c9] before:absolute before:inset-4 before:rotate-[-2deg] before:rounded-xl before:bg-white before:shadow-xl"><PreviewImage src={src} alt={title} className="relative z-10 max-h-36 max-w-[85%] object-contain" /></div></div>;
    if (kind === 'hero') return <div className={`${frame} relative overflow-hidden rounded-[1.5rem] border-[6px] border-amber-400 bg-[#f6edda] p-3 shadow-[10px_10px_0_#111]`}>
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-300 ${mobile ? 'aspect-[10/15]' : 'aspect-[16/8]'}`}>
            <div className="absolute inset-0 opacity-35" style={{ backgroundImage: `url(${ARTWORK_REGISTRY.home_texture.defaults.esDesktop.src})`, backgroundSize: 'cover' }} />
            <div className="absolute inset-0 flex items-center justify-center"><div className={`rounded-lg bg-white/90 p-2 shadow-xl ${mobile ? 'w-[84%]' : 'w-[66%]'}`}><PreviewImage src={src} alt={title} className="max-h-36 w-full object-contain" /></div></div>
            <span className="absolute left-3 top-3 rounded-full bg-brand-yellow px-3 py-1 text-[10px] font-black uppercase text-stone-900">Briz · Inicio</span>
            <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-stone-800">Arte superpuesto en hero</span>
        </div>
    </div>;
    if (kind === 'photo-banner') return <div className={`${frame} overflow-hidden rounded-[2rem] bg-stone-900 shadow-[0_20px_50px_rgba(0,0,0,.22)]`}><PreviewImage src={src} alt={title} className={`w-full object-cover ${mobile ? 'h-[250px]' : 'h-[360px]'}`} /></div>;
    if (kind === 'about-slide') return <div className={`${frame} group relative rounded-[1.8rem] border-[6px] border-amber-400 bg-amber-300 p-2.5 shadow-[14px_14px_0_#111] sm:rounded-[2.4rem] sm:border-[12px]`}>
        <span className="absolute -left-2 top-2 z-10 h-5 w-20 -rotate-12 bg-white/55" /><span className="absolute -right-2 top-2 z-10 h-5 w-20 rotate-12 bg-white/55" />
        <div className="relative overflow-hidden rounded-[1.35rem] bg-white sm:rounded-[1.7rem]"><div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/5 to-white/10" /><PreviewImage src={src} alt={title} className="block w-full border-b-2 border-stone-900 object-contain" /></div>
        <div className="absolute -bottom-4 left-3 z-20 rounded-full border-2 border-stone-900 bg-pink-400 px-2 py-1 text-[10px] font-black text-white shadow-md">✦</div><div className="absolute -bottom-4 right-3 z-20 rounded-full border-2 border-stone-900 bg-emerald-500 px-2 py-1 text-[10px] font-black text-white shadow-md">↗</div>
    </div>;
    if (kind === 'full-width') return <div className={`${frame} relative rotate-[1deg] bg-white p-3 pb-10 shadow-[10px_10px_0_rgba(0,0,0,.2)] sm:p-4 sm:pb-14`}><div className="absolute -top-3 left-1/3 z-10 h-6 w-24 -rotate-6 bg-amber-100/80" /><div className="aspect-[1.15/1] overflow-hidden bg-emerald-50"><PreviewImage src={src} alt={title} className="h-full w-full object-cover" /></div><p className="mt-3 text-center font-semibold text-stone-600">Comunidad Briz · imagen enmarcada</p></div>;
    return <div className={`${frame} relative rounded-[1.7rem] border-[6px] border-amber-400 bg-amber-300 p-2 shadow-[10px_10px_0_#111]`}>
        <span className="absolute -left-1 top-2 z-10 h-5 w-20 -rotate-12 bg-white/55" />
        <span className="absolute -right-1 top-2 z-10 h-5 w-20 rotate-12 bg-white/55" />
        <div className="overflow-hidden rounded-[1.1rem] border-b-2 border-stone-900 bg-white"><PreviewImage src={src} alt={title} className={`block w-full object-contain ${mobile ? 'max-h-[440px]' : 'max-h-[360px]'}`} /></div>
        <span className="mt-2 block text-center text-[10px] font-black uppercase tracking-widest text-stone-900">Vista de tarjeta · {ARTWORK_REGISTRY[slotId].page}</span>
    </div>;
}

export default function AdminArtworksPage() {
    const { user } = useAuth();
    const [selected, setSelected] = useState<ArtworkSlotId>('home_welcome_badge');
    const [variant, setVariant] = useState<ArtworkVariant>('esDesktop');
    const [file, setFile] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState('');
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const [draft, setDraft] = useState<ArtworkDraft | null>(null);
    const [draftPreview, setDraftPreview] = useState('');
    const [history, setHistory] = useState<ArtworkVersion[]>([]);
    const [restoreId, setRestoreId] = useState('');
    const [previewDevice, setPreviewDevice] = useState<ArtworkDevice>('desktop');
    const [share, setShare] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
    const slot = ARTWORK_REGISTRY[selected];
    const selectedVariant = variants.find((item) => item.key === variant)!;
    const current = useArtwork(selected, selectedVariant.language, selectedVariant.device);
    const oldEnglish = useArtwork(selected, 'en', selectedVariant.device);
    const counterpart: ArtworkVariant = variant.endsWith('Desktop') ? `${variant.slice(0, 2)}Mobile` as ArtworkVariant : `${variant.slice(0, 2)}Desktop` as ArtworkVariant;

    useEffect(() => () => { if (localPreview.startsWith('blob:')) URL.revokeObjectURL(localPreview); }, [localPreview]);
    useEffect(() => () => { if (draftPreview.startsWith('blob:')) URL.revokeObjectURL(draftPreview); }, [draftPreview]);

    useEffect(() => {
        let live = true;
        setFile(null); setDimensions(null); setLocalPreview(''); setDraft(null); setDraftPreview(''); setShare(false); setMessage(null);
        setLoading(true);
        void Promise.all([
            user ? getArtworkDraft(user.uid, selected, variant) : Promise.resolve(null),
            getArtworkHistory(selected),
        ]).then(async ([savedDraft, versions]) => {
            if (!live) return;
            setDraft(savedDraft);
            setHistory(versions);
            setRestoreId(versions[1]?.id || '');
            if (savedDraft) setDraftPreview(await getDownloadURL(ref(storage, savedDraft.storagePath)));
        }).catch((error: unknown) => {
            if (live) setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudieron cargar los borradores o el historial.' });
        }).finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [selected, variant, user]);

    const groupedSlots = useMemo(() => [...new Set(slots.map((id) => ARTWORK_REGISTRY[id].page))].map((page) => ({ page, ids: slots.filter((id) => ARTWORK_REGISTRY[id].page === page) })), []);
    const englishPending = oldEnglish.status === 'spanish-fallback';
    const effectivePreview = localPreview || draftPreview || current.src;

    const chooseFile = async (candidate?: File) => {
        setMessage(null); setDraft(null); setDraftPreview(''); setDimensions(null); setFile(null); setLocalPreview('');
        if (!candidate) return;
        try {
            const measured = await inspectArtworkFile(candidate);
            setFile(candidate); setDimensions(measured); setLocalPreview(URL.createObjectURL(candidate));
        } catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo validar la imagen.' }); }
    };

    const run = async (action: () => Promise<void | string>, success: string) => {
        setLoading(true); setMessage(null);
        try { setMessage({ kind: 'success', text: (await action()) || success }); }
        catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'La operación no se completó.' }); }
        finally { setLoading(false); }
    };

    const saveDraft = () => file && dimensions && user && run(async () => {
        const next = await saveArtworkDraft({ uid: user.uid, slotId: selected, variant, file, ...dimensions });
        setDraft(next); setDraftPreview(await getDownloadURL(ref(storage, next.storagePath))); setFile(null); setLocalPreview('');
    }, 'Borrador guardado. La imagen pública no cambió.');

    const publish = () => user && run(async () => {
        let draftCleanupSucceeded = true;
        if (share) {
            await publishSharedArtworkVariant(selected, variant, counterpart, user.uid);
        } else {
            const saved = draft || await getArtworkDraft(user.uid, selected, variant);
            if (!saved) throw new Error('Guarda un borrador antes de publicar.');
            await publishArtworkDraft(saved, user.uid);
            try { await finalizePublishedArtworkDraft(user.uid, selected, variant); }
            catch { draftCleanupSucceeded = false; }
        }
        try { setHistory(await getArtworkHistory(selected)); } catch { /* The live public config still reflects the successful publish. */ }
        if (!share && draftCleanupSucceeded) { setDraft(null); setDraftPreview(''); setFile(null); setLocalPreview(''); }
        if (!share && !draftCleanupSucceeded) return 'Imagen publicada. No se pudo limpiar el registro privado del borrador; recarga esta sección para volver a sincronizarlo.';
    }, share ? 'Variante compartida y publicada.' : 'Imagen publicada. La web actualizará esta variante sin deployment.');

    const restore = () => user && restoreId && run(async () => {
        await restoreArtworkVersion(selected, restoreId, user.uid);
        setHistory(await getArtworkHistory(selected));
    }, 'La versión anterior fue restaurada como nueva versión.');

    const cancel = () => run(async () => {
        if (user) await discardArtworkDraft(user.uid, selected, variant);
        setFile(null); setLocalPreview(''); setDimensions(null); setDraft(null); setDraftPreview(''); setShare(false);
    }, 'Cambios cancelados. La imagen publicada permanece igual.');

    return <div className="mx-auto max-w-[1500px] space-y-6 text-stone-900">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[.22em] text-amber-700">Admin · Contenido visual</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Imágenes y Artes</h1><p className="mt-2 max-w-3xl text-sm text-stone-600">Administra los artes públicos sin cambiar la composición del sitio. Las fotos de productos y bicicletas se mantienen en sus formularios actuales.</p></div>
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600"><ImagePlus className="h-4 w-4 text-amber-600" />{slots.length} artes registrados</div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
                {groupedSlots.map(({ page, ids }) => <section key={page}><h2 className="mb-2 px-1 text-xs font-black uppercase tracking-widest text-stone-500">{page}</h2><div className="grid grid-cols-2 gap-2">{ids.map((id) => <ArtworkCatalogCard key={id} slotId={id} active={selected === id} disabled={loading} onClick={() => setSelected(id)} />)}</div></section>)}
            </aside>

            <section className="min-w-0 space-y-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">{slot.page} / {slot.section}</p><h2 className="mt-1 text-2xl font-black">{slot.titleEs}</h2><p className="mt-1 text-sm text-stone-600">{slot.descriptionEs}</p><p className="mt-2 text-xs text-stone-500">Dimensiones recomendadas: {slot.dimensions}</p></div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${current.status === 'spanish-fallback' ? 'bg-amber-100 text-amber-900' : current.status === 'shared' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {current.status === 'shared' ? <Monitor className="h-3.5 w-3.5" /> : current.status === 'spanish-fallback' ? <Languages className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {current.status === 'shared' ? 'Imagen compartida' : current.status === 'spanish-fallback' ? 'Respaldo en español' : 'Imagen propia'}
                    </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{variants.map((item) => <ArtworkVariantButton key={item.key} slotId={selected} item={item} selected={variant === item.key} disabled={loading} onClick={() => setVariant(item.key)} />)}</div>

                {englishPending && selectedVariant.language === 'en' && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Todavía no hay un arte inglés verificado para esta variante. El sitio conserva el arte en español hasta publicar uno.</p>}

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2"><div className="flex items-center justify-between"><h3 className="text-sm font-black">Imagen pública actual</h3><span className="text-[11px] text-stone-500">{current.status === 'shared' ? 'Compartida' : current.status === 'spanish-fallback' ? 'Fallback español' : 'Activa'}</span></div><div className="flex min-h-52 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 p-2"><PreviewImage src={current.src} alt={`Actual: ${slot.titleEs}`} className="max-h-64 max-w-full object-contain" /></div></div>
                    <div className="space-y-2"><div className="flex items-center justify-between"><h3 className="text-sm font-black">Nueva imagen / borrador</h3>{draft && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700"><Clock3 className="h-3.5 w-3.5" />Borrador guardado</span>}</div><div className="flex min-h-52 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-2"><PreviewImage src={effectivePreview} alt={`Vista previa: ${slot.titleEs}`} className="max-h-64 max-w-full object-contain" /></div><label className="block"><span className="sr-only">Seleccionar imagen</span><input type="file" disabled={loading} accept="image/png,image/jpeg,image/webp" onChange={(event) => void chooseFile(event.currentTarget.files?.[0])} className="block w-full cursor-pointer rounded-lg border border-stone-200 p-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:font-bold file:text-amber-900" /></label>{file && dimensions && <p className="text-xs text-stone-600">{file.name} · {formatBytes(file.size)} · {dimensions.width} × {dimensions.height}px</p>}{draft && <p className="text-xs text-stone-600">Borrador: {formatBytes(draft.size)} · {draft.width} × {draft.height}px</p>}</div>
                </div>

                <div className="rounded-2xl bg-[#fff9e8] p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black">Vista previa contextual</h3><div className="inline-flex rounded-full bg-white p-1"><button type="button" disabled={loading} aria-label="Vista de computadora" onClick={() => setPreviewDevice('desktop')} className={`rounded-full p-2 disabled:opacity-50 ${previewDevice === 'desktop' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}><Monitor className="h-4 w-4" /></button><button type="button" disabled={loading} aria-label="Vista de celular" onClick={() => setPreviewDevice('mobile')} className={`rounded-full p-2 disabled:opacity-50 ${previewDevice === 'mobile' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}><Smartphone className="h-4 w-4" /></button></div></div><ArtworkPreview src={effectivePreview} slotId={selected} device={previewDevice} title={slot.titleEs} /></div>

                <label className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm"><input type="checkbox" disabled={loading} checked={share} onChange={(event) => setShare(event.target.checked)} className="mt-1" /><span><strong>Compartir la variante del otro dispositivo.</strong><span className="mt-1 block text-xs text-stone-600">Usa la imagen de {counterpart.endsWith('Desktop') ? 'computadora' : 'celular'} para esta variante y conserva el historial. Para inglés, el estado traducido seguirá dependiendo del arte de origen; no se inventa una traducción gráfica.</span></span></label>

                {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded-xl p-3 text-sm ${message.kind === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{message.text}</p>}

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <button type="button" disabled={loading || !file} onClick={saveDraft} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 px-3 text-sm font-bold disabled:opacity-45"><Save className="h-4 w-4" />Guardar borrador</button>
                    <button type="button" disabled={loading || (!draft && !share)} onClick={publish} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 text-sm font-black text-stone-950 hover:bg-amber-300 disabled:opacity-45"><Send className="h-4 w-4" />Publicar imagen</button>
                    <button type="button" disabled={loading || (!file && !draft && !share)} onClick={cancel} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 px-3 text-sm font-bold disabled:opacity-45"><X className="h-4 w-4" />Cancelar cambios</button>
                    <div className="flex gap-2"><select aria-label="Versión anterior" value={restoreId} onChange={(event) => setRestoreId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-stone-300 px-2 text-xs" disabled={loading || history.length < 2}>{history.slice(1).map((version) => <option key={version.id} value={version.id}>{version.action === 'restore' ? 'Restauración' : 'Publicación'} · {version.id.slice(0, 10)}</option>)}</select><button type="button" disabled={loading || !restoreId} onClick={restore} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-stone-300 px-3 text-xs font-bold disabled:opacity-45"><RotateCcw className="h-4 w-4" />Restaurar</button></div>
                </div>
                {loading && <p role="status" className="text-xs text-stone-500">Procesando…</p>}
            </section>
        </div>
    </div>;
}
