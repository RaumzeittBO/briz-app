import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useStore } from '@/context/StoreContext';
import type { Customer } from '@/context/StoreContext';
import { getAdminCustomerFiles, type AdminCustomerFiles } from '@/lib/backend';
import { Download, Search, Edit, User, UserPlus, Eye, FileText, RefreshCw, X } from 'lucide-react';

export default function CustomersPage() {
    const { customers, updateCustomer, addOrUpdateCustomer, deleteCustomer, sales, rentals } = useStore();
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [current, setCurrent] = useState<Partial<Customer>>({});
    const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
    const [customerFilesResult, setCustomerFilesResult] = useState<{
        customerId: string;
        files?: AdminCustomerFiles['files'];
        error?: string;
    } | null>(null);
    const [filesReload, setFilesReload] = useState(0);
    const [fileContentError, setFileContentError] = useState(false);
    const [fileDownloadError, setFileDownloadError] = useState('');
    const [fileDownloading, setFileDownloading] = useState(false);
    const isPdfDocument = (url?: string) => Boolean(url && (url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf')));
    const [viewingDocument, setViewingDocument] = useState<{ url: string; title: string; fileName: string } | null>(null);
    const openDocument = (url?: string, title = 'Documento del cliente', fileName = 'documento-cliente') => {
        if (!url) return;
        setFileContentError(false);
        setFileDownloadError('');
        setViewingDocument({ url, title, fileName });
    };
    const downloadPrivateDocument = async () => {
        if (!viewingDocument || fileDownloading) return;
        setFileDownloading(true);
        setFileDownloadError('');
        try {
            // Fetch only the already-authorized private URL and download its bytes as a file.
            // This keeps cross-origin signed URLs and data URLs on the normal browser download path.
            const response = await fetch(viewingDocument.url);
            if (!response.ok) throw new Error('No se pudo recuperar el archivo autorizado.');
            const blob = await response.blob();
            const extensionByType: Record<string, string> = {
                'application/pdf': 'pdf',
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const extension = extensionByType[blob.type.toLowerCase()] || 'bin';
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = objectUrl;
            anchor.download = `${viewingDocument.fileName}.${extension}`;
            anchor.hidden = true;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        } catch {
            setFileDownloadError('No se pudo descargar este archivo. Vuelve a cargarlo desde la ficha del cliente e inténtalo nuevamente.');
        } finally {
            setFileDownloading(false);
        }
    };
    const currentCustomerFiles = customerFilesResult && detailsCustomer && customerFilesResult.customerId === detailsCustomer.id ? customerFilesResult.files || null : null;
    const customerFilesLoading = Boolean(detailsCustomer && customerFilesResult?.customerId !== detailsCustomer.id);
    const customerFilesError = customerFilesResult && detailsCustomer && customerFilesResult.customerId === detailsCustomer.id ? customerFilesResult.error || '' : '';
    const selfieUrl = currentCustomerFiles?.autofoto.url || undefined;
    const documentFrontUrl = currentCustomerFiles?.documento.url || undefined;
    const documentBackUrl = currentCustomerFiles?.documentoReverso.url || undefined;
    const detailsCustomerId = detailsCustomer?.id;

    useEffect(() => {
        if (!detailsCustomerId) return;
        let cancelled = false;
        getAdminCustomerFiles(detailsCustomerId)
            .then((result) => { if (!cancelled) setCustomerFilesResult({ customerId: detailsCustomerId, files: result.files }); })
            .catch(() => { if (!cancelled) setCustomerFilesResult({ customerId: detailsCustomerId, error: 'No se pudieron cargar de forma segura los archivos de este cliente.' }); });
        return () => { cancelled = true; };
    }, [detailsCustomerId, filesReload]);

    const retryCustomerFiles = () => {
        setFileContentError(false);
        setCustomerFilesResult(null);
        setFilesReload(value => value + 1);
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.ci.includes(search)
    );

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar a ${name} permanentemente?`)) {
            deleteCustomer(id);
        }
    };

    const openModal = (mode: 'add' | 'edit', cust?: Customer) => {
        setModalMode(mode);
        if (mode === 'edit' && cust) {
            setCurrent(cust);
        } else {
            setCurrent({ name: '', phone: '', ci: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'add') {
            addOrUpdateCustomer({ name: current.name || '', phone: current.phone || '', ci: current.ci || '' }, false);
        } else if (current.id) {
            updateCustomer(current.id, current);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <User className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Clientes
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Directorio centralizado de perfiles y actividad.</p>
                </div>
                <Button 
                    onClick={() => openModal('add')} 
                    className="bg-white text-brand-black hover:bg-brand-yellow font-bold h-12 px-8 rounded-full shadow-lg transition-all hover:scale-105 shrink-0"
                >
                    <UserPlus className="w-5 h-5 mr-2" strokeWidth={3} /> Nuevo Cliente
                </Button>
            </div>

            <div className="relative max-w-2xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <Input 
                    placeholder="Busca por nombre, CI o teléfono..." 
                    className="pl-14 h-14 rounded-full bg-[#1A1A1A] border-white/5 text-white placeholder:text-white/20 text-lg shadow-inner focus-visible:ring-brand-yellow/30"
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(c => {
                    const custRentals = rentals.filter(r => r.customerPhone === c.phone || r.customerCI === c.ci);
                    const custSales = sales.filter(s => s.customerPhone === c.phone || s.customerCI === c.ci);

                    const lastR = custRentals.length ? Math.max(...custRentals.map(r => new Date(r.createdAt || r.createdDate || '').getTime())) : 0;
                    const lastS = custSales.length ? Math.max(...custSales.map(s => new Date(s.date).getTime())) : 0;
                    const lastInteraction = Math.max(lastR, lastS);

                    return (
                        <Card key={c.id} className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] hover:border-white/10 transition-all duration-300 shadow-xl flex flex-col group overflow-hidden">
                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="p-6 flex flex-col items-center text-center relative border-b border-white/5 bg-white/[0.01] flex-1">
                                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-brand-yellow/30 group-hover:scale-105 transition-transform flex items-center justify-center bg-brand-yellow/10">
                                        <span className="text-brand-yellow text-2xl font-black">{c.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <h3 className="text-white font-black text-xl mb-1 truncate w-full">{c.name}</h3>
                                    
                                    <div className="space-y-1.5 w-full text-xs font-medium text-white/60">
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60" /> {c.phone}
                                        </p>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> CI: {c.ci}
                                        </p>
                                        {c.email && (
                                            <p className="truncate text-white/50 text-[11px] font-mono">{c.email}</p>
                                        )}
                                        {c.nacionalidad && (
                                            <p className="text-[10px] text-white/40 uppercase font-bold">
                                                🌍 {c.nacionalidad} {c.departamento ? `(${c.departamento})` : ''}
                                            </p>
                                        )}
                                        {c.comoNosConociste && (
                                            <p className="text-[10px] text-brand-yellow/60 font-semibold uppercase">
                                                📢 {c.comoNosConociste}
                                            </p>
                                        )}
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/5" onClick={() => openModal('edit', c)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-2 gap-3 bg-black/20">
                                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Rentas</p>
                                        <p className="font-black text-2xl text-white">{custRentals.length}</p>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Tienda</p>
                                        <p className="font-black text-2xl text-white">{custSales.length}</p>
                                    </div>
                                </div>

                                <div className="px-6 py-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-t border-white/5 bg-white/[0.01]">
                                    <span className="text-white/20">Visto</span>
                                    <span className="text-brand-yellow/60">
                                        {lastInteraction > 0 ? new Date(lastInteraction).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => { setFileContentError(false); setCustomerFilesResult(null); setDetailsCustomer(c); }}
                                    className="w-full py-4 text-brand-yellow hover:text-brand-black hover:bg-brand-yellow text-[10px] font-black uppercase tracking-[0.2em] transition-all border-t border-white/5 flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> Ver detalles
                                </button>

                                <button
                                    onClick={() => handleDelete(c.id, c.name)} 
                                    className="w-full py-4 text-white/20 hover:text-red-400 hover:bg-red-500/5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-t border-white/5"
                                >
                                    Eliminar Perfil
                                </button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 px-4 bg-brand-charcoal/30 rounded-2xl border border-white/5">
                    <User className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron clientes</h3>
                    <p className="text-white/50">Prueba con otro término de búsqueda o agrega uno nuevo.</p>
                </div>
            )}

            <Dialog open={Boolean(detailsCustomer)} onOpenChange={(open) => { if (!open) { setViewingDocument(null); setDetailsCustomer(null); } }}>
                <DialogContent className="w-[96vw] sm:max-w-[94vw] xl:max-w-[1500px] max-h-[94vh] overflow-hidden border border-brand-yellow/25 bg-[#FFF9E8] p-0 text-brand-charcoal shadow-2xl">
                    {detailsCustomer && (
                        <>
                            <DialogHeader className="border-b border-brand-yellow/20 bg-white/75 p-5 sm:p-7">
                                <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-brand-charcoal sm:text-3xl">
                                    <div className="p-2 bg-brand-yellow/10 rounded-xl">
                                        <Eye className="w-6 h-6 text-brand-yellow" strokeWidth={2.5} />
                                    </div>
                                    Detalles del cliente
                                </DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[80vh] space-y-6 overflow-y-auto p-4 sm:p-7">
                                {customerFilesLoading && <p className="rounded-xl bg-white p-3 text-sm font-bold text-brand-charcoal/70">Cargando archivos privados de forma segura…</p>}
                                {customerFilesError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700"><span>{customerFilesError}</span><Button type="button" variant="outline" onClick={retryCustomerFiles} className="h-9 border-red-300 text-red-800"><RefreshCw className="mr-2 h-4 w-4" />Reintentar</Button></div>}
                                {fileContentError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900"><span>No se pudo mostrar un archivo. Puede haber vencido el enlace temporal o fallado la carga del formato.</span><Button type="button" variant="outline" onClick={retryCustomerFiles} className="h-9 border-amber-400 text-amber-900"><RefreshCw className="mr-2 h-4 w-4" />Generar enlaces nuevos</Button></div>}
                                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(520px,0.9fr)_minmax(560px,1.1fr)]">
                                    <div className="space-y-5">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/45">Nombre completo</p>
                                            <h2 className="mt-1 text-3xl font-black text-brand-charcoal sm:text-4xl">{detailsCustomer.name}</h2>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {[
                                                ['WhatsApp', detailsCustomer.phone],
                                                ['CI / Documento', detailsCustomer.ci],
                                                ['Correo', detailsCustomer.email || 'No registrado'],
                                                ['Nacionalidad', detailsCustomer.nacionalidad || 'No registrada'],
                                                ['Departamento', detailsCustomer.departamento || 'No registrado'],
                                                ['Como nos conoció', detailsCustomer.comoNosConociste || 'No registrado'],
                                                ['Rentas', String(rentals.filter(r => r.customerPhone === detailsCustomer.phone || r.customerCI === detailsCustomer.ci).length)],
                                                ['Compras', String(sales.filter(s => s.customerPhone === detailsCustomer.phone || s.customerCI === detailsCustomer.ci).length)],
                                            ].map(([label, value]) => (
                                                <div key={label} className="min-w-0 rounded-2xl border border-brand-yellow/15 bg-white p-4 shadow-sm">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/45">{label}</p>
                                                    <p className="mt-1 break-words text-sm font-black leading-relaxed text-brand-charcoal sm:text-base">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {detailsCustomer.notes && (
                                            <div className="rounded-2xl border border-brand-yellow/15 bg-white p-4 shadow-sm">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/45">Notas</p>
                                                <p className="mt-1 text-base font-bold text-brand-charcoal/80">{detailsCustomer.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-5">
                                        <div className="grid gap-5 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
                                        <div className="rounded-3xl border border-brand-yellow/15 bg-white p-4 shadow-sm">
                                            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/45">Foto del cliente</p>
                                            <div className="aspect-square rounded-2xl overflow-hidden bg-brand-yellow/5 border border-brand-yellow/15 flex items-center justify-center">
                                                {selfieUrl ? (
                                                    <button type="button" onClick={() => openDocument(selfieUrl, `Foto de ${detailsCustomer.name}`, 'foto-cliente')} className="w-full h-full cursor-zoom-in">
                                                        <img src={selfieUrl} onError={() => setFileContentError(true)} className="w-full h-full object-cover" alt={`Foto de ${detailsCustomer.name}`} />
                                                    </button>
                                                ) : (
                                                    <User className="w-16 h-16 text-brand-charcoal/20" />
                                                )}
                                            </div>
                                            {!customerFilesLoading && !customerFilesError && !selfieUrl && (
                                                <p className={`mt-2 text-xs font-medium ${currentCustomerFiles?.autofoto.state === 'technical_error' ? 'text-red-500 font-bold' : 'text-brand-charcoal/55'}`}>
                                                    {currentCustomerFiles?.autofoto.state === 'technical_error'
                                                        ? `Error técnico: ${currentCustomerFiles.autofoto.error || 'Sin acceso a Storage.'}`
                                                        : currentCustomerFiles?.autofoto.state === 'needs_review'
                                                            ? 'No hay una referencia segura para localizar la fotografía; requiere revisión manual.'
                                                            : 'La referencia de la fotografía apunta a un archivo que no existe.'}
                                                </p>
                                            )}
                                            {selfieUrl && currentCustomerFiles?.autofoto.fallbackReason === 'iam_signing_unsupported' && (
                                                <p className="mt-1 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                                                    Streaming backend activo (sin rol IAM Token Creator)
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-3xl border border-brand-yellow/15 bg-white p-4 shadow-sm">
                                            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/45">Documento subido</p>
                                                {documentFrontUrl && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button type="button" onClick={() => openDocument(documentFrontUrl, `Anverso · ${detailsCustomer.name}`, `documento-anverso-${detailsCustomer.id}`)} className="h-9 rounded-full bg-brand-yellow px-4 text-xs font-black text-brand-black hover:bg-white cursor-pointer">
                                                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver anverso
                                                        </Button>
                                                        {documentBackUrl && (
                                                            <Button type="button" onClick={() => openDocument(documentBackUrl, `Reverso · ${detailsCustomer.name}`, `documento-reverso-${detailsCustomer.id}`)} className="h-9 rounded-full bg-brand-yellow px-4 text-xs font-black text-brand-black hover:bg-white cursor-pointer">
                                                                <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver reverso
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {!customerFilesLoading && !customerFilesError && currentCustomerFiles && !documentFrontUrl && (
                                                <p className={`text-xs ${currentCustomerFiles.documento.state === 'technical_error' ? 'text-red-500 font-bold' : 'text-brand-charcoal/55'}`}>
                                                    {currentCustomerFiles.documento.state === 'technical_error'
                                                        ? `Error técnico anverso: ${currentCustomerFiles.documento.error || 'Sin acceso a Storage.'}`
                                                        : currentCustomerFiles.documento.state === 'needs_review'
                                                            ? 'No hay una referencia segura para localizar el anverso; requiere revisión manual.'
                                                            : 'La referencia del anverso apunta a un archivo que no existe.'}
                                                </p>
                                            )}
                                            {!customerFilesLoading && !customerFilesError && currentCustomerFiles && !documentBackUrl && (
                                                <p className={`text-xs mt-1 ${currentCustomerFiles.documentoReverso.state === 'technical_error' ? 'text-red-500 font-bold' : 'text-brand-charcoal/55'}`}>
                                                    {currentCustomerFiles.documentoReverso.state === 'technical_error'
                                                        ? `Error técnico reverso: ${currentCustomerFiles.documentoReverso.error || 'Sin acceso a Storage.'}`
                                                        : currentCustomerFiles.documentoReverso.state === 'needs_review'
                                                            ? 'No hay una referencia segura para localizar el reverso; requiere revisión manual.'
                                                            : 'La referencia del reverso apunta a un archivo que no existe.'}
                                                </p>
                                            )}
                                            
                                            <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
                                                {!customerFilesLoading && !customerFilesError && !documentFrontUrl && !documentBackUrl && (
                                                    <p className="rounded-xl bg-brand-yellow/10 p-3 text-sm font-medium text-brand-charcoal/65">
                                                        {currentCustomerFiles?.documento.state === 'technical_error' || currentCustomerFiles?.documentoReverso.state === 'technical_error'
                                                            ? 'Se presentó un problema técnico de permisos al acceder a Storage. Revisa los permisos IAM de Cloud Functions.'
                                                            : currentCustomerFiles?.documento.state === 'needs_review' || currentCustomerFiles?.documentoReverso.state === 'needs_review'
                                                                ? 'La referencia de uno o más documentos antiguos requiere revisión; no se confirmó que hayan sido eliminados.'
                                                                : 'Las referencias de los documentos apuntan a archivos que no existen.'}
                                                    </p>
                                                )}
                                                {/* Anverso / Front Side */}
                                                <div>
                                                    {documentFrontUrl && (documentBackUrl || isPdfDocument(documentFrontUrl)) && (
                                                        <p className="text-[9px] font-black uppercase tracking-wider text-brand-charcoal/40 mb-1.5">Parte Frontal (Anverso) / Archivo Principal</p>
                                                    )}
                                                    <div className="min-h-[300px] rounded-2xl overflow-hidden bg-brand-yellow/5 border border-brand-yellow/15 flex items-center justify-center">
                                                        {documentFrontUrl ? (
                                                            isPdfDocument(documentFrontUrl) ? (
                                                                <object data={documentFrontUrl} type="application/pdf" onError={() => setFileContentError(true)} className="h-[550px] w-full bg-white">
                                                                    <iframe
                                                                        src={documentFrontUrl}
                                                                        title={`Documento de ${detailsCustomer.name}`}
                                                                        className="h-[550px] w-full bg-white"
                                                                    />
                                                                </object>
                                                            ) : (
                                                                <button type="button" onClick={() => openDocument(documentFrontUrl, `Anverso · ${detailsCustomer.name}`, `documento-anverso-${detailsCustomer.id}`)} className="h-full w-full cursor-zoom-in flex items-center justify-center p-2 bg-white">
                                                                    <img src={documentFrontUrl} onError={() => setFileContentError(true)} className="max-h-[500px] max-w-full object-contain" alt={`Anverso de ${detailsCustomer.name}`} />
                                                                </button>
                                                            )
                                                        ) : (
                                                            <FileText className="w-16 h-16 text-brand-charcoal/20" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reverso / Back Side */}
                                                {documentBackUrl && (
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-wider text-brand-charcoal/40 mt-3 mb-1.5">Parte Posterior (Reverso)</p>
                                                        <div className="min-h-[300px] rounded-2xl overflow-hidden bg-brand-yellow/5 border border-brand-yellow/15 flex items-center justify-center">
                                                            {isPdfDocument(documentBackUrl) ? (
                                                                <object data={documentBackUrl} type="application/pdf" onError={() => setFileContentError(true)} className="h-[550px] w-full bg-white">
                                                                    <iframe
                                                                        src={documentBackUrl}
                                                                        title={`Reverso de ${detailsCustomer.name}`}
                                                                        className="h-[550px] w-full bg-white"
                                                                    />
                                                                </object>
                                                            ) : (
                                                                <button type="button" onClick={() => openDocument(documentBackUrl, `Reverso · ${detailsCustomer.name}`, `documento-reverso-${detailsCustomer.id}`)} className="h-full w-full cursor-zoom-in flex items-center justify-center p-2 bg-white">
                                                                    <img src={documentBackUrl} onError={() => setFileContentError(true)} className="max-h-[500px] max-w-full object-contain" alt={`Reverso de ${detailsCustomer.name}`} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(viewingDocument)} onOpenChange={(open) => { if (!open) setViewingDocument(null); }}>
                {viewingDocument && (
                    <DialogContent showCloseButton={false} aria-describedby={undefined} className="z-[60] flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-brand-yellow/30 bg-brand-charcoal p-0 text-white shadow-2xl">
                        <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
                            <DialogTitle className="min-w-0 truncate font-black text-white">{viewingDocument.title}</DialogTitle>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button type="button" disabled={fileDownloading} onClick={downloadPrivateDocument} className="h-10 rounded-full bg-brand-yellow px-4 text-xs font-black text-brand-black hover:bg-white" aria-label="Descargar archivo privado">
                                    <Download className="h-4 w-4" /> {fileDownloading ? 'Preparando…' : 'Descargar'}
                                </Button>
                                <Button type="button" variant="ghost" size="icon" aria-label="Cerrar documento" onClick={() => setViewingDocument(null)} className="text-white hover:bg-white/10"><X className="h-5 w-5" /></Button>
                            </div>
                        </DialogHeader>
                        <div className="min-h-0 flex-1 overflow-auto bg-white p-2 sm:p-4">
                            {fileDownloadError && <p role="alert" className="mb-2 rounded-lg bg-red-50 p-3 text-center text-sm font-bold text-red-800">{fileDownloadError}</p>}
                            {fileContentError ? (
                                <p role="alert" className="p-6 text-center text-sm font-bold text-red-700">No se pudo mostrar el archivo. Puedes volver a intentar la carga desde la ficha del cliente.</p>
                            ) : isPdfDocument(viewingDocument.url) ? (
                                <iframe src={viewingDocument.url} title={viewingDocument.title} className="h-[78vh] min-h-[360px] w-full bg-white" onError={() => setFileContentError(true)} />
                            ) : (
                                <img src={viewingDocument.url} alt={viewingDocument.title} onError={() => setFileContentError(true)} className="mx-auto max-h-[78vh] max-w-full object-contain" />
                            )}
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* Modal de Cliente */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-brand-charcoal border-white/10 text-white p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-[#1A1A1A]">
                        <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-brand-yellow/10 rounded-xl">
                                {modalMode === 'add' ? <UserPlus className="w-6 h-6 text-brand-yellow" strokeWidth={2.5} /> : <Edit className="w-6 h-6 text-brand-yellow" strokeWidth={2.5} />}
                            </div>
                            {modalMode === 'add' ? 'Nuevo Cliente' : 'Editar Perfil'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Nombre Completo</Label>
                            <Input required value={current.name || ''} onChange={e => setCurrent({ ...current, name: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. Juan Pérez" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">WhatsApp</Label>
                                <Input required value={current.phone || ''} onChange={e => setCurrent({ ...current, phone: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="77889900" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">CI / Carnet</Label>
                                <Input required value={current.ci || ''} onChange={e => setCurrent({ ...current, ci: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="1234567" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Correo Electrónico</Label>
                            <Input type="email" value={current.email || ''} onChange={e => setCurrent({ ...current, email: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="juan@gmail.com" />
                        </div>
                        <DialogFooter className="pt-6 border-t border-white/5 flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-12 px-6 rounded-xl hover:bg-white/5 font-bold">Cancelar</Button>
                            <Button type="submit" className="h-12 px-8 bg-brand-yellow text-brand-black hover:bg-white font-black rounded-full shadow-lg transition-all flex-1">
                                {modalMode === 'add' ? 'Crear Perfil' : 'Actualizar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
