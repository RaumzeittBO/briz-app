import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle, ImageIcon } from 'lucide-react';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// ── Image Compression ────────────────────────────────────────────────────────
export const compressImage = (file: File, maxW = 1200, maxH = 1200, quality = 0.78): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxW) {
                            height = Math.round((height * maxW) / width);
                            width = maxW;
                        }
                    } else {
                        if (height > maxH) {
                            width = Math.round((width * maxH) / height);
                            height = maxH;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Error al comprimir imagen'));
                    }, 'image/jpeg', quality);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Error al cargar imagen'));
            img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error al leer archivo'));
        reader.readAsDataURL(file);
    });
};

// ── Upload with resumable task (no timeout hang) ─────────────────────────────
export const uploadCompressedImage = (file: File, folder: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            // Verify auth token is present before attempting upload
            const currentUser = auth.currentUser;
            if (!currentUser) {
                return reject(new Error('Debes estar autenticado para subir imágenes'));
            }

            const compressedBlob = await compressImage(file);
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
            const path = storageRef(storage, `${folder}/${fileName}`);

            // uploadBytesResumable never hangs — it fires events instead of blocking
            const task = uploadBytesResumable(path, compressedBlob, {
                contentType: 'image/jpeg',
            });

            task.on(
                'state_changed',
                null, // progress callback (not needed here — handled per-file in the UI)
                (error) => {
                    console.error('Upload error:', error.code, error.message);
                    reject(new Error(`Error de subida: ${error.code}`));
                },
                async () => {
                    try {
                        const url = await getDownloadURL(task.snapshot.ref);
                        resolve(url);
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        } catch (err) {
            reject(err);
        }
    });
};

// ── Per-file status ──────────────────────────────────────────────────────────
type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

interface FileEntry {
    name: string;
    status: FileStatus;
    error?: string;
    preview?: string;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface FileUploaderProps {
    onUpload?: (url: string) => void;
    onUploadMultiple?: (urls: string[]) => void;
    folder: string;
    className?: string;
    wrapperClassName?: string;
    multiple?: boolean;
}

export function FileUploader({
    onUpload,
    onUploadMultiple,
    folder,
    className = '',
    wrapperClassName = '',
    multiple = false,
}: FileUploaderProps) {
    const [entries, setEntries] = useState<FileEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isUploading = isRunning || entries.some(e => e.status === 'uploading' || e.status === 'pending');

    const patchEntry = (index: number, patch: Partial<FileEntry>) => {
        setEntries(prev => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
    };

    const buildPreview = (file: File): Promise<string> =>
        new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = ev => resolve((ev.target?.result as string) ?? '');
            reader.readAsDataURL(file);
        });

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Reset so same files can be picked again
        if (inputRef.current) inputRef.current.value = '';

        // Build previews first
        const initialEntries: FileEntry[] = await Promise.all(
            files.map(async f => ({
                name: f.name,
                status: 'pending' as FileStatus,
                preview: await buildPreview(f),
            }))
        );
        setEntries(initialEntries);
        setIsRunning(true);

        const successUrls: string[] = [];

        // Upload SEQUENTIALLY — one at a time to avoid bandwidth & connection limits
        for (let i = 0; i < files.length; i++) {
            patchEntry(i, { status: 'uploading' });
            try {
                const url = await uploadCompressedImage(files[i], folder);
                patchEntry(i, { status: 'done' });
                successUrls.push(url);
            } catch (err: any) {
                console.error(`Error subiendo ${files[i].name}:`, err);
                patchEntry(i, { status: 'error', error: err.message || 'Error desconocido' });
            }
        }

        setIsRunning(false);

        // Deliver results to parent
        if (successUrls.length > 0) {
            if (multiple && onUploadMultiple) {
                onUploadMultiple(successUrls);
            } else if (onUpload) {
                successUrls.forEach(url => onUpload(url));
            }
        }

        // Auto-clear after 3 s
        setTimeout(() => setEntries([]), 3000);
    };

    const defaultClass =
        'h-10 px-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 hover:border-brand-yellow/50 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer';
    const appliedClass = className || defaultClass;

    return (
        <div className={`relative shrink-0 ${wrapperClassName}`}>
            {/* Trigger button */}
            <label
                className={`${appliedClass} ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
            >
                {isUploading ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subiendo...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir{multiple ? ' fotos' : ''}</span>
                    </>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    onChange={handleChange}
                    className="hidden"
                />
            </label>

            {/* Per-file progress list — floats below without affecting flex parent */}
            {entries.length > 0 && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-2xl">
                    {entries.map((entry, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                        >
                            {/* Thumbnail */}
                            {entry.preview ? (
                                <img
                                    src={entry.preview}
                                    alt=""
                                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <ImageIcon className="w-4 h-4 text-white/20" />
                                </div>
                            )}

                            {/* File name */}
                            <span className="text-[10px] font-bold text-white/60 truncate flex-1 leading-none">
                                {entry.name}
                            </span>

                            {/* Status indicator */}
                            <div className="shrink-0 flex items-center gap-1">
                                {entry.status === 'pending' && (
                                    <span className="text-[9px] font-black text-white/30 uppercase">En espera</span>
                                )}
                                {entry.status === 'uploading' && (
                                    <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />
                                )}
                                {entry.status === 'done' && (
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                )}
                                {entry.status === 'error' && (
                                    <>
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        <span
                                            className="text-[9px] text-red-400 font-bold hidden sm:block truncate max-w-[100px]"
                                            title={entry.error}
                                        >
                                            {entry.error}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
