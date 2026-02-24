
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
    aspect?: number;
}

export const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject('No 2d context');
                return;
            }

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        image.onerror = (error) => reject(error);
    });
};

export function ImageCropper({ image, onCropComplete, onCancel, aspect }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex flex-col bg-black">
            <div className="relative flex-1">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteCallback}
                    onZoomChange={onZoomChange}
                />
            </div>
            <div className="bg-[#0a0a0a] p-6 border-t border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-neon-red"
                    />
                </div>
                <div className="flex justify-between items-center">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10"
                    >
                        <X className="w-4 h-4" /> Annuler
                    </button>
                    <div className="flex-1 flex justify-center">
                        <h3 className="text-white font-display font-black uppercase italic tracking-tighter text-xl">Recadrage</h3>
                    </div>
                    <button
                        onClick={handleConfirm}
                        className="flex items-center gap-2 px-8 py-3 bg-neon-red text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-neon-red/80 transition-all shadow-lg shadow-neon-red/20"
                    >
                        <Check className="w-4 h-4" /> Valider
                    </button>
                </div>
            </div>
        </div>
    );
}
