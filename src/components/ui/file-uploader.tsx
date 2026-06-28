import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export const compressImage = (file: File, maxW = 1200, maxH = 1200, quality = 0.75): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
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
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas compression returned null blob'));
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export const uploadCompressedImage = async (file: File, folder: string): Promise<string> => {
    try {
        const compressedBlob = await compressImage(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        const pathRef = storageRef(storage, `${folder}/${fileName}`);
        
        const result = await uploadBytes(pathRef, compressedBlob);
        const downloadUrl = await getDownloadURL(result.ref);
        return downloadUrl;
    } catch (error) {
        console.error("Error in uploadCompressedImage:", error);
        throw error;
    }
};

interface FileUploaderProps {
    onUpload: (url: string) => void;
    folder: string;
    className?: string;
}

export function FileUploader({ onUpload, folder, className = '' }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadCompressedImage(file, folder);
            onUpload(url);
        } catch (err: any) {
            alert('Error al subir imagen: ' + (err.message || err));
        } finally {
            setUploading(false);
        }
    };

    const defaultClass = "h-10 px-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 hover:border-brand-yellow/50 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer";
    const appliedClass = className || defaultClass;

    return (
        <label className={`${appliedClass} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Subiendo...</span>
                </>
            ) : (
                <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir</span>
                </>
            )}
            <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
        </label>
    );
}
