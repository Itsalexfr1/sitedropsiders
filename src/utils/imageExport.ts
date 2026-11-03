import { resolveImageUrl } from './image';

/**
 * Calibrated Festival PRO settings:
 * Contrast: 1.03, Saturation: 1.02, Brightness: 1.01
 * Preserves dark stage skies, avoid blown-out laser saturated highlights.
 */
export const FESTIVAL_PRO_FILTER = 'contrast(1.03) saturate(1.02) brightness(1.01)';

/**
 * Exports an image file with or without the Festival PRO filter applied onto the pixels via HTML5 Canvas.
 * Returns a high quality JPEG Blob ready for download or native file share.
 */
export async function exportPhotoWithFilter(
    imageUrl: string,
    applyFilter: boolean = true,
    suggestedFilename: string = 'dropsiders-photo.jpg'
): Promise<{ blob: Blob; filename: string }> {
    const resolvedUrl = resolveImageUrl(imageUrl);

    // If no filter requested, attempt to fetch source blob directly for maximum speed and fidelity
    if (!applyFilter) {
        try {
            const resp = await fetch(resolvedUrl);
            if (resp.ok) {
                const blob = await resp.blob();
                const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
                const finalFilename = suggestedFilename.replace(/\.[^.]+$/, `.${ext}`);
                return { blob, filename: finalFilename };
            }
        } catch {
            // Fall through to canvas method
        }
    }

    return new Promise(async (resolve, reject) => {
        try {
            // Fetch as blob first to safely avoid CORS canvas tainting
            let objectUrl: string | null = null;
            try {
                const resp = await fetch(resolvedUrl);
                if (resp.ok) {
                    const fetchedBlob = await resp.blob();
                    objectUrl = URL.createObjectURL(fetchedBlob);
                }
            } catch {
                // If fetch fails (CORS), will attempt direct img.crossOrigin
            }

            const img = new Image();
            if (!objectUrl) {
                img.crossOrigin = 'anonymous';
            }

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width || 1920;
                    canvas.height = img.naturalHeight || img.height || 1080;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        if (objectUrl) URL.revokeObjectURL(objectUrl);
                        reject(new Error('Canvas 2D context unavailable'));
                        return;
                    }

                    if (applyFilter) {
                        ctx.filter = FESTIVAL_PRO_FILTER;
                    } else {
                        ctx.filter = 'none';
                    }

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    if (objectUrl) URL.revokeObjectURL(objectUrl);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve({ blob, filename: suggestedFilename });
                            } else {
                                reject(new Error('Canvas toBlob conversion failed'));
                            }
                        },
                        'image/jpeg',
                        0.95
                    );
                } catch (canvasErr) {
                    if (objectUrl) URL.revokeObjectURL(objectUrl);
                    reject(canvasErr);
                }
            };

            img.onerror = (e) => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image for export: ' + (e as any)?.message || 'Image load error'));
            };

            img.src = objectUrl || resolvedUrl;
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Triggers a direct browser download of a Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}
