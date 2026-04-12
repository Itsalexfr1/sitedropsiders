
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

export function ImageCropper({ image, onCropComplete, onCancel, aspect: initialAspect }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState<number | undefined>(initialAspect);
    const [cropShape, setCropShape] = useState<'rect' | 'round'>('rect');
    const [manualW, setManualW] = useState(1);
    const [manualH, setManualH] = useState(1);
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
        } catch (e: any) {
            console.error(e);
        }
    };

    const applyManualRatio = () => {
        if (manualW > 0 && manualH > 0) {
            setAspect(manualW / manualH);
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
                    cropShape={cropShape}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteCallback}
                    onZoomChange={onZoomChange}
                />
            </div>
            <div className="bg-[#0a0a0a] p-6 border-t border-white/10 flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-center gap-6">
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button 
                            onClick={() => setAspect(undefined)}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!aspect ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Libre
                        </button>
                        <button 
                            onClick={() => setAspect(1)}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${aspect === 1 ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Carré
                        </button>
                        <button 
                            onClick={() => setAspect(1/3)}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${aspect === 1/3 ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Colonne
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                         <span className="text-[9px] font-black text-gray-500 uppercase ml-2">Ratio Perso</span>
                         <input 
                            type="number" 
                            value={manualW} 
                            onChange={e => setManualW(Number(e.target.value))} 
                            className="w-10 bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-[10px] text-white font-black text-center outline-none focus:border-neon-red"
                         />
                         <span className="text-gray-600 font-black">:</span>
                         <input 
                            type="number" 
                            value={manualH} 
                            onChange={e => setManualH(Number(e.target.value))} 
                            className="w-10 bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-[10px] text-white font-black text-center outline-none focus:border-neon-red"
                         />
                         <button onClick={applyManualRatio} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"><Check className="w-3.5 h-3.5 text-white" /></button>
                    </div>

                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button onClick={() => setCropShape('rect')} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${cropShape === 'rect' ? 'bg-neon-red text-white' : 'text-gray-500'}`}>Carré/Rect</button>
                        <button onClick={() => setCropShape('round')} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${cropShape === 'round' ? 'bg-neon-red text-white' : 'text-gray-500'}`}>Rond</button>
                    </div>

                    <div className="flex items-center gap-4 flex-1 min-w-[150px] max-w-xs">
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
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10"
                    >
                        <X className="w-4 h-4" /> Annuler
                    </button>
                    <div className="hidden lg:block text-center flex-1">
                         <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ajustez l'image dans le cadre pour le scan</p>
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
